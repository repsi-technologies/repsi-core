"""Broadcasts, message templates, notification preferences and delivery logs: behaviour, roles and tenant isolation."""
import uuid
from datetime import date, timedelta

import httpx
import pytest
from fastapi.testclient import TestClient

from app.core.config import settings
from app.core.security import create_access_token, get_password_hash
from app.main import app
from app.models.communication import NotificationDelivery
from app.models.member import Member, MemberStatus, Membership, MembershipPlan
from app.models.system import Notification
from app.models.user import User, UserRole, Workspace, WorkspaceMember
from app.services import communication as comms
from app.services.billing import BillingService
from tests.conftest import TestingSessionLocal

client = TestClient(app)
API = "/api/v1"


@pytest.fixture
def gyms():
    db = TestingSessionLocal()
    tag = uuid.uuid4().hex[:8]

    def user(name, ws, role):
        u = User(email=f"{name}.{tag}@example.com", full_name=f"{name.title()} Tester",
                 hashed_password=get_password_hash("pass1234"), phone=None, is_active=True)
        db.add(u)
        db.flush()
        db.add(WorkspaceMember(workspace_id=ws.id, user_id=u.id, role=role, is_active=True))
        return u

    def member(ws, first, u=None, phone=None, joined=date(2026, 1, 1)):
        m = Member(workspace_id=ws.id, user_id=u.id if u else None, first_name=first, last_name="Test",
                   email=u.email if u else None, phone=phone, status=MemberStatus.ACTIVE, joined_date=joined)
        db.add(m)
        db.flush()
        return m

    ws_a = Workspace(name="Comms Gym A", slug=f"comms-a-{tag}", is_active=True, timezone="UTC", country_code="IN")
    ws_b = Workspace(name="Comms Gym B", slug=f"comms-b-{tag}", is_active=True, timezone="UTC", country_code="IN")
    db.add_all([ws_a, ws_b])
    db.flush()
    owner = user("owner", ws_a, UserRole.OWNER)
    staff = user("desk", ws_a, UserRole.STAFF)
    trainer = user("coach", ws_a, UserRole.TRAINER)
    m1_user, m2_user = user("mia", ws_a, UserRole.USER), user("max", ws_a, UserRole.USER)
    owner_b = user("ownerb", ws_b, UserRole.OWNER)
    m1 = member(ws_a, "Mia", m1_user, phone="+919800000001")
    m2 = member(ws_a, "Max", m2_user)
    walk_in = member(ws_a, "Noor", None, phone="+919800000003", joined=date.today())  # no app account
    mb = member(ws_b, "Bea")

    plan = MembershipPlan(workspace_id=ws_a.id, name=f"Monthly {tag}", duration_months=1, price=1000.0)
    db.add(plan)
    db.flush()
    today = date.today()
    db.add_all([
        Membership(workspace_id=ws_a.id, member_id=m1.id, plan_id=plan.id, start_date=today - timedelta(days=25),
                   end_date=today + timedelta(days=3), status=MemberStatus.ACTIVE, price_paid=1000.0),
        Membership(workspace_id=ws_a.id, member_id=m2.id, plan_id=plan.id, start_date=today - timedelta(days=60),
                   end_date=today - timedelta(days=30), status=MemberStatus.ACTIVE, price_paid=1000.0),
    ])
    db.commit()

    def hdr(u, ws, role):
        return {"Authorization": f"Bearer {create_access_token(u.id, ws.id, role)}"}

    ctx = {
        "ws_a": ws_a.id, "ws_b": ws_b.id,
        "owner": hdr(owner, ws_a, "OWNER"), "staff": hdr(staff, ws_a, "STAFF"), "trainer": hdr(trainer, ws_a, "TRAINER"),
        "m1": hdr(m1_user, ws_a, "USER"), "owner_b": hdr(owner_b, ws_b, "OWNER"),
        "m1_id": m1.id, "m2_id": m2.id, "walk_in_id": walk_in.id, "mb_id": mb.id,
        "m1_user_id": m1_user.id, "m2_user_id": m2_user.id, "owner_b_user_id": owner_b.id,
    }
    db.close()
    return ctx


def send(headers, segment="all_members", channels=("in_app",), **extra):
    audience = {"segment": segment, **{k: v for k, v in extra.items() if k in ("member_ids", "days")}}
    body = {"title": "Hi {{first_name}}", "message": "News from {{gym_name}}", "channels": list(channels),
            "audience": audience, **{k: v for k, v in extra.items() if k == "template_id"}}
    return client.post(f"{API}/broadcasts", headers=headers, json=body)


def deliveries(ws_id, broadcast_id):
    db = TestingSessionLocal()
    try:
        return {(d.member_id, d.channel): d for d in db.query(NotificationDelivery).filter(
            NotificationDelivery.workspace_id == ws_id, NotificationDelivery.broadcast_id == broadcast_id)}
    finally:
        db.close()


def test_roles_and_authentication(gyms):
    assert client.get(f"{API}/broadcasts").status_code == 401
    assert client.get(f"{API}/broadcasts", headers=gyms["m1"]).status_code == 403
    assert client.get(f"{API}/broadcasts", headers=gyms["trainer"]).status_code == 403
    assert client.get(f"{API}/broadcasts", headers=gyms["staff"]).status_code == 403  # not a STAFF default
    assert send(gyms["m1"]).status_code == 403
    assert client.get(f"{API}/message-templates", headers=gyms["m1"]).status_code == 403
    assert client.get(f"{API}/notification-deliveries", headers=gyms["trainer"]).status_code == 403
    assert client.get(f"{API}/broadcasts", headers=gyms["owner"]).status_code == 200


def test_segments_resolve_by_membership_state(gyms):
    def preview(**audience):
        r = client.post(f"{API}/broadcasts/preview", headers=gyms["owner"], json=audience)
        assert r.status_code == 200, r.text
        return r.json()

    assert preview(segment="all_members")["recipient_count"] == 3
    assert preview(segment="active_membership")["sample"] == ["Mia Test"]
    assert preview(segment="expiring_soon", days=7)["sample"] == ["Mia Test"]
    assert preview(segment="expiring_soon", days=2)["recipient_count"] == 0
    assert preview(segment="expired")["sample"] == ["Max Test"]
    assert preview(segment="new_members", days=3)["sample"] == ["Noor Test"]
    assert preview(segment="trainers")["recipient_count"] == 1
    assert preview(segment="staff")["recipient_count"] == 1


def test_in_app_and_email_broadcast_records_honest_statuses(gyms):
    r = send(gyms["owner"], channels=("in_app", "email"))
    assert r.status_code == 201, r.text
    b = r.json()
    assert b["recipient_count"] == 3
    d = deliveries(gyms["ws_a"], b["id"])
    assert d[(gyms["m1_id"], "in_app")].status == "sent"
    assert d[(gyms["walk_in_id"], "in_app")].status == "skipped_no_contact"
    # SMTP is blank in tests: email must never be reported as sent.
    assert d[(gyms["m1_id"], "email")].status == "skipped_not_configured"
    assert d[(gyms["walk_in_id"], "email")].status == "skipped_no_contact"

    # Member sees a personalised in-app notification; placeholders rendered.
    inbox = client.get(f"{API}/notifications", headers=gyms["m1"]).json()
    assert inbox["items"][0]["title"] == "Hi Mia"
    assert inbox["items"][0]["message"] == "News from Comms Gym A"

    detail = client.get(f"{API}/broadcasts/{b['id']}", headers=gyms["owner"]).json()
    assert detail["status"] == "completed"
    assert detail["by_channel"]["email"]["skipped_not_configured"] == 2  # Mia and Max
    log = client.get(f"{API}/notification-deliveries", headers=gyms["owner"], params={"channel": "in_app"}).json()
    assert log["total"] >= 3


def test_opt_out_is_respected(gyms):
    r = client.put(f"{API}/notifications/preferences", headers=gyms["m1"], json={"announcements_enabled": False})
    assert r.status_code == 200 and r.json()["announcements_enabled"] is False
    b = send(gyms["owner"], segment="selected_members", member_ids=[gyms["m1_id"], gyms["m2_id"]]).json()
    d = deliveries(gyms["ws_a"], b["id"])
    assert d[(gyms["m1_id"], "in_app")].status == "skipped_opt_out"
    assert d[(gyms["m2_id"], "in_app")].status == "sent"


def test_whatsapp_requires_template_consent_and_provider_ack(gyms, monkeypatch):
    assert send(gyms["owner"], channels=("whatsapp",)).status_code == 422  # no approved template
    t = client.post(f"{API}/message-templates", headers=gyms["owner"], json={
        "name": "Holiday hours", "channel": "whatsapp", "body": "Hi {{first_name}}", "provider_template_name": "holiday_hours_v1",
    })
    assert t.status_code == 201, t.text
    tid = t.json()["id"]
    assert client.post(f"{API}/message-templates", headers=gyms["owner"], json={
        "name": "Holiday hours", "channel": "in_app", "body": "dup"}).status_code == 409

    # Not configured: consented member is recorded as skipped_not_configured, never sent.
    client.put(f"{API}/notifications/preferences", headers=gyms["m1"], json={"whatsapp_enabled": True})
    calls = []
    monkeypatch.setattr(httpx, "post", lambda *a, **k: calls.append(k) or httpx.Response(200, json={"submitted_message_id": "wa-1"}))
    b = send(gyms["owner"], channels=("whatsapp",), template_id=tid, segment="selected_members",
             member_ids=[gyms["m1_id"], gyms["walk_in_id"], gyms["m2_id"]]).json()
    d = deliveries(gyms["ws_a"], b["id"])
    assert d[(gyms["m1_id"], "whatsapp")].status == "skipped_not_configured"
    assert d[(gyms["walk_in_id"], "whatsapp")].status == "skipped_no_consent"
    assert d[(gyms["m2_id"], "whatsapp")].status == "skipped_no_contact"
    assert calls == []

    # Configured (mocked HTTP): provider 2xx -> sent with id; provider 5xx -> failed with error.
    monkeypatch.setattr(settings, "AISENSY_API_KEY", "test-key")
    b = send(gyms["owner"], channels=("whatsapp",), template_id=tid, segment="selected_members", member_ids=[gyms["m1_id"]]).json()
    sent = deliveries(gyms["ws_a"], b["id"])[(gyms["m1_id"], "whatsapp")]
    assert sent.status == "sent" and sent.provider_message_id == "wa-1"
    assert calls[-1]["json"]["campaignName"] == "holiday_hours_v1"
    assert calls[-1]["json"]["destination"] == "919800000001"

    monkeypatch.setattr(httpx, "post", lambda *a, **k: httpx.Response(500))
    b = send(gyms["owner"], channels=("whatsapp",), template_id=tid, segment="selected_members", member_ids=[gyms["m1_id"]]).json()
    failed = deliveries(gyms["ws_a"], b["id"])[(gyms["m1_id"], "whatsapp")]
    assert failed.status == "failed" and "HTTP 500" in failed.error
    assert client.get(f"{API}/broadcasts/{b['id']}", headers=gyms["owner"]).json()["status"] == "completed_with_errors"

    # Re-dispatching never resends a finished delivery.
    db = TestingSessionLocal()
    try:
        assert comms.dispatch_queued_deliveries(db, broadcast_id=b["id"]) == 0
    finally:
        db.close()


def test_tenant_isolation(gyms):
    # Another gym's member id selects nobody.
    r = send(gyms["owner"], segment="selected_members", member_ids=[gyms["mb_id"]])
    assert r.status_code == 422
    b = send(gyms["owner"]).json()
    assert client.get(f"{API}/broadcasts/{b['id']}", headers=gyms["owner_b"]).status_code == 404
    assert client.get(f"{API}/broadcasts/{b['id']}/deliveries", headers=gyms["owner_b"]).status_code == 404
    assert all(x["id"] != b["id"] for x in client.get(f"{API}/broadcasts", headers=gyms["owner_b"]).json()["items"])
    assert client.get(f"{API}/notification-deliveries", headers=gyms["owner_b"]).json()["total"] == 0


def test_direct_notification_create_is_locked_down(gyms):
    payload = {"title": "x", "message": "y"}
    assert client.post(f"{API}/notifications", headers=gyms["m1"], json=payload).status_code == 403
    cross = client.post(f"{API}/notifications", headers=gyms["owner"], json={**payload, "user_id": gyms["owner_b_user_id"]})
    assert cross.status_code == 404
    ok = client.post(f"{API}/notifications", headers=gyms["owner"], json={**payload, "user_id": gyms["m2_user_id"]})
    assert ok.status_code == 201


def test_feature_gated_by_plan(gyms):
    db = TestingSessionLocal()
    try:
        sub = BillingService.get_or_create_workspace_subscription(db, gyms["ws_a"])
        sub.custom_features = {"member_broadcasts": False}
        db.commit()
    finally:
        db.close()
    r = send(gyms["owner"])
    assert r.status_code == 403
    assert r.json()["detail"]["error_code"] == "FEATURE_NOT_IN_PLAN"
