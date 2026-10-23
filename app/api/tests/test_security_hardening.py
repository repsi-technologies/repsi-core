"""Sessions (refresh, logout, revocation), registration gates and role checks closed after the audit."""
import uuid

import pytest
from fastapi.testclient import TestClient

from app.core.config import settings
from app.core.security import create_access_token
from app.main import app
from app.models.user import User
from tests.conftest import TestingSessionLocal
from tests.factories import PASSWORD, make_gym

client = TestClient(app)
API = "/api/v1"


@pytest.fixture
def gym():
    return make_gym("Security Gym")


@pytest.fixture
def other_gym():
    return make_gym("Other Gym")


def login(email: str, password: str = PASSWORD):
    res = client.post(f"{API}/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200, res.text
    return res.json()


def bearer(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


# ─── Sessions ────────────────────────────────────────────────────────────

def test_login_returns_refresh_token_and_refresh_rotates(gym):
    tokens = login(gym.emails["OWNER"])
    assert tokens["refresh_token"] and tokens["expires_in"] > 0

    first = client.post(f"{API}/auth/refresh", json={"refresh_token": tokens["refresh_token"]})
    assert first.status_code == 200, first.text
    rotated = first.json()
    assert rotated["refresh_token"] != tokens["refresh_token"]
    assert client.get(f"{API}/auth/me", headers=bearer(rotated["access_token"])).status_code == 200

    # The old refresh token is single-use.
    reused = client.post(f"{API}/auth/refresh", json={"refresh_token": tokens["refresh_token"]})
    assert reused.status_code == 401


def test_logout_revokes_the_access_token(gym):
    tokens = login(gym.emails["STAFF"])
    headers = bearer(tokens["access_token"])
    assert client.get(f"{API}/auth/me", headers=headers).status_code == 200

    assert client.post(f"{API}/auth/logout", headers=headers).status_code == 200
    assert client.get(f"{API}/auth/me", headers=headers).status_code == 401
    assert client.post(f"{API}/auth/refresh", json={"refresh_token": tokens["refresh_token"]}).status_code == 401


def test_password_change_signs_out_other_devices_only(gym):
    phone = login(gym.emails["TRAINER"])
    laptop = login(gym.emails["TRAINER"])
    res = client.put(f"{API}/auth/me/password", headers=bearer(laptop["access_token"]),
                     json={"current_password": PASSWORD, "new_password": "a-new-password-123"})
    assert res.status_code == 200, res.text
    assert client.get(f"{API}/auth/me", headers=bearer(laptop["access_token"])).status_code == 200
    assert client.get(f"{API}/auth/me", headers=bearer(phone["access_token"])).status_code == 401


def test_session_list_and_revoke(gym):
    a = login(gym.emails["MANAGER"])
    b = login(gym.emails["MANAGER"])
    sessions = client.get(f"{API}/auth/sessions", headers=bearer(a["access_token"])).json()
    assert len(sessions) >= 2 and sum(1 for s in sessions if s["current"]) == 1
    other = next(s for s in sessions if not s["current"])
    assert client.delete(f"{API}/auth/sessions/{other['id']}", headers=bearer(a["access_token"])).status_code == 200
    assert client.get(f"{API}/auth/me", headers=bearer(b["access_token"])).status_code == 401


def test_forged_super_admin_role_claim_is_rejected(gym):
    forged = create_access_token(gym.user_ids["OWNER"], gym.id, "SUPER_ADMIN")
    assert client.get(f"{API}/superadmin/overview", headers=bearer(forged)).status_code in (401, 403)


# ─── Registration gates ──────────────────────────────────────────────────

def test_legacy_registration_is_off_in_production(monkeypatch):
    monkeypatch.setattr(settings, "ENVIRONMENT", "production")
    monkeypatch.setattr(settings, "LEGACY_REGISTRATION_ENABLED", None)
    res = client.post(f"{API}/auth/register", json={
        "email": f"legacy-{uuid.uuid4().hex[:6]}@example.com", "password": "password123",
        "full_name": "Legacy Owner", "gym_name": "Legacy Gym",
    })
    assert res.status_code == 403


def test_member_self_signup_requires_existing_member_record(gym):
    stranger = client.post(f"{API}/auth/register/member", json={
        "email": f"stranger-{uuid.uuid4().hex[:6]}@example.com", "password": "password123",
        "full_name": "Stranger", "workspace_slug": gym.slug,
    })
    assert stranger.status_code == 403

    # A walk-in the gym added with this email can claim their record.
    email = f"walkin-{uuid.uuid4().hex[:6]}@example.com"
    created = client.post(f"{API}/members", headers=gym.headers["OWNER"],
                          json={"first_name": "Walk", "last_name": "In", "email": email, "phone": "+919811112222"})
    assert created.status_code == 201, created.text
    claimed = client.post(f"{API}/auth/register/member", json={
        "email": email, "password": "password123", "full_name": "Walk In", "workspace_slug": gym.slug,
    })
    assert claimed.status_code == 201, claimed.text
    db = TestingSessionLocal()
    try:
        from app.models.member import Member
        member = db.get(Member, created.json()["id"])
        user = db.query(User).filter(User.email == email).first()
        assert member.user_id == user.id
    finally:
        db.close()


# ─── Role checks the audit found missing ─────────────────────────────────

@pytest.mark.parametrize("method,path,body", [
    ("get", "/dashboard/metrics", None),
    ("get", "/users/", None),
    ("post", "/machines/", {"name": "Rack", "brand": "X", "model": "Y", "muscle_group": "Legs"}),
    ("get", "/websites/my-website", None),
    ("post", "/websites/my-website/publish", None),
])
def test_members_cannot_reach_staff_endpoints(gym, method, path, body):
    res = getattr(client, method)(f"{API}{path}", headers=gym.headers["USER"], **({"json": body} if body else {}))
    assert res.status_code == 403, (path, res.text)


def test_owner_still_reaches_staff_endpoints(gym):
    assert client.get(f"{API}/dashboard/metrics", headers=gym.headers["OWNER"]).status_code == 200
    assert client.get(f"{API}/users/", headers=gym.headers["OWNER"]).status_code == 200
    assert client.get(f"{API}/websites/my-website", headers=gym.headers["OWNER"]).status_code == 200


def test_member_search_never_returns_other_people(gym):
    res = client.get(f"{API}/search/global", params={"q": "Noor"}, headers=gym.headers["USER"])
    assert res.status_code == 200
    assert res.json()["members"] == [] and res.json()["trainers"] == []
    staff = client.get(f"{API}/search/global", params={"q": "Noor"}, headers=gym.headers["OWNER"]).json()
    assert any("Noor" in (m.get("name") or "") for m in staff["members"])


def test_public_site_is_not_auto_published(gym):
    assert client.get(f"{API}/websites/public/{gym.slug}").status_code == 404
    lead = client.post(f"{API}/websites/public/{gym.slug}/lead", json={"name": "Bot", "phone": "+919800000077"})
    assert lead.status_code == 404
    client.post(f"{API}/websites/my-website/publish", headers=gym.headers["OWNER"])
    site = client.get(f"{API}/websites/my-website", headers=gym.headers["OWNER"]).json()
    assert client.get(f"{API}/websites/public/{site['subdomain']}").status_code == 200


def test_public_lead_honeypot_is_dropped(gym):
    client.post(f"{API}/websites/my-website/publish", headers=gym.headers["OWNER"])
    site = client.get(f"{API}/websites/my-website", headers=gym.headers["OWNER"]).json()
    res = client.post(f"{API}/websites/public/{site['subdomain']}/lead",
                      json={"name": "Spam Bot", "phone": "+919800000088", "website": "http://spam.example"})
    assert res.status_code == 200
    leads = client.get(f"{API}/crm/leads", headers=gym.headers["OWNER"]).json()["items"]
    assert not any(l["phone"] == "+919800000088" for l in leads)


def test_spoofed_forwarded_for_does_not_bypass_rate_limits(monkeypatch):
    monkeypatch.setattr(settings, "TRUST_FORWARDED_FOR", False)
    statuses = []
    for i in range(25):
        res = client.post(f"{API}/auth/login", headers={"X-Forwarded-For": f"10.0.0.{i}"},
                          json={"email": "nobody@example.com", "password": "wrong-password"})
        statuses.append(res.status_code)
    assert 429 in statuses  # a fresh fake IP per request no longer resets the limit


def test_trusted_proxy_uses_the_hop_it_appended(monkeypatch):
    from starlette.requests import Request
    from app.core.rate_limit import client_ip

    monkeypatch.setattr(settings, "TRUST_FORWARDED_FOR", True)
    scope = {"type": "http", "headers": [(b"x-forwarded-for", b"6.6.6.6, 203.0.113.9")], "client": ("172.17.0.1", 1)}
    assert client_ip(Request(scope)) == "203.0.113.9"


def test_rate_limits_cannot_be_disabled_in_production():
    from app.core.config import Settings
    with pytest.raises(ValueError):
        Settings(ENVIRONMENT="production", RATE_LIMITS_ENABLED=False, SECRET_KEY="x" * 40, OTP_PROVIDER="aisensy",
                 GOOGLE_CLIENT_ID="cid")
