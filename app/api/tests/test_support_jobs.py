"""Support tickets, background jobs, lifecycle reminders, device tokens, SMS/push gating and real billing data."""
import uuid
from datetime import date, datetime, timedelta, timezone

import httpx
import pytest
from fastapi.testclient import TestClient

from app.core.config import settings
from app.core.security import create_access_token, get_password_hash
from app.main import app
from app.models.communication import DeviceToken, MessageTemplate, NotificationDelivery, NotificationPreference
from app.models.jobs import JobRun
from app.models.member import Member, MemberStatus, Membership
from app.models.user import User
from app.services import jobs
from app.services.notify import notify_member
from tests.conftest import TestingSessionLocal, test_engine
from tests.factories import make_gym

client = TestClient(app)
API = "/api/v1"


@pytest.fixture
def gym():
    return make_gym("Support Gym")


@pytest.fixture
def superadmin():
    db = TestingSessionLocal()
    try:
        u = User(email=f"root.{uuid.uuid4().hex[:6]}@repsi.test", full_name="Root", is_superadmin=True,
                 hashed_password=get_password_hash("x" * 12), is_active=True)
        db.add(u)
        db.commit()
        return {"Authorization": f"Bearer {create_access_token(u.id, None, 'SUPER_ADMIN')}"}
    finally:
        db.close()


# ─── Support ───────────────────────────────────────────────────────────


def test_ticket_lifecycle_between_gym_and_support(gym, superadmin):
    assert client.post(f"{API}/support/tickets", headers=gym.headers["STAFF"],
                       json={"subject": "Cannot export", "message": "Export button fails"}).status_code == 403
    t = client.post(f"{API}/support/tickets", headers=gym.headers["OWNER"], json={
        "subject": "Cannot export CSV", "category": "technical", "priority": "high", "message": "The export fails."})
    assert t.status_code == 201, t.text
    ticket = t.json()
    assert ticket["number"].startswith("SUP-") and ticket["status"] == "open"

    queue = client.get(f"{API}/superadmin/support/tickets", headers=superadmin, params={"status": "open"})
    assert queue.status_code == 200 and any(x["id"] == ticket["id"] for x in queue.json())
    assert client.get(f"{API}/superadmin/support/tickets", headers=gym.headers["OWNER"]).status_code == 403

    client.post(f"{API}/superadmin/support/tickets/{ticket['id']}/messages", headers=superadmin,
                json={"message": "Customer is on old browser", "internal": True})
    reply = client.post(f"{API}/superadmin/support/tickets/{ticket['id']}/messages", headers=superadmin,
                        json={"message": "Please try again now."}).json()
    assert reply["status"] == "in_progress" and reply["first_response_at"]

    gym_view = client.get(f"{API}/support/tickets/{ticket['id']}", headers=gym.headers["OWNER"]).json()
    assert [m["body"] for m in gym_view["messages"]] == ["The export fails.", "Please try again now."]  # no internal note

    no_note = client.patch(f"{API}/superadmin/support/tickets/{ticket['id']}", headers=superadmin, json={"status": "resolved"})
    assert no_note.status_code == 422
    done = client.patch(f"{API}/superadmin/support/tickets/{ticket['id']}", headers=superadmin,
                        json={"status": "resolved", "resolution": "Fixed export encoding", "assign_to_me": True}).json()
    assert done["status"] == "resolved" and done["resolved_at"]

    other = make_gym("Support Other Gym")
    assert client.get(f"{API}/support/tickets/{ticket['id']}", headers=other.headers["OWNER"]).status_code == 404


# ─── Jobs ──────────────────────────────────────────────────────────────


def test_job_slot_runs_once():
    job = jobs.JOBS["class_no_shows"]
    key = f"test-{uuid.uuid4().hex}"
    first = jobs.run_job(TestingSessionLocal, job, "cli", key)
    second = jobs.run_job(TestingSessionLocal, job, "cli", key)
    assert first is not None and first.status == "succeeded"
    assert second is None


def test_failed_job_is_recorded(monkeypatch):
    def boom(db):
        raise RuntimeError("provider down")
    job = jobs.Job("test_failing", 5, boom, "always fails")
    run = jobs.run_job(TestingSessionLocal, job, "cli", f"fail-{uuid.uuid4().hex}")
    assert run.status == "failed" and "provider down" in run.error


def test_superadmin_job_endpoints(superadmin):
    listing = client.get(f"{API}/superadmin/jobs", headers=superadmin).json()
    assert {j["name"] for j in listing["jobs"]} >= {"dispatch_notifications", "membership_reminders"}
    run = client.post(f"{API}/superadmin/jobs/membership_transitions/run", headers=superadmin)
    assert run.status_code == 200 and run.json()["status"] == "succeeded", run.text
    health = client.get(f"{API}/superadmin/system-health", headers=superadmin).json()
    names = {m["component"] for m in health["metrics"]}
    assert "Background jobs" in names and any(n.startswith("File storage") for n in names)


def test_expiry_reminders_are_sent_once(gym):
    db = TestingSessionLocal()
    try:
        m = db.query(Membership).filter(Membership.member_id == gym.member_id).first()
        m.end_date = date.today() + timedelta(days=3)
        db.commit()
    finally:
        db.close()
    db = TestingSessionLocal()
    try:
        jobs.membership_reminders(db)
        jobs.membership_reminders(db)  # second run must not duplicate
        rows = db.query(NotificationDelivery).filter(NotificationDelivery.member_id == gym.member_id,
                                                     NotificationDelivery.event_type == "membership_expiring").all()
        assert sorted(r.channel for r in rows) == ["email", "in_app"]
        assert "3 day" in next(r.subject for r in rows if r.channel == "in_app")
    finally:
        db.close()


def test_dispatch_sends_lifecycle_email_only_when_smtp_configured(gym, monkeypatch):
    db = TestingSessionLocal()
    try:
        member = db.get(Member, gym.member_id)
        notify_member(db, member, "welcome", f"t-{uuid.uuid4().hex}")
        db.commit()
        jobs.dispatch_notifications(db)
        email = db.query(NotificationDelivery).filter(NotificationDelivery.member_id == member.id,
                                                      NotificationDelivery.event_type == "welcome",
                                                      NotificationDelivery.channel == "email").first()
        assert email.status == "skipped_not_configured"
    finally:
        db.close()


def test_whatsapp_lifecycle_needs_template_and_consent(gym, monkeypatch):
    sent = []
    monkeypatch.setattr(settings, "AISENSY_API_KEY", "test-key")
    monkeypatch.setattr(httpx, "post", lambda url, **kw: (sent.append(kw["json"]), httpx.Response(200, json={"id": "wa-1"}))[1])
    db = TestingSessionLocal()
    try:
        db.add(MessageTemplate(workspace_id=gym.id, name=f"expiry-{uuid.uuid4().hex[:4]}", channel="whatsapp",
                               category="membership_expiring", body="Hi {{first_name}}", provider_template_name="expiry_v1"))
        db.commit()
        member = db.get(Member, gym.member_id)
        notify_member(db, member, "membership_expiring", "no-consent", variables={"days": 3})
        row = db.query(NotificationDelivery).filter(NotificationDelivery.idempotency_key.like("%no-consent:whatsapp%")).one()
        assert row.status == "skipped_no_consent"

        db.add(NotificationPreference(workspace_id=gym.id, user_id=gym.user_ids["USER"], whatsapp_enabled=True,
                                      whatsapp_consent_at=datetime.now(timezone.utc)))
        db.commit()
        notify_member(db, member, "membership_expiring", "with-consent", variables={"days": 3})
        db.commit()
        jobs.dispatch_notifications(db)
        row = db.query(NotificationDelivery).filter(NotificationDelivery.idempotency_key.like("%with-consent:whatsapp%")).one()
        assert row.status == "sent" and sent and sent[-1]["campaignName"] == "expiry_v1"
    finally:
        db.close()


def test_sms_only_when_provider_configured(gym, monkeypatch):
    db = TestingSessionLocal()
    try:
        member = db.get(Member, gym.member_id)
        notify_member(db, member, "payment_receipt", "sms-off", variables={"amount": "₹100"})
        assert not db.query(NotificationDelivery).filter(NotificationDelivery.idempotency_key.like("%sms-off:sms%")).all()
        monkeypatch.setattr(settings, "SMS_PROVIDER", "twilio")
        monkeypatch.setattr(settings, "TWILIO_ACCOUNT_SID", "AC123")
        monkeypatch.setattr(settings, "TWILIO_AUTH_TOKEN", "tok")
        monkeypatch.setattr(settings, "TWILIO_FROM_NUMBER", "+15550001111")
        monkeypatch.setattr(httpx, "post", lambda url, **kw: httpx.Response(201, json={"sid": "SM1"}))
        notify_member(db, member, "payment_receipt", "sms-on", variables={"amount": "₹100"})
        db.commit()
        jobs.dispatch_notifications(db)
        row = db.query(NotificationDelivery).filter(NotificationDelivery.idempotency_key.like("%sms-on:sms%")).one()
        assert row.status == "sent" and row.provider_message_id == "SM1"
    finally:
        db.close()


def test_device_registration_and_push_gating(gym):
    token = "fcm-" + uuid.uuid4().hex * 2
    res = client.post(f"{API}/notifications/devices", headers=gym.headers["USER"], json={"token": token, "platform": "android"})
    assert res.status_code == 201
    db = TestingSessionLocal()
    try:
        notify_member(db, db.get(Member, gym.member_id), "welcome", f"push-{uuid.uuid4().hex}")
        db.commit()
        jobs.dispatch_notifications(db)
        push = db.query(NotificationDelivery).filter(NotificationDelivery.member_id == gym.member_id,
                                                     NotificationDelivery.channel == "push").first()
        assert push is not None and push.status == "skipped_not_configured"
    finally:
        db.close()
    assert client.request("DELETE", f"{API}/notifications/devices", headers=gym.headers["USER"],
                          json={"token": token, "platform": "android"}).status_code == 200


# ─── Billing data is real ──────────────────────────────────────────────


def test_workspace_billing_has_no_invented_data(gym):
    assert client.get(f"{API}/workspaces/billing", headers=gym.headers["STAFF"]).status_code == 403
    data = client.get(f"{API}/workspaces/billing", headers=gym.headers["OWNER"]).json()
    assert data["payment_method"] is None
    assert data["invoices"] == []  # no fabricated INV-2026-00x rows
    assert data["usage"]["members"]["current"] >= 1
