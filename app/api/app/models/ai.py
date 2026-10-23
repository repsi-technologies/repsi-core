"""
AI usage accounting and response cache.

Every AI request writes one AiUsageLog row (no prompt or answer text, only counts), so quotas,
per-feature cost and cache-hit rates come from real data. Only rows with status `ok` or `error`
were actual Gemini calls and count against quotas; `kb`, `cached`, `rules` and `fallback` answers
cost nothing.
"""
from sqlalchemy import Column, DateTime, Index, Integer, String, Text

from app.core.database import Base
from app.models.base import TimestampMixin, generate_uuid

# Statuses that spent a model call.
BILLABLE_STATUSES = ("ok", "error", "invalid_output", "blocked")


class AiUsageLog(Base, TimestampMixin):
    __tablename__ = "ai_usage_logs"
    __table_args__ = (
        Index("ix_ai_usage_ws_created", "workspace_id", "created_at"),
        Index("ix_ai_usage_user_created", "user_id", "created_at"),
        Index("ix_ai_usage_created_status", "created_at", "status"),
    )

    id = Column(String(64), primary_key=True, default=generate_uuid)
    workspace_id = Column(String(64), nullable=True)
    user_id = Column(String(64), nullable=True)
    feature = Column(String(40), nullable=False)  # assistant | support | insights | report | workout
    # ok | cached | kb | rules | fallback | invalid_output | error | quota | disabled | blocked
    status = Column(String(20), nullable=False)
    model = Column(String(60), nullable=True)
    input_tokens = Column(Integer, nullable=False, default=0)
    output_tokens = Column(Integer, nullable=False, default=0)
    latency_ms = Column(Integer, nullable=True)
    error = Column(String(200), nullable=True)


class AiResponseCache(Base, TimestampMixin):
    __tablename__ = "ai_response_cache"
    __table_args__ = (Index("ix_ai_cache_expires", "expires_at"),)

    # sha256 of feature + scope + normalised inputs; workspace-scoped features include the workspace id.
    key = Column(String(64), primary_key=True)
    feature = Column(String(40), nullable=False)
    workspace_id = Column(String(64), nullable=True, index=True)
    payload = Column(Text, nullable=False)  # validated JSON answer
    model = Column(String(60), nullable=True)
    expires_at = Column(DateTime, nullable=False)
