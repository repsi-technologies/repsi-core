"""
Organization (workspace) profile, regional preferences, branches, team access and onboarding.

The Workspace row is the single source of truth for business settings; branches are
GymLocation rows (which attendance already uses); branch access is BranchAssignment rows.
"""
import json
import os
import re
import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.phone import optional_phone, require_phone
from app.middleware.tenant import TenantContext
from app.models.attendance import BranchAssignment, GymLocation
from app.models.trainer import Trainer, TrainerStatus
from app.models.user import User, UserRole, Workspace, WorkspaceMember
from app.schemas.organization import (
    BranchIn,
    BranchOut,
    BusinessProfileIn,
    OrganizationProfileOut,
    PreferencesIn,
    TeamMemberOut,
    TeamMemberUpdate,
    parse_closed_dates,
    parse_hours,
)
from app.services.auth import RESERVED_SLUGS, AuthService
from app.services.billing import BillingService
from app.services.manual_payment import UPLOADS_BASE_DIR, _detect_mime_type
from app.services.workspace_moderation import WorkspaceModerationService

ORG_WIDE_ROLES = {"OWNER", "ADMIN", "SUPER_ADMIN"}
ONBOARDING_STEPS = ("business", "preferences", "branches", "team", "launch")
LOGO_MAX_BYTES = 2 * 1024 * 1024
LOGO_DIR = os.path.join(UPLOADS_BASE_DIR, "logos")
_EXT = {"image/png": "png", "image/jpeg": "jpg", "image/webp": "webp"}


def _country_name(code: Optional[str]) -> Optional[str]:
    if not code:
        return None
    names = {"IN": "India", "US": "United States", "GB": "United Kingdom", "AE": "United Arab Emirates"}
    return names.get(code, code)


def _split_types(raw: Optional[str]) -> list[str]:
    if not raw:
        return []
    try:
        value = json.loads(raw)
        if isinstance(value, list):
            return [str(v) for v in value]
    except (ValueError, TypeError):
        pass
    return [p.strip() for p in raw.split(",") if p.strip()]


class OrganizationService:
    def __init__(self, db: Session):
        self.db = db

    # ─── Access helpers ───────────────────────────────────────────────────

    def get_workspace(self, workspace_id: str) -> Workspace:
        ws = self.db.query(Workspace).filter(Workspace.id == workspace_id, Workspace.is_active == True).first()
        if not ws:
            raise HTTPException(status_code=404, detail="Organization not found.")
        return ws

    def membership(self, workspace_id: str, user_id: str) -> Optional[WorkspaceMember]:
        return (
            self.db.query(WorkspaceMember)
            .filter(WorkspaceMember.workspace_id == workspace_id, WorkspaceMember.user_id == user_id)
            .first()
        )

    def accessible_branch_ids(self, tenant: TenantContext) -> Optional[set[str]]:
        """None means every branch. Non org-wide roles are limited to their assigned
        branches; a member with no assignments is unrestricted (shown as "All branches")."""
        if tenant.role in ORG_WIDE_ROLES:
            return None
        member = self.membership(tenant.workspace_id, tenant.user_id)
        if not member:
            return set()
        ids = {
            a.branch_id
            for a in self.db.query(BranchAssignment).filter(BranchAssignment.workspace_member_id == member.id)
        }
        return ids or None

    def require_branch_access(self, tenant: TenantContext, branch_id: str) -> None:
        allowed = self.accessible_branch_ids(tenant)
        if allowed is not None and branch_id not in allowed:
            raise HTTPException(status_code=403, detail="You don't have access to this branch.")

    # ─── Profile ──────────────────────────────────────────────────────────

    def profile_out(self, ws: Workspace, role: Optional[str]) -> OrganizationProfileOut:
        eligibility = WorkspaceModerationService.get_rename_eligibility(ws) if ws.onboarding_completed else None
        return OrganizationProfileOut(
            id=ws.id,
            name=ws.name,
            slug=ws.slug,
            logo_url=ws.logo_url,
            business_email=ws.email,
            phone=ws.phone,
            gym_type=ws.gym_type,
            business_types=_split_types(ws.business_types),
            business_size=ws.business_size,
            address_line1=ws.address,
            address_line2=ws.address_line2,
            city=ws.city,
            state=ws.state,
            postal_code=ws.postal_code,
            country_code=ws.country_code,
            country=ws.country,
            timezone=ws.timezone,
            currency=ws.currency,
            locale=ws.locale,
            opening_hours=parse_hours(ws.opening_hours),
            closed_dates=parse_closed_dates(ws.closed_dates),
            onboarding_completed=bool(ws.onboarding_completed),
            onboarding_step=ws.onboarding_step or 1,
            can_edit=role in ORG_WIDE_ROLES,
            can_rename=eligibility["can_rename"] if eligibility else True,
            rename_message=eligibility.get("message") if eligibility else None,
        )

    def _validate_name(self, ws: Optional[Workspace], name: str, role: Optional[str]) -> str:
        clean = WorkspaceModerationService.normalize_name(name)
        if ws is not None and clean.lower() == (ws.name or "").strip().lower():
            return ws.name
        if ws is not None and ws.onboarding_completed:
            if role not in ("OWNER", "SUPER_ADMIN"):
                raise HTTPException(status_code=403, detail="Only the owner can rename the business.")
            eligibility = WorkspaceModerationService.get_rename_eligibility(ws)
            if not eligibility["can_rename"]:
                raise HTTPException(status_code=409, detail=eligibility["message"])
        check = WorkspaceModerationService.check_availability(self.db, clean, ws.id if ws else None)
        if not check["available"]:
            raise HTTPException(status_code=409 if check["status"] == "TAKEN" else 422, detail=check["message"])
        if ws is not None and ws.onboarding_completed:
            ws.last_name_changed_at = datetime.now(timezone.utc)
            ws.name_change_count = (ws.name_change_count or 0) + 1
        return clean

    def _apply_profile(self, ws: Workspace, data: BusinessProfileIn) -> None:
        ws.phone = require_phone(data.phone, data.phone_country or data.country_code, "business phone")
        ws.email = str(data.business_email).lower() if data.business_email else ws.email
        ws.gym_type = data.gym_type or ws.gym_type
        ws.business_types = json.dumps(data.business_types) if data.business_types else ws.business_types
        ws.business_size = data.business_size
        ws.address = data.address_line1
        ws.address_line2 = data.address_line2
        ws.city = data.city
        ws.state = data.state
        ws.postal_code = data.postal_code
        ws.country_code = data.country_code
        ws.country = data.country or _country_name(data.country_code)

    def _apply_slug(self, ws: Workspace, slug: Optional[str]) -> None:
        if not slug or slug == ws.slug:
            return
        if ws.onboarding_completed:
            raise HTTPException(status_code=409, detail="The workspace URL can't be changed after setup.")
        taken = slug in RESERVED_SLUGS or self.db.query(Workspace.id).filter(
            func.lower(Workspace.slug) == slug, Workspace.id != ws.id
        ).first()
        if taken:
            raise HTTPException(status_code=409, detail="This workspace URL is already taken.")
        ws.slug = slug

    def owned_incomplete_workspace(self, user: User) -> Optional[Workspace]:
        return (
            self.db.query(Workspace)
            .join(WorkspaceMember, WorkspaceMember.workspace_id == Workspace.id)
            .filter(
                WorkspaceMember.user_id == user.id,
                WorkspaceMember.role == UserRole.OWNER,
                WorkspaceMember.is_active == True,
                Workspace.is_active == True,
                Workspace.onboarding_completed == False,
            )
            .order_by(Workspace.created_at.desc())
            .first()
        )

    def save_business_step(self, user: User, data: BusinessProfileIn) -> tuple[Workspace, bool]:
        """
        Creates the organization on first save and updates it afterwards. A user always
        resumes their own unfinished organization, so retries/double-submits never create
        duplicates. Workspace, OWNER membership, primary branch and trial are created in
        one transaction.
        """
        ws = self.owned_incomplete_workspace(user)
        created = ws is None
        try:
            if created:
                name = self._validate_name(None, data.name, "OWNER")
                ws = Workspace(
                    name=name,
                    slug=data.slug or AuthService(self.db).unique_slug(name),
                    is_active=True,
                    onboarding_completed=False,
                    onboarding_step=1,
                )
                if data.slug and (
                    data.slug in RESERVED_SLUGS
                    or self.db.query(Workspace.id).filter(func.lower(Workspace.slug) == data.slug).first()
                ):
                    raise HTTPException(status_code=409, detail="This workspace URL is already taken.")
                self._apply_profile(ws, data)
                self.db.add(ws)
                self.db.flush()
                self.db.add(WorkspaceMember(workspace_id=ws.id, user_id=user.id, role=UserRole.OWNER, is_active=True))
            else:
                ws.name = self._validate_name(ws, data.name, "OWNER")
                self._apply_slug(ws, data.slug)
                self._apply_profile(ws, data)

            if not ws.email:
                ws.email = user.email
            self._ensure_primary_branch(ws)
            ws.onboarding_step = max(ws.onboarding_step or 1, 2)
            self.db.commit()
        except IntegrityError:
            self.db.rollback()
            raise HTTPException(status_code=409, detail="This workspace URL is already taken.")
        except HTTPException:
            self.db.rollback()
            raise
        self.db.refresh(ws)
        if created:
            BillingService.get_or_create_workspace_subscription(self.db, ws.id)
        return ws, created

    def update_profile(self, ws: Workspace, data: BusinessProfileIn, role: str) -> Workspace:
        if role not in ORG_WIDE_ROLES:
            raise HTTPException(status_code=403, detail="Only owners and admins can edit the business profile.")
        try:
            ws.name = self._validate_name(ws, data.name, role)
            self._apply_slug(ws, data.slug)
            self._apply_profile(ws, data)
            self.db.commit()
        except HTTPException:
            self.db.rollback()
            raise
        self.db.refresh(ws)
        return ws

    def update_preferences(self, ws: Workspace, data: PreferencesIn, role: str) -> Workspace:
        if role not in ORG_WIDE_ROLES:
            raise HTTPException(status_code=403, detail="Only owners and admins can edit business settings.")
        ws.timezone = data.timezone
        ws.currency = data.currency
        ws.locale = data.locale
        ws.opening_hours = data.opening_hours.to_json()
        ws.closed_dates = json.dumps([d.model_dump(mode="json") for d in data.closed_dates])
        if not ws.onboarding_completed:
            ws.onboarding_step = max(ws.onboarding_step or 1, 3)
        self.db.commit()
        self.db.refresh(ws)
        return ws

    def save_logo(self, ws: Workspace, data: bytes, role: str) -> Workspace:
        if role not in ORG_WIDE_ROLES:
            raise HTTPException(status_code=403, detail="Only owners and admins can change the logo.")
        if not data:
            raise HTTPException(status_code=400, detail="Choose an image to upload.")
        if len(data) > LOGO_MAX_BYTES:
            raise HTTPException(status_code=413, detail="Logo must be 2 MB or smaller.")
        mime = _detect_mime_type(data)
        if mime not in _EXT:
            raise HTTPException(status_code=415, detail="Logo must be a PNG, JPG or WebP image.")
        folder = os.path.join(LOGO_DIR, ws.id)
        os.makedirs(folder, exist_ok=True)
        for old in os.listdir(folder):
            try:
                os.remove(os.path.join(folder, old))
            except OSError:
                pass
        name = f"{uuid.uuid4().hex}.{_EXT[mime]}"
        with open(os.path.join(folder, name), "wb") as fh:
            fh.write(data)
        ws.logo_url = f"/api/v1/organization/{ws.id}/logo/{name}"
        self.db.commit()
        self.db.refresh(ws)
        return ws

    def remove_logo(self, ws: Workspace, role: str) -> Workspace:
        if role not in ORG_WIDE_ROLES:
            raise HTTPException(status_code=403, detail="Only owners and admins can change the logo.")
        folder = os.path.join(LOGO_DIR, ws.id)
        if os.path.isdir(folder):
            for old in os.listdir(folder):
                try:
                    os.remove(os.path.join(folder, old))
                except OSError:
                    pass
        ws.logo_url = None
        self.db.commit()
        return ws

    @staticmethod
    def logo_path(workspace_id: str, filename: str) -> Optional[tuple[str, str]]:
        if not re.fullmatch(r"[0-9a-f]{32}\.(png|jpg|webp)", filename) or not re.fullmatch(r"[0-9a-zA-Z-]{1,64}", workspace_id):
            return None
        path = os.path.join(LOGO_DIR, workspace_id, filename)
        if not os.path.isfile(path):
            return None
        mime = {"png": "image/png", "jpg": "image/jpeg", "webp": "image/webp"}[filename.rsplit(".", 1)[1]]
        return path, mime

    # ─── Branches ─────────────────────────────────────────────────────────

    def _ensure_primary_branch(self, ws: Workspace) -> None:
        exists = self.db.query(GymLocation.id).filter(GymLocation.workspace_id == ws.id).first()
        if exists:
            return
        self.db.add(
            GymLocation(
                workspace_id=ws.id,
                name=f"{ws.name} — Main",
                code="MAIN",
                address=ws.address,
                address_line2=ws.address_line2,
                city=ws.city,
                state=ws.state,
                postal_code=ws.postal_code,
                country_code=ws.country_code,
                phone=ws.phone,
                email=ws.email,
                is_primary=True,
                is_active=True,
            )
        )
        self.db.flush()

    def branch_out(self, b: GymLocation, member_count: int = 0) -> BranchOut:
        return BranchOut(
            id=b.id,
            name=b.name,
            code=b.code,
            address_line1=b.address,
            address_line2=b.address_line2,
            city=b.city,
            state=b.state,
            postal_code=b.postal_code,
            country_code=b.country_code,
            phone=b.phone,
            email=b.email,
            timezone=b.timezone,
            opening_hours=parse_hours(b.opening_hours),
            is_primary=bool(b.is_primary),
            is_active=bool(b.is_active),
            member_count=member_count,
        )

    def list_branches(self, workspace_id: str, allowed: Optional[set[str]], include_inactive: bool = False) -> list[BranchOut]:
        q = self.db.query(GymLocation).filter(GymLocation.workspace_id == workspace_id)
        if not include_inactive:
            q = q.filter(GymLocation.is_active == True)
        rows = q.order_by(GymLocation.is_primary.desc(), GymLocation.created_at.asc()).all()
        counts = dict(
            self.db.query(BranchAssignment.branch_id, func.count(BranchAssignment.id))
            .filter(BranchAssignment.workspace_id == workspace_id)
            .group_by(BranchAssignment.branch_id)
            .all()
        )
        return [self.branch_out(b, counts.get(b.id, 0)) for b in rows if allowed is None or b.id in allowed]

    def _get_branch(self, workspace_id: str, branch_id: str) -> GymLocation:
        b = (
            self.db.query(GymLocation)
            .filter(GymLocation.id == branch_id, GymLocation.workspace_id == workspace_id)
            .first()
        )
        if not b:
            raise HTTPException(status_code=404, detail="Branch not found.")
        return b

    def _apply_branch(self, ws: Workspace, b: GymLocation, data: BranchIn) -> None:
        b.name = data.name
        b.address = data.address_line1
        b.address_line2 = data.address_line2
        b.city = data.city
        b.state = data.state
        b.postal_code = data.postal_code
        b.country_code = data.country_code or ws.country_code
        b.phone = optional_phone(data.phone, data.phone_country or b.country_code, "branch phone")
        b.email = str(data.email).lower() if data.email else None
        b.timezone = data.timezone
        b.opening_hours = data.opening_hours.to_json() if data.opening_hours else None
        if b.opening_hours:
            hours = json.loads(b.opening_hours)
            closes = [d["close"] for d in hours.values() if not d.get("closed") and d.get("close")]
            if closes:
                b.closing_time = max(closes)
        if data.is_primary:
            self.db.query(GymLocation).filter(
                GymLocation.workspace_id == ws.id, GymLocation.id != b.id
            ).update({"is_primary": False}, synchronize_session=False)
            b.is_primary = True

    def create_branch(self, ws: Workspace, data: BranchIn, role: str) -> BranchOut:
        if role not in ORG_WIDE_ROLES:
            raise HTTPException(status_code=403, detail="Only owners and admins can add branches.")
        active = self.db.query(func.count(GymLocation.id)).filter(
            GymLocation.workspace_id == ws.id, GymLocation.is_active == True
        ).scalar() or 0
        limit = BillingService.get_effective_limits(self.db, ws.id)["max_branches"]
        if limit >= 0 and active >= limit:
            raise HTTPException(
                status_code=402,
                detail=f"Your plan allows {limit} branch{'es' if limit != 1 else ''}. Upgrade to add more.",
            )
        code = data.code or re.sub(r"[^A-Z0-9]+", "-", data.name.upper()).strip("-")[:20] or "BRANCH"
        base, n = code, 2
        while self.db.query(GymLocation.id).filter(GymLocation.workspace_id == ws.id, GymLocation.code == code).first():
            if data.code:
                raise HTTPException(status_code=409, detail="Another branch already uses this code.")
            code = f"{base}-{n}"
            n += 1
        dup_name = self.db.query(GymLocation.id).filter(
            GymLocation.workspace_id == ws.id,
            GymLocation.is_active == True,
            func.lower(GymLocation.name) == data.name.lower(),
        ).first()
        if dup_name:
            raise HTTPException(status_code=409, detail="A branch with this name already exists.")
        b = GymLocation(workspace_id=ws.id, code=code, is_active=True, is_primary=False, name=data.name)
        self.db.add(b)
        self._apply_branch(ws, b, data)
        if not self.db.query(GymLocation.id).filter(GymLocation.workspace_id == ws.id, GymLocation.is_primary == True).first():
            b.is_primary = True
        try:
            self.db.commit()
        except IntegrityError:
            self.db.rollback()
            raise HTTPException(status_code=409, detail="Another branch already uses this code.")
        self.db.refresh(b)
        return self.branch_out(b)

    def update_branch(self, ws: Workspace, branch_id: str, data: BranchIn, role: str) -> BranchOut:
        if role not in ORG_WIDE_ROLES:
            raise HTTPException(status_code=403, detail="Only owners and admins can edit branches.")
        b = self._get_branch(ws.id, branch_id)
        dup_name = self.db.query(GymLocation.id).filter(
            GymLocation.workspace_id == ws.id,
            GymLocation.id != b.id,
            GymLocation.is_active == True,
            func.lower(GymLocation.name) == data.name.lower(),
        ).first()
        if dup_name:
            raise HTTPException(status_code=409, detail="A branch with this name already exists.")
        if data.code and data.code != b.code:
            if self.db.query(GymLocation.id).filter(GymLocation.workspace_id == ws.id, GymLocation.code == data.code).first():
                raise HTTPException(status_code=409, detail="Another branch already uses this code.")
            b.code = data.code
        self._apply_branch(ws, b, data)
        self.db.commit()
        self.db.refresh(b)
        return self.branch_out(b)

    def set_branch_active(self, ws: Workspace, branch_id: str, active: bool, role: str) -> BranchOut:
        if role not in ORG_WIDE_ROLES:
            raise HTTPException(status_code=403, detail="Only owners and admins can change branches.")
        b = self._get_branch(ws.id, branch_id)
        if not active:
            remaining = self.db.query(func.count(GymLocation.id)).filter(
                GymLocation.workspace_id == ws.id, GymLocation.is_active == True, GymLocation.id != b.id
            ).scalar()
            if not remaining:
                raise HTTPException(status_code=400, detail="An organization needs at least one active branch.")
            b.is_active = False
            if b.is_primary:
                b.is_primary = False
                nxt = self.db.query(GymLocation).filter(
                    GymLocation.workspace_id == ws.id, GymLocation.is_active == True, GymLocation.id != b.id
                ).order_by(GymLocation.created_at.asc()).first()
                nxt.is_primary = True
            self.db.query(BranchAssignment).filter(BranchAssignment.branch_id == b.id).delete(synchronize_session=False)
        else:
            b.is_active = True
        self.db.commit()
        self.db.refresh(b)
        return self.branch_out(b)

    def validate_branch_ids(self, workspace_id: str, branch_ids: list[str]) -> list[str]:
        unique = list(dict.fromkeys(branch_ids))
        if not unique:
            return []
        found = {
            b.id
            for b in self.db.query(GymLocation).filter(
                GymLocation.workspace_id == workspace_id,
                GymLocation.is_active == True,
                GymLocation.id.in_(unique),
            )
        }
        if len(found) != len(unique):
            raise HTTPException(status_code=422, detail="One or more selected branches don't belong to this organization.")
        return unique

    def set_assignments(self, member: WorkspaceMember, branch_ids: list[str]) -> None:
        branch_ids = self.validate_branch_ids(member.workspace_id, branch_ids)
        self.db.query(BranchAssignment).filter(BranchAssignment.workspace_member_id == member.id).delete(
            synchronize_session=False
        )
        for bid in branch_ids:
            self.db.add(BranchAssignment(workspace_id=member.workspace_id, workspace_member_id=member.id, branch_id=bid))
        self.db.flush()

    # ─── Team ─────────────────────────────────────────────────────────────

    def list_team(self, workspace_id: str, current_user_id: str) -> list[TeamMemberOut]:
        rows = (
            self.db.query(WorkspaceMember, User)
            .join(User, User.id == WorkspaceMember.user_id)
            .filter(WorkspaceMember.workspace_id == workspace_id, WorkspaceMember.role != UserRole.USER)
            .order_by(WorkspaceMember.created_at.asc())
            .all()
        )
        assignments: dict[str, list[str]] = {}
        for a in self.db.query(BranchAssignment).filter(BranchAssignment.workspace_id == workspace_id):
            assignments.setdefault(a.workspace_member_id, []).append(a.branch_id)
        out = []
        for m, u in rows:
            ids = assignments.get(m.id, [])
            out.append(
                TeamMemberOut(
                    id=m.id,
                    user_id=u.id,
                    full_name=u.full_name,
                    email=u.email,
                    phone=u.phone_e164 or u.phone,
                    role=m.role.value,
                    is_active=bool(m.is_active),
                    branch_ids=ids,
                    all_branches=m.role.value in ORG_WIDE_ROLES or not ids,
                    is_self=u.id == current_user_id,
                    joined_at=m.created_at.isoformat() if m.created_at else None,
                )
            )
        return out

    def update_team_member(self, tenant: TenantContext, member_id: str, data: TeamMemberUpdate) -> TeamMemberOut:
        if tenant.role not in ORG_WIDE_ROLES:
            raise HTTPException(status_code=403, detail="Only owners and admins can manage team access.")
        member = (
            self.db.query(WorkspaceMember)
            .filter(WorkspaceMember.id == member_id, WorkspaceMember.workspace_id == tenant.workspace_id)
            .first()
        )
        if not member:
            raise HTTPException(status_code=404, detail="Team member not found.")
        if member.user_id == tenant.user_id and (data.role is not None or data.is_active is False):
            raise HTTPException(status_code=400, detail="You can't change your own role or deactivate yourself.")
        if member.role == UserRole.OWNER:
            raise HTTPException(status_code=403, detail="The owner's access can't be changed here.")
        if tenant.role == "ADMIN" and (member.role == UserRole.ADMIN or data.role == "ADMIN"):
            raise HTTPException(status_code=403, detail="Only the owner can manage admins.")

        if data.role is not None and data.role != member.role.value:
            member.role = UserRole(data.role)
            if member.role == UserRole.TRAINER:
                self._ensure_trainer_record(member)
        if data.is_active is not None:
            member.is_active = data.is_active
        if data.branch_ids is not None:
            self.set_assignments(member, data.branch_ids)
        self.db.commit()
        return next(m for m in self.list_team(tenant.workspace_id, tenant.user_id) if m.id == member.id)

    def _ensure_trainer_record(self, member: WorkspaceMember) -> None:
        user = member.user
        existing = (
            self.db.query(Trainer)
            .filter(Trainer.workspace_id == member.workspace_id, Trainer.user_id == user.id)
            .first()
        )
        if existing:
            existing.is_active = True
            existing.status = TrainerStatus.ACTIVE
            return
        self.db.add(
            Trainer(
                workspace_id=member.workspace_id,
                user_id=user.id,
                name=user.full_name,
                email=user.email,
                phone=user.phone_e164 or user.phone or "",
                specialization="General Fitness",
                status=TrainerStatus.ACTIVE,
                is_active=True,
            )
        )

    # ─── Onboarding ───────────────────────────────────────────────────────

    def onboarding_steps(self, ws: Optional[Workspace]) -> dict[str, bool]:
        if ws is None:
            return {s: False for s in ONBOARDING_STEPS}
        has_branch = bool(
            self.db.query(GymLocation.id).filter(GymLocation.workspace_id == ws.id, GymLocation.is_active == True).first()
        )
        return {
            "business": bool(ws.name and ws.phone and ws.address and ws.city and ws.country_code),
            "preferences": bool(ws.timezone and ws.currency and ws.opening_hours),
            "branches": has_branch and (ws.onboarding_step or 1) >= 4,
            "team": (ws.onboarding_step or 1) >= 5,
            "launch": bool(ws.onboarding_completed),
        }

    def advance_step(self, ws: Workspace, step: str) -> Workspace:
        target = {"branches": 4, "team": 5}.get(step)
        if target is None:
            raise HTTPException(status_code=422, detail="Unknown onboarding step.")
        if step == "branches" and not self.db.query(GymLocation.id).filter(
            GymLocation.workspace_id == ws.id, GymLocation.is_active == True
        ).first():
            raise HTTPException(status_code=422, detail="Add at least one branch to continue.")
        ws.onboarding_step = max(ws.onboarding_step or 1, target)
        self.db.commit()
        self.db.refresh(ws)
        return ws

    def complete_onboarding(self, ws: Workspace, chosen_plan: Optional[str], billing_cycle: str, actor_id: str):
        steps = self.onboarding_steps(ws)
        missing = [k for k in ("business", "preferences") if not steps[k]]
        if not self.db.query(GymLocation.id).filter(GymLocation.workspace_id == ws.id, GymLocation.is_active == True).first():
            missing.append("branches")
        if missing:
            raise HTTPException(
                status_code=422,
                detail=f"Finish these steps before launching: {', '.join(missing)}.",
            )
        ws.onboarding_completed = True
        ws.onboarding_step = len(ONBOARDING_STEPS)
        self.db.commit()
        sub = BillingService.get_or_create_workspace_subscription(self.db, ws.id)
        if chosen_plan and chosen_plan not in ("free_trial", "growth_trial"):
            try:
                sub = BillingService.change_gym_plan(
                    self.db, ws.id, new_plan_code=chosen_plan, billing_cycle=billing_cycle,
                    actor_user_id=actor_id, reason=f"Selected {chosen_plan} plan during onboarding",
                )
            except Exception:
                self.db.rollback()
                sub = BillingService.get_or_create_workspace_subscription(self.db, ws.id)
        self.db.refresh(ws)
        return ws, sub
