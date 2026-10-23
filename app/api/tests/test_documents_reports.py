"""Member documents (private storage, signatures, archive) and business reports with exports."""
import io
from datetime import date, datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.models.attendance import Attendance
from tests.conftest import TestingSessionLocal
from tests.factories import make_gym

client = TestClient(app)
API = "/api/v1"
PDF = b"%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF"


@pytest.fixture
def gym(tmp_path, monkeypatch):
    # Keep uploaded files out of the developer's private_storage.
    from app.core import storage
    monkeypatch.setattr(storage, "_storage", storage.LocalStorage(str(tmp_path)))
    return make_gym("Docs Gym")


def upload(gym, role="STAFF", data=PDF, **form):
    return client.post(f"{API}/members/{gym.member_id}/documents", headers=gym.headers[role],
                       files={"file": ("waiver.pdf", io.BytesIO(data), "application/pdf")},
                       data={"title": "Liability waiver", "category": "waiver", **form})


def test_upload_validates_type_and_role(gym):
    assert upload(gym, data=b"MZ\x90\x00 not a pdf").status_code == 415
    assert upload(gym, role="TRAINER").status_code == 403
    assert upload(gym, role="USER").status_code == 403
    res = upload(gym, requires_acknowledgement="true")
    assert res.status_code == 201, res.text
    assert res.json()["content_type"] == "application/pdf" and res.json()["requires_acknowledgement"] is True


def test_member_sees_shared_documents_and_signs_once(gym):
    shared = upload(gym, requires_acknowledgement="true").json()
    upload(gym, visible_to_member="false", title="Internal note scan")
    mine = client.get(f"{API}/members/me/documents", headers=gym.headers["USER"]).json()
    assert [d["id"] for d in mine] == [shared["id"]]
    f = client.get(f"{API}/members/me/documents/{shared['id']}/file", headers=gym.headers["USER"])
    assert f.status_code == 200 and f.content == PDF and f.headers["cache-control"] == "private, no-store"

    signed = client.post(f"{API}/members/me/documents/{shared['id']}/acknowledge", headers=gym.headers["USER"],
                         json={"full_name": "Mia  Member", "agree": True})
    assert signed.status_code == 200 and signed.json()["acknowledged_name"] == "Mia Member"
    again = client.post(f"{API}/members/me/documents/{shared['id']}/acknowledge", headers=gym.headers["USER"],
                        json={"full_name": "Mia Member", "agree": True})
    assert again.status_code == 409
    # Staff can't sign on the member's behalf.
    assert client.post(f"{API}/members/{gym.member_id}/documents/{shared['id']}/acknowledge", headers=gym.headers["OWNER"],
                       json={"full_name": "Owner", "agree": True}).status_code == 403


def test_archive_keeps_the_record(gym):
    doc = upload(gym).json()
    assert client.post(f"{API}/members/{gym.member_id}/documents/{doc['id']}/archive",
                       headers=gym.headers["STAFF"]).json()["archived_at"]
    assert client.get(f"{API}/members/{gym.member_id}/documents", headers=gym.headers["STAFF"]).json() == []
    kept = client.get(f"{API}/members/{gym.member_id}/documents", params={"include_archived": True},
                      headers=gym.headers["STAFF"]).json()
    assert [d["id"] for d in kept] == [doc["id"]]
    assert client.get(f"{API}/members/me/documents/{doc['id']}/file", headers=gym.headers["USER"]).status_code == 404


def test_documents_are_tenant_isolated(gym):
    doc = upload(gym).json()
    other = make_gym("Docs Other Gym")
    assert client.get(f"{API}/members/{gym.member_id}/documents", headers=other.headers["OWNER"]).status_code == 404
    assert client.get(f"{API}/members/{gym.member_id}/documents/{doc['id']}/file",
                      headers=other.headers["OWNER"]).status_code == 404


# ─── Reports ───────────────────────────────────────────────────────────


def seed_activity(gym):
    client.post(f"{API}/payments/", headers=gym.headers["STAFF"], json={"member_id": gym.member_id, "amount": 1500, "method": "upi"})
    client.post(f"{API}/payments/", headers=gym.headers["STAFF"], json={"member_id": gym.member_id, "amount": 500, "method": "cash"})
    db = TestingSessionLocal()
    try:
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        db.add_all([Attendance(workspace_id=gym.id, member_id=gym.member_id, check_in_time=now - timedelta(days=d),
                               check_out_time=now - timedelta(days=d) + timedelta(hours=1), duration_minutes=60,
                               status="CHECKED_OUT") for d in range(3)])
        db.commit()
    finally:
        db.close()


def test_report_roles(gym):
    for role in ("USER", "TRAINER", "STAFF"):
        assert client.get(f"{API}/reports/revenue", headers=gym.headers[role]).status_code == 403
    assert client.get(f"{API}/reports/revenue", headers=gym.headers["MANAGER"]).status_code == 200


def test_revenue_membership_attendance_reports(gym):
    seed_activity(gym)
    rev = client.get(f"{API}/reports/revenue", headers=gym.headers["OWNER"], params={"group_by": "day",
                     "start": (date.today() - timedelta(days=6)).isoformat()}).json()
    assert rev["summary"]["collected"] == 2000 and rev["summary"]["by_method"] == {"cash": 500.0, "upi": 1500.0}
    assert len(rev["rows"]) == 7 and rev["rows"][-1]["collected"] == 2000

    mem = client.get(f"{API}/reports/memberships", headers=gym.headers["OWNER"]).json()
    assert mem["rows"][-1]["active"] >= 1

    att = client.get(f"{API}/reports/attendance", headers=gym.headers["OWNER"], params={"group_by": "week"}).json()
    assert att["summary"]["visits"] == 3 and att["summary"]["unique_members"] == 1
    assert len(att["summary"]["heatmap"]) == 7

    summary = client.get(f"{API}/reports/summary", headers=gym.headers["OWNER"]).json()
    assert summary["revenue"]["collected"] == 2000 and "2025" not in str(summary["period"])


def test_report_isolation(gym):
    seed_activity(gym)
    other = make_gym("Report Other Gym")
    rev = client.get(f"{API}/reports/revenue", headers=other.headers["OWNER"]).json()
    assert rev["summary"]["collected"] == 0


def test_exports(gym):
    seed_activity(gym)
    csv_res = client.get(f"{API}/reports/revenue/export", headers=gym.headers["OWNER"], params={"format": "csv"})
    assert csv_res.status_code == 200 and "Collected" in csv_res.text
    xlsx = client.get(f"{API}/reports/attendance/export", headers=gym.headers["OWNER"], params={"format": "xlsx"})
    assert xlsx.status_code == 200 and xlsx.content[:2] == b"PK"
    pdf = client.get(f"{API}/reports/dues/export", headers=gym.headers["OWNER"], params={"format": "pdf"})
    assert pdf.status_code == 200 and pdf.content.startswith(b"%PDF-")


def test_saved_reports(gym):
    saved = client.post(f"{API}/reports/saved", headers=gym.headers["OWNER"], json={
        "name": "Last 7 days revenue", "report_type": "revenue", "filters": {"relative_days": 7, "group_by": "day"}})
    assert saved.status_code == 201, saved.text
    run = client.get(f"{API}/reports/saved/{saved.json()['id']}/run", headers=gym.headers["OWNER"]).json()
    assert len(run["rows"]) == 7
    bad = client.post(f"{API}/reports/saved", headers=gym.headers["OWNER"],
                      json={"name": "x" * 3, "report_type": "revenue", "filters": {"sql": "drop"}})
    assert bad.status_code == 422
