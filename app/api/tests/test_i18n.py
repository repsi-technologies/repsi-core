"""Language registry, preference APIs, workspace default language and localized notifications."""
import uuid

from fastapi.testclient import TestClient

from app.core.i18n import (
    LOCALIZED_COPY,
    SUPPORTED_LANGUAGES,
    fallback_chain,
    normalize_language,
    parse_accept_language,
    resolve_language,
)
from app.main import app
from app.models.communication import MessageTemplate, NotificationDelivery
from app.models.member import Member
from app.models.user import User, Workspace
from app.services.notify import notify_member
from tests.conftest import TestingSessionLocal
from tests.factories import make_gym

client = TestClient(app)
API = "/api/v1"
HOURS = {d: {"closed": False, "open": "06:00", "close": "22:00"} for d in ("mon", "tue", "wed", "thu", "fri", "sat", "sun")}


def test_registry_and_resolution():
    assert {"en", "ta", "ml", "hi"} <= set(SUPPORTED_LANGUAGES)
    assert "ur" not in SUPPORTED_LANGUAGES  # planned, not yet selectable
    assert normalize_language(" TA-in ") == "ta"
    assert normalize_language("xx") is None
    assert parse_accept_language("fr-FR,hi;q=0.8,ta;q=0.9") == "ta"
    assert parse_accept_language("fr, de") is None
    assert resolve_language(None, "zz", "ml") == "ml"
    assert resolve_language(None) == "en"
    assert fallback_chain("ta", "hi") == ["ta", "hi", "en"]
    assert fallback_chain("en", "en") == ["en"]


def test_language_update_accepts_hindi_and_rejects_unknown():
    gym = make_gym("Lang Gym")
    headers = gym.headers["USER"]
    r = client.put(f"{API}/auth/me/language", json={"language": "hi"}, headers=headers)
    assert r.status_code == 200 and r.json()["language"] == "hi"
    assert client.get(f"{API}/auth/me", headers=headers).json()["preferred_language"] == "hi"

    # Unknown codes are refused instead of silently resetting the user to English.
    r = client.put(f"{API}/auth/me/language", json={"language": "klingon"}, headers=headers)
    assert r.status_code == 422
    r = client.put(f"{API}/auth/me", json={"preferred_language": "xx"}, headers=headers)
    assert r.status_code == 422
    assert client.get(f"{API}/auth/me", headers=headers).json()["preferred_language"] == "hi"


def test_workspace_default_language_owner_only():
    gym = make_gym("Default Lang Gym")
    payload = {"timezone": "Asia/Kolkata", "currency": "INR", "locale": "ta-IN", "opening_hours": HOURS,
               "default_language": "ta"}
    r = client.put(f"{API}/organization/preferences", json=payload, headers=gym.headers["OWNER"])
    assert r.status_code == 200, r.text
    assert r.json()["default_language"] == "ta"

    assert client.put(f"{API}/organization/preferences", json={**payload, "default_language": "xx"},
                      headers=gym.headers["OWNER"]).status_code == 422
    assert client.put(f"{API}/organization/preferences", json={**payload, "default_language": "hi"},
                      headers=gym.headers["STAFF"]).status_code == 403

    # Omitting the field keeps the saved value.
    r = client.put(f"{API}/organization/preferences", json={k: v for k, v in payload.items() if k != "default_language"},
                   headers=gym.headers["OWNER"])
    assert r.json()["default_language"] == "ta"


def test_notifications_use_member_language_then_gym_default():
    gym = make_gym("Notify Lang Gym")
    db = TestingSessionLocal()
    try:
        user = db.get(User, gym.user_ids["USER"])
        user.preferred_language = "ta"
        db.get(Workspace, gym.id).default_language = "ml"
        db.commit()

        member = db.get(Member, gym.member_id)
        notify_member(db, member, "welcome", f"t-{uuid.uuid4().hex}")
        walk_in = db.get(Member, gym.other_member_id)
        walk_in.email = f"walkin.{uuid.uuid4().hex[:6]}@example.com"
        notify_member(db, walk_in, "welcome", f"t-{uuid.uuid4().hex}")
        db.commit()

        rows = db.query(NotificationDelivery).filter(NotificationDelivery.workspace_id == gym.id).all()
        mine = [r for r in rows if r.member_id == gym.member_id]
        theirs = [r for r in rows if r.member_id == gym.other_member_id]
        assert mine and all(r.language == "ta" for r in mine)
        assert LOCALIZED_COPY["ta"]["welcome"][1].split(",")[0].replace("{{first_name}}", "Mia") in mine[0].body
        # The walk-in has no app account, so the gym's default language applies.
        assert theirs and all(r.language == "ml" for r in theirs)
    finally:
        db.close()


def test_template_language_is_picked_per_recipient():
    gym = make_gym("Template Lang Gym")
    for language, body in (("en", "Hello {{first_name}}"), ("hi", "नमस्ते {{first_name}}")):
        r = client.post(f"{API}/message-templates", headers=gym.headers["OWNER"], json={
            "name": f"Welcome {language}", "channel": "in_app", "category": "welcome", "body": body, "language": language,
        })
        assert r.status_code in (200, 201), r.text
        assert r.json()["language"] == language
    assert client.post(f"{API}/message-templates", headers=gym.headers["OWNER"], json={
        "name": "Bad", "channel": "in_app", "category": "welcome", "body": "Hi there", "language": "xx",
    }).status_code == 422

    db = TestingSessionLocal()
    try:
        db.get(User, gym.user_ids["USER"]).preferred_language = "hi"
        db.commit()
        notify_member(db, db.get(Member, gym.member_id), "welcome", f"t-{uuid.uuid4().hex}")
        db.commit()
        row = db.query(NotificationDelivery).filter(NotificationDelivery.member_id == gym.member_id,
                                                    NotificationDelivery.channel == "in_app").one()
        assert row.body == "नमस्ते Mia"
        assert db.query(MessageTemplate).filter(MessageTemplate.workspace_id == gym.id).count() == 2
    finally:
        db.close()
