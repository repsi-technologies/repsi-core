"""
Member coaching: fitness goals and requests for a trainer / personal training.

Goals are append-only: setting a new goal adds a row, and the newest row is the current goal, so a
member's history (and what their trainer saw at the time) never changes. A trainer request is
resolved once (approved, declined or cancelled); approving it creates the TrainerClient row, which
keeps the assignment history.
"""
from sqlalchemy import Column, DateTime, ForeignKey, Index, Integer, String, Text

from app.core.database import Base
from app.models.base import TenantMixin, TimestampMixin, generate_uuid


class MemberGoal(Base, TimestampMixin, TenantMixin):
    __tablename__ = "member_goals"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    member_id = Column(String(64), ForeignKey("members.id", ondelete="CASCADE"), nullable=False, index=True)
    goal = Column(String(30), nullable=False)  # fat_loss | muscle_gain | strength | endurance | general_fitness | mobility
    fitness_level = Column(String(20), nullable=False, default="beginner")  # beginner | intermediate | advanced
    days_per_week = Column(Integer, nullable=False, default=3)
    session_minutes = Column(Integer, nullable=False, default=45)
    focus_areas = Column(Text, nullable=True)  # JSON list
    notes = Column(Text, nullable=True)
    set_by_user_id = Column(String(64), nullable=True)

    __table_args__ = (Index("ix_member_goals_ws_member_created", "workspace_id", "member_id", "created_at"),)


class TrainerRequest(Base, TimestampMixin, TenantMixin):
    __tablename__ = "trainer_requests"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    member_id = Column(String(64), ForeignKey("members.id", ondelete="CASCADE"), nullable=False, index=True)
    kind = Column(String(30), nullable=False, default="trainer")  # trainer | personal_training
    preferred_trainer_id = Column(String(64), ForeignKey("trainers.id", ondelete="SET NULL"), nullable=True)
    message = Column(Text, nullable=True)
    status = Column(String(20), nullable=False, default="pending", index=True)  # pending | approved | declined | cancelled
    requested_by_user_id = Column(String(64), nullable=True)
    resolved_by_user_id = Column(String(64), nullable=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    resolution_note = Column(Text, nullable=True)
    assigned_trainer_id = Column(String(64), ForeignKey("trainers.id", ondelete="SET NULL"), nullable=True)
    relationship_id = Column(String(64), nullable=True)

    __table_args__ = (Index("ix_trainer_requests_ws_status", "workspace_id", "status", "created_at"),)
