"""Self-service account deletion: confirmation, owner guard, anonymisation, session revocation."""
from datetime import date

import pytest
from fastapi.testclient import TestClient

from app.core.database import Base
from app.core.security import create_access_token, get_password_hash
from app.main import app
from app.models.health import HealthDailyActivity
from app.models.member import Member, MemberStatus
from app.models.user import User, UserRole, Workspace, WorkspaceMember
from tests.conftest import TestingSessionLocal, test_engine

client = TestClient(app)
API = "/api/v1"


@pytest.fixture
def gym():
    Base.metadata.drop_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)
    db = TestingSessionLocal()
    ws = Workspace(name="Del Gym", slug="del-gym", is_active=True, timezone="UTC")
    db.add(ws)
    db.flush()

    def make(email, role, password="pass1234"):
        u = User(email=email, full_name=email.split("@")[0], hashed_password=get_password_hash(password) if password else "!unusable",
                 is_active=True, email_verified=True)
        db.add(u)
        db.flush()
        db.add(WorkspaceMember(workspace_id=ws.id, user_id=u.id, role=role, is_active=True))
        return u

    owner = make("owner@del.test", UserRole.OWNER)
    member = make("member@del.test", UserRole.USER)
    google_only = make("g@del.test", UserRole.USER, password=None)
    record = Member(workspace_id=ws.id, user_id=member.id, first_name="Mia", last_name="Del", email=member.email,
                    status=MemberStatus.ACTIVE, joined_date=date(2026, 1, 1))
    db.add(record)
    db.add(HealthDailyActivity(workspace_id=ws.id, user_id=member.id, day=date.today(), steps=100))
    db.commit()
    ids = {"ws": ws.id, "owner": owner.id, "member": member.id, "google": google_only.id, "record": record.id}
    db.close()

    def hdr(uid, role):
        return {"Authorization": f"Bearer {create_access_token(uid, ids['ws'], role)}"}

    return ids, hdr


def test_requires_typed_confirmation_and_correct_password(gym):
    ids, hdr = gym
    h = hdr(ids["member"], "USER")
    assert client.request("DELETE", f"{API}/auth/me", json={"password": "pass1234", "confirm": "nope"}, headers=h).status_code == 400
    assert client.request("DELETE", f"{API}/auth/me", json={"password": "wrong", "confirm": "DELETE"}, headers=h).status_code == 400
    assert client.request("DELETE", f"{API}/auth/me", json={"confirm": "DELETE"}, headers=h).status_code == 400
    assert client.get(f"{API}/auth/me", headers=h).status_code == 200  # still there


def test_gym_owner_cannot_delete_until_they_hand_over_the_gym(gym):
    ids, hdr = gym
    r = client.request("DELETE", f"{API}/auth/me", json={"password": "pass1234", "confirm": "DELETE"}, headers=hdr(ids["owner"], "OWNER"))
    assert r.status_code == 409
    db = TestingSessionLocal()
    assert db.get(User, ids["owner"]).is_active
    db.close()


def test_member_deletion_erases_login_and_keeps_gym_records(gym):
    ids, hdr = gym
    h = hdr(ids["member"], "USER")
    r = client.request("DELETE", f"{API}/auth/me", json={"password": "pass1234", "confirm": "delete"}, headers=h)
    assert r.status_code == 200, r.text

    db = TestingSessionLocal()
    user = db.get(User, ids["member"])
    assert not user.is_active and user.email.endswith("@deleted.invalid") and user.full_name == "Deleted user"
    assert db.query(HealthDailyActivity).filter_by(user_id=ids["member"]).count() == 0
    record = db.get(Member, ids["record"])
    assert record is not None and record.user_id is None  # the gym keeps its member record
    db.close()

    assert client.post(f"{API}/auth/login", json={"email": "member@del.test", "password": "pass1234"}).status_code == 401


def test_google_only_account_confirms_with_the_word(gym):
    ids, hdr = gym
    r = client.request("DELETE", f"{API}/auth/me", json={"confirm": "DELETE"}, headers=hdr(ids["google"], "USER"))
    assert r.status_code == 200, r.text


def test_requires_authentication(gym):
    assert client.request("DELETE", f"{API}/auth/me", json={"confirm": "DELETE"}).status_code in (401, 403)
