"""
Granular staff permissions.

Each workspace role has a default permission set. Owners/admins can grant or revoke
individual permissions per staff member; overrides are stored as JSON in
WorkspaceMember.permissions: {"grant": [...], "revoke": [...]}.

Older rows may hold a comma-separated string; those values are treated as grants.
OWNER and SUPER_ADMIN always hold every permission and cannot be restricted.
"""
import json
from typing import Iterable, Optional

from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.middleware.tenant import TenantContext, get_current_tenant

PERMISSIONS: dict[str, str] = {
    "attendance.view": "View attendance, live occupancy and reports",
    "attendance.record": "Record check-ins and check-outs for others",
    "attendance.correct": "Correct attendance records",
    "attendance.override": "Override access denials at check-in",
    "attendance.export": "Export attendance reports",
    "attendance.configure": "Manage attendance settings and gym QR codes",
    "members.view": "View member profiles",
    "members.manage": "Create and edit members",
    "trainers.manage": "Manage trainer profiles",
    "trainers.assign": "Assign members to trainers",
    "schedules.manage": "Manage trainer schedules and sessions",
    "plans.manage": "Manage membership plans",
    "payments.view": "View payment information",
    "records.export": "Export member and financial records",
    "staff.manage": "Manage staff accounts",
    "permissions.manage": "Change staff permissions",
    "audit.view": "View audit logs",
    "exercises.manage": "Create and edit gym exercises",
    "programs.manage": "Create and edit workout programs",
    "workouts.assign": "Assign and customize member workout plans",
    "communications.manage": "Send broadcasts, manage message templates and view delivery logs",
}

ALL = frozenset(PERMISSIONS)

ROLE_DEFAULTS: dict[str, frozenset] = {
    "SUPER_ADMIN": ALL,
    "OWNER": ALL,
    "ADMIN": ALL,
    "MANAGER": frozenset({
        "attendance.view", "attendance.record", "attendance.correct", "attendance.override", "attendance.export",
        "members.view", "members.manage", "trainers.assign", "schedules.manage", "payments.view",
        "records.export", "audit.view", "exercises.manage", "programs.manage", "workouts.assign",
        "communications.manage",
    }),
    "STAFF": frozenset({"attendance.view", "attendance.record", "members.view", "members.manage", "payments.view"}),
    # Trainers only reach their own assigned clients; the relationship check lives in the fitness service.
    "TRAINER": frozenset({"exercises.manage", "programs.manage", "workouts.assign"}),
    "USER": frozenset(),
}

UNRESTRICTED_ROLES = {"OWNER", "SUPER_ADMIN"}


def parse_overrides(raw: Optional[str]) -> tuple[set, set]:
    if not raw:
        return set(), set()
    try:
        data = json.loads(raw)
        if isinstance(data, dict):
            return set(data.get("grant") or []) & ALL, set(data.get("revoke") or []) & ALL
        if isinstance(data, list):
            return set(data) & ALL, set()
    except (ValueError, TypeError):
        pass
    return {p.strip() for p in raw.split(",") if p.strip()} & ALL, set()


def serialize_overrides(grant: Iterable[str], revoke: Iterable[str]) -> Optional[str]:
    grant, revoke = sorted(set(grant)), sorted(set(revoke))
    if not grant and not revoke:
        return None
    return json.dumps({"grant": grant, "revoke": revoke})


def effective_permissions(role: Optional[str], raw_overrides: Optional[str] = None) -> frozenset:
    role = (role or "USER").upper()
    if role in UNRESTRICTED_ROLES:
        return ALL
    grant, revoke = parse_overrides(raw_overrides)
    return frozenset((ROLE_DEFAULTS.get(role, frozenset()) | grant) - revoke)


def tenant_permissions(db: Session, tenant: TenantContext) -> frozenset:
    if tenant.role in UNRESTRICTED_ROLES:
        return ALL
    from app.models.user import WorkspaceMember

    member = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == tenant.workspace_id,
        WorkspaceMember.user_id == tenant.user_id,
        WorkspaceMember.is_active.is_(True),
    ).first()
    if not member:
        return frozenset()
    return effective_permissions(member.role.value if hasattr(member.role, "value") else member.role, member.permissions)


def has_permission(db: Session, tenant: TenantContext, permission: str) -> bool:
    return permission in tenant_permissions(db, tenant)


def require_permission(permission: str):
    """Dependency factory: caller must hold `permission` in the active workspace."""
    if permission not in PERMISSIONS:
        raise ValueError(f"Unknown permission {permission}")

    def checker(tenant: TenantContext = Depends(get_current_tenant), db: Session = Depends(get_db)) -> TenantContext:
        if not tenant.workspace_id or not has_permission(db, tenant, permission):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"You don't have permission to {PERMISSIONS[permission][0].lower() + PERMISSIONS[permission][1:]}.",
            )
        return tenant

    return checker
