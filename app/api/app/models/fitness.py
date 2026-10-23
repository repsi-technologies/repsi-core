"""
Workout & fitness management.

Exercise library -> reusable programs (immutable published versions) -> member assignments
(each holds its own copy of the plan so per-member customisation never touches the program or
other members) -> workout sessions with logged sets (actuals stored apart from prescriptions)
-> measurements and assessments.

Status fields are plain strings validated in schemas/services (see repsi-db-migrations skill).
List-valued fields (muscles, instructions, weekdays) are JSON text, matching existing models.
"""
from sqlalchemy import Boolean, Column, Date, DateTime, Float, ForeignKey, Index, Integer, String, Text, UniqueConstraint

from app.core.database import Base
from app.models.base import TenantMixin, TimestampMixin, generate_uuid

GLOBAL_SCOPE = "global"


class Exercise(Base, TimestampMixin):
    """Global (workspace_id NULL, platform-curated) or gym-specific exercise."""
    __tablename__ = "exercises"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    workspace_id = Column(String(64), nullable=True, index=True)
    # workspace_id or "global"; lets (scope_key, slug) be unique on SQLite and PostgreSQL alike.
    scope_key = Column(String(64), nullable=False, index=True)
    name = Column(String(150), nullable=False)
    slug = Column(String(160), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(50), nullable=False)
    movement_pattern = Column(String(50), nullable=True)
    primary_muscles = Column(Text, nullable=True)  # JSON list
    secondary_muscles = Column(Text, nullable=True)  # JSON list
    equipment = Column(Text, nullable=True)  # JSON list
    difficulty = Column(String(20), nullable=False, default="beginner")
    exercise_type = Column(String(30), nullable=False, default="strength")
    tracking_type = Column(String(30), nullable=False, default="weight_reps")
    instructions = Column(Text, nullable=True)  # JSON list of steps
    breathing = Column(Text, nullable=True)
    safety_tips = Column(Text, nullable=True)  # JSON list
    common_mistakes = Column(Text, nullable=True)  # JSON list
    media_type = Column(String(20), nullable=True)  # image | gif | video | youtube
    media_url = Column(String(1024), nullable=True)
    status = Column(String(20), nullable=False, default="active", index=True)  # active | archived
    created_by_user_id = Column(String(64), nullable=True)

    __table_args__ = (UniqueConstraint("scope_key", "slug", name="uq_exercises_scope_slug"),)


class WorkoutProgram(Base, TimestampMixin, TenantMixin):
    __tablename__ = "workout_programs"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    name = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    objective = Column(String(50), nullable=True)
    difficulty = Column(String(20), nullable=False, default="beginner")
    duration_weeks = Column(Integer, nullable=True)
    status = Column(String(20), nullable=False, default="draft", index=True)  # draft | published | archived
    created_by_user_id = Column(String(64), nullable=True)
    created_by_trainer_id = Column(String(64), ForeignKey("trainers.id", ondelete="SET NULL"), nullable=True, index=True)
    current_version_id = Column(String(64), nullable=True)  # latest published version


class WorkoutProgramVersion(Base, TimestampMixin, TenantMixin):
    """A program's structure at a point in time. Immutable once published."""
    __tablename__ = "workout_program_versions"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    program_id = Column(String(64), ForeignKey("workout_programs.id", ondelete="CASCADE"), nullable=False, index=True)
    version_number = Column(Integer, nullable=False)
    status = Column(String(20), nullable=False, default="draft")  # draft | published
    published_at = Column(DateTime, nullable=True)
    created_by_user_id = Column(String(64), nullable=True)
    change_note = Column(Text, nullable=True)

    __table_args__ = (UniqueConstraint("program_id", "version_number", name="uq_program_version_number"),)


class WorkoutAssignment(Base, TimestampMixin, TenantMixin):
    __tablename__ = "workout_assignments"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    member_id = Column(String(64), ForeignKey("members.id", ondelete="CASCADE"), nullable=False, index=True)
    program_id = Column(String(64), ForeignKey("workout_programs.id", ondelete="SET NULL"), nullable=True, index=True)
    program_version_id = Column(String(64), ForeignKey("workout_program_versions.id", ondelete="SET NULL"), nullable=True)
    title = Column(String(150), nullable=False)  # program name at assignment time
    trainer_id = Column(String(64), ForeignKey("trainers.id", ondelete="SET NULL"), nullable=True, index=True)
    assigned_by_user_id = Column(String(64), nullable=True)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)
    schedule_weekdays = Column(Text, nullable=True)  # JSON list of ints, Monday=0; empty => consecutive days
    status = Column(String(20), nullable=False, default="active", index=True)  # active | paused | completed | cancelled
    status_changed_on = Column(Date, nullable=True)  # when it last left "active"; caps the schedule
    notes = Column(Text, nullable=True)  # visible to the member
    is_customized = Column(Boolean, nullable=False, default=False)

    __table_args__ = (Index("ix_workout_assignments_ws_member_status", "workspace_id", "member_id", "status"),)


class WorkoutDay(Base, TimestampMixin, TenantMixin):
    """A training (or rest) day. Belongs to exactly one program version or one assignment."""
    __tablename__ = "workout_days"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    program_version_id = Column(String(64), ForeignKey("workout_program_versions.id", ondelete="CASCADE"), nullable=True, index=True)
    assignment_id = Column(String(64), ForeignKey("workout_assignments.id", ondelete="CASCADE"), nullable=True, index=True)
    position = Column(Integer, nullable=False)
    name = Column(String(150), nullable=False)
    is_rest_day = Column(Boolean, nullable=False, default=False)
    notes = Column(Text, nullable=True)


class WorkoutItem(Base, TimestampMixin, TenantMixin):
    """One prescribed exercise inside a day."""
    __tablename__ = "workout_items"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    day_id = Column(String(64), ForeignKey("workout_days.id", ondelete="CASCADE"), nullable=False, index=True)
    exercise_id = Column(String(64), ForeignKey("exercises.id", ondelete="RESTRICT"), nullable=False, index=True)
    position = Column(Integer, nullable=False)
    section = Column(String(20), nullable=False, default="main")  # warmup | main | cooldown
    group_type = Column(String(20), nullable=True)  # superset | circuit
    group_label = Column(String(10), nullable=True)  # items sharing a label in a day form one group
    sets = Column(Integer, nullable=True)
    reps_min = Column(Integer, nullable=True)
    reps_max = Column(Integer, nullable=True)
    target_weight_kg = Column(Float, nullable=True)
    duration_seconds = Column(Integer, nullable=True)
    distance_m = Column(Float, nullable=True)
    rest_seconds = Column(Integer, nullable=True)
    tempo = Column(String(20), nullable=True)
    notes = Column(Text, nullable=True)


class WorkoutAssignmentEvent(Base, TimestampMixin, TenantMixin):
    """Append-only history: who assigned, customised, rescheduled or changed status."""
    __tablename__ = "workout_assignment_events"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    assignment_id = Column(String(64), ForeignKey("workout_assignments.id", ondelete="CASCADE"), nullable=False, index=True)
    member_id = Column(String(64), ForeignKey("members.id", ondelete="CASCADE"), nullable=False, index=True)
    actor_user_id = Column(String(64), nullable=True)
    event_type = Column(String(40), nullable=False)
    details = Column(Text, nullable=True)  # JSON


class WorkoutSession(Base, TimestampMixin, TenantMixin):
    """One execution of a scheduled assignment day. At most one per (assignment, scheduled_date)."""
    __tablename__ = "workout_sessions"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    member_id = Column(String(64), ForeignKey("members.id", ondelete="CASCADE"), nullable=False, index=True)
    assignment_id = Column(String(64), ForeignKey("workout_assignments.id", ondelete="CASCADE"), nullable=False, index=True)
    day_id = Column(String(64), ForeignKey("workout_days.id", ondelete="SET NULL"), nullable=True)
    day_name = Column(String(150), nullable=False)
    scheduled_date = Column(Date, nullable=False, index=True)
    status = Column(String(20), nullable=False, default="in_progress", index=True)  # in_progress | paused | completed | abandoned
    started_at = Column(DateTime, nullable=False)
    paused_at = Column(DateTime, nullable=True)
    paused_seconds = Column(Integer, nullable=False, default=0)
    completed_at = Column(DateTime, nullable=True)
    duration_seconds = Column(Integer, nullable=True)
    member_notes = Column(Text, nullable=True)
    trainer_feedback = Column(Text, nullable=True)  # visible to the member
    feedback_by_user_id = Column(String(64), nullable=True)
    performed_by_user_id = Column(String(64), nullable=True)

    __table_args__ = (
        UniqueConstraint("assignment_id", "scheduled_date", name="uq_workout_session_occurrence"),
        Index("ix_workout_sessions_ws_member_date", "workspace_id", "member_id", "scheduled_date"),
    )


class WorkoutSetLog(Base, TimestampMixin, TenantMixin):
    """Actual performance for one set. Prescription is snapshotted so later plan edits don't rewrite history."""
    __tablename__ = "workout_set_logs"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    session_id = Column(String(64), ForeignKey("workout_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    member_id = Column(String(64), ForeignKey("members.id", ondelete="CASCADE"), nullable=False, index=True)
    item_id = Column(String(64), ForeignKey("workout_items.id", ondelete="SET NULL"), nullable=True)
    exercise_id = Column(String(64), ForeignKey("exercises.id", ondelete="RESTRICT"), nullable=False, index=True)
    exercise_name = Column(String(150), nullable=False)
    set_number = Column(Integer, nullable=False)
    reps = Column(Integer, nullable=True)
    weight_kg = Column(Float, nullable=True)
    duration_seconds = Column(Integer, nullable=True)
    distance_m = Column(Float, nullable=True)
    rest_seconds = Column(Integer, nullable=True)
    rpe = Column(Float, nullable=True)
    completed = Column(Boolean, nullable=False, default=False)
    target_reps_min = Column(Integer, nullable=True)
    target_reps_max = Column(Integer, nullable=True)
    target_weight_kg = Column(Float, nullable=True)

    __table_args__ = (
        UniqueConstraint("session_id", "item_id", "set_number", name="uq_set_log_session_item_set"),
        Index("ix_set_logs_ws_member_exercise", "workspace_id", "member_id", "exercise_id"),
    )


class MeasurementType(Base, TimestampMixin, TenantMixin):
    """Gym-defined measurement types in addition to the built-in ones."""
    __tablename__ = "measurement_types"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    key = Column(String(50), nullable=False)
    label = Column(String(100), nullable=False)
    unit = Column(String(20), nullable=False)
    min_value = Column(Float, nullable=True)
    max_value = Column(Float, nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)

    __table_args__ = (UniqueConstraint("workspace_id", "key", name="uq_measurement_type_key"),)


class BodyMeasurement(Base, TimestampMixin, TenantMixin):
    """One metric value on one date. Corrections void the row instead of deleting it."""
    __tablename__ = "body_measurements"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    member_id = Column(String(64), ForeignKey("members.id", ondelete="CASCADE"), nullable=False, index=True)
    measured_on = Column(Date, nullable=False)
    metric = Column(String(50), nullable=False)
    value = Column(Float, nullable=False)
    unit = Column(String(20), nullable=False)
    notes = Column(Text, nullable=True)
    recorded_by_user_id = Column(String(64), nullable=True)
    recorded_by_role = Column(String(20), nullable=True)
    voided_at = Column(DateTime, nullable=True)
    voided_by_user_id = Column(String(64), nullable=True)

    __table_args__ = (Index("ix_body_measurements_ws_member_metric_date", "workspace_id", "member_id", "metric", "measured_on"),)


class FitnessAssessment(Base, TimestampMixin, TenantMixin):
    __tablename__ = "fitness_assessments"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    member_id = Column(String(64), ForeignKey("members.id", ondelete="CASCADE"), nullable=False, index=True)
    trainer_id = Column(String(64), ForeignKey("trainers.id", ondelete="SET NULL"), nullable=True)
    assessed_by_user_id = Column(String(64), nullable=True)
    assessed_on = Column(Date, nullable=False)
    goals = Column(Text, nullable=True)
    fitness_level = Column(String(20), nullable=True)  # beginner | intermediate | advanced
    limitations = Column(Text, nullable=True)
    resting_heart_rate = Column(Integer, nullable=True)
    summary = Column(Text, nullable=True)  # shared with the member
    private_notes = Column(Text, nullable=True)  # trainer/staff only
