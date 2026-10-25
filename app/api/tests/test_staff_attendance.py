"""Trainer shift attendance is separate from member attendance; corrections go through a request."""
from datetime import datetime, timedelta, timezone

from app.models.attendance import Attendance, AttendanceCorrection
from app.models.system import AuditLog
from tests.conftest import TestingSessionLocal
from tests.test_fitness_module import client, gym, today  # noqa: F401  (fixture reuse)

A = "/api/v1/attendance"
S = "/api/v1/staff-attendance"


def test_trainer_shift_check_in_out_and_summary(gym):
    r = client.post(f"{A}/check-in", json={"method": "manual"}, headers=gym["t1"])
    assert r.status_code == 201, r.text
    me = client.get(f"{S}/me", headers=gym["t1"]).json()
    assert me["active"]["id"] == r.json()["id"]
    assert client.post(f"{A}/check-out", json={}, headers=gym["t1"]).status_code == 200
    me = client.get(f"{S}/me", headers=gym["t1"]).json()
    assert me["active"] is None and len(me["records"]) == 1 and me["month_days"] == 1

    # Members and owners have no personal shift view; t2 sees none of t1's shifts.
    assert client.get(f"{S}/me", headers=gym["m1"]).status_code == 403
    assert client.get(f"{S}/me", headers=gym["owner"]).status_code == 403
    assert client.get(f"{S}/me", headers=gym["t2"]).json()["records"] == []


def test_member_visits_never_count_as_staff_attendance(gym):
    db = TestingSessionLocal()
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    db.add(Attendance(workspace_id=gym["ws_a"], member_id=gym["m1_id"], check_in_time=now - timedelta(hours=1),
                      recorded_by_user_id=gym["t1_user_id"]))
    db.commit()
    db.close()
    assert client.get(f"{S}/me", headers=gym["t1"]).json()["records"] == []
    report = client.get(f"{S}/report", headers=gym["owner"]).json()
    assert all(t["shifts"] == 0 for t in report["trainers"])
    assert client.get(f"{S}/report", headers=gym["t1"]).status_code == 403
    assert client.get(f"{S}/report", headers=gym["owner_b"]).json()["trainers"] == []


def test_correction_request_flow(gym):
    shift = client.post(f"{A}/check-in", json={"method": "manual"}, headers=gym["t1"]).json()
    client.post(f"{A}/check-out", json={}, headers=gym["t1"])
    start = datetime.fromisoformat(shift["check_in_time"].replace("Z", "")) - timedelta(minutes=30)

    bad = client.post(f"{S}/correction-requests", json={"attendance_id": shift["id"], "reason": "Forgot"},
                      headers=gym["t1"])
    assert bad.status_code == 422
    # Another trainer can't request on t1's record.
    other = {"attendance_id": shift["id"], "reason": "Mine", "check_in_time": start.isoformat()}
    assert client.post(f"{S}/correction-requests", json=other, headers=gym["t2"]).status_code == 404

    body = {"attendance_id": shift["id"], "reason": "Checked in late on the app", "check_in_time": start.isoformat()}
    req = client.post(f"{S}/correction-requests", json=body, headers=gym["t1"])
    assert req.status_code == 201, req.text
    assert client.post(f"{S}/correction-requests", json=body, headers=gym["t1"]).status_code == 409

    # Trainers see only their own; they can't approve.
    assert len(client.get(f"{S}/correction-requests", headers=gym["t1"]).json()) == 1
    assert client.get(f"{S}/correction-requests", headers=gym["t2"]).json() == []
    rid = req.json()["id"]
    assert client.post(f"{S}/correction-requests/{rid}/approve", json={}, headers=gym["t1"]).status_code == 403
    assert client.post(f"{S}/correction-requests/{rid}/approve", json={}, headers=gym["owner_b"]).status_code == 404

    ok = client.post(f"{S}/correction-requests/{rid}/approve", json={"note": "Fixed"}, headers=gym["owner"])
    assert ok.status_code == 200, ok.text
    assert ok.json()["status"] == "approved"
    assert client.post(f"{S}/correction-requests/{rid}/reject", json={}, headers=gym["owner"]).status_code == 409

    db = TestingSessionLocal()
    assert db.query(AttendanceCorrection).filter(AttendanceCorrection.attendance_id == shift["id"]).count() == 1
    actions = {a.action for a in db.query(AuditLog).all()}
    db.close()
    assert {"staff_attendance.correction_requested", "staff_attendance.correction_approved"} <= actions
    me = client.get(f"{S}/me", headers=gym["t1"]).json()
    assert me["records"][0]["corrected"] is True and me["correction_requests"][0]["status"] == "approved"
