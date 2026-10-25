"""SaaS orders, payment verification, webhook queue and reconciliation.

A subscription is only ever activated from a payment the backend itself fetched from the provider
(`sync_order`). Webhooks and browser redirects just trigger that check.
"""
import hashlib
import json
import logging
import re
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.saas import SaasOrder, SaasPaymentAttempt, SaasPlan, SaasPlanPrice, SaasRefund, SaasSubscription, SaasWebhookEvent
from app.models.user import User, Workspace
from app.services.payment_providers import PaymentProvider, ProviderError, ProviderPayment, get_provider, to_minor
from app.services.saas_billing import (
    BillingError, add_months, alert, as_utc, audit, create_invoice_for_order, entitlements_for,
    get_or_create_subscription, transition,
)

logger = logging.getLogger(__name__)

BILLABLE_STATES = ("trialing", "active", "grace", "read_only")
MAX_WEBHOOK_ATTEMPTS = 8
RECONCILE_ALERT_AFTER = 3
STUCK_AFTER = timedelta(hours=24)
LATE_PAYMENT_WINDOW = timedelta(days=3)


def _now() -> datetime:
    return datetime.now(timezone.utc)


# --- pricing -------------------------------------------------------------------------------------------

def resolve_price(db: Session, sub: SaasSubscription, plan: SaasPlan, cycle: str, currency: str) -> tuple[int, int]:
    """(amount_minor, period_months) decided on the server. Founder overrides apply to the same plan/cycle."""
    row = db.query(SaasPlanPrice).filter_by(plan_id=plan.id, billing_cycle=cycle, currency=currency).first()
    if row is None or not row.is_enabled:
        raise BillingError(400, "PRICE_UNAVAILABLE", f"{plan.name} is not available for {cycle} billing in {currency}.")
    amount = row.amount_minor
    if (sub.price_override_minor is not None and sub.plan_id == plan.id and sub.billing_cycle == cycle
            and sub.price_override_currency == currency):
        amount = sub.price_override_minor
    return amount, row.period_months


def prorated_upgrade_amount(db: Session, sub: SaasSubscription, target: SaasPlan, now: datetime) -> int:
    """Price difference for the unused part of the current period, rounded up to a whole rupee (min ₹1)."""
    current = db.get(SaasPlan, sub.plan_id)
    cycle = sub.billing_cycle or "monthly"
    currency = (sub.currency or "INR").upper()
    cur_amount, months = resolve_price(db, sub, current, cycle, currency)
    new_amount, _ = resolve_price(db, sub, target, cycle, currency)
    diff = new_amount - cur_amount
    if diff <= 0:
        return 100  # Minimum ₹1 transition fee if target costs same or less under override
    end = as_utc(sub.paid_until)
    if end is None or end <= now:
        return new_amount
    start = add_months(end, -months)
    remaining = max(0, int((end - now).total_seconds()))
    period = max(1, int((end - start).total_seconds()))
    amount = -(-diff * remaining // period)  # ceil
    return max(100, -(-amount // 100) * 100)



def usage_over_limits(db: Session, workspace_id: str, plan: SaasPlan) -> list[str]:
    """Resources whose current usage exceeds `plan`'s hard caps (downgrade blockers)."""
    from app.models.saas import SaasEntitlement
    from app.services.billing import BillingService

    usage = BillingService.get_workspace_usage(db, workspace_id)
    over = []
    for ent in db.query(SaasEntitlement).filter_by(plan_id=plan.id, kind="limit"):
        cap = ent.int_value
        if cap is not None and cap >= 0 and usage.get(ent.key, {}).get("current", 0) > cap:
            over.append(ent.key)
    return sorted(over)


# --- orders --------------------------------------------------------------------------------------------

def _customer_phone(user: Optional[User], ws: Workspace) -> str:
    for raw in (getattr(user, "phone_e164", None), getattr(user, "phone", None), ws.phone):
        if not raw:
            continue
        digits = re.sub(r"\D", "", raw)
        if len(digits) == 10:
            return digits
        if len(digits) == 12 and digits.startswith("91"):
            return digits[2:]
        if raw.strip().startswith("+") and 8 <= len(digits) <= 15:
            return "+" + digits
    raise BillingError(400, "PHONE_REQUIRED", "Add a mobile number to your profile or gym before paying.")


def _order_kind(db: Session, sub: SaasSubscription, plan: SaasPlan, now: datetime) -> str:
    current = db.get(SaasPlan, sub.plan_id)
    paid_through = sub.status in ("active", "grace") and not sub.is_complimentary and sub.paid_until is not None
    if paid_through and plan.id == current.id:
        return "renewal"
    if sub.status == "active" and paid_through and as_utc(sub.paid_until) > now:
        if plan.rank > current.rank:
            return "upgrade"
        raise BillingError(409, "DOWNGRADE_REQUIRES_SCHEDULE",
                           "Lower plans start at the end of your current period. Schedule a downgrade instead.")
    return "new"


def checkout_view(db: Session, order: SaasOrder, provider_env: Optional[str] = None) -> dict:
    plan_code = db.get(SaasPlan, order.plan_id).code
    last = (db.query(SaasPaymentAttempt).filter_by(order_id=order.id)
            .order_by(SaasPaymentAttempt.updated_at.desc()).first())
    return {
        "order_ref": order.order_ref,
        "status": order.status,
        "kind": order.kind,
        "plan_code": plan_code,
        "billing_cycle": order.billing_cycle,
        "amount_minor": order.amount_minor,
        "currency": order.currency,
        "needs_review": order.needs_review,
        "expires_at": order.expires_at.isoformat() if order.expires_at else None,
        "payment_session_id": order.provider_session_id if order.status == "pending" else None,
        "environment": provider_env,
        "last_attempt_status": last.status if last else None,
    }


def create_order(db: Session, *, workspace_id: str, user: User, plan_code: str, billing_cycle: str, currency: str,
                 idempotency_key: str, provider: Optional[PaymentProvider] = None, now: Optional[datetime] = None) -> SaasOrder:
    """Create (or return the existing) order for this idempotency key and its provider checkout session."""
    now = as_utc(now) or _now()
    if not idempotency_key or not re.fullmatch(r"[A-Za-z0-9_\-:.]{8,100}", idempotency_key):
        raise BillingError(400, "BAD_IDEMPOTENCY_KEY", "A valid idempotency key is required.")
    existing = db.query(SaasOrder).filter_by(workspace_id=workspace_id, idempotency_key=idempotency_key).first()
    if existing:
        return _same_request(db, existing, plan_code, billing_cycle, currency)

    ws = db.get(Workspace, workspace_id)
    if ws is None or ws.is_active is False:
        raise BillingError(403, "WORKSPACE_INACTIVE", "This workspace cannot be billed.")
    sub = get_or_create_subscription(db, workspace_id, now)
    if sub.status not in BILLABLE_STATES:
        raise BillingError(403, "SUBSCRIPTION_SUSPENDED", "This subscription is suspended. Contact REPSI support.")
    plan = db.query(SaasPlan).filter_by(code=plan_code, is_active=True).first()
    if plan is None:
        raise BillingError(400, "UNKNOWN_PLAN", "Unknown plan.")
    currency = (currency or "INR").upper()
    try:
        provider = provider or get_provider()
    except ProviderError as e:
        raise BillingError(503, "PROVIDER_NOT_CONFIGURED", "Online payments are not configured yet.") from e

    kind = _order_kind(db, sub, plan, now)
    current = db.get(SaasPlan, sub.plan_id)
    if kind != "upgrade" and plan.rank < current.rank:
        over = usage_over_limits(db, workspace_id, plan)
        if over:
            raise BillingError(409, "USAGE_EXCEEDS_PLAN", f"Your current usage exceeds {plan.name} limits: {', '.join(over)}.")
    if kind == "upgrade":
        billing_cycle, currency = sub.billing_cycle, sub.currency
        amount, months = prorated_upgrade_amount(db, sub, plan, now), 0
    else:
        amount, months = resolve_price(db, sub, plan, billing_cycle, currency)

    order = SaasOrder(
        workspace_id=workspace_id, subscription_id=sub.id, order_ref=f"rps_{uuid.uuid4().hex}", kind=kind,
        # Upgrades never extend paid_until; period_months=1 only satisfies the CHECK constraint.
        plan_id=plan.id, billing_cycle=billing_cycle, period_months=months if kind != "upgrade" else 1,
        currency=currency, amount_minor=amount, tax_minor=None, status="created", idempotency_key=idempotency_key,
        provider="cashfree", expires_at=now + timedelta(minutes=settings.SAAS_ORDER_TTL_MINUTES),
        created_by_user_id=user.id,
    )
    db.add(order)
    try:
        db.flush()
    except IntegrityError:  # double click raced us
        db.rollback()
        existing = db.query(SaasOrder).filter_by(workspace_id=workspace_id, idempotency_key=idempotency_key).one()
        return _same_request(db, existing, plan_code, billing_cycle, currency)
    audit(db, "order", order, "created", actor=user.id, to="created",
          meta={"plan": plan.code, "cycle": billing_cycle, "amount_minor": amount, "kind": kind})
    db.commit()  # durable before calling the provider

    try:
        phone = _customer_phone(user, ws)
        created = provider.create_order(
            order_ref=order.order_ref, amount_minor=amount, currency=currency,
            customer_id=re.sub(r"[^A-Za-z0-9]", "", workspace_id)[:50] or "repsi",
            customer_phone=phone, customer_email=user.email, customer_name=user.full_name,
            return_url=f"{settings.SAAS_CHECKOUT_URL.rstrip('/')}/success?order={order.order_ref}",
            notify_url=(f"{settings.SAAS_PUBLIC_API_URL.rstrip('/')}{settings.API_V1_STR}/saas-billing/webhooks/cashfree"
                        if settings.SAAS_PUBLIC_API_URL.startswith("https://") else None),
            expires_at=order.expires_at,
        )
    except (ProviderError, BillingError) as e:
        transition(db, "order", order, "failed", actor="system", reason=getattr(e, "message", str(e)))
        db.commit()
        if isinstance(e, BillingError):
            raise
        raise BillingError(502, "PROVIDER_UNAVAILABLE", "Payment provider is unavailable. Please try again.") from e
    order.provider_order_id = created.provider_order_id
    order.provider_session_id = created.session_id
    transition(db, "order", order, "pending", actor="system", reason="Provider checkout created.")
    db.commit()
    return order


def _same_request(db: Session, order: SaasOrder, plan_code: str, cycle: str, currency: str) -> SaasOrder:
    plan = db.get(SaasPlan, order.plan_id)
    if plan.code != plan_code or (order.kind != "upgrade" and (order.billing_cycle != cycle or order.currency != (currency or "INR").upper())):
        raise BillingError(409, "IDEMPOTENCY_CONFLICT", "This idempotency key was used for a different purchase.")
    return order


# --- verification and activation -----------------------------------------------------------------------

def _record_attempt(db: Session, order: SaasOrder, p: ProviderPayment) -> SaasPaymentAttempt:
    att = db.query(SaasPaymentAttempt).filter_by(provider=order.provider, provider_payment_id=p.payment_id).first()
    if att is None:
        att = SaasPaymentAttempt(order_id=order.id, workspace_id=order.workspace_id, provider=order.provider,
                                 provider_payment_id=p.payment_id, status="initiated", amount_minor=p.amount_minor,
                                 currency=p.currency or order.currency, method=p.method, raw_status=p.raw_status)
        db.add(att)
        db.flush()
        audit(db, "attempt", att, "created", to="initiated", meta={"order": order.order_ref})
    if att.order_id != order.id:
        raise BillingError(409, "PAYMENT_ORDER_MISMATCH", "Payment belongs to another order.")
    att.raw_status, att.method = p.raw_status, p.method or att.method
    if p.failure_reason:
        att.failure_reason = p.failure_reason[:500]
    if p.status != att.status and p.status in ATTEMPT_NEXT.get(att.status, ()):
        transition(db, "attempt", att, p.status, actor="provider")
    return att


ATTEMPT_NEXT = {"initiated": ("success", "failed", "pending", "abandoned"), "pending": ("success", "failed", "abandoned"),
                "abandoned": ("success", "failed")}


def _activate(db: Session, sub: SaasSubscription, order: SaasOrder, now: datetime) -> None:
    plan_changed = sub.plan_id != order.plan_id
    if order.kind == "upgrade" and sub.status == "active" and sub.paid_until and as_utc(sub.paid_until) > now:
        sub.plan_id = order.plan_id
        sub.pending_plan_id = sub.pending_billing_cycle = None
        sub.price_override_minor = sub.price_override_currency = None
        sub.version = (sub.version or 0) + 1
        audit(db, "subscription", sub, "upgraded", actor="payment", meta={"order": order.order_ref, "plan": order.plan_id})
        return
    if order.kind == "upgrade":
        # Prorated amount no longer matches anything (period lapsed): keep the money, flag for a human.
        order.needs_review = True
        audit(db, "subscription", sub, "upgrade_after_lapse", actor="payment", meta={"order": order.order_ref})
        return
    paid_until = as_utc(sub.paid_until)
    base = max(now, paid_until) if (sub.status in ("active", "grace") and paid_until and not sub.is_complimentary) else now
    sub.paid_until = add_months(base, order.period_months)
    sub.plan_id, sub.billing_cycle, sub.currency = order.plan_id, order.billing_cycle, order.currency
    sub.cancel_at_period_end, sub.cancel_requested_at = False, None
    sub.grace_ends_at = sub.read_only_since = None
    sub.pending_plan_id = sub.pending_billing_cycle = None
    sub.is_complimentary = False
    if plan_changed:
        sub.price_override_minor = sub.price_override_currency = None
    if not transition(db, "subscription", sub, "active", actor="payment", reason=f"Verified payment for {order.order_ref}."):
        sub.version = (sub.version or 0) + 1
        audit(db, "subscription", sub, "renewed", actor="payment",
              meta={"order": order.order_ref, "paid_until": sub.paid_until.isoformat()})


def apply_verified_payment(db: Session, order: SaasOrder, payment: ProviderPayment, now: Optional[datetime] = None) -> bool:
    """Mark the order paid and activate the subscription, once. Returns True if this call activated it."""
    now = as_utc(now) or _now()
    order = db.query(SaasOrder).filter_by(id=order.id).with_for_update().one()
    att = _record_attempt(db, order, payment)
    if order.status == "paid":
        db.commit()
        return False
    if payment.amount_minor != order.amount_minor or (payment.currency or order.currency).upper() != order.currency:
        order.needs_review = True
        audit(db, "order", order, "amount_mismatch", actor="provider",
              meta={"expected": order.amount_minor, "paid": payment.amount_minor, "currency": payment.currency})
        db.commit()
        alert("Payment amount mismatch", f"order={order.order_ref} expected={order.amount_minor} paid={payment.amount_minor}")
        return False
    if order.status in ("failed", "cancelled"):
        order.needs_review = True
        audit(db, "order", order, "payment_on_closed_order", actor="provider", meta={"payment": att.provider_payment_id})
        db.commit()
        alert("Payment on closed order", f"order={order.order_ref} status={order.status}")
        return False
    late = order.status == "expired"
    if order.status == "created":
        transition(db, "order", order, "pending", actor="provider")
    transition(db, "order", order, "paid", actor="provider",
               reason="Verified late payment." if late else "Verified payment.", meta={"payment": att.provider_payment_id})
    order.paid_at = now
    if late:
        order.needs_review = True
    sub = db.query(SaasSubscription).filter_by(id=order.subscription_id).with_for_update().one()
    if sub.status == "suspended":
        order.needs_review = True
        audit(db, "subscription", sub, "payment_while_suspended", actor="payment", meta={"order": order.order_ref})
    else:
        _activate(db, sub, order, now)
    create_invoice_for_order(db, order, now)
    db.commit()
    if late:
        alert("Late payment accepted", f"order={order.order_ref} was paid after expiry; review it.")
    return True


def sync_order(db: Session, order: SaasOrder, provider: Optional[PaymentProvider] = None,
               now: Optional[datetime] = None) -> SaasOrder:
    """Ask the provider for this order's payments and apply what it says. Raises ProviderError on failure."""
    now = as_utc(now) or _now()
    if order.status in ("paid", "failed", "cancelled") or not order.provider_order_id:
        if order.status == "created" and order.expires_at and as_utc(order.expires_at) <= now:
            transition(db, "order", order, "expired", reason="Provider order was never created.")
            db.commit()
        return order
    provider = provider or get_provider()
    payments = provider.fetch_payments(order.order_ref)
    order.last_checked_at, order.reconcile_failures = now, 0
    success = next((p for p in payments if p.status == "success"), None)
    if success:
        apply_verified_payment(db, order, success, now)
        db.refresh(order)
        return order
    for p in payments:
        _record_attempt(db, order, p)
    if order.status == "pending" and order.expires_at and as_utc(order.expires_at) <= now:
        transition(db, "order", order, "expired", reason="Unpaid before expiry.")
    db.commit()
    return order


# --- webhooks ------------------------------------------------------------------------------------------

def ingest_webhook(db: Session, raw_body: bytes, timestamp: Optional[str], signature: Optional[str],
                   provider: Optional[PaymentProvider] = None) -> tuple[bool, str]:
    """Verify, de-duplicate and enqueue. Returns (accepted, reason). Never trusts the body before the signature."""
    provider = provider or get_provider()
    if not provider.verify_webhook(raw_body, timestamp, signature):
        logger.warning("Rejected Cashfree webhook with an invalid signature")
        return False, "invalid_signature"
    try:
        payload = json.loads(raw_body.decode("utf-8"))
    except (UnicodeDecodeError, ValueError):
        return False, "invalid_json"
    event_type = str(payload.get("type") or "UNKNOWN")[:100]
    data = payload.get("data") or {}
    order_ref = str((data.get("order") or {}).get("order_id") or (data.get("refund") or {}).get("order_id") or "")[:50] or None
    ref = (data.get("payment") or {}).get("cf_payment_id") or (data.get("refund") or {}).get("cf_refund_id") or ""
    status = (data.get("payment") or {}).get("payment_status") or (data.get("refund") or {}).get("refund_status") or ""
    event_id = hashlib.sha256(f"{event_type}|{order_ref}|{ref}|{status}".encode()).hexdigest()
    db.add(SaasWebhookEvent(provider=provider.name, event_id=event_id, event_type=event_type,
                            raw_body=raw_body.decode("utf-8"), status="queued", order_ref=order_ref))
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        return True, "duplicate"
    return True, "queued"


def _process_event(db: Session, ev: SaasWebhookEvent, provider: PaymentProvider, now: datetime) -> str:
    payload = json.loads(ev.raw_body)
    data = payload.get("data") or {}
    if ev.event_type.startswith("PAYMENT_"):
        order = db.query(SaasOrder).filter_by(order_ref=ev.order_ref).first() if ev.order_ref else None
        if order is None:
            return "ignored"  # not a SaaS order (e.g. another integration on the same account)
        sync_order(db, order, provider, now)  # verify against the provider API, never the webhook body
        return "processed"
    if ev.event_type.startswith("REFUND"):
        refund = data.get("refund") or {}
        order = db.query(SaasOrder).filter_by(order_ref=str(refund.get("order_id") or ev.order_ref or "")).first()
        if order is None or not refund.get("cf_refund_id"):
            return "ignored"
        row = db.query(SaasRefund).filter_by(provider=provider.name, provider_refund_id=str(refund["cf_refund_id"])).first()
        if row is None:
            row = SaasRefund(order_id=order.id, workspace_id=order.workspace_id, provider=provider.name,
                             provider_refund_id=str(refund["cf_refund_id"]), amount_minor=to_minor(refund.get("refund_amount") or 0),
                             currency=str(refund.get("refund_currency") or order.currency), status="recorded")
            db.add(row)
        row.raw_status = str(refund.get("refund_status") or "")[:50]
        row.status = row.raw_status.lower() or row.status
        order.needs_review = True
        audit(db, "order", order, "refund_recorded", actor="webhook", meta={"refund": row.provider_refund_id, "status": row.raw_status})
        db.commit()
        alert("Refund recorded", f"order={order.order_ref} refund={row.provider_refund_id} status={row.raw_status}")
        return "processed"
    return "ignored"


def drain_webhooks(db: Session, provider: Optional[PaymentProvider] = None, now: Optional[datetime] = None, limit: int = 50) -> dict:
    """Worker job: process queued events with exponential backoff; give up (and alert) after 8 attempts."""
    from sqlalchemy import or_

    now = as_utc(now) or _now()
    provider = provider or get_provider()
    counts = {"processed": 0, "ignored": 0, "retry": 0, "failed": 0}
    ids = [i for (i,) in db.query(SaasWebhookEvent.id).filter(
        SaasWebhookEvent.status == "queued",
        or_(SaasWebhookEvent.next_attempt_at.is_(None), SaasWebhookEvent.next_attempt_at <= now),
    ).order_by(SaasWebhookEvent.created_at).limit(limit)]
    for ev_id in ids:
        ev = db.get(SaasWebhookEvent, ev_id)
        try:
            result = _process_event(db, ev, provider, now)
            ev = db.get(SaasWebhookEvent, ev_id)
            ev.status, ev.processed_at, ev.last_error = result, now, None
            ev.attempts += 1
            db.commit()
            counts[result] += 1
        except Exception as e:
            db.rollback()
            ev = db.get(SaasWebhookEvent, ev_id)
            ev.attempts += 1
            ev.last_error = f"{type(e).__name__}: {str(e)[:300]}"
            if ev.attempts >= MAX_WEBHOOK_ATTEMPTS:
                ev.status = "failed"
                counts["failed"] += 1
                db.commit()
                alert("Webhook processing failed", f"event={ev.id} type={ev.event_type} order={ev.order_ref}")
            else:
                ev.next_attempt_at = now + timedelta(minutes=2 ** ev.attempts)
                counts["retry"] += 1
                db.commit()
    return counts


# --- reconciliation ------------------------------------------------------------------------------------

def reconcile_orders(db: Session, provider: Optional[PaymentProvider] = None, now: Optional[datetime] = None) -> dict:
    """Worker job: re-check open and recently expired orders against the provider, expire stale ones,
    and alert on repeated provider errors or orders stuck for 24h."""
    from sqlalchemy import and_, or_

    now = as_utc(now) or _now()
    provider = provider or get_provider()
    counts = {"checked": 0, "paid": 0, "expired": 0, "errors": 0, "stuck_alerts": 0}
    ids = [i for (i,) in db.query(SaasOrder.id).filter(or_(
        SaasOrder.status.in_(("created", "pending")),
        and_(SaasOrder.status == "expired", SaasOrder.expires_at >= now - LATE_PAYMENT_WINDOW),
    ))]
    for oid in ids:
        order = db.get(SaasOrder, oid)
        before = order.status
        counts["checked"] += 1
        try:
            sync_order(db, order, provider, now)
        except ProviderError as e:
            db.rollback()
            order = db.get(SaasOrder, oid)
            order.reconcile_failures = (order.reconcile_failures or 0) + 1
            order.last_checked_at = now
            db.commit()
            counts["errors"] += 1
            if order.reconcile_failures == RECONCILE_ALERT_AFTER:
                alert("Reconciliation failing", f"order={order.order_ref} failures={order.reconcile_failures}: {e}")
            continue
        except BillingError as e:
            db.rollback()
            logger.warning("Reconcile skipped %s: %s", oid, e.message)
            continue
        order = db.get(SaasOrder, oid)
        if order.status == "paid" and before != "paid":
            counts["paid"] += 1
        if order.status == "expired" and before != "expired":
            counts["expired"] += 1
        if order.status == "pending" and as_utc(order.created_at) <= now - STUCK_AFTER:
            from app.models.saas import SaasAudit
            if not db.query(SaasAudit.id).filter_by(entity="order", entity_id=order.id, action="stuck_alert").first():
                audit(db, "order", order, "stuck_alert")
                db.commit()
                alert("Payment stuck", f"order={order.order_ref} pending since {as_utc(order.created_at).isoformat()}")
                counts["stuck_alerts"] += 1
    return counts


def subscription_view(db: Session, sub: SaasSubscription) -> dict:
    from app.services.billing import BillingService
    plan = db.get(SaasPlan, sub.plan_id)
    pending = db.get(SaasPlan, sub.pending_plan_id) if sub.pending_plan_id else None
    ents = entitlements_for(db, sub)
    iso = lambda d: as_utc(d).isoformat() if d else None  # noqa: E731
    raw_usage = BillingService.get_workspace_usage(db, sub.workspace_id)
    usage = {k: v.get("current", 0) for k, v in raw_usage.items()}
    return {
        "status": sub.status,
        "plan_code": plan.code,
        "plan_name": plan.name,
        "effective_plan_code": ents["plan_code"],
        "billing_cycle": sub.billing_cycle,
        "currency": sub.currency,
        "trial_ends_at": iso(sub.trial_ends_at),
        "paid_until": iso(sub.paid_until),
        "grace_ends_at": iso(sub.grace_ends_at),
        "cancel_at_period_end": bool(sub.cancel_at_period_end),
        "pending_plan_code": pending.code if pending else None,
        "pending_billing_cycle": sub.pending_billing_cycle,
        "is_grandfathered": bool(sub.is_grandfathered),
        "is_complimentary": bool(sub.is_complimentary),
        "has_price_override": sub.price_override_minor is not None,
        "features": ents["features"],
        "limits": ents["limits"],
        "usage": usage,
    }
