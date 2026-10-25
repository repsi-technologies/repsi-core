"""SaaS billing foundation: calendar math, invoice numbering and the existing-gym backfill.

Rules and states: docs/payments/stage-1-plan.md. Money is integer minor units throughout.
"""
import calendar
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional
from zoneinfo import ZoneInfo

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.billing import GymSubscription
from app.models.saas import SaasAudit, SaasEntitlement, SaasInvoiceCounter, SaasPlan, SaasPlanPrice, SaasSubscription
from app.models.user import UserRole, Workspace, WorkspaceMember

logger = logging.getLogger(__name__)
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


# --- plan catalogue sync ------------------------------------------------------------------------

def sync_catalog(db: Session) -> dict:
    """Upsert plans, prices and entitlements from app/core/saas_catalog.py by stable codes. Safe to repeat.

    Never touches subscriptions, orders, invoices or founder overrides. Plans dropped from the catalogue
    are deactivated, never deleted (subscriptions keep pointing at them).
    """
    from app.core import saas_catalog as cat

    report = {"plans_created": 0, "plans_updated": 0, "prices_created": 0, "prices_updated": 0,
              "entitlements_created": 0, "entitlements_updated": 0, "plans_deactivated": 0}
    for code, (name, rank, public) in cat.PLANS.items():
        plan = db.query(SaasPlan).filter_by(code=code).first()
        if plan is None:
            plan = SaasPlan(code=code, name=name, rank=rank, is_public=public, is_active=True)
            db.add(plan)
            db.flush()
            report["plans_created"] += 1
        elif (plan.name, plan.rank, plan.is_public, plan.is_active) != (name, rank, public, True):
            plan.name, plan.rank, plan.is_public, plan.is_active = name, rank, public, True
            report["plans_updated"] += 1

        for cycle, months, currency, amount in cat.PRICES.get(code, []):
            enabled = currency in cat.ENABLED_CURRENCIES
            row = db.query(SaasPlanPrice).filter_by(plan_id=plan.id, billing_cycle=cycle, currency=currency).first()
            if row is None:
                db.add(SaasPlanPrice(plan_id=plan.id, billing_cycle=cycle, period_months=months, currency=currency,
                                     amount_minor=amount, is_enabled=enabled))
                report["prices_created"] += 1
            elif (row.period_months, row.amount_minor, row.is_enabled) != (months, amount, enabled):
                row.period_months, row.amount_minor, row.is_enabled = months, amount, enabled
                report["prices_updated"] += 1

        wanted = {k: ("limit", None, v) for k, v in cat.LIMITS.get(code, {}).items()}
        wanted.update({k: ("feature", code in plans, None) for k, plans in cat.FEATURE_PLANS.items()})
        for key, (kind, bool_value, int_value) in wanted.items():
            ent = db.query(SaasEntitlement).filter_by(plan_id=plan.id, key=key).first()
            if ent is None:
                db.add(SaasEntitlement(plan_id=plan.id, key=key, kind=kind, bool_value=bool_value, int_value=int_value))
                report["entitlements_created"] += 1
            elif (ent.kind, ent.bool_value, ent.int_value) != (kind, bool_value, int_value):
                ent.kind, ent.bool_value, ent.int_value = kind, bool_value, int_value
                report["entitlements_updated"] += 1

    for plan in db.query(SaasPlan).filter(SaasPlan.code.notin_(list(cat.PLANS)), SaasPlan.is_active.is_(True)):
        plan.is_active = False
        report["plans_deactivated"] += 1
    db.commit()
    return report


# --- errors, audit, state machines ----------------------------------------------------------------

class BillingError(Exception):
    def __init__(self, status_code: int, code: str, message: str):
        super().__init__(message)
        self.status_code, self.code, self.message = status_code, code, message


class IllegalTransition(BillingError):
    def __init__(self, entity: str, frm: str, to: str):
        super().__init__(409, "ILLEGAL_TRANSITION", f"{entity} cannot move from {frm} to {to}.")


SUBSCRIPTION_TRANSITIONS = {
    "trialing": {"active", "read_only", "suspended"},
    "active": {"grace", "read_only", "suspended"},
    "grace": {"active", "read_only", "suspended"},
    "read_only": {"active", "suspended"},
    "suspended": {"trialing", "active", "grace", "read_only"},  # superadmin restore
}
ORDER_TRANSITIONS = {
    "created": {"pending", "failed", "cancelled", "expired"},
    "pending": {"paid", "failed", "cancelled", "expired"},
    "expired": {"paid"},  # verified late payment only; caller sets needs_review
    "paid": set(), "failed": set(), "cancelled": set(),
}
ATTEMPT_TRANSITIONS = {
    "initiated": {"success", "failed", "pending", "abandoned"},
    "pending": {"success", "failed", "abandoned"},
    "abandoned": {"success", "failed"},
    "success": set(), "failed": set(),
}
_TABLES = {"subscription": SUBSCRIPTION_TRANSITIONS, "order": ORDER_TRANSITIONS, "attempt": ATTEMPT_TRANSITIONS}


def audit(db: Session, entity: str, obj, action: str, *, actor: str = "system", reason: Optional[str] = None,
          frm: Optional[str] = None, to: Optional[str] = None, meta: Optional[dict] = None) -> None:
    db.add(SaasAudit(workspace_id=getattr(obj, "workspace_id", None), entity=entity, entity_id=obj.id, action=action,
                     from_state=frm, to_state=to, actor=actor, reason=reason, meta=meta))


def transition(db: Session, entity: str, obj, to: str, *, actor: str = "system", reason: Optional[str] = None,
               meta: Optional[dict] = None) -> bool:
    """Move `obj` to `to` and append its audit row in the same transaction (the caller commits).

    A move to the current state is a harmless no-op (returns False). Illegal moves are logged and raised.
    """
    current = obj.status
    if current == to:
        return False
    if to not in _TABLES[entity].get(current, set()):
        logger.warning("Rejected illegal %s transition %s -> %s for %s", entity, current, to, obj.id)
        raise IllegalTransition(entity, current, to)
    obj.status = to
    if entity == "subscription":
        obj.version = (obj.version or 0) + 1
    audit(db, entity, obj, "transition", actor=actor, reason=reason, frm=current, to=to, meta=meta)
    return True


def alert(subject: str, body: str) -> None:
    """Operational alert for stuck/failed payments. Body must not contain secrets or customer PII."""
    from app.core.config import settings

    logger.error("SAAS BILLING ALERT: %s | %s", subject, body)
    if settings.SAAS_ALERT_EMAIL:
        try:
            from app.core.email import send_notification_email
            send_notification_email(settings.SAAS_ALERT_EMAIL, f"[REPSI billing] {subject}", body)
        except Exception:  # alerts must never break billing
            logger.exception("Could not send billing alert email")


# --- subscriptions and trials ---------------------------------------------------------------------

def _owner_user(db: Session, workspace_id: str):
    from app.models.user import User
    uid = _owner_user_id(db, workspace_id)
    return db.get(User, uid) if uid else None


def trial_eligible(db: Session, owner) -> bool:
    """One trial per owner: blocked when this user, or one sharing the email or phone, already had one."""
    from sqlalchemy import func, or_
    from app.models.user import User

    if owner is None:
        return True
    clauses = [User.id == owner.id, func.lower(User.email) == (owner.email or "").lower()]
    if owner.phone_e164:
        clauses.append(User.phone_e164 == owner.phone_e164)
    return not (
        db.query(SaasSubscription.id)
        .join(User, User.id == SaasSubscription.trial_owner_user_id)
        .filter(SaasSubscription.trial_started_at.isnot(None), or_(*clauses))
        .first()
    )


def get_or_create_subscription(db: Session, workspace_id: str, now: Optional[datetime] = None) -> SaasSubscription:
    """The workspace's subscription; new workspaces get a 14-day Growth trial if the owner is eligible,
    otherwise start read-only (repeat trial blocked). Commits only when it creates a row."""
    from app.core import saas_catalog as cat
    from app.core.config import settings

    sub = db.query(SaasSubscription).filter_by(workspace_id=workspace_id).first()
    if sub is not None:
        return sub
    now = as_utc(now) or datetime.now(timezone.utc)
    plan = db.query(SaasPlan).filter_by(code=cat.TRIAL_PLAN_CODE).first()
    if plan is None:
        raise BillingError(503, "CATALOG_NOT_SYNCED", "Billing catalogue is not configured.")
    owner = _owner_user(db, workspace_id)
    eligible = trial_eligible(db, owner)
    sub = SaasSubscription(
        workspace_id=workspace_id, plan_id=plan.id, currency="INR",
        status="trialing" if eligible else "read_only",
        trial_started_at=now if eligible else None,
        trial_ends_at=now + timedelta(days=settings.SAAS_TRIAL_DAYS) if eligible else None,
        read_only_since=None if eligible else now,
        trial_owner_user_id=owner.id if (owner and eligible) else None,
    )
    db.add(sub)
    try:
        db.flush()
    except IntegrityError:  # created concurrently
        db.rollback()
        return db.query(SaasSubscription).filter_by(workspace_id=workspace_id).one()
    audit(db, "subscription", sub, "created", to=sub.status,
          reason="New workspace trial." if eligible else "Repeat trial blocked for this owner.")
    db.commit()
    return sub


def saas_subscription_if_enabled(db: Session, workspace_id: Optional[str]) -> Optional[SaasSubscription]:
    from app.core.config import settings
    if not settings.SAAS_BILLING_ENABLED or not workspace_id:
        return None
    return get_or_create_subscription(db, workspace_id)


# --- entitlements -----------------------------------------------------------------------------------

def entitlements_for(db: Session, sub: SaasSubscription) -> dict:
    """{"plan_code", "plan_name", "features": {key: bool}, "limits": {key: int}} of the effective plan.
    Trials use the trial plan (Growth)."""
    from app.core import saas_catalog as cat

    plan = db.get(SaasPlan, sub.plan_id)
    if sub.status == "trialing":
        plan = db.query(SaasPlan).filter_by(code=cat.TRIAL_PLAN_CODE).first() or plan
    rows = db.query(SaasEntitlement).filter_by(plan_id=plan.id).all()
    return {
        "plan_code": plan.code,
        "plan_name": plan.name,
        "features": {e.key: bool(e.bool_value) for e in rows if e.kind == "feature"},
        "limits": {e.key: int(e.int_value) for e in rows if e.kind == "limit"},
    }


def member_limit_with_grace(cap: int) -> int:
    """The enforced member limit: floor(cap * 1.1) in integer arithmetic; -1 stays unlimited."""
    return -1 if cap < 0 else cap * 11 // 10


def saas_capacity_error(db: Session, sub: SaasSubscription, workspace_id: str, resource: str, increment: int = 1) -> Optional[dict]:
    from app.services.billing import BillingService

    ents = entitlements_for(db, sub)
    cap = ents["limits"].get(resource)
    if cap is None or cap < 0:
        return None
    limit = member_limit_with_grace(cap) if resource == "members" else cap
    current = BillingService.get_workspace_usage(db, workspace_id).get(resource, {}).get("current", 0)
    if current + increment <= limit:
        return None
    return {
        "error_code": "PLAN_LIMIT_REACHED", "resource": resource, "current": current, "limit": limit, "plan_cap": cap,
        "current_plan": ents["plan_code"], "plan_name": ents["plan_name"],
        "message": f"Limit reached ({current}/{limit} {resource}). Upgrade your REPSI plan to add more.",
    }


# Writes still allowed in read-only mode (path prefixes after /api/v1).
READ_ONLY_WRITE_ALLOWLIST = (
    "/auth/", "/users/me", "/attendance", "/staff-attendance", "/payments", "/billing", "/saas-billing",
    "/notifications", "/onboarding",
)
_SAFE_METHODS = {"GET", "HEAD", "OPTIONS"}


def read_only_refusal(db: Session, workspace_id: Optional[str], method: str, path: str) -> Optional[dict]:
    """402 payload when a read-only/suspended subscription attempts a disallowed write, else None.
    Reads, exports and the allowlisted writes are never refused."""
    from app.core.config import settings

    if not settings.SAAS_BILLING_ENABLED or not workspace_id or method.upper() in _SAFE_METHODS:
        return None
    rel = path.split(settings.API_V1_STR, 1)[-1] if settings.API_V1_STR in path else path
    if any(rel.startswith(p) for p in READ_ONLY_WRITE_ALLOWLIST) or "/export" in rel:
        return None
    sub = db.query(SaasSubscription).filter_by(workspace_id=workspace_id).first()
    if sub is None or sub.status not in ("read_only", "suspended"):
        return None
    return {
        "error_code": "SUBSCRIPTION_READ_ONLY",
        "status": sub.status,
        "message": "Your REPSI subscription is inactive, so this workspace is read-only. "
                   "Check-ins, member payments and exports still work. Manage your subscription at repsi.app.",
    }


# --- lifecycle ----------------------------------------------------------------------------------------

def lifecycle_tick(db: Session, now: Optional[datetime] = None) -> dict:
    """Time-based transitions. Idempotent; each subscription commits on its own."""
    from app.core.config import settings

    now = as_utc(now) or datetime.now(timezone.utc)
    counts = {"trial_ended": 0, "grace_started": 0, "read_only": 0, "downgrades_applied": 0}
    ids = [i for (i,) in db.query(SaasSubscription.id).filter(SaasSubscription.status.in_(("trialing", "active", "grace")))]
    for sub_id in ids:
        sub = db.get(SaasSubscription, sub_id)
        try:
            if sub.status == "trialing" and sub.trial_ends_at and as_utc(sub.trial_ends_at) <= now:
                transition(db, "subscription", sub, "read_only", reason="Trial ended without payment.")
                sub.read_only_since = now
                counts["trial_ended"] += 1
            elif sub.status == "active" and sub.paid_until and as_utc(sub.paid_until) <= now:
                if sub.pending_plan_id:
                    old = sub.plan_id
                    sub.plan_id, sub.billing_cycle = sub.pending_plan_id, sub.pending_billing_cycle or sub.billing_cycle
                    sub.pending_plan_id = sub.pending_billing_cycle = None
                    sub.price_override_minor = sub.price_override_currency = None
                    audit(db, "subscription", sub, "downgrade_applied", meta={"from_plan": old, "to_plan": sub.plan_id})
                    counts["downgrades_applied"] += 1
                if sub.cancel_at_period_end or sub.is_complimentary:
                    transition(db, "subscription", sub, "read_only",
                               reason="Cancelled subscription reached its period end." if sub.cancel_at_period_end
                               else "Complimentary access ended.")
                    sub.read_only_since = now
                    counts["read_only"] += 1
                else:
                    transition(db, "subscription", sub, "grace", reason="Paid period ended.")
                    sub.grace_ends_at = as_utc(sub.paid_until) + timedelta(days=settings.SAAS_GRACE_DAYS)
                    counts["grace_started"] += 1
            elif sub.status == "grace" and sub.grace_ends_at and as_utc(sub.grace_ends_at) <= now:
                transition(db, "subscription", sub, "read_only", reason="Grace period ended without payment.")
                sub.read_only_since = now
                counts["read_only"] += 1
            db.commit()
        except Exception:
            db.rollback()
            logger.exception("lifecycle_tick failed for subscription %s", sub_id)
    return counts


REMINDER_DAYS = (7, 3, 1)


def send_renewal_reminders(db: Session, now: Optional[datetime] = None) -> dict:
    """In-app (plus email when SMTP is set) reminders 7, 3 and 1 day before paid_until or trial end.
    De-duplicated through saas_audit so retries never double-send."""
    from app.models.system import Notification

    now = as_utc(now) or datetime.now(timezone.utc)
    sent = 0
    subs = db.query(SaasSubscription).filter(SaasSubscription.status.in_(("trialing", "active"))).all()
    for sub in subs:
        end = as_utc(sub.trial_ends_at if sub.status == "trialing" else sub.paid_until)
        if end is None or end <= now or sub.is_complimentary:
            continue
        days_left = (end - now).total_seconds() / 86400
        due = [d for d in REMINDER_DAYS if days_left <= d]
        if not due:
            continue
        day = min(due)
        key = f"reminder_{day}d:{end.date().isoformat()}"
        if db.query(SaasAudit.id).filter_by(entity="subscription", entity_id=sub.id, action=key).first():
            continue
        owner = _owner_user(db, sub.workspace_id)
        if owner:
            what = "free trial" if sub.status == "trialing" else "subscription"
            when = end.astimezone(INDIA).strftime("%d %b %Y")
            db.add(Notification(
                workspace_id=sub.workspace_id, user_id=owner.id,
                title=f"Your REPSI {what} ends in {day} day{'s' if day > 1 else ''}",
                message=f"It ends on {when}. Your data stays safe. Manage your subscription at repsi.app.",
                action_url="/pay", is_read=False,
            ))
            if owner.email:
                try:
                    from app.core.email import send_notification_email
                    send_notification_email(owner.email, f"Your REPSI {what} ends in {day} day(s)",
                                            f"Renew at https://repsi.app/pay before {when}.")
                except Exception:
                    logger.exception("Reminder email failed for subscription %s", sub.id)
        audit(db, "subscription", sub, key, meta={"days": day})
        db.commit()
        sent += 1
    return {"sent": sent}


# --- invoices -----------------------------------------------------------------------------------------

def create_invoice_for_order(db: Session, order, issued_at: datetime):
    """One invoice per paid order, numbered in the caller's transaction. Returns the existing one if present."""
    from app.models.saas import SaasInvoice

    existing = db.query(SaasInvoice).filter_by(order_id=order.id).first()
    if existing:
        return existing
    number, fy, seq = allocate_invoice_number(db, issued_at)
    inv = SaasInvoice(workspace_id=order.workspace_id, order_id=order.id, invoice_number=number, fiscal_year=fy,
                      sequence=seq, amount_minor=order.amount_minor, currency=order.currency,
                      tax_minor=order.tax_minor, issued_at=issued_at)
    db.add(inv)
    db.flush()
    return inv


def render_invoice_pdf(db: Session, invoice) -> bytes:
    """Titled 'Invoice' (never 'Tax Invoice'); tax/GSTIN lines only appear once tax is enabled."""
    from io import BytesIO
    from reportlab.lib.pagesizes import A4
    from reportlab.pdfgen import canvas
    from app.models.saas import SaasOrder
    from app.services.payment_providers import to_major

    order = db.get(SaasOrder, invoice.order_id)
    plan = db.get(SaasPlan, order.plan_id)
    ws = db.get(Workspace, invoice.workspace_id)
    buf = BytesIO()
    c = canvas.Canvas(buf, pagesize=A4)
    y = A4[1] - 60
    c.setFont("Helvetica-Bold", 18)
    c.drawString(50, y, "REPSI - Invoice")
    c.setFont("Helvetica", 10)
    lines = [
        f"Invoice number: {invoice.invoice_number}",
        f"Date: {as_utc(invoice.issued_at).astimezone(INDIA).strftime('%d %b %Y')}",
        f"Billed to: {ws.name if ws else invoice.workspace_id}",
        f"Order: {order.order_ref}",
        "",
        f"Plan: {plan.name} ({order.billing_cycle.replace('_', ' ')}, {order.period_months} month(s))",
        f"Type: {order.kind}",
        f"Amount: {invoice.currency} {to_major(invoice.amount_minor)}",
    ]
    if invoice.tax_minor is not None:
        lines.append(f"Tax: {invoice.currency} {to_major(invoice.tax_minor)}")
        if invoice.seller_gstin:
            lines.append(f"GSTIN: {invoice.seller_gstin}")
    lines += ["", "Status: Paid"]
    for line in lines:
        y -= 18
        c.drawString(50, y, line)
    c.showPage()
    c.save()
    return buf.getvalue()


# --- app-to-web handoff ---------------------------------------------------------------------------------

def _hash_token(token: str) -> str:
    import hashlib
    return hashlib.sha256(token.encode()).hexdigest()


def issue_handoff_token(db: Session, user_id: str, workspace_id: str, purpose: str = "checkout") -> tuple[str, datetime]:
    """Short-lived, single-use token bound to user + workspace + purpose. Only its SHA-256 is stored."""
    import secrets
    from app.core.config import settings
    from app.models.saas import SaasHandoffToken

    token = secrets.token_urlsafe(32)
    expires = datetime.now(timezone.utc) + timedelta(seconds=settings.SAAS_HANDOFF_TTL_SECONDS)
    db.add(SaasHandoffToken(token_hash=_hash_token(token), user_id=user_id, workspace_id=workspace_id,
                            purpose=purpose, expires_at=expires))
    db.commit()
    return token, expires


def consume_handoff_token(db: Session, token: str, purpose: str = "checkout"):
    """Atomically mark the token used. Returns its row, or None if unknown, expired, used or wrong purpose."""
    from sqlalchemy import update
    from app.models.saas import SaasHandoffToken

    if not token or len(token) > 200:
        return None
    now = datetime.now(timezone.utc)
    h = _hash_token(token)
    res = db.execute(
        update(SaasHandoffToken)
        .where(SaasHandoffToken.token_hash == h, SaasHandoffToken.consumed_at.is_(None),
               SaasHandoffToken.expires_at > now, SaasHandoffToken.purpose == purpose)
        .values(consumed_at=now)
    )
    db.commit()
    if res.rowcount != 1:
        return None
    return db.query(SaasHandoffToken).filter_by(token_hash=h).one()
