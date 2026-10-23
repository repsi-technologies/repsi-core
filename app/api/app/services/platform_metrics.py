"""
Super admin platform metrics computed from real rows: workspaces, subscriptions, platform
subscription payments (SaaS billing — not gym-member payments) and audit logs.

MRR: sum over paid, non-complimentary ACTIVE/GRACE_PERIOD subscriptions of the plan's monthly
INR price for monthly billing, or the plan's annual per-month INR price for annual billing.
Trials, expired, suspended and complimentary workspaces contribute 0.
"""
from __future__ import annotations

import time
from datetime import datetime, timedelta, timezone
from typing import Optional

from sqlalchemy import case, func, select, text
from sqlalchemy.orm import Session

from app.core import cache
from app.core.config import settings
from app.models.billing import GymSubscription, PaymentStatus, SubscriptionPayment, SubscriptionPlan, SubscriptionStatus
from app.models.member import Member
from app.models.system import AuditLog
from app.models.trainer import Trainer
from app.models.user import User, UserRole, Workspace, WorkspaceMember

PAID_STATUSES = (SubscriptionStatus.ACTIVE.value, SubscriptionStatus.GRACE_PERIOD.value)


def _status(value) -> str:
    return value.value if hasattr(value, "value") else str(value or "")


def subscription_mrr(sub: GymSubscription, plan: SubscriptionPlan) -> float:
    if _status(sub.status) not in PAID_STATUSES or sub.is_complimentary:
        return 0.0
    if _status(sub.billing_cycle) == "annual":
        return float(plan.annual_price_inr or 0.0)
    return float(plan.monthly_price_inr or 0.0)


def _month_starts(now: datetime, months: int) -> list[datetime]:
    first = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    starts = []
    y, m = first.year, first.month
    for _ in range(months):
        starts.append(datetime(y, m, 1, tzinfo=timezone.utc))
        y, m = (y - 1, 12) if m == 1 else (y, m - 1)
    return list(reversed(starts))


def _naive(dt: datetime) -> datetime:
    """Timestamps are stored naive-UTC on SQLite; compare like with like."""
    return dt.replace(tzinfo=None)


def _cumulative_by_month(db: Session, column, months: list[datetime]) -> list[dict]:
    points = []
    for start in months:
        end = (start + timedelta(days=32)).replace(day=1)
        count = db.scalar(select(func.count()).where(column < _naive(end))) or 0
        points.append({"label": start.strftime("%b"), "value": int(count)})
    return points


def revenue_by_month(db: Session, months: int = 12, now: Optional[datetime] = None) -> list[dict]:
    """Successful platform subscription payments per calendar month (UTC)."""
    now = now or datetime.now(timezone.utc)
    rows = []
    for start in _month_starts(now, months):
        end = (start + timedelta(days=32)).replace(day=1)
        amount, count = db.execute(
            select(func.coalesce(func.sum(SubscriptionPayment.amount), 0.0), func.count(SubscriptionPayment.id)).where(
                SubscriptionPayment.status == PaymentStatus.SUCCESS,
                SubscriptionPayment.created_at >= _naive(start),
                SubscriptionPayment.created_at < _naive(end),
            )
        ).one()
        failed = db.scalar(select(func.count(SubscriptionPayment.id)).where(
            SubscriptionPayment.status == PaymentStatus.FAILED,
            SubscriptionPayment.created_at >= _naive(start),
            SubscriptionPayment.created_at < _naive(end),
        )) or 0
        rows.append({"month": start.strftime("%Y-%m"), "label": start.strftime("%b %Y"), "collected": float(amount),
                     "payments": int(count), "failed_payments": int(failed)})
    return rows


def compute_overview(db: Session) -> dict:
    now = datetime.now(timezone.utc)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    total_gyms = db.scalar(select(func.count(Workspace.id))) or 0
    suspended_gyms = db.scalar(select(func.count(Workspace.id)).where(Workspace.is_active == False)) or 0

    status_counts = dict(db.execute(
        select(GymSubscription.status, func.count(GymSubscription.id)).group_by(GymSubscription.status)
    ).all())
    status_counts = {_status(k): v for k, v in status_counts.items()}
    trial_gyms = status_counts.get(SubscriptionStatus.TRIALING.value, 0)
    paid_gyms = sum(status_counts.get(s, 0) for s in PAID_STATUSES)

    mrr = 0.0
    for sub, plan in db.execute(
        select(GymSubscription, SubscriptionPlan).join(SubscriptionPlan, SubscriptionPlan.id == GymSubscription.plan_id)
        .where(GymSubscription.status.in_(PAID_STATUSES))
    ).all():
        mrr += subscription_mrr(sub, plan)

    since = _naive(now - timedelta(days=30))
    failed_count, failed_amount = db.execute(
        select(func.count(SubscriptionPayment.id), func.coalesce(func.sum(SubscriptionPayment.amount), 0.0))
        .where(SubscriptionPayment.status == PaymentStatus.FAILED, SubscriptionPayment.created_at >= since)
    ).one()

    revenue = revenue_by_month(db, 2, now)
    last, this = revenue[0]["collected"], revenue[1]["collected"]
    growth = round(((this - last) / last) * 100.0, 1) if last > 0 else 0.0

    months = _month_starts(now, 6)
    health = database_health(db)
    recent = db.scalars(
        select(AuditLog).where(AuditLog.workspace_id == "platform").order_by(AuditLog.created_at.desc()).limit(8)
    ).all()

    return {
        "total_gyms": total_gyms,
        "active_gyms": total_gyms - suspended_gyms,
        "suspended_gyms": suspended_gyms,
        "trial_gyms": trial_gyms,
        "paid_gyms": paid_gyms,
        "total_members": db.scalar(select(func.count(Member.id))) or 0,
        "total_trainers": db.scalar(select(func.count(Trainer.id))) or 0,
        "monthly_revenue": round(mrr, 2),
        "failed_payments_amount": float(failed_amount),
        "failed_payments_count": int(failed_count),
        "system_alerts": int(failed_count) + (0 if health["status"] == "HEALTHY" else 1),
        "new_gyms_this_month": db.scalar(select(func.count(Workspace.id)).where(Workspace.created_at >= _naive(month_start))) or 0,
        "new_users_this_month": db.scalar(select(func.count(User.id)).where(User.created_at >= _naive(month_start))) or 0,
        "mrr_growth_pct": growth,
        "system_health": "Operational" if health["status"] == "HEALTHY" else "Degraded",
        "gym_growth_chart": _cumulative_by_month(db, Workspace.created_at, months),
        "member_growth_chart": _cumulative_by_month(db, Member.created_at, months),
        "recent_activities": [
            {
                "id": a.id,
                "type": (a.resource_type or "admin"),
                "title": a.action.replace("_", " ").title(),
                "subtitle": (a.details or "")[:160],
                "timestamp": a.created_at.replace(tzinfo=timezone.utc).isoformat() if a.created_at else "",
            }
            for a in recent
        ],
        "subscription_status_breakdown": status_counts,
    }


def cached_overview(db: Session) -> dict:
    return cache.get_or_set("platform:overview", settings.PLATFORM_OVERVIEW_CACHE_SECONDS, lambda: compute_overview(db))


def database_health(db: Session) -> dict:
    started = time.perf_counter()
    try:
        db.execute(text("SELECT 1"))
        return {"status": "HEALTHY", "latency_ms": round((time.perf_counter() - started) * 1000, 2), "error": None}
    except Exception as exc:  # report, don't raise: health pages must render when the DB is down
        return {"status": "DOWN", "latency_ms": None, "error": type(exc).__name__}


def workspace_rows(
    db: Session, status_filter: Optional[str] = None, q: Optional[str] = None, limit: int = 100, offset: int = 0,
) -> tuple[list[dict], int]:
    """Tenant list with plan, subscription status, MRR, usage and last activity in a fixed number of queries."""
    query = select(Workspace)
    if status_filter == "active":
        query = query.where(Workspace.is_active == True)
    elif status_filter == "suspended":
        query = query.where(Workspace.is_active == False)
    elif status_filter == "trial":
        query = query.join(GymSubscription, GymSubscription.workspace_id == Workspace.id).where(
            GymSubscription.status == SubscriptionStatus.TRIALING.value)
    if q:
        like = f"%{q.lower()}%"
        query = query.where(func.lower(Workspace.name).like(like) | func.lower(Workspace.slug).like(like))
    total = db.scalar(select(func.count()).select_from(query.subquery())) or 0
    workspaces = db.scalars(query.order_by(Workspace.created_at.desc()).offset(offset).limit(limit)).all()
    ids = [w.id for w in workspaces]
    if not ids:
        return [], total

    def grouped(column, *where):
        return dict(db.execute(select(column, func.count()).where(column.in_(ids), *where).group_by(column)).all())

    members = grouped(Member.workspace_id)
    trainers = grouped(Trainer.workspace_id)
    staff = grouped(WorkspaceMember.workspace_id, WorkspaceMember.is_active == True,
                    WorkspaceMember.role.in_((UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)))
    last_activity = dict(db.execute(
        select(AuditLog.workspace_id, func.max(AuditLog.created_at)).where(AuditLog.workspace_id.in_(ids))
        .group_by(AuditLog.workspace_id)).all())
    owners = {}
    for wm, user in db.execute(
        select(WorkspaceMember, User).join(User, User.id == WorkspaceMember.user_id)
        .where(WorkspaceMember.workspace_id.in_(ids), WorkspaceMember.role == UserRole.OWNER)
    ).all():
        owners.setdefault(wm.workspace_id, user)
    subs = {s.workspace_id: (s, p) for s, p in db.execute(
        select(GymSubscription, SubscriptionPlan).join(SubscriptionPlan, SubscriptionPlan.id == GymSubscription.plan_id)
        .where(GymSubscription.workspace_id.in_(ids))).all()}

    rows = []
    for w in workspaces:
        owner = owners.get(w.id)
        sub, plan = subs.get(w.id, (None, None))
        sub_status = _status(sub.status) if sub else "no_subscription"
        last = last_activity.get(w.id)
        rows.append({
            "id": w.id, "name": w.name, "slug": w.slug,
            "email": w.email or (owner.email if owner else None), "phone": w.phone,
            "city": w.city, "gym_type": w.gym_type,
            "plan": plan.name if plan else "None",
            "plan_code": plan.code if plan else None,
            "subscription_status": sub_status,
            "mrr": subscription_mrr(sub, plan) if sub else 0.0,
            "last_active": last.replace(tzinfo=timezone.utc).isoformat() if last else "No recorded activity",
            "is_active": bool(w.is_active) if w.is_active is not None else True,
            "onboarding_completed": bool(w.onboarding_completed) if w.onboarding_completed is not None else True,
            "created_at": w.created_at,
            "owner_name": owner.full_name if owner else "Unassigned",
            "owner_email": owner.email if owner else None,
            "members_count": members.get(w.id, 0),
            "trainers_count": trainers.get(w.id, 0),
            "staff_count": staff.get(w.id, 0),
            "is_complimentary": bool(sub.is_complimentary) if sub else False,
            "trial_ends_at": (sub.trial_ends_at or sub.trial_end) if sub else None,
        })
    return rows, total
