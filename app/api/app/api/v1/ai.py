from datetime import datetime, timedelta, timezone
from typing import Any, Literal, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import case, func
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.permissions import require_permission
from app.middleware.entitlements import require_feature
from app.middleware.tenant import TenantContext, get_current_tenant, require_roles
from app.models.ai import BILLABLE_STATUSES, AiUsageLog
from app.models.user import Workspace
from app.services import ai_core, ai_features
from app.services.billing import BillingService

router = APIRouter(prefix="/ai", tags=["AI"])
ANALYTICS_ROLES = ("OWNER", "ADMIN", "MANAGER", "SUPER_ADMIN")


def ai_context(tenant: TenantContext, db: Session) -> ai_core.AiContext:
    if not tenant.workspace_id or tenant.workspace_id == "platform":
        raise HTTPException(status_code=400, detail="Open a gym workspace to use REPSI AI.")
    plan_code = BillingService.entitlement_snapshot(db, tenant.workspace_id)["plan_code"]
    return ai_core.AiContext(workspace_id=tenant.workspace_id, user_id=tenant.user_id, role=tenant.role, plan_code=plan_code)


class AssistantRequest(BaseModel):
    question: str = Field(min_length=2, max_length=500)


class WorkoutRequest(BaseModel):
    answers: dict[str, Any]
    use_ai: bool = False


@router.get("/status")
def ai_status(tenant: TenantContext = Depends(get_current_tenant), db: Session = Depends(get_db)):
    """What the caller can use today: configuration, plan features and remaining Gemini calls."""
    ctx = ai_context(tenant, db)
    features = BillingService.entitlement_snapshot(db, tenant.workspace_id)["features"]
    return {
        **ai_core.quota_status(db, ctx),
        "features": {k: bool(features.get(k)) for k in ("ai_assistant", "ai_insights", "ai_workouts")},
    }


@router.post("/assistant", dependencies=[Depends(require_feature("ai_assistant"))])
def ask_assistant(data: AssistantRequest, tenant: TenantContext = Depends(get_current_tenant), db: Session = Depends(get_db)):
    """In-app help and support: knowledge base first, Gemini only for unclear questions."""
    return ai_features.assistant(db, ai_context(tenant, db), data.question)


@router.get("/insights", dependencies=[Depends(require_feature("ai_insights"))])
def business_insights(tenant: TenantContext = Depends(require_roles(*ANALYTICS_ROLES)), db: Session = Depends(get_db)):
    return ai_features.insights(db, ai_context(tenant, db))


@router.get("/reports/{report_type}/summary", dependencies=[Depends(require_feature("ai_insights"))])
def report_summary(
    report_type: Literal["overview", "revenue", "attendance", "memberships"],
    tenant: TenantContext = Depends(require_roles(*ANALYTICS_ROLES)),
    db: Session = Depends(get_db),
):
    return ai_features.report_summary(db, ai_context(tenant, db), report_type)


@router.get("/reminders")
def reminder_suggestions(tenant: TenantContext = Depends(require_permission("payments.view")), db: Session = Depends(get_db)):
    """Rule-based follow-up suggestions (dues, renewals, freezes, inactivity). No model calls."""
    return ai_features.smart_reminders(db, tenant.workspace_id)


@router.get("/workout/questions")
def workout_questions(tenant: TenantContext = Depends(get_current_tenant)):
    return {"questions": ai_features.QUESTIONS, "disclaimer": ai_features.DISCLAIMER}


@router.post("/workout/suggest", dependencies=[Depends(require_feature("ai_workouts"))])
def workout_suggest(data: WorkoutRequest, tenant: TenantContext = Depends(get_current_tenant), db: Session = Depends(get_db)):
    """A rule-based plan instantly; `use_ai=true` asks Gemini to personalise it (counts toward the daily quota)."""
    return ai_features.workout_suggestion(db, ai_context(tenant, db), data.answers, data.use_ai)


# ─── Super admin: usage and cost visibility ─────────────────────────────


@router.get("/admin/usage")
def platform_ai_usage(
    days: int = 30,
    tenant: TenantContext = Depends(get_current_tenant),
    db: Session = Depends(get_db),
):
    from app.api.v1.superadmin import check_superadmin

    check_superadmin(tenant, db)
    days = max(1, min(days, 90))
    since = (datetime.now(timezone.utc) - timedelta(days=days)).replace(tzinfo=None)
    today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0, tzinfo=None)
    billable = case((AiUsageLog.status.in_(BILLABLE_STATUSES), 1), else_=0)

    def summary(start):
        row = db.query(
            func.count(AiUsageLog.id), func.coalesce(func.sum(billable), 0),
            func.coalesce(func.sum(AiUsageLog.input_tokens), 0), func.coalesce(func.sum(AiUsageLog.output_tokens), 0),
        ).filter(AiUsageLog.created_at >= start).one()
        return {"requests": row[0], "model_calls": int(row[1]), "input_tokens": int(row[2]), "output_tokens": int(row[3]),
                "free_answers": row[0] - int(row[1])}

    by_feature = [
        {"feature": f, "status": s, "count": c}
        for f, s, c in db.query(AiUsageLog.feature, AiUsageLog.status, func.count(AiUsageLog.id))
        .filter(AiUsageLog.created_at >= since).group_by(AiUsageLog.feature, AiUsageLog.status).all()
    ]
    top = (
        db.query(AiUsageLog.workspace_id, func.sum(billable).label("calls"), func.count(AiUsageLog.id))
        .filter(AiUsageLog.created_at >= since, AiUsageLog.workspace_id.isnot(None))
        .group_by(AiUsageLog.workspace_id).order_by(func.sum(billable).desc()).limit(10).all()
    )
    names = dict(db.query(Workspace.id, Workspace.name).filter(Workspace.id.in_([t[0] for t in top] or ["-"])).all())
    return {
        "config": {
            "configured": ai_core.ai_configured(), "model": settings.GEMINI_MODEL,
            "fallback_model": settings.GEMINI_FALLBACK_MODEL, "global_daily_calls": settings.AI_GLOBAL_DAILY_CALLS,
            "global_calls_per_minute": settings.AI_GLOBAL_CALLS_PER_MINUTE,
            "member_daily_calls": settings.AI_MEMBER_DAILY_CALLS, "staff_daily_calls": settings.AI_STAFF_DAILY_CALLS,
            "plan_daily_calls": ai_core.PLAN_DAILY_AI_CALLS,
        },
        "today": summary(today),
        "period": {"days": days, **summary(since)},
        "by_feature": by_feature,
        "top_workspaces": [{"workspace_id": w, "name": names.get(w, w), "model_calls": int(c or 0), "requests": r} for w, c, r in top],
    }
