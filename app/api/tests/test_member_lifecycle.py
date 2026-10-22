from datetime import date, timedelta

import pytest
from fastapi.testclient import TestClient

from app.core.security import create_access_token, get_password_hash
from app.main import app
from app.models.member import Member, Membership, MembershipPlan, MemberStatus
from app.models.member_records import MembershipEvent
from app.models.user import User, UserRole, WorkspaceMember
from app.services import membership_lifecycle as lifecycle
from tests.conftest import TestingSessionLocal


def _register(client, slug: str):
    res = client.post("/api/v1/auth/register", json={
        "full_name": f"Owner {slug}",
        "email": f"owner.{slug}@lifecycle-gym.com",
        "password": "Password123!",
        "gym_name": f"Gym {slug}",
        "gym_phone": "+91 98888 77777",
        "gym_city": "Pune",
    })
    assert res.status_code == 201, res.text
    body = res.json()
    return {"Authorization": f"Bearer {body['access_token']}"}, body["workspace_id"]


def _staff_headers(workspace_id: str, slug: str, role: UserRole = UserRole.STAFF):
    db = TestingSessionLocal()
    try:
        user = User(email=f"{role.value.lower()}.{slug}@lifecycle-gym.com", full_name=f"{role.value} {slug}",
                    hashed_password=get_password_hash("Password123!"), is_active=True)
        db.add(user)
        db.flush()
        db.add(WorkspaceMember(workspace_id=workspace_id, user_id=user.id, role=role, is_active=True))
        db.commit()
        token = create_access_token(user.id, workspace_id=workspace_id, role=role.value)
        return {"Authorization": f"Bearer {token}"}
    finally:
        db.close()


def _create_member(client, headers, first, email, phone):
    res = client.post("/api/v1/members/", headers=headers, json={
        "first_name": first, "last_name": "Test", "email": email, "phone": phone, "password": "MemberPw123!",
    })
    assert res.status_code == 201, res.text
    return res.json()


def _member_headers(client, email):
    res = client.post("/api/v1/auth/login", json={"email": email, "password": "MemberPw123!"})
    assert res.status_code == 200, res.text
    return {"Authorization": f"Bearer {res.json()['access_token']}"}


def _plan(client, headers, name="Monthly", months=1, price=1000.0):
    res = client.post("/api/v1/memberships/plans", headers=headers,
                      json={"name": name, "duration_months": months, "price": price})
    assert res.status_code == 201, res.text
    return res.json()


@pytest.fixture(scope="module")
def gym():
    with TestClient(app) as client:
        owner, ws = _register(client, "lcalpha")
        other_owner, other_ws = _register(client, "lcbeta")
        staff = _staff_headers(ws, "lcalpha")
        member = _create_member(client, owner, "Ravi", "ravi@lifecycle-gym.com", "+919811100001")
        yield {
            "client": client, "owner": owner, "ws": ws, "staff": staff,
            "other_owner": other_owner, "other_ws": other_ws, "member": member,
            "member_headers": _member_headers(client, "ravi@lifecycle-gym.com"),
        }


# ---------- date rules ----------

def test_period_end_uses_calendar_months():
    assert lifecycle.period_end(date(2026, 1, 15), 1) == date(2026, 2, 14)
    assert lifecycle.period_end(date(2026, 1, 31), 1) == date(2026, 2, 28)
    assert lifecycle.period_end(date(2028, 1, 31), 1) == date(2028, 2, 29)
    assert lifecycle.period_end(date(2026, 3, 1), 12) == date(2027, 2, 28)
    assert lifecycle.period_end(date(2026, 11, 30), 3) == date(2027, 2, 28)


# ---------- account status ----------

def test_status_transitions_and_permissions(gym):
    c, owner, staff, mid = gym["client"], gym["owner"], gym["staff"], gym["member"]["id"]

    res = c.post(f"/api/v1/members/{mid}/status", headers=owner, json={"status": "suspended"})
    assert res.status_code == 422, "suspending requires a reason"

    res = c.post(f"/api/v1/members/{mid}/status", headers=staff, json={"status": "suspended", "reason": "Unpaid dues"})
    assert res.status_code == 403, "front-desk staff cannot suspend"

    res = c.post(f"/api/v1/members/{mid}/status", headers=owner, json={"status": "frozen", "reason": "x"})
    assert res.status_code == 422, "frozen is a membership state, not an account status"

    res = c.post(f"/api/v1/members/{mid}/status", headers=owner, json={"status": "suspended", "reason": "Unpaid dues"})
    assert res.status_code == 200, res.text
    assert res.json()["status"] == "suspended"

    # Suspended members lose workspace access.
    assert c.get("/api/v1/members/me", headers=gym["member_headers"]).status_code == 403

    res = c.post(f"/api/v1/members/{mid}/status", headers=owner, json={"status": "suspended", "reason": "again"})
    assert res.status_code == 409

    res = c.post(f"/api/v1/members/{mid}/status", headers=staff, json={"status": "active"})
    assert res.status_code == 200
    assert c.get("/api/v1/members/me", headers=gym["member_headers"]).status_code == 200

    history = c.get(f"/api/v1/members/{mid}/history?source=member", headers=owner).json()
    status_events = [h for h in history if h["event_type"] == "status_changed"]
    assert [(h["from_status"], h["to_status"]) for h in status_events] == [("suspended", "active"), ("active", "suspended")]
    assert status_events[1]["reason"] == "Unpaid dues"
    assert status_events[1]["actor_name"] == "Owner lcalpha"


def test_archived_members_hidden_from_default_directory(gym):
    c, owner = gym["client"], gym["owner"]
    m = _create_member(c, owner, "Archie", "archie@lifecycle-gym.com", "+919811100002")
    assert c.post(f"/api/v1/members/{m['id']}/status", headers=owner,
                  json={"status": "archived", "reason": "Moved city"}).status_code == 200

    default_ids = [i["id"] for i in c.get("/api/v1/members/?page_size=100", headers=owner).json()["items"]]
    assert m["id"] not in default_ids
    archived = c.get("/api/v1/members/?status=archived", headers=owner).json()
    assert archived["total"] == 1 and archived["items"][0]["id"] == m["id"]

    # Restoring from archive is a management action.
    res = c.post(f"/api/v1/members/{m['id']}/status", headers=gym["staff"], json={"status": "active"})
    assert res.status_code == 403


def test_list_total_reflects_filters_and_sorting(gym):
    c, owner = gym["client"], gym["owner"]
    _create_member(c, owner, "Zara", "zara@lifecycle-gym.com", "+919811100003")
    res = c.get("/api/v1/members/?query=zara", headers=owner).json()
    assert res["total"] == 1 and res["items"][0]["first_name"] == "Zara"
    names = [i["first_name"] for i in c.get("/api/v1/members/?sort=first_name", headers=owner).json()["items"]]
    assert names == sorted(names)
    assert c.get("/api/v1/members/?sort=hashed_password", headers=owner).status_code == 422

    plan = _plan(c, owner, "Filter Plan", 1, 800.0)
    yuki = _create_member(c, owner, "Yuki", "yuki@lifecycle-gym.com", "+919811100006")
    assert _assign(c, owner, yuki["id"], plan["id"], date(2026, 1, 15), 800.0).status_code == 201
    by_plan = c.get(f"/api/v1/members/?plan_id={plan['id']}", headers=owner).json()
    assert by_plan["total"] == 1 and by_plan["items"][0]["id"] == yuki["id"]
    assert by_plan["items"][0]["membership_end_date"] == "2026-02-14"
    assert c.get(f"/api/v1/members/?query={yuki['id']}", headers=owner).json()["total"] == 1, "search by member ID"


# ---------- notes & privacy ----------

def test_notes_are_staff_only_and_author_scoped(gym):
    c, owner, staff, mid = gym["client"], gym["owner"], gym["staff"], gym["member"]["id"]
    note = c.post(f"/api/v1/members/{mid}/notes", headers=owner, json={"body": "Knee injury — avoid squats"})
    assert note.status_code == 201, note.text
    note_id = note.json()["id"]
    assert note.json()["author_name"] == "Owner lcalpha"

    assert c.get(f"/api/v1/members/{mid}/notes", headers=staff).status_code == 200
    assert c.put(f"/api/v1/members/{mid}/notes/{note_id}", headers=staff, json={"body": "edited"}).status_code == 403
    assert c.delete(f"/api/v1/members/{mid}/notes/{note_id}", headers=staff).status_code == 403
    assert c.put(f"/api/v1/members/{mid}/notes/{note_id}", headers=owner, json={"body": "Knee injury (left)"}).status_code == 200

    member_h = gym["member_headers"]
    assert c.get(f"/api/v1/members/{mid}/notes", headers=member_h).status_code == 403
    assert c.get(f"/api/v1/members/{mid}/history", headers=member_h).status_code == 403
    assert c.get(f"/api/v1/members/{mid}", headers=member_h).status_code == 403
    assert c.get("/api/v1/members/", headers=member_h).status_code == 403
    assert c.get("/api/v1/members/export-csv", headers=member_h).status_code == 403
    assert c.get("/api/v1/members/export-csv", headers=staff).status_code == 403
    me = c.get("/api/v1/members/me", headers=member_h).json()
    assert "notes" not in me and me["id"] == mid

    other = gym["other_owner"]
    assert c.get(f"/api/v1/members/{mid}/notes", headers=other).status_code == 404
    assert c.post(f"/api/v1/members/{mid}/notes", headers=other, json={"body": "x"}).status_code == 404
    assert c.delete(f"/api/v1/members/{mid}/notes/{note_id}", headers=other).status_code == 404


def test_self_service_updates_only_permitted_fields(gym):
    c, member_h = gym["client"], gym["member_headers"]
    res = c.put("/api/v1/members/me", headers=member_h, json={"emergency_contact": "Asha +919800000000"})
    assert res.status_code == 200 and res.json()["emergency_contact"] == "Asha +919800000000"
    res = c.put("/api/v1/members/me", headers=member_h, json={"status": "active", "first_name": "Hacker"})
    assert res.status_code == 200 and res.json()["first_name"] == "Ravi", "identity/status fields are ignored"

    # A staff account with no member profile gets a clear 404, not someone else's record.
    assert c.get("/api/v1/members/me", headers=gym["staff"]).status_code == 404


# ---------- membership lifecycle ----------

def _assign(c, headers, member_id, plan_id, start, price=1000.0):
    return c.post("/api/v1/memberships/", headers=headers, json={
        "member_id": member_id, "plan_id": plan_id, "start_date": start.isoformat(), "price_paid": price,
    })


def test_assignment_freeze_extend_cancel_flow(gym):
    c, owner, staff = gym["client"], gym["owner"], gym["staff"]
    m = _create_member(c, owner, "Freya", "freya@lifecycle-gym.com", "+919811100004")
    plan = _plan(c, owner, "Quarterly", 3, 2700.0)
    today = date.today()

    res = _assign(c, owner, m["id"], plan["id"], today, 2500.0)
    assert res.status_code == 201, res.text
    ms = res.json()
    assert ms["end_date"] == lifecycle.period_end(today, 3).isoformat()
    assert _assign(c, owner, m["id"], plan["id"], today + timedelta(days=5)).status_code == 409, "no overlapping periods"

    detail = c.get(f"/api/v1/memberships/{ms['id']}", headers=staff).json()
    assert detail["payment_status"] == "unpaid", "assignment never implies payment"
    assert detail["balance_due"] == 2500.0

    # Plan edits don't rewrite history.
    c.put(f"/api/v1/memberships/plans/{plan['id']}", headers=owner, json={"price": 9999.0})
    assert c.get(f"/api/v1/memberships/{ms['id']}", headers=staff).json()["price_paid"] == 2500.0

    # Freeze rules
    bad = c.post(f"/api/v1/memberships/{ms['id']}/freeze", headers=staff,
                 json={"start_date": today.isoformat(), "end_date": today.isoformat()})
    assert bad.status_code == 422
    too_long = c.post(f"/api/v1/memberships/{ms['id']}/freeze", headers=staff,
                      json={"start_date": today.isoformat(), "end_date": (today + timedelta(days=91)).isoformat()})
    assert too_long.status_code == 409
    res = c.post(f"/api/v1/memberships/{ms['id']}/freeze", headers=staff, json={
        "start_date": today.isoformat(), "end_date": (today + timedelta(days=10)).isoformat(), "reason": "Travel"})
    assert res.status_code == 200, res.text
    assert res.json()["status"] == "frozen"
    again = c.post(f"/api/v1/memberships/{ms['id']}/freeze", headers=staff, json={
        "start_date": today.isoformat(), "end_date": (today + timedelta(days=3)).isoformat()})
    assert again.status_code == 409

    # Renewal of a frozen membership is refused with a reason.
    assert c.post(f"/api/v1/memberships/{ms['id']}/renew", headers=staff, json={}).status_code == 409

    res = c.post(f"/api/v1/memberships/{ms['id']}/unfreeze", headers=staff)
    assert res.status_code == 200 and res.json()["status"] == "active"

    # Extension
    assert c.post(f"/api/v1/memberships/{ms['id']}/extend", headers=staff, json={"days": 0, "reason": "x"}).status_code == 422
    res = c.post(f"/api/v1/memberships/{ms['id']}/extend", headers=staff, json={"days": 7, "reason": "Gym closed for repairs"})
    assert res.status_code == 200
    assert res.json()["end_date"] == (lifecycle.period_end(today, 3) + timedelta(days=7)).isoformat()

    # Cancel: management only, reason required, terminal.
    assert c.post(f"/api/v1/memberships/{ms['id']}/cancel", headers=staff, json={"reason": "Request"}).status_code == 403
    res = c.post(f"/api/v1/memberships/{ms['id']}/cancel", headers=owner, json={"reason": "Member request"})
    assert res.status_code == 200 and res.json()["status"] == "cancelled"
    assert c.post(f"/api/v1/memberships/{ms['id']}/extend", headers=owner, json={"days": 5, "reason": "x"}).status_code == 409

    events = [e["event_type"] for e in c.get(f"/api/v1/memberships/{ms['id']}", headers=owner).json()["events"]]
    assert set(events) >= {"assigned", "frozen", "unfrozen", "extended", "cancelled"}

    # Other tenants and members can't touch it.
    assert c.post(f"/api/v1/memberships/{ms['id']}/extend", headers=gym["other_owner"],
                  json={"days": 5, "reason": "x"}).status_code == 404
    assert c.get(f"/api/v1/memberships/{ms['id']}", headers=gym["member_headers"]).status_code == 403
    assert c.get("/api/v1/memberships/expiring", headers=gym["member_headers"]).status_code == 403


def test_renewal_after_current_preserves_previous_period(gym):
    c, owner = gym["client"], gym["owner"]
    m = _create_member(c, owner, "Rena", "rena@lifecycle-gym.com", "+919811100005")
    plan = _plan(c, owner, "Monthly Renew", 1, 1200.0)
    today = date.today()
    first = _assign(c, owner, m["id"], plan["id"], today, 1200.0).json()

    res = c.post(f"/api/v1/memberships/{first['id']}/renew", headers=owner, json={"mode": "after_current"})
    assert res.status_code == 201, res.text
    renewed = res.json()
    first_end = date.fromisoformat(first["end_date"])
    assert renewed["start_date"] == (first_end + timedelta(days=1)).isoformat()
    assert renewed["effective_status"] == "scheduled"

    prior = c.get(f"/api/v1/memberships/{first['id']}", headers=owner).json()
    assert prior["status"] == "active" and prior["end_date"] == first["end_date"], "old period untouched"
    assert c.post(f"/api/v1/memberships/{first['id']}/renew", headers=owner,
                  json={"mode": "sideways"}).status_code == 422


def test_daily_run_is_idempotent_and_keeps_account_status():
    db = TestingSessionLocal()
    try:
        ws_id = "ws-lifecycle-job"
        member = Member(workspace_id=ws_id, first_name="Old", joined_date=date(2025, 1, 1), status=MemberStatus.ACTIVE)
        plan = MembershipPlan(workspace_id=ws_id, name="Job Plan", duration_months=1, price=500.0)
        db.add_all([member, plan])
        db.flush()
        expired = lifecycle.assign_membership(db, member, plan, date(2026, 1, 1), 500.0, None)
        future = Member(workspace_id=ws_id, first_name="Frozen", joined_date=date(2025, 1, 1), status=MemberStatus.ACTIVE)
        db.add(future)
        db.flush()
        frozen = lifecycle.assign_membership(db, future, plan, date(2026, 3, 1), 500.0, None)
        lifecycle.freeze_membership(db, frozen, date(2026, 3, 5), date(2026, 3, 15), "Exams", None, today=date(2026, 3, 2))
        db.commit()

        r1 = lifecycle.run_due_transitions(db, ws_id, today=date(2026, 3, 6))
        assert r1["expired"] == 1 and r1["freezes_started"] == 1
        assert frozen.status == MemberStatus.FROZEN

        r2 = lifecycle.run_due_transitions(db, ws_id, today=date(2026, 3, 6))
        assert r2 == {**r1, "expired": 0, "freezes_started": 0}

        original_end = frozen.end_date
        r3 = lifecycle.run_due_transitions(db, ws_id, today=date(2026, 3, 20))
        assert r3["freezes_resumed"] == 1
        assert frozen.status == MemberStatus.ACTIVE
        assert frozen.end_date == original_end + timedelta(days=10)

        db.commit()
        assert expired.status == MemberStatus.EXPIRED
        assert member.status == MemberStatus.ACTIVE, "membership expiry must not change the account status"
        expired_events = db.query(MembershipEvent).filter(
            MembershipEvent.membership_id == expired.id, MembershipEvent.event_type == "expired").count()
        assert expired_events == 1
    finally:
        db.close()
