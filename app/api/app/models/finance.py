import enum
from datetime import datetime, date, timezone
from sqlalchemy import JSON, Column, String, Float, Integer, DateTime, Date, Enum, ForeignKey, Text, Index, UniqueConstraint
from app.core.database import Base
from app.models.base import TimestampMixin, TenantMixin, generate_uuid


class PaymentMethod(str, enum.Enum):
    UPI = "upi"
    CARD = "card"
    CASH = "cash"
    NETBANKING = "netbanking"
    CHEQUE = "cheque"


class PaymentStatus(str, enum.Enum):
    SUCCESS = "success"
    PENDING = "pending"
    FAILED = "failed"
    REFUNDED = "refunded"


class Payment(Base, TimestampMixin, TenantMixin):
    __tablename__ = "payments"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    member_id = Column(String(64), ForeignKey("members.id", ondelete="CASCADE"), nullable=False, index=True)
    membership_id = Column(String(64), ForeignKey("memberships.id", ondelete="SET NULL"), nullable=True)
    amount = Column(Float, nullable=False)
    currency = Column(String(10), default="INR", nullable=False)
    method = Column(Enum(PaymentMethod), default=PaymentMethod.UPI, nullable=False)
    status = Column(Enum(PaymentStatus), default=PaymentStatus.SUCCESS, nullable=False, index=True)
    transaction_ref = Column(String(100), nullable=True)
    invoice_id = Column(String(64), nullable=True)
    paid_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    # Sequential per gym ("RCPT-2026-000042"), assigned when the payment is recorded as successful.
    receipt_number = Column(String(40), nullable=True, index=True)
    refunded_amount = Column(Float, nullable=False, default=0.0)
    recorded_by_user_id = Column(String(64), nullable=True)
    notes = Column(Text, nullable=True)

    __table_args__ = (
        Index("ix_payments_ws_status_paid", "workspace_id", "status", "paid_at"),
        Index("ix_payments_ws_created", "workspace_id", "created_at"),
    )


class Invoice(Base, TimestampMixin, TenantMixin):
    __tablename__ = "invoices"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    invoice_number = Column(String(50), nullable=False, index=True)
    member_id = Column(String(64), ForeignKey("members.id", ondelete="CASCADE"), nullable=True)
    subtotal = Column(Float, nullable=False)
    tax_amount = Column(Float, default=0.0, nullable=False)  # GST
    total_amount = Column(Float, nullable=False)
    status = Column(String(20), default="paid", nullable=False)  # paid, pending, void
    due_date = Column(Date, default=date.today, nullable=False)
    membership_id = Column(String(64), ForeignKey("memberships.id", ondelete="SET NULL"), nullable=True)
    amount_paid = Column(Float, default=0.0, nullable=False)
    notes = Column(Text, nullable=True)


class Expense(Base, TimestampMixin, TenantMixin):
    __tablename__ = "expenses"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    category = Column(String(100), nullable=False)  # Rent, Equipment, Electricity, Salaries, Maintenance
    title = Column(String(255), nullable=False)
    amount = Column(Float, nullable=False)
    expense_date = Column(Date, default=date.today, nullable=False, index=True)
    vendor = Column(String(150), nullable=True)
    payment_method = Column(String(50), default="bank_transfer")
    notes = Column(Text, nullable=True)


class Refund(Base, TimestampMixin, TenantMixin):
    """A refund against one payment. Payments are never edited down; refunds are added beside them."""
    __tablename__ = "refunds"
    __table_args__ = (Index("ix_refunds_ws_created", "workspace_id", "created_at"),)

    id = Column(String(64), primary_key=True, default=generate_uuid)
    payment_id = Column(String(64), ForeignKey("payments.id", ondelete="CASCADE"), nullable=False, index=True)
    member_id = Column(String(64), ForeignKey("members.id", ondelete="CASCADE"), nullable=False, index=True)
    amount = Column(Float, nullable=False)
    method = Column(String(20), nullable=False, default="cash")  # how the money went back
    reason = Column(Text, nullable=False)
    status = Column(String(20), nullable=False, default="processed")  # processed | failed
    reference = Column(String(100), nullable=True)
    processed_by_user_id = Column(String(64), nullable=True)
    processed_at = Column(DateTime(timezone=True), nullable=False)


class CashReconciliation(Base, TimestampMixin, TenantMixin):
    """Day-end close: what the system recorded per payment method versus what staff counted."""
    __tablename__ = "cash_reconciliations"
    __table_args__ = (UniqueConstraint("workspace_id", "business_date", "branch_key", name="uq_reconciliation_day"),)

    id = Column(String(64), primary_key=True, default=generate_uuid)
    business_date = Column(Date, nullable=False, index=True)
    branch_key = Column(String(64), nullable=False, default="all")
    expected = Column(JSON, nullable=False)  # {"cash": 1500.0, "upi": 3000.0, ...}
    counted = Column(JSON, nullable=False)
    variance = Column(JSON, nullable=False)
    total_expected = Column(Float, nullable=False)
    total_counted = Column(Float, nullable=False)
    total_variance = Column(Float, nullable=False)
    notes = Column(Text, nullable=True)
    status = Column(String(20), nullable=False, default="closed")  # closed | reopened
    closed_by_user_id = Column(String(64), nullable=False)
    closed_at = Column(DateTime(timezone=True), nullable=False)


class WorkspaceCounter(Base, TimestampMixin, TenantMixin):
    """Per-gym sequence numbers (receipts, invoices)."""
    __tablename__ = "workspace_counters"
    __table_args__ = (UniqueConstraint("workspace_id", "name", name="uq_workspace_counter"),)

    id = Column(String(64), primary_key=True, default=generate_uuid)
    name = Column(String(40), nullable=False)
    value = Column(Integer, nullable=False, default=0)
