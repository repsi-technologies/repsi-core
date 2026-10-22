from datetime import date, datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.exc import IntegrityError

from app.core.security import create_access_token, get_password_hash
from app.main import app
from app.models.attendance import Attendance, AttendanceMethod
from app.models.member import Member, MemberStatus
from app.models.trainer import Trainer, TrainerStatus, TrainingSession
from app.models.user import User, UserRole, WorkspaceMember
from app.services import member_pass
from tests.conftest import TestingSessionLocal

TODAY = date.today()


def _register(client, slug):
    res = client.post("/api/v1/auth/register", json={
        "full_name": f"Owner {slug}", "email": f"owner.{slug}@access-gym.com", "password": "Password123!",
        "gym_name": f"Gym {slug}", "gym_phone": "+91 97777 66666", "gym_city": "Chennai",
    })
    assert res.status_code == 201, res.text
    body = res.json()
    return {"Authorization": f"Bearer {body['access_token']}"}, body["workspace_id"]


def _staff(ws_id, slug, role):
    db = TestingSessionLocal()
    try:
        user = User(email=f"{role.value.lower()}.{slug}@access-gym.com", full_name=f"{role.value.title()} {slug}",
                    hashed_password=get_password_hash("Password123!"), is_active=True)
        db.add(user)
        db.flush()
        wm = WorkspaceMember(workspace_id=ws_id, user_id=user.id, role=role, is_active=True)
        db.add(wm)
        db.commit()
        return {"Authorization": f"Bearer {create_access_token(user.id, workspace_id=ws_id, role=role.value)}"}, wm.id, user.id
    finally:
        db.close()


def _member(client, owner, first, email, phone, with_plan=True):
    res = client.post("/api/v1/members/", headers=owner, json={
        "first_name": first, "last_name": "Visitor", "email": email, "phone": phone, "password": "MemberPw123!",
    })
    assert res.status_code == 201, res.text
    m = res.json()
    if with_plan:
        plan = client.post("/api/v1/memberships/plans", headers=owner,
                           json={"name": f"Plan {first}", "duration_months": 1, "price": 1000.0}).json()
        ms = client.post("/api/v1/memberships/", headers=owner, json={
            "member_id": m["id"], "plan_id": plan["id"], "start_date": (TODAY - timedelta(days=1)).isoformat(),
            "price_paid": 1000.0,
        })
        assert ms.status_code == 201, ms.text
        m["membership_id"] = ms.json()["id"]
    return m


def _login(client, email):
    res = client.post("/api/v1/auth/login", json={"email": email, "password": "MemberPw123!"})
    assert res.status_code == 200, res.text
    return {"Authorization": f"Bearer {res.json()['access_token']}"}


def _checkin(client, headers, **body):
    return client.post("/api/v1/attendance/check-in", headers=headers, json={"method": "manual", **body})


def _backdate_checkout(attendance_id, minutes=5):
    """Close a visit in the past so the 30-second re-entry guard doesn't interfere."""
    db = TestingSessionLocal()
    try:
        rec = db.query(Attendance).filter(Attendance.id == attendance_id).first()
        rec.check_in_time = datetime.now(timezone.utc) - timedelta(minutes=minutes + 30)
        rec.check_out_time = datetime.now(timezone.utc) - timedelta(minutes=minutes)
        rec.status = "CHECKED_OUT"
        db.commit()
    finally:
        db.close()


@pytest.fixture(scope="module")
def gym():
    with TestClient(app) as client:
        owner, ws = _register(client, "acalpha")
        other_owner, other_ws = _register(client, "acbeta")
        staff, staff_wm, _ = _staff(ws, "acalpha", UserRole.STAFF)
        manager, manager_wm, _ = _staff(ws, "acalpha", UserRole.MANAGER)
        admin, admin_wm, _ = _staff(ws, "acalpha", UserRole.ADMIN)
        member = _member(client, owner, "Meera", "meera@access-gym.com", "+919822200001")
        yield {
            "client": client, "owner": owner, "ws": ws, "other_owner": other_owner, "other_ws": other_ws,
            "staff": staff, "staff_wm": staff_wm, "manager": manager, "manager_wm": manager_wm,
            "admin": admin, "admin_wm": admin_wm, "member": member,
            "member_h": _login(client, "meera@access-gym.com"),
        }


# ---------- eligibility ----------

def test_membership_states_control_access(gym):
    c, owner, staff = gym["client"], gym["owner"], gym["staff"]

    no_plan = _member(c, owner, "Nopl", "nopl@access-gym.com", "+919822200002", with_plan=False)
    res = _checkin(c, staff, member_id=no_plan["id"])
    assert res.status_code == 403 and "no membership" in res.json()["detail"].lower()

    frozen = _member(c, owner, "Froz", "froz@access-gym.com", "+919822200003")
    assert c.post(f"/api/v1/memberships/{frozen['membership_id']}/freeze", headers=owner, json={
        "start_date": TODAY.isoformat(), "end_date": (TODAY + timedelta(days=5)).isoformat()}).status_code == 200
    res = _checkin(c, staff, member_id=frozen["id"])
    assert res.status_code == 403 and "frozen" in res.json()["detail"].lower()

    cancelled = _member(c, owner, "Canc", "canc@access-gym.com", "+919822200004")
    c.post(f"/api/v1/memberships/{cancelled['membership_id']}/cancel", headers=owner, json={"reason": "Left"})
    res = _checkin(c, staff, member_id=cancelled["id"])
    assert res.status_code == 403 and "cancelled" in res.json()["detail"].lower()

    suspended = _member(c, owner, "Susp", "susp@access-gym.com", "+919822200005")
    c.post(f"/api/v1/members/{suspended['id']}/status", headers=owner, json={"status": "suspended", "reason": "Conduct"})
    res = _checkin(c, staff, member_id=suspended["id"])
    assert res.status_code == 403 and "suspended" in res.json()["detail"].lower()

    # Eligibility preview explains the decision and whether it can be overridden.
    prev = c.get(f"/api/v1/attendance/eligibility?member_id={frozen['id']}", headers=staff).json()
    assert prev["decision"]["code"] == "MEMBERSHIP_FROZEN" and prev["decision"]["overridable"] is True
    assert prev["can_override"] is False
    prev = c.get(f"/api/v1/attendance/eligibility?member_id={suspended['id']}", headers=gym["manager"]).json()
    assert prev["decision"]["code"] == "ACCOUNT_SUSPENDED" and prev["decision"]["overridable"] is False
    assert prev["can_override"] is True


def test_expired_membership_and_grace_period(gym):
    c, owner, staff = gym["client"], gym["owner"], gym["staff"]
    m = _member(c, owner, "Expi", "expi@access-gym.com", "+919822200006", with_plan=False)
    plan = c.post("/api/v1/memberships/plans", headers=owner, json={"name": "Old", "duration_months": 1, "price": 900}).json()
    c.post("/api/v1/memberships/", headers=owner, json={
        "member_id": m["id"], "plan_id": plan["id"], "start_date": (TODAY - timedelta(days=40)).isoformat(), "price_paid": 900})
    res = _checkin(c, staff, member_id=m["id"])
    assert res.status_code == 403 and "expired" in res.json()["detail"].lower()

    assert c.put("/api/v1/attendance/settings", headers=owner, json={"expiry_grace_days": 15}).status_code == 200
    try:
        res = _checkin(c, staff, member_id=m["id"])
        assert res.status_code == 201, res.text
        c.post("/api/v1/attendance/check-out", headers=staff, json={"attendance_id": res.json()["id"]})
    finally:
        c.put("/api/v1/attendance/settings", headers=owner, json={"expiry_grace_days": 0})


def test_overrides_require_permission_and_are_recorded(gym):
    c, owner, staff, manager = gym["client"], gym["owner"], gym["staff"], gym["manager"]
    m = _member(c, owner, "Over", "over@access-gym.com", "+919822200007", with_plan=False)

    assert _checkin(c, staff, member_id=m["id"], override_reason="Trial day").status_code == 403
    res = _checkin(c, manager, member_id=m["id"], override_reason="Complimentary trial day")
    assert res.status_code == 201, res.text
    rec = res.json()
    assert rec["override_reason"] == "Complimentary trial day" and rec["recorded_by_user_id"]

    logs = c.get("/api/v1/audit-logs?action=attendance.override", headers=owner).json()
    assert any(i["resource_id"] == rec["id"] and i["details"]["denial_code"] == "NO_MEMBERSHIP" for i in logs["items"])

    # Suspended accounts can't be overridden at the desk.
    s = _member(c, owner, "Nooverride", "noov@access-gym.com", "+919822200008")
    c.post(f"/api/v1/members/{s['id']}/status", headers=owner, json={"status": "suspended", "reason": "x"})
    res = _checkin(c, manager, member_id=s["id"], override_reason="please")
    assert res.status_code == 403 and "can't be overridden" in res.json()["detail"]


def test_daily_visit_limit(gym):
    c, owner, staff = gym["client"], gym["owner"], gym["staff"]
    m = _member(c, owner, "Daily", "daily@access-gym.com", "+919822200009")
    c.put("/api/v1/attendance/settings", headers=owner, json={"max_visits_per_day": 1})
    try:
        first = _checkin(c, staff, member_id=m["id"])
        assert first.status_code == 201
        _backdate_checkout(first.json()["id"], minutes=1)
        second = _checkin(c, staff, member_id=m["id"])
        assert second.status_code == 403 and "daily limit" in second.json()["detail"].lower()
    finally:
        c.put("/api/v1/attendance/settings", headers=owner, json={"max_visits_per_day": 0})


# ---------- self service & endpoint authorization ----------

def test_member_self_service_is_limited_to_own_record(gym):
    c, owner, member_h, me = gym["client"], gym["owner"], gym["member_h"], gym["member"]
    other = _member(c, owner, "Other", "other@access-gym.com", "+919822200010")

    res = _checkin(c, member_h, member_id=other["id"])
    assert res.status_code == 400 and "entrance" in res.json()["detail"], "members must scan the gym QR"

    qr = c.get("/api/v1/attendance/qr", headers=owner).json()["token"]
    res = c.post("/api/v1/attendance/check-in", headers=member_h,
                 json={"member_id": other["id"], "qr_token": qr, "method": "qr"})
    assert res.status_code == 201
    assert res.json()["member_id"] == me["id"], "a member can only ever check themselves in"

    own = c.get("/api/v1/attendance/", headers=member_h).json()
    assert own and all(r["member_id"] == me["id"] for r in own)

    staff_rec = _checkin(c, gym["staff"], member_id=other["id"]).json()
    assert c.post("/api/v1/attendance/check-out", headers=member_h,
                  json={"attendance_id": staff_rec["id"]}).status_code == 404, "can't close someone else's visit"
    assert c.post("/api/v1/attendance/check-out", headers=member_h, json={}).status_code == 200

    for method, path in [
        ("get", "/api/v1/attendance/qr"), ("get", "/api/v1/attendance/history"),
        ("get", "/api/v1/attendance/export-csv"), ("get", "/api/v1/attendance/currently-inside"),
        ("get", "/api/v1/attendance/analytics"), ("post", "/api/v1/attendance/qr/generate"),
        ("get", f"/api/v1/attendance/member/{other['id']}"), ("get", "/api/v1/audit-logs"),
    ]:
        kwargs = {"json": {}} if method == "post" else {}
        assert getattr(c, method)(path, headers=member_h, **kwargs).status_code == 403, path
    assert c.put("/api/v1/attendance/settings", headers=member_h, json={"max_visits_per_day": 9}).status_code == 403
    assert c.put("/api/v1/attendance/settings", headers=gym["staff"], json={"max_visits_per_day": 9}).status_code == 403


def test_cross_tenant_attendance_is_rejected(gym):
    c, other_owner, me = gym["client"], gym["other_owner"], gym["member"]
    assert _checkin(c, other_owner, member_id=me["id"]).status_code == 404
    assert c.get(f"/api/v1/attendance/eligibility?member_id={me['id']}", headers=other_owner).status_code == 404
    rec = c.get(f"/api/v1/attendance/history?member_id={me['id']}", headers=other_owner).json()
    assert rec == []


# ---------- signed member passes ----------

def test_signed_member_pass_scan_and_replay(gym):
    c, owner, staff = gym["client"], gym["owner"], gym["staff"]
    m = _member(c, owner, "Passy", "passy@access-gym.com", "+919822200011")
    m_h = _login(c, "passy@access-gym.com")

    issued = c.get("/api/v1/attendance/member/me/pass", headers=m_h).json()
    token = issued["token"]
    assert token.startswith("rpass1.") and "passy" not in token.lower()

    res = c.post("/api/v1/attendance/scan-qr", headers=staff, json={"identifier": token, "method": "qr"})
    assert res.status_code == 200 and res.json()["action"] == "check_in", res.text
    att_id = res.json()["record"]["id"]
    _backdate_checkout(att_id)

    replay = _checkin(c, staff, identifier=token)
    assert replay.status_code == 409 and "already used" in replay.json()["detail"]

    tampered = token[:-3] + ("AAA" if not token.endswith("AAA") else "BBB")
    assert _checkin(c, staff, identifier=tampered).status_code == 400

    expired = member_pass.issue_pass(m["id"], gym["ws"], now=1_000_000)["token"]
    res = _checkin(c, staff, identifier=expired)
    assert res.status_code == 400 and "expired" in res.json()["detail"]

    foreign = member_pass.issue_pass(m["id"], gym["other_ws"])["token"]
    assert _checkin(c, staff, identifier=foreign).status_code == 400


def test_repeated_invalid_scans_are_rate_limited(gym):
    c = gym["client"]
    scanner, _, _ = _staff(gym["ws"], "acscanner", UserRole.STAFF)
    codes = [c.post("/api/v1/attendance/scan-qr", headers=scanner,
                    json={"identifier": f"rpass1.bogus{i}.sig", "method": "qr"}).status_code for i in range(12)]
    assert codes[:10] == [400] * 10 and codes[-1] == 429


# ---------- duplicates, concurrency, check-out ----------

def test_duplicate_and_invalid_checkouts(gym):
    c, owner, staff = gym["client"], gym["owner"], gym["staff"]
    m = _member(c, owner, "Dupe", "dupe@access-gym.com", "+919822200012")
    first = _checkin(c, staff, member_id=m["id"])
    assert first.status_code == 201
    assert _checkin(c, staff, member_id=m["id"]).status_code == 400

    out = c.post("/api/v1/attendance/check-out", headers=staff, json={"attendance_id": first.json()["id"]})
    assert out.status_code == 200 and out.json()["checked_out_by_user_id"]
    again = c.post("/api/v1/attendance/check-out", headers=staff, json={"attendance_id": first.json()["id"]})
    assert again.status_code == 409
    assert c.post("/api/v1/attendance/check-out", headers=staff, json={"member_id": m["id"]}).status_code == 404


def test_database_rejects_two_open_visits(gym):
    """Simulates two requests that both passed the 'already inside?' check at the same moment."""
    m = _member(gym["client"], gym["owner"], "Race", "race@access-gym.com", "+919822200013")
    db = TestingSessionLocal()
    try:
        db.add(Attendance(workspace_id=gym["ws"], member_id=m["id"], method=AttendanceMethod.MANUAL))
        db.commit()
        db.add(Attendance(workspace_id=gym["ws"], member_id=m["id"], method=AttendanceMethod.MANUAL))
        with pytest.raises(IntegrityError):
            db.commit()
        db.rollback()
        db.query(Attendance).filter(Attendance.member_id == m["id"]).delete()
        db.commit()
    finally:
        db.close()


# ---------- corrections & history ----------

def test_corrections_are_permissioned_validated_and_audited(gym):
    c, owner, staff, manager = gym["client"], gym["owner"], gym["staff"], gym["manager"]
    m = _member(c, owner, "Corr", "corr@access-gym.com", "+919822200014")
    rec = _checkin(c, staff, member_id=m["id"]).json()

    now = datetime.now(timezone.utc)
    body = {"reason": "Forgot to check out", "check_in_time": (now - timedelta(hours=2)).isoformat(),
            "check_out_time": (now - timedelta(hours=1)).isoformat()}
    assert c.post(f"/api/v1/attendance/{rec['id']}/correct", headers=staff, json=body).status_code == 403
    bad = {**body, "check_out_time": (now - timedelta(hours=3)).isoformat()}
    assert c.post(f"/api/v1/attendance/{rec['id']}/correct", headers=manager, json=bad).status_code == 422
    assert c.post(f"/api/v1/attendance/{rec['id']}/correct", headers=manager,
                  json={**body, "reason": ""}).status_code == 422

    res = c.post(f"/api/v1/attendance/{rec['id']}/correct", headers=manager, json=body)
    assert res.status_code == 200, res.text
    assert res.json()["duration_minutes"] == 60 and res.json()["corrected_at"]

    corrections = c.get(f"/api/v1/attendance/{rec['id']}/corrections", headers=staff).json()
    assert len(corrections) == 1 and corrections[0]["reason"] == "Forgot to check out"
    assert corrections[0]["previous_check_out_time"] is None

    second = _checkin(c, staff, member_id=m["id"]).json()
    overlap = {"reason": "Fix", "check_in_time": (now - timedelta(hours=1, minutes=30)).isoformat()}
    assert c.post(f"/api/v1/attendance/{second['id']}/correct", headers=manager, json=overlap).status_code == 409

    assert c.post(f"/api/v1/attendance/{rec['id']}/correct", headers=gym["other_owner"], json=body).status_code == 404
    logs = c.get(f"/api/v1/audit-logs?resource_id={rec['id']}", headers=manager).json()["items"]
    assert any(l["action"] == "attendance.corrected" for l in logs)
    assert c.get("/api/v1/audit-logs", headers=staff).status_code == 403


def test_history_page_filters_and_totals(gym):
    c, owner, staff = gym["client"], gym["owner"], gym["staff"]
    m = _member(c, owner, "Histo", "histo@access-gym.com", "+919822200015")
    rec = _checkin(c, staff, member_id=m["id"]).json()
    page = c.get(f"/api/v1/attendance/history/page?member_id={m['id']}", headers=staff).json()
    assert page["total"] == 1 and page["items"][0]["id"] == rec["id"]
    assert c.get(f"/api/v1/attendance/history/page?member_id={m['id']}&method=qr", headers=staff).json()["total"] == 0
    assert c.get(f"/api/v1/attendance/history/page?search={m['id']}", headers=staff).json()["total"] == 1
    future = (TODAY + timedelta(days=3)).isoformat()
    assert c.get(f"/api/v1/attendance/history/page?member_id={m['id']}&date_from={future}", headers=staff).json()["total"] == 0
    assert c.get("/api/v1/attendance/history/page?sort=password", headers=staff).status_code == 422


# ---------- staff permissions ----------

def test_permission_overrides_and_guards(gym):
    c, owner, staff, manager, admin = gym["client"], gym["owner"], gym["staff"], gym["manager"], gym["admin"]
    m = _member(c, owner, "Perm", "perm@access-gym.com", "+919822200016")

    res = c.put(f"/api/v1/team/{gym['staff_wm']}/permissions", headers=owner, json={"revoke": ["attendance.record"]})
    assert res.status_code == 200 and "attendance.record" not in res.json()["effective"]
    try:
        assert _checkin(c, staff, member_id=m["id"]).status_code == 403
        assert "attendance.record" not in c.get("/api/v1/team/me/permissions", headers=staff).json()["permissions"]
    finally:
        c.put(f"/api/v1/team/{gym['staff_wm']}/permissions", headers=owner, json={})

    # Managers can't manage permissions; staff can't touch their own; admins can't edit admins.
    assert c.put(f"/api/v1/team/{gym['staff_wm']}/permissions", headers=manager, json={"grant": ["audit.view"]}).status_code == 403
    assert c.put(f"/api/v1/team/{gym['admin_wm']}/permissions", headers=admin, json={"revoke": ["audit.view"]}).status_code == 403
    assert c.put(f"/api/v1/team/{gym['staff_wm']}/permissions", headers=owner, json={"grant": ["root.everything"]}).status_code == 422

    owner_wm = c.get("/api/v1/team", headers=owner).json()
    owner_row = next(r for r in owner_wm if r["role"] == "OWNER")
    assert c.put(f"/api/v1/team/{owner_row['id']}/permissions", headers=admin, json={"revoke": ["audit.view"]}).status_code == 403

    # Admin grants within their own permissions; change is audited.
    res = c.put(f"/api/v1/team/{gym['staff_wm']}/permissions", headers=admin, json={"grant": ["attendance.correct"]})
    assert res.status_code == 200 and "attendance.correct" in res.json()["effective"]
    logs = c.get(f"/api/v1/audit-logs?resource_id={gym['staff_wm']}", headers=owner).json()["items"]
    assert any(l["action"] == "staff.permissions_changed" for l in logs)
    c.put(f"/api/v1/team/{gym['staff_wm']}/permissions", headers=owner, json={})


def test_staff_deactivation_revokes_access_and_is_audited(gym):
    c, owner = gym["client"], gym["owner"]
    temp, temp_wm, _ = _staff(gym["ws"], "actemp", UserRole.STAFF)
    assert c.get("/api/v1/attendance/summary", headers=temp).status_code == 200
    assert c.put(f"/api/v1/team/{temp_wm}", headers=owner, json={"is_active": False}).status_code == 200
    assert c.get("/api/v1/attendance/summary", headers=temp).status_code == 403
    logs = c.get(f"/api/v1/audit-logs?resource_id={temp_wm}", headers=owner).json()["items"]
    assert any(l["action"] == "staff.deactivated" for l in logs)


# ---------- trainers ----------

def _trainer(ws, name, capacity=None):
    db = TestingSessionLocal()
    try:
        t = Trainer(workspace_id=ws, name=name, phone="+919800011111", status=TrainerStatus.ACTIVE, is_active=True,
                    max_active_clients=capacity)
        db.add(t)
        db.commit()
        return t.id
    finally:
        db.close()


def test_trainer_assignment_rules(gym):
    c, owner, staff, manager = gym["client"], gym["owner"], gym["staff"], gym["manager"]
    t_id = _trainer(gym["ws"], "Coach Cap", capacity=1)
    a = _member(c, owner, "Asg", "asg@access-gym.com", "+919822200017")
    b = _member(c, owner, "Bsg", "bsg@access-gym.com", "+919822200018")

    assert c.post("/api/v1/trainer-client/assign", headers=staff, json={"trainer_id": t_id, "client_id": a["id"]}).status_code == 403
    first = c.post("/api/v1/trainer-client/assign", headers=manager, json={"trainer_id": t_id, "client_id": a["id"]})
    assert first.status_code == 200, first.text
    assert c.post("/api/v1/trainer-client/assign", headers=manager,
                  json={"trainer_id": t_id, "client_id": a["id"]}).status_code == 409, "duplicate"
    full = c.post("/api/v1/trainer-client/assign", headers=manager, json={"trainer_id": t_id, "client_id": b["id"]})
    assert full.status_code == 409 and "capacity" in full.json()["detail"]

    # Ending and re-assigning keeps the old period as history.
    assert c.patch(f"/api/v1/trainer-client/{first.json()['id']}", headers=owner, json={"status": "ENDED"}).status_code == 200
    again = c.post("/api/v1/trainer-client/assign", headers=manager, json={"trainer_id": t_id, "client_id": a["id"]})
    assert again.status_code == 200 and again.json()["id"] != first.json()["id"]
    assert c.post("/api/v1/trainer-client/assign", headers=gym["other_owner"],
                  json={"trainer_id": t_id, "client_id": a["id"]}).status_code == 404


def test_trainer_session_conflicts(gym):
    ws = gym["ws"]
    db = TestingSessionLocal()
    try:
        trainer_user = User(email="coach.sched@access-gym.com", full_name="Coach Sched",
                            hashed_password=get_password_hash("Password123!"), is_active=True)
        db.add(trainer_user)
        db.flush()
        db.add(WorkspaceMember(workspace_id=ws, user_id=trainer_user.id, role=UserRole.TRAINER, is_active=True))
        db.add(Trainer(workspace_id=ws, user_id=trainer_user.id, name="Coach Sched", phone="+919800022222",
                       status=TrainerStatus.ACTIVE, is_active=True))
        db.commit()
        th = {"Authorization": f"Bearer {create_access_token(trainer_user.id, workspace_id=ws, role='TRAINER')}"}
    finally:
        db.close()
    c = gym["client"]
    start = (datetime.now(timezone.utc) + timedelta(days=2)).replace(hour=7, minute=0, second=0, microsecond=0)
    ok = c.post("/api/v1/trainer/sessions", headers=th, json={"title": "PT A", "scheduled_at": start.isoformat(), "duration_minutes": 60})
    assert ok.status_code == 201, ok.text
    clash = c.post("/api/v1/trainer/sessions", headers=th,
                   json={"title": "PT B", "scheduled_at": (start + timedelta(minutes=30)).isoformat(), "duration_minutes": 60})
    assert clash.status_code == 409
    after = c.post("/api/v1/trainer/sessions", headers=th,
                   json={"title": "PT C", "scheduled_at": (start + timedelta(minutes=60)).isoformat(), "duration_minutes": 45})
    assert after.status_code == 201, "back-to-back sessions are fine"
    moved = c.patch(f"/api/v1/trainer/sessions/{after.json()['id']}", headers=th,
                    json={"scheduled_at": (start + timedelta(minutes=15)).isoformat()})
    assert moved.status_code == 409
    assert c.post("/api/v1/trainer/sessions", headers=th,
                  json={"title": "Bad", "scheduled_at": start.isoformat(), "duration_minutes": 0}).status_code == 422
