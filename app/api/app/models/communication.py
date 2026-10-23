"""
Member/staff communication: reusable message templates, per-user notification preferences,
broadcasts to selected audiences, and one delivery-log row per recipient per channel.

Delivery statuses: queued, sent, failed, skipped_not_configured, skipped_opt_out,
skipped_no_contact, skipped_no_consent. A row is "sent" only after the channel
(in-app insert, SMTP accept, provider HTTP 2xx) acknowledged it.
"""
from sqlalchemy import JSON, Boolean, Column, DateTime, ForeignKey, Index, Integer, String, Text, UniqueConstraint

from app.core.database import Base
from app.models.base import TenantMixin, TimestampMixin, generate_uuid

CHANNELS = ("in_app", "email", "whatsapp", "sms", "push")
DELIVERY_STATUSES = (
    "queued", "sent", "failed",
    "skipped_not_configured", "skipped_opt_out", "skipped_no_contact", "skipped_no_consent",
)
# Broadcasts created by the platform (super admin) use this workspace id, like platform audit logs.
PLATFORM_WORKSPACE_ID = "platform"


class MessageTemplate(Base, TimestampMixin, TenantMixin):
    __tablename__ = "message_templates"
    __table_args__ = (UniqueConstraint("workspace_id", "name", name="uq_message_template_name"),)

    id = Column(String(64), primary_key=True, default=generate_uuid)
    name = Column(String(120), nullable=False)
    channel = Column(String(20), nullable=False, default="in_app")  # in_app | email | whatsapp
    category = Column(String(40), nullable=False, default="announcement")  # announcement | reminder | receipt | welcome
    subject = Column(String(255), nullable=True)
    body = Column(Text, nullable=False)  # placeholders: {{first_name}}, {{gym_name}}
    # Approved WhatsApp template / AiSensy API campaign name. WhatsApp sends require it.
    provider_template_name = Column(String(150), nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    created_by = Column(String(64), nullable=True)


class NotificationPreference(Base, TimestampMixin, TenantMixin):
    __tablename__ = "notification_preferences"
    __table_args__ = (UniqueConstraint("workspace_id", "user_id", name="uq_notification_pref_user"),)

    id = Column(String(64), primary_key=True, default=generate_uuid)
    user_id = Column(String(64), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    in_app_enabled = Column(Boolean, nullable=False, default=True)
    email_enabled = Column(Boolean, nullable=False, default=True)
    # WhatsApp requires explicit opt-in; the timestamp records consent.
    whatsapp_enabled = Column(Boolean, nullable=False, default=False)
    whatsapp_consent_at = Column(DateTime, nullable=True)
    # Announcements/broadcasts (transactional reminders and receipts are governed by the channel flags).
    announcements_enabled = Column(Boolean, nullable=False, default=True)


class Broadcast(Base, TimestampMixin, TenantMixin):
    __tablename__ = "broadcasts"
    __table_args__ = (Index("ix_broadcasts_workspace_created", "workspace_id", "created_at"),)

    id = Column(String(64), primary_key=True, default=generate_uuid)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    channels = Column(JSON, nullable=False, default=list)
    audience = Column(JSON, nullable=False, default=dict)  # {"segment": ..., "member_ids": [...], "days": n}
    template_id = Column(String(64), nullable=True)
    status = Column(String(20), nullable=False, default="sending")  # sending | completed | completed_with_errors
    recipient_count = Column(Integer, nullable=False, default=0)
    created_by = Column(String(64), nullable=True)
    completed_at = Column(DateTime, nullable=True)


class NotificationDelivery(Base, TimestampMixin, TenantMixin):
    __tablename__ = "notification_deliveries"
    __table_args__ = (
        UniqueConstraint("idempotency_key", name="uq_notification_delivery_idempotency"),
        Index("ix_deliveries_workspace_broadcast", "workspace_id", "broadcast_id"),
        Index("ix_deliveries_workspace_created", "workspace_id", "created_at"),
        Index("ix_deliveries_status", "status"),
    )

    id = Column(String(64), primary_key=True, default=generate_uuid)
    broadcast_id = Column(String(64), nullable=True)
    event_type = Column(String(50), nullable=False, default="broadcast")
    channel = Column(String(20), nullable=False)
    recipient_user_id = Column(String(64), nullable=True)
    member_id = Column(String(64), nullable=True)
    recipient_name = Column(String(200), nullable=True)
    destination = Column(String(255), nullable=True)  # masked phone / email for display
    status = Column(String(30), nullable=False, default="queued")
    provider = Column(String(30), nullable=True)
    provider_message_id = Column(String(150), nullable=True)
    error = Column(String(500), nullable=True)
    attempts = Column(Integer, nullable=False, default=0)
    idempotency_key = Column(String(255), nullable=False)
    sent_at = Column(DateTime, nullable=True)
    # Lifecycle (non-broadcast) messages carry their own rendered content.
    subject = Column(String(255), nullable=True)
    body = Column(Text, nullable=True)
    provider_template_name = Column(String(150), nullable=True)
    template_params = Column(JSON, nullable=True)


class DeviceToken(Base, TimestampMixin, TenantMixin):
    """Push-notification token for one app install (FCM). Revoked tokens are kept with `revoked_at`."""
    __tablename__ = "device_tokens"
    __table_args__ = (UniqueConstraint("token", name="uq_device_token"),)

    id = Column(String(64), primary_key=True, default=generate_uuid)
    user_id = Column(String(64), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    token = Column(String(512), nullable=False)
    platform = Column(String(20), nullable=False)  # android | ios | web | desktop
    last_seen_at = Column(DateTime, nullable=True)
    revoked_at = Column(DateTime, nullable=True)
