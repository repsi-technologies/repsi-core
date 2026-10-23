"""Per-plan usage limits: every path that adds a member, trainer, staff account or branch respects the quota."""
import hashlib
import uuid

from fastapi.testclient import TestClient

from app.main import app
from app.models.billing import GymSubscription
from app.models.invitation import GymInvitation, InvitationStatus
from app.services.billing import BillingService
from tests.conftest import TestingSessionLocal

client = TestClient(app)
API = "/api/v1"


def uid() -> str:
    return uuid.uuid4().hex[:8]


def register_owner(prefix: str) -> tuple[dict, str]:
    res = client.post(f"{API}/auth/register", json={
        "full_name": f"{prefix} Owner",
        "email": f"{prefix}.{uid()}@example.com",
        "password": "Password123!",
        "gym_name": f"{prefix} Gym {uid()}",
        "gym_phone": "+91 99999 00000",
        "gym_city": "Pune",
    })
    assert res.status_code == 201, res.text
    body = res.json()
    return {"Authorization": f"Bearer {body['access_token']}"}, body["workspace_id"]


def set_limits(workspace_id: str, **limits) -> None:
    db = TestingSessionLocal()
    try:
        sub = BillingService.get_or_create_workspace_subscription(db, workspace_id)
        for key, value in limits.items():
            setattr(sub, f"custom_{key}_limit", value)
        db.commit()
    finally:
        db.close()


def usage(headers: dict) -> dict:
    res = client.get(f"{API}/billing/entitlements", headers=headers)
    assert res.status_code == 200, res.text
    return res.json()["usage"]


def add_member(headers: dict, n: int):
    return client.post(f"{API}/members", headers=headers, json={
        "first_name": f"Limit{n}", "last_name": "Member",
        "email": f"limit{n}.{uid()}@example.com", "phone": f"+91 98{uid()[:3].replace('a', '1')}{n:05d}"[:17],
    })


def test_gym_members_do_not_consume_staff_quota():
    headers, ws = register_owner("staffcount")
    set_limits(ws, member=50)
    for n in range(3):
        assert add_member(headers, n).status_code == 201
    u = usage(headers)
    assert u["members"]["current"] == 3
    assert u["staff"]["current"] == 0  # owner and USER-role members are not staff


def test_member_limit_blocks_create_import_and_reactivation():
    headers, ws = register_owner("memberlimit")
    set_limits(ws, member=2)
    first = add_member(headers, 1)
    assert first.status_code == 201, first.text
    assert add_member(headers, 2).status_code == 201

    blocked = add_member(headers, 3)
    assert blocked.status_code == 409
    assert blocked.json()["detail"]["error_code"] == "PLAN_LIMIT_REACHED"

    # CSV/batch import records a per-row error instead of silently exceeding the quota.
    res = client.post(f"{API}/members/import-batch", headers=headers, json=[
        {"first_name": "Over", "last_name": "Quota", "phone": "+919811100001", "email": f"over.{uid()}@example.com"},
    ])
    assert res.status_code == 200, res.text
    body = res.json()
    assert body.get("imported", 0) == 0
    assert any("Limit reached" in (d.get("message") or "") for d in body["details"])

    # Deactivate one member, fill the freed slot, then reactivation must be refused.
    member_id = first.json()["id"]
    r = client.post(f"{API}/members/{member_id}/status", headers=headers, json={"status": "inactive", "reason": "Left"})
    assert r.status_code == 200, r.text
    assert add_member(headers, 4).status_code == 201
    r = client.post(f"{API}/members/{member_id}/status", headers=headers, json={"status": "active"})
    assert r.status_code == 409
    assert r.json()["detail"]["resource"] == "members"


def test_direct_add_member_respects_limit():
    headers, ws = register_owner("directadd")
    set_limits(ws, member=0)
    r = client.post(f"{API}/invitations/direct-add", headers=headers, json={
        "name": "Direct Member", "email": f"direct.{uid()}@example.com", "role": "member",
    })
    assert r.status_code == 409
    assert r.json()["detail"]["error_code"] == "PLAN_LIMIT_REACHED"


def _reissue_token(email: str) -> str:
    db = TestingSessionLocal()
    try:
        inv = (
            db.query(GymInvitation)
            .filter(GymInvitation.email == email.lower(), GymInvitation.status == InvitationStatus.PENDING)
            .order_by(GymInvitation.created_at.desc())
            .first()
        )
        raw = f"limit-token-{uid()}{uid()}"
        inv.token_hash = hashlib.sha256(raw.encode()).hexdigest()
        db.commit()
        return raw
    finally:
        db.close()


def test_staff_invitation_accept_respects_staff_limit():
    headers, ws = register_owner("stafflimit")
    set_limits(ws, staff=0)
    email = f"desk.{uid()}@example.com"
    inv = client.post(f"{API}/invitations", headers=headers, json={"name": "Front Desk", "email": email, "role": "staff"})
    assert inv.status_code == 201, inv.text
    r = client.post(f"{API}/invitations/accept", json={"token": _reissue_token(email), "password": "DeskPass123!"})
    assert r.status_code == 409, r.text
    assert r.json()["detail"]["resource"] == "staff"

    # Raising the limit lets the same invitation through; the rejected attempt left no partial rows.
    set_limits(ws, staff=1)
    r = client.post(f"{API}/invitations/accept", json={"token": _reissue_token(email), "password": "DeskPass123!"})
    assert r.status_code == 200, r.text
    assert usage(headers)["staff"]["current"] == 1


def test_branch_creation_respects_branch_limit():
    headers, ws = register_owner("branchlimit")
    set_limits(ws, branch=1)
    r = client.post(f"{API}/branches", headers=headers, json={"name": f"Second Branch {uid()}"})
    assert r.status_code == 409, r.text
    assert r.json()["detail"]["resource"] == "branches"


def test_custom_limit_is_resolved_per_workspace():
    _, ws_a = register_owner("isoA")
    headers_b, ws_b = register_owner("isoB")
    set_limits(ws_a, member=0)
    # Workspace B is unaffected by A's override.
    assert add_member(headers_b, 7).status_code == 201
    db = TestingSessionLocal()
    try:
        sub_b = db.query(GymSubscription).filter(GymSubscription.workspace_id == ws_b).first()
        assert sub_b.custom_member_limit is None
    finally:
        db.close()
