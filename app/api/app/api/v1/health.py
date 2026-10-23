from datetime import date, datetime, timedelta, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, ConfigDict, Field, field_validator
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.middleware.tenant import TenantContext, get_current_tenant
from app.models.health import HealthDailyActivity

router = APIRouter(prefix="/health", tags=["Health Sync"])

MAX_SYNC_DAYS = 31
ALLOWED_SOURCES = {"health_connect", "google_fit", "apple_health", "manual"}


class DailyActivityIn(BaseModel):
    day: date
    steps: int = Field(0, ge=0, le=200_000)
    distance_meters: float = Field(0, ge=0, le=500_000)
    active_calories: float = Field(0, ge=0, le=20_000)
    active_minutes: int = Field(0, ge=0, le=1_440)
    avg_heart_rate: Optional[int] = Field(None, ge=20, le=250)


class DailyActivitySync(BaseModel):
    source: str = "health_connect"
    days: List[DailyActivityIn] = Field(min_length=1, max_length=MAX_SYNC_DAYS)

    @field_validator("source")
    @classmethod
    def _known_source(cls, value: str) -> str:
        if value not in ALLOWED_SOURCES:
            raise ValueError(f"source must be one of {sorted(ALLOWED_SOURCES)}")
        return value


class DailyActivityOut(BaseModel):
    day: date
    source: str
    steps: int
    distance_meters: float
    active_calories: float
    active_minutes: int
    avg_heart_rate: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)


class HealthSummary(BaseModel):
    days: List[DailyActivityOut]
    total_steps: int
    total_distance_meters: float
    total_active_calories: float
    average_steps: int
    today_steps: int
    last_synced_at: Optional[datetime] = None


def _own(db: Session, tenant: TenantContext):
    return db.query(HealthDailyActivity).filter(
        HealthDailyActivity.workspace_id == tenant.workspace_id,
        HealthDailyActivity.user_id == tenant.user_id,
    )


@router.put("/daily", response_model=List[DailyActivityOut])
def sync_daily_activity(
    req: DailyActivitySync,
    tenant: TenantContext = Depends(get_current_tenant),
    db: Session = Depends(get_db),
):
    """Idempotent upsert of the signed-in user's daily totals (max 31 days, none in the future)."""
    today = datetime.now(timezone.utc).date()
    seen: set[date] = set()
    rows = []
    for item in req.days:
        if item.day > today + timedelta(days=1) or item.day in seen:
            continue
        seen.add(item.day)
        row = _own(db, tenant).filter(
            HealthDailyActivity.day == item.day, HealthDailyActivity.source == req.source
        ).first()
        if row is None:
            row = HealthDailyActivity(
                workspace_id=tenant.workspace_id, user_id=tenant.user_id, day=item.day, source=req.source
            )
            db.add(row)
        row.steps = item.steps
        row.distance_meters = item.distance_meters
        row.active_calories = item.active_calories
        row.active_minutes = item.active_minutes
        row.avg_heart_rate = item.avg_heart_rate
        row.synced_at = datetime.now(timezone.utc)
        rows.append(row)
    db.commit()
    return sorted(rows, key=lambda r: r.day)


@router.get("/daily", response_model=HealthSummary)
def get_daily_activity(
    days: int = Query(7, ge=1, le=90),
    tenant: TenantContext = Depends(get_current_tenant),
    db: Session = Depends(get_db),
):
    today = datetime.now(timezone.utc).date()
    since = today - timedelta(days=days - 1)
    rows = _own(db, tenant).filter(HealthDailyActivity.day >= since).order_by(HealthDailyActivity.day).all()
    # If the user has several sources for one day, keep the highest step count rather than double counting.
    best: dict[date, HealthDailyActivity] = {}
    for row in rows:
        if row.day not in best or row.steps > best[row.day].steps:
            best[row.day] = row
    chosen = [best[d] for d in sorted(best)]
    total_steps = sum(r.steps for r in chosen)
    last_synced = _own(db, tenant).with_entities(func.max(HealthDailyActivity.synced_at)).scalar()
    return HealthSummary(
        days=chosen,
        total_steps=total_steps,
        total_distance_meters=round(sum(r.distance_meters for r in chosen), 1),
        total_active_calories=round(sum(r.active_calories for r in chosen), 1),
        average_steps=round(total_steps / days),
        today_steps=best[today].steps if today in best else 0,
        last_synced_at=last_synced,
    )


@router.delete("/daily")
def delete_my_health_data(
    tenant: TenantContext = Depends(get_current_tenant),
    db: Session = Depends(get_db),
):
    """Lets a member erase everything they synced (also used when they disconnect Health Connect)."""
    deleted = _own(db, tenant).delete(synchronize_session=False)
    db.commit()
    return {"status": "success", "deleted": deleted}
