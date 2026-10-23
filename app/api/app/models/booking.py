"""
Class scheduling, bookings with waitlists, and trainer availability.

A GymClass is the template ("Morning Yoga, 60 min, 20 places"). Each ClassSession is one dated
occurrence with its own trainer, room and capacity. ClassBooking rows are never deleted: a
cancellation or no-show changes the status and stamps who/when, so booking history is kept.
Personal-training appointments reuse TrainingSession (app/models/trainer.py) and are checked
against TrainerAvailability / TrainerTimeOff.
"""
from sqlalchemy import Boolean, Column, Date, DateTime, ForeignKey, Index, Integer, String, Text, UniqueConstraint

from app.core.database import Base
from app.models.base import TenantMixin, TimestampMixin, generate_uuid

SESSION_STATUSES = ("scheduled", "cancelled", "completed")
BOOKING_STATUSES = ("booked", "waitlisted", "cancelled", "attended", "no_show")
ACTIVE_BOOKING_STATUSES = ("booked", "waitlisted")


class ClassSession(Base, TimestampMixin, TenantMixin):
    __tablename__ = "class_sessions"
    __table_args__ = (
        Index("ix_class_sessions_ws_starts", "workspace_id", "starts_at"),
        Index("ix_class_sessions_ws_class", "workspace_id", "class_id"),
    )

    id = Column(String(64), primary_key=True, default=generate_uuid)
    class_id = Column(String(64), ForeignKey("classes.id", ondelete="CASCADE"), nullable=False)
    trainer_id = Column(String(64), ForeignKey("trainers.id", ondelete="SET NULL"), nullable=True, index=True)
    branch_id = Column(String(64), nullable=True)
    starts_at = Column(DateTime(timezone=True), nullable=False)
    ends_at = Column(DateTime(timezone=True), nullable=False)
    capacity = Column(Integer, nullable=False)
    room = Column(String(100), nullable=True)
    status = Column(String(20), nullable=False, default="scheduled")
    cancel_reason = Column(String(255), nullable=True)
    created_by = Column(String(64), nullable=True)
    # Groups sessions generated together by a recurring schedule.
    series_id = Column(String(64), nullable=True, index=True)


class ClassBooking(Base, TimestampMixin, TenantMixin):
    __tablename__ = "class_bookings"
    __table_args__ = (
        Index("ix_class_bookings_ws_session_status", "workspace_id", "session_id", "status"),
        Index("ix_class_bookings_ws_member", "workspace_id", "member_id"),
    )

    id = Column(String(64), primary_key=True, default=generate_uuid)
    session_id = Column(String(64), ForeignKey("class_sessions.id", ondelete="CASCADE"), nullable=False)
    member_id = Column(String(64), ForeignKey("members.id", ondelete="CASCADE"), nullable=False)
    status = Column(String(20), nullable=False, default="booked")
    waitlist_position = Column(Integer, nullable=True)
    booked_by_user_id = Column(String(64), nullable=True)
    booked_at = Column(DateTime(timezone=True), nullable=False)
    cancelled_at = Column(DateTime(timezone=True), nullable=True)
    cancelled_by_user_id = Column(String(64), nullable=True)
    cancel_reason = Column(String(255), nullable=True)
    late_cancel = Column(Boolean, nullable=False, default=False)
    promoted_at = Column(DateTime(timezone=True), nullable=True)
    checked_in_at = Column(DateTime(timezone=True), nullable=True)


class TrainerAvailability(Base, TimestampMixin, TenantMixin):
    """Recurring weekly working window. weekday: 0 = Monday … 6 = Sunday; times are workspace-local HH:MM."""
    __tablename__ = "trainer_availability"
    __table_args__ = (
        UniqueConstraint("trainer_id", "weekday", "start_time", name="uq_trainer_availability_slot"),
        Index("ix_trainer_availability_ws_trainer", "workspace_id", "trainer_id"),
    )

    id = Column(String(64), primary_key=True, default=generate_uuid)
    trainer_id = Column(String(64), ForeignKey("trainers.id", ondelete="CASCADE"), nullable=False)
    weekday = Column(Integer, nullable=False)
    start_time = Column(String(5), nullable=False)
    end_time = Column(String(5), nullable=False)
    branch_id = Column(String(64), nullable=True)


class TrainerTimeOff(Base, TimestampMixin, TenantMixin):
    __tablename__ = "trainer_time_off"
    __table_args__ = (Index("ix_trainer_time_off_ws_trainer", "workspace_id", "trainer_id", "starts_on"),)

    id = Column(String(64), primary_key=True, default=generate_uuid)
    trainer_id = Column(String(64), ForeignKey("trainers.id", ondelete="CASCADE"), nullable=False)
    starts_on = Column(Date, nullable=False)
    ends_on = Column(Date, nullable=False)
    reason = Column(Text, nullable=True)
    created_by = Column(String(64), nullable=True)
