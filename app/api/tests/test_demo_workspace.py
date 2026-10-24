"""The sales demo gym: seeded data, unlimited entitlements, blocked outbound/risky actions, isolation."""
import random

import pytest
from fastapi.testclient import TestClient

from app.core.config import settings
from app.main import app
from app.models.communication import NotificationDelivery
from scripts import seed_demo
from tests.conftest import TestingSessionLocal
from tests.test_identity_onboarding import onboard, phone_signup

client = TestClient(app)
API = "/api/v1"
PASSWORD = "demo-password-for-tests"


@pytest.fixture(scope="module")
def demo(monkeypatch_module):
    monkeypatch_module.setattr(settings, "DEMO_ACCOUNT_PASSWORD", PASSWORD)
    monkeypatch_module.setattr(settings, "DEMO_ACCOUNT_EMAIL", "demo@repsi.app")
    db = TestingSessionLocal()
    try:
        owner, ws = seed_demo._ensure_account(db)
        db.commit()
        seed_demo._ensure_unlimited_plan(db, ws, owner)
        seed_demo._seed_sample_data(db, ws, owner, random.Random(42))
        ws_id = ws.id
    finally:
        db.close()
    r = client.post(f"{API}/auth/login", json={"email": "demo@repsi.app", "password": PASSWORD})
    assert r.status_code == 200, r.text
    return {"ws_id": ws_id, "h": {"Authorization": f"Bearer {r.json()['access_token']}"}}


@pytest.fixture(scope="module")
def monkeypatch_module():
    mp = pytest.MonkeyPatch()
    yield mp
    mp.undo()


def test_demo_owner_sees_a_populated_unlimited_gym(demo):
    h = demo["h"]
    me = client.get(f"{API}/auth/me", headers=h).json()
    assert me["role"] == "OWNER" and me["gym_name"] == "REPSI Demo Fitness"

    usage = client.get(f"{API}/billing/subscription", headers=h)
    assert usage.status_code == 200, usage.text
    ent = client.get(f"{API}/billing/entitlements", headers=h).json()
    features = ent.get("features", ent)
    assert features.get("multi_branch") and features.get("sales_crm") and features.get("advanced_analytics")

    metrics = client.get(f"{API}/dashboard/metrics", headers=h).json()
    assert metrics["active_members"] >= 40
    assert metrics["monthly_revenue"] > 0
    assert metrics["expiring_memberships"] >= 1

    members = client.get(f"{API}/members", headers=h)
    assert members.status_code == 200
    assert len(client.get(f"{API}/branches", headers=h).json()) == 2


def test_membership_state_filters_match_real_end_dates(demo):
    h = demo["h"]

    def total(status):
        r = client.get(f"{API}/members", headers=h, params={"status": status, "page_size": 100})
        assert r.status_code == 200, r.text
        return r.json()["total"]

    expiring, expired, frozen = total("expiring"), total("expired"), total("frozen")
    assert expiring == client.get(f"{API}/dashboard/metrics", headers=h).json()["expiring_memberships"]
    assert expired >= 1 and frozen >= 1
    # A search by name finds the member (the mobile app sends `query`).
    r = client.get(f"{API}/members", headers=h, params={"query": "Aarav"})
    assert r.json()["total"] >= 1


def test_everyday_work_is_allowed(demo):
    r = client.post(f"{API}/members", headers=demo["h"],
                    json={"first_name": "Walk", "last_name": "In", "phone": "+919000099999", "email": "walk.in@example.com"})
    assert r.status_code in (200, 201), r.text


@pytest.mark.parametrize("method,path,body", [
    ("put", "/auth/me/password", {"current_password": PASSWORD, "new_password": "something-else-123"}),
    ("delete", "/auth/me", {"password": PASSWORD, "confirm": "DELETE"}),
    ("put", "/auth/me", {"full_name": "Hijacked"}),
    ("post", "/billing/change-plan", {"plan_code": "starter"}),
    ("post", "/invitations", {"email": "someone@real-company.com", "role": "STAFF"}),
    ("post", "/support/tickets", {"subject": "spam", "message": "spam"}),
    ("put", "/payments/settings", {"upi_enabled": True, "upi_id": "attacker@upi"}),
    ("post", "/websites/my-website/publish", {}),
    ("post", "/workspaces/deregister", {}),
])
def test_risky_actions_are_refused(demo, method, path, body):
    r = getattr(client, method if method != "delete" else "request")(
        *(("DELETE", f"{API}{path}") if method == "delete" else (f"{API}{path}",)), headers=demo["h"], json=body)
    assert r.status_code == 403, (path, r.status_code, r.text)
    assert r.json()["detail"]["error_code"] == "DEMO_RESTRICTED"


def test_demo_password_still_works_after_refusals(demo):
    r = client.post(f"{API}/auth/login", json={"email": "demo@repsi.app", "password": PASSWORD})
    assert r.status_code == 200


def test_messages_from_the_demo_gym_are_never_sent(demo):
    r = client.post(f"{API}/broadcasts", headers=demo["h"], json={
        "title": "Hi {{first_name}}", "message": "Offer", "channels": ["email"], "audience": {"segment": "all_members"}})
    assert r.status_code == 201, r.text
    db = TestingSessionLocal()
    try:
        statuses = {d.status for d in db.query(NotificationDelivery).filter(
            NotificationDelivery.broadcast_id == r.json()["id"]).all()}
    finally:
        db.close()
    assert statuses and statuses <= {"skipped_demo", "skipped_no_contact", "skipped_opt_out"}
    assert "sent" not in statuses


def test_demo_password_reset_sends_nothing(demo, monkeypatch):
    sent = []
    monkeypatch.setattr("app.services.auth.send_password_reset_email", lambda *a, **k: sent.append(a))
    assert client.post(f"{API}/auth/forgot-password", json={"email": "demo@repsi.app"}).status_code == 200
    assert sent == []


def test_real_gyms_cannot_see_demo_data_and_keep_their_restrictions(demo):
    s = phone_signup()
    t = onboard(s["access_token"])["session"]["access_token"]
    h = {"Authorization": f"Bearer {t}"}
    body = client.get(f"{API}/members", headers=h).json()
    items = body["items"] if isinstance(body, dict) else body
    assert isinstance(items, list)
    assert not any((m.get("email") or "").endswith("@example.com") for m in items)
    # A real gym is not demo-restricted.
    assert client.put(f"{API}/auth/me", headers=h, json={"full_name": "Real Owner"}).status_code == 200
    # The demo gym's id in a header does not grant access.
    r = client.get(f"{API}/members", headers={**h, "X-Workspace-ID": demo["ws_id"]})
    assert r.status_code == 403


def test_seeder_refuses_to_take_over_a_real_account(demo, monkeypatch_module):
    s = phone_signup()
    monkeypatch_module.setattr(settings, "DEMO_ACCOUNT_EMAIL", s["email"])
    onboard(s["access_token"])
    db = TestingSessionLocal()
    try:
        with pytest.raises(SystemExit):
            seed_demo._ensure_account(db)
    finally:
        db.rollback()
        db.close()
        monkeypatch_module.setattr(settings, "DEMO_ACCOUNT_EMAIL", "demo@repsi.app")
