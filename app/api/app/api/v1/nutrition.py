"""Diet plans, meal/water logs, adherence and trainer-member chat. Authorization lives in app/services/nutrition.py."""
from datetime import date, datetime
from typing import List, Literal, Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.middleware.tenant import TenantContext, get_current_tenant
from app.services.nutrition import REPORT_REASONS, REPORT_STATUSES, ChatReportService, ChatService, NutritionService

router = APIRouter(prefix="/nutrition", tags=["Nutrition"])
chat_router = APIRouter(prefix="/chat", tags=["Chat"])


class FoodItem(BaseModel):
    food: str = Field(min_length=1, max_length=150)
    portion: Optional[str] = Field(None, max_length=60)
    calories: Optional[float] = Field(None, ge=0, le=5000)
    protein: Optional[float] = Field(None, ge=0, le=500)
    carbs: Optional[float] = Field(None, ge=0, le=1000)
    fat: Optional[float] = Field(None, ge=0, le=500)


class Meal(BaseModel):
    slot: str = Field(min_length=1, max_length=30)
    time: Optional[str] = Field(None, max_length=10)
    title: Optional[str] = Field(None, max_length=120)
    items: List[FoodItem] = Field(default_factory=list, max_length=40)


class DietPlanSave(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    goal: Optional[str] = Field(None, max_length=100)
    diet_type: Optional[Literal["vegetarian", "vegan", "eggetarian", "non_vegetarian"]] = None
    meals: List[Meal] = Field(min_length=1, max_length=12)
    calories_target: Optional[float] = Field(None, ge=0, le=10000)
    protein_target: Optional[float] = Field(None, ge=0, le=1000)
    carbs_target: Optional[float] = Field(None, ge=0, le=2000)
    fat_target: Optional[float] = Field(None, ge=0, le=1000)
    water_ml_target: Optional[int] = Field(None, ge=0, le=10000)
    notes: Optional[str] = Field(None, max_length=2000)
    change_summary: Optional[str] = Field(None, max_length=255)


class StatusIn(BaseModel):
    status: str


class DietAssignIn(BaseModel):
    plan_id: str
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    notes: Optional[str] = Field(None, max_length=1000)


class MealLogIn(BaseModel):
    member_id: Optional[str] = None
    log_date: date
    slot: str = Field(min_length=1, max_length=30)
    status: str = "eaten"
    description: Optional[str] = Field(None, max_length=500)
    calories: Optional[float] = Field(None, ge=0, le=10000)
    protein: Optional[float] = Field(None, ge=0, le=1000)
    carbs: Optional[float] = Field(None, ge=0, le=2000)
    fat: Optional[float] = Field(None, ge=0, le=1000)
    notes: Optional[str] = Field(None, max_length=500)
    client_ref: Optional[str] = Field(None, max_length=64)


class WaterLogIn(BaseModel):
    member_id: Optional[str] = None
    log_date: date
    amount_ml: int = Field(gt=0, le=5000)
    client_ref: Optional[str] = Field(None, max_length=64)


def svc(tenant: TenantContext = Depends(get_current_tenant), db: Session = Depends(get_db)) -> NutritionService:
    return NutritionService(db, tenant)


def chat_svc(tenant: TenantContext = Depends(get_current_tenant), db: Session = Depends(get_db)) -> ChatService:
    return ChatService(db, tenant)


@router.get("/plans")
def list_plans(search: Optional[str] = None, include_archived: bool = False, s: NutritionService = Depends(svc)):
    return s.list_plans(search, include_archived)


@router.post("/plans", status_code=201)
def create_plan(data: DietPlanSave, s: NutritionService = Depends(svc)):
    return s.create_plan(data)


@router.get("/plans/{plan_id}")
def get_plan(plan_id: str, s: NutritionService = Depends(svc)):
    return s.get_plan(plan_id)


@router.put("/plans/{plan_id}")
def revise_plan(plan_id: str, data: DietPlanSave, s: NutritionService = Depends(svc)):
    return s.revise_plan(plan_id, data)


@router.post("/plans/{plan_id}/status")
def set_plan_status(plan_id: str, data: StatusIn, s: NutritionService = Depends(svc)):
    return s.set_plan_status(plan_id, data.status)


@router.post("/members/{member_id}/assignments", status_code=201)
def assign_plan(member_id: str, data: DietAssignIn, s: NutritionService = Depends(svc)):
    return s.assign(member_id, data)


@router.post("/assignments/{assignment_id}/end")
def end_assignment(assignment_id: str, s: NutritionService = Depends(svc)):
    return s.end_assignment(assignment_id)


@router.get("/assignments")
def member_assignments(member_id: Optional[str] = None, s: NutritionService = Depends(svc)):
    return s.member_assignments(member_id)


@router.get("/day")
def nutrition_day(member_id: Optional[str] = None, on: Optional[date] = None, s: NutritionService = Depends(svc)):
    return s.day(member_id, on)


@router.post("/meals", status_code=201)
def log_meal(data: MealLogIn, s: NutritionService = Depends(svc)):
    return s.log_meal(data)


@router.post("/water", status_code=201)
def log_water(data: WaterLogIn, s: NutritionService = Depends(svc)):
    return s.log_water(data)


@router.get("/adherence")
def adherence(member_id: Optional[str] = None, days: int = Query(7, ge=1, le=90), s: NutritionService = Depends(svc)):
    return s.adherence(member_id, days)


class OpenConversationIn(BaseModel):
    member_id: Optional[str] = None
    trainer_id: Optional[str] = None


class MessageIn(BaseModel):
    body: Optional[str] = Field(None, max_length=4000)
    attachment_type: Optional[Literal["workout_assignment", "diet_assignment"]] = None
    attachment_ref: Optional[str] = Field(None, max_length=64)
    client_ref: Optional[str] = Field(None, max_length=64)


@chat_router.get("/conversations")
def list_conversations(s: ChatService = Depends(chat_svc)):
    return s.list()


@chat_router.post("/conversations")
def open_conversation(data: OpenConversationIn, s: ChatService = Depends(chat_svc)):
    return s.open(member_id=data.member_id, trainer_id=data.trainer_id)


@chat_router.get("/conversations/{conversation_id}/messages")
def list_messages(conversation_id: str, before: Optional[datetime] = None, limit: int = Query(50, ge=1, le=100),
                  s: ChatService = Depends(chat_svc)):
    return s.messages(conversation_id, before, limit)


@chat_router.post("/conversations/{conversation_id}/messages", status_code=201)
def send_message(conversation_id: str, data: MessageIn, s: ChatService = Depends(chat_svc)):
    return s.send(conversation_id, data)


@chat_router.post("/conversations/{conversation_id}/read")
def mark_read(conversation_id: str, s: ChatService = Depends(chat_svc)):
    return s.mark_read(conversation_id)


# ─── Chat reports ────────────────────────────────────────────────────────────

class ChatReportIn(BaseModel):
    reason: Literal[REPORT_REASONS]  # type: ignore[valid-type]
    details: Optional[str] = Field(None, max_length=2000)
    message_id: Optional[str] = Field(None, max_length=64)


class ChatReportReviewIn(BaseModel):
    status: Literal[REPORT_STATUSES]  # type: ignore[valid-type]
    note: Optional[str] = Field(None, max_length=2000)


def report_svc(tenant: TenantContext = Depends(get_current_tenant), db: Session = Depends(get_db)) -> ChatReportService:
    return ChatReportService(db, tenant)


@chat_router.post("/conversations/{conversation_id}/report", status_code=201)
def report_conversation(conversation_id: str, data: ChatReportIn, s: ChatReportService = Depends(report_svc)):
    """A participant flags the conversation (optionally one message) for the gym to review."""
    return s.file(conversation_id, data)


@chat_router.get("/reports/mine")
def my_reports(s: ChatReportService = Depends(report_svc)):
    return s.mine()


@chat_router.get("/reports")
def list_reports(status: Optional[Literal[REPORT_STATUSES]] = None, s: ChatReportService = Depends(report_svc)):  # type: ignore[valid-type]
    return s.list(status)


@chat_router.get("/reports/{report_id}")
def report_detail(report_id: str, s: ChatReportService = Depends(report_svc)):
    return s.detail(report_id)


@chat_router.patch("/reports/{report_id}")
def review_report(report_id: str, data: ChatReportReviewIn, s: ChatReportService = Depends(report_svc)):
    return s.update(report_id, data.status, data.note)
