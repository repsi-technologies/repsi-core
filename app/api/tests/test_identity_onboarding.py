"""
Unified identity, WhatsApp OTP, onboarding, branches and invitations.
External services (Google, AiSensy) are replaced with fakes at the HTTP boundary.
"""
import uuid
from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.models.auth import EmailOtpChallenge, PhoneOtpChallenge
from tests.conftest import TestingSessionLocal

client = TestClient(app)
API = "/api/v1"
PNG = b"\x89PNG\r\n\x1a\n" + b"\x00" * 64

HOURS = {d: {"closed": False, "open": "06:00", "close": "22:00"} for d in ("mon", "tue", "wed", "thu", "fri", "sat")}
HOURS["sun"] = {"closed": True}


def uid() -> str:
    return uuid.uuid4().hex[:8]


def unique_phone() -> str:
    # Valid Indian mobile numbers: 10 digits starting with 9.
    return "9" + str(uuid.uuid4().int)[:9]


def auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def phone_signup(name="Asha Rao", email=None, password="Str0ngPass!", phone=None) -> dict:
    phone = phone or unique_phone()
    email = email or f"asha_{uid()}@example.com"
    r = client.post(
        f"{API}/auth/signup/request-otps",
        json={"full_name": name, "email": email, "phone": phone, "country": "IN"},
    )
    assert r.status_code == 200, r.text
    r = client.post(
        f"{API}/auth/signup",
        json={
            "full_name": name,
            "email": email,
            "phone": phone,
            "country": "IN",
            "password": password,
            "phone_code": "123456",
            "email_code": "123456",
        },
    )
    assert r.status_code == 201, r.text
    return {**r.json(), "phone": phone, "email": email, "password": password}


def legacy_phone_signup(name="Asha Rao", email=None, password="Str0ngPass!", phone=None) -> dict:
    phone = phone or unique_phone()
    email = email or f"legacy_{uid()}@example.com"
    r = client.post(f"{API}/auth/otp/request", json={"phone": phone, "country": "IN"})
    assert r.status_code == 200, r.text
    phone_e164 = r.json()["phone"]
    assert phone_e164.endswith(phone.lstrip("+91")) or phone_e164 == phone
    r = client.post(f"{API}/auth/otp/verify", json={"phone": phone, "country": "IN", "code": "123456"})
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["status"] == "registration_required"
    r = client.post(
        f"{API}/auth/signup",
        json={"registration_token": body["registration_token"], "full_name": name, "email": email, "password": password},
    )
    assert r.status_code == 201, r.text
    return {**r.json(), "phone": phone, "phone_e164": phone_e164, "email": email, "password": password}


class FakeResponse:
    def __init__(self, status_code: int, payload: dict):
        self.status_code = status_code
        self._payload = payload

    def json(self):
        return self._payload


@pytest.fixture
def google(monkeypatch):
    """Configure what Google's tokeninfo endpoint returns for a given access token."""
    tokens: dict[str, dict] = {}

    def fake_get(url, params=None, headers=None, timeout=None):
        token = (params or {}).get("access_token") or (headers or {}).get("Authorization", "").replace("Bearer ", "")
        info = tokens.get(token)
        if info is None:
            return FakeResponse(400, {"error": "invalid_token"})
        if "userinfo" in url:
            return FakeResponse(200, {"name": info.get("name", "Google User")})
        return FakeResponse(200, info)

    monkeypatch.setattr("app.services.auth.httpx.get", fake_get)

    def register(email: str, sub: str | None = None, verified: bool = True, aud: str = "test-google-client-id") -> str:
        token = f"gtoken-{uid()}-{uid()}"
        tokens[token] = {
            "aud": aud, "sub": sub or f"sub-{uid()}", "email": email,
            "email_verified": "true" if verified else "false", "name": "Google Person",
        }
        return token

    return register


def business_payload(name=None, **extra):
    payload = {
        "name": name or f"Iron Temple {uid()}",
        "phone": "9845012345",
        "phone_country": "IN",
        "business_email": f"hello_{uid()}@irontemple.in",
        "gym_type": "Gym & Fitness center",
        "business_types": ["Gym", "PT Studio"],
        "address_line1": "12 MG Road",
        "city": "Coimbatore",
        "state": "Tamil Nadu",
        "postal_code": "641004",
        "country_code": "IN",
        "country": "India",
    }
    payload.update(extra)
    return payload


def onboard(token: str, name=None) -> dict:
    # Unique business phone: a shared one trips the repeat-trial block and starts the gym expired.
    payload = business_payload(name, phone=f"98{uuid.uuid4().int % 10**8:08d}")
    r = client.put(f"{API}/onboarding/business", json=payload, headers=auth(token))
    assert r.status_code == 200, r.text
    session = r.json()["session"]
    t = session["access_token"]
    r = client.put(
        f"{API}/onboarding/preferences",
        json={"timezone": "Asia/Kolkata", "currency": "INR", "locale": "en-IN", "opening_hours": HOURS,
              "closed_dates": [{"date": "2026-12-25", "label": "Christmas"}]},
        headers=auth(t),
    )
    assert r.status_code == 200, r.text
    assert client.post(f"{API}/onboarding/advance", json={"step": "branches"}, headers=auth(t)).status_code == 200
    assert client.post(f"{API}/onboarding/advance", json={"step": "team"}, headers=auth(t)).status_code == 200
    r = client.post(f"{API}/onboarding/complete", json={}, headers=auth(t))
    assert r.status_code == 200, r.text
    return r.json()


# ─── WhatsApp OTP ──────────────────────────────────────────────────────

def test_phone_signup_with_test_otp_leads_to_onboarding():
    session = phone_signup()
    assert session["onboarding_required"] is True
    assert session["next_path"] == "/onboarding"
    assert session["user"]["phone_verified"] is True
    assert session["user"]["email_verified"] is True


def test_dual_otp_signup_verifies_both_email_and_phone():
    phone = unique_phone()
    email = f"dual_{uid()}@example.com"
    name = "Dual Verified User"
    password = "StrongPassword123!"

    # 1. Request OTPs to both phone and email
    res = client.post(
        f"{API}/auth/signup/request-otps",
        json={"full_name": name, "email": email, "phone": phone, "country": "IN"},
    )
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["phone"].startswith("+91")
    assert data["email"] == email.lower()
    assert data["phone_resend_in"] > 0
    assert data["email_resend_in"] > 0

    # 2. Wrong phone code rejected
    r_bad_phone = client.post(
        f"{API}/auth/signup",
        json={
            "full_name": name,
            "email": email,
            "phone": phone,
            "country": "IN",
            "password": password,
            "phone_code": "000000",
            "email_code": "123456",
        },
    )
    assert r_bad_phone.status_code == 400

    # 3. Wrong email code rejected
    r_bad_email = client.post(
        f"{API}/auth/signup",
        json={
            "full_name": name,
            "email": email,
            "phone": phone,
            "country": "IN",
            "password": password,
            "phone_code": "123456",
            "email_code": "000000",
        },
    )
    assert r_bad_email.status_code == 400

    # 4. Correct both codes creates account with BOTH verified
    res_ok = client.post(
        f"{API}/auth/signup",
        json={
            "full_name": name,
            "email": email,
            "phone": phone,
            "country": "IN",
            "password": password,
            "phone_code": "123456",
            "email_code": "123456",
        },
    )
    assert res_ok.status_code == 201, res_ok.text
    session = res_ok.json()
    assert session["user"]["phone_verified"] is True
    assert session["user"]["email_verified"] is True
    assert session["onboarding_required"] is True
    assert session["next_path"] == "/onboarding"


def test_phone_login_returns_same_account():
    s = phone_signup()
    phone = s["phone"]
    r_req = client.post(f"{API}/auth/otp/request", json={"phone": phone, "country": "IN"})
    assert r_req.status_code == 200, r_req.text
    r = client.post(f"{API}/auth/otp/verify", json={"phone": f"+91 {phone}", "code": "123456"})
    assert r.status_code == 200
    assert r.json()["status"] == "authenticated"
    assert r.json()["token"]["user"]["id"] == s["user"]["id"]


def test_incorrect_otp_rejected_and_attempts_limited():
    phone = unique_phone()
    r_req = client.post(f"{API}/auth/otp/request", json={"phone": phone, "country": "IN"})
    assert r_req.status_code == 200, r_req.text
    for _ in range(5):
        r = client.post(f"{API}/auth/otp/verify", json={"phone": phone, "country": "IN", "code": "000000"})
        assert r.status_code == 400
    r = client.post(f"{API}/auth/otp/verify", json={"phone": phone, "country": "IN", "code": "123456"})
    assert r.status_code == 429  # locked even with the right code until a new one is requested


def test_otp_single_use_and_expiry():
    phone = unique_phone()
    r_req = client.post(f"{API}/auth/otp/request", json={"phone": phone, "country": "IN"})
    assert r_req.status_code == 200, r_req.text
    assert client.post(f"{API}/auth/otp/verify", json={"phone": phone, "country": "IN", "code": "123456"}).status_code == 200
    # Reusing a consumed code fails.
    assert client.post(f"{API}/auth/otp/verify", json={"phone": phone, "country": "IN", "code": "123456"}).status_code == 400

    phone2 = unique_phone()
    r_exp = client.post(f"{API}/auth/otp/request", json={"phone": phone2, "country": "IN"})
    assert r_exp.status_code == 200
    phone2_e164 = r_exp.json()["phone"]
    db = TestingSessionLocal()
    ch = db.query(PhoneOtpChallenge).filter(PhoneOtpChallenge.phone_e164 == phone2_e164).first()
    assert ch is not None, f"Expected PhoneOtpChallenge for {phone2_e164} to exist in DB"
    ch.expires_at = datetime.now(timezone.utc) - timedelta(seconds=1)
    db.commit()
    db.close()
    r = client.post(f"{API}/auth/otp/verify", json={"phone": phone2, "country": "IN", "code": "123456"})
    assert r.status_code == 400
    assert "expired" in r.json()["detail"].lower()


def test_otp_resend_cooldown_and_hourly_cap():
    phone = unique_phone()
    r1 = client.post(f"{API}/auth/otp/request", json={"phone": phone, "country": "IN"})
    assert r1.status_code == 200
    phone_e164 = r1.json()["phone"]
    r = client.post(f"{API}/auth/otp/request", json={"phone": phone, "country": "IN"})
    assert r.status_code == 429 and "Retry-After" in r.headers

    db = TestingSessionLocal()
    ch = db.query(PhoneOtpChallenge).filter(PhoneOtpChallenge.phone_e164 == phone_e164).first()
    assert ch is not None, f"Expected PhoneOtpChallenge for {phone_e164} to exist in DB"
    ch.send_count = 5
    ch.last_sent_at = datetime.now(timezone.utc) - timedelta(minutes=2)
    db.commit()
    db.close()
    r = client.post(f"{API}/auth/otp/request", json={"phone": phone, "country": "IN"})
    assert r.status_code == 429
    assert "Too many codes" in r.json()["detail"]


def test_email_otp_single_use_and_expiry():
    email = f"email_otp_{uid()}@example.com"
    assert client.post(f"{API}/auth/email-otp/request", json={"email": email}).status_code == 200
    assert client.post(f"{API}/auth/email-otp/verify", json={"email": email, "code": "123456"}).status_code == 200
    # Reusing a consumed code fails.
    assert client.post(f"{API}/auth/email-otp/verify", json={"email": email, "code": "123456"}).status_code == 400

    email2 = f"email_exp_{uid()}@example.com"
    r2 = client.post(f"{API}/auth/email-otp/request", json={"email": email2})
    assert r2.status_code == 200
    db = TestingSessionLocal()
    ch = db.query(EmailOtpChallenge).filter(EmailOtpChallenge.email == email2.lower()).first()
    assert ch is not None, f"Expected EmailOtpChallenge for {email2} to exist in DB"
    ch.expires_at = datetime.now(timezone.utc) - timedelta(seconds=1)
    db.commit()
    db.close()
    r = client.post(f"{API}/auth/email-otp/verify", json={"email": email2, "code": "123456"})
    assert r.status_code == 400
    assert "expired" in r.json()["detail"].lower()


def test_email_otp_resend_cooldown_and_hourly_cap():
    email = f"cooldown_{uid()}@example.com"
    assert client.post(f"{API}/auth/email-otp/request", json={"email": email}).status_code == 200
    r = client.post(f"{API}/auth/email-otp/request", json={"email": email})
    assert r.status_code == 429 and "Retry-After" in r.headers

    db = TestingSessionLocal()
    ch = db.query(EmailOtpChallenge).filter(EmailOtpChallenge.email == email.lower()).first()
    assert ch is not None, f"Expected EmailOtpChallenge for {email} to exist in DB"
    ch.send_count = 5
    ch.last_sent_at = datetime.now(timezone.utc) - timedelta(minutes=2)
    db.commit()
    db.close()
    r = client.post(f"{API}/auth/email-otp/request", json={"email": email})
    assert r.status_code == 429
    assert "Too many" in r.json()["detail"]


def test_otp_provider_production_rules(monkeypatch):
    from fastapi import HTTPException
    from app.services.otp import get_otp_provider, TestOtpProvider, AiSensyOtpProvider

    monkeypatch.setattr("app.core.config.settings.ENVIRONMENT", "production")
    monkeypatch.setattr("app.core.config.settings.OTP_PROVIDER", "test")
    monkeypatch.setattr("app.core.config.settings.ALLOW_TEST_OTP_IN_PRODUCTION", False)

    # In production with test provider and without explicit opt-in, it must raise 503
    with pytest.raises(HTTPException) as exc_info:
        get_otp_provider()
    assert exc_info.value.status_code == 503
    assert "Phone verification is not available" in exc_info.value.detail

    # When explicitly opted in, it allows TestOtpProvider
    monkeypatch.setattr("app.core.config.settings.ALLOW_TEST_OTP_IN_PRODUCTION", True)
    provider = get_otp_provider()
    assert isinstance(provider, TestOtpProvider)

    # When configured for aisensy, it provides AiSensyOtpProvider
    monkeypatch.setattr("app.core.config.settings.OTP_PROVIDER", "aisensy")
    assert isinstance(get_otp_provider(), AiSensyOtpProvider)


def test_invalid_phone_for_country_rejected():
    r = client.post(f"{API}/auth/otp/request", json={"phone": "12345", "country": "IN"})
    assert r.status_code == 422
    r = client.post(f"{API}/auth/otp/request", json={"phone": "2025550123", "country": "US"})
    assert r.status_code == 200
    assert r.json()["phone"] == "+12025550123"


def test_aisensy_provider_payload_and_failure(monkeypatch):
    from app.core.config import settings
    from app.services import otp as otp_module

    sent = {}

    def fake_post(url, json=None, timeout=None):
        sent.update(url=url, json=json)
        return FakeResponse(200, {"success": True})

    monkeypatch.setattr(settings, "AISENSY_API_KEY", "key-123")
    monkeypatch.setattr(settings, "AISENSY_CAMPAIGN_NAME", "repsi_otp")
    monkeypatch.setattr(otp_module.httpx, "post", fake_post)
    provider = otp_module.AiSensyOtpProvider()
    code = provider.generate_code()
    assert len(code) == 6 and code.isdigit()
    provider.send("+919876543210", code)
    assert sent["json"]["destination"] == "919876543210"
    assert sent["json"]["templateParams"] == [code]
    assert sent["json"]["campaignName"] == "repsi_otp"

    monkeypatch.setattr(otp_module.httpx, "post", lambda *a, **k: FakeResponse(401, {}))
    db = TestingSessionLocal()
    phone = f"+91{unique_phone()}"
    with pytest.raises(Exception) as exc:
        otp_module.PhoneOtpService(db, provider=provider).request(phone, "auth")
    assert getattr(exc.value, "status_code", None) == 503
    assert db.query(PhoneOtpChallenge).filter(PhoneOtpChallenge.phone_e164 == phone).first() is None
    db.close()


def test_fixed_otp_refused_in_production():
    from app.core.config import Settings

    with pytest.raises(ValueError):
        Settings(ENVIRONMENT="production", OTP_PROVIDER="test", SECRET_KEY="x" * 40)
    ok = Settings(ENVIRONMENT="production", OTP_PROVIDER="aisensy", SECRET_KEY="x" * 40)
    assert ok.is_production


# ─── Unified identity ──────────────────────────────────────────────────

def test_google_first_then_password_same_account(google):
    email = f"Mixed.Case_{uid()}@Example.com"
    sub = f"sub-{uid()}"
    token = google(email.lower(), sub=sub)
    r = client.post(f"{API}/auth/google", json={"token": token})
    assert r.status_code == 200, r.text
    g = r.json()
    assert g["user"]["email"] == email.lower()
    assert g["next_path"] == "/onboarding"

    # No password yet: password sign-in fails until one is set.
    assert client.post(f"{API}/auth/login", json={"email": email, "password": "NewPassw0rd!"}).status_code == 401
    r = client.put(f"{API}/auth/me/password", json={"new_password": "NewPassw0rd!"}, headers=auth(g["access_token"]))
    assert r.status_code == 200
    r = client.post(f"{API}/auth/login", json={"email": email.upper(), "password": "NewPassw0rd!"})
    assert r.status_code == 200
    assert r.json()["user"]["id"] == g["user"]["id"]

    # Second Google sign-in (same Google account) resolves via the stored identity.
    r = client.post(f"{API}/auth/google", json={"token": google(email.lower(), sub=sub)})
    assert r.status_code == 200 and r.json()["user"]["id"] == g["user"]["id"]
    # A different Google account claiming the same email is not silently merged.
    r = client.post(f"{API}/auth/google", json={"token": google(email.lower(), sub="another-google-subject")})
    assert r.status_code == 409


def test_password_with_verified_email_then_google_links(google):
    owner = client.post(f"{API}/auth/google", json={"token": google(f"seed_{uid()}@example.com")}).json()
    # Verified email account created by invitation acceptance.
    onboard(owner["access_token"])
    email = f"coach_{uid()}@example.com"
    inv = client.post(f"{API}/invitations", json={"name": "Coach K", "email": email, "role": "trainer"},
                      headers=auth(_session(owner)["access_token"]))
    assert inv.status_code == 201, inv.text
    raw = _latest_token_for(email)
    accepted = client.post(f"{API}/invitations/accept", json={"token": raw, "password": "CoachPass1!"})
    assert accepted.status_code == 200, accepted.text
    user_id = accepted.json()["user"]["id"]
    assert accepted.json()["user"]["email_verified"] is True

    r = client.post(f"{API}/auth/google", json={"token": google(email)})
    assert r.status_code == 200
    assert r.json()["user"]["id"] == user_id
    assert r.json()["role"] == "TRAINER"


def test_unverified_email_is_never_auto_linked_to_google(google):
    s = legacy_phone_signup()
    token = google(s["email"])
    r = client.post(f"{API}/auth/google", json={"token": token})
    assert r.status_code == 409

    # Secure linking: signed in as the account owner, connect Google with the same email.
    r = client.post(f"{API}/auth/me/identities/google", json={"token": token}, headers=auth(s["access_token"]))
    assert r.status_code == 200, r.text
    assert r.json()["google_linked"] is True and r.json()["email_verified"] is True
    r = client.post(f"{API}/auth/google", json={"token": token})
    assert r.status_code == 200 and r.json()["user"]["id"] == s["user"]["id"]


def test_google_link_rejects_different_email(google):
    s = legacy_phone_signup()
    r = client.post(f"{API}/auth/me/identities/google", json={"token": google(f"other_{uid()}@example.com")},
                    headers=auth(s["access_token"]))
    assert r.status_code == 409


def test_google_token_for_other_client_rejected(google):
    r = client.post(f"{API}/auth/google", json={"token": google(f"x_{uid()}@example.com", aud="someone-elses-app")})
    assert r.status_code == 401


def test_google_token_for_configured_mobile_client_is_accepted(google, monkeypatch):
    from app.core.config import settings

    monkeypatch.setattr(settings, "GOOGLE_MOBILE_CLIENT_IDS", "android-client-id, ios-client-id")
    ok = client.post(f"{API}/auth/google", json={"token": google(f"m_{uid()}@example.com", aud="android-client-id")})
    assert ok.status_code == 200, ok.text
    other = client.post(f"{API}/auth/google", json={"token": google(f"n_{uid()}@example.com", aud="unlisted-client")})
    assert other.status_code == 401


def test_duplicate_email_or_phone_signup_rejected():
    s = phone_signup()
    # Same email, new phone.
    phone = unique_phone()
    r_otp = client.post(f"{API}/auth/otp/request", json={"phone": phone, "country": "IN"})
    assert r_otp.status_code == 200, r_otp.text
    r_ver = client.post(f"{API}/auth/otp/verify", json={"phone": phone, "country": "IN", "code": "123456"})
    assert r_ver.status_code == 200, r_ver.text
    reg = r_ver.json()
    r = client.post(f"{API}/auth/signup", json={"registration_token": reg["registration_token"], "full_name": "X Y",
                                                 "email": s["email"].upper(), "password": "Str0ngPass!"})
    assert r.status_code == 409
    # Forged/expired registration token.
    r = client.post(f"{API}/auth/signup", json={"registration_token": "x" * 40, "full_name": "X Y",
                                                 "email": f"n_{uid()}@example.com", "password": "Str0ngPass!"})
    assert r.status_code == 400


def test_password_reset_sets_password_and_verifies_email(monkeypatch):
    s = phone_signup()
    captured = {}
    monkeypatch.setattr("app.services.auth.send_password_reset_email",
                        lambda email, name, url: captured.update(url=url))
    assert client.post(f"{API}/auth/forgot-password", json={"email": s["email"]}).status_code == 200
    assert "url" in captured, "Expected password reset email to be dispatched"
    token = captured["url"].split("token=")[1]
    r = client.post(f"{API}/auth/reset-password", json={"token": token, "new_password": "Brand+New1"})
    assert r.status_code == 200
    assert r.json()["user"]["id"] == s["user"]["id"] and r.json()["user"]["email_verified"] is True
    assert client.post(f"{API}/auth/reset-password", json={"token": token, "new_password": "Again+New1"}).status_code == 400
    # Unknown emails get the same response.
    assert client.post(f"{API}/auth/forgot-password", json={"email": f"nobody_{uid()}@x.com"}).status_code == 200


# ─── Onboarding & organization ─────────────────────────────────────────

def _session(s: dict) -> dict:
    r = client.get(f"{API}/auth/session", headers=auth(s["access_token"]))
    assert r.status_code == 200, r.text
    return r.json()


def test_onboarding_resume_and_no_duplicates():
    s = phone_signup()
    t = s["access_token"]
    state = client.get(f"{API}/onboarding/state", headers=auth(t)).json()
    assert state["has_workspace"] is False and state["current_step"] == "business"

    first = client.put(f"{API}/onboarding/business", json=business_payload("Resume Gym " + uid()), headers=auth(t)).json()
    again = client.put(f"{API}/onboarding/business", json=business_payload("Resume Gym " + uid()), headers=auth(t)).json()
    assert first["created"] is True and again["created"] is False
    assert first["state"]["workspace_id"] == again["state"]["workspace_id"]
    assert len(again["state"]["branches"]) == 1 and again["state"]["branches"][0]["is_primary"] is True

    # "Refresh": state comes back from the server.
    state = client.get(f"{API}/onboarding/state", headers=auth(t)).json()
    assert state["steps"]["business"] is True and state["current_step"] == "preferences"
    assert state["profile"]["city"] == "Coimbatore" and state["profile"]["phone"] == "+919845012345"

    # Can't launch before required steps.
    assert client.post(f"{API}/onboarding/complete", json={}, headers=auth(t)).status_code == 422

    session = _session(s)
    assert session["next_path"] == "/onboarding"


def test_onboarding_validation_errors():
    s = phone_signup()
    bad = business_payload(phone="123", postal_code="!!")
    r = client.put(f"{API}/onboarding/business", json=bad, headers=auth(s["access_token"]))
    assert r.status_code == 422
    r = client.put(f"{API}/onboarding/business", json=business_payload(country_code="ZZ"), headers=auth(s["access_token"]))
    assert r.status_code == 422
    r_biz = client.put(f"{API}/onboarding/business", json=business_payload(), headers=auth(s["access_token"]))
    assert r_biz.status_code == 200, r_biz.text
    bad_hours = dict(HOURS, mon={"closed": False, "open": "22:00", "close": "06:00"})
    r = client.put(f"{API}/onboarding/preferences",
                   json={"timezone": "Asia/Kolkata", "currency": "INR", "opening_hours": bad_hours},
                   headers=auth(s["access_token"]))
    assert r.status_code == 422
    r = client.put(f"{API}/onboarding/preferences",
                   json={"timezone": "Mars/Base", "currency": "INR", "opening_hours": HOURS},
                   headers=auth(s["access_token"]))
    assert r.status_code == 422


def test_full_onboarding_then_settings_persist_and_logo():
    s = phone_signup()
    done = onboard(s["access_token"])
    assert done["session"]["next_path"].endswith("/dashboard")
    t = done["session"]["access_token"]

    # Returning users are not sent back to onboarding.
    r_req = client.post(f"{API}/auth/otp/request", json={"phone": s["phone"], "country": "IN"})
    assert r_req.status_code == 200, r_req.text
    r = client.post(f"{API}/auth/otp/verify", json={"phone": s["phone"], "country": "IN", "code": "123456"})
    assert r.status_code == 200, r.text
    assert r.json()["token"]["next_path"] == f"/{done['workspace_slug']}/dashboard"

    profile = client.get(f"{API}/organization", headers=auth(t)).json()
    assert profile["opening_hours"]["sun"]["closed"] is True
    assert profile["closed_dates"] == [{"date": "2026-12-25", "label": "Christmas"}]
    assert profile["timezone"] == "Asia/Kolkata"

    upd = dict(business_payload(profile["name"]), address_line2="Near Bus Stand", postal_code="641005")
    r = client.put(f"{API}/organization/profile", json=upd, headers=auth(t))
    assert r.status_code == 200, r.text
    assert client.get(f"{API}/organization", headers=auth(t)).json()["postal_code"] == "641005"

    r = client.post(f"{API}/organization/logo", files={"file": ("logo.png", PNG, "image/png")}, headers=auth(t))
    assert r.status_code == 200, r.text
    logo_url = r.json()["logo_url"]
    img = client.get(logo_url)
    assert img.status_code == 200 and img.headers["content-type"] == "image/png"
    r = client.post(f"{API}/organization/logo", files={"file": ("x.png", b"MZ\x90\x00evil", "image/png")}, headers=auth(t))
    assert r.status_code == 415


def test_branches_and_limits():
    s = phone_signup()
    t = onboard(s["access_token"])["session"]["access_token"]
    branches = client.get(f"{API}/branches", headers=auth(t)).json()
    assert len(branches) == 1
    # Trial plan allows a single branch by default.
    r = client.post(f"{API}/branches", json={"name": "Second Branch", "city": "Chennai"}, headers=auth(t))
    assert r.status_code in (201, 402)
    if r.status_code == 201:
        dup = client.post(f"{API}/branches", json={"name": "second branch"}, headers=auth(t))
        assert dup.status_code in (402, 409)


# ─── Invitations, roles and isolation ─────────────────────────────────

def _latest_token_for(email: str) -> str:
    """Re-issue a known token for the latest pending invitation (tokens are only stored hashed)."""
    import hashlib
    from app.models.invitation import GymInvitation, InvitationStatus

    db = TestingSessionLocal()
    inv = (
        db.query(GymInvitation)
        .filter(GymInvitation.email == email.lower(), GymInvitation.status == InvitationStatus.PENDING)
        .order_by(GymInvitation.created_at.desc())
        .first()
    )
    assert inv is not None, f"Expected pending invitation for {email} to exist in DB"
    raw = f"test-token-{uid()}-{uid()}"
    inv.token_hash = hashlib.sha256(raw.encode()).hexdigest()
    db.commit()
    db.close()
    return raw


def _org(name=None):
    s = phone_signup()
    done = onboard(s["access_token"], name)
    return s, done["session"]["access_token"]


def test_invitation_flow_branch_access_and_permissions():
    owner, t = _org()
    main_branch = client.get(f"{API}/branches", headers=auth(t)).json()[0]

    email = f"trainer_{uid()}@example.com"
    r = client.post(f"{API}/invitations", json={"name": "Tara Trainer", "email": email, "role": "trainer",
                                                 "branch_ids": [main_branch["id"]]}, headers=auth(t))
    assert r.status_code == 201, r.text
    # Re-inviting replaces the pending invite rather than duplicating it.
    r = client.post(f"{API}/invitations", json={"name": "Tara Trainer", "email": email.upper(), "role": "trainer",
                                                 "branch_ids": [main_branch["id"]]}, headers=auth(t))
    assert r.status_code == 201
    pending = [i for i in client.get(f"{API}/invitations", headers=auth(t)).json()
               if i["email"] == email and i["status"] == "pending"]
    assert len(pending) == 1

    raw = _latest_token_for(email)
    info = client.get(f"{API}/invitations/verify", params={"token": raw}).json()
    assert info["account_exists"] is False and info["branch_names"] == [main_branch["name"]]
    r = client.post(f"{API}/invitations/accept", json={"token": raw, "password": "short"})
    assert r.status_code == 422
    r = client.post(f"{API}/invitations/accept", json={"token": raw, "password": "TrainerPass1"})
    assert r.status_code == 200, r.text
    trainer = r.json()
    assert trainer["role"] == "TRAINER" and trainer["next_path"].endswith("/trainer/dashboard")
    tt = trainer["access_token"]

    # Already accepted.
    assert client.post(f"{API}/invitations/accept", json={"token": raw, "password": "TrainerPass1"}).status_code == 410

    # Team view shows the branch assignment; trainer can't manage org settings.
    team = client.get(f"{API}/team", headers=auth(t)).json()
    member = next(m for m in team if m["email"] == email)
    assert member["branch_ids"] == [main_branch["id"]] and member["all_branches"] is False
    assert client.post(f"{API}/branches", json={"name": "Nope"}, headers=auth(tt)).status_code == 403
    assert client.post(f"{API}/invitations", json={"name": "Xavi", "email": f"x_{uid()}@e.com", "role": "member"},
                       headers=auth(tt)).status_code == 403
    assert client.put(f"{API}/organization/profile", json=business_payload(), headers=auth(tt)).status_code == 403
    assert client.get(f"{API}/team", headers=auth(tt)).status_code == 403
    assert [b["id"] for b in client.get(f"{API}/branches", headers=auth(tt)).json()] == [main_branch["id"]]

    # Owner changes the trainer to staff and back; can't change own role.
    r = client.put(f"{API}/team/{member['id']}", json={"role": "STAFF", "branch_ids": []}, headers=auth(t))
    assert r.status_code == 200 and r.json()["role"] == "STAFF" and r.json()["all_branches"] is True
    me = next(m for m in team if m["is_self"])
    assert client.put(f"{API}/team/{me['id']}", json={"role": "ADMIN"}, headers=auth(t)).status_code in (400, 403)


def test_invitation_for_existing_account_requires_matching_sign_in():
    owner, t = _org()
    existing = phone_signup()
    other = phone_signup()
    client.post(f"{API}/invitations", json={"name": "Existing", "email": existing["email"], "role": "staff"},
                headers=auth(t))
    raw = _latest_token_for(existing["email"])
    assert client.get(f"{API}/invitations/verify", params={"token": raw}).json()["account_exists"] is True
    # Signed out: must sign in (password is never overwritten).
    assert client.post(f"{API}/invitations/accept", json={"token": raw, "password": "Hijack123!"}).status_code == 409
    # Signed in as someone else: refused.
    r = client.post(f"{API}/invitations/accept", json={"token": raw}, headers=auth(other["access_token"]))
    assert r.status_code == 403
    r = client.post(f"{API}/invitations/accept", json={"token": raw}, headers=auth(existing["access_token"]))
    assert r.status_code == 200, r.text
    assert r.json()["user"]["id"] == existing["user"]["id"] and r.json()["role"] == "STAFF"
    # Original password still works.
    login = client.post(f"{API}/auth/login", json={"email": existing["email"], "password": existing["password"]})
    assert login.status_code == 200


def test_revoked_and_expired_invitations():
    owner, t = _org()
    email = f"rev_{uid()}@example.com"
    inv = client.post(f"{API}/invitations", json={"name": "Rev", "email": email, "role": "member"},
                      headers=auth(t)).json()
    raw = _latest_token_for(email)
    assert client.post(f"{API}/invitations/{inv['id']}/revoke", headers=auth(t)).status_code == 200
    assert client.get(f"{API}/invitations/verify", params={"token": raw}).status_code == 410

    email2 = f"exp_{uid()}@example.com"
    r_inv2 = client.post(f"{API}/invitations", json={"name": "Exp", "email": email2, "role": "member"}, headers=auth(t))
    assert r_inv2.status_code == 201, r_inv2.text
    raw2 = _latest_token_for(email2)
    from app.models.invitation import GymInvitation
    db = TestingSessionLocal()
    inv2 = db.query(GymInvitation).filter(GymInvitation.email == email2).first()
    assert inv2 is not None, f"Expected invitation for {email2} to exist in DB"
    inv2.expires_at = datetime.now(timezone.utc) - timedelta(minutes=1)
    db.commit()
    db.close()
    r = client.post(f"{API}/invitations/accept", json={"token": raw2, "password": "LongEnough1"})
    assert r.status_code == 410 and "expired" in r.json()["detail"]
    assert client.get(f"{API}/invitations/verify", params={"token": "nonsense-token-value-123"}).status_code == 404


def test_cross_organization_isolation():
    _, ta = _org()
    _, tb = _org()
    branch_a = client.get(f"{API}/branches", headers=auth(ta)).json()[0]
    inv_a = client.post(f"{API}/invitations", json={"name": "Anu", "email": f"a_{uid()}@e.com", "role": "member"},
                        headers=auth(ta)).json()
    team_a = client.get(f"{API}/team", headers=auth(ta)).json()

    assert client.put(f"{API}/branches/{branch_a['id']}", json={"name": "Hijacked"}, headers=auth(tb)).status_code == 404
    assert client.post(f"{API}/invitations/{inv_a['id']}/revoke", headers=auth(tb)).status_code == 404
    assert client.put(f"{API}/team/{team_a[0]['id']}", json={"is_active": False}, headers=auth(tb)).status_code == 404
    assert branch_a["id"] not in [b["id"] for b in client.get(f"{API}/branches", headers=auth(tb)).json()]
    # Branch ids from another org can't be granted in an invitation.
    r = client.post(f"{API}/invitations", json={"name": "Bala", "email": f"b_{uid()}@e.com", "role": "trainer",
                                                 "branch_ids": [branch_a["id"]]}, headers=auth(tb))
    assert r.status_code == 422
    # Switching session into an org you don't belong to falls back to your own org.
    me_b = client.get(f"{API}/auth/session", params={"workspace": branch_a["id"]}, headers=auth(tb)).json()
    assert me_b["workspace_id"] != team_a[0]["id"]
    r = client.get(f"{API}/organization", headers={**auth(tb), "X-Workspace-ID": inv_a["workspace_id"]})
    assert r.status_code == 403
