"""
Nutrition and trainer-member chat.

Diet plans keep immutable versions: editing a plan appends a version, and an assignment pins the
version it was given, so a member's history never changes underneath them. Meal and water logs
are member-recorded actuals, kept apart from the plan. Chat messages are append-only.

Status fields are plain strings validated in services; list-valued fields are JSON text.
"""
from sqlalchemy import Column, Date, DateTime, Float, ForeignKey, Index, Integer, String, Text, UniqueConstraint

from app.core.database import Base
from app.models.base import TenantMixin, TimestampMixin, generate_uuid


class DietPlan(Base, TimestampMixin, TenantMixin):
    __tablename__ = "diet_plans"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    name = Column(String(150), nullable=False)
    goal = Column(String(100), nullable=True)
    diet_type = Column(String(30), nullable=True)  # vegetarian | vegan | eggetarian | non_vegetarian
    status = Column(String(20), nullable=False, default="active", index=True)  # active | archived
    created_by_user_id = Column(String(64), nullable=True, index=True)
    current_version_id = Column(String(64), nullable=True)


class DietPlanVersion(Base, TimestampMixin, TenantMixin):
    __tablename__ = "diet_plan_versions"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    plan_id = Column(String(64), ForeignKey("diet_plans.id", ondelete="CASCADE"), nullable=False, index=True)
    version_number = Column(Integer, nullable=False)
    meals = Column(Text, nullable=False)  # JSON [{slot, time, title, items: [{food, portion, calories, protein, carbs, fat}]}]
    calories_target = Column(Float, nullable=True)
    protein_target = Column(Float, nullable=True)
    carbs_target = Column(Float, nullable=True)
    fat_target = Column(Float, nullable=True)
    water_ml_target = Column(Integer, nullable=True)
    notes = Column(Text, nullable=True)
    change_summary = Column(String(255), nullable=True)
    created_by_user_id = Column(String(64), nullable=True)

    __table_args__ = (UniqueConstraint("plan_id", "version_number", name="uq_diet_plan_version"),)


class DietAssignment(Base, TimestampMixin, TenantMixin):
    __tablename__ = "diet_assignments"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    member_id = Column(String(64), ForeignKey("members.id", ondelete="CASCADE"), nullable=False, index=True)
    plan_id = Column(String(64), ForeignKey("diet_plans.id", ondelete="SET NULL"), nullable=True)
    version_id = Column(String(64), ForeignKey("diet_plan_versions.id", ondelete="SET NULL"), nullable=True)
    title = Column(String(150), nullable=False)
    trainer_id = Column(String(64), ForeignKey("trainers.id", ondelete="SET NULL"), nullable=True)
    assigned_by_user_id = Column(String(64), nullable=True)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)
    status = Column(String(20), nullable=False, default="active")  # active | ended
    ended_on = Column(Date, nullable=True)
    notes = Column(Text, nullable=True)

    __table_args__ = (Index("ix_diet_assignments_ws_member_status", "workspace_id", "member_id", "status"),)


class MealLog(Base, TimestampMixin, TenantMixin):
    __tablename__ = "meal_logs"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    member_id = Column(String(64), ForeignKey("members.id", ondelete="CASCADE"), nullable=False, index=True)
    assignment_id = Column(String(64), ForeignKey("diet_assignments.id", ondelete="SET NULL"), nullable=True)
    log_date = Column(Date, nullable=False)
    slot = Column(String(30), nullable=False)  # breakfast | lunch | dinner | snack | ...
    status = Column(String(20), nullable=False, default="eaten")  # eaten | modified | skipped
    description = Column(Text, nullable=True)
    calories = Column(Float, nullable=True)
    protein = Column(Float, nullable=True)
    carbs = Column(Float, nullable=True)
    fat = Column(Float, nullable=True)
    notes = Column(Text, nullable=True)
    logged_by_user_id = Column(String(64), nullable=True)
    client_ref = Column(String(64), nullable=True)  # idempotency key from offline-capable clients

    __table_args__ = (
        Index("ix_meal_logs_ws_member_date", "workspace_id", "member_id", "log_date"),
        UniqueConstraint("workspace_id", "member_id", "client_ref", name="uq_meal_log_client_ref"),
    )


class WaterLog(Base, TimestampMixin, TenantMixin):
    __tablename__ = "water_logs"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    member_id = Column(String(64), ForeignKey("members.id", ondelete="CASCADE"), nullable=False, index=True)
    log_date = Column(Date, nullable=False)
    amount_ml = Column(Integer, nullable=False)
    client_ref = Column(String(64), nullable=True)

    __table_args__ = (
        Index("ix_water_logs_ws_member_date", "workspace_id", "member_id", "log_date"),
        UniqueConstraint("workspace_id", "member_id", "client_ref", name="uq_water_log_client_ref"),
    )


class Conversation(Base, TimestampMixin, TenantMixin):
    __tablename__ = "conversations"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    member_id = Column(String(64), ForeignKey("members.id", ondelete="CASCADE"), nullable=False, index=True)
    trainer_id = Column(String(64), ForeignKey("trainers.id", ondelete="CASCADE"), nullable=False, index=True)
    last_message_at = Column(DateTime(timezone=True), nullable=True)

    __table_args__ = (UniqueConstraint("workspace_id", "member_id", "trainer_id", name="uq_conversation_pair"),)


class ChatMessage(Base, TimestampMixin, TenantMixin):
    __tablename__ = "chat_messages"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    conversation_id = Column(String(64), ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False, index=True)
    sender_user_id = Column(String(64), nullable=False)
    sender_kind = Column(String(10), nullable=False)  # trainer | member
    body = Column(Text, nullable=True)
    attachment_type = Column(String(20), nullable=True)  # workout_assignment | diet_assignment | image
    attachment_ref = Column(String(512), nullable=True)
    read_at = Column(DateTime(timezone=True), nullable=True)
    client_ref = Column(String(64), nullable=True)

    __table_args__ = (
        Index("ix_chat_messages_conv_created", "conversation_id", "created_at"),
        UniqueConstraint("conversation_id", "sender_user_id", "client_ref", name="uq_chat_message_client_ref"),
    )


class ChatReport(Base, TimestampMixin, TenantMixin):
    """A member or trainer flagging a conversation (optionally one message) for the gym to review.

    The reported message's text is snapshotted so the report stays meaningful as the chat grows.
    Status changes are appended to ChatReportEvent; this row only mirrors the latest state.
    """
    __tablename__ = "chat_reports"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    conversation_id = Column(String(64), ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False, index=True)
    message_id = Column(String(64), nullable=True)
    message_excerpt = Column(Text, nullable=True)
    reporter_user_id = Column(String(64), nullable=False, index=True)
    reporter_kind = Column(String(10), nullable=False)  # trainer | member
    reported_kind = Column(String(10), nullable=False)  # trainer | member
    reason = Column(String(30), nullable=False)  # harassment | inappropriate | spam | off_topic | safety | other
    details = Column(Text, nullable=True)
    status = Column(String(20), nullable=False, default="open", index=True)  # open | reviewing | resolved | dismissed
    resolution_note = Column(Text, nullable=True)
    reviewed_by_user_id = Column(String(64), nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)

    __table_args__ = (Index("ix_chat_reports_ws_status", "workspace_id", "status"),)


class ChatReportEvent(Base, TimestampMixin, TenantMixin):
    """Append-only history of a report: filed, then each review status change."""
    __tablename__ = "chat_report_events"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    report_id = Column(String(64), ForeignKey("chat_reports.id", ondelete="CASCADE"), nullable=False, index=True)
    actor_user_id = Column(String(64), nullable=False)
    from_status = Column(String(20), nullable=True)
    to_status = Column(String(20), nullable=False)
    note = Column(Text, nullable=True)
