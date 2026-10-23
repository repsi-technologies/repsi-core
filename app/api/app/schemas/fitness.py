from datetime import date, datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

Difficulty = Literal["beginner", "intermediate", "advanced"]
ExerciseType = Literal["strength", "hypertrophy", "endurance", "power", "cardio", "mobility"]
TrackingType = Literal["weight_reps", "reps", "duration", "distance", "duration_distance"]
MediaType = Literal["image", "gif", "video", "youtube"]
Section = Literal["warmup", "main", "cooldown"]
GroupType = Literal["superset", "circuit"]
ProgramStatus = Literal["draft", "published", "archived"]
AssignmentStatus = Literal["active", "paused", "completed", "cancelled"]

CATEGORIES = ["chest", "back", "legs", "shoulders", "arms", "core", "full_body", "cardio", "mobility"]
MOVEMENT_PATTERNS = [
    "squat", "hinge", "lunge", "horizontal_push", "vertical_push", "horizontal_pull", "vertical_pull",
    "isolation", "anti_extension", "flexion", "rotation", "plyometric", "locomotion", "mobility", "carry",
]
MUSCLES = [
    "chest", "upper_chest", "front_delts", "side_delts", "rear_delts", "rotator_cuff", "traps", "lats",
    "upper_back", "lower_back", "biceps", "triceps", "forearms", "core", "obliques", "hip_flexors",
    "glutes", "quadriceps", "hamstrings", "calves", "full_body", "shoulders",
]
EQUIPMENT = [
    "bodyweight", "barbell", "dumbbell", "kettlebell", "cable", "machine", "bench", "squat_rack",
    "pull_up_bar", "resistance_band", "medicine_ball", "treadmill", "rower", "bike", "other",
]
OBJECTIVES = ["strength", "hypertrophy", "fat_loss", "endurance", "general_fitness", "mobility", "rehab"]


def _clean_list(values: Optional[List[str]], max_items: int = 30, max_len: int = 500) -> List[str]:
    out = []
    for v in values or []:
        v = (v or "").strip()
        if v:
            out.append(v[:max_len])
    return out[:max_items]


# ---------------------------------------------------------------- exercises

class ExerciseBase(BaseModel):
    name: str = Field(min_length=2, max_length=150)
    description: Optional[str] = Field(default=None, max_length=4000)
    category: str
    movement_pattern: Optional[str] = None
    primary_muscles: List[str] = Field(default_factory=list)
    secondary_muscles: List[str] = Field(default_factory=list)
    equipment: List[str] = Field(default_factory=list)
    difficulty: Difficulty = "beginner"
    exercise_type: ExerciseType = "strength"
    tracking_type: TrackingType = "weight_reps"
    instructions: List[str] = Field(default_factory=list)
    breathing: Optional[str] = Field(default=None, max_length=1000)
    safety_tips: List[str] = Field(default_factory=list)
    common_mistakes: List[str] = Field(default_factory=list)
    media_type: Optional[MediaType] = None
    media_url: Optional[str] = Field(default=None, max_length=1024)

    @field_validator("name")
    @classmethod
    def _strip_name(cls, v: str) -> str:
        v = " ".join(v.split())
        if len(v) < 2:
            raise ValueError("Exercise name is required.")
        return v

    @field_validator("category")
    @classmethod
    def _category(cls, v: str) -> str:
        if v not in CATEGORIES:
            raise ValueError(f"Category must be one of: {', '.join(CATEGORIES)}.")
        return v

    @field_validator("movement_pattern")
    @classmethod
    def _pattern(cls, v: Optional[str]) -> Optional[str]:
        if v and v not in MOVEMENT_PATTERNS:
            raise ValueError("Unknown movement pattern.")
        return v or None

    @field_validator("primary_muscles", "secondary_muscles")
    @classmethod
    def _muscles(cls, v: List[str]) -> List[str]:
        bad = [m for m in v if m not in MUSCLES]
        if bad:
            raise ValueError(f"Unknown muscle group(s): {', '.join(bad)}.")
        return list(dict.fromkeys(v))

    @field_validator("equipment")
    @classmethod
    def _equipment(cls, v: List[str]) -> List[str]:
        bad = [e for e in v if e not in EQUIPMENT]
        if bad:
            raise ValueError(f"Unknown equipment: {', '.join(bad)}.")
        return list(dict.fromkeys(v))

    @field_validator("instructions", "safety_tips", "common_mistakes")
    @classmethod
    def _text_lists(cls, v: List[str]) -> List[str]:
        return _clean_list(v)

    @model_validator(mode="after")
    def _media_pair(self):
        if bool(self.media_url) != bool(self.media_type):
            raise ValueError("Provide both a media type and a media URL, or neither.")
        if not self.primary_muscles:
            raise ValueError("Select at least one primary muscle group.")
        return self


class ExerciseCreate(ExerciseBase):
    pass


class ExerciseUpdate(ExerciseBase):
    pass


class ExerciseResponse(BaseModel):
    id: str
    scope: Literal["global", "gym"]
    name: str
    slug: str
    description: Optional[str] = None
    category: str
    movement_pattern: Optional[str] = None
    primary_muscles: List[str]
    secondary_muscles: List[str]
    equipment: List[str]
    difficulty: str
    exercise_type: str
    tracking_type: str
    instructions: List[str]
    breathing: Optional[str] = None
    safety_tips: List[str]
    common_mistakes: List[str]
    media_type: Optional[str] = None
    media_url: Optional[str] = None
    status: str
    created_by_user_id: Optional[str] = None
    can_edit: bool = False
    created_at: datetime
    updated_at: datetime


class ExerciseListResponse(BaseModel):
    items: List[ExerciseResponse]
    total: int
    page: int
    page_size: int


# ---------------------------------------------------------------- plan structure

class ItemIn(BaseModel):
    id: Optional[str] = None  # set when editing an existing assignment item in place
    exercise_id: str
    section: Section = "main"
    group_type: Optional[GroupType] = None
    group_label: Optional[str] = Field(default=None, max_length=10)
    sets: Optional[int] = Field(default=None, ge=1, le=20)
    reps_min: Optional[int] = Field(default=None, ge=1, le=200)
    reps_max: Optional[int] = Field(default=None, ge=1, le=200)
    target_weight_kg: Optional[float] = Field(default=None, ge=0, le=1000)
    duration_seconds: Optional[int] = Field(default=None, ge=1, le=6 * 3600)
    distance_m: Optional[float] = Field(default=None, gt=0, le=200000)
    rest_seconds: Optional[int] = Field(default=None, ge=0, le=1800)
    tempo: Optional[str] = Field(default=None, max_length=20)
    notes: Optional[str] = Field(default=None, max_length=1000)

    @model_validator(mode="after")
    def _consistent(self):
        if self.reps_min and self.reps_max and self.reps_min > self.reps_max:
            raise ValueError("Minimum reps cannot exceed maximum reps.")
        if self.reps_max and not self.reps_min:
            self.reps_min = self.reps_max
        if self.group_type and not self.group_label:
            raise ValueError("Supersets and circuits need a group label (e.g. A).")
        if self.group_label and not self.group_type:
            self.group_type = "superset"
        if not any([self.sets, self.reps_min, self.duration_seconds, self.distance_m]):
            raise ValueError("Each exercise needs at least sets, reps, a duration or a distance.")
        return self


class DayIn(BaseModel):
    id: Optional[str] = None
    name: str = Field(min_length=1, max_length=150)
    is_rest_day: bool = False
    notes: Optional[str] = Field(default=None, max_length=2000)
    items: List[ItemIn] = Field(default_factory=list, max_length=40)

    @model_validator(mode="after")
    def _rest_has_no_items(self):
        if self.is_rest_day and self.items:
            raise ValueError(f"Rest day '{self.name}' cannot contain exercises.")
        return self


class ItemOut(BaseModel):
    id: str
    exercise_id: str
    exercise_name: str
    exercise_category: Optional[str] = None
    tracking_type: str = "weight_reps"
    media_type: Optional[str] = None
    media_url: Optional[str] = None
    position: int
    section: str
    group_type: Optional[str] = None
    group_label: Optional[str] = None
    sets: Optional[int] = None
    reps_min: Optional[int] = None
    reps_max: Optional[int] = None
    target_weight_kg: Optional[float] = None
    duration_seconds: Optional[int] = None
    distance_m: Optional[float] = None
    rest_seconds: Optional[int] = None
    tempo: Optional[str] = None
    notes: Optional[str] = None


class DayOut(BaseModel):
    id: str
    position: int
    name: str
    is_rest_day: bool
    notes: Optional[str] = None
    items: List[ItemOut]


# ---------------------------------------------------------------- programs

class ProgramBase(BaseModel):
    name: str = Field(min_length=2, max_length=150)
    description: Optional[str] = Field(default=None, max_length=4000)
    objective: Optional[str] = None
    difficulty: Difficulty = "beginner"
    duration_weeks: Optional[int] = Field(default=None, ge=1, le=104)

    @field_validator("objective")
    @classmethod
    def _objective(cls, v: Optional[str]) -> Optional[str]:
        if v and v not in OBJECTIVES:
            raise ValueError("Unknown program objective.")
        return v or None


class ProgramSave(ProgramBase):
    days: List[DayIn] = Field(default_factory=list, max_length=28)
    change_note: Optional[str] = Field(default=None, max_length=500)
    publish: bool = False


class ProgramVersionSummary(BaseModel):
    id: str
    version_number: int
    status: str
    published_at: Optional[datetime] = None
    change_note: Optional[str] = None
    created_at: datetime
    assignment_count: int = 0


class ProgramResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    objective: Optional[str] = None
    difficulty: str
    duration_weeks: Optional[int] = None
    status: str
    created_by_user_id: Optional[str] = None
    created_by_name: Optional[str] = None
    current_version_id: Optional[str] = None
    current_version_number: Optional[int] = None
    has_unpublished_changes: bool = False
    training_days: int = 0
    exercise_count: int = 0
    active_assignments: int = 0
    can_edit: bool = False
    created_at: datetime
    updated_at: datetime


class ProgramDetailResponse(ProgramResponse):
    editing_version_id: Optional[str] = None
    editing_version_number: Optional[int] = None
    days: List[DayOut]
    versions: List[ProgramVersionSummary]


class ProgramListResponse(BaseModel):
    items: List[ProgramResponse]
    total: int
    page: int
    page_size: int


class VersionDetailResponse(BaseModel):
    id: str
    program_id: str
    version_number: int
    status: str
    days: List[DayOut]


# ---------------------------------------------------------------- assignments

class ScheduleIn(BaseModel):
    start_date: date
    end_date: Optional[date] = None
    schedule_weekdays: List[int] = Field(default_factory=list)

    @field_validator("schedule_weekdays")
    @classmethod
    def _weekdays(cls, v: List[int]) -> List[int]:
        if any(d < 0 or d > 6 for d in v):
            raise ValueError("Weekdays must be between 0 (Monday) and 6 (Sunday).")
        return sorted(set(v))

    @model_validator(mode="after")
    def _range(self):
        if self.end_date and self.end_date < self.start_date:
            raise ValueError("End date cannot be before the start date.")
        return self


class AssignmentCreate(ScheduleIn):
    program_id: str
    member_ids: List[str] = Field(min_length=1, max_length=100)
    notes: Optional[str] = Field(default=None, max_length=2000)


class AssignmentUpdate(BaseModel):
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    clear_end_date: bool = False
    schedule_weekdays: Optional[List[int]] = None
    status: Optional[AssignmentStatus] = None
    notes: Optional[str] = Field(default=None, max_length=2000)
    reason: Optional[str] = Field(default=None, max_length=500)

    @field_validator("schedule_weekdays")
    @classmethod
    def _weekdays(cls, v: Optional[List[int]]) -> Optional[List[int]]:
        if v is None:
            return v
        if any(d < 0 or d > 6 for d in v):
            raise ValueError("Weekdays must be between 0 (Monday) and 6 (Sunday).")
        return sorted(set(v))


class AssignmentPlanUpdate(BaseModel):
    days: List[DayIn] = Field(min_length=1, max_length=28)
    reason: Optional[str] = Field(default=None, max_length=500)


class AssignmentStats(BaseModel):
    scheduled_to_date: int
    completed: int
    missed: int
    adherence_pct: Optional[float] = None
    next_date: Optional[date] = None


class AssignmentResponse(BaseModel):
    id: str
    member_id: str
    member_name: str
    program_id: Optional[str] = None
    program_version_id: Optional[str] = None
    program_version_number: Optional[int] = None
    newer_version_available: bool = False
    title: str
    trainer_id: Optional[str] = None
    trainer_name: Optional[str] = None
    assigned_by_user_id: Optional[str] = None
    assigned_by_name: Optional[str] = None
    start_date: date
    end_date: Optional[date] = None
    schedule_weekdays: List[int]
    status: str
    notes: Optional[str] = None
    is_customized: bool
    stats: Optional[AssignmentStats] = None
    created_at: datetime


class AssignmentDetailResponse(AssignmentResponse):
    days: List[DayOut]


class AssignmentEventResponse(BaseModel):
    id: str
    event_type: str
    actor_user_id: Optional[str] = None
    actor_name: Optional[str] = None
    details: Optional[dict] = None
    created_at: datetime


class BulkAssignResult(BaseModel):
    created: List[AssignmentResponse]
    skipped: List[dict]


# ---------------------------------------------------------------- schedule & sessions

class ScheduleOccurrence(BaseModel):
    date: date
    assignment_id: str
    assignment_title: str
    member_id: str
    day_id: Optional[str] = None
    day_name: str
    is_rest_day: bool
    exercise_count: int
    status: Literal["upcoming", "today", "missed", "in_progress", "paused", "completed", "abandoned", "rest"]
    session_id: Optional[str] = None


class SessionStart(BaseModel):
    assignment_id: str
    scheduled_date: date


class SetIn(BaseModel):
    item_id: str
    set_number: int = Field(ge=1, le=20)
    reps: Optional[int] = Field(default=None, ge=0, le=500)
    weight_kg: Optional[float] = Field(default=None, ge=0, le=1000)
    duration_seconds: Optional[int] = Field(default=None, ge=0, le=6 * 3600)
    distance_m: Optional[float] = Field(default=None, ge=0, le=200000)
    rest_seconds: Optional[int] = Field(default=None, ge=0, le=1800)
    rpe: Optional[float] = Field(default=None, ge=1, le=10)
    completed: bool = False


class SetsSave(BaseModel):
    sets: List[SetIn] = Field(max_length=400)
    member_notes: Optional[str] = Field(default=None, max_length=2000)


class SetOut(BaseModel):
    id: str
    item_id: Optional[str] = None
    exercise_id: str
    exercise_name: str
    set_number: int
    reps: Optional[int] = None
    weight_kg: Optional[float] = None
    duration_seconds: Optional[int] = None
    distance_m: Optional[float] = None
    rest_seconds: Optional[int] = None
    rpe: Optional[float] = None
    completed: bool
    target_reps_min: Optional[int] = None
    target_reps_max: Optional[int] = None
    target_weight_kg: Optional[float] = None

    model_config = ConfigDict(from_attributes=True)


class SessionResponse(BaseModel):
    id: str
    member_id: str
    member_name: Optional[str] = None
    assignment_id: str
    assignment_title: Optional[str] = None
    day_id: Optional[str] = None
    day_name: str
    scheduled_date: date
    status: str
    started_at: datetime
    paused_at: Optional[datetime] = None
    paused_seconds: int
    completed_at: Optional[datetime] = None
    duration_seconds: Optional[int] = None
    active_seconds: int
    member_notes: Optional[str] = None
    trainer_feedback: Optional[str] = None
    completed_sets: int
    total_volume_kg: float


class SessionDetailResponse(SessionResponse):
    items: List[ItemOut]
    sets: List[SetOut]


class SessionFeedback(BaseModel):
    trainer_feedback: str = Field(min_length=1, max_length=2000)


# ---------------------------------------------------------------- measurements

class MeasurementTypeOut(BaseModel):
    key: str
    label: str
    unit: str
    min_value: Optional[float] = None
    max_value: Optional[float] = None
    built_in: bool


class MeasurementTypeCreate(BaseModel):
    key: str = Field(min_length=2, max_length=50, pattern=r"^[a-z][a-z0-9_]*$")
    label: str = Field(min_length=2, max_length=100)
    unit: str = Field(min_length=1, max_length=20)
    min_value: Optional[float] = None
    max_value: Optional[float] = None


class MeasurementValue(BaseModel):
    metric: str
    value: float


class MeasurementCreate(BaseModel):
    measured_on: date
    values: List[MeasurementValue] = Field(min_length=1, max_length=30)
    notes: Optional[str] = Field(default=None, max_length=1000)


class MeasurementOut(BaseModel):
    id: str
    member_id: str
    measured_on: date
    metric: str
    value: float
    unit: str
    notes: Optional[str] = None
    recorded_by_user_id: Optional[str] = None
    recorded_by_name: Optional[str] = None
    recorded_by_role: Optional[str] = None
    created_at: datetime


# ---------------------------------------------------------------- assessments

class AssessmentCreate(BaseModel):
    assessed_on: date
    goals: Optional[str] = Field(default=None, max_length=2000)
    fitness_level: Optional[Difficulty] = None
    limitations: Optional[str] = Field(default=None, max_length=2000)
    resting_heart_rate: Optional[int] = Field(default=None, ge=25, le=220)
    summary: Optional[str] = Field(default=None, max_length=4000)
    private_notes: Optional[str] = Field(default=None, max_length=4000)


class AssessmentMemberOut(BaseModel):
    """What the member sees: no private trainer notes."""
    id: str
    member_id: str
    assessed_on: date
    goals: Optional[str] = None
    fitness_level: Optional[str] = None
    limitations: Optional[str] = None
    resting_heart_rate: Optional[int] = None
    summary: Optional[str] = None
    assessed_by_name: Optional[str] = None
    created_at: datetime


class AssessmentStaffOut(AssessmentMemberOut):
    private_notes: Optional[str] = None


# ---------------------------------------------------------------- progress

class SeriesPoint(BaseModel):
    date: date
    value: float


class StrengthSeries(BaseModel):
    exercise_id: str
    exercise_name: str
    points: List[dict]  # {date, top_weight_kg, top_set_reps, estimated_1rm_kg, volume_kg}


class PersonalRecord(BaseModel):
    exercise_id: str
    exercise_name: str
    kind: Literal["heaviest_weight", "estimated_1rm", "most_reps", "longest_duration", "longest_distance"]
    value: float
    unit: str
    reps: Optional[int] = None
    achieved_on: date
    session_id: str


class ProgressResponse(BaseModel):
    member_id: str
    member_name: str
    date_from: date
    date_to: date
    measurements: dict  # metric -> {label, unit, points: [SeriesPoint]}
    measurement_summary: List[dict]  # metric, label, unit, first, last, change, first_date, last_date
    adherence: dict  # scheduled, completed, missed, rate_pct
    weekly: List[dict]  # week_start, scheduled, completed
    strength: List[StrengthSeries]
    personal_records: List[PersonalRecord]
    recent_sessions: List[SessionResponse]


class OverviewMember(BaseModel):
    member_id: str
    member_name: str
    trainer_name: Optional[str] = None
    active_assignments: int
    completed_30d: int
    missed_30d: int
    adherence_pct: Optional[float] = None
    last_session_date: Optional[date] = None


class OverviewResponse(BaseModel):
    scope: Literal["gym", "trainer"]
    active_assignments: int
    members_with_plans: int
    sessions_completed_30d: int
    sessions_missed_30d: int
    adherence_pct: Optional[float] = None
    members: List[OverviewMember]


class MyFitnessContext(BaseModel):
    kind: Literal["gym", "trainer", "member"]
    member_id: Optional[str] = None
    trainer_id: Optional[str] = None
    can_manage_exercises: bool
    can_manage_programs: bool
    can_assign: bool
