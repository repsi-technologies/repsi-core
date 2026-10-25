from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session
from sqlalchemy import func, or_, desc, String

from app.core.database import get_db
from app.core.security import get_password_hash, verify_password
from app.middleware.tenant import TenantContext, get_current_tenant
from app.models.user import User, Workspace, WorkspaceMember, UserRole
from app.models.member import Member, Membership, MembershipPlan, MemberStatus
from app.models.trainer import (
    Trainer, TrainerClient, TrainingSession, ClientNote, GymClass,
    TrainerStatus, TrainerClientStatus
)
from app.models.attendance import Attendance, ClassAttendance
from app.models.crm import Lead, LeadActivity, LeadFollowUp
from app.models.workout import Workout, WorkoutPlan
from app.models.finance import Payment, Expense, Invoice
from app.models.machine import GymMachine
from app.models.invitation import GymInvitation
from app.models.website import Website
from app.models.system import AuditLog, Notification
from app.models.auth import PendingRegistration
from app.models.billing import SubscriptionPlan, GymSubscription, SubscriptionAuditLog, SubscriptionStatus, BillingCycle
from app.services.billing import BillingService, invalidate_entitlements
from app.services import platform_metrics
from app.core import cache
from app.core.config import settings
from app.models.billing import SubscriptionPayment
from app.models.communication import Broadcast, NotificationDelivery, PLATFORM_WORKSPACE_ID

router = APIRouter(prefix="/superadmin", tags=["Super Admin"])


def check_superadmin(tenant: TenantContext, db: Session) -> User:
    if not tenant.user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token required for Super Admin endpoints.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = db.query(User).filter(User.id == tenant.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or session invalid."
        )
    if not user.is_superadmin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Super Admin privileges required."
        )
    return user


def log_audit_event(
    db: Session,
    user_id: str,
    action: str,
    details: str,
    workspace_id: Optional[str] = None
):
    try:
        log_entry = AuditLog(
            workspace_id=workspace_id or "platform",
            user_id=user_id,
            action=action,
            details=details,
        )
        db.add(log_entry)
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Audit log failed: {e}")


# ----------------------------------------------------
# 1. PLATFORM OVERVIEW METRICS
# ----------------------------------------------------

class ActivityPoint(BaseModel):
    label: str
    value: int

class RecentActivityItem(BaseModel):
    id: str
    type: str
    title: str
    subtitle: str
    timestamp: str

class OverviewMetricsResponse(BaseModel):
    total_gyms: int
    active_gyms: int
    suspended_gyms: int
    trial_gyms: int
    paid_gyms: int
    total_members: int
    total_trainers: int
    monthly_revenue: float
    failed_payments_amount: float
    failed_payments_count: int
    system_alerts: int
    new_gyms_this_month: int
    new_users_this_month: int
    mrr_growth_pct: float
    system_health: str
    gym_growth_chart: List[ActivityPoint]
    member_growth_chart: List[ActivityPoint]
    recent_activities: List[RecentActivityItem]
    subscription_status_breakdown: Dict[str, int] = {}


@router.get("/overview", response_model=OverviewMetricsResponse)
def get_platform_overview(
    tenant: TenantContext = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """Platform KPIs from real workspaces, subscriptions, platform payments and audit logs (cached briefly)."""
    check_superadmin(tenant, db)
    return platform_metrics.cached_overview(db)


@router.get("/revenue")
def get_platform_revenue(
    months: int = Query(12, ge=1, le=36),
    tenant: TenantContext = Depends(get_current_tenant),
    db: Session = Depends(get_db),
):
    """Platform (SaaS subscription) revenue by month, plus current MRR by plan."""
    check_superadmin(tenant, db)
    by_plan: Dict[str, Dict[str, Any]] = {}
    for sub, plan in db.query(GymSubscription, SubscriptionPlan).join(
        SubscriptionPlan, SubscriptionPlan.id == GymSubscription.plan_id
    ).all():
        row = by_plan.setdefault(plan.code, {"plan": plan.name, "workspaces": 0, "paying": 0, "mrr": 0.0})
        row["workspaces"] += 1
        mrr = platform_metrics.subscription_mrr(sub, plan)
        if mrr > 0:
            row["paying"] += 1
            row["mrr"] += mrr
    monthly = platform_metrics.revenue_by_month(db, months)
    return {
        "months": monthly,
        "total_collected": round(sum(m["collected"] for m in monthly), 2),
        "mrr": round(sum(r["mrr"] for r in by_plan.values()), 2),
        "by_plan": list(by_plan.values()),
        "currency": "INR",
    }


# ----------------------------------------------------
# 2. GLOBAL OMNIBOX SEARCH
# ----------------------------------------------------

class SearchResultItem(BaseModel):
    category: str
    id: str
    title: str
    subtitle: str
    badge: str
    workspace_slug: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None


@router.get("/search", response_model=List[SearchResultItem])
def global_platform_search(
    q: str = Query(..., min_length=2),
    tenant: TenantContext = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    check_superadmin(tenant, db)
    query_str = f"%{q.strip().lower()}%"
    results: List[SearchResultItem] = []

    # 1. Search Workspaces / Gyms
    gyms = db.query(Workspace).filter(
        or_(
            func.lower(Workspace.name).like(query_str),
            func.lower(Workspace.slug).like(query_str),
            func.lower(Workspace.email).like(query_str),
            Workspace.phone.like(query_str),
            func.lower(Workspace.city).like(query_str)
        )
    ).limit(8).all()

    for g in gyms:
        results.append(SearchResultItem(
            category="gym",
            id=g.id,
            title=g.name,
            subtitle=f"Slug: {g.slug} • {g.city or 'India'}",
            badge="ACTIVE" if g.is_active else "SUSPENDED",
            workspace_slug=g.slug,
            email=g.email,
            phone=g.phone
        ))

    # 2. Search Global Members
    members = db.query(Member).filter(
        or_(
            func.lower(Member.first_name).like(query_str),
            func.lower(Member.last_name).like(query_str),
            func.lower(Member.email).like(query_str),
            Member.phone.like(query_str)
        )
    ).limit(8).all()

    for m in members:
        ws = db.query(Workspace).filter(Workspace.id == m.workspace_id).first()
        ws_name = ws.name if ws else m.workspace_id
        results.append(SearchResultItem(
            category="member",
            id=m.id,
            title=f"{m.first_name} {m.last_name}".strip(),
            subtitle=f"Gym: {ws_name} • {m.email or m.phone or ''}",
            badge=m.status.value if hasattr(m.status, 'value') else str(m.status),
            workspace_slug=ws.slug if ws else m.workspace_id,
            email=m.email,
            phone=m.phone
        ))

    # 3. Search Trainers
    trainers = db.query(Trainer).filter(
        or_(
            func.lower(Trainer.name).like(query_str),
            func.lower(Trainer.email).like(query_str),
            Trainer.phone.like(query_str)
        )
    ).limit(8).all()

    for t in trainers:
        ws = db.query(Workspace).filter(Workspace.id == t.workspace_id).first()
        results.append(SearchResultItem(
            category="trainer",
            id=t.id,
            title=t.name,
            subtitle=f"Coach @ {ws.name if ws else 'Gym'} • {t.phone}",
            badge=t.status.value if hasattr(t.status, 'value') else str(t.status),
            workspace_slug=ws.slug if ws else t.workspace_id,
            email=t.email,
            phone=t.phone
        ))

    return results


# ----------------------------------------------------
# 3. GYM WORKSPACE MANAGEMENT
# ----------------------------------------------------

class GymDetailResponse(BaseModel):
    id: str
    name: str
    slug: str
    email: Optional[str] = None
    phone: Optional[str] = None
    city: Optional[str] = None
    gym_type: Optional[str] = None
    plan: str = "PRO"
    mrr: float = 4999.0
    last_active: str = "Active recently"
    is_active: bool = True
    onboarding_completed: bool = True
    created_at: datetime
    owner_name: Optional[str] = None
    owner_email: Optional[str] = None
    members_count: int = 0
    trainers_count: int = 0
    staff_count: int = 0
    plan_code: Optional[str] = None
    subscription_status: Optional[str] = None
    is_complimentary: bool = False
    trial_ends_at: Optional[datetime] = None


@router.get("/workspaces", response_model=List[GymDetailResponse])
def get_all_workspaces(
    response: Response,
    status_filter: Optional[str] = None,
    q: Optional[str] = Query(None, max_length=100),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    tenant: TenantContext = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """Tenants with real plan, subscription status, MRR and usage. Total in X-Total-Count."""
    check_superadmin(tenant, db)
    rows, total = platform_metrics.workspace_rows(db, status_filter, q, limit, offset)
    response.headers["X-Total-Count"] = str(total)
    return [GymDetailResponse(**r) for r in rows]


class CreateGymRequest(BaseModel):
    name: str
    slug: str
    owner_name: str
    owner_email: EmailStr
    owner_password: str = Field(min_length=8, max_length=128)
    phone: Optional[str] = None
    city: Optional[str] = None


@router.post("/workspaces", response_model=GymDetailResponse, status_code=status.HTTP_201_CREATED)
def create_gym_workspace(
    req: CreateGymRequest,
    tenant: TenantContext = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    admin_user = check_superadmin(tenant, db)

    slug = req.slug.strip().lower()
    if db.query(Workspace).filter(Workspace.slug == slug).first():
        raise HTTPException(status_code=400, detail=f"Workspace slug '{slug}' is already in use.")

    ws = Workspace(
        name=req.name.strip(),
        slug=slug,
        email=req.owner_email.strip().lower(),
        phone=req.phone,
        city=req.city,
        onboarding_completed=True,
        is_active=True
    )
    db.add(ws)
    db.flush()

    owner_email = req.owner_email.strip().lower()
    user = db.query(User).filter(func.lower(User.email) == owner_email).first()
    if not user:
        user = User(
            email=owner_email,
            full_name=req.owner_name.strip(),
            hashed_password=get_password_hash(req.owner_password or "OwnerPass2026!"),
            phone=req.phone,
            is_active=True
        )
        db.add(user)
        db.flush()

    db.add(WorkspaceMember(
        workspace_id=ws.id,
        user_id=user.id,
        role=UserRole.OWNER,
        is_active=True
    ))
    db.commit()
    db.refresh(ws)

    log_audit_event(db, admin_user.id, "CREATE_WORKSPACE", f"Created gym '{ws.name}' ({ws.slug}) with owner {owner_email}", ws.id)

    return GymDetailResponse(
        id=ws.id,
        name=ws.name,
        slug=ws.slug,
        email=ws.email,
        phone=ws.phone,
        city=ws.city,
        gym_type=ws.gym_type,
        plan="PRO",
        mrr=4999.0,
        last_active="Active just now",
        is_active=True,
        onboarding_completed=True,
        created_at=ws.created_at,
        owner_name=user.full_name,
        owner_email=user.email,
        members_count=0,
        trainers_count=0
    )


class WorkspaceStatusUpdateRequest(BaseModel):
    is_active: bool
    reason: Optional[str] = None


@router.patch("/workspaces/{id}/status")
def update_workspace_status(
    id: str,
    req: WorkspaceStatusUpdateRequest,
    tenant: TenantContext = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    admin_user = check_superadmin(tenant, db)
    ws = db.query(Workspace).filter(Workspace.id == id).first()
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found.")

    ws.is_active = req.is_active
    db.commit()
    invalidate_entitlements(ws.id)
    cache.invalidate("platform:")

    action = "REACTIVATE_WORKSPACE" if req.is_active else "SUSPEND_WORKSPACE"
    log_audit_event(db, admin_user.id, action, f"Reason: {req.reason or 'Admin update'}", ws.id)

    return {"status": "success", "message": f"Workspace '{ws.name}' is now {'active' if ws.is_active else 'suspended'}."}


class PermanentDeleteGymRequest(BaseModel):
    confirmation_slug: str
    admin_password: str
    reason: str


@router.post("/workspaces/{id}/delete-permanently")
def delete_workspace_permanently(
    id: str,
    req: PermanentDeleteGymRequest,
    tenant: TenantContext = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    admin_user = check_superadmin(tenant, db)

    # 1. Verify Super Admin Password
    if not verify_password(req.admin_password, admin_user.hashed_password):
        raise HTTPException(status_code=401, detail="Super Admin password verification failed.")

    ws = db.query(Workspace).filter(Workspace.id == id).first()
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found.")

    # 2. Verify Confirmation Slug Match
    if req.confirmation_slug.strip().lower() != ws.slug.lower():
        raise HTTPException(status_code=400, detail=f"Confirmation slug mismatch. Type exact slug '{ws.slug}'.")

    gym_name = ws.name
    gym_slug = ws.slug

    # 3. Log Audit Trail before deletion
    log_audit_event(
        db, admin_user.id, "PERMANENT_DELETE_WORKSPACE",
        f"Permanently deleted gym '{gym_name}' ({gym_slug}). Reason: {req.reason}",
        ws.id
    )

    # 4. Perform Transactional Cascading Deletion across all workspace tables
    try:
        # Collect all users associated with this workspace
        affil_user_ids = [
            r[0] for r in db.query(WorkspaceMember.user_id).filter(WorkspaceMember.workspace_id == id).all()
        ]

        # Delete billing subscriptions & logs
        db.query(GymSubscription).filter(GymSubscription.workspace_id == id).delete(synchronize_session=False)
        db.query(SubscriptionAuditLog).filter(SubscriptionAuditLog.workspace_id == id).delete(synchronize_session=False)

        db.query(Attendance).filter(Attendance.workspace_id == id).delete(synchronize_session=False)
        db.query(ClassAttendance).filter(ClassAttendance.workspace_id == id).delete(synchronize_session=False)
        db.query(ClientNote).filter(ClientNote.workspace_id == id).delete(synchronize_session=False)
        db.query(TrainingSession).filter(TrainingSession.workspace_id == id).delete(synchronize_session=False)
        db.query(TrainerClient).filter(TrainerClient.workspace_id == id).delete(synchronize_session=False)
        db.query(Trainer).filter(Trainer.workspace_id == id).delete(synchronize_session=False)
        db.query(GymClass).filter(GymClass.workspace_id == id).delete(synchronize_session=False)
        db.query(GymMachine).filter(GymMachine.workspace_id == id).delete(synchronize_session=False)
        db.query(GymInvitation).filter(GymInvitation.workspace_id == id).delete(synchronize_session=False)
        db.query(LeadFollowUp).filter(LeadFollowUp.workspace_id == id).delete(synchronize_session=False)
        db.query(LeadActivity).filter(LeadActivity.workspace_id == id).delete(synchronize_session=False)
        db.query(Lead).filter(Lead.workspace_id == id).delete(synchronize_session=False)
        db.query(Membership).filter(Membership.workspace_id == id).delete(synchronize_session=False)
        db.query(MembershipPlan).filter(MembershipPlan.workspace_id == id).delete(synchronize_session=False)
        db.query(Member).filter(Member.workspace_id == id).delete(synchronize_session=False)
        db.query(Workout).filter(Workout.workspace_id == id).delete(synchronize_session=False)
        db.query(WorkoutPlan).filter(WorkoutPlan.workspace_id == id).delete(synchronize_session=False)
        db.query(Payment).filter(Payment.workspace_id == id).delete(synchronize_session=False)
        db.query(Expense).filter(Expense.workspace_id == id).delete(synchronize_session=False)
        db.query(Notification).filter(Notification.workspace_id == id).delete(synchronize_session=False)
        db.query(Website).filter(Website.workspace_id == id).delete(synchronize_session=False)
        db.query(WorkspaceMember).filter(WorkspaceMember.workspace_id == id).delete(synchronize_session=False)
        db.query(Workspace).filter(Workspace.id == id).delete(synchronize_session=False)

        # Cascade delete users who solely belonged to this workspace (and are not superadmins)
        for u_id in affil_user_ids:
            remaining_workspaces = db.query(WorkspaceMember).filter(WorkspaceMember.user_id == u_id).count()
            if remaining_workspaces == 0:
                user_obj = db.query(User).filter(User.id == u_id).first()
                if user_obj and not user_obj.is_superadmin:
                    db.query(PendingRegistration).filter(
                        func.lower(PendingRegistration.email) == func.lower(user_obj.email)
                    ).delete(synchronize_session=False)
                    db.delete(user_obj)

        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to cascade delete gym data: {str(e)}")

    return {"status": "success", "message": f"Gym '{gym_name}' ({gym_slug}) and all related data was permanently deleted."}


@router.get("/workspaces/{id}/export")
def export_gym_data(
    id: str,
    tenant: TenantContext = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    check_superadmin(tenant, db)
    ws = db.query(Workspace).filter(Workspace.id == id).first()
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found.")

    members = db.query(Member).filter(Member.workspace_id == id).all()
    trainers = db.query(Trainer).filter(Trainer.workspace_id == id).all()
    plans = db.query(MembershipPlan).filter(MembershipPlan.workspace_id == id).all()

    return {
        "workspace": {
            "id": ws.id,
            "name": ws.name,
            "slug": ws.slug,
            "email": ws.email,
            "phone": ws.phone,
            "city": ws.city,
            "created_at": ws.created_at.isoformat() if ws.created_at else None,
        },
        "members_count": len(members),
        "trainers_count": len(trainers),
        "plans": [{"id": p.id, "name": p.name, "price": float(p.price)} for p in plans],
        "members": [{"id": m.id, "name": f"{m.first_name} {m.last_name}", "phone": m.phone, "status": str(m.status)} for m in members[:100]],
        "exported_at": datetime.now(timezone.utc).isoformat()
    }


# ----------------------------------------------------
# 4. GLOBAL MEMBERS DATABASE MANAGEMENT
# ----------------------------------------------------

class GlobalMemberItem(BaseModel):
    id: str
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    workspace_id: str
    gym_name: str
    gym_slug: str
    membership_plan: Optional[str] = None
    status: str
    registered_date: datetime
    last_attendance: Optional[str] = None
    trainer_name: Optional[str] = None


@router.get("/members", response_model=List[GlobalMemberItem])
def get_global_members(
    q: Optional[str] = None,
    gym_filter: Optional[str] = None,
    status_filter: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    tenant: TenantContext = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    check_superadmin(tenant, db)

    query = db.query(Member)

    if q:
        query_str = f"%{q.strip().lower()}%"
        first_safe = func.coalesce(Member.first_name, "")
        last_safe = func.coalesce(Member.last_name, "")
        full_safe = func.concat(first_safe, " ", last_safe)
        query = query.filter(
            or_(
                func.lower(Member.first_name).like(query_str),
                func.lower(Member.last_name).like(query_str),
                func.lower(full_safe).like(query_str),
                func.lower(Member.email).like(query_str),
                Member.phone.like(query_str)
            )
        )

    if gym_filter and gym_filter.lower() != "all":
        query = query.filter(Member.workspace_id == gym_filter)

    if status_filter and status_filter.lower() != "all":
        s_target = status_filter.lower()
        query = query.filter(
            or_(
                Member.status == s_target,
                func.lower(func.cast(Member.status, String)) == s_target
            )
        )

    offset = (page - 1) * limit
    members = query.order_by(Member.created_at.desc()).offset(offset).limit(limit).all()

    results = []
    for m in members:
        ws = db.query(Workspace).filter(Workspace.id == m.workspace_id).first()
        active_ms = db.query(Membership).filter(Membership.member_id == m.id).order_by(Membership.created_at.desc()).first()
        plan_title = active_ms.plan.name if (active_ms and active_ms.plan) else "Standard Access"

        last_att = db.query(Attendance).filter(Attendance.member_id == m.id).order_by(Attendance.check_in_time.desc()).first()
        last_att_str = last_att.check_in_time.strftime("%b %d, %Y") if last_att and last_att.check_in_time else "No check-ins yet"

        assigned_tc = db.query(TrainerClient).filter(
            TrainerClient.client_id == m.id,
            TrainerClient.status == TrainerClientStatus.ACTIVE
        ).first()
        t_name = assigned_tc.trainer.name if (assigned_tc and assigned_tc.trainer) else "Unassigned"

        member_full_name = f"{m.first_name or ''} {m.last_name or ''}".strip() or "Unnamed Member"

        results.append(GlobalMemberItem(
            id=m.id,
            name=member_full_name,
            email=m.email or "",
            phone=m.phone or "",
            workspace_id=m.workspace_id,
            gym_name=ws.name if ws else "Unknown Gym",
            gym_slug=ws.slug if ws else m.workspace_id,
            membership_plan=plan_title,
            status=m.status.value if hasattr(m.status, 'value') else str(m.status),
            registered_date=m.created_at,
            last_attendance=last_att_str,
            trainer_name=t_name,
        ))

    return results


class MemberStatusUpdate(BaseModel):
    status: str
    reason: Optional[str] = None


@router.patch("/members/{id}/status")
def update_global_member_status(
    id: str,
    req: MemberStatusUpdate,
    tenant: TenantContext = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    admin_user = check_superadmin(tenant, db)
    member = db.query(Member).filter(Member.id == id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found.")

    try:
        new_status = MemberStatus[req.status.upper()]
    except KeyError:
        # Fallback enum string assignment
        new_status = req.status.lower()

    member.status = new_status
    db.commit()

    log_audit_event(
        db, admin_user.id, f"UPDATE_MEMBER_STATUS_{req.status.upper()}",
        f"Member {member.first_name or ''} {member.last_name or ''} ({member.phone or ''}). Reason: {req.reason or 'Admin action'}",
        member.workspace_id
    )

    return {"status": "success", "message": f"Member status updated to {req.status}."}


class DeleteMemberConfirmRequest(BaseModel):
    confirmation_name: str
    admin_password: str
    reason: str


@router.post("/members/{id}/delete-permanently")
def delete_member_permanently(
    id: str,
    req: DeleteMemberConfirmRequest,
    tenant: TenantContext = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    admin_user = check_superadmin(tenant, db)

    # 1. Verify Super Admin Password
    if not verify_password(req.admin_password, admin_user.hashed_password):
        raise HTTPException(status_code=401, detail="Super Admin password verification failed.")

    member = db.query(Member).filter(Member.id == id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found.")

    full_name = f"{member.first_name} {member.last_name}".strip()
    if req.confirmation_name.strip().lower() != full_name.lower():
        raise HTTPException(status_code=400, detail=f"Confirmation name mismatch. Type exact member name '{full_name}'.")

    ws_id = member.workspace_id

    # 2. Log Audit Trail
    log_audit_event(
        db, admin_user.id, "PERMANENT_DELETE_MEMBER",
        f"Deleted member '{full_name}' ({member.phone}) from gym {ws_id}. Reason: {req.reason}",
        ws_id
    )

    # 3. Controlled Transactional Deletion of Member personal records only
    try:
        db.query(Attendance).filter(Attendance.member_id == id).delete(synchronize_session=False)
        db.query(ClassAttendance).filter(ClassAttendance.member_id == id).delete(synchronize_session=False)
        db.query(TrainerClient).filter(TrainerClient.client_id == id).delete(synchronize_session=False)
        db.query(Membership).filter(Membership.member_id == id).delete(synchronize_session=False)
        db.query(Member).filter(Member.id == id).delete(synchronize_session=False)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete member records: {str(e)}")

    return {"status": "success", "message": f"Member '{full_name}' was permanently deleted."}


# ----------------------------------------------------
# 5. GLOBAL TRAINERS MANAGEMENT
# ----------------------------------------------------

class GlobalTrainerItem(BaseModel):
    id: str
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    specialization: Optional[str] = None
    workspace_id: str
    gym_name: str
    gym_slug: str
    status: str
    active_clients_count: int
    created_at: datetime


@router.get("/trainers", response_model=List[GlobalTrainerItem])
def get_global_trainers(
    response: Response,
    q: Optional[str] = None,
    gym_filter: Optional[str] = None,
    status_filter: Optional[str] = None,
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    tenant: TenantContext = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    check_superadmin(tenant, db)

    query = db.query(Trainer)

    if q:
        query_str = f"%{q.strip().lower()}%"
        query = query.filter(
            or_(
                func.lower(Trainer.name).like(query_str),
                func.lower(Trainer.email).like(query_str),
                Trainer.phone.like(query_str)
            )
        )

    if gym_filter and gym_filter.lower() != "all":
        query = query.filter(Trainer.workspace_id == gym_filter)

    if status_filter and status_filter.lower() != "all":
        query = query.filter(Trainer.status == status_filter.lower())

    response.headers["X-Total-Count"] = str(query.count())
    trainers = query.order_by(Trainer.created_at.desc()).offset(offset).limit(limit).all()
    results = []
    # Batched lookups (no per-row queries).
    workspaces = {w.id: w for w in db.query(Workspace).filter(Workspace.id.in_({t.workspace_id for t in trainers})).all()} if trainers else {}
    client_counts = dict(db.query(TrainerClient.trainer_id, func.count(TrainerClient.id)).filter(
        TrainerClient.trainer_id.in_([t.id for t in trainers]),
        TrainerClient.status == TrainerClientStatus.ACTIVE,
    ).group_by(TrainerClient.trainer_id).all()) if trainers else {}

    for t in trainers:
        ws = workspaces.get(t.workspace_id)
        client_count = client_counts.get(t.id, 0)

        results.append(GlobalTrainerItem(
            id=t.id,
            name=t.name,
            email=t.email,
            phone=t.phone,
            specialization=t.specialization or "General Fitness",
            workspace_id=t.workspace_id,
            gym_name=ws.name if ws else "Unknown Gym",
            gym_slug=ws.slug if ws else t.workspace_id,
            status=t.status.value if hasattr(t.status, 'value') else str(t.status),
            active_clients_count=client_count,
            created_at=t.created_at
        ))

    return results


@router.patch("/trainers/{id}/status")
def update_global_trainer_status(
    id: str,
    req: WorkspaceStatusUpdateRequest,
    tenant: TenantContext = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    admin_user = check_superadmin(tenant, db)
    trainer = db.query(Trainer).filter(Trainer.id == id).first()
    if not trainer:
        raise HTTPException(status_code=404, detail="Trainer not found.")

    trainer.status = TrainerStatus.ACTIVE if req.is_active else TrainerStatus.SUSPENDED
    db.commit()

    log_audit_event(
        db, admin_user.id, "UPDATE_TRAINER_STATUS",
        f"Trainer {trainer.name} set to {trainer.status.value}. Reason: {req.reason or 'Admin action'}",
        trainer.workspace_id
    )

    return {"status": "success", "message": f"Trainer status updated to {trainer.status.value}."}


# ----------------------------------------------------
# 6. GLOBAL USERS & AUDIT LOGS
# ----------------------------------------------------

class GlobalUserResponse(BaseModel):
    id: str
    full_name: str
    email: str
    phone: Optional[str] = None
    role: str
    workspace_name: Optional[str] = None
    workspace_slug: Optional[str] = None
    is_superadmin: bool
    is_active: bool
    created_at: datetime


@router.get("/users", response_model=List[GlobalUserResponse])
def get_all_global_users(
    response: Response,
    role_filter: Optional[str] = None,
    q: Optional[str] = None,
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    tenant: TenantContext = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    check_superadmin(tenant, db)
    query = db.query(User)
    if q:
        like = f"%{q.strip().lower()}%"
        query = query.filter(or_(func.lower(User.email).like(like), func.lower(User.full_name).like(like)))
    if role_filter and role_filter.upper() == "SUPER_ADMIN":
        query = query.filter(User.is_superadmin.is_(True))
    elif role_filter:
        try:
            wanted = UserRole(role_filter.upper())
        except ValueError:
            raise HTTPException(status_code=422, detail="Unknown role filter.")
        query = query.filter(User.is_superadmin.is_(False), User.id.in_(
            db.query(WorkspaceMember.user_id).filter(WorkspaceMember.role == wanted)))
    response.headers["X-Total-Count"] = str(query.count())
    users = query.order_by(User.created_at.desc()).offset(offset).limit(limit).all()
    memberships = {}
    for wm in db.query(WorkspaceMember).filter(WorkspaceMember.user_id.in_([u.id for u in users])).order_by(
            WorkspaceMember.created_at).all() if users else []:
        memberships.setdefault(wm.user_id, wm)
    workspaces = {w.id: w for w in db.query(Workspace).filter(
        Workspace.id.in_({wm.workspace_id for wm in memberships.values()})).all()} if memberships else {}
    results = []

    for u in users:
        ws_mem = memberships.get(u.id)
        role = "SUPER_ADMIN" if u.is_superadmin else (ws_mem.role.value if ws_mem else "USER")
        ws = workspaces.get(ws_mem.workspace_id) if ws_mem else None

        results.append(GlobalUserResponse(
            id=u.id,
            full_name=u.full_name,
            email=u.email,
            phone=u.phone,
            role=role,
            workspace_name=ws.name if ws else None,
            workspace_slug=ws.slug if ws else None,
            is_superadmin=u.is_superadmin,
            is_active=u.is_active,
            created_at=u.created_at
        ))

    return results


@router.delete("/users/{user_id}")
def delete_user_permanently(
    user_id: str,
    tenant: TenantContext = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    admin_user = check_superadmin(tenant, db)
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found.")
    if target_user.is_superadmin and target_user.id == admin_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own super admin account.")

    user_email = target_user.email

    # Log audit event
    log_audit_event(
        db, admin_user.id, "PERMANENT_DELETE_USER",
        f"Permanently deleted user '{user_email}' (ID: {user_id})"
    )

    # Remove workspace memberships
    db.query(WorkspaceMember).filter(WorkspaceMember.user_id == user_id).delete(synchronize_session=False)
    # Remove pending registrations
    db.query(PendingRegistration).filter(
        func.lower(PendingRegistration.email) == func.lower(user_email)
    ).delete(synchronize_session=False)
    # Remove user record
    db.delete(target_user)
    db.commit()

    return {"status": "success", "message": f"User '{user_email}' was permanently deleted from the database."}


class AuditLogResponse(BaseModel):
    id: str
    workspace_id: Optional[str] = None
    user_id: Optional[str] = None
    action: str
    details: Optional[str] = None
    created_at: datetime


@router.get("/audit-logs", response_model=List[AuditLogResponse])
def get_platform_audit_logs(
    limit: int = Query(100, le=500),
    action: Optional[str] = None,
    tenant: TenantContext = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    check_superadmin(tenant, db)
    query = db.query(AuditLog)
    if action:
        query = query.filter(AuditLog.action == action)

    logs = query.order_by(desc(AuditLog.created_at)).limit(limit).all()
    return [
        AuditLogResponse(
            id=l.id,
            workspace_id=l.workspace_id,
            user_id=l.user_id,
            action=l.action,
            details=l.details,
            created_at=l.created_at
        ) for l in logs
    ]


# ----------------------------------------------------
# 7. SYSTEM HEALTH & PLATFORM PAYMENTS
# ----------------------------------------------------

class SystemHealthMetric(BaseModel):
    component: str
    status: str  # HEALTHY | DEGRADED | DOWN | CONFIGURED | NOT_CONFIGURED | DISABLED
    latency_ms: Optional[float] = None
    uptime_pct: Optional[float] = None  # not measured in-process; only external monitoring can report it
    details: str

class SystemHealthResponse(BaseModel):
    overall_status: str
    timestamp: datetime
    metrics: List[SystemHealthMetric]


@router.get("/system-health", response_model=SystemHealthResponse)
def get_system_health(
    tenant: TenantContext = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """Live checks only: a DB round trip, provider configuration and delivery backlog. No invented uptime."""
    check_superadmin(tenant, db)
    database = platform_metrics.database_health(db)
    dialect = db.get_bind().dialect.name
    queued = db.query(func.count(NotificationDelivery.id)).filter(NotificationDelivery.status == "queued").scalar() or 0
    failed_24h = db.query(func.count(NotificationDelivery.id)).filter(
        NotificationDelivery.status == "failed",
        NotificationDelivery.created_at >= (datetime.now(timezone.utc) - timedelta(days=1)).replace(tzinfo=None),
    ).scalar() or 0

    def configured(name: str, ok: bool, details_ok: str, details_missing: str) -> SystemHealthMetric:
        return SystemHealthMetric(component=name, status="CONFIGURED" if ok else "NOT_CONFIGURED",
                                  details=details_ok if ok else details_missing)

    cache_stats = cache.stats()
    metrics = [
        SystemHealthMetric(
            component=f"Database ({dialect})", status=database["status"], latency_ms=database["latency_ms"],
            details="SELECT 1 round trip" if database["status"] == "HEALTHY" else f"Error: {database['error']}",
        ),
        configured("Email (SMTP)", bool(settings.SMTP_USER and settings.SMTP_PASSWORD and settings.EMAIL_FROM),
                   f"Sending via {settings.SMTP_HOST}", "Emails are recorded as skipped_not_configured"),
        configured("WhatsApp (AiSensy)", bool(settings.AISENSY_API_KEY),
                   "Template campaigns enabled", "WhatsApp deliveries are recorded as skipped_not_configured"),
        configured("Cashfree billing", bool(settings.CASHFREE_APP_ID and settings.CASHFREE_SECRET_KEY),
                   f"Environment {settings.CASHFREE_ENV}", "Online subscription checkout is disabled"),
        SystemHealthMetric(
            component="Notification queue", status="HEALTHY" if failed_24h == 0 else "DEGRADED",
            details=f"{queued} queued, {failed_24h} failed in the last 24h",
        ),
        SystemHealthMetric(
            component="In-process cache", status="HEALTHY" if settings.CACHE_ENABLED else "DISABLED",
            details=f"{cache_stats['entries']} entries, {cache_stats['hits']} hits / {cache_stats['misses']} misses (this worker)",
        ),
    ]
    from app.core.error_monitoring import status as error_status
    from app.core.push import push_configured
    from app.core.sms import sms_configured
    from app.core.storage import storage_health
    from app.models.jobs import JobRun

    store = storage_health()
    metrics.append(SystemHealthMetric(component=f"File storage ({store['backend']})", status=store["status"],
                                      details=store.get("error") or "Private uploads, receipts and documents"))
    from app.core.images import images_health

    img = images_health()
    metrics.append(SystemHealthMetric(
        component="Image hosting (Cloudinary)", status=img["status"],
        details=img.get("error") or ("Logos and profile photos are served from Cloudinary" if img["backend"] == "cloudinary"
                                     else "Logos and profile photos use file storage (set CLOUDINARY_URL)"),
    ))
    metrics.append(configured("SMS", sms_configured(), f"Provider {settings.SMS_PROVIDER}",
                              "SMS alerts are not sent (no provider configured)"))
    metrics.append(configured("Push (FCM)", push_configured(), f"Project {settings.FCM_PROJECT_ID}",
                              "Push deliveries are recorded as skipped_not_configured"))
    err = error_status()
    metrics.append(SystemHealthMetric(component="Error monitoring (Sentry)",
                                      status="CONFIGURED" if err["enabled"] else "NOT_CONFIGURED",
                                      details="Capturing unhandled errors" if err["enabled"] else
                                      "Errors are logged with request ids only (set SENTRY_DSN and install sentry-sdk)"))
    last_run = db.query(JobRun).order_by(JobRun.started_at.desc()).first()
    failed_jobs = db.query(func.count(JobRun.id)).filter(
        JobRun.status == "failed",
        JobRun.started_at >= datetime.now(timezone.utc) - timedelta(days=1)).scalar() or 0
    if last_run is None:
        job_status, job_details = "NOT_CONFIGURED", "No job has run. Enable SCHEDULER_ENABLED or schedule scripts/run_jobs.py."
    else:
        started = last_run.started_at if last_run.started_at.tzinfo else last_run.started_at.replace(tzinfo=timezone.utc)
        stale = datetime.now(timezone.utc) - started > timedelta(minutes=10)
        job_status = "DEGRADED" if stale or failed_jobs else "HEALTHY"
        job_details = f"Last run {started:%Y-%m-%d %H:%M} UTC ({last_run.job_name}); {failed_jobs} failed in 24h"
    metrics.append(SystemHealthMetric(component="Background jobs", status=job_status, details=job_details))
    overall = "OPERATIONAL" if database["status"] == "HEALTHY" else "DEGRADED"
    return SystemHealthResponse(overall_status=overall, timestamp=datetime.now(timezone.utc), metrics=metrics)


class PlatformPaymentItem(BaseModel):
    id: str
    gym_name: str
    gym_slug: str
    amount: float
    currency: str
    status: str
    gateway: str
    payment_method: str
    created_at: datetime


@router.get("/payments", response_model=List[PlatformPaymentItem])
def get_platform_payments(
    response: Response,
    status_filter: Optional[str] = Query(None, alias="status"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    tenant: TenantContext = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """Platform subscription payments (gyms paying REPSI). Gym-member payments are a different domain."""
    check_superadmin(tenant, db)
    query = db.query(SubscriptionPayment, Workspace).outerjoin(Workspace, Workspace.id == SubscriptionPayment.workspace_id)
    if status_filter:
        query = query.filter(SubscriptionPayment.status == status_filter.lower())
    response.headers["X-Total-Count"] = str(query.count())
    rows = query.order_by(desc(SubscriptionPayment.created_at)).offset(offset).limit(limit).all()
    return [
        PlatformPaymentItem(
            id=p.id,
            gym_name=ws.name if ws else "Deleted workspace",
            gym_slug=ws.slug if ws else "",
            amount=float(p.amount),
            currency=p.currency or "INR",
            status=p.status.value if hasattr(p.status, "value") else str(p.status),
            gateway="Cashfree" if (p.cashfree_order_id or p.cashfree_payment_id) else "Manual",
            payment_method=p.payment_method or "unknown",
            created_at=p.created_at,
        )
        for p, ws in rows
    ]


class BroadcastRequest(BaseModel):
    target_audience: str = Field(pattern="^(all_owners|active_owners|trial_owners|all_users)$")
    subject: str = Field(min_length=2, max_length=200)
    message: str = Field(min_length=2, max_length=4000)


@router.post("/broadcast")
def broadcast_platform_announcement(
    req: BroadcastRequest,
    tenant: TenantContext = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """Delivers an in-app notification to every recipient now and logs one delivery row each."""
    admin_user = check_superadmin(tenant, db)
    ws_query = db.query(Workspace.id).filter(Workspace.is_active == True)
    if req.target_audience in ("active_owners", "trial_owners"):
        wanted = platform_metrics.PAID_STATUSES if req.target_audience == "active_owners" else (SubscriptionStatus.TRIALING.value,)
        ws_query = ws_query.join(GymSubscription, GymSubscription.workspace_id == Workspace.id).filter(
            GymSubscription.status.in_(wanted))
    workspace_ids = [w for (w,) in ws_query.all()]

    wm_query = db.query(WorkspaceMember.workspace_id, WorkspaceMember.user_id).filter(
        WorkspaceMember.workspace_id.in_(workspace_ids or ["-"]), WorkspaceMember.is_active == True)
    if req.target_audience != "all_users":
        wm_query = wm_query.filter(WorkspaceMember.role.in_((UserRole.OWNER, UserRole.ADMIN)))
    recipients = wm_query.distinct().all()

    now = datetime.now(timezone.utc)
    broadcast = Broadcast(
        workspace_id=PLATFORM_WORKSPACE_ID, title=req.subject, message=req.message, channels=["in_app"],
        audience={"segment": req.target_audience, "workspaces": len(workspace_ids)},
        status="completed", recipient_count=len(recipients), created_by=admin_user.id, completed_at=now,
    )
    db.add(broadcast)
    db.flush()
    for ws_id, user_id in recipients:
        db.add(Notification(workspace_id=ws_id, user_id=user_id, title=req.subject, message=req.message, is_read=False))
        db.add(NotificationDelivery(
            workspace_id=ws_id, broadcast_id=broadcast.id, event_type="platform_broadcast", channel="in_app",
            recipient_user_id=user_id, status="sent", provider="in_app", attempts=1, sent_at=now,
            idempotency_key=f"platform:broadcast:{broadcast.id}:{ws_id}:{user_id}",
        ))
    db.commit()
    log_audit_event(
        db, admin_user.id, "BROADCAST_ANNOUNCEMENT",
        f"Audience: {req.target_audience} | Subject: {req.subject} | Delivered in-app to {len(recipients)} accounts "
        f"across {len(workspace_ids)} workspaces",
    )
    return {
        "status": "sent" if recipients else "no_recipients",
        "broadcast_id": broadcast.id,
        "recipients": len(recipients),
        "workspaces": len(workspace_ids),
        "message": f"Delivered in-app to {len(recipients)} accounts across {len(workspace_ids)} workspaces.",
    }


@router.get("/broadcasts")
def list_platform_broadcasts(
    limit: int = Query(50, ge=1, le=200),
    tenant: TenantContext = Depends(get_current_tenant),
    db: Session = Depends(get_db),
):
    check_superadmin(tenant, db)
    rows = db.query(Broadcast).filter(Broadcast.workspace_id == PLATFORM_WORKSPACE_ID).order_by(
        desc(Broadcast.created_at)).limit(limit).all()
    return [
        {"id": b.id, "title": b.title, "message": b.message, "audience": b.audience, "status": b.status,
         "recipient_count": b.recipient_count, "created_at": b.created_at}
        for b in rows
    ]


# ----------------------------------------------------
# 12. SUBSCRIPTION MANAGEMENT & SUPER ADMIN CONTROLS
# ----------------------------------------------------

class PlanUpdateRequest(BaseModel):
    name: Optional[str] = None
    tagline: Optional[str] = None
    description: Optional[str] = None
    monthly_price_inr: Optional[float] = None
    annual_price_inr: Optional[float] = None
    member_limit: Optional[int] = None
    trainer_limit: Optional[int] = None
    staff_limit: Optional[int] = None
    branch_limit: Optional[int] = None
    is_active: Optional[bool] = None
    is_popular: Optional[bool] = None
    contact_sales: Optional[bool] = None
    features: Optional[Dict[str, bool]] = None


class ExtendTrialRequest(BaseModel):
    days: int
    reason: str


class AdminChangePlanRequest(BaseModel):
    plan_code: str
    billing_cycle: Optional[str] = "monthly"
    reason: str


class ComplimentaryAccessRequest(BaseModel):
    days: Optional[int] = None
    exact_date: Optional[datetime] = None
    is_indefinite: Optional[bool] = False
    reason: str


class GymOverridesRequest(BaseModel):
    custom_member_limit: Optional[int] = None
    custom_trainer_limit: Optional[int] = None
    custom_staff_limit: Optional[int] = None
    custom_branch_limit: Optional[int] = None
    custom_features: Optional[Dict[str, bool]] = None
    reason: str


class SubscriptionStatusRequest(BaseModel):
    status: str
    reason: str


@router.get("/subscriptions/plans")
def list_subscription_plans(
    tenant: TenantContext = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """Lists all configurable SaaS subscription plans."""
    check_superadmin(tenant, db)
    plans = BillingService.ensure_default_plans(db)
    return [
        {
            "id": p.id,
            "code": p.code,
            "name": p.name,
            "tagline": p.tagline,
            "description": p.description,
            "monthly_price_inr": p.monthly_price_inr,
            "annual_price_inr": p.annual_price_inr,
            "member_limit": p.member_limit,
            "trainer_limit": p.trainer_limit,
            "staff_limit": getattr(p, "staff_limit", 2),
            "branch_limit": p.branch_limit,
            "is_popular": p.is_popular,
            "is_active": getattr(p, "is_active", True),
            "contact_sales": getattr(p, "contact_sales", False),
            "display_order": p.display_order,
            "features": p.features or {},
        }
        for p in plans
    ]


@router.put("/subscriptions/plans/{plan_id}")
def update_subscription_plan(
    plan_id: str,
    req: PlanUpdateRequest,
    tenant: TenantContext = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """Updates plan definitions, prices, limits, and feature flags."""
    admin_user = check_superadmin(tenant, db)
    plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Subscription plan not found.")

    if req.name is not None:
        plan.name = req.name
    if req.tagline is not None:
        plan.tagline = req.tagline
    if req.description is not None:
        plan.description = req.description
    if req.monthly_price_inr is not None:
        plan.monthly_price_inr = req.monthly_price_inr
    if req.annual_price_inr is not None:
        plan.annual_price_inr = req.annual_price_inr
    if req.member_limit is not None:
        plan.member_limit = req.member_limit
    if req.trainer_limit is not None:
        plan.trainer_limit = req.trainer_limit
    if req.staff_limit is not None:
        plan.staff_limit = req.staff_limit
    if req.branch_limit is not None:
        plan.branch_limit = req.branch_limit
    if req.is_active is not None:
        plan.is_active = req.is_active
    if req.is_popular is not None:
        plan.is_popular = req.is_popular
    if req.contact_sales is not None:
        plan.contact_sales = req.contact_sales
    if req.features is not None:
        plan.features = req.features

    db.commit()
    db.refresh(plan)
    invalidate_entitlements()  # every workspace on this plan

    log_audit_event(
        db, admin_user.id, "UPDATE_SUBSCRIPTION_PLAN",
        f"Updated plan {plan.code} ({plan.name})"
    )

    return {"status": "success", "message": f"Plan '{plan.name}' updated successfully."}


@router.get("/subscriptions/trial-analytics")
def get_superadmin_trial_analytics_route(
    tenant: TenantContext = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """
    Returns high-level trial analytics for Super Admin:
    Total gyms, active trials, expiring today/3d/7d, expired, active paid, and conversion rates.
    """
    check_superadmin(tenant, db)
    from app.services.trial_lifecycle import TrialLifecycleService
    return TrialLifecycleService.get_superadmin_trial_analytics(db)


@router.get("/subscriptions/gyms")
def list_gym_subscriptions(
    query: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None),
    plan_filter: Optional[str] = Query(None),
    filter_type: Optional[str] = Query(None),  # all, active_trial, expiring_soon, expired, paid
    tenant: TenantContext = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """Search and list gym workspaces with live subscription status, remaining hours/days, and usage meters."""
    check_superadmin(tenant, db)
    BillingService.ensure_default_plans(db)

    q = db.query(Workspace).order_by(Workspace.created_at.desc())
    if query:
        term = f"%{query.strip()}%"
        q = q.filter(or_(Workspace.name.ilike(term), Workspace.slug.ilike(term), Workspace.email.ilike(term)))

    workspaces = q.all()
    results = []
    now = datetime.now(timezone.utc)

    for ws in workspaces:
        sub = BillingService.get_or_create_workspace_subscription(db, ws.id)
        status_str = sub.status.value if hasattr(sub.status, "value") else str(sub.status)

        if status_filter and status_str != status_filter:
            continue
        if plan_filter and sub.plan.code != plan_filter:
            continue

        usage = BillingService.get_workspace_usage(db, ws.id)
        owner_member = db.query(WorkspaceMember).filter(
            WorkspaceMember.workspace_id == ws.id,
            WorkspaceMember.role == UserRole.OWNER
        ).first()
        owner_user = db.query(User).filter(User.id == owner_member.user_id).first() if owner_member else None

        trial_days_remaining = None
        trial_hours_remaining = None
        t_end = sub.trial_ends_at or sub.trial_end
        if t_end:
            t_end_utc = t_end if t_end.tzinfo else t_end.replace(tzinfo=timezone.utc)
            delta = t_end_utc - now
            delta_sec = delta.total_seconds()
            trial_days_remaining = max(0, int(delta_sec // 86400))
            trial_hours_remaining = max(0, int(delta_sec // 3600))

        # Filter by high-level category if requested
        if filter_type:
            if filter_type == "active_trial" and status_str != "trialing":
                continue
            elif filter_type == "expiring_soon" and (status_str != "trialing" or (trial_days_remaining is not None and trial_days_remaining > 3)):
                continue
            elif filter_type == "expired" and status_str != "expired":
                continue
            elif filter_type == "paid" and status_str != "active":
                continue

        results.append({
            "workspace_id": ws.id,
            "gym_name": ws.name,
            "gym_slug": ws.slug,
            "gym_email": ws.email,
            "gym_city": ws.city,
            "is_active": ws.is_active,
            "owner_name": owner_user.full_name if owner_user else "N/A",
            "owner_email": owner_user.email if owner_user else "N/A",
            "subscription": {
                "id": sub.id,
                "plan_code": sub.plan.code,
                "plan_name": sub.plan.name,
                "status": status_str,
                "billing_cycle": sub.billing_cycle.value if hasattr(sub.billing_cycle, "value") else str(sub.billing_cycle),
                "trial_start": sub.trial_started_at.isoformat() if sub.trial_started_at else (sub.trial_start.isoformat() if sub.trial_start else None),
                "trial_end": t_end.isoformat() if t_end else None,
                "trial_days_remaining": trial_days_remaining,
                "trial_hours_remaining": trial_hours_remaining,
                "trial_converted_at": sub.trial_converted_at.isoformat() if sub.trial_converted_at else None,
                "current_period_end": sub.current_period_end.isoformat() if sub.current_period_end else None,
                "is_complimentary": sub.is_complimentary,
                "complimentary_until": sub.complimentary_until.isoformat() if sub.complimentary_until else None,
            },
            "usage": usage,
            "created_at": ws.created_at.isoformat() if ws.created_at else None,
        })

    return results


@router.get("/subscriptions/gyms/{workspace_id}")
def get_gym_subscription_detail(
    workspace_id: str,
    tenant: TenantContext = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """Detailed gym subscription overview including limits, overrides, and audit history."""
    check_superadmin(tenant, db)
    ws = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not ws:
        raise HTTPException(status_code=404, detail="Gym workspace not found.")

    sub = BillingService.get_or_create_workspace_subscription(db, ws.id)
    usage = BillingService.get_workspace_usage(db, ws.id)
    limits = BillingService.get_effective_limits(db, ws.id)
    features = BillingService.get_effective_features(db, ws.id)

    # History
    audit_logs = db.query(SubscriptionAuditLog).filter(
        SubscriptionAuditLog.workspace_id == ws.id
    ).order_by(SubscriptionAuditLog.created_at.desc()).limit(50).all()

    now = datetime.now(timezone.utc)
    trial_days_left = None
    if sub.status == SubscriptionStatus.TRIALING and sub.trial_end:
        t_end = sub.trial_end if sub.trial_end.tzinfo else sub.trial_end.replace(tzinfo=timezone.utc)
        trial_days_left = max(0, (t_end - now).days)

    return {
        "workspace": {
            "id": ws.id,
            "name": ws.name,
            "slug": ws.slug,
            "email": ws.email,
            "phone": ws.phone,
            "city": ws.city,
            "is_active": ws.is_active,
        },
        "subscription": {
            "id": sub.id,
            "plan_code": sub.plan.code,
            "plan_name": sub.plan.name,
            "status": sub.status.value if hasattr(sub.status, "value") else str(sub.status),
            "billing_cycle": sub.billing_cycle.value if hasattr(sub.billing_cycle, "value") else str(sub.billing_cycle),
            "trial_start": sub.trial_start.isoformat() if sub.trial_start else None,
            "trial_end": sub.trial_end.isoformat() if sub.trial_end else None,
            "trial_days_remaining": trial_days_left,
            "current_period_start": sub.current_period_start.isoformat() if sub.current_period_start else None,
            "current_period_end": sub.current_period_end.isoformat() if sub.current_period_end else None,
            "is_complimentary": sub.is_complimentary,
            "complimentary_until": sub.complimentary_until.isoformat() if sub.complimentary_until else None,
            "suspended_at": sub.suspended_at.isoformat() if sub.suspended_at else None,
            "suspension_reason": sub.suspension_reason,
            "notes": sub.notes,
            "custom_member_limit": sub.custom_member_limit,
            "custom_trainer_limit": sub.custom_trainer_limit,
            "custom_staff_limit": sub.custom_staff_limit,
            "custom_branch_limit": sub.custom_branch_limit,
            "custom_features": sub.custom_features or {},
        },
        "limits": limits,
        "features": features,
        "usage": usage,
        "history": [
            {
                "id": l.id,
                "action": l.action,
                "old_value": l.old_value,
                "new_value": l.new_value,
                "reason": l.reason,
                "created_at": l.created_at.isoformat() if l.created_at else None,
            }
            for l in audit_logs
        ]
    }


@router.post("/subscriptions/gyms/{workspace_id}/extend-trial")
def admin_extend_gym_trial(
    workspace_id: str,
    req: ExtendTrialRequest,
    tenant: TenantContext = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """Extends gym trial by N days with reason logging."""
    admin_user = check_superadmin(tenant, db)
    sub = BillingService.extend_trial(
        db, workspace_id, days=req.days, actor_user_id=admin_user.id, reason=req.reason
    )
    return {
        "status": "success",
        "message": f"Trial extended by {req.days} days successfully.",
        "trial_end": sub.trial_end.isoformat() if sub.trial_end else None,
    }


@router.post("/subscriptions/gyms/{workspace_id}/change-plan")
def admin_change_gym_plan(
    workspace_id: str,
    req: AdminChangePlanRequest,
    tenant: TenantContext = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """Directly switches a gym to a designated plan tier."""
    admin_user = check_superadmin(tenant, db)
    sub = BillingService.change_gym_plan(
        db, workspace_id, new_plan_code=req.plan_code, billing_cycle=req.billing_cycle or "monthly",
        actor_user_id=admin_user.id, reason=req.reason
    )
    return {
        "status": "success",
        "message": f"Gym plan updated to {sub.plan.name}.",
        "plan_code": sub.plan.code,
    }


@router.post("/subscriptions/gyms/{workspace_id}/complimentary")
def admin_grant_complimentary_access(
    workspace_id: str,
    req: ComplimentaryAccessRequest,
    tenant: TenantContext = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """Grants complimentary SaaS access without corrupting payment history."""
    admin_user = check_superadmin(tenant, db)
    sub = BillingService.grant_complimentary_access(
        db, workspace_id, days=req.days, exact_date=req.exact_date, is_indefinite=req.is_indefinite,
        actor_user_id=admin_user.id, reason=req.reason
    )
    return {
        "status": "success",
        "message": "Complimentary access granted successfully.",
        "complimentary_until": sub.complimentary_until.isoformat() if sub.complimentary_until else "indefinite",
    }


@router.post("/subscriptions/gyms/{workspace_id}/override")
def admin_set_gym_overrides(
    workspace_id: str,
    req: GymOverridesRequest,
    tenant: TenantContext = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """Sets per-gym custom limits (members, trainers, staff) or feature flag overrides."""
    admin_user = check_superadmin(tenant, db)
    sub = BillingService.set_gym_overrides(
        db, workspace_id,
        custom_member_limit=req.custom_member_limit,
        custom_trainer_limit=req.custom_trainer_limit,
        custom_staff_limit=req.custom_staff_limit,
        custom_branch_limit=req.custom_branch_limit,
        custom_features=req.custom_features,
        actor_user_id=admin_user.id,
        reason=req.reason
    )
    return {
        "status": "success",
        "message": "Custom overrides applied successfully.",
        "limits": BillingService.get_effective_limits(db, workspace_id),
    }


@router.post("/subscriptions/gyms/{workspace_id}/status")
def admin_set_gym_subscription_status(
    workspace_id: str,
    req: SubscriptionStatusRequest,
    tenant: TenantContext = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """Suspends, reactivates, or cancels a gym subscription."""
    admin_user = check_superadmin(tenant, db)
    sub = BillingService.set_subscription_status(
        db, workspace_id, new_status=req.status, actor_user_id=admin_user.id, reason=req.reason
    )
    return {
        "status": "success",
        "message": f"Subscription status changed to '{req.status}'.",
        "status": sub.status.value if hasattr(sub.status, "value") else str(sub.status),
    }




# ─── Background jobs ────────────────────────────────────────────────────


@router.get("/jobs")
def list_jobs(tenant: TenantContext = Depends(get_current_tenant), db: Session = Depends(get_db)):
    check_superadmin(tenant, db)
    from app.services.jobs import JOBS, recent_runs

    runs = recent_runs(db, 200)
    last = {}
    for r in runs:
        last.setdefault(r.job_name, r)
    return {
        "scheduler_enabled": settings.SCHEDULER_ENABLED,
        "jobs": [{"name": j.name, "every_minutes": j.every_minutes, "description": j.description,
                  "last_status": last[j.name].status if j.name in last else None,
                  "last_started_at": last[j.name].started_at if j.name in last else None,
                  "last_error": last[j.name].error if j.name in last else None} for j in JOBS.values()],
        "recent_runs": [{"id": r.id, "job": r.job_name, "status": r.status, "trigger": r.trigger,
                         "started_at": r.started_at, "duration_ms": r.duration_ms, "result": r.result,
                         "error": r.error} for r in runs[:50]],
    }


@router.post("/jobs/{job_name}/run")
def run_job_now(job_name: str, tenant: TenantContext = Depends(get_current_tenant), db: Session = Depends(get_db)):
    user = check_superadmin(tenant, db)
    from app.core.audit import record_audit
    from app.core.database import SessionLocal
    from app.services.jobs import JOBS, run_job

    job = JOBS.get(job_name)
    if job is None:
        raise HTTPException(status_code=404, detail="Unknown job.")
    bind = db.get_bind()
    factory = (lambda: Session(bind=bind)) if bind is not None else SessionLocal
    run = run_job(factory, job, "manual", f"manual-{datetime.now(timezone.utc):%Y%m%dT%H%M%S%f}")
    record_audit(db, "platform", user.id, "job_run_manual", resource_type="job", resource_id=job_name,
                 details={"status": run.status if run else None})
    db.commit()
    return {"job": job_name, "status": run.status, "duration_ms": run.duration_ms, "result": run.result, "error": run.error}
