import json
from datetime import date, datetime, time, timedelta, timezone
from typing import Literal, Optional

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.middleware.tenant import (
    BRANCH_MANAGER_ROLES,
    TenantContext,
    get_current_tenant,
    get_current_user,
    require_roles,
)
from app.core import permissions
from app.core.audit import record_audit
from app.core.permissions import require_permission
from app.models.system import AuditLog
from app.models.user import User, UserRole, WorkspaceMember
from app.schemas.organization import (
    BranchIn,
    BranchOut,
    BusinessProfileIn,
    OnboardingState,
    OrganizationProfileOut,
    PreferencesIn,
    TeamMemberOut,
    TeamMemberUpdate,
)
from app.services.auth import AuthService
from app.services.organization import ONBOARDING_STEPS, OrganizationService

onboarding_router = APIRouter(prefix="/onboarding", tags=["Onboarding"])
organization_router = APIRouter(prefix="/organization", tags=["Organization"])
branches_router = APIRouter(prefix="/branches", tags=["Branches"])
team_router = APIRouter(prefix="/team", tags=["Team"])


# ─── Onboarding ──────────────────────────────────────────────────────────

def _onboarding_workspace(svc: OrganizationService, user: User):
    return svc.owned_incomplete_workspace(user)


def _state(db: Session, user: User) -> OnboardingState:
    svc = OrganizationService(db)
    ws = _onboarding_workspace(svc, user)
    steps = svc.onboarding_steps(ws)
    current = next((s for s in ONBOARDING_STEPS if not steps[s]), "launch")
    user_info, next_path, onboarding_required = AuthService(db).describe_user(user, ws.id if ws else None)
    return OnboardingState(
        has_workspace=ws is not None,
        workspace_id=ws.id if ws else None,
        workspace_slug=ws.slug if ws else None,
        onboarding_completed=bool(ws.onboarding_completed) if ws else not onboarding_required,
        current_step=current,
        steps=steps,
        profile=svc.profile_out(ws, "OWNER") if ws else None,
        branches=svc.list_branches(ws.id, None) if ws else [],
        user={
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "phone": user.phone_e164,
            "next_path": next_path,
            "onboarding_required": onboarding_required,
        },
    )


def _require_onboarding_ws(db: Session, user: User):
    ws = OrganizationService(db).owned_incomplete_workspace(user)
    if ws is None:
        raise HTTPException(status_code=409, detail="Save your business details first.")
    return ws


@onboarding_router.get("/state", response_model=OnboardingState)
def get_onboarding_state(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return _state(db, user)


@onboarding_router.put("/business")
def save_business(data: BusinessProfileIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ws, created = OrganizationService(db).save_business_step(user, data)
    # A fresh token scoped to the organization the user is setting up.
    session = AuthService(db).issue_session(user, ws.id)
    return {"created": created, "state": _state(db, user), "session": session}


@onboarding_router.put("/preferences", response_model=OnboardingState)
def save_preferences(data: PreferencesIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ws = _require_onboarding_ws(db, user)
    OrganizationService(db).update_preferences(ws, data, "OWNER")
    return _state(db, user)


class AdvanceRequest(BaseModel):
    step: Literal["branches", "team"]


@onboarding_router.post("/advance", response_model=OnboardingState)
def advance(req: AdvanceRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ws = _require_onboarding_ws(db, user)
    OrganizationService(db).advance_step(ws, req.step)
    return _state(db, user)


class CompleteRequest(BaseModel):
    chosen_plan: Optional[str] = None
    billing_cycle: Literal["monthly", "annual"] = "monthly"


@onboarding_router.post("/complete")
def complete(req: CompleteRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ws = _require_onboarding_ws(db, user)
    ws, sub = OrganizationService(db).complete_onboarding(ws, req.chosen_plan, req.billing_cycle, user.id)
    session = AuthService(db).issue_session(user, ws.id)
    return {
        "status": "success",
        "workspace_id": ws.id,
        "workspace_slug": ws.slug,
        "plan": sub.plan.code if sub else None,
        "session": session,
    }


# ─── Organization profile & preferences ──────────────────────────────────

@organization_router.get("", response_model=OrganizationProfileOut)
def get_profile(tenant: TenantContext = Depends(get_current_tenant), db: Session = Depends(get_db)):
    if not tenant.workspace_id:
        raise HTTPException(status_code=404, detail="You don't belong to an organization yet.")
    svc = OrganizationService(db)
    return svc.profile_out(svc.get_workspace(tenant.workspace_id), tenant.role)


@organization_router.put("/profile", response_model=OrganizationProfileOut)
def update_profile(
    data: BusinessProfileIn,
    tenant: TenantContext = Depends(require_roles("OWNER", "ADMIN", "SUPER_ADMIN")),
    db: Session = Depends(get_db),
):
    svc = OrganizationService(db)
    ws = svc.update_profile(svc.get_workspace(tenant.workspace_id), data, tenant.role)
    return svc.profile_out(ws, tenant.role)


@organization_router.put("/preferences", response_model=OrganizationProfileOut)
def update_preferences(
    data: PreferencesIn,
    tenant: TenantContext = Depends(require_roles("OWNER", "ADMIN", "SUPER_ADMIN")),
    db: Session = Depends(get_db),
):
    svc = OrganizationService(db)
    ws = svc.update_preferences(svc.get_workspace(tenant.workspace_id), data, tenant.role)
    return svc.profile_out(ws, tenant.role)


@organization_router.post("/logo", response_model=OrganizationProfileOut)
async def upload_logo(
    file: UploadFile = File(...),
    tenant: TenantContext = Depends(require_roles("OWNER", "ADMIN", "SUPER_ADMIN")),
    db: Session = Depends(get_db),
):
    data = await file.read(2 * 1024 * 1024 + 1)
    svc = OrganizationService(db)
    ws = svc.save_logo(svc.get_workspace(tenant.workspace_id), data, tenant.role)
    return svc.profile_out(ws, tenant.role)


@organization_router.delete("/logo", response_model=OrganizationProfileOut)
def delete_logo(
    tenant: TenantContext = Depends(require_roles("OWNER", "ADMIN", "SUPER_ADMIN")),
    db: Session = Depends(get_db),
):
    svc = OrganizationService(db)
    ws = svc.remove_logo(svc.get_workspace(tenant.workspace_id), tenant.role)
    return svc.profile_out(ws, tenant.role)


@organization_router.get("/{workspace_id}/logo/{filename}", include_in_schema=False)
def get_logo(workspace_id: str, filename: str):
    """Public: logos appear on public gym sites and invitation pages."""
    found = OrganizationService.logo_path(workspace_id, filename)
    if not found:
        raise HTTPException(status_code=404, detail="Logo not found.")
    path, mime = found
    return FileResponse(path, media_type=mime, headers={"Cache-Control": "public, max-age=31536000, immutable"})


# ─── Branches ────────────────────────────────────────────────────────────

@branches_router.get("", response_model=list[BranchOut])
def list_branches(
    include_inactive: bool = False,
    tenant: TenantContext = Depends(get_current_tenant),
    db: Session = Depends(get_db),
):
    if not tenant.workspace_id:
        return []
    svc = OrganizationService(db)
    allowed = svc.accessible_branch_ids(tenant)
    return svc.list_branches(tenant.workspace_id, allowed, include_inactive and tenant.role in BRANCH_MANAGER_ROLES)


@branches_router.post("", response_model=BranchOut, status_code=201)
def create_branch(
    data: BranchIn,
    tenant: TenantContext = Depends(require_roles("OWNER", "ADMIN", "SUPER_ADMIN")),
    db: Session = Depends(get_db),
):
    svc = OrganizationService(db)
    return svc.create_branch(svc.get_workspace(tenant.workspace_id), data, tenant.role)


@branches_router.put("/{branch_id}", response_model=BranchOut)
def update_branch(
    branch_id: str,
    data: BranchIn,
    tenant: TenantContext = Depends(require_roles("OWNER", "ADMIN", "SUPER_ADMIN")),
    db: Session = Depends(get_db),
):
    svc = OrganizationService(db)
    return svc.update_branch(svc.get_workspace(tenant.workspace_id), branch_id, data, tenant.role)


@branches_router.post("/{branch_id}/deactivate", response_model=BranchOut)
def deactivate_branch(
    branch_id: str,
    tenant: TenantContext = Depends(require_roles("OWNER", "ADMIN", "SUPER_ADMIN")),
    db: Session = Depends(get_db),
):
    svc = OrganizationService(db)
    return svc.set_branch_active(svc.get_workspace(tenant.workspace_id), branch_id, False, tenant.role)


@branches_router.post("/{branch_id}/activate", response_model=BranchOut)
def activate_branch(
    branch_id: str,
    tenant: TenantContext = Depends(require_roles("OWNER", "ADMIN", "SUPER_ADMIN")),
    db: Session = Depends(get_db),
):
    svc = OrganizationService(db)
    return svc.set_branch_active(svc.get_workspace(tenant.workspace_id), branch_id, True, tenant.role)


# ─── Team & branch access ────────────────────────────────────────────────

@team_router.get("", response_model=list[TeamMemberOut])
def list_team(
    tenant: TenantContext = Depends(require_roles(*BRANCH_MANAGER_ROLES)),
    db: Session = Depends(get_db),
):
    return OrganizationService(db).list_team(tenant.workspace_id, tenant.user_id)


@team_router.put("/{member_id}", response_model=TeamMemberOut)
def update_team_member(
    member_id: str,
    data: TeamMemberUpdate,
    tenant: TenantContext = Depends(require_roles("OWNER", "ADMIN", "SUPER_ADMIN")),
    db: Session = Depends(get_db),
):
    return OrganizationService(db).update_team_member(tenant, member_id, data)


# ─── Staff permissions & audit log ───────────────────────────────────────

class PermissionOverridesIn(BaseModel):
    grant: list[str] = []
    revoke: list[str] = []


def _team_member_or_404(db: Session, tenant: TenantContext, member_id: str) -> WorkspaceMember:
    member = db.query(WorkspaceMember).filter(
        WorkspaceMember.id == member_id, WorkspaceMember.workspace_id == tenant.workspace_id
    ).first()
    if not member or member.role == UserRole.USER:
        raise HTTPException(status_code=404, detail="Team member not found.")
    return member


def _permission_view(member: WorkspaceMember) -> dict:
    role = member.role.value
    grant, revoke = permissions.parse_overrides(member.permissions)
    return {
        "member_id": member.id,
        "role": role,
        "role_defaults": sorted(permissions.ROLE_DEFAULTS.get(role, frozenset()) if role not in permissions.UNRESTRICTED_ROLES else permissions.ALL),
        "grant": sorted(grant),
        "revoke": sorted(revoke),
        "effective": sorted(permissions.effective_permissions(role, member.permissions)),
        "locked": role in permissions.UNRESTRICTED_ROLES,
    }


@team_router.get("/permissions/catalog")
def permission_catalog(tenant: TenantContext = Depends(require_roles(*BRANCH_MANAGER_ROLES))):
    return {
        "permissions": [{"key": k, "label": v} for k, v in permissions.PERMISSIONS.items()],
        "role_defaults": {role: sorted(perms) for role, perms in permissions.ROLE_DEFAULTS.items() if role != "SUPER_ADMIN"},
    }


@team_router.get("/me/permissions")
def my_permissions(tenant: TenantContext = Depends(get_current_tenant), db: Session = Depends(get_db)):
    """What the signed-in user may do in this gym (for hiding UI the backend would refuse anyway)."""
    return {"role": tenant.role, "permissions": sorted(permissions.tenant_permissions(db, tenant))}


@team_router.get("/{member_id}/permissions")
def get_member_permissions(
    member_id: str,
    tenant: TenantContext = Depends(require_permission("permissions.manage")),
    db: Session = Depends(get_db),
):
    return _permission_view(_team_member_or_404(db, tenant, member_id))


@team_router.put("/{member_id}/permissions")
def set_member_permissions(
    member_id: str,
    data: PermissionOverridesIn,
    tenant: TenantContext = Depends(require_permission("permissions.manage")),
    db: Session = Depends(get_db),
):
    member = _team_member_or_404(db, tenant, member_id)
    unknown = (set(data.grant) | set(data.revoke)) - permissions.ALL
    if unknown:
        raise HTTPException(status_code=422, detail=f"Unknown permission(s): {', '.join(sorted(unknown))}")
    if set(data.grant) & set(data.revoke):
        raise HTTPException(status_code=422, detail="A permission can't be both granted and revoked.")
    if member.user_id == tenant.user_id:
        raise HTTPException(status_code=403, detail="You can't change your own permissions.")
    if member.role.value in permissions.UNRESTRICTED_ROLES:
        raise HTTPException(status_code=403, detail="The owner's permissions can't be restricted.")
    if tenant.role == "ADMIN" and member.role == UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only the owner can change an admin's permissions.")
    actor_perms = permissions.tenant_permissions(db, tenant)
    beyond = set(data.grant) - actor_perms
    if beyond:
        raise HTTPException(status_code=403, detail=f"You can't grant permissions you don't hold: {', '.join(sorted(beyond))}")

    before = _permission_view(member)
    member.permissions = permissions.serialize_overrides(data.grant, data.revoke)
    after = _permission_view(member)
    record_audit(db, tenant.workspace_id, tenant.user_id, "staff.permissions_changed",
                 resource_type="workspace_member", resource_id=member.id,
                 details={"before": {"grant": before["grant"], "revoke": before["revoke"]},
                          "after": {"grant": after["grant"], "revoke": after["revoke"]}})
    db.commit()
    return after


audit_router = APIRouter(prefix="/audit-logs", tags=["Audit"])


@audit_router.get("")
def list_audit_logs(
    action: Optional[str] = None,
    resource_type: Optional[str] = None,
    resource_id: Optional[str] = None,
    actor_user_id: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    tenant: TenantContext = Depends(require_permission("audit.view")),
    db: Session = Depends(get_db),
):
    """Read-only, tenant-scoped audit trail. There are no update or delete endpoints for audit rows."""
    q = db.query(AuditLog).filter(AuditLog.workspace_id == tenant.workspace_id)
    if action:
        q = q.filter(AuditLog.action.like(f"{action}%"))
    if resource_type:
        q = q.filter(AuditLog.resource_type == resource_type)
    if resource_id:
        q = q.filter(AuditLog.resource_id == resource_id)
    if actor_user_id:
        q = q.filter(AuditLog.user_id == actor_user_id)
    if date_from:
        q = q.filter(AuditLog.created_at >= datetime.combine(date_from, time.min))
    if date_to:
        q = q.filter(AuditLog.created_at < datetime.combine(date_to + timedelta(days=1), time.min))
    total = q.count()
    rows = q.order_by(AuditLog.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    actor_ids = {r.user_id for r in rows if r.user_id}
    names = dict(db.query(User.id, User.full_name).filter(User.id.in_(actor_ids)).all()) if actor_ids else {}
    return {
        "items": [
            {
                "id": r.id,
                "action": r.action,
                "actor_user_id": r.user_id,
                "actor_name": names.get(r.user_id) if r.user_id else "System",
                "resource_type": r.resource_type,
                "resource_id": r.resource_id,
                "outcome": r.outcome or "success",
                "details": json.loads(r.details) if r.details and r.details.startswith("{") else r.details,
                "created_at": (r.created_at if r.created_at.tzinfo else r.created_at.replace(tzinfo=timezone.utc)).isoformat(),
            }
            for r in rows
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
    }
