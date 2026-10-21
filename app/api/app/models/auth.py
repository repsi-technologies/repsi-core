from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.base import TimestampMixin, generate_uuid


class PendingRegistration(Base):
    __tablename__ = "pending_registrations"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, nullable=False, index=True)
    full_name = Column(String(255), nullable=False)
    password_hash = Column(String(255), nullable=False)
    gym_name = Column(String(255), nullable=False)
    gym_phone = Column(String(50), nullable=True)
    gym_city = Column(String(100), nullable=True)
    otp_hash = Column(String(128), nullable=False)
    otp_expires_at = Column(DateTime(timezone=True), nullable=False)
    last_sent_at = Column(DateTime(timezone=True), nullable=False)
    attempts = Column(Integer, nullable=False, default=0)
    created_at = Column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )


class AuthIdentity(Base, TimestampMixin):
    """
    An external sign-in method linked to exactly one canonical User.
    Password and verified-phone sign-in live on the User row itself; this table
    holds federated providers (currently "google") keyed by the provider's stable subject.
    """
    __tablename__ = "auth_identities"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    user_id = Column(String(64), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    provider = Column(String(32), nullable=False)
    provider_subject = Column(String(255), nullable=False)
    email = Column(String(255), nullable=True)
    last_used_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="identities")

    __table_args__ = (
        UniqueConstraint("provider", "provider_subject", name="uq_identity_provider_subject"),
        UniqueConstraint("user_id", "provider", name="uq_identity_user_provider"),
    )


class PhoneOtpChallenge(Base, TimestampMixin):
    """One active OTP challenge per (phone, purpose). Codes are stored only as HMACs."""
    __tablename__ = "phone_otp_challenges"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    phone_e164 = Column(String(20), nullable=False, index=True)
    purpose = Column(String(32), nullable=False)
    code_hash = Column(String(128), nullable=True)  # NULL in test-provider mode
    expires_at = Column(DateTime(timezone=True), nullable=False)
    last_sent_at = Column(DateTime(timezone=True), nullable=False)
    send_window_started_at = Column(DateTime(timezone=True), nullable=False)
    send_count = Column(Integer, nullable=False, default=0)
    attempts = Column(Integer, nullable=False, default=0)
    consumed_at = Column(DateTime(timezone=True), nullable=True)

    __table_args__ = (
        UniqueConstraint("phone_e164", "purpose", name="uq_phone_otp_phone_purpose"),
    )


class EmailOtpChallenge(Base, TimestampMixin):
    """One active OTP challenge per (email, purpose). Codes are stored only as HMACs."""
    __tablename__ = "email_otp_challenges"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    email = Column(String(255), nullable=False, index=True)
    purpose = Column(String(32), nullable=False)
    code_hash = Column(String(128), nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    last_sent_at = Column(DateTime(timezone=True), nullable=False)
    send_window_started_at = Column(DateTime(timezone=True), nullable=False)
    send_count = Column(Integer, nullable=False, default=0)
    attempts = Column(Integer, nullable=False, default=0)
    consumed_at = Column(DateTime(timezone=True), nullable=True)

    __table_args__ = (
        UniqueConstraint("email", "purpose", name="uq_email_otp_email_purpose"),
    )


class PasswordResetToken(Base, TimestampMixin):
    __tablename__ = "password_reset_tokens"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    user_id = Column(String(64), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    token_hash = Column(String(128), nullable=False, unique=True, index=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    used_at = Column(DateTime(timezone=True), nullable=True)
