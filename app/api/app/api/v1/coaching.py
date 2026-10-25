"""Member goals, workout suggestions and trainer requests. Authorization lives in app/services/coaching.py."""
from typing import List, Literal, Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field, field_validator
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.middleware.tenant import TenantContext, get_current_tenant
from app.services.coaching import FOCUS_AREAS, CoachingService

router = APIRouter(prefix="/coaching", tags=["Coaching"])


def svc(tenant: TenantContext = Depends(get_current_tenant), db: Session = Depends(get_db)) -> CoachingService:
    return CoachingService(db, tenant)


class GoalIn(BaseModel):
    goal: Literal["fat_loss", "muscle_gain", "strength", "endurance", "general_fitness", "mobility"]
    fitness_level: Literal["beginner", "intermediate", "advanced"] = "beginner"
    days_per_week: int = Field(3, ge=2, le=6)
    session_minutes: int = Field(45, ge=15, le=120)
    focus_areas: List[str] = Field(default_factory=list, max_length=len(FOCUS_AREAS))
    notes: Optional[str] = Field(None, max_length=1000)

    @field_validator("focus_areas")
    @classmethod
    def _focus(cls, v: List[str]) -> List[str]:
        unknown = [f for f in v if f not in FOCUS_AREAS]
        if unknown:
            raise ValueError(f"Unknown focus area: {unknown[0]}")
        return v


class TrainerRequestIn(BaseModel):
    kind: Literal["trainer", "personal_training"] = "trainer"
    preferred_trainer_id: Optional[str] = Field(None, max_length=64)
    message: Optional[str] = Field(None, max_length=1000)


class ApproveIn(BaseModel):
    trainer_id: str = Field(min_length=1, max_length=64)
    note: Optional[str] = Field(None, max_length=1000)


class DeclineIn(BaseModel):
    note: Optional[str] = Field(None, max_length=1000)


@router.get("/me")
def my_coaching(s: CoachingService = Depends(svc)):
    return s.me()


@router.put("/me/goal")
def set_my_goal(data: GoalIn, s: CoachingService = Depends(svc)):
    return s.set_goal(data)


@router.get("/me/goal/history")
def my_goal_history(s: CoachingService = Depends(svc)):
    return s.goal_history()


@router.get("/me/suggestions")
def my_suggestions(s: CoachingService = Depends(svc)):
    return s.my_suggestions()


@router.get("/trainers")
def available_trainers(s: CoachingService = Depends(svc)):
    return s.available_trainers()


@router.post("/requests", status_code=201)
def create_request(data: TrainerRequestIn, s: CoachingService = Depends(svc)):
    return s.create_request(data)


@router.post("/requests/{request_id}/cancel")
def cancel_request(request_id: str, s: CoachingService = Depends(svc)):
    return s.cancel_request(request_id)


@router.get("/requests")
def list_requests(status: Optional[Literal["pending", "approved", "declined", "cancelled"]] = Query(None),
                  s: CoachingService = Depends(svc)):
    return s.list_requests(status)


@router.post("/requests/{request_id}/approve")
def approve_request(request_id: str, data: ApproveIn, s: CoachingService = Depends(svc)):
    return s.approve(request_id, data.trainer_id, data.note)


@router.post("/requests/{request_id}/decline")
def decline_request(request_id: str, data: DeclineIn, s: CoachingService = Depends(svc)):
    return s.decline(request_id, data.note)


@router.get("/members/{member_id}/goal")
def member_goal(member_id: str, s: CoachingService = Depends(svc)):
    return s.member_goal(member_id)
