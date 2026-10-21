from typing import Literal, Optional

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
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
from app.models.user import User
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
