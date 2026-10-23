"""
Background jobs: one registry, run by the in-process scheduler (SCHEDULER_ENABLED=true on exactly one
API process) or by cron through `python -m scripts.run_jobs`.

Each job runs at most once per time slot: a JobRun row with a unique (job_name, run_key) is inserted
before the job starts, so two workers (or a worker and a cron run) never run the same slot twice.
Jobs are idempotent anyway (messages carry idempotency keys, transitions check current state).
"""
from __future__ import annotations

import logging
import time as _time
from dataclasses import dataclass
from datetime import date, datetime, timedelta, timezone
from typing import Callable, Optional

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.jobs import JobRun

logger = logging.getLogger("repsi.jobs")


@dataclass(frozen=True)
class Job:
    name: str
    every_minutes: int
    run: Callable[[Session], dict]
    description: str


# ─── Job bodies ────────────────────────────────────────────────────────


def _active_workspace_ids(db: Session) -> list[str]:
    from app.models.user import Workspace

    return list(db.scalars(select(Workspace.id).where(Workspace.is_active.is_(True))).all())


def dispatch_notifications(db: Session) -> dict:
    from app.services.communication import dispatch_queued_deliveries

    total = 0
    for _ in range(10):  # up to 10 batches per run
        n = dispatch_queued_deliveries(db, limit=200)
        total += n
        if n < 200:
            break
    return {"processed": total}


def membership_transitions(db: Session) -> dict:
    from app.services.membership_lifecycle import run_due_transitions

    totals = {"freezes_started": 0, "freezes_resumed": 0, "expired": 0, "workspaces": 0}
    for ws_id in _active_workspace_ids(db):
        try:
            result = run_due_transitions(db, ws_id)
            db.commit()
        except Exception:
            db.rollback()
            logger.exception("Membership transitions failed for workspace %s", ws_id)
            continue
        totals["workspaces"] += 1
        for k in ("freezes_started", "freezes_resumed", "expired"):
            totals[k] += result.get(k, 0)
    return totals


def membership_reminders(db: Session) -> dict:
    """Expiry reminders 7, 3 and 1 day(s) before the end date, and one 'ended' message the day after."""
    from app.models.member import Member, MemberStatus, Membership, MembershipPlan
    from app.services.membership_lifecycle import workspace_today
    from app.services.notify import safe_notify

    sent = {"expiring": 0, "expired": 0}
    for ws_id in _active_workspace_ids(db):
        today = workspace_today(db, ws_id)
        soon = db.scalars(select(Membership).where(
            Membership.workspace_id == ws_id, Membership.status == MemberStatus.ACTIVE,
            Membership.end_date >= today, Membership.end_date <= today + timedelta(days=7))).all()
        ended = db.scalars(select(Membership).where(
            Membership.workspace_id == ws_id, Membership.status.in_((MemberStatus.ACTIVE, MemberStatus.EXPIRED)),
            Membership.end_date == today - timedelta(days=1))).all()
        for m in soon + ended:
            # Skip members who already have the next period lined up.
            renewed = db.scalar(select(Membership.id).where(
                Membership.workspace_id == ws_id, Membership.member_id == m.member_id, Membership.id != m.id,
                Membership.status == MemberStatus.ACTIVE, Membership.start_date > m.start_date))
            if renewed:
                continue
            member = db.get(Member, m.member_id)
            if member is None or member.status != MemberStatus.ACTIVE:
                continue
            plan = db.get(MembershipPlan, m.plan_id)
            days = (m.end_date - today).days
            variables = {"plan_name": plan.name if plan else "membership", "end_date": m.end_date.strftime("%d %b %Y"),
                         "days": days}
            if m.end_date < today:
                safe_notify(db, member, "membership_expired", f"{m.id}:{m.end_date.isoformat()}", variables=variables)
                sent["expired"] += 1
            elif days in (7, 3, 1):
                safe_notify(db, member, "membership_expiring", f"{m.id}:{m.end_date.isoformat()}:{days}d", variables=variables)
                sent["expiring"] += 1
        db.commit()
    return sent


def attendance_auto_checkout(db: Session) -> dict:
    from app.services.attendance import AttendanceService

    closed = 0
    for ws_id in _active_workspace_ids(db):
        try:
            closed += AttendanceService(db, ws_id).run_smart_auto_checkout() or 0
            db.commit()
        except Exception:
            db.rollback()
            logger.exception("Auto checkout failed for workspace %s", ws_id)
    return {"checked_out": closed}


def class_no_shows(db: Session) -> dict:
    from app.services.booking import mark_no_shows

    n = mark_no_shows(db)
    db.commit()
    return {"no_shows": n}


def trial_lifecycle(db: Session) -> dict:
    from app.services.trial_lifecycle import TrialLifecycleService

    reconciled = TrialLifecycleService.reconcile_all_trials(db)
    reminders = TrialLifecycleService.send_trial_reminders(db)
    db.commit()
    return {"reconcile": reconciled, "reminders": reminders}


def subscription_status(db: Session) -> dict:
    """Moves lapsed SaaS subscriptions into grace and then expiry without waiting for a page load."""
    from app.models.billing import GymSubscription, SubscriptionStatus
    from app.services.billing import BillingService, invalidate_entitlements

    changed = 0
    for sub in db.scalars(select(GymSubscription).where(GymSubscription.status.in_(
            (SubscriptionStatus.ACTIVE.value, SubscriptionStatus.GRACE_PERIOD.value)))).all():
        before = sub.status
        BillingService.get_or_create_workspace_subscription(db, sub.workspace_id)
        if sub.status != before:
            changed += 1
            invalidate_entitlements(sub.workspace_id)
    db.commit()
    return {"changed": changed}


JOBS: dict[str, Job] = {j.name: j for j in (
    Job("dispatch_notifications", 1, dispatch_notifications, "Send queued email, WhatsApp, SMS and push messages."),
    Job("membership_transitions", 15, membership_transitions, "Start/resume scheduled freezes and expire ended memberships."),
    Job("membership_reminders", 60, membership_reminders, "Expiry reminders (7/3/1 days) and 'membership ended' messages."),
    Job("attendance_auto_checkout", 15, attendance_auto_checkout, "Close visits past the max duration or closing time."),
    Job("class_no_shows", 30, class_no_shows, "Mark unattended class bookings as no-shows after the session ends."),
    Job("trial_lifecycle", 60, trial_lifecycle, "Expire finished free trials and send trial reminders."),
    Job("subscription_status", 60, subscription_status, "Apply SaaS grace periods and expiry."),
)}


# ─── Runner ────────────────────────────────────────────────────────────


def slot_key(job: Job, now: datetime) -> str:
    minutes = int(now.timestamp() // 60)
    slot = minutes - minutes % job.every_minutes
    return datetime.fromtimestamp(slot * 60, tz=timezone.utc).strftime("%Y-%m-%dT%H:%M")


def run_job(session_factory: Callable[[], Session], job: Job, trigger: str, run_key: Optional[str] = None) -> Optional[JobRun]:
    """Claims the slot, runs the job in its own session and records the outcome. None if already claimed."""
    now = datetime.now(timezone.utc)
    run_key = run_key or slot_key(job, now)
    db = session_factory()
    try:
        record = JobRun(job_name=job.name, run_key=run_key, trigger=trigger, status="running", started_at=now)
        db.add(record)
        try:
            db.commit()
        except IntegrityError:
            db.rollback()
            return None
        started = _time.perf_counter()
        work = session_factory()
        try:
            result = job.run(work)
            work.commit()
            record.status, record.result = "succeeded", result
        except Exception as exc:
            work.rollback()
            logger.exception("Job %s failed", job.name)
            record.status, record.error = "failed", f"{type(exc).__name__}: {str(exc)[:500]}"
        finally:
            work.close()
        record.finished_at = datetime.now(timezone.utc)
        record.duration_ms = int((_time.perf_counter() - started) * 1000)
        db.commit()
        db.refresh(record)
        db.expunge(record)  # usable by the caller after this session closes
        return record
    finally:
        db.close()


def run_due_jobs(session_factory: Callable[[], Session], trigger: str = "scheduler") -> list[JobRun]:
    return [r for r in (run_job(session_factory, j, trigger) for j in JOBS.values()) if r is not None]


def recent_runs(db: Session, limit: int = 100) -> list[JobRun]:
    return list(db.scalars(select(JobRun).order_by(JobRun.started_at.desc()).limit(limit)).all())


def prune_runs(db: Session, keep_days: int = 30) -> int:
    cutoff = datetime.now(timezone.utc) - timedelta(days=keep_days)
    rows = db.scalars(select(JobRun).where(JobRun.started_at < cutoff)).all()
    for r in rows:
        db.delete(r)  # run logs are operational telemetry, not business history
    db.commit()
    return len(rows)
