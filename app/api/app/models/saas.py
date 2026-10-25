"""REPSI SaaS billing: what gym owners pay REPSI. Unrelated to gym-member MembershipPlan/Membership.

Money is always integer minor units (paise, cents) with an ISO-4217 currency beside it; never floats.
These tables replace the float-based `subscription_plans`/`gym_subscriptions` billing tables, which stay
untouched until the legacy cleanup (Stage 6b). Lifecycle rules: docs/payments/stage-1-plan.md §4.
"""
from sqlalchemy import (
    JSON, BigInteger, Boolean, CheckConstraint, Column, DateTime, ForeignKey, Index, Integer, String, Text,
    UniqueConstraint,
)

from app.core.database import Base
from app.models.base import TimestampMixin, generate_uuid

SUBSCRIPTION_STATES = ("trialing", "active", "grace", "read_only", "suspended")
ORDER_STATES = ("created", "pending", "paid", "failed", "cancelled", "expired")
ATTEMPT_STATES = ("initiated", "pending", "success", "failed", "abandoned")
BILLING_CYCLES = ("monthly", "quarterly", "half_yearly", "annual")
CURRENCIES = ("INR", "USD", "EUR", "GBP", "AED")
WEBHOOK_STATES = ("queued", "processing", "processed", "failed", "ignored")


def _in(column: str, values: tuple[str, ...]) -> str:
    return f"{column} IN (" + ", ".join(f"'{v}'" for v in values) + ")"


class SaasPlan(Base, TimestampMixin):
    __tablename__ = "saas_plan"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    code = Column(String(50), unique=True, nullable=False)  # stable sync key: basic, growth, pro, ...
    name = Column(String(100), nullable=False)
    rank = Column(Integer, nullable=False, default=0)  # higher = larger plan; drives upgrade vs downgrade
    is_public = Column(Boolean, nullable=False, default=True)
    is_active = Column(Boolean, nullable=False, default=True)


class SaasPlanPrice(Base, TimestampMixin):
    __tablename__ = "saas_plan_price"
    __table_args__ = (
        UniqueConstraint("plan_id", "billing_cycle", "currency", name="uq_saas_plan_price"),
        CheckConstraint("amount_minor >= 0", name="ck_saas_plan_price_amount"),
        CheckConstraint("period_months > 0", name="ck_saas_plan_price_period"),
        CheckConstraint(_in("billing_cycle", BILLING_CYCLES), name="ck_saas_plan_price_cycle"),
        CheckConstraint(_in("currency", CURRENCIES), name="ck_saas_plan_price_currency"),
    )

    id = Column(String(36), primary_key=True, default=generate_uuid)
    plan_id = Column(String(36), ForeignKey("saas_plan.id", ondelete="RESTRICT"), nullable=False, index=True)
    billing_cycle = Column(String(20), nullable=False)
    period_months = Column(Integer, nullable=False)
    currency = Column(String(3), nullable=False)
    amount_minor = Column(BigInteger, nullable=False)
    # Only INR is enabled at launch; other currencies wait for provider/tax approval.
    is_enabled = Column(Boolean, nullable=False, default=False)


class SaasEntitlement(Base, TimestampMixin):
    __tablename__ = "saas_entitlement"
    __table_args__ = (
        UniqueConstraint("plan_id", "key", name="uq_saas_entitlement"),
        CheckConstraint("kind IN ('feature', 'limit')", name="ck_saas_entitlement_kind"),
    )

    id = Column(String(36), primary_key=True, default=generate_uuid)
    plan_id = Column(String(36), ForeignKey("saas_plan.id", ondelete="CASCADE"), nullable=False, index=True)
    key = Column(String(80), nullable=False)  # e.g. members, trainers, branches, ai_assistant
    kind = Column(String(10), nullable=False)
    bool_value = Column(Boolean, nullable=True)  # features
    int_value = Column(Integer, nullable=True)  # limits; -1 = unlimited


class SaasSubscription(Base, TimestampMixin):
    """One per workspace. Cancellation and scheduled downgrades are fields, never states."""

    __tablename__ = "saas_subscription"
    __table_args__ = (
        CheckConstraint(_in("status", SUBSCRIPTION_STATES), name="ck_saas_subscription_status"),
        CheckConstraint("billing_cycle IS NULL OR " + _in("billing_cycle", BILLING_CYCLES), name="ck_saas_subscription_cycle"),
        CheckConstraint(
            "(price_override_minor IS NULL AND price_override_currency IS NULL)"
            " OR (price_override_minor >= 0 AND price_override_currency IS NOT NULL)",
            name="ck_saas_subscription_override",
        ),
        Index("ix_saas_subscription_status_paid_until", "status", "paid_until"),
    )

    id = Column(String(36), primary_key=True, default=generate_uuid)
    workspace_id = Column(String(64), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, unique=True)
    plan_id = Column(String(36), ForeignKey("saas_plan.id", ondelete="RESTRICT"), nullable=False)
    status = Column(String(20), nullable=False, default="trialing")
    billing_cycle = Column(String(20), nullable=True)  # null while trialing
    currency = Column(String(3), nullable=False, default="INR")

    trial_started_at = Column(DateTime(timezone=True), nullable=True)
    trial_ends_at = Column(DateTime(timezone=True), nullable=True)
    paid_until = Column(DateTime(timezone=True), nullable=True)
    grace_ends_at = Column(DateTime(timezone=True), nullable=True)
    read_only_since = Column(DateTime(timezone=True), nullable=True)

    cancel_at_period_end = Column(Boolean, nullable=False, default=False)
    cancel_requested_at = Column(DateTime(timezone=True), nullable=True)
    pending_plan_id = Column(String(36), ForeignKey("saas_plan.id", ondelete="RESTRICT"), nullable=True)
    pending_billing_cycle = Column(String(20), nullable=True)

    # Founder price lock: renewals of the same plan/cycle charge this instead of the catalogue price.
    price_override_minor = Column(BigInteger, nullable=True)
    price_override_currency = Column(String(3), nullable=True)

    is_grandfathered = Column(Boolean, nullable=False, default=False)
    is_complimentary = Column(Boolean, nullable=False, default=False)
    # Owner who used this workspace's trial; repeat-trial checks match on their email/phone.
    trial_owner_user_id = Column(String(64), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    legacy_subscription_id = Column(String(36), nullable=True)  # gym_subscriptions.id it was backfilled from
    version = Column(Integer, nullable=False, default=1)  # optimistic lock for state transitions


class SaasOrder(Base, TimestampMixin):
    __tablename__ = "saas_order"
    __table_args__ = (
        UniqueConstraint("workspace_id", "idempotency_key", name="uq_saas_order_idempotency"),
        UniqueConstraint("provider", "provider_order_id", name="uq_saas_order_provider_ref"),
        CheckConstraint(_in("status", ORDER_STATES), name="ck_saas_order_status"),
        CheckConstraint("kind IN ('new', 'renewal', 'upgrade')", name="ck_saas_order_kind"),
        CheckConstraint("amount_minor > 0", name="ck_saas_order_amount"),
        CheckConstraint("tax_minor IS NULL OR tax_minor >= 0", name="ck_saas_order_tax"),
        CheckConstraint(_in("billing_cycle", BILLING_CYCLES), name="ck_saas_order_cycle"),
        CheckConstraint(_in("currency", CURRENCIES), name="ck_saas_order_currency"),
        Index("ix_saas_order_status_expires", "status", "expires_at"),
    )

    id = Column(String(36), primary_key=True, default=generate_uuid)
    workspace_id = Column(String(64), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    subscription_id = Column(String(36), ForeignKey("saas_subscription.id", ondelete="RESTRICT"), nullable=False, index=True)
    order_ref = Column(String(50), unique=True, nullable=False)  # our id, sent to the provider as order_id
    kind = Column(String(10), nullable=False)
    plan_id = Column(String(36), ForeignKey("saas_plan.id", ondelete="RESTRICT"), nullable=False)
    billing_cycle = Column(String(20), nullable=False)
    period_months = Column(Integer, nullable=False)
    currency = Column(String(3), nullable=False)
    amount_minor = Column(BigInteger, nullable=False)  # total charged, tax included
    tax_minor = Column(BigInteger, nullable=True)  # null until tax is enabled
    status = Column(String(20), nullable=False, default="created")
    needs_review = Column(Boolean, nullable=False, default=False)  # e.g. verified payment after expiry
    idempotency_key = Column(String(100), nullable=False)
    provider = Column(String(20), nullable=False, default="cashfree")
    provider_order_id = Column(String(100), nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    paid_at = Column(DateTime(timezone=True), nullable=True)
    created_by_user_id = Column(String(64), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)


class SaasPaymentAttempt(Base, TimestampMixin):
    __tablename__ = "saas_payment_attempt"
    __table_args__ = (
        UniqueConstraint("provider", "provider_payment_id", name="uq_saas_attempt_provider_ref"),
        CheckConstraint(_in("status", ATTEMPT_STATES), name="ck_saas_attempt_status"),
        CheckConstraint("amount_minor >= 0", name="ck_saas_attempt_amount"),
    )

    id = Column(String(36), primary_key=True, default=generate_uuid)
    order_id = Column(String(36), ForeignKey("saas_order.id", ondelete="RESTRICT"), nullable=False, index=True)
    workspace_id = Column(String(64), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    provider = Column(String(20), nullable=False, default="cashfree")
    provider_payment_id = Column(String(100), nullable=True)
    status = Column(String(20), nullable=False, default="initiated")
    amount_minor = Column(BigInteger, nullable=False)
    currency = Column(String(3), nullable=False)
    method = Column(String(50), nullable=True)
    raw_status = Column(String(50), nullable=True)  # provider's own status string
    failure_reason = Column(Text, nullable=True)


class SaasWebhookEvent(Base, TimestampMixin):
    """Verified provider events; doubles as the durable queue the worker drains."""

    __tablename__ = "saas_webhook_event"
    __table_args__ = (
        UniqueConstraint("provider", "event_id", name="uq_saas_webhook_event"),
        CheckConstraint(_in("status", WEBHOOK_STATES), name="ck_saas_webhook_status"),
        Index("ix_saas_webhook_status_next", "status", "next_attempt_at"),
    )

    id = Column(String(36), primary_key=True, default=generate_uuid)
    provider = Column(String(20), nullable=False, default="cashfree")
    event_id = Column(String(150), nullable=False)
    event_type = Column(String(100), nullable=False)
    raw_body = Column(Text, nullable=False)  # exactly as received; signatures are over these bytes
    status = Column(String(20), nullable=False, default="queued")
    attempts = Column(Integer, nullable=False, default=0)
    next_attempt_at = Column(DateTime(timezone=True), nullable=True)
    processed_at = Column(DateTime(timezone=True), nullable=True)
    last_error = Column(Text, nullable=True)
    order_ref = Column(String(50), nullable=True, index=True)


class SaasInvoice(Base, TimestampMixin):
    __tablename__ = "saas_invoice"
    __table_args__ = (
        UniqueConstraint("fiscal_year", "sequence", name="uq_saas_invoice_fy_seq"),
        CheckConstraint("amount_minor >= 0", name="ck_saas_invoice_amount"),
        CheckConstraint("length(invoice_number) <= 16", name="ck_saas_invoice_number_len"),
    )

    id = Column(String(36), primary_key=True, default=generate_uuid)
    workspace_id = Column(String(64), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    order_id = Column(String(36), ForeignKey("saas_order.id", ondelete="RESTRICT"), nullable=False, unique=True)
    invoice_number = Column(String(16), unique=True, nullable=False)  # RP/26-27/000001
    fiscal_year = Column(String(5), nullable=False)  # "26-27" (Indian FY, April–March)
    sequence = Column(Integer, nullable=False)
    amount_minor = Column(BigInteger, nullable=False)
    currency = Column(String(3), nullable=False)
    # Tax stays null (and is not printed) until GST is enabled.
    tax_minor = Column(BigInteger, nullable=True)
    tax_breakup = Column(JSON, nullable=True)
    seller_gstin = Column(String(15), nullable=True)
    buyer_gstin = Column(String(15), nullable=True)
    issued_at = Column(DateTime(timezone=True), nullable=False)


class SaasInvoiceCounter(Base):
    __tablename__ = "saas_invoice_counter"

    fiscal_year = Column(String(5), primary_key=True)
    last_sequence = Column(Integer, nullable=False, default=0)


class SaasAudit(Base, TimestampMixin):
    """Append-only history of every billing state change, written in the same transaction."""

    __tablename__ = "saas_audit"
    __table_args__ = (Index("ix_saas_audit_entity", "entity", "entity_id"),)

    id = Column(String(36), primary_key=True, default=generate_uuid)
    workspace_id = Column(String(64), nullable=True, index=True)
    entity = Column(String(30), nullable=False)  # subscription | order | attempt | webhook | backfill
    entity_id = Column(String(64), nullable=False)
    action = Column(String(60), nullable=False)
    from_state = Column(String(30), nullable=True)
    to_state = Column(String(30), nullable=True)
    actor = Column(String(64), nullable=True)  # user id, "system", "webhook", "reconcile"
    reason = Column(Text, nullable=True)
    meta = Column(JSON, nullable=True)


class SaasRefund(Base, TimestampMixin):
    """Recorded from verified provider events only; there is no refund API in Phase 1."""

    __tablename__ = "saas_refund"
    __table_args__ = (
        UniqueConstraint("provider", "provider_refund_id", name="uq_saas_refund_provider_ref"),
        CheckConstraint("amount_minor > 0", name="ck_saas_refund_amount"),
    )

    id = Column(String(36), primary_key=True, default=generate_uuid)
    order_id = Column(String(36), ForeignKey("saas_order.id", ondelete="RESTRICT"), nullable=False, index=True)
    workspace_id = Column(String(64), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    provider = Column(String(20), nullable=False, default="cashfree")
    provider_refund_id = Column(String(100), nullable=False)
    amount_minor = Column(BigInteger, nullable=False)
    currency = Column(String(3), nullable=False)
    status = Column(String(20), nullable=False)
    raw_status = Column(String(50), nullable=True)


class SaasHandoffToken(Base, TimestampMixin):
    """Single-use app→web checkout handoff. Only the SHA-256 of the token is stored."""

    __tablename__ = "saas_handoff_token"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    token_hash = Column(String(64), unique=True, nullable=False)
    user_id = Column(String(64), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    workspace_id = Column(String(64), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)
    purpose = Column(String(30), nullable=False)  # "checkout"
    expires_at = Column(DateTime(timezone=True), nullable=False)
    consumed_at = Column(DateTime(timezone=True), nullable=True)
