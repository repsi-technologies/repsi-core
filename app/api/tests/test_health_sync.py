"""Health sync: idempotent upsert, validation, per-user and per-tenant isolation, erasure."""
from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient

from app.core.database import Base
from app.core.security import create_access_token, get_password_hash
from app.main import app
from app.models.user import User, UserRole, Workspace, WorkspaceMember
from tests.conftest import TestingSessionLocal, test_engine

client = TestClient(app)
URL = "/api/v1/health/daily"


def _today():
    return datetime.now(timezone.utc).date()


@pytest.fixture
def people():
    Base.metadata.drop_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)
    db = TestingSessionLocal()
    ws_a = Workspace(name="Health A", slug="health-a", is_active=True, timezone="UTC")
    ws_b = Workspace(name="Health B", slug="health-b", is_active=True, timezone="UTC")
    db.add_all([ws_a, ws_b])
    db.flush()
    out = {}
    for key, ws, email in (("a1", ws_a, "a1@h.test"), ("a2", ws_a, "a2@h.test"), ("b1", ws_b, "b1@h.test")):
        u = User(email=email, full_name=key, hashed_password=get_password_hash("pass1234"), is_active=True)
        db.add(u)
        db.flush()
        db.add(WorkspaceMember(workspace_id=ws.id, user_id=u.id, role=UserRole.USER, is_active=True))
        out[key] = {"Authorization": f"Bearer {create_access_token(u.id, ws.id, 'USER')}"}
    db.commit()
    db.close()
    return out


def _body(steps=1000, day=None, source="health_connect"):
    return {"source": source, "days": [{"day": str(day or _today()), "steps": steps, "distance_meters": 800, "active_calories": 55}]}


def test_requires_auth():
    assert client.get(URL).status_code in (401, 403)
    assert client.put(URL, json=_body()).status_code in (401, 403)


def test_sync_is_idempotent_and_replaces_the_day(people):
    assert client.put(URL, json=_body(1000), headers=people["a1"]).status_code == 200
    assert client.put(URL, json=_body(4200), headers=people["a1"]).status_code == 200
    data = client.get(URL, headers=people["a1"]).json()
    assert len(data["days"]) == 1
    assert data["today_steps"] == 4200 and data["total_steps"] == 4200


def test_summary_covers_requested_window(people):
    body = {"source": "health_connect", "days": [
        {"day": str(_today() - timedelta(days=i)), "steps": 1000 * (i + 1)} for i in range(10)
    ]}
    assert client.put(URL, json=body, headers=people["a1"]).status_code == 200
    week = client.get(URL, params={"days": 7}, headers=people["a1"]).json()
    assert len(week["days"]) == 7
    assert week["total_steps"] == sum(1000 * (i + 1) for i in range(7))


@pytest.mark.parametrize("patch", [{"steps": -1}, {"steps": 10_000_000}, {"active_minutes": 5000}, {"avg_heart_rate": 5}])
def test_rejects_implausible_values(people, patch):
    body = _body()
    body["days"][0].update(patch)
    assert client.put(URL, json=body, headers=people["a1"]).status_code == 422


def test_rejects_unknown_source_and_oversized_batches(people):
    assert client.put(URL, json=_body(source="evil"), headers=people["a1"]).status_code == 422
    big = {"days": [{"day": str(_today() - timedelta(days=i)), "steps": 1} for i in range(32)]}
    assert client.put(URL, json=big, headers=people["a1"]).status_code == 422


def test_future_days_are_ignored(people):
    body = _body(day=_today() + timedelta(days=5))
    assert client.put(URL, json=body, headers=people["a1"]).json() == []


def test_users_and_gyms_cannot_see_each_other(people):
    client.put(URL, json=_body(7777), headers=people["a1"])
    assert client.get(URL, headers=people["a2"]).json()["total_steps"] == 0
    assert client.get(URL, headers=people["b1"]).json()["total_steps"] == 0
    assert client.delete(URL, headers=people["b1"]).json()["deleted"] == 0
    assert client.get(URL, headers=people["a1"]).json()["total_steps"] == 7777


def test_user_can_erase_own_data(people):
    client.put(URL, json=_body(), headers=people["a1"])
    assert client.delete(URL, headers=people["a1"]).json()["deleted"] == 1
    assert client.get(URL, headers=people["a1"]).json()["days"] == []
