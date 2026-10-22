from sqlalchemy import Column, String, Integer, Date, DateTime, ForeignKey, Text, Index
from app.core.database import Base
from app.models.base import TimestampMixin, TenantMixin, generate_uuid


class MemberEvent(Base, TimestampMixin, TenantMixin):
    """Append-only history of account-level actions on a member (status changes, notes, profile edits)."""
    __tablename__ = "member_events"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    member_id = Column(String(64), ForeignKey("members.id", ondelete="CASCADE"), nullable=False, index=True)
    actor_user_id = Column(String(64), nullable=True)
    event_type = Column(String(50), nullable=False)  # status_changed, note_added, note_updated, note_deleted, profile_updated
    from_status = Column(String(30), nullable=True)
    to_status = Column(String(30), nullable=True)
    reason = Column(Text, nullable=True)
    details = Column(Text, nullable=True)  # JSON

    __table_args__ = (
        Index("ix_member_events_ws_member_created", "workspace_id", "member_id", "created_at"),
    )


class MemberNote(Base, TimestampMixin, TenantMixin):
    """Internal staff notes. Never exposed through member-facing endpoints."""
    __tablename__ = "member_notes"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    member_id = Column(String(64), ForeignKey("members.id", ondelete="CASCADE"), nullable=False, index=True)
    author_user_id = Column(String(64), nullable=True)
    author_name = Column(String(255), nullable=True)
    body = Column(Text, nullable=False)


class MembershipEvent(Base, TimestampMixin, TenantMixin):
    """Append-only lifecycle log for a membership period."""
    __tablename__ = "membership_events"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    membership_id = Column(String(64), ForeignKey("memberships.id", ondelete="CASCADE"), nullable=False, index=True)
    member_id = Column(String(64), ForeignKey("members.id", ondelete="CASCADE"), nullable=False, index=True)
    actor_user_id = Column(String(64), nullable=True)
    event_type = Column(String(50), nullable=False)  # assigned, renewed, extended, frozen, unfrozen, cancelled, expired
    from_status = Column(String(30), nullable=True)
    to_status = Column(String(30), nullable=True)
    previous_end_date = Column(Date, nullable=True)
    new_end_date = Column(Date, nullable=True)
    reason = Column(Text, nullable=True)
    details = Column(Text, nullable=True)  # JSON


class MembershipFreeze(Base, TimestampMixin, TenantMixin):
    __tablename__ = "membership_freezes"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    membership_id = Column(String(64), ForeignKey("memberships.id", ondelete="CASCADE"), nullable=False, index=True)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    reason = Column(Text, nullable=True)
    created_by_user_id = Column(String(64), nullable=True)
    resumed_at = Column(DateTime, nullable=True)
    days_frozen = Column(Integer, nullable=True)  # set on resume: days actually added to the membership
