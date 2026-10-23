"""
Single source of truth for "may this member enter the gym right now?".

Used by every check-in path (manual desk check-in, staff scanning a member pass,
member self check-in at the entrance QR). Evaluation order, first failure wins:

  1. Account status   suspended / inactive / archived accounts are denied (not overridable —
                      change the account status instead). Legacy "frozen"/"cancelled" account
                      values written by older versions count as suspended.
  2. Membership       when `require_active_membership` is on, an active period must cover today
                      (start_date <= today <= end_date + expiry_grace_days). Frozen, cancelled,
                      expired, not-yet-started and missing memberships are denied.
  3. Overdue invoice  when `block_on_overdue_invoice` is on, a past-due unpaid invoice denies entry.
  4. Daily limit      `max_visits_per_day` (0 = unlimited) counted in the workspace's local day.
  5. Plan rules       the covering membership's plan `access_rules`: allowed weekdays, a daily
                      time window, allowed branches and a weekly visit limit.

A payment record never grants access by itself; only membership state does.
Rules 2–4 can be overridden by staff holding `attendance.override`, with a recorded reason.
"""
from dataclasses import dataclass, field
from datetime import date, datetime, time, timedelta, timezone
from typing import Optional
from zoneinfo import ZoneInfo

from sqlalchemy.orm import Session

from app.core.config import settings as app_settings
from app.models.attendance import Attendance, AttendanceSettings
from app.models.member import Member, Membership, MemberStatus
from app.models.user import Workspace


@dataclass
class AccessDecision:
    allowed: bool
    code: str
    reason: str  # staff-facing explanation
    overridable: bool = False
    membership_id: Optional[str] = None
    valid_until: Optional[date] = None
    warnings: list = field(default_factory=list)

    def as_dict(self) -> dict:
        return {
            "allowed": self.allowed,
            "code": self.code,
            "reason": self.reason,
            "overridable": self.overridable,
            "membership_id": self.membership_id,
            "valid_until": self.valid_until.isoformat() if self.valid_until else None,
            "warnings": self.warnings,
        }


# Generic text shown to members themselves (no billing/internal details).
MEMBER_FACING = {
    "ACCOUNT_SUSPENDED": "Your access is currently on hold. Please contact the front desk.",
    "ACCOUNT_INACTIVE": "Your account isn't active. Please contact the front desk.",
    "ACCOUNT_ARCHIVED": "Your account isn't active. Please contact the front desk.",
    "NO_MEMBERSHIP": "You don't have an active membership. Please contact the front desk.",
    "MEMBERSHIP_NOT_STARTED": "Your membership hasn't started yet.",
    "MEMBERSHIP_FROZEN": "Your membership is frozen. Please contact the front desk to resume it.",
    "MEMBERSHIP_CANCELLED": "Your membership has been cancelled. Please contact the front desk.",
    "MEMBERSHIP_EXPIRED": "Your membership has expired. Please renew at the front desk.",
    "OVERDUE_INVOICE": "There is an outstanding payment on your account. Please contact the front desk.",
    "PAYMENT_PENDING_REVIEW": "Your payment is awaiting confirmation by the gym.",
    "DAILY_LIMIT_REACHED": "You've reached today's visit limit.",
    "PLAN_DAY_NOT_ALLOWED": "Your plan doesn't include visits on this day.",
    "PLAN_TIME_NOT_ALLOWED": "Your plan doesn't include visits at this time.",
    "PLAN_BRANCH_NOT_ALLOWED": "Your plan doesn't include this branch.",
    "WEEKLY_LIMIT_REACHED": "You've reached this week's visit limit for your plan.",
    "TRAINER_INACTIVE": "Your trainer account isn't active.",
}


def workspace_tz(db: Session, workspace_id: str) -> ZoneInfo:
    ws = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    name = (ws.timezone if ws else None) or app_settings.DEFAULT_TIMEZONE
    try:
        return ZoneInfo(name)
    except Exception:
        return ZoneInfo("UTC")


def local_day_bounds_utc(tz: ZoneInfo, day: date) -> tuple[datetime, datetime]:
    """UTC [start, end) of a calendar day in the gym's timezone, as naive UTC (matches stored values)."""
    start = datetime.combine(day, time.min, tzinfo=tz).astimezone(timezone.utc).replace(tzinfo=None)
    end = datetime.combine(day + timedelta(days=1), time.min, tzinfo=tz).astimezone(timezone.utc).replace(tzinfo=None)
    return start, end


def _deny(code: str, reason: str, overridable: bool, **kw) -> AccessDecision:
    return AccessDecision(allowed=False, code=code, reason=reason, overridable=overridable, **kw)


def evaluate_member_access(
    db: Session,
    member: Member,
    rules: AttendanceSettings,
    now: Optional[datetime] = None,
    branch_id: Optional[str] = None,
) -> AccessDecision:
    tz = workspace_tz(db, member.workspace_id)
    now = now or datetime.now(timezone.utc)
    today = now.astimezone(tz).date()

    # 1. Account status
    if member.status in (MemberStatus.SUSPENDED, MemberStatus.FROZEN, MemberStatus.CANCELLED):
        return _deny("ACCOUNT_SUSPENDED", "Member account is suspended. Reactivate the account to allow entry.", False)
    if member.status == MemberStatus.INACTIVE:
        return _deny("ACCOUNT_INACTIVE", "Member account is inactive. Reactivate the account to allow entry.", False)
    if member.status == MemberStatus.ARCHIVED:
        return _deny("ACCOUNT_ARCHIVED", "Member is archived. Restore the account to allow entry.", False)

    decision = AccessDecision(allowed=True, code="OK", reason="Access permitted.")

    # 2. Membership validity
    periods = db.query(Membership).filter(
        Membership.workspace_id == member.workspace_id, Membership.member_id == member.id
    ).order_by(Membership.end_date.desc()).all()
    grace = timedelta(days=max(0, rules.expiry_grace_days or 0))

    covering_active = [p for p in periods if p.status == MemberStatus.ACTIVE and p.start_date <= today <= p.end_date]
    if covering_active:
        p = max(covering_active, key=lambda m: m.end_date)
        decision.membership_id, decision.valid_until = p.id, p.end_date
    elif rules.require_active_membership:
        frozen = [p for p in periods if p.status == MemberStatus.FROZEN and p.start_date <= today <= p.end_date]
        in_grace = [
            p for p in periods
            if p.status in (MemberStatus.ACTIVE, MemberStatus.EXPIRED) and p.end_date < today <= p.end_date + grace
        ]
        upcoming = [p for p in periods if p.status == MemberStatus.ACTIVE and p.start_date > today]
        if frozen:
            p = frozen[0]
            return _deny("MEMBERSHIP_FROZEN", "Membership is frozen. Resume it from the member's Membership tab.", True,
                         membership_id=p.id, valid_until=p.end_date)
        if in_grace:
            p = in_grace[0]
            decision.membership_id, decision.valid_until = p.id, p.end_date
            decision.code = "GRACE_PERIOD"
            decision.reason = f"Membership ended {p.end_date.isoformat()}; entry allowed within the grace period."
            decision.warnings.append("grace_period")
        elif upcoming:
            p = min(upcoming, key=lambda m: m.start_date)
            return _deny("MEMBERSHIP_NOT_STARTED", f"Membership starts on {p.start_date.isoformat()}.", True,
                         membership_id=p.id, valid_until=p.end_date)
        elif periods and periods[0].status == MemberStatus.CANCELLED:
            return _deny("MEMBERSHIP_CANCELLED", "Latest membership was cancelled.", True, membership_id=periods[0].id)
        elif periods:
            p = periods[0]
            return _deny("MEMBERSHIP_EXPIRED", f"Membership expired on {p.end_date.isoformat()}.", True,
                         membership_id=p.id, valid_until=p.end_date)
        else:
            return _deny("NO_MEMBERSHIP", "Member has no membership. Assign a plan to allow entry.", True)

    # 3. Overdue invoices
    if rules.block_on_overdue_invoice:
        from app.models.finance import Invoice
        from app.models.payment_settings import ManualPaymentSubmission, SubmissionStatus

        unpaid = db.query(Invoice).filter(
            Invoice.workspace_id == member.workspace_id,
            Invoice.member_id == member.id,
            Invoice.status.in_(["pending", "unpaid"]),
            Invoice.due_date < today,
        ).first()
        if unpaid:
            pending = db.query(ManualPaymentSubmission).filter(
                ManualPaymentSubmission.workspace_id == member.workspace_id,
                ManualPaymentSubmission.member_id == member.id,
                ManualPaymentSubmission.invoice_id == unpaid.id,
                ManualPaymentSubmission.status == SubmissionStatus.PENDING_REVIEW.value,
            ).first()
            if pending:
                return _deny("PAYMENT_PENDING_REVIEW",
                             f"Payment proof for invoice #{unpaid.invoice_number} is awaiting review.", True,
                             membership_id=decision.membership_id, valid_until=decision.valid_until)
            return _deny("OVERDUE_INVOICE",
                         f"Invoice #{unpaid.invoice_number} ({unpaid.total_amount:,.2f}) is overdue.", True,
                         membership_id=decision.membership_id, valid_until=decision.valid_until)

    # 4. Daily visit limit
    if rules.max_visits_per_day and rules.max_visits_per_day > 0:
        start, end = local_day_bounds_utc(tz, today)
        visits = db.query(Attendance).filter(
            Attendance.workspace_id == member.workspace_id,
            Attendance.member_id == member.id,
            Attendance.check_in_time >= start,
            Attendance.check_in_time < end,
        ).count()
        if visits >= rules.max_visits_per_day:
            return _deny("DAILY_LIMIT_REACHED", f"Daily limit of {rules.max_visits_per_day} visit(s) reached.", True,
                         membership_id=decision.membership_id, valid_until=decision.valid_until)

    # 5. Plan access rules
    plan_denial = _plan_rule_denial(db, member, decision, tz, now, branch_id)
    if plan_denial is not None:
        return plan_denial

    return decision


def _plan_rule_denial(db: Session, member: Member, decision: AccessDecision, tz: ZoneInfo, now: datetime,
                      branch_id: Optional[str]) -> Optional[AccessDecision]:
    import json

    from app.models.member import MembershipPlan

    if not decision.membership_id:
        return None
    membership = db.get(Membership, decision.membership_id)
    plan = db.get(MembershipPlan, membership.plan_id) if membership else None
    if plan is None or not plan.access_rules:
        return None
    try:
        rules = json.loads(plan.access_rules) or {}
    except ValueError:
        return None
    local = now.astimezone(tz)
    extra = {"membership_id": decision.membership_id, "valid_until": decision.valid_until}
    weekdays = rules.get("weekdays")
    if weekdays and local.weekday() not in weekdays:
        names = ", ".join(("Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun")[d] for d in sorted(weekdays))
        return _deny("PLAN_DAY_NOT_ALLOWED", f"The {plan.name} plan allows visits on {names} only.", True, **extra)
    start, end = rules.get("start_time"), rules.get("end_time")
    hhmm = local.strftime("%H:%M")
    if (start and hhmm < start) or (end and hhmm >= end):
        return _deny("PLAN_TIME_NOT_ALLOWED",
                     f"The {plan.name} plan allows visits {start or '00:00'}–{end or '24:00'} only.", True, **extra)
    branches = rules.get("branch_ids")
    if branches and branch_id and branch_id not in branches:
        return _deny("PLAN_BRANCH_NOT_ALLOWED", f"The {plan.name} plan doesn't include this branch.", True, **extra)
    weekly = rules.get("max_visits_per_week")
    if weekly:
        week_start_day = local.date() - timedelta(days=local.weekday())
        start_utc, _ = local_day_bounds_utc(tz, week_start_day)
        visits = db.query(Attendance).filter(
            Attendance.workspace_id == member.workspace_id,
            Attendance.member_id == member.id,
            Attendance.check_in_time >= start_utc,
        ).count()
        if visits >= weekly:
            return _deny("WEEKLY_LIMIT_REACHED", f"The {plan.name} plan allows {weekly} visit(s) per week.", True, **extra)
    return None
