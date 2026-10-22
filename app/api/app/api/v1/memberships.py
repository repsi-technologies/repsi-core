from typing import List, Optional
from datetime import date, timedelta
from urllib.parse import quote
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db
from app.models.member import MembershipPlan, Membership, Member, MemberStatus
from app.models.user import Workspace
from app.schemas.membership import (
    MembershipPlanCreate,
    MembershipPlanUpdate,
    MembershipPlanResponse,
    MembershipCreate,
    MembershipResponse,
    ExpiringMembershipItem,
    RenewalReminderItem,
    MembershipFreezeRequest,
    MembershipExtendRequest,
    MembershipCancelRequest,
    MembershipRenewRequest,
    MembershipDetailResponse,
    MembershipEventResponse,
    MembershipFreezeResponse,
)
from app.models.member_records import MembershipEvent, MembershipFreeze
from app.repositories.base import BaseTenantRepository
from app.middleware.tenant import get_current_tenant, require_roles, TenantContext
from app.services import membership_lifecycle as lifecycle

STAFF_ROLES = ("OWNER", "ADMIN", "MANAGER", "STAFF", "SUPER_ADMIN")
require_staff = require_roles(*STAFF_ROLES)

router = APIRouter(prefix="/memberships", tags=["Memberships"])


@router.get("/plans", response_model=List[MembershipPlanResponse])
def get_plans(
    tenant: TenantContext = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    repo = BaseTenantRepository[MembershipPlan](MembershipPlan, db, tenant.workspace_id)
    plans = repo.get_multi(limit=50)
    return plans or []


@router.post("/plans", response_model=MembershipPlanResponse, status_code=status.HTTP_201_CREATED)
def create_plan(
    data: MembershipPlanCreate,
    tenant: TenantContext = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    if tenant.role not in ["OWNER", "ADMIN", "STAFF", "SUPER_ADMIN"]:
        raise HTTPException(status_code=403, detail="Forbidden. Only staff/owners can create membership plans.")
    repo = BaseTenantRepository[MembershipPlan](MembershipPlan, db, tenant.workspace_id)
    return repo.create(**data.model_dump())


@router.put("/plans/{id}", response_model=MembershipPlanResponse)
def update_plan(
    id: str,
    data: MembershipPlanUpdate,
    tenant: TenantContext = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    if tenant.role not in ["OWNER", "ADMIN", "STAFF", "SUPER_ADMIN"]:
        raise HTTPException(status_code=403, detail="Forbidden. Only staff/owners can modify membership plans.")
    repo = BaseTenantRepository[MembershipPlan](MembershipPlan, db, tenant.workspace_id)
    plan = repo.get(id)
    if not plan:
        raise HTTPException(status_code=404, detail="Membership plan not found")
    return repo.update(plan, **data.model_dump(exclude_unset=True))


@router.delete("/plans/{id}")
def delete_plan(
    id: str,
    tenant: TenantContext = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    if tenant.role not in ["OWNER", "ADMIN", "STAFF", "SUPER_ADMIN"]:
        raise HTTPException(status_code=403, detail="Forbidden. Only owners/staff can delete membership plans.")
    repo = BaseTenantRepository[MembershipPlan](MembershipPlan, db, tenant.workspace_id)
    plan = repo.get(id)
    if not plan:
        raise HTTPException(status_code=404, detail="Membership plan not found")
    active_mems = db.query(Membership).filter(Membership.plan_id == id, Membership.status == MemberStatus.ACTIVE).count()
    if active_mems > 0:
        plan.is_active = False
        db.commit()
        return {"status": "success", "message": "Plan has active members; deactivated successfully"}
    db.delete(plan)
    db.commit()
    return {"status": "success", "message": "Membership plan deleted successfully"}


@router.get("/", response_model=List[MembershipResponse])
def list_memberships(
    member_id: Optional[str] = None,
    tenant: TenantContext = Depends(require_staff),
    db: Session = Depends(get_db)
):
    query = db.query(Membership).filter(Membership.workspace_id == tenant.workspace_id)
    if member_id:
        query = query.filter(Membership.member_id == member_id)
    return query.order_by(Membership.end_date.desc()).limit(100).all()


@router.post("/", response_model=MembershipResponse, status_code=status.HTTP_201_CREATED)
def create_membership(
    data: MembershipCreate,
    tenant: TenantContext = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    if tenant.role not in ["OWNER", "ADMIN", "STAFF", "SUPER_ADMIN"]:
        raise HTTPException(status_code=403, detail="Forbidden. Only staff/owners can assign memberships.")

    plan = db.query(MembershipPlan).filter(
        MembershipPlan.workspace_id == tenant.workspace_id,
        MembershipPlan.id == data.plan_id
    ).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Membership plan not found")

    member = db.query(Member).filter(
        Member.workspace_id == tenant.workspace_id,
        Member.id == data.member_id
    ).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    membership = lifecycle.assign_membership(
        db, member, plan, data.start_date, data.price_paid, tenant.user_id, auto_renew=data.auto_renew
    )

    # Assignment restores members whose account status was a legacy membership value (expired/frozen/...),
    # but never overrides a deliberate account status such as suspended, inactive or archived.
    if member.status in (MemberStatus.EXPIRED, MemberStatus.EXPIRING, MemberStatus.FROZEN, MemberStatus.CANCELLED):
        member.status = MemberStatus.ACTIVE
    db.commit()
    db.refresh(membership)
    return membership


@router.get("/expiring", response_model=List[ExpiringMembershipItem])
def get_expiring_memberships(
    days: int = Query(7, ge=1, le=90),
    include_expired: bool = Query(True),
    tenant: TenantContext = Depends(require_staff),
    db: Session = Depends(get_db)
):
    """
    Finds memberships expiring within `days` or already expired.
    """
    today = date.today()
    max_expiry = today + timedelta(days=days)

    query = (
        db.query(Membership, Member, MembershipPlan)
        .join(Member, Membership.member_id == Member.id)
        .join(MembershipPlan, Membership.plan_id == MembershipPlan.id)
        .filter(Membership.workspace_id == tenant.workspace_id)
    )

    if include_expired:
        query = query.filter(
            (Membership.end_date <= max_expiry) |
            (Membership.status == MemberStatus.EXPIRED)
        )
    else:
        query = query.filter(
            Membership.end_date >= today,
            Membership.end_date <= max_expiry,
            Membership.status == MemberStatus.ACTIVE
        )

    results = query.order_by(Membership.end_date.asc()).limit(100).all()

    items = []
    for mem, member, plan in results:
        days_remaining = (mem.end_date - today).days
        items.append(
            ExpiringMembershipItem(
                membership_id=mem.id,
                member_id=member.id,
                member_name=f"{member.first_name} {member.last_name}".strip(),
                phone=member.phone,
                email=member.email,
                plan_name=plan.name,
                start_date=mem.start_date,
                end_date=mem.end_date,
                days_remaining=days_remaining,
                status=mem.status,
                price_paid=mem.price_paid,
            )
        )
    return items


@router.post("/check-expiries")
def check_and_update_expiries(
    tenant: TenantContext = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """
    Audit and update all memberships where end_date < today to EXPIRED status.
    """
    if tenant.role not in ["OWNER", "ADMIN", "STAFF", "SUPER_ADMIN"]:
        raise HTTPException(status_code=403, detail="Forbidden.")

    result = lifecycle.run_due_transitions(db, tenant.workspace_id)
    db.commit()
    today = date.fromisoformat(result["run_date"])
    expired_count = result["expired"]

    # Expiring soon (next 7 days)
    expiring_soon_count = (
        db.query(Membership)
        .filter(
            Membership.workspace_id == tenant.workspace_id,
            Membership.end_date >= today,
            Membership.end_date <= today + timedelta(days=7),
            Membership.status == MemberStatus.ACTIVE
        )
        .count()
    )

    return {
        "status": "success",
        "expired_updated": expired_count,
        "expiring_soon_7d": expiring_soon_count,
        "audit_date": today.isoformat(),
        "freezes_started": result["freezes_started"],
        "freezes_resumed": result["freezes_resumed"],
    }


@router.get("/renewal-reminders", response_model=List[RenewalReminderItem])
def get_renewal_reminders(
    days: int = Query(7, ge=1, le=90),
    tenant: TenantContext = Depends(require_staff),
    db: Session = Depends(get_db)
):
    """
    Pre-generates custom WhatsApp reminder links and SMS message templates for upcoming renewals.
    """
    today = date.today()
    max_date = today + timedelta(days=days)

    ws = db.query(Workspace).filter(Workspace.id == tenant.workspace_id).first()
    gym_name = ws.name if ws else "the gym"

    records = (
        db.query(Membership, Member, MembershipPlan)
        .join(Member, Membership.member_id == Member.id)
        .join(MembershipPlan, Membership.plan_id == MembershipPlan.id)
        .filter(
            Membership.workspace_id == tenant.workspace_id,
            Membership.end_date <= max_date,
        )
        .order_by(Membership.end_date.asc())
        .limit(50)
        .all()
    )

    reminders = []
    for mem, member, plan in records:
        days_left = (mem.end_date - today).days
        if days_left < 0:
            urgency = f"expired on {mem.end_date.strftime('%d %b')}"
        elif days_left == 0:
            urgency = "expires TODAY"
        elif days_left == 1:
            urgency = "expires tomorrow"
        else:
            urgency = f"expires in {days_left} days ({mem.end_date.strftime('%d %b')})"

        msg = (
            f"Hi {member.first_name}! Your {plan.name} membership at {gym_name} {urgency}. "
            f"Renew today to avoid break in access and keep your workout progress on track: "
            f"https://repsi.app/{ws.slug if ws else 'pay'}/renew?member={member.id}"
        )

        # Format clean international or Indian phone for WhatsApp (e.g. 919876543210)
        clean_phone = "".join(c for c in member.phone if c.isdigit())
        if len(clean_phone) == 10:
            clean_phone = "91" + clean_phone

        wa_url = f"https://wa.me/{clean_phone}?text={quote(msg)}"

        reminders.append(
            RenewalReminderItem(
                member_id=member.id,
                member_name=f"{member.first_name} {member.last_name}".strip(),
                phone=member.phone,
                email=member.email,
                plan_name=plan.name,
                expiry_date=mem.end_date,
                days_remaining=days_left,
                amount_due=plan.price,
                message_template=msg,
                whatsapp_url=wa_url,
            )
        )
    return reminders


def _get_membership_or_404(db: Session, tenant: TenantContext, membership_id: str) -> Membership:
    membership = db.query(Membership).filter(
        Membership.workspace_id == tenant.workspace_id, Membership.id == membership_id
    ).first()
    if not membership:
        raise HTTPException(status_code=404, detail="Membership not found")
    return membership


def _membership_detail(db: Session, membership: Membership) -> MembershipDetailResponse:
    today = lifecycle.workspace_today(db, membership.workspace_id)
    paid = lifecycle.amount_paid(db, membership)
    balance = round(max(0.0, membership.price_paid - paid), 2)
    if membership.price_paid <= 0 or balance == 0:
        payment_status = "paid"
    elif paid > 0:
        payment_status = "partial"
    else:
        payment_status = "unpaid"
    used = lifecycle.used_freeze_days(db, membership)
    freezes = db.query(MembershipFreeze).filter(
        MembershipFreeze.workspace_id == membership.workspace_id,
        MembershipFreeze.membership_id == membership.id,
    ).order_by(MembershipFreeze.start_date.desc()).all()
    events = db.query(MembershipEvent).filter(
        MembershipEvent.workspace_id == membership.workspace_id,
        MembershipEvent.membership_id == membership.id,
    ).order_by(MembershipEvent.created_at.desc()).all()
    return MembershipDetailResponse(
        id=membership.id,
        member_id=membership.member_id,
        plan_id=membership.plan_id,
        plan_name=membership.plan.name if membership.plan else None,
        start_date=membership.start_date,
        end_date=membership.end_date,
        status=membership.status,
        effective_status=lifecycle.effective_status(membership, today),
        price_paid=membership.price_paid,
        amount_paid=paid,
        balance_due=balance,
        payment_status=payment_status,
        auto_renew=membership.auto_renew,
        freeze_days_used=used,
        freeze_days_remaining=max(0, settings.MEMBERSHIP_MAX_FREEZE_DAYS - used),
        freezes=[MembershipFreezeResponse.model_validate(f) for f in freezes],
        events=[MembershipEventResponse.model_validate(e) for e in events],
    )


@router.post("/run-lifecycle")
def run_membership_lifecycle(
    tenant: TenantContext = Depends(require_staff),
    db: Session = Depends(get_db),
):
    """Applies due freezes, automatic resumptions and expiries for this gym. Safe to call repeatedly."""
    result = lifecycle.run_due_transitions(db, tenant.workspace_id)
    db.commit()
    return {"status": "success", **result}


@router.get("/{membership_id}", response_model=MembershipDetailResponse)
def get_membership_detail(
    membership_id: str,
    tenant: TenantContext = Depends(require_staff),
    db: Session = Depends(get_db),
):
    return _membership_detail(db, _get_membership_or_404(db, tenant, membership_id))


@router.post("/{membership_id}/freeze", response_model=MembershipDetailResponse)
def freeze_membership(
    membership_id: str,
    data: MembershipFreezeRequest,
    tenant: TenantContext = Depends(require_staff),
    db: Session = Depends(get_db),
):
    membership = _get_membership_or_404(db, tenant, membership_id)
    today = lifecycle.workspace_today(db, tenant.workspace_id)
    lifecycle.freeze_membership(db, membership, data.start_date, data.end_date, data.reason, tenant.user_id, today)
    db.commit()
    return _membership_detail(db, membership)


@router.post("/{membership_id}/unfreeze", response_model=MembershipDetailResponse)
def unfreeze_membership(
    membership_id: str,
    tenant: TenantContext = Depends(require_staff),
    db: Session = Depends(get_db),
):
    membership = _get_membership_or_404(db, tenant, membership_id)
    today = lifecycle.workspace_today(db, tenant.workspace_id)
    lifecycle.unfreeze_membership(db, membership, tenant.user_id, today)
    db.commit()
    return _membership_detail(db, membership)


@router.post("/{membership_id}/extend", response_model=MembershipDetailResponse)
def extend_membership(
    membership_id: str,
    data: MembershipExtendRequest,
    tenant: TenantContext = Depends(require_staff),
    db: Session = Depends(get_db),
):
    membership = _get_membership_or_404(db, tenant, membership_id)
    today = lifecycle.workspace_today(db, tenant.workspace_id)
    lifecycle.extend_membership(db, membership, data.days, data.reason, tenant.user_id, today)
    db.commit()
    return _membership_detail(db, membership)


@router.post("/{membership_id}/cancel", response_model=MembershipDetailResponse)
def cancel_membership(
    membership_id: str,
    data: MembershipCancelRequest,
    tenant: TenantContext = Depends(require_roles("OWNER", "ADMIN", "MANAGER", "SUPER_ADMIN")),
    db: Session = Depends(get_db),
):
    membership = _get_membership_or_404(db, tenant, membership_id)
    lifecycle.cancel_membership(db, membership, data.reason, tenant.user_id)
    db.commit()
    return _membership_detail(db, membership)


@router.post("/{membership_id}/renew", response_model=MembershipDetailResponse, status_code=status.HTTP_201_CREATED)
def renew_membership(
    membership_id: str,
    data: MembershipRenewRequest,
    tenant: TenantContext = Depends(require_staff),
    db: Session = Depends(get_db),
):
    membership = _get_membership_or_404(db, tenant, membership_id)
    plan_id = data.plan_id or membership.plan_id
    plan = db.query(MembershipPlan).filter(
        MembershipPlan.workspace_id == tenant.workspace_id, MembershipPlan.id == plan_id
    ).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Membership plan not found")
    today = lifecycle.workspace_today(db, tenant.workspace_id)
    renewed = lifecycle.renew_membership(db, membership, plan, data.mode, data.price, tenant.user_id, today)
    db.commit()
    db.refresh(renewed)
    return _membership_detail(db, renewed)
