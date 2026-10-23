"""Tenant support requests to the REPSI team and their conversation history."""
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Index, String, Text

from app.core.database import Base
from app.models.base import TenantMixin, TimestampMixin, generate_uuid

TICKET_STATUSES = ("open", "in_progress", "waiting_on_customer", "resolved", "closed")
TICKET_PRIORITIES = ("low", "normal", "high", "urgent")
TICKET_CATEGORIES = ("billing", "technical", "account", "feature_request", "data", "other")


class SupportTicket(Base, TimestampMixin, TenantMixin):
    __tablename__ = "support_tickets"
    __table_args__ = (
        Index("ix_support_tickets_ws_status", "workspace_id", "status"),
        Index("ix_support_tickets_status_created", "status", "created_at"),
    )

    id = Column(String(64), primary_key=True, default=generate_uuid)
    number = Column(String(20), nullable=False, unique=True)
    subject = Column(String(200), nullable=False)
    category = Column(String(30), nullable=False, default="other")
    priority = Column(String(10), nullable=False, default="normal")
    status = Column(String(30), nullable=False, default="open")
    created_by_user_id = Column(String(64), nullable=False)
    assigned_to_user_id = Column(String(64), nullable=True)  # a super admin
    resolution = Column(Text, nullable=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    first_response_at = Column(DateTime(timezone=True), nullable=True)
    last_activity_at = Column(DateTime(timezone=True), nullable=True)


class SupportMessage(Base, TimestampMixin, TenantMixin):
    __tablename__ = "support_messages"
    __table_args__ = (Index("ix_support_messages_ticket", "ticket_id", "created_at"),)

    id = Column(String(64), primary_key=True, default=generate_uuid)
    ticket_id = Column(String(64), ForeignKey("support_tickets.id", ondelete="CASCADE"), nullable=False)
    author_user_id = Column(String(64), nullable=False)
    from_support = Column(Boolean, nullable=False, default=False)
    # Internal notes are visible to the REPSI team only.
    internal = Column(Boolean, nullable=False, default=False)
    body = Column(Text, nullable=False)
