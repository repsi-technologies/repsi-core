"""Class sessions, bookings, waitlists, credits, appointments and trainer availability."""
from datetime import date, datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient

from app.core.security import create_access_token, get_password_hash
from app.main import app
from app.models.member import Member, MemberStatus, Membership, MembershipPlan
from app.models.user import User, UserRole, WorkspaceMember
from tests.conftest import TestingSessionLocal
from tests.factories import make_gym

client = TestClient(app)
API = "/api/v1"


@pytest.fixture
def gym():
    return make_gym("Booking Gym")


def add_member_account(gym, first="Second", membership=True, class_credits=None):
    """Another member with an app login and (optionally) a membership on a plan with class credits."""
    db = TestingSessionLocal()
    try:
        import uuid
        tag = uuid.uuid4().hex[:6]
        u = User(email=f"{first.lower()}.{tag}@example.com", full_name=first, hashed_password=get_password_hash("x" * 10),
                 is_active=True)
        db.add(u)
        db.flush()
        db.add(WorkspaceMember(workspace_id=gym.id, user_id=u.id, role=UserRole.USER, is_active=True))
        m = Member(workspace_id=gym.id, user_id=u.id, first_name=first, last_name="Test", email=u.email,
                   status=MemberStatus.ACTIVE, joined_date=date.today())
        db.add(m)
        db.flush()
        if membership:
            plan = MembershipPlan(workspace_id=gym.id, name=f"Plan {tag}", duration_months=1, price=999.0,
                                  class_credits=class_credits)
            db.add(plan)
            db.flush()
            db.add(Membership(workspace_id=gym.id, member_id=m.id, plan_id=plan.id, start_date=date.today() - timedelta(days=1),
                              end_date=date.today() + timedelta(days=29), status=MemberStatus.ACTIVE, price_paid=999.0))
        db.commit()
        return m.id, {"Authorization": f"Bearer {create_access_token(u.id, gym.id, 'USER')}"}
    finally:
        db.close()


def make_class(gym, capacity=2, **extra):
    res = client.post(f"{API}/classes/", headers=gym.headers["OWNER"], json={
        "name": "Spin", "schedule": "Daily", "capacity": capacity, "trainer_id": gym.trainer_id, **extra})
    assert res.status_code == 201, res.text
    return res.json()


def make_session(gym, class_id, hours_ahead=24, **extra):
    starts = (datetime.now(timezone.utc) + timedelta(hours=hours_ahead)).replace(microsecond=0)
    res = client.post(f"{API}/classes/{class_id}/sessions", headers=gym.headers["OWNER"],
                      json={"starts_at": starts.isoformat(), **extra})
    assert res.status_code == 201, res.text
    return res.json()[0]


def test_only_class_managers_create_classes(gym):
    body = {"name": "Yoga", "schedule": "Mon"}
    for role in ("USER", "TRAINER", "STAFF"):
        assert client.post(f"{API}/classes/", headers=gym.headers[role], json=body).status_code == 403
    assert client.post(f"{API}/classes/", headers=gym.headers["MANAGER"], json=body).status_code == 201


def test_booking_fills_then_waitlists_and_cancellation_promotes(gym):
    c = make_class(gym, capacity=1)
    s = make_session(gym, c["id"])
    first = client.post(f"{API}/classes/sessions/{s['id']}/book", headers=gym.headers["USER"], json={})
    assert first.status_code == 201, first.text
    assert first.json()["status"] == "booked"

    second_id, second_headers = add_member_account(gym)
    waitlisted = client.post(f"{API}/classes/sessions/{s['id']}/book", headers=second_headers, json={})
    assert waitlisted.json()["status"] == "waitlisted" and waitlisted.json()["waitlist_position"] == 1

    dup = client.post(f"{API}/classes/sessions/{s['id']}/book", headers=gym.headers["USER"], json={})
    assert dup.status_code == 409

    cancel = client.post(f"{API}/classes/bookings/{first.json()['id']}/cancel", headers=gym.headers["USER"], json={})
    assert cancel.status_code == 200 and cancel.json()["status"] == "cancelled"

    mine = client.get(f"{API}/classes/my-bookings", headers=second_headers).json()
    assert mine[0]["status"] == "booked"  # promoted from the waitlist

    roster = client.get(f"{API}/classes/sessions/{s['id']}/bookings", headers=gym.headers["STAFF"]).json()
    assert {b["status"] for b in roster} == {"booked", "cancelled"}  # history kept


def test_capacity_increase_promotes_waitlist(gym):
    c = make_class(gym, capacity=1)
    s = make_session(gym, c["id"])
    client.post(f"{API}/classes/sessions/{s['id']}/book", headers=gym.headers["USER"], json={})
    _, other = add_member_account(gym)
    client.post(f"{API}/classes/sessions/{s['id']}/book", headers=other, json={})
    res = client.patch(f"{API}/classes/sessions/{s['id']}", headers=gym.headers["OWNER"], json={"capacity": 2})
    assert res.status_code == 200 and res.json()["booked"] == 2 and res.json()["waitlisted"] == 0


def test_member_without_membership_cannot_book_but_staff_can_override(gym):
    c = make_class(gym)
    s = make_session(gym, c["id"])
    member_id, headers = add_member_account(gym, "Nomember", membership=False)
    assert client.post(f"{API}/classes/sessions/{s['id']}/book", headers=headers, json={}).status_code == 403
    staff = client.post(f"{API}/classes/sessions/{s['id']}/book", headers=gym.headers["STAFF"],
                        json={"member_id": member_id, "override_rules": True})
    assert staff.status_code == 201, staff.text


def test_class_credits_are_enforced(gym):
    _, headers = add_member_account(gym, "Credit", class_credits=1)
    c = make_class(gym, capacity=5)
    s1, s2 = make_session(gym, c["id"], 24), make_session(gym, c["id"], 48)
    assert client.post(f"{API}/classes/sessions/{s1['id']}/book", headers=headers, json={}).status_code == 201
    res = client.post(f"{API}/classes/sessions/{s2['id']}/book", headers=headers, json={})
    assert res.status_code == 403 and "credits" in res.json()["detail"]


def test_booking_window_and_late_cancel(gym):
    c = make_class(gym, booking_open_hours=24, cancel_cutoff_hours=6)
    far = make_session(gym, c["id"], hours_ahead=72)
    assert client.post(f"{API}/classes/sessions/{far['id']}/book", headers=gym.headers["USER"], json={}).status_code == 409
    soon = make_session(gym, c["id"], hours_ahead=2)
    b = client.post(f"{API}/classes/sessions/{soon['id']}/book", headers=gym.headers["USER"], json={}).json()
    cancelled = client.post(f"{API}/classes/bookings/{b['id']}/cancel", headers=gym.headers["USER"], json={}).json()
    assert cancelled["late_cancel"] is True


def test_cancelling_a_session_cancels_bookings_and_notifies(gym):
    c = make_class(gym)
    s = make_session(gym, c["id"])
    client.post(f"{API}/classes/sessions/{s['id']}/book", headers=gym.headers["USER"], json={})
    res = client.post(f"{API}/classes/sessions/{s['id']}/cancel", headers=gym.headers["OWNER"], json={"reason": "Trainer sick"})
    assert res.json()["bookings_cancelled"] == 1
    notes = client.get(f"{API}/notifications", headers=gym.headers["USER"]).json()
    titles = [n["title"] for n in notes.get("items", notes)]
    assert any("cancelled" in t.lower() for t in titles)


def test_member_cannot_touch_other_members_bookings(gym):
    c = make_class(gym)
    s = make_session(gym, c["id"])
    b = client.post(f"{API}/classes/sessions/{s['id']}/book", headers=gym.headers["USER"], json={}).json()
    _, other = add_member_account(gym)
    assert client.post(f"{API}/classes/bookings/{b['id']}/cancel", headers=other, json={}).status_code == 404
    assert client.get(f"{API}/classes/sessions/{s['id']}/bookings", headers=other).status_code == 403


def test_trainer_checks_in_own_session(gym):
    c = make_class(gym)
    s = make_session(gym, c["id"])
    b = client.post(f"{API}/classes/sessions/{s['id']}/book", headers=gym.headers["USER"], json={}).json()
    res = client.post(f"{API}/classes/bookings/{b['id']}/check-in", headers=gym.headers["TRAINER"])
    assert res.status_code == 200 and res.json()["status"] == "attended"


def test_bookings_are_tenant_isolated(gym):
    other = make_gym("Other Booking Gym")
    c = make_class(gym)
    s = make_session(gym, c["id"])
    assert client.post(f"{API}/classes/sessions/{s['id']}/book", headers=other.headers["USER"], json={}).status_code == 404
    assert client.get(f"{API}/classes/sessions", headers=other.headers["OWNER"]).json() == []


def test_recurring_series(gym):
    c = make_class(gym)
    start = date.today() + timedelta(days=1)
    res = client.post(f"{API}/classes/{c['id']}/sessions", headers=gym.headers["OWNER"], json={
        "weekdays": [0, 2, 4], "start_time": "07:00", "from_date": start.isoformat(),
        "until_date": (start + timedelta(days=13)).isoformat(), "trainer_id": gym.trainer_id})
    assert res.status_code == 201, res.text
    assert 5 <= len(res.json()) <= 7 and len({s["series_id"] for s in res.json()}) == 1


# ─── Appointments ──────────────────────────────────────────────────────


def next_weekday(weekday: int) -> date:
    d = date.today() + timedelta(days=1)
    while d.weekday() != weekday:
        d += timedelta(days=1)
    return d


def test_availability_slots_and_booking(gym):
    put = client.put(f"{API}/appointments/availability/{gym.trainer_id}", headers=gym.headers["TRAINER"],
                     json={"slots": [{"weekday": 1, "start_time": "09:00", "end_time": "12:00"}]})
    assert put.status_code == 200, put.text
    # Another role can't change a trainer's availability without schedules.manage.
    assert client.put(f"{API}/appointments/availability/{gym.trainer_id}", headers=gym.headers["STAFF"],
                      json={"slots": []}).status_code == 403

    day = next_weekday(1)
    slots = client.get(f"{API}/appointments/slots", params={"trainer_id": gym.trainer_id, "day": day.isoformat()},
                       headers=gym.headers["USER"]).json()["slots"]
    assert len(slots) == 5  # 09:00, 09:30, 10:00, 10:30, 11:00 for 60-minute sessions

    booked = client.post(f"{API}/appointments", headers=gym.headers["USER"], json={
        "trainer_id": gym.trainer_id, "starts_at": slots[0], "duration_minutes": 60})
    assert booked.status_code == 201, booked.text
    clash = client.post(f"{API}/appointments", headers=gym.headers["USER"], json={
        "trainer_id": gym.trainer_id, "starts_at": slots[1], "duration_minutes": 60})
    assert clash.status_code == 409
    outside = client.post(f"{API}/appointments", headers=gym.headers["USER"], json={
        "trainer_id": gym.trainer_id, "starts_at": f"{day.isoformat()}T15:00:00", "duration_minutes": 60})
    assert outside.status_code == 409

    mine = client.get(f"{API}/appointments", headers=gym.headers["USER"], params={"end": (day + timedelta(days=1)).isoformat()}).json()
    assert [a["id"] for a in mine] == [booked.json()["id"]]
    cancel = client.post(f"{API}/appointments/{booked.json()['id']}/cancel", headers=gym.headers["USER"], json={"reason": "Travel"})
    assert cancel.status_code == 200 and cancel.json()["status"] == "CANCELLED"


def test_time_off_blocks_booking(gym):
    day = next_weekday(3)
    client.put(f"{API}/appointments/availability/{gym.trainer_id}", headers=gym.headers["TRAINER"],
               json={"slots": [{"weekday": 3, "start_time": "08:00", "end_time": "18:00"}]})
    off = client.post(f"{API}/appointments/time-off", headers=gym.headers["TRAINER"],
                      json={"trainer_id": gym.trainer_id, "starts_on": day.isoformat(), "ends_on": day.isoformat()})
    assert off.status_code == 201
    res = client.post(f"{API}/appointments", headers=gym.headers["STAFF"], json={
        "trainer_id": gym.trainer_id, "member_id": gym.member_id, "starts_at": f"{day.isoformat()}T10:00:00"})
    assert res.status_code == 409 and "leave" in res.json()["detail"]


def test_calendar_combines_classes_and_appointments(gym):
    c = make_class(gym)
    make_session(gym, c["id"], hours_ahead=26)
    events = client.get(f"{API}/classes/calendar", headers=gym.headers["OWNER"],
                        params={"end": (date.today() + timedelta(days=3)).isoformat()}).json()
    assert any(e["type"] == "class" for e in events)
    trainer_view = client.get(f"{API}/classes/calendar", headers=gym.headers["TRAINER"]).json()
    assert all(e["trainer_id"] == gym.trainer_id for e in trainer_view)
