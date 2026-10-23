"""
Daily activity totals a member syncs from their phone (Health Connect / Google Fit data).

One row per (workspace, user, day, source); re-syncing a day replaces that row, so the
sync endpoint is idempotent. Rows belong to the user: only the user can read or delete them.
"""
from sqlalchemy import Column, Date, DateTime, Float, Integer, String, UniqueConstraint

from app.core.database import Base
from app.models.base import TenantMixin, TimestampMixin, generate_uuid


class HealthDailyActivity(Base, TimestampMixin, TenantMixin):
    __tablename__ = "health_daily_activity"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    user_id = Column(String(64), nullable=False, index=True)
    day = Column(Date, nullable=False, index=True)
    source = Column(String(30), nullable=False, default="health_connect")
    steps = Column(Integer, nullable=False, default=0)
    distance_meters = Column(Float, nullable=False, default=0)
    active_calories = Column(Float, nullable=False, default=0)
    active_minutes = Column(Integer, nullable=False, default=0)
    avg_heart_rate = Column(Integer, nullable=True)
    synced_at = Column(DateTime, nullable=True)

    __table_args__ = (
        UniqueConstraint("workspace_id", "user_id", "day", "source", name="uq_health_daily_user_day_source"),
    )
