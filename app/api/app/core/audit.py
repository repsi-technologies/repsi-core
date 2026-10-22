"""
Staff activity / audit trail helper. Writes to the existing `audit_logs` table.

Callers pass only what's needed to understand the action: ids, changed field names and
non-sensitive before/after values. Never pass passwords, tokens, OTPs or document contents.
"""
import json
from typing import Any, Optional

from sqlalchemy.orm import Session

from app.models.system import AuditLog

_SENSITIVE_KEYS = {"password", "hashed_password", "token", "access_token", "otp", "secret", "api_key"}


def _scrub(value: Any) -> Any:
    if isinstance(value, dict):
        return {k: ("[redacted]" if k.lower() in _SENSITIVE_KEYS else _scrub(v)) for k, v in value.items()}
    if isinstance(value, list):
        return [_scrub(v) for v in value]
    return value


def record_audit(
    db: Session,
    workspace_id: str,
    actor_user_id: Optional[str],
    action: str,
    *,
    resource_type: Optional[str] = None,
    resource_id: Optional[str] = None,
    outcome: str = "success",
    details: Optional[dict] = None,
    ip_address: Optional[str] = None,
) -> AuditLog:
    """Adds an audit row to the session. The caller's transaction commits it."""
    entry = AuditLog(
        workspace_id=workspace_id,
        user_id=actor_user_id,
        ip_address=ip_address,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        outcome=outcome,
        details=json.dumps(_scrub(details), default=str) if details else None,
    )
    db.add(entry)
    return entry
