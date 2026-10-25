"""SaaS billing foundation: calendar math, invoice numbering and the existing-gym backfill.

Rules and states: docs/payments/stage-1-plan.md. Money is integer minor units throughout.
"""
import calendar
from datetime import datetime, timedelta, timezone
from typing import Optional
from zoneinfo import ZoneInfo

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.billing import GymSubscription
from app.models.saas import SaasAudit, SaasInvoiceCounter, SaasPlan, SaasSubscription
from app.models.user import UserRole, Workspace, WorkspaceMember

INDIA = ZoneInfo("Asia/Kolkata")
INVOICE_PREFIX = "RP"
GRANDFATHER_DAYS = 60
GRANDFATHER_PLAN_CODE = "growth"


def as_utc(dt: Optional[datetime]) -> Optional[datetime]:
    """Legacy columns are naive UTC; new ones are aware. Compare everything as aware UTC."""
    if dt is None:
        return None
    return dt.replace(tzinfo=timezone.utc) if dt.tzinfo is None else dt.astimezone(timezone.utc)


def add_months(dt: datetime, months: int) -> datetime:
    """Calendar months with end-of-month clamping: Jan 31 + 1 month = Feb 28/29."""
    index = dt.month - 1 + months
    year, month = dt.year + index // 12, index % 12 + 1
    return dt.replace(year=year, month=month, day=min(dt.day, calendar.monthrange(year, month)[1]))


def fiscal_year(moment: datetime) -> str:
    """Indian financial year (April–March) of `moment`, as "26-27"."""
    local = as_utc(moment).astimezone(INDIA)
    start = local.year if local.month >= 4 else local.year - 1
    return f"{start % 100:02d}-{(start + 1) % 100:02d}"


def allocate_invoice_number(db: Session, issued_at: datetime) -> tuple[str, str, int]:
    """Next gap-free number for the financial year, e.g. ("RP/26-27/000001", "26-27", 1).

    The counter row is locked (SELECT … FOR UPDATE on Postgres) until the caller's transaction ends,
    so concurrent invoices serialise. Call it in the same transaction that inserts the invoice.
    """
    fy = fiscal_year(issued_at)
    counter = db.query(SaasInvoiceCounter).filter_by(fiscal_year=fy).with_for_update().first()
    if counter is None:
        try:
            with db.begin_nested():
                db.add(SaasInvoiceCounter(fiscal_year=fy, last_sequence=0))
        except IntegrityError:
            pass  # another transaction created it first
        counter = db.query(SaasInvoiceCounter).filter_by(fiscal_year=fy).with_for_update().one()
    counter.last_sequence += 1
    db.flush()
    seq = counter.last_sequence
    if seq > 999999:
        raise RuntimeError(f"Invoice sequence exhausted for FY {fy}.")
    return f"{INVOICE_PREFIX}/{fy}/{seq:06d}", fy, seq


def _plan_for_legacy(db: Session, legacy: Optional[GymSubscription], fallback: SaasPlan) -> SaasPlan:
    code = legacy.plan.code if legacy is not None and getattr(legacy, "plan", None) else None
    return (db.query(SaasPlan).filter_by(code=code).first() if code else None) or fallback


def _owner_user_id(db: Session, workspace_id: str) -> Optional[str]:
    row = (
        db.query(WorkspaceMember.user_id)
        .filter(WorkspaceMember.workspace_id == workspace_id, WorkspaceMember.role == UserRole.OWNER)
        .order_by(WorkspaceMember.created_at)
        .first()
    )
    return row[0] if row else None


def plan_backfill_row(
    legacy: Optional[GymSubscription], launch_at: datetime, now: datetime
) -> dict:
    """Decide one existing workspace's starting subscription. Never charges; never shortens access.

    - suspended → stays suspended
    - live complimentary → active, complimentary, paid_until = complimentary_until
    - admin-set active/grace with a future period end → active until that period end
    - everything else (trialing, expired, cancelled, no row) → trialing on Growth until
      launch + 60 days, or the legacy trial end if that is later
    """
    grandfather_until = as_utc(launch_at) + timedelta(days=GRANDFATHER_DAYS)
    status = (legacy.status or "").lower() if legacy is not None else ""
    if status == "suspended":
        return {"status": "suspended", "trial_ends_at": grandfather_until, "rule": "suspended"}
    if legacy is not None and legacy.is_complimentary:
        until = as_utc(legacy.complimentary_until)
        if until is None or until > now:
            return {"status": "active", "paid_until": until, "is_complimentary": True, "rule": "complimentary"}
    period_end = as_utc(legacy.current_period_end) if legacy is not None else None
    if status in ("active", "grace_period") and period_end and period_end > now:
        return {"status": "active", "paid_until": period_end, "billing_cycle": legacy.billing_cycle, "rule": "paid"}
    legacy_trial_end = as_utc(legacy.trial_ends_at or legacy.trial_end) if legacy is not None else None
    trial_end = max(grandfather_until, legacy_trial_end) if legacy_trial_end else grandfather_until
    return {"status": "trialing", "trial_ends_at": trial_end, "rule": "grandfathered_trial", "force_growth": True}


def backfill_subscriptions(
    db: Session, launch_at: datetime, now: Optional[datetime] = None, dry_run: bool = True
) -> dict:
    """Give every workspace without a saas_subscription one, per `plan_backfill_row`. Safe to repeat."""
    now = as_utc(now) or datetime.now(timezone.utc)
    growth = db.query(SaasPlan).filter_by(code=GRANDFATHER_PLAN_CODE).first()
    if growth is None:
        raise RuntimeError("saas_plan 'growth' is missing; run the plan sync before the backfill.")

    existing = {ws_id for (ws_id,) in db.query(SaasSubscription.workspace_id)}
    rows, counts = [], {"skipped_existing": 0}
    for ws in db.query(Workspace).order_by(Workspace.created_at):
        if ws.id in existing:
            counts["skipped_existing"] += 1
            continue
        legacy = (
            db.query(GymSubscription).filter_by(workspace_id=ws.id)
            .order_by(GymSubscription.created_at.desc()).first()
        )
        decision = plan_backfill_row(legacy, launch_at, now)
        plan = growth if decision.pop("force_growth", False) else _plan_for_legacy(db, legacy, growth)
        rule = decision.pop("rule")
        counts[rule] = counts.get(rule, 0) + 1
        cycle = decision.pop("billing_cycle", None)
        rows.append({"workspace_id": ws.id, "plan": plan.code, "rule": rule, **{
            k: (v.isoformat() if isinstance(v, datetime) else v) for k, v in decision.items()}})
        if dry_run:
            continue
        sub = SaasSubscription(
            workspace_id=ws.id,
            plan_id=plan.id,
            billing_cycle=cycle if cycle in ("monthly", "quarterly", "half_yearly", "annual") else None,
            currency="INR",
            is_grandfathered=True,
            trial_started_at=now if decision["status"] == "trialing" else None,
            trial_owner_user_id=_owner_user_id(db, ws.id),
            legacy_subscription_id=legacy.id if legacy is not None else None,
            **decision,
        )
        db.add(sub)
        db.flush()
        db.add(SaasAudit(
            workspace_id=ws.id, entity="subscription", entity_id=sub.id, action="backfill",
            from_state=(legacy.status if legacy is not None else None), to_state=sub.status,
            actor="system", reason=f"Existing-gym backfill: {rule}.", meta={"plan": plan.code},
        ))
    if dry_run:
        db.rollback()
    else:
        db.commit()
    return {"dry_run": dry_run, "counts": counts, "rows": rows}
