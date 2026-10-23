"""Workout & fitness management API. Authorization lives in app/services/fitness.py (FitnessActor)."""
from datetime import date
from typing import List, Literal, Optional

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.middleware.entitlements import require_feature
from app.middleware.tenant import TenantContext, get_current_tenant
from app.schemas.fitness import (
    CATEGORIES, EQUIPMENT, MOVEMENT_PATTERNS, MUSCLES, OBJECTIVES,
    AssessmentCreate, AssessmentStaffOut, AssignmentCreate, AssignmentDetailResponse, AssignmentEventResponse,
    AssignmentPlanUpdate, AssignmentResponse, AssignmentUpdate, BulkAssignResult, ExerciseCreate,
    ExerciseListResponse, ExerciseResponse, ExerciseUpdate, MeasurementCreate, MeasurementOut,
    MeasurementTypeCreate, MeasurementTypeOut, MyFitnessContext, OverviewResponse, ProgramDetailResponse,
    ProgramListResponse, ProgramSave, ProgressResponse, ScheduleOccurrence, SessionDetailResponse,
    SessionFeedback, SessionStart, SetsSave, VersionDetailResponse,
)
from app.services.fitness import FitnessService

router = APIRouter(prefix="/fitness", tags=["Workout & Fitness"])


def svc(tenant: TenantContext = Depends(get_current_tenant), db: Session = Depends(get_db)) -> FitnessService:
    return FitnessService(db, tenant)


@router.get("/me", response_model=MyFitnessContext)
def my_context(s: FitnessService = Depends(svc)):
    return s.context()


@router.get("/meta")
def meta(s: FitnessService = Depends(svc)):
    return {"categories": CATEGORIES, "movement_patterns": MOVEMENT_PATTERNS, "muscles": MUSCLES,
            "equipment": EQUIPMENT, "objectives": OBJECTIVES, "measurement_types": s.measurement_types()}


# ------------------------------------------------------------ exercises

@router.get("/exercises", response_model=ExerciseListResponse)
def list_exercises(
    search: Optional[str] = Query(None, max_length=100),
    category: Optional[str] = None,
    muscle: Optional[str] = None,
    equipment: Optional[str] = None,
    difficulty: Optional[str] = None,
    exercise_type: Optional[str] = None,
    scope: Optional[Literal["global", "gym"]] = None,
    include_archived: bool = False,
    sort: str = "name",
    page: int = Query(1, ge=1),
    page_size: int = Query(24, ge=1, le=100),
    s: FitnessService = Depends(svc),
):
    return s.list_exercises(search=search, category=category, muscle=muscle, equipment=equipment,
                            difficulty=difficulty, exercise_type=exercise_type, scope=scope,
                            include_archived=include_archived, sort=sort, page=page, page_size=page_size)


@router.get("/exercises/{exercise_id}", response_model=ExerciseResponse)
def get_exercise(exercise_id: str, s: FitnessService = Depends(svc)):
    return s.exercise_out(s.get_exercise(exercise_id))


@router.post("/exercises", response_model=ExerciseResponse, status_code=status.HTTP_201_CREATED)
def create_exercise(data: ExerciseCreate, s: FitnessService = Depends(svc)):
    return s.exercise_out(s.create_exercise(data))


@router.put("/exercises/{exercise_id}", response_model=ExerciseResponse)
def update_exercise(exercise_id: str, data: ExerciseUpdate, s: FitnessService = Depends(svc)):
    return s.exercise_out(s.update_exercise(exercise_id, data))


@router.post("/exercises/{exercise_id}/archive", response_model=ExerciseResponse)
def archive_exercise(exercise_id: str, s: FitnessService = Depends(svc)):
    return s.exercise_out(s.set_exercise_status(exercise_id, "archived"))


@router.post("/exercises/{exercise_id}/restore", response_model=ExerciseResponse)
def restore_exercise(exercise_id: str, s: FitnessService = Depends(svc)):
    return s.exercise_out(s.set_exercise_status(exercise_id, "active"))


# ------------------------------------------------------------ programs

@router.get("/programs", response_model=ProgramListResponse)
def list_programs(
    search: Optional[str] = Query(None, max_length=100),
    status_filter: Optional[Literal["draft", "published", "archived"]] = Query(None, alias="status"),
    mine: bool = False,
    page: int = Query(1, ge=1),
    page_size: int = Query(24, ge=1, le=100),
    s: FitnessService = Depends(svc),
):
    return s.list_programs(search=search, status_filter=status_filter, mine=mine, page=page, page_size=page_size)


@router.post("/programs", response_model=ProgramDetailResponse, status_code=status.HTTP_201_CREATED,
             dependencies=[Depends(require_feature("basic_workouts"))])
def create_program(data: ProgramSave, s: FitnessService = Depends(svc)):
    return s.program_detail(s.create_program(data))


@router.get("/programs/{program_id}", response_model=ProgramDetailResponse)
def get_program(program_id: str, s: FitnessService = Depends(svc)):
    return s.program_detail(s._program(program_id))


@router.put("/programs/{program_id}", response_model=ProgramDetailResponse)
def update_program(program_id: str, data: ProgramSave, s: FitnessService = Depends(svc)):
    return s.program_detail(s.update_program(program_id, data))


@router.post("/programs/{program_id}/publish", response_model=ProgramDetailResponse)
def publish_program(program_id: str, s: FitnessService = Depends(svc)):
    return s.program_detail(s.publish_program(program_id))


@router.post("/programs/{program_id}/discard-draft", response_model=ProgramDetailResponse)
def discard_program_draft(program_id: str, s: FitnessService = Depends(svc)):
    return s.program_detail(s.discard_draft(program_id))


@router.post("/programs/{program_id}/duplicate", response_model=ProgramDetailResponse, status_code=status.HTTP_201_CREATED,
             dependencies=[Depends(require_feature("basic_workouts"))])
def duplicate_program(program_id: str, s: FitnessService = Depends(svc)):
    return s.program_detail(s.duplicate_program(program_id))


@router.post("/programs/{program_id}/archive", response_model=ProgramDetailResponse)
def archive_program(program_id: str, s: FitnessService = Depends(svc)):
    return s.program_detail(s.set_program_status(program_id, archive=True))


@router.post("/programs/{program_id}/restore", response_model=ProgramDetailResponse)
def restore_program(program_id: str, s: FitnessService = Depends(svc)):
    return s.program_detail(s.set_program_status(program_id, archive=False))


@router.get("/programs/{program_id}/versions/{version_id}", response_model=VersionDetailResponse)
def get_program_version(program_id: str, version_id: str, s: FitnessService = Depends(svc)):
    return s.version_detail(program_id, version_id)


# ------------------------------------------------------------ assignments

@router.post("/assignments", response_model=BulkAssignResult, status_code=status.HTTP_201_CREATED,
             dependencies=[Depends(require_feature("basic_workouts"))])
def create_assignments(data: AssignmentCreate, s: FitnessService = Depends(svc)):
    return s.create_assignments(data)


@router.get("/assignments")
def list_assignments(
    member_id: Optional[str] = None,
    status_filter: Optional[Literal["active", "paused", "completed", "cancelled"]] = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    s: FitnessService = Depends(svc),
):
    return s.list_assignments(member_id=member_id, status_filter=status_filter, page=page, page_size=page_size)


@router.get("/assignments/{assignment_id}", response_model=AssignmentDetailResponse)
def get_assignment(assignment_id: str, s: FitnessService = Depends(svc)):
    return s.assignment_detail(assignment_id)


@router.patch("/assignments/{assignment_id}", response_model=AssignmentResponse)
def update_assignment(assignment_id: str, data: AssignmentUpdate, s: FitnessService = Depends(svc)):
    return s.update_assignment(assignment_id, data)


@router.put("/assignments/{assignment_id}/plan", response_model=AssignmentDetailResponse)
def update_assignment_plan(assignment_id: str, data: AssignmentPlanUpdate, s: FitnessService = Depends(svc)):
    return s.update_assignment_plan(assignment_id, data)


@router.get("/assignments/{assignment_id}/events", response_model=List[AssignmentEventResponse])
def assignment_events(assignment_id: str, s: FitnessService = Depends(svc)):
    return s.assignment_events(assignment_id)


# ------------------------------------------------------------ schedule & sessions

@router.get("/schedule", response_model=List[ScheduleOccurrence])
def schedule(
    member_id: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    s: FitnessService = Depends(svc),
):
    return s.schedule(member_id, date_from, date_to)


@router.get("/sessions")
def list_sessions(
    member_id: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    status_filter: Optional[Literal["in_progress", "paused", "completed", "abandoned"]] = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    s: FitnessService = Depends(svc),
):
    return s.list_sessions(member_id=member_id, date_from=date_from, date_to=date_to,
                           status_filter=status_filter, page=page, page_size=page_size)


@router.post("/sessions/start", response_model=SessionDetailResponse)
def start_session(data: SessionStart, s: FitnessService = Depends(svc)):
    return s.start_session(data)


@router.get("/sessions/{session_id}", response_model=SessionDetailResponse)
def get_session(session_id: str, s: FitnessService = Depends(svc)):
    return s.session_detail(session_id)


@router.put("/sessions/{session_id}/sets", response_model=SessionDetailResponse)
def save_sets(session_id: str, data: SetsSave, s: FitnessService = Depends(svc)):
    return s.save_sets(session_id, data)


@router.post("/sessions/{session_id}/{action}", response_model=SessionDetailResponse)
def session_action(session_id: str, action: Literal["pause", "resume", "complete", "abandon"], s: FitnessService = Depends(svc)):
    return s.transition_session(session_id, action)


@router.put("/sessions/{session_id}/feedback", response_model=SessionDetailResponse)
def session_feedback(session_id: str, data: SessionFeedback, s: FitnessService = Depends(svc)):
    return s.session_feedback(session_id, data.trainer_feedback)


# ------------------------------------------------------------ measurements & assessments

@router.get("/measurement-types", response_model=List[MeasurementTypeOut])
def measurement_types(s: FitnessService = Depends(svc)):
    return s.measurement_types()


@router.post("/measurement-types", response_model=MeasurementTypeOut, status_code=status.HTTP_201_CREATED)
def create_measurement_type(data: MeasurementTypeCreate, s: FitnessService = Depends(svc)):
    return s.create_measurement_type(data)


@router.get("/members/{member_id}/measurements", response_model=List[MeasurementOut])
def list_measurements(member_id: str, metric: Optional[str] = None, date_from: Optional[date] = None,
                      date_to: Optional[date] = None, s: FitnessService = Depends(svc)):
    return s.list_measurements(member_id, metric=metric, date_from=date_from, date_to=date_to)


@router.post("/members/{member_id}/measurements", response_model=List[MeasurementOut], status_code=status.HTTP_201_CREATED)
def record_measurements(member_id: str, data: MeasurementCreate, s: FitnessService = Depends(svc)):
    return s.record_measurements(member_id, data)


@router.delete("/members/{member_id}/measurements/{measurement_id}", status_code=status.HTTP_204_NO_CONTENT)
def void_measurement(member_id: str, measurement_id: str, s: FitnessService = Depends(svc)):
    s.void_measurement(member_id, measurement_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/members/{member_id}/assessments", response_model=List[AssessmentStaffOut], response_model_exclude_unset=True)
def list_assessments(member_id: str, s: FitnessService = Depends(svc)):
    return s.list_assessments(member_id)


@router.post("/members/{member_id}/assessments", response_model=AssessmentStaffOut, status_code=status.HTTP_201_CREATED)
def record_assessment(member_id: str, data: AssessmentCreate, s: FitnessService = Depends(svc)):
    return s.record_assessment(member_id, data)


# ------------------------------------------------------------ progress

@router.get("/members/{member_id}/progress", response_model=ProgressResponse)
def member_progress(member_id: str, date_from: Optional[date] = None, date_to: Optional[date] = None,
                    exercise_id: Optional[str] = None, s: FitnessService = Depends(svc)):
    return s.progress(member_id, date_from, date_to, exercise_id)


@router.get("/overview", response_model=OverviewResponse)
def overview(s: FitnessService = Depends(svc)):
    return s.overview()
