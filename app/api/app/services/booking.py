"""
Class sessions, bookings with waitlists, trainer availability and personal-training appointments.

Rules enforced here (routers only check who may call):
- A member may book a scheduled, future session once bookings are open (class.booking_open_hours
  before the start), needs a membership covering the session date, and must have class credits
  left when their plan limits them (`MembershipPlan.class_credits`).
- When a session is full the booking is waitlisted (if the class allows it); a cancellation or a
  capacity increase promotes the earliest waitlisted booking automatically.
- Cancelling later than class.cancel_cutoff_hours before the start is a "late cancel" and still
  counts against credits. Bookings are never deleted.
- Appointments must fall inside the trainer's weekly availability (when the trainer has any set),
  outside time off, and must not overlap the trainer's other appointments or classes.
"""
from __future__ import annotations

import uuid
from dataclasses import dataclass
from datetime import date, datetime, time, timedelta, timezone
from typing import Iterable, Optional
from zoneinfo import ZoneInfo

from fastapi import HTTPException
from sqlalchemy import and_, func, or_, select
from sqlalchemy.orm import Session

from app.models.booking import (
    ACTIVE_BOOKING_STATUSES,
    ClassBooking,
    ClassSession,
    TrainerAvailability,
    TrainerTimeOff,
)
from app.models.member import Member, MemberStatus, Membership, MembershipPlan
from app.models.trainer import GymClass, SessionStatus, Trainer, TrainingSession
from app.models.user import Workspace
from app.services.notify import safe_notify

MAX_SERIES_SESSIONS = 200
CREDIT_STATUSES = ("booked", "attended", "no_show")


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def aware(dt: Optional[datetime]) -> Optional[datetime]:
    """SQLite returns naive datetimes; everything here is stored and compared in UTC."""
    if dt is None:
        return None
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)


def workspace_zone(db: Session, workspace_id: str) -> ZoneInfo:
    ws = db.get(Workspace, workspace_id)
    try:
        return ZoneInfo(ws.timezone) if ws and ws.timezone else ZoneInfo("Asia/Kolkata")
    except Exception:
        return ZoneInfo("Asia/Kolkata")


def to_utc(db: Session, workspace_id: str, dt: datetime) -> datetime:
    """Naive input means gym-local wall time."""
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=workspace_zone(db, workspace_id))
    return dt.astimezone(timezone.utc)


def describe_when(db: Session, workspace_id: str, dt: datetime) -> str:
    return aware(dt).astimezone(workspace_zone(db, workspace_id)).strftime("%a %d %b, %I:%M %p")


def _http(status: int, detail: str) -> HTTPException:
    return HTTPException(status_code=status, detail=detail)


# ─── Sessions ──────────────────────────────────────────────────────────


def get_class(db: Session, workspace_id: str, class_id: str) -> GymClass:
    c = db.scalar(select(GymClass).where(GymClass.workspace_id == workspace_id, GymClass.id == class_id))
    if c is None:
        raise _http(404, "Class not found.")
    return c


def get_session(db: Session, workspace_id: str, session_id: str) -> ClassSession:
    s = db.scalar(select(ClassSession).where(ClassSession.workspace_id == workspace_id, ClassSession.id == session_id))
    if s is None:
        raise _http(404, "Class session not found.")
    return s


def _check_trainer(db: Session, workspace_id: str, trainer_id: Optional[str]) -> None:
    if trainer_id and not db.scalar(select(Trainer.id).where(Trainer.workspace_id == workspace_id, Trainer.id == trainer_id)):
        raise _http(404, "Trainer not found.")


def trainer_busy(db: Session, workspace_id: str, trainer_id: str, start: datetime, end: datetime,
                 ignore_session_id: Optional[str] = None, ignore_appointment_id: Optional[str] = None) -> Optional[str]:
    """Returns a description of the clash, or None when the trainer is free."""
    q = select(ClassSession).where(
        ClassSession.workspace_id == workspace_id, ClassSession.trainer_id == trainer_id,
        ClassSession.status == "scheduled", ClassSession.starts_at < end, ClassSession.ends_at > start)
    if ignore_session_id:
        q = q.where(ClassSession.id != ignore_session_id)
    if db.scalar(q.limit(1)) is not None:
        return "The trainer is teaching another class at that time."
    appts = db.scalars(select(TrainingSession).where(
        TrainingSession.workspace_id == workspace_id, TrainingSession.trainer_id == trainer_id,
        TrainingSession.status == SessionStatus.SCHEDULED,
        TrainingSession.scheduled_at < end,
        TrainingSession.scheduled_at > start - timedelta(hours=12),
    )).all()
    for a in appts:
        if a.id == ignore_appointment_id:
            continue
        a_start = aware(a.scheduled_at)
        if a_start and a_start < end and a_start + timedelta(minutes=a.duration_minutes or 60) > start:
            return "The trainer has another session at that time."
    return None


def create_sessions(
    db: Session, gym_class: GymClass, actor_user_id: str, *, starts_at: Optional[datetime] = None,
    weekdays: Optional[list[int]] = None, start_time: Optional[str] = None, from_date: Optional[date] = None,
    until_date: Optional[date] = None, duration_minutes: Optional[int] = None, trainer_id: Optional[str] = None,
    capacity: Optional[int] = None, room: Optional[str] = None,
) -> list[ClassSession]:
    """One session (`starts_at`) or a weekly series (`weekdays` + `start_time` between two dates)."""
    ws_id = gym_class.workspace_id
    trainer_id = trainer_id or gym_class.trainer_id
    _check_trainer(db, ws_id, trainer_id)
    minutes = duration_minutes or gym_class.duration_minutes or 60
    cap = capacity or gym_class.capacity
    if cap < 1:
        raise _http(422, "Capacity must be at least 1.")
    starts: list[datetime] = []
    if starts_at is not None:
        starts.append(to_utc(db, ws_id, starts_at))
    else:
        if not weekdays or not start_time or not from_date or not until_date:
            raise _http(422, "Give either starts_at, or weekdays, start_time, from_date and until_date.")
        if until_date < from_date or (until_date - from_date).days > 366:
            raise _http(422, "A series must end after it starts and span at most a year.")
        hh, mm = (int(x) for x in start_time.split(":"))
        tz = workspace_zone(db, ws_id)
        day = from_date
        while day <= until_date:
            if day.weekday() in weekdays:
                starts.append(datetime.combine(day, time(hh, mm), tzinfo=tz).astimezone(timezone.utc))
            day += timedelta(days=1)
        if len(starts) > MAX_SERIES_SESSIONS:
            raise _http(422, f"A series can create at most {MAX_SERIES_SESSIONS} sessions at once.")
    if not starts:
        raise _http(422, "No sessions fall inside those dates.")
    if any(s < utcnow() - timedelta(minutes=5) for s in starts):
        raise _http(422, "Sessions can't start in the past.")
    series_id = uuid.uuid4().hex if len(starts) > 1 else None
    created = []
    for s in starts:
        e = s + timedelta(minutes=minutes)
        if trainer_id:
            clash = trainer_busy(db, ws_id, trainer_id, s, e)
            if clash:
                raise _http(409, f"{describe_when(db, ws_id, s)}: {clash}")
        session = ClassSession(workspace_id=ws_id, class_id=gym_class.id, trainer_id=trainer_id,
                               branch_id=gym_class.branch_id, starts_at=s, ends_at=e, capacity=cap,
                               room=room or gym_class.room, status="scheduled", created_by=actor_user_id,
                               series_id=series_id)
        db.add(session)
        db.flush()
        created.append(session)
    return created


def counts(db: Session, session_ids: Iterable[str]) -> dict[str, dict[str, int]]:
    ids = list(session_ids)
    out: dict[str, dict[str, int]] = {i: {"booked": 0, "waitlisted": 0, "attended": 0} for i in ids}
    if not ids:
        return out
    for sid, st, n in db.execute(
        select(ClassBooking.session_id, ClassBooking.status, func.count(ClassBooking.id))
        .where(ClassBooking.session_id.in_(ids), ClassBooking.status.in_(("booked", "waitlisted", "attended")))
        .group_by(ClassBooking.session_id, ClassBooking.status)
    ).all():
        out[sid][st] = n
    return out


def update_session(db: Session, session: ClassSession, *, starts_at: Optional[datetime] = None,
                   capacity: Optional[int] = None, trainer_id: Optional[str] = None, room: Optional[str] = None,
                   actor_user_id: Optional[str] = None) -> ClassSession:
    if session.status != "scheduled":
        raise _http(409, "Only scheduled sessions can be changed.")
    if trainer_id is not None:
        _check_trainer(db, session.workspace_id, trainer_id)
        session.trainer_id = trainer_id or None
    if starts_at is not None:
        s_end = aware(session.ends_at)
        s_start = aware(session.starts_at)
        length = (s_end - s_start) if (s_end and s_start) else timedelta(minutes=60)
        session.starts_at = to_utc(db, session.workspace_id, starts_at)
        session.ends_at = session.starts_at + length
    if session.trainer_id and (starts_at is not None or trainer_id):
        sess_start = aware(session.starts_at) or utcnow()
        sess_end = aware(session.ends_at) or (sess_start + timedelta(minutes=60))
        clash = trainer_busy(db, session.workspace_id, session.trainer_id, sess_start,
                             sess_end, ignore_session_id=session.id)
        if clash:
            raise _http(409, clash)
    if room is not None:
        session.room = room
    if capacity is not None:
        booked = counts(db, [session.id])[session.id]["booked"]
        if capacity < booked:
            raise _http(409, f"{booked} members are already booked; capacity can't go below that.")
        session.capacity = capacity
    db.flush()
    _promote_waitlist(db, session)
    return session


def cancel_session(db: Session, session: ClassSession, reason: str, actor_user_id: str) -> int:
    if session.status != "scheduled":
        raise _http(409, "This session is not scheduled.")
    session.status = "cancelled"
    session.cancel_reason = reason
    gym_class = db.get(GymClass, session.class_id)
    affected = db.scalars(select(ClassBooking).where(
        ClassBooking.session_id == session.id, ClassBooking.status.in_(ACTIVE_BOOKING_STATUSES))).all()
    now = utcnow()
    for b in affected:
        b.status, b.cancelled_at, b.cancelled_by_user_id = "cancelled", now, actor_user_id
        b.cancel_reason = f"Class cancelled: {reason}"[:255]
        safe_notify(db, db.get(Member, b.member_id), "class_cancelled", b.id, variables={
            "class_name": gym_class.name if gym_class else "Class",
            "when": describe_when(db, session.workspace_id, session.starts_at), "reason": reason})
    db.flush()
    return len(affected)


# ─── Bookings ──────────────────────────────────────────────────────────


def _covering_membership(db: Session, member: Member, on: date) -> Optional[Membership]:
    return db.scalar(select(Membership).where(
        Membership.workspace_id == member.workspace_id, Membership.member_id == member.id,
        Membership.status == MemberStatus.ACTIVE, Membership.start_date <= on, Membership.end_date >= on,
    ).order_by(Membership.end_date.desc()))


def credits_left(db: Session, member: Member, membership: Membership) -> Optional[int]:
    """None = unlimited."""
    plan = db.get(MembershipPlan, membership.plan_id)
    if plan is None or plan.class_credits is None:
        return None
    tz = workspace_zone(db, member.workspace_id)
    start = datetime.combine(membership.start_date, time.min, tzinfo=tz).astimezone(timezone.utc)
    end = datetime.combine(membership.end_date + timedelta(days=1), time.min, tzinfo=tz).astimezone(timezone.utc)
    used = db.scalar(
        select(func.count(ClassBooking.id)).join(ClassSession, ClassSession.id == ClassBooking.session_id).where(
            ClassBooking.workspace_id == member.workspace_id, ClassBooking.member_id == member.id,
            ClassSession.starts_at >= start, ClassSession.starts_at < end,
            or_(ClassBooking.status.in_(CREDIT_STATUSES),
                and_(ClassBooking.status == "cancelled", ClassBooking.late_cancel.is_(True))),
        )) or 0
    return max(0, plan.class_credits - used)


def book(db: Session, session: ClassSession, member: Member, actor_user_id: str, *, staff_override: bool = False) -> ClassBooking:
    gym_class = db.get(GymClass, session.class_id)
    now = utcnow()
    starts = aware(session.starts_at)
    if starts is None:
        raise _http(409, "This session has an invalid start time.")
    if session.status != "scheduled":
        raise _http(409, "This session is not open for booking.")
    if starts <= now:
        raise _http(409, "This session has already started.")
    if not staff_override and gym_class and starts - now > timedelta(hours=gym_class.booking_open_hours or 168):
        raise _http(409, f"Bookings open {gym_class.booking_open_hours} hours before the class.")
    if member.status not in (MemberStatus.ACTIVE,):
        raise _http(403, "This member's account isn't active.")
    local_day = starts.astimezone(workspace_zone(db, session.workspace_id)).date()
    membership = _covering_membership(db, member, local_day)
    if membership is None and not staff_override:
        raise _http(403, "An active membership covering the class date is required.")
    existing = db.scalar(select(ClassBooking).where(
        ClassBooking.session_id == session.id, ClassBooking.member_id == member.id,
        ClassBooking.status.in_(ACTIVE_BOOKING_STATUSES)))
    if existing is not None:
        raise _http(409, "Already booked or waitlisted for this session.")
    if membership is not None and not staff_override:
        left = credits_left(db, member, membership)
        if left is not None and left <= 0:
            raise _http(403, "No class credits left in the current membership period.")

    c = counts(db, [session.id])[session.id]
    booking = ClassBooking(workspace_id=session.workspace_id, session_id=session.id, member_id=member.id,
                           booked_by_user_id=actor_user_id, booked_at=now)
    if c["booked"] < session.capacity:
        booking.status = "booked"
    elif gym_class is None or gym_class.waitlist_enabled:
        booking.status = "waitlisted"
        booking.waitlist_position = c["waitlisted"] + 1
    else:
        raise _http(409, "This session is full.")
    db.add(booking)
    db.flush()
    event = "class_booked" if booking.status == "booked" else "class_waitlisted"
    safe_notify(db, member, event, booking.id, variables={
        "class_name": gym_class.name if gym_class else "Class", "when": describe_when(db, session.workspace_id, starts),
        "position": booking.waitlist_position or ""})
    return booking


def _promote_waitlist(db: Session, session: ClassSession) -> list[ClassBooking]:
    starts = aware(session.starts_at)
    if session.status != "scheduled" or starts is None or starts <= utcnow():
        return []
    gym_class = db.get(GymClass, session.class_id)
    promoted = []
    while True:
        c = counts(db, [session.id])[session.id]
        if c["booked"] >= session.capacity:
            break
        nxt = db.scalar(select(ClassBooking).where(
            ClassBooking.session_id == session.id, ClassBooking.status == "waitlisted",
        ).order_by(ClassBooking.waitlist_position, ClassBooking.booked_at))
        if nxt is None:
            break
        nxt.status, nxt.promoted_at, nxt.waitlist_position = "booked", utcnow(), None
        db.flush()
        promoted.append(nxt)
        safe_notify(db, db.get(Member, nxt.member_id), "class_promoted", nxt.id, variables={
            "class_name": gym_class.name if gym_class else "Class",
            "when": describe_when(db, session.workspace_id, session.starts_at)})
    # Renumber the remaining waitlist.
    rest = db.scalars(select(ClassBooking).where(
        ClassBooking.session_id == session.id, ClassBooking.status == "waitlisted",
    ).order_by(ClassBooking.waitlist_position, ClassBooking.booked_at)).all()
    for i, b in enumerate(rest, start=1):
        b.waitlist_position = i
    db.flush()
    return promoted


def cancel_booking(db: Session, booking: ClassBooking, actor_user_id: str, reason: Optional[str] = None) -> ClassBooking:
    if booking.status not in ACTIVE_BOOKING_STATUSES:
        raise _http(409, f"A {booking.status} booking can't be cancelled.")
    session = db.get(ClassSession, booking.session_id)
    gym_class = db.get(GymClass, session.class_id) if session else None
    now = utcnow()
    was_booked = booking.status == "booked"
    if was_booked and session and gym_class:
        starts = aware(session.starts_at)
        booking.late_cancel = starts is not None and (starts - now < timedelta(hours=gym_class.cancel_cutoff_hours or 0))
    booking.status, booking.cancelled_at, booking.cancelled_by_user_id = "cancelled", now, actor_user_id
    booking.cancel_reason = (reason or "").strip()[:255] or None
    booking.waitlist_position = None
    db.flush()
    if session:
        _promote_waitlist(db, session)
    return booking


def check_in_booking(db: Session, booking: ClassBooking) -> ClassBooking:
    if booking.status not in ("booked", "no_show"):
        raise _http(409, f"A {booking.status} booking can't be checked in.")
    booking.status, booking.checked_in_at = "attended", utcnow()
    db.flush()
    return booking


def mark_no_shows(db: Session, now: Optional[datetime] = None) -> int:
    """After a session ends, bookings never checked in become no-shows (job)."""
    now = now or utcnow()
    rows = db.scalars(
        select(ClassBooking).join(ClassSession, ClassSession.id == ClassBooking.session_id).where(
            ClassBooking.status == "booked", ClassSession.status == "scheduled", ClassSession.ends_at < now)
    ).all()
    for b in rows:
        b.status = "no_show"
    sessions = db.scalars(select(ClassSession).where(ClassSession.status == "scheduled", ClassSession.ends_at < now)).all()
    for s in sessions:
        s.status = "completed"
    for b in db.scalars(
        select(ClassBooking).join(ClassSession, ClassSession.id == ClassBooking.session_id).where(
            ClassBooking.status == "waitlisted", ClassSession.ends_at < now)
    ).all():
        b.status, b.cancelled_at, b.cancel_reason = "cancelled", now, "Session ended while waitlisted"
    db.flush()
    return len(rows)


# ─── Trainer availability and appointments ─────────────────────────────


def _hhmm(value: str) -> time:
    try:
        hh, mm = value.split(":")
        return time(int(hh), int(mm))
    except Exception:
        raise _http(422, f"Times must be HH:MM (got {value!r}).")


def set_availability(db: Session, workspace_id: str, trainer_id: str, slots: list[dict]) -> list[TrainerAvailability]:
    _check_trainer(db, workspace_id, trainer_id)
    parsed = []
    for s in slots:
        wd = int(s["weekday"])
        if wd < 0 or wd > 6:
            raise _http(422, "weekday must be 0 (Monday) to 6 (Sunday).")
        st, en = _hhmm(s["start_time"]), _hhmm(s["end_time"])
        if en <= st:
            raise _http(422, "Each slot must end after it starts.")
        parsed.append((wd, st, en, s.get("branch_id")))
    parsed.sort()
    for (wd1, _, en1, _), (wd2, st2, _, _) in zip(parsed, parsed[1:]):
        if wd1 == wd2 and st2 < en1:
            raise _http(422, "Availability slots on the same day can't overlap.")
    for old in db.scalars(select(TrainerAvailability).where(
            TrainerAvailability.workspace_id == workspace_id, TrainerAvailability.trainer_id == trainer_id)).all():
        db.delete(old)  # a weekly template, replaced as a whole; bookings keep their own times
    db.flush()
    rows = [TrainerAvailability(workspace_id=workspace_id, trainer_id=trainer_id, weekday=wd,
                                start_time=st.strftime("%H:%M"), end_time=en.strftime("%H:%M"), branch_id=b)
            for wd, st, en, b in parsed]
    db.add_all(rows)
    db.flush()
    return rows


def availability(db: Session, workspace_id: str, trainer_id: str) -> list[TrainerAvailability]:
    return db.scalars(select(TrainerAvailability).where(
        TrainerAvailability.workspace_id == workspace_id, TrainerAvailability.trainer_id == trainer_id,
    ).order_by(TrainerAvailability.weekday, TrainerAvailability.start_time)).all()


def _on_time_off(db: Session, workspace_id: str, trainer_id: str, day: date) -> bool:
    return db.scalar(select(TrainerTimeOff.id).where(
        TrainerTimeOff.workspace_id == workspace_id, TrainerTimeOff.trainer_id == trainer_id,
        TrainerTimeOff.starts_on <= day, TrainerTimeOff.ends_on >= day)) is not None


def within_availability(db: Session, workspace_id: str, trainer_id: str, start: datetime, end: datetime) -> bool:
    slots = availability(db, workspace_id, trainer_id)
    if not slots:
        return True  # no schedule set: availability isn't restricted
    tz = workspace_zone(db, workspace_id)
    ls, le = start.astimezone(tz), end.astimezone(tz)
    if ls.date() != le.date() and le.time() != time(0, 0):
        return False
    for s in slots:
        if s.weekday == ls.weekday() and _hhmm(s.start_time) <= ls.time() and (
                le.time() <= _hhmm(s.end_time) or (le.time() == time(0, 0) and s.end_time == "24:00")):
            return True
    return False


def free_slots(db: Session, workspace_id: str, trainer_id: str, day: date, duration_minutes: int = 60,
               step_minutes: int = 30) -> list[str]:
    _check_trainer(db, workspace_id, trainer_id)
    if _on_time_off(db, workspace_id, trainer_id, day):
        return []
    tz = workspace_zone(db, workspace_id)
    windows = [s for s in availability(db, workspace_id, trainer_id) if s.weekday == day.weekday()]
    out = []
    now = utcnow()
    for w in windows:
        cursor = datetime.combine(day, _hhmm(w.start_time), tzinfo=tz)
        stop = datetime.combine(day, _hhmm(w.end_time), tzinfo=tz)
        while cursor + timedelta(minutes=duration_minutes) <= stop:
            s_utc = cursor.astimezone(timezone.utc)
            e_utc = s_utc + timedelta(minutes=duration_minutes)
            if s_utc > now and not trainer_busy(db, workspace_id, trainer_id, s_utc, e_utc):
                out.append(cursor.isoformat())
            cursor += timedelta(minutes=step_minutes)
    return out


def book_appointment(db: Session, workspace_id: str, trainer_id: str, member: Optional[Member], starts_at: datetime,
                     duration_minutes: int, actor_user_id: str, source: str, title: Optional[str] = None,
                     notes: Optional[str] = None, location: Optional[str] = None) -> TrainingSession:
    _check_trainer(db, workspace_id, trainer_id)
    if duration_minutes < 15 or duration_minutes > 240:
        raise _http(422, "Sessions must be 15 to 240 minutes long.")
    start = to_utc(db, workspace_id, starts_at)
    end = start + timedelta(minutes=duration_minutes)
    if start <= utcnow():
        raise _http(422, "Sessions must be booked in the future.")
    local_day = start.astimezone(workspace_zone(db, workspace_id)).date()
    if _on_time_off(db, workspace_id, trainer_id, local_day):
        raise _http(409, "The trainer is on leave that day.")
    if not within_availability(db, workspace_id, trainer_id, start, end):
        raise _http(409, "That time is outside the trainer's working hours.")
    clash = trainer_busy(db, workspace_id, trainer_id, start, end)
    if clash:
        raise _http(409, clash)
    if member is not None and source == "member" and _covering_membership(db, member, local_day) is None:
        raise _http(403, "An active membership is required to book a session.")
    trainer = db.get(Trainer, trainer_id)
    appt = TrainingSession(
        workspace_id=workspace_id, trainer_id=trainer_id, client_id=member.id if member else None,
        title=(title or f"Personal training{' – ' + member.first_name if member else ''}")[:150],
        scheduled_at=start, duration_minutes=duration_minutes, status=SessionStatus.SCHEDULED, notes=notes,
        source=source, booked_by_user_id=actor_user_id, location=location,
    )
    db.add(appt)
    db.flush()
    if member is not None:
        safe_notify(db, member, "appointment_booked", appt.id, variables={
            "trainer_name": trainer.name if trainer else "your trainer", "when": describe_when(db, workspace_id, start)})
    return appt


def cancel_appointment(db: Session, appt: TrainingSession, actor_user_id: str, reason: str) -> TrainingSession:
    if appt.status != SessionStatus.SCHEDULED:
        raise _http(409, "Only scheduled sessions can be cancelled.")
    appt.status = SessionStatus.CANCELLED
    appt.cancelled_at, appt.cancelled_by_user_id, appt.cancel_reason = utcnow(), actor_user_id, reason[:255]
    db.flush()
    if appt.client_id:
        trainer = db.get(Trainer, appt.trainer_id)
        safe_notify(db, db.get(Member, appt.client_id), "appointment_cancelled", appt.id, variables={
            "trainer_name": trainer.name if trainer else "your trainer",
            "when": describe_when(db, appt.workspace_id, appt.scheduled_at), "reason": reason})
    return appt
