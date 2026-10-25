from typing import Optional, List, Dict, Any
from datetime import date, timedelta
import csv
import io
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Response, status
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from pydantic import BaseModel
from app.core.database import get_db
from app.core.security import get_password_hash
from app.models.member import Member, MemberStatus, Membership, MembershipPlan
from app.models.user import User, WorkspaceMember, UserRole
import json
from app.schemas.member import (
    MemberCreate, MemberUpdate, MemberResponse, MemberListResponse, CheckContactRequest, CheckContactResponse,
    MemberStatusChangeRequest, MemberNoteCreate, MemberNoteResponse, MemberHistoryItem,
    MemberSelfResponse, MemberSelfUpdate, SelfMembershipItem, SelfPaymentItem,
)
from app.models.member_records import MemberEvent, MemberNote, MembershipEvent
from app.models.finance import Payment
from app.models.system import AuditLog
from app.repositories.member import MemberRepository
from app.middleware.tenant import get_current_tenant, require_roles, TenantContext
from app.services.member_lifecycle import change_member_status, record_member_event, ACCOUNT_STATUSES, get_or_create_member_for_user
from app.services import membership_lifecycle
from app.middleware.entitlements import capacity_error, check_member_capacity

router = APIRouter(prefix="/members", tags=["Members"])


class MemberRenewRequest(BaseModel):
    plan_id: Optional[str] = None
    plan_name: Optional[str] = None
    duration_months: Optional[int] = None
    price_paid: Optional[float] = None
    start_date: Optional[date] = None


def require_member_manage_access(tenant: TenantContext = Depends(get_current_tenant)) -> TenantContext:
    allowed = {UserRole.OWNER.value, UserRole.SUPER_ADMIN.value, UserRole.ADMIN.value, UserRole.MANAGER.value, UserRole.STAFF.value, UserRole.TRAINER.value}
    role_str = tenant.role.value if hasattr(tenant.role, "value") else str(tenant.role)
    if role_str not in allowed:
        raise HTTPException(status_code=403, detail="Access denied. Only gym staff, trainers, and owners can view members.")
    return tenant


def require_member_mutation_access(tenant: TenantContext = Depends(get_current_tenant)) -> TenantContext:
    allowed = {UserRole.OWNER.value, UserRole.SUPER_ADMIN.value, UserRole.ADMIN.value, UserRole.MANAGER.value, UserRole.STAFF.value}
    role_str = tenant.role.value if hasattr(tenant.role, "value") else str(tenant.role)
    if role_str not in allowed:
        raise HTTPException(status_code=403, detail="Forbidden. Only gym staff, managers, and owners can create or modify members.")
    return tenant


@router.get("", response_model=MemberListResponse)
@router.get("/", response_model=MemberListResponse, include_in_schema=False)
def list_members(
    query: Optional[str] = None,
    status: Optional[str] = None,
    plan_id: Optional[str] = None,
    joined_from: Optional[date] = None,
    joined_to: Optional[date] = None,
    include_archived: bool = False,
    sort: str = Query("-created_at", pattern="^-?(created_at|joined_date|first_name|status)$"),
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    tenant: TenantContext = Depends(require_member_manage_access),
    db: Session = Depends(get_db)
):
    repo = MemberRepository(db, tenant.workspace_id)
    skip = (page - 1) * page_size
    filters = dict(
        query=query or "", status=status, plan_id=plan_id, joined_from=joined_from,
        joined_to=joined_to, include_archived=include_archived,
    )
    items = repo.search(**filters, sort=sort, skip=skip, limit=page_size)
    total = repo.count_search(**filters)
    return MemberListResponse(items=items, total=total, page=page, page_size=page_size)


@router.get("/export-csv")
def export_members_csv(
    tenant: TenantContext = Depends(require_roles("OWNER", "ADMIN", "MANAGER", "SUPER_ADMIN")),
    db: Session = Depends(get_db)
):
    # Gyms always keep access to their own data: export is never withheld by plan or subscription state.
    repo = MemberRepository(db, tenant.workspace_id)
    members = repo.get_multi(limit=5000)

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "First Name", "Last Name", "Email", "Phone", "Gender", "Status", "Joined Date", "Emergency Contact"])
    for m in members:
        writer.writerow([
            m.id,
            m.first_name,
            m.last_name,
            m.email,
            m.phone,
            m.gender or "",
            m.status.value,
            m.joined_date.isoformat() if m.joined_date else "",
            m.emergency_contact or ""
        ])

    db.add(AuditLog(
        workspace_id=tenant.workspace_id,
        user_id=tenant.user_id,
        action="members_exported",
        details=json.dumps({"rows": len(members), "format": "csv"}),
    ))
    db.commit()

    today_str = date.today().isoformat()
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=repsi_members_{today_str}.csv"
        }
    )


@router.post("/check-contact", response_model=CheckContactResponse)
def check_member_contact(
    req: CheckContactRequest,
    tenant: TenantContext = Depends(require_member_mutation_access),
    db: Session = Depends(get_db)
):
    clean_email = req.email.strip().lower() if req.email else None
    clean_phone = req.phone.strip() if req.phone else None

    if not clean_email and not clean_phone:
        return CheckContactResponse(exists=False)

    filters = []
    if clean_email:
        filters.append(func.lower(User.email) == clean_email)
    if clean_phone:
        filters.append(User.phone == clean_phone)

    existing_user = db.query(User).filter(or_(*filters)).first()
    if existing_user:
        return CheckContactResponse(
            exists=True,
            user_id=existing_user.id,
            full_name=existing_user.full_name,
            email=existing_user.email,
            phone=existing_user.phone
        )

    return CheckContactResponse(exists=False)


def _self_member(db: Session, tenant: TenantContext) -> Member:
    return get_or_create_member_for_user(db, tenant.workspace_id, tenant.user_id, role=tenant.role)


def _self_response(db: Session, member: Member) -> MemberSelfResponse:
    memberships = db.query(Membership).filter(
        Membership.workspace_id == member.workspace_id, Membership.member_id == member.id
    ).order_by(Membership.start_date.desc()).all()
    today = membership_lifecycle.workspace_today(db, member.workspace_id)
    payments = db.query(Payment).filter(
        Payment.workspace_id == member.workspace_id, Payment.member_id == member.id
    ).order_by(Payment.paid_at.desc()).limit(100).all()
    return MemberSelfResponse(
        id=member.id, first_name=member.first_name, last_name=member.last_name, email=member.email,
        phone=member.phone, avatar_url=member.avatar_url, gender=member.gender,
        date_of_birth=member.date_of_birth, emergency_contact=member.emergency_contact,
        status=member.status, joined_date=member.joined_date,
        memberships=[
            SelfMembershipItem(
                id=m.id, plan_name=m.plan.name if m.plan else None, start_date=m.start_date,
                end_date=m.end_date, status=membership_lifecycle.effective_status(m, today),
                price_paid=m.price_paid, amount_paid=membership_lifecycle.amount_paid(db, m),
            ) for m in memberships
        ],
        payments=[
            SelfPaymentItem(
                id=p.id, amount=p.amount, currency=p.currency, method=p.method.value,
                status=p.status.value, paid_at=p.paid_at, membership_id=p.membership_id,
            ) for p in payments
        ],
    )


@router.get("/me", response_model=MemberSelfResponse)
def get_my_member_profile(
    tenant: TenantContext = Depends(get_current_tenant),
    db: Session = Depends(get_db),
):
    """Self-service: the signed-in member's own profile, memberships and payments."""
    return _self_response(db, _self_member(db, tenant))


@router.put("/me", response_model=MemberSelfResponse)
def update_my_member_profile(
    data: MemberSelfUpdate,
    tenant: TenantContext = Depends(get_current_tenant),
    db: Session = Depends(get_db),
):
    """Self-service: members may update only non-identity personal details."""
    member = _self_member(db, tenant)
    changes = {k: v for k, v in data.model_dump(exclude_unset=True).items() if getattr(member, k) != v}
    for field, value in changes.items():
        setattr(member, field, value)
    if changes:
        record_member_event(db, member, "profile_updated", tenant.user_id,
                            details={"fields": sorted(changes), "self_service": True})
    db.commit()
    db.refresh(member)
    return _self_response(db, member)


@router.get("/{id}", response_model=MemberResponse)
def get_member(
    id: str,
    tenant: TenantContext = Depends(require_member_manage_access),
    db: Session = Depends(get_db)
):
    repo = MemberRepository(db, tenant.workspace_id)
    member = repo.get(id)
    if not member:
        raise HTTPException(status_code=404, detail="Member not found in this workspace")
    return member


@router.post("", response_model=MemberResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=MemberResponse, status_code=status.HTTP_201_CREATED, include_in_schema=False)
def create_member(
    data: MemberCreate,
    tenant: TenantContext = Depends(require_member_mutation_access),
    _cap: bool = Depends(check_member_capacity),
    db: Session = Depends(get_db)
):
    clean_email = data.email.strip().lower() if data.email else None
    clean_phone = "".join(c for c in (data.phone or "") if c.isdigit() or c == "+")

    # 1. Prevent duplicate member creation within this gym
    dup_filters = []
    if clean_phone:
        dup_filters.append(Member.phone == clean_phone)
    if clean_email:
        dup_filters.append(func.lower(Member.email) == clean_email)

    if dup_filters:
        existing_member = db.query(Member).filter(
            Member.workspace_id == tenant.workspace_id,
            or_(*dup_filters)
        ).first()
        if existing_member:
            matched = "phone number" if existing_member.phone == clean_phone else "email"
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"A member with this {matched} is already registered in your gym."
            )

    linked_user_id = None
    if clean_email or clean_phone:
        filters = []
        if clean_email:
            filters.append(func.lower(User.email) == clean_email)
        if clean_phone:
            filters.append(User.phone == clean_phone)

        existing_user = db.query(User).filter(or_(*filters)).first()
        if existing_user:
            linked_user_id = existing_user.id
        elif data.password and data.password.strip():
            # Staff chose a password to hand to the member. Without one, no login is created: the
            # member claims this record later by verified sign-up or invitation (never a shared default).
            existing_user = User(
                email=clean_email or f"{clean_phone}@repsi.internal",
                full_name=f"{data.first_name} {data.last_name or ''}".strip(),
                hashed_password=get_password_hash(data.password.strip()),
                phone=clean_phone,
                is_active=True
            )
            db.add(existing_user)
            db.flush()
            linked_user_id = existing_user.id

        if existing_user:
            ws_member = db.query(WorkspaceMember).filter(
                WorkspaceMember.workspace_id == tenant.workspace_id,
                WorkspaceMember.user_id == existing_user.id
            ).first()
            if not ws_member:
                db.add(WorkspaceMember(
                    workspace_id=tenant.workspace_id,
                    user_id=existing_user.id,
                    role=UserRole.USER,
                    is_active=True
                ))
                db.flush()

    repo = MemberRepository(db, tenant.workspace_id)
    member = repo.create(
        user_id=linked_user_id,
        first_name=data.first_name,
        last_name=data.last_name or "",
        email=clean_email,
        phone=clean_phone,
        avatar_url=data.avatar_url,
        gender=data.gender,
        date_of_birth=data.date_of_birth,
        emergency_contact=data.emergency_contact,
        status=MemberStatus.ACTIVE,
        joined_date=data.start_date or date.today(),
        trainer_id=data.trainer_id,
        notes=data.notes
    )

    # Attach Membership Plan if provided by plan_id or plan_name
    plan = None
    if data.plan_id:
        plan = db.query(MembershipPlan).filter(
            MembershipPlan.id == data.plan_id,
            MembershipPlan.workspace_id == tenant.workspace_id
        ).first()
    elif data.plan_name:
        plan = db.query(MembershipPlan).filter(
            MembershipPlan.workspace_id == tenant.workspace_id,
            func.lower(MembershipPlan.name) == data.plan_name.strip().lower()
        ).first()
        if not plan and data.plan_name.lower() in ["annual", "yearly"]:
            plan = db.query(MembershipPlan).filter(
                MembershipPlan.workspace_id == tenant.workspace_id,
                func.lower(MembershipPlan.name).in_(["yearly", "annual"])
            ).first()

    from app.services import membership_lifecycle
    from app.services.notify import safe_notify

    safe_notify(db, member, "welcome", member.id)
    if plan:
        # Same path as every other assignment: calendar-month end date, history event, confirmation.
        membership_lifecycle.assign_membership(
            db, member, plan, data.start_date or date.today(), plan.price, tenant.user_id
        )

    db.commit()
    db.refresh(member)
    return member


@router.put("/{id}", response_model=MemberResponse)
def update_member(
    id: str,
    data: MemberUpdate,
    tenant: TenantContext = Depends(require_member_mutation_access),
    db: Session = Depends(get_db)
):
    repo = MemberRepository(db, tenant.workspace_id)
    member = repo.get(id)
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    update_dict = data.model_dump(exclude_unset=True)
    new_status = update_dict.pop("status", None)
    update_dict.pop("user_id", None)  # account linking is not a profile edit
    if new_status is not None and new_status != member.status:
        change_member_status(db, member, new_status, tenant.user_id, tenant.role)
    changed = sorted(k for k, v in update_dict.items() if v is not None and getattr(member, k, None) != v)
    if changed:
        record_member_event(db, member, "profile_updated", tenant.user_id, details={"fields": changed})
    updated = repo.update(member, **update_dict)
    return updated


def _member_or_404(db: Session, tenant: TenantContext, member_id: str) -> Member:
    member = db.query(Member).filter(Member.workspace_id == tenant.workspace_id, Member.id == member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    return member


@router.post("/{id}/status", response_model=MemberResponse)
def change_status(
    id: str,
    data: MemberStatusChangeRequest,
    tenant: TenantContext = Depends(require_member_mutation_access),
    db: Session = Depends(get_db),
):
    member = _member_or_404(db, tenant, id)
    change_member_status(db, member, data.status, tenant.user_id, tenant.role, data.reason)
    db.commit()
    return MemberRepository(db, tenant.workspace_id).get(id)


def _author_name(db: Session, user_id: str) -> Optional[str]:
    user = db.query(User).filter(User.id == user_id).first()
    return user.full_name if user else None


@router.get("/{id}/notes", response_model=List[MemberNoteResponse])
def list_member_notes(
    id: str,
    tenant: TenantContext = Depends(require_member_mutation_access),
    db: Session = Depends(get_db),
):
    _member_or_404(db, tenant, id)
    return db.query(MemberNote).filter(
        MemberNote.workspace_id == tenant.workspace_id, MemberNote.member_id == id
    ).order_by(MemberNote.created_at.desc()).all()


@router.post("/{id}/notes", response_model=MemberNoteResponse, status_code=status.HTTP_201_CREATED)
def add_member_note(
    id: str,
    data: MemberNoteCreate,
    tenant: TenantContext = Depends(require_member_mutation_access),
    db: Session = Depends(get_db),
):
    member = _member_or_404(db, tenant, id)
    note = MemberNote(
        workspace_id=tenant.workspace_id, member_id=member.id, author_user_id=tenant.user_id,
        author_name=_author_name(db, tenant.user_id), body=data.body.strip(),
    )
    db.add(note)
    db.flush()
    record_member_event(db, member, "note_added", tenant.user_id, details={"note_id": note.id})
    db.commit()
    db.refresh(note)
    return note


def _note_or_404(db: Session, tenant: TenantContext, member_id: str, note_id: str) -> MemberNote:
    note = db.query(MemberNote).filter(
        MemberNote.workspace_id == tenant.workspace_id, MemberNote.member_id == member_id, MemberNote.id == note_id
    ).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    return note


def _require_note_owner(note: MemberNote, tenant: TenantContext) -> None:
    if note.author_user_id != tenant.user_id and tenant.role not in ("OWNER", "ADMIN", "SUPER_ADMIN"):
        raise HTTPException(status_code=403, detail="Only the note's author or a gym admin can change this note.")


@router.put("/{id}/notes/{note_id}", response_model=MemberNoteResponse)
def update_member_note(
    id: str,
    note_id: str,
    data: MemberNoteCreate,
    tenant: TenantContext = Depends(require_member_mutation_access),
    db: Session = Depends(get_db),
):
    member = _member_or_404(db, tenant, id)
    note = _note_or_404(db, tenant, id, note_id)
    _require_note_owner(note, tenant)
    note.body = data.body.strip()
    record_member_event(db, member, "note_updated", tenant.user_id, details={"note_id": note.id})
    db.commit()
    db.refresh(note)
    return note


@router.delete("/{id}/notes/{note_id}")
def delete_member_note(
    id: str,
    note_id: str,
    tenant: TenantContext = Depends(require_member_mutation_access),
    db: Session = Depends(get_db),
):
    member = _member_or_404(db, tenant, id)
    note = _note_or_404(db, tenant, id, note_id)
    _require_note_owner(note, tenant)
    db.delete(note)
    record_member_event(db, member, "note_deleted", tenant.user_id, details={"note_id": note_id})
    db.commit()
    return {"status": "success"}


@router.get("/{id}/history", response_model=List[MemberHistoryItem])
def get_member_history(
    id: str,
    source: Optional[str] = Query(None, pattern="^(member|membership)$"),
    limit: int = Query(200, ge=1, le=500),
    tenant: TenantContext = Depends(require_member_mutation_access),
    db: Session = Depends(get_db),
):
    """Chronological staff-facing history: account status, notes, profile edits and membership lifecycle."""
    _member_or_404(db, tenant, id)
    items: List[MemberHistoryItem] = []
    if source in (None, "member"):
        for e in db.query(MemberEvent).filter(
            MemberEvent.workspace_id == tenant.workspace_id, MemberEvent.member_id == id
        ).order_by(MemberEvent.created_at.desc()).limit(limit).all():
            items.append(MemberHistoryItem(
                id=e.id, source="member", event_type=e.event_type, actor_user_id=e.actor_user_id,
                from_status=e.from_status, to_status=e.to_status, reason=e.reason,
                details=json.loads(e.details) if e.details else None, created_at=e.created_at,
            ))
    if source in (None, "membership"):
        for e in db.query(MembershipEvent).filter(
            MembershipEvent.workspace_id == tenant.workspace_id, MembershipEvent.member_id == id
        ).order_by(MembershipEvent.created_at.desc()).limit(limit).all():
            items.append(MemberHistoryItem(
                id=e.id, source="membership", event_type=e.event_type, membership_id=e.membership_id,
                actor_user_id=e.actor_user_id, from_status=e.from_status, to_status=e.to_status,
                previous_end_date=e.previous_end_date, new_end_date=e.new_end_date, reason=e.reason,
                details=json.loads(e.details) if e.details else None, created_at=e.created_at,
            ))
    actor_ids = {i.actor_user_id for i in items if i.actor_user_id}
    names = dict(db.query(User.id, User.full_name).filter(User.id.in_(actor_ids)).all()) if actor_ids else {}
    for item in items:
        item.actor_name = names.get(item.actor_user_id) if item.actor_user_id else "System"
    items.sort(key=lambda i: i.created_at, reverse=True)
    return items[:limit]


@router.post("/{id}/renew")
def renew_member_membership(
    id: str,
    data: Optional[MemberRenewRequest] = None,
    tenant: TenantContext = Depends(require_member_mutation_access),
    db: Session = Depends(get_db)
):
    repo = MemberRepository(db, tenant.workspace_id)
    member = repo.get(id)
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    plan = None
    if data and data.plan_id:
        plan = db.query(MembershipPlan).filter(
            MembershipPlan.id == data.plan_id,
            MembershipPlan.workspace_id == tenant.workspace_id
        ).first()
    elif data and data.plan_name:
        plan = db.query(MembershipPlan).filter(
            MembershipPlan.workspace_id == tenant.workspace_id,
            func.lower(MembershipPlan.name) == data.plan_name.strip().lower()
        ).first()

    if not plan:
        plan = db.query(MembershipPlan).filter(
            MembershipPlan.workspace_id == tenant.workspace_id,
            MembershipPlan.is_active == True
        ).first()
        if not plan:
            plan = MembershipPlan(
                workspace_id=tenant.workspace_id,
                name="Standard Membership",
                price=1500.0,
                duration_months=1,
                is_active=True
            )
            db.add(plan)
            db.flush()

    months = (data and data.duration_months) or plan.duration_months or 1
    price = (data and data.price_paid) if (data and data.price_paid is not None) else plan.price
    start = (data and data.start_date) or membership_lifecycle.workspace_today(db, tenant.workspace_id)
    end = membership_lifecycle.period_end(start, months)

    # Close current periods (history is kept; cancelled/expired rows are left untouched)
    for current in db.query(Membership).filter(
        Membership.workspace_id == tenant.workspace_id,
        Membership.member_id == member.id,
        Membership.status.in_([MemberStatus.ACTIVE, MemberStatus.FROZEN]),
    ).all():
        previous_status = current.status
        current.status = MemberStatus.EXPIRED
        membership_lifecycle.record_event(
            db, current, "closed_for_renewal", tenant.user_id,
            from_status=previous_status, to_status=MemberStatus.EXPIRED,
        )

    new_membership = Membership(
        workspace_id=tenant.workspace_id,
        member_id=member.id,
        plan_id=plan.id,
        start_date=start,
        end_date=end,
        status=MemberStatus.ACTIVE,
        price_paid=price,
        auto_renew=False
    )
    db.add(new_membership)
    db.flush()
    membership_lifecycle.record_event(
        db, new_membership, "renewed", tenant.user_id, to_status=MemberStatus.ACTIVE, new_end_date=end,
        details={"plan_id": plan.id, "plan_name": plan.name, "duration_months": months, "price": price},
    )

    # Renewal restores access only for lapsed members; suspended/archived/inactive stay as staff set them.
    if member.status in (MemberStatus.SUSPENDED, MemberStatus.ARCHIVED, MemberStatus.INACTIVE):
        db.commit()
        db.refresh(member)
        return {
            "status": "success",
            "message": f"Membership renewed until {end.strftime('%d %b %Y')}. Member account is still {member.status.value}.",
            "member_id": member.id,
            "membership_id": new_membership.id,
            "plan_name": plan.name,
            "end_date": end.isoformat(),
            "member_status": member.status.value
        }

    member.status = MemberStatus.ACTIVE
    if member.user_id:
        ws_mem = db.query(WorkspaceMember).filter(
            WorkspaceMember.workspace_id == tenant.workspace_id,
            WorkspaceMember.user_id == member.user_id
        ).first()
        if ws_mem:
            ws_mem.is_active = True

    db.commit()
    db.refresh(member)

    return {
        "status": "success",
        "message": f"Membership renewed successfully until {end.strftime('%d %b %Y')}",
        "member_id": member.id,
        "membership_id": new_membership.id,
        "plan_name": plan.name,
        "end_date": end.isoformat(),
        "member_status": member.status.value
    }


@router.delete("/{id}")
def delete_member(
    id: str,
    tenant: TenantContext = Depends(require_member_mutation_access),
    db: Session = Depends(get_db)
):
    repo = MemberRepository(db, tenant.workspace_id)
    member = repo.get(id)
    if not member:
        raise HTTPException(status_code=404, detail="Member not found in this workspace")

    # Deleting cascades to memberships, payments and attendance. Members with any of that history are
    # archived instead (POST /members/{id}/status) so financial and visit records are preserved.
    from app.models.attendance import Attendance
    from app.models.finance import Payment
    has_history = (
        db.query(Payment.id).filter(Payment.workspace_id == tenant.workspace_id, Payment.member_id == member.id).first()
        or db.query(Membership.id).filter(Membership.workspace_id == tenant.workspace_id, Membership.member_id == member.id).first()
        or db.query(Attendance.id).filter(Attendance.workspace_id == tenant.workspace_id, Attendance.member_id == member.id).first()
    )
    if has_history:
        raise HTTPException(
            status_code=409,
            detail="This member has membership, payment or attendance history. Archive the member instead of deleting.",
        )

    linked_user_id = member.user_id

    # If linked to a user account, clean up workspace association and user account
    if linked_user_id:
        ws_member = db.query(WorkspaceMember).filter(
            WorkspaceMember.workspace_id == tenant.workspace_id,
            WorkspaceMember.user_id == linked_user_id
        ).first()
        if ws_member:
            db.delete(ws_member)
            db.flush()

        user = db.query(User).filter(User.id == linked_user_id).first()
        if user and not user.is_superadmin:
            # Check if this user belongs to any other workspaces
            other_ws = db.query(WorkspaceMember).filter(
                WorkspaceMember.user_id == user.id,
                WorkspaceMember.workspace_id != tenant.workspace_id
            ).first()
            if not other_ws:
                db.delete(user)
                db.flush()

    # Delete the member record (cascades to memberships, attendance, payments)
    db.delete(member)
    db.commit()
    return {"status": "success", "message": "Member and user record removed successfully"}


def _process_imported_rows(rows: List[Dict[str, Any]], tenant: TenantContext, db: Session) -> Dict[str, Any]:
    imported = 0
    duplicates = 0
    errors = 0
    details = []

    repo = MemberRepository(db, tenant.workspace_id)

    for idx, row in enumerate(rows, start=1):
        # Normalize key names
        normalized = {k.strip().lower().replace(" ", "_"): str(v).strip() for k, v in row.items() if v is not None}
        
        raw_name = normalized.get("name") or normalized.get("full_name") or normalized.get("member_name") or ""
        first_name = normalized.get("first_name") or ""
        last_name = normalized.get("last_name") or ""

        if not first_name and raw_name:
            parts = raw_name.split(None, 1)
            first_name = parts[0]
            last_name = parts[1] if len(parts) > 1 else ""

        if not first_name:
            errors += 1
            details.append({"row": idx, "status": "error", "message": "Missing first name or full name"})
            continue

        raw_phone = normalized.get("phone") or normalized.get("mobile") or normalized.get("phone_number") or ""
        clean_phone = "".join(c for c in raw_phone if c.isdigit() or c == "+")
        if not clean_phone or len(clean_phone) < 7:
            errors += 1
            details.append({"row": idx, "status": "error", "name": f"{first_name} {last_name}", "message": "Invalid phone number"})
            continue

        raw_email = normalized.get("email") or normalized.get("email_address") or ""
        clean_email = raw_email.lower().strip() if raw_email else f"{clean_phone.replace('+', '')}@repsi.internal"

        # Check for existing member in this workspace
        existing = db.query(Member).filter(
            Member.workspace_id == tenant.workspace_id,
            (Member.phone == clean_phone) | (Member.email == clean_email)
        ).first()

        if existing:
            duplicates += 1
            details.append({"row": idx, "status": "skipped", "name": f"{first_name} {last_name}", "message": "Member already exists in this gym"})
            continue

        gender = normalized.get("gender") or "Not Specified"
        plan_name = normalized.get("plan") or normalized.get("membership_plan") or normalized.get("plan_name")
        emergency = normalized.get("emergency_contact") or normalized.get("emergency")

        limit = capacity_error(db, tenant.workspace_id, "members")
        if limit:
            errors += 1
            details.append({"row": idx, "status": "error", "name": f"{first_name} {last_name}", "message": limit["message"]})
            continue

        # Create Member
        new_member = repo.create(
            first_name=first_name,
            last_name=last_name or "-",
            email=clean_email,
            phone=clean_phone,
            gender=gender,
            emergency_contact=emergency,
            status=MemberStatus.ACTIVE,
            joined_date=date.today(),
            notes="Imported via CSV/Bulk Onboarding"
        )

        # Imports never create logins (no phone-number passwords). An existing account with a
        # verified email is linked so the member gets in-app notifications; anyone else claims
        # the record later through verified sign-up or an invitation.
        user = None
        if clean_email:
            user = db.query(User).filter(
                func.lower(User.email) == clean_email, User.email_verified.is_(True)
            ).first()
        if user:
            new_member.user_id = user.id
            ws_link = db.query(WorkspaceMember).filter(
                WorkspaceMember.workspace_id == tenant.workspace_id,
                WorkspaceMember.user_id == user.id
            ).first()
            if not ws_link:
                db.add(WorkspaceMember(
                    workspace_id=tenant.workspace_id,
                    user_id=user.id,
                    role=UserRole.USER,
                    is_active=True
                ))

        # A plan named in the file must already exist; prices are never guessed.
        plan = None
        if plan_name:
            plan = db.query(MembershipPlan).filter(
                MembershipPlan.workspace_id == tenant.workspace_id,
                func.lower(MembershipPlan.name) == plan_name.lower()
            ).first()
            if not plan:
                details.append({"row": idx, "status": "warning", "name": f"{first_name} {last_name}",
                                "message": f"Plan '{plan_name}' not found; imported without a membership."})

        if plan:
            membership = Membership(
                workspace_id=tenant.workspace_id,
                member_id=new_member.id,
                plan_id=plan.id,
                start_date=date.today(),
                end_date=date.today() + timedelta(days=plan.duration_months * 30),
                status=MemberStatus.ACTIVE,
                price_paid=plan.price,
                auto_renew=False
            )
            db.add(membership)

        imported += 1
        details.append({"row": idx, "status": "imported", "name": f"{first_name} {last_name}", "member_id": new_member.id})

    db.commit()
    return {
        "status": "success",
        "total_rows": len(rows),
        "imported": imported,
        "duplicates": duplicates,
        "errors": errors,
        "details": details[:20]  # sample of details
    }


@router.post("/import-csv")
async def import_members_csv(
    file: UploadFile = File(...),
    tenant: TenantContext = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    if tenant.role not in ["OWNER", "ADMIN", "STAFF", "SUPER_ADMIN"]:
        raise HTTPException(status_code=403, detail="Forbidden. Only staff/owners can import members.")

    content = await file.read()
    try:
        text = content.decode("utf-8-sig")
    except UnicodeDecodeError:
        text = content.decode("latin1", errors="replace")

    reader = csv.DictReader(io.StringIO(text))
    rows = list(reader)
    if not rows:
        raise HTTPException(status_code=400, detail="CSV file is empty or missing headers.")

    return _process_imported_rows(rows, tenant, db)


@router.post("/import-batch")
def import_members_batch(
    payload: List[Dict[str, Any]],
    tenant: TenantContext = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    if tenant.role not in ["OWNER", "ADMIN", "STAFF", "SUPER_ADMIN"]:
        raise HTTPException(status_code=403, detail="Forbidden. Only staff/owners can import members.")
    return _process_imported_rows(payload, tenant, db)



