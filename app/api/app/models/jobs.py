"""Background job runs. One row per run; `run_key` makes a scheduled slot run at most once across workers."""
from sqlalchemy import JSON, Column, DateTime, Index, Integer, String, Text, UniqueConstraint

from app.core.database import Base
from app.models.base import TimestampMixin, generate_uuid


class JobRun(Base, TimestampMixin):
    __tablename__ = "job_runs"
    __table_args__ = (
        UniqueConstraint("job_name", "run_key", name="uq_job_run_slot"),
        Index("ix_job_runs_name_started", "job_name", "started_at"),
    )

    id = Column(String(64), primary_key=True, default=generate_uuid)
    job_name = Column(String(80), nullable=False)
    run_key = Column(String(80), nullable=False)  # e.g. the time slot "2026-10-23T14:15"
    trigger = Column(String(20), nullable=False, default="scheduler")  # scheduler | cli | manual
    status = Column(String(20), nullable=False, default="running")  # running | succeeded | failed
    started_at = Column(DateTime(timezone=True), nullable=False)
    finished_at = Column(DateTime(timezone=True), nullable=True)
    duration_ms = Column(Integer, nullable=True)
    result = Column(JSON, nullable=True)
    error = Column(Text, nullable=True)
