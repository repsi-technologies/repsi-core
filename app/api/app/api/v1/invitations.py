"""
Organization invitations.

- Only owners, admins and managers can invite, and only into their own organization.
  Managers may invite members, trainers and staff; admins up to managers; owners anyone.
- One pending invitation per (organization, email): re-inviting replaces the old token.
- Acceptance resolves to the canonical account for the invited email:
    * signed-in caller  -> must be that account (same email, or the invited phone verified);
    * no account yet    -> a new account is created (the emailed token proves the email);
    * account exists but caller is signed out -> 409, sign in first (passwords are never
      overwritten by an invitation).
- Granted branch access comes from the invitation and is validated against the org.
"""
import hashlib
import json
import secrets
from datetime import date, datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.email import send_direct_credentials_email, send_gym_invitation
from app.core.phone import normalize_phone, optional_phone
from app.core.rate_limit import client_ip, enforce_rate_limit
from app.core.security import decode_access_token, get_password_hash
from app.middleware.entitlements import assert_capacity
from app.middleware.tenant import TenantContext, get_current_tenant, require_roles
from app.models.attendance import GymLocation
from app.models.invitation import GymInvitation, InvitationRole, InvitationStatus
from app.models.member import Member, MemberStatus
from app.models.trainer import Trainer, TrainerStatus
from app.models.user import User, UserRole, Workspace, WorkspaceMember
from app.schemas.auth import PASSWORD_MIN_LENGTH, Token
from app.services.auth import UNUSABLE_PASSWORD, AuthService, normalize_email
from app.services.billing import STAFF_LIMIT_ROLES
from app.services.organization import OrganizationService

router = APIRouter(prefix="/invitations", tags=["Invitations"])

INVITE_TTL_DAYS = 7
ROLE_MAP = {
    InvitationRole.MEMBER: UserRole.USER,
    InvitationRole.TRAINER: UserRole.TRAINER,
    InvitationRole.STAFF: UserRole.STAFF,
    InvitationRole.MANAGER: UserRole.MANAGER,
    InvitationRole.ADMIN: UserRole.ADMIN,
}
# Which invitation roles each inviter role may grant.
GRANTABLE = {
    "SUPER_ADMIN": set(InvitationRole),
    "OWNER": set(InvitationRole),
    "ADMIN": {InvitationRole.MEMBER, InvitationRole.TRAINER, InvitationRole.STAFF, InvitationRole.MANAGER},
    "MANAGER": {InvitationRole.MEMBER, InvitationRole.TRAINER, InvitationRole.STAFF},
}


class InvitationCreateRequest(BaseModel):
    name: str = Field(min_length=2, max_length=255)
    email: EmailStr
    phone: Optional[str] = Field(default=None, max_length=32)
    phone_country: Optional[str] = Field(default=None, max_length=2)
    role: InvitationRole
    specialization: Optional[str] = Field(default=None, max_length=150)
    branch_ids: list[str] = Field(default_factory=list, max_length=200)


class InvitationResponse(BaseModel):
    id: str
    workspace_id: str
    email: str
    name: str
    phone: Optional[str] = None
    role: InvitationRole
    specialization: Optional[str] = None
    status: InvitationStatus
    expires_at: datetime
    created_at: datetime
    accepted_at: Optional[datetime] = None
    branch_ids: list[str] = []
    invited_by_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class InvitationVerifyResponse(BaseModel):
    id: str
    email: str
    name: str
    role: InvitationRole
    gym_name: str
    gym_slug: str
    gym_logo_url: Optional[str] = None
    invited_by_name: Optional[str] = None
    status: InvitationStatus
    expires_at: datetime
    account_exists: bool
    branch_names: list[str] = []


class InvitationAcceptRequest(BaseModel):
    token: str = Field(min_length=16)
    password: Optional[str] = None
    full_name: Optional[str] = Field(default=None, max_length=255)


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def _aware(dt: datetime) -> datetime:
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)


def _branch_ids(inv: GymInvitation) -> list[str]:
    try:
        value = json.loads(inv.branch_ids or "[]")
        return [str(v) for v in value] if isinstance(value, list) else []
    except ValueError:
        return []


def _assert_join_capacity(db: Session, workspace_id: str, role: InvitationRole, user_id: Optional[str], email: str) -> None:
    """Rejects (409 PLAN_LIMIT_REACHED) a join that would add an active member, trainer or staff account over quota."""
    if role == InvitationRole.MEMBER:
        already = db.query(Member.id).filter(
            Member.workspace_id == workspace_id, func.lower(Member.email) == email,
            Member.status == MemberStatus.ACTIVE,
        ).first()
        resource = "members"
    elif role == InvitationRole.TRAINER:
        already = db.query(Trainer.id).filter(
            Trainer.workspace_id == workspace_id, func.lower(Trainer.email) == email, Trainer.is_active == True,
        ).first()
        resource = "trainers"
    else:
        already = db.query(WorkspaceMember.id).filter(
            WorkspaceMember.workspace_id == workspace_id, WorkspaceMember.user_id == user_id,
            WorkspaceMember.is_active == True, WorkspaceMember.role.in_(STAFF_LIMIT_ROLES),
        ).first()
        resource = "staff"
    if not already:
        assert_capacity(db, workspace_id, resource)


def _to_response(inv: GymInvitation) -> InvitationResponse:
    return InvitationResponse(
        id=inv.id,
        workspace_id=inv.workspace_id,
        email=inv.email,
        name=inv.name,
        phone=inv.phone,
        role=inv.role,
        specialization=inv.specialization,
        status=inv.status,
        expires_at=inv.expires_at,
        created_at=inv.created_at,
        accepted_at=inv.accepted_at,
        branch_ids=_branch_ids(inv),
        invited_by_name=inv.invited_by.full_name if inv.invited_by else None,
    )


def _expire_if_needed(db: Session, inv: GymInvitation) -> None:
    if inv.status == InvitationStatus.PENDING and datetime.now(timezone.utc) > _aware(inv.expires_at):
        inv.status = InvitationStatus.EXPIRED
        db.commit()


def _load_by_token(db: Session, token: str) -> GymInvitation:
    inv = db.query(GymInvitation).filter(GymInvitation.token_hash == _hash_token(token.strip())).first()
    if not inv:
        raise HTTPException(status_code=404, detail="This invitation link is invalid.")
    _expire_if_needed(db, inv)
    messages = {
        InvitationStatus.EXPIRED: "This invitation has expired. Ask the organization to send a new one.",
        InvitationStatus.REVOKED: "This invitation was cancelled by the organization.",
        InvitationStatus.ACCEPTED: "This invitation has already been accepted. Sign in to continue.",
    }
    if inv.status in messages:
        raise HTTPException(status_code=410, detail=messages[inv.status])
    return inv


def _send(inv: GymInvitation, workspace: Workspace, raw_token: str) -> None:
    invite_url = f"{settings.FRONTEND_URL.rstrip('/')}/invite/accept?token={raw_token}"
    send_gym_invitation(
        email=inv.email, name=inv.name, role=inv.role.value, gym_name=workspace.name, invite_url=invite_url
    )


@router.post("/", response_model=InvitationResponse, status_code=status.HTTP_201_CREATED)
@router.post("", response_model=InvitationResponse, status_code=status.HTTP_201_CREATED, include_in_schema=False)
def create_invitation(
    data: InvitationCreateRequest,
    tenant: TenantContext = Depends(require_roles("OWNER", "ADMIN", "MANAGER", "SUPER_ADMIN")),
    db: Session = Depends(get_db),
):
    if data.role not in GRANTABLE.get(tenant.role, set()):
        raise HTTPException(status_code=403, detail="You can't invite people with this role.")
    workspace = db.query(Workspace).filter(Workspace.id == tenant.workspace_id, Workspace.is_active == True).first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Organization not found.")

    email = normalize_email(data.email)
    phone = optional_phone(data.phone, data.phone_country or workspace.country_code or "IN", "phone")
    branch_ids = OrganizationService(db).validate_branch_ids(workspace.id, data.branch_ids)

    existing_user = db.query(User).filter(func.lower(User.email) == email).first()
    if existing_user:
        active = db.query(WorkspaceMember).filter(
            WorkspaceMember.workspace_id == workspace.id,
            WorkspaceMember.user_id == existing_user.id,
            WorkspaceMember.is_active == True,
        ).first()
        if active:
            raise HTTPException(status_code=409, detail="This person is already part of your organization.")

    # Replace any pending invitation for the same email in this organization.
    db.query(GymInvitation).filter(
        GymInvitation.workspace_id == workspace.id,
        func.lower(GymInvitation.email) == email,
        GymInvitation.status == InvitationStatus.PENDING,
    ).update({"status": InvitationStatus.REVOKED}, synchronize_session=False)

    raw_token = secrets.token_urlsafe(32)
    invitation = GymInvitation(
        workspace_id=workspace.id,
        email=email,
        name=" ".join(data.name.split()),
        phone=phone,
        role=data.role,
        specialization=(data.specialization or "").strip() or None,
        token_hash=_hash_token(raw_token),
        expires_at=datetime.now(timezone.utc) + timedelta(days=INVITE_TTL_DAYS),
        invited_by_id=tenant.user_id,
        status=InvitationStatus.PENDING,
        branch_ids=json.dumps(branch_ids),
    )
    db.add(invitation)
    db.commit()
    db.refresh(invitation)
    _send(invitation, workspace, raw_token)
    return _to_response(invitation)


@router.get("", response_model=list[InvitationResponse])
@router.get("/", response_model=list[InvitationResponse], include_in_schema=False)
def list_invitations(
    status_filter: Optional[InvitationStatus] = None,
    tenant: TenantContext = Depends(require_roles("OWNER", "ADMIN", "MANAGER", "SUPER_ADMIN")),
    db: Session = Depends(get_db),
):
    q = db.query(GymInvitation).filter(GymInvitation.workspace_id == tenant.workspace_id)
    rows = q.order_by(GymInvitation.created_at.desc()).limit(500).all()
    now = datetime.now(timezone.utc)
    changed = False
    for inv in rows:
        if inv.status == InvitationStatus.PENDING and now > _aware(inv.expires_at):
            inv.status = InvitationStatus.EXPIRED
            changed = True
    if changed:
        db.commit()
    if status_filter:
        rows = [r for r in rows if r.status == status_filter]
    return [_to_response(r) for r in rows]


def _get_owned(db: Session, tenant: TenantContext, invitation_id: str) -> GymInvitation:
    inv = db.query(GymInvitation).filter(
        GymInvitation.id == invitation_id, GymInvitation.workspace_id == tenant.workspace_id
    ).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invitation not found.")
    return inv


@router.post("/{invitation_id}/revoke", response_model=InvitationResponse)
def revoke_invitation(
    invitation_id: str,
    tenant: TenantContext = Depends(require_roles("OWNER", "ADMIN", "MANAGER", "SUPER_ADMIN")),
    db: Session = Depends(get_db),
):
    inv = _get_owned(db, tenant, invitation_id)
    if inv.status != InvitationStatus.PENDING:
        raise HTTPException(status_code=409, detail="Only pending invitations can be cancelled.")
    inv.status = InvitationStatus.REVOKED
    db.commit()
    db.refresh(inv)
    return _to_response(inv)


@router.post("/{invitation_id}/resend", response_model=InvitationResponse)
def resend_invitation(
    invitation_id: str,
    request: Request,
    tenant: TenantContext = Depends(require_roles("OWNER", "ADMIN", "MANAGER", "SUPER_ADMIN")),
    db: Session = Depends(get_db),
):
    enforce_rate_limit(f"invite-resend:{client_ip(request)}:{invitation_id}", 3, 600)
    inv = _get_owned(db, tenant, invitation_id)
    _expire_if_needed(db, inv)
    if inv.status not in (InvitationStatus.PENDING, InvitationStatus.EXPIRED):
        raise HTTPException(status_code=409, detail="This invitation can't be resent.")
    if inv.role not in GRANTABLE.get(tenant.role, set()):
        raise HTTPException(status_code=403, detail="You can't invite people with this role.")
    raw_token = secrets.token_urlsafe(32)
    inv.token_hash = _hash_token(raw_token)
    inv.expires_at = datetime.now(timezone.utc) + timedelta(days=INVITE_TTL_DAYS)
    inv.status = InvitationStatus.PENDING
    db.commit()
    db.refresh(inv)
    workspace = db.query(Workspace).filter(Workspace.id == inv.workspace_id).first()
    _send(inv, workspace, raw_token)
    return _to_response(inv)


@router.get("/verify", response_model=InvitationVerifyResponse)
def verify_invitation(token: str, request: Request, db: Session = Depends(get_db)):
    enforce_rate_limit(f"invite-verify:{client_ip(request)}", 30, 300)
    inv = _load_by_token(db, token)
    workspace = db.query(Workspace).filter(Workspace.id == inv.workspace_id).first()
    if not workspace or not workspace.is_active:
        raise HTTPException(status_code=410, detail="This organization is no longer active.")
    branch_ids = _branch_ids(inv)
    branch_names = [
        b.name
        for b in db.query(GymLocation).filter(GymLocation.workspace_id == workspace.id, GymLocation.id.in_(branch_ids))
    ] if branch_ids else []
    account_exists = bool(db.query(User.id).filter(func.lower(User.email) == normalize_email(inv.email)).first())
    return InvitationVerifyResponse(
        id=inv.id,
        email=inv.email,
        name=inv.name,
        role=inv.role,
        gym_name=workspace.name,
        gym_slug=workspace.slug,
        gym_logo_url=workspace.logo_url,
        invited_by_name=inv.invited_by.full_name if inv.invited_by else None,
        status=inv.status,
        expires_at=inv.expires_at,
        account_exists=account_exists,
        branch_names=branch_names,
    )


def _optional_user(authorization: Optional[str], db: Session) -> Optional[User]:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    payload = decode_access_token(authorization.split(" ", 1)[1])
    if not payload or not payload.get("sub"):
        raise HTTPException(status_code=401, detail="Your session has expired. Please sign in again.")
    user = db.query(User).filter(User.id == payload["sub"]).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Your session has expired. Please sign in again.")
    return user


@router.post("/accept", response_model=Token)
def accept_invitation(
    data: InvitationAcceptRequest,
    request: Request,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    enforce_rate_limit(f"invite-accept:{client_ip(request)}", 20, 900)
    inv = _load_by_token(db, data.token)
    workspace = db.query(Workspace).filter(Workspace.id == inv.workspace_id).first()
    if not workspace or not workspace.is_active:
        raise HTTPException(status_code=410, detail="This organization is no longer active.")

    email = normalize_email(inv.email)
    caller = _optional_user(authorization, db)
    auth = AuthService(db)
    if caller is not None:
        invited_phone = normalize_phone(inv.phone, workspace.country_code or "IN") if inv.phone else None
        same_email = normalize_email(caller.email) == email
        same_phone = bool(invited_phone and caller.phone_verified and caller.phone_e164 == invited_phone)
        if not (same_email or same_phone):
            raise HTTPException(
                status_code=403,
                detail=f"This invitation was sent to {inv.email}. Sign in with that account to accept it.",
            )
        _assert_join_capacity(db, workspace.id, inv.role, caller.id, email)
        user = caller
        if same_email and not user.email_verified:
            user.email_verified = True  # the emailed token proves this inbox
    else:
        user = auth.get_by_email(email)
        if user is not None:
            raise HTTPException(
                status_code=409,
                detail="You already have a REPSI account. Sign in to accept this invitation.",
            )
        if not data.password or len(data.password) < PASSWORD_MIN_LENGTH:
            raise HTTPException(
                status_code=422, detail=f"Choose a password with at least {PASSWORD_MIN_LENGTH} characters."
            )
        # Quota check before the account row is written, so a rejected join leaves nothing behind.
        _assert_join_capacity(db, workspace.id, inv.role, None, email)
        user = User(
            email=email,
            full_name=" ".join((data.full_name or inv.name).split()) or inv.name,
            hashed_password=get_password_hash(data.password),
            phone=inv.phone,
            email_verified=True,
            is_active=True,
        )
        db.add(user)
        db.flush()

    role = ROLE_MAP[inv.role]
    membership = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == workspace.id, WorkspaceMember.user_id == user.id
    ).first()
    if membership is None:
        membership = WorkspaceMember(workspace_id=workspace.id, user_id=user.id, role=role, is_active=True)
        db.add(membership)
        db.flush()
    else:
        if not membership.is_active:
            membership.role = role
            membership.is_active = True
        elif membership.role == UserRole.USER and role != UserRole.USER:
            membership.role = role  # upgrade only; never demote an existing role

    granted = [
        b.id
        for b in db.query(GymLocation).filter(
            GymLocation.workspace_id == workspace.id,
            GymLocation.is_active == True,
            GymLocation.id.in_(_branch_ids(inv) or ["-"]),
        )
    ]
    if granted:
        OrganizationService(db).set_assignments(membership, granted)

    if inv.role == InvitationRole.MEMBER:
        member = db.query(Member).filter(
            Member.workspace_id == workspace.id, func.lower(Member.email) == email
        ).first()
        if member is None:
            first, _, last = inv.name.partition(" ")
            db.add(Member(
                workspace_id=workspace.id, user_id=user.id, first_name=first, last_name=last,
                email=email, phone=inv.phone or "", status=MemberStatus.ACTIVE, joined_date=date.today(),
            ))
        elif member.user_id in (None, user.id):
            member.user_id = user.id
    elif inv.role == InvitationRole.TRAINER:
        trainer = db.query(Trainer).filter(
            Trainer.workspace_id == workspace.id, func.lower(Trainer.email) == email
        ).first()
        if trainer is None:
            db.add(Trainer(
                workspace_id=workspace.id, user_id=user.id, name=inv.name, email=email,
                phone=inv.phone or "", specialization=inv.specialization or "General Fitness",
                status=TrainerStatus.ACTIVE, is_active=True,
            ))
        elif trainer.user_id in (None, user.id):
            trainer.user_id = user.id
            if inv.specialization:
                trainer.specialization = inv.specialization

    inv.status = InvitationStatus.ACCEPTED
    inv.accepted_at = datetime.now(timezone.utc)
    inv.accepted_user_id = user.id
    db.commit()
    db.refresh(user)
    return auth.issue_session(user, workspace.id)


class DirectAddRequest(BaseModel):
    name: str = Field(min_length=2, max_length=255)
    email: EmailStr
    phone: Optional[str] = None
    role: InvitationRole
    password: Optional[str] = None
    specialization: Optional[str] = None


@router.post("/direct-add", status_code=status.HTTP_201_CREATED)
def direct_add_user(
    data: DirectAddRequest,
    tenant: TenantContext = Depends(get_current_tenant),
    db: Session = Depends(get_db),
):
    if tenant.role not in ["OWNER", "SUPER_ADMIN", "ADMIN", "MANAGER"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only gym owners and managers can provision user accounts directly.",
        )
    if data.role not in (InvitationRole.MEMBER, InvitationRole.TRAINER):
        raise HTTPException(status_code=422, detail="Direct add supports members and trainers. Invite staff instead.")

    workspace = db.query(Workspace).filter(Workspace.id == tenant.workspace_id).first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found.")

    normalized_email = normalize_email(data.email)

    # Existing accounts keep their password; new accounts get the provided password or
    # none (they sign in via WhatsApp OTP or "Forgot password").
    user = db.query(User).filter(func.lower(User.email) == normalized_email).first()
    _assert_join_capacity(db, workspace.id, data.role, user.id if user else None, normalized_email)
    if not user:
        password = data.password.strip() if data.password and len(data.password.strip()) >= PASSWORD_MIN_LENGTH else None
        user = User(
            email=normalized_email,
            full_name=data.name.strip(),
            hashed_password=get_password_hash(password) if password else UNUSABLE_PASSWORD,
            phone=data.phone.strip() if data.phone else None,
            email_verified=False,
            is_active=True,
        )
        db.add(user)
        db.flush()
    elif data.phone and not user.phone:
        user.phone = data.phone.strip()

    assigned_role = ROLE_MAP[data.role]
    ws_member = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == workspace.id,
        WorkspaceMember.user_id == user.id,
    ).first()
    if not ws_member:
        db.add(WorkspaceMember(workspace_id=workspace.id, user_id=user.id, role=assigned_role, is_active=True))
    elif not ws_member.is_active or ws_member.role == UserRole.USER:
        ws_member.role = assigned_role if ws_member.role == UserRole.USER or not ws_member.is_active else ws_member.role
        ws_member.is_active = True

    if data.role == InvitationRole.MEMBER:
        existing_member = db.query(Member).filter(
            Member.workspace_id == workspace.id,
            func.lower(Member.email) == normalized_email,
        ).first()
        if not existing_member:
            first_name, _, last_name = data.name.strip().partition(" ")
            db.add(Member(
                workspace_id=workspace.id, user_id=user.id, first_name=first_name, last_name=last_name,
                email=normalized_email, phone=data.phone or "", status=MemberStatus.ACTIVE, joined_date=date.today(),
            ))
        else:
            existing_member.user_id = user.id
            existing_member.status = MemberStatus.ACTIVE
    else:
        existing_trainer = db.query(Trainer).filter(
            Trainer.workspace_id == workspace.id,
            func.lower(Trainer.email) == normalized_email,
        ).first()
        if not existing_trainer:
            db.add(Trainer(
                workspace_id=workspace.id, user_id=user.id, name=data.name.strip(), email=normalized_email,
                phone=data.phone or "", specialization=data.specialization or "General Fitness",
                status=TrainerStatus.ACTIVE, is_active=True,
            ))
        else:
            existing_trainer.user_id = user.id
            existing_trainer.status = TrainerStatus.ACTIVE
            existing_trainer.is_active = True
            if data.specialization:
                existing_trainer.specialization = data.specialization

    db.commit()

    send_direct_credentials_email(
        email=normalized_email,
        name=data.name.strip(),
        role=data.role.value,
        gym_name=workspace.name,
        password="",
        login_url=f"{settings.FRONTEND_URL.rstrip('/')}/login",
    )

    return {
        "status": "success",
        "message": f"Account for {data.name} created and welcome notification emailed to {normalized_email}.",
        "user_id": user.id,
        "email": normalized_email,
        "role": assigned_role.value,
    }
