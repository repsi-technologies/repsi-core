"""
Membership period lifecycle.

States of a Membership row (MemberStatus values):
  active    — valid between start_date and end_date ("scheduled" when start_date is in the future)
  frozen    — paused; end_date is pushed out by the frozen days on resume
  expired   — end_date passed (terminal for this period)
  cancelled — ended early by staff (terminal for this period)

Transitions:
  active  -> frozen     freeze (starting today) — a future freeze is stored and applied by the daily run
  frozen  -> active     unfreeze / automatic resume at freeze end; end_date += days actually frozen
  active|frozen|expired -> active   extend (expired periods reactivate only if the new end is not in the past)
  active|frozen -> cancelled
  active  -> expired    daily run when end_date < today
Renewal never edits the old period; it creates a new Membership row.

All dates use the workspace's timezone for "today". Every change appends a MembershipEvent.
Functions here flush but never commit; callers own the transaction.
"""
import calendar
import json
import logging
from datetime import date, datetime, timedelta, timezone
from typing import Optional
from zoneinfo import ZoneInfo

from fastapi import HTTPException, status as http_status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.finance import Payment, PaymentStatus
from app.models.member import Member, Membership, MembershipPlan, MemberStatus
from app.models.member_records import MembershipEvent, MembershipFreeze
from app.models.user import Workspace

logger = logging.getLogger(__name__)

RENEWAL_MODES = ("after_current", "immediate")


def _conflict(detail: str) -> HTTPException:
    return HTTPException(status_code=http_status.HTTP_409_CONFLICT, detail=detail)


def _invalid(detail: str) -> HTTPException:
    return HTTPException(status_code=http_status.HTTP_422_UNPROCESSABLE_CONTENT, detail=detail)


def add_months(start: date, months: int) -> date:
    """Calendar month arithmetic, clamping to the last day of shorter months (Jan 31 + 1 = Feb 28/29)."""
    month_index = start.month - 1 + months
    year = start.year + month_index // 12
    month = month_index % 12 + 1
    day = min(start.day, calendar.monthrange(year, month)[1])
    return date(year, month, day)


def period_end(start: date, duration_months: int) -> date:
    """Last valid day of a period that starts on `start` and lasts `duration_months` months.
    Jan 15 + 1 month -> Feb 14. When the target month is shorter (Jan 31 -> Feb), the period
    runs to the end of that month instead of losing a day."""
    target = add_months(start, max(1, duration_months))
    if target.day < start.day:
        return target
    return target - timedelta(days=1)


def workspace_today(db: Session, workspace_id: str) -> date:
    ws = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    tz_name = (ws.timezone if ws else None) or settings.DEFAULT_TIMEZONE
    try:
        return datetime.now(ZoneInfo(tz_name)).date()
    except Exception:
        return datetime.now(timezone.utc).date()


def effective_status(membership: Membership, today: date) -> str:
    if membership.status == MemberStatus.ACTIVE:
        if membership.start_date > today:
            return "scheduled"
        if membership.end_date < today:
            return "expired"
    return membership.status.value


def record_event(
    db: Session,
    membership: Membership,
    event_type: str,
    actor_user_id: Optional[str],
    *,
    from_status: Optional[MemberStatus] = None,
    to_status: Optional[MemberStatus] = None,
    previous_end_date: Optional[date] = None,
    new_end_date: Optional[date] = None,
    reason: Optional[str] = None,
    details: Optional[dict] = None,
) -> MembershipEvent:
    event = MembershipEvent(
        workspace_id=membership.workspace_id,
        membership_id=membership.id,
        member_id=membership.member_id,
        actor_user_id=actor_user_id,
        event_type=event_type,
        from_status=from_status.value if from_status else None,
        to_status=to_status.value if to_status else None,
        previous_end_date=previous_end_date,
        new_end_date=new_end_date,
        reason=reason,
        details=json.dumps(details, default=str) if details else None,
    )
    db.add(event)
    return event


def open_freeze(db: Session, membership: Membership) -> Optional[MembershipFreeze]:
    return (
        db.query(MembershipFreeze)
        .filter(
            MembershipFreeze.workspace_id == membership.workspace_id,
            MembershipFreeze.membership_id == membership.id,
            MembershipFreeze.resumed_at.is_(None),
        )
        .order_by(MembershipFreeze.start_date.asc())
        .first()
    )


def used_freeze_days(db: Session, membership: Membership) -> int:
    freezes = db.query(MembershipFreeze).filter(
        MembershipFreeze.workspace_id == membership.workspace_id,
        MembershipFreeze.membership_id == membership.id,
    ).all()
    total = 0
    for f in freezes:
        total += f.days_frozen if f.days_frozen is not None else (f.end_date - f.start_date).days
    return total


def amount_paid(db: Session, membership: Membership) -> float:
    rows = db.query(Payment).filter(
        Payment.workspace_id == membership.workspace_id,
        Payment.membership_id == membership.id,
        Payment.status == PaymentStatus.SUCCESS,
    ).all()
    return round(sum(p.amount for p in rows), 2)


def has_overlapping_period(db: Session, member_id: str, workspace_id: str, start: date, end: date,
                           exclude_id: Optional[str] = None) -> bool:
    q = db.query(Membership).filter(
        Membership.workspace_id == workspace_id,
        Membership.member_id == member_id,
        Membership.status.in_([MemberStatus.ACTIVE, MemberStatus.FROZEN]),
        Membership.start_date <= end,
        Membership.end_date >= start,
    )
    if exclude_id:
        q = q.filter(Membership.id != exclude_id)
    return db.query(q.exists()).scalar()


def assign_membership(
    db: Session,
    member: Member,
    plan: MembershipPlan,
    start: date,
    price: float,
    actor_user_id: Optional[str],
    *,
    auto_renew: bool = False,
    event_type: str = "assigned",
    details: Optional[dict] = None,
) -> Membership:
    if not plan.is_active:
        raise _conflict(f"Plan '{plan.name}' is not available for new memberships.")
    if price < 0:
        raise _invalid("Price cannot be negative.")
    end = period_end(start, plan.duration_months)
    if has_overlapping_period(db, member.id, member.workspace_id, start, end):
        raise _conflict("This member already has an active or frozen membership covering these dates.")

    membership = Membership(
        workspace_id=member.workspace_id,
        member_id=member.id,
        plan_id=plan.id,
        start_date=start,
        end_date=end,
        status=MemberStatus.ACTIVE,
        price_paid=price,
        auto_renew=auto_renew,
    )
    db.add(membership)
    db.flush()
    record_event(
        db, membership, event_type, actor_user_id,
        to_status=MemberStatus.ACTIVE, new_end_date=end,
        details={
            "plan_id": plan.id,
            "plan_name": plan.name,
            "duration_months": plan.duration_months,
            "list_price": plan.price,
            "price": price,
            "start_date": start.isoformat(),
            **(details or {}),
        },
    )
    _notify(db, member, "membership_renewed" if event_type == "renewed" else "membership_assigned", membership, plan)
    return membership


def _notify(db: Session, member: Optional[Member], event: str, membership: Membership,
            plan: Optional[MembershipPlan] = None, **extra) -> None:
    from app.services.notify import safe_notify

    if member is None:
        member = db.get(Member, membership.member_id)
    plan = plan or db.get(MembershipPlan, membership.plan_id)
    safe_notify(db, member, event, f"{membership.id}:{membership.end_date.isoformat()}", variables={
        "plan_name": plan.name if plan else "membership",
        "start_date": membership.start_date.strftime("%d %b %Y"),
        "end_date": membership.end_date.strftime("%d %b %Y"),
        **extra,
    })


def renew_membership(
    db: Session,
    membership: Membership,
    plan: MembershipPlan,
    mode: str,
    price: Optional[float],
    actor_user_id: Optional[str],
    today: date,
) -> Membership:
    """Creates the next period. `after_current` starts the day after the current end (or today if that's past);
    `immediate` starts today and closes the current period as of yesterday."""
    if mode not in RENEWAL_MODES:
        raise _invalid(f"Renewal mode must be one of: {', '.join(RENEWAL_MODES)}.")
    if membership.status == MemberStatus.CANCELLED:
        raise _conflict("A cancelled membership cannot be renewed. Assign a new membership instead.")
    if membership.status == MemberStatus.FROZEN:
        raise _conflict("Unfreeze the membership before renewing it.")

    member = db.query(Member).filter(
        Member.workspace_id == membership.workspace_id, Member.id == membership.member_id
    ).first()

    if mode == "after_current":
        start = max(membership.end_date + timedelta(days=1), today)
    else:
        start = today
        if membership.status == MemberStatus.ACTIVE and membership.end_date >= today:
            previous_end = membership.end_date
            membership.end_date = max(membership.start_date, today - timedelta(days=1))
            membership.status = MemberStatus.EXPIRED
            record_event(
                db, membership, "closed_for_renewal", actor_user_id,
                from_status=MemberStatus.ACTIVE, to_status=MemberStatus.EXPIRED,
                previous_end_date=previous_end, new_end_date=membership.end_date,
            )
            db.flush()

    return assign_membership(
        db, member, plan, start, plan.price if price is None else price, actor_user_id,
        auto_renew=membership.auto_renew, event_type="renewed",
        details={"renewal_mode": mode, "renewed_from": membership.id},
    )


def freeze_membership(
    db: Session,
    membership: Membership,
    start: date,
    end: date,
    reason: Optional[str],
    actor_user_id: Optional[str],
    today: date,
) -> MembershipFreeze:
    if membership.status != MemberStatus.ACTIVE:
        raise _conflict(f"Only active memberships can be frozen (current: {membership.status.value}).")
    if start < today:
        raise _invalid("Freeze cannot start in the past.")
    if end <= start:
        raise _invalid("Freeze end date must be after the start date.")
    if start < membership.start_date or start > membership.end_date:
        raise _invalid("Freeze must start within the membership period.")
    if open_freeze(db, membership):
        raise _conflict("This membership already has a scheduled or active freeze.")
    requested = (end - start).days
    remaining = settings.MEMBERSHIP_MAX_FREEZE_DAYS - used_freeze_days(db, membership)
    if requested > remaining:
        raise _conflict(f"Freeze exceeds the allowance. {max(0, remaining)} freeze day(s) remain for this membership.")

    freeze = MembershipFreeze(
        workspace_id=membership.workspace_id,
        membership_id=membership.id,
        start_date=start,
        end_date=end,
        reason=(reason or "").strip() or None,
        created_by_user_id=actor_user_id,
    )
    db.add(freeze)
    to_status = MemberStatus.ACTIVE
    if start <= today:
        membership.status = MemberStatus.FROZEN
        to_status = MemberStatus.FROZEN
    record_event(
        db, membership, "frozen" if start <= today else "freeze_scheduled", actor_user_id,
        from_status=MemberStatus.ACTIVE, to_status=to_status, reason=freeze.reason,
        details={"freeze_start": start.isoformat(), "freeze_end": end.isoformat()},
    )
    db.flush()
    from app.services.notify import safe_notify
    safe_notify(db, db.get(Member, membership.member_id), "membership_frozen", freeze.id,
                variables={"start_date": start.strftime("%d %b %Y"), "end_date": end.strftime("%d %b %Y")})
    return freeze


def unfreeze_membership(
    db: Session,
    membership: Membership,
    actor_user_id: Optional[str],
    today: date,
    *,
    automatic: bool = False,
) -> Membership:
    freeze = open_freeze(db, membership)
    if not freeze:
        raise _conflict("This membership has no active or scheduled freeze.")

    if freeze.start_date > today:
        # Scheduled freeze withdrawn before it began.
        freeze.days_frozen = 0
        freeze.resumed_at = datetime.now(timezone.utc)
        record_event(db, membership, "freeze_cancelled", actor_user_id,
                     from_status=membership.status, to_status=membership.status,
                     details={"freeze_id": freeze.id})
        db.flush()
        return membership

    resume_on = min(today, freeze.end_date)
    days = max(0, (resume_on - freeze.start_date).days)
    previous_end = membership.end_date
    membership.end_date = membership.end_date + timedelta(days=days)
    from_status = membership.status
    membership.status = MemberStatus.ACTIVE
    freeze.days_frozen = days
    freeze.resumed_at = datetime.now(timezone.utc)
    record_event(
        db, membership, "auto_resumed" if automatic else "unfrozen", actor_user_id,
        from_status=from_status, to_status=MemberStatus.ACTIVE,
        previous_end_date=previous_end, new_end_date=membership.end_date,
        details={"freeze_id": freeze.id, "days_frozen": days},
    )
    db.flush()
    _notify(db, None, "membership_unfrozen", membership)
    return membership


def extend_membership(
    db: Session,
    membership: Membership,
    days: int,
    reason: str,
    actor_user_id: Optional[str],
    today: date,
) -> Membership:
    if membership.status not in (MemberStatus.ACTIVE, MemberStatus.FROZEN, MemberStatus.EXPIRED):
        raise _conflict(f"A {membership.status.value} membership cannot be extended.")
    if days < 1 or days > settings.MEMBERSHIP_MAX_EXTENSION_DAYS:
        raise _invalid(f"Extension must be between 1 and {settings.MEMBERSHIP_MAX_EXTENSION_DAYS} days.")
    if not (reason or "").strip():
        raise _invalid("A reason is required for extensions.")

    previous_end = membership.end_date
    new_end = previous_end + timedelta(days=days)
    from_status = membership.status
    if from_status == MemberStatus.EXPIRED:
        if new_end < today:
            raise _conflict("The extended end date would still be in the past. Renew the membership instead.")
        if has_overlapping_period(db, membership.member_id, membership.workspace_id,
                                  membership.start_date, new_end, exclude_id=membership.id):
            raise _conflict("Extending would overlap another active membership.")
        membership.status = MemberStatus.ACTIVE
    membership.end_date = new_end
    record_event(
        db, membership, "extended", actor_user_id,
        from_status=from_status, to_status=membership.status,
        previous_end_date=previous_end, new_end_date=new_end, reason=reason.strip(),
        details={"days": days},
    )
    db.flush()
    _notify(db, None, "membership_extended", membership)
    return membership


def cancel_membership(
    db: Session,
    membership: Membership,
    reason: str,
    actor_user_id: Optional[str],
) -> Membership:
    if membership.status not in (MemberStatus.ACTIVE, MemberStatus.FROZEN):
        raise _conflict(f"A {membership.status.value} membership cannot be cancelled.")
    if not (reason or "").strip():
        raise _invalid("A reason is required to cancel a membership.")
    freeze = open_freeze(db, membership)
    if freeze:
        freeze.days_frozen = 0
        freeze.resumed_at = datetime.now(timezone.utc)
    from_status = membership.status
    membership.status = MemberStatus.CANCELLED
    record_event(db, membership, "cancelled", actor_user_id,
                 from_status=from_status, to_status=MemberStatus.CANCELLED, reason=reason.strip())
    db.flush()
    return membership


def run_due_transitions(db: Session, workspace_id: str, today: Optional[date] = None) -> dict:
    """Idempotent daily job for one workspace: start scheduled freezes, resume finished freezes,
    expire periods past their end date. Member account status is never changed here."""
    today = today or workspace_today(db, workspace_id)
    started = resumed = expired = 0

    freezes = db.query(MembershipFreeze).filter(
        MembershipFreeze.workspace_id == workspace_id,
        MembershipFreeze.resumed_at.is_(None),
        MembershipFreeze.start_date <= today,
    ).all()
    for freeze in freezes:
        membership = db.query(Membership).filter(
            Membership.workspace_id == workspace_id, Membership.id == freeze.membership_id
        ).first()
        if not membership:
            continue
        if membership.status == MemberStatus.ACTIVE and freeze.end_date > today:
            membership.status = MemberStatus.FROZEN
            record_event(db, membership, "frozen", None, from_status=MemberStatus.ACTIVE,
                         to_status=MemberStatus.FROZEN, details={"freeze_id": freeze.id, "scheduled": True})
            started += 1
        if freeze.end_date <= today and membership.status in (MemberStatus.FROZEN, MemberStatus.ACTIVE):
            unfreeze_membership(db, membership, None, today, automatic=True)
            resumed += 1

    overdue = db.query(Membership).filter(
        Membership.workspace_id == workspace_id,
        Membership.status == MemberStatus.ACTIVE,
        Membership.end_date < today,
    ).all()
    for membership in overdue:
        membership.status = MemberStatus.EXPIRED
        record_event(db, membership, "expired", None, from_status=MemberStatus.ACTIVE,
                     to_status=MemberStatus.EXPIRED, new_end_date=membership.end_date)
        expired += 1

    db.flush()
    return {"freezes_started": started, "freezes_resumed": resumed, "expired": expired, "run_date": today.isoformat()}


def run_all_workspaces() -> None:
    """Entry point for a scheduler (cron, Task Scheduler, platform job): `python -m app.services.membership_lifecycle`."""
    from app.core.database import SessionLocal

    db = SessionLocal()
    try:
        for (ws_id,) in db.query(Workspace.id).filter(Workspace.is_active.is_(True)).all():
            try:
                result = run_due_transitions(db, ws_id)
                db.commit()
                logger.info("Membership lifecycle run for %s: %s", ws_id, result)
            except Exception:
                db.rollback()
                logger.exception("Membership lifecycle run failed for workspace %s", ws_id)
    finally:
        db.close()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    run_all_workspaces()
