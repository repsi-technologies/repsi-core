"""Diet plans (versioning, assignment history, adherence), chat, trainer presets and revocation."""
from datetime import timedelta

from app.models.trainer import TrainerClient, TrainerClientStatus
from app.models.user import WorkspaceMember
from tests.conftest import TestingSessionLocal
from tests.test_fitness_module import client, gym, today  # noqa: F401  (fixture reuse)

N = "/api/v1/nutrition"
C = "/api/v1/chat"


def plan_body(name="Lean Veg", kcal=400):
    return {"name": name, "diet_type": "vegetarian", "calories_target": 1800, "meals": [
        {"slot": "breakfast", "items": [{"food": "Idli", "portion": "3 pcs", "calories": kcal, "protein": 8}]},
        {"slot": "lunch", "items": [{"food": "Sambar rice", "calories": 550, "protein": 15}]},
    ]}


def _revoke(ws_id, user_email, perms):
    db = TestingSessionLocal()
    from app.models.user import User
    from app.core.permissions import serialize_overrides
    u = db.query(User).filter(User.email == user_email).one()
    wm = db.query(WorkspaceMember).filter(WorkspaceMember.workspace_id == ws_id, WorkspaceMember.user_id == u.id).one()
    wm.permissions = serialize_overrides([], perms)
    db.commit()
    db.close()


def test_plan_versioning_and_assignment_history(gym):
    r = client.post(f"{N}/plans", json=plan_body(), headers=gym["t1"])
    assert r.status_code == 201, r.text
    plan = r.json()
    v1 = plan["current_version_id"]
    assert plan["current_version"]["totals"]["calories"] == 950

    a1 = client.post(f"{N}/members/{gym['m1_id']}/assignments", json={"plan_id": plan["id"]}, headers=gym["t1"])
    assert a1.status_code == 201, a1.text
    assert a1.json()["version_id"] == v1

    r = client.put(f"{N}/plans/{plan['id']}", json={**plan_body(kcal=300), "change_summary": "Less carbs"}, headers=gym["t1"])
    assert r.status_code == 200
    v2 = r.json()["current_version_id"]
    assert v2 != v1 and len(r.json()["versions"]) == 2

    # The existing assignment still shows the version the member was given.
    mine = client.get(f"{N}/assignments", headers=gym["m1"]).json()
    assert mine[0]["version_id"] == v1 and mine[0]["version"]["totals"]["calories"] == 950

    # Re-assigning ends the previous assignment rather than overwriting it.
    client.post(f"{N}/members/{gym['m1_id']}/assignments", json={"plan_id": plan["id"]}, headers=gym["t1"])
    rows = client.get(f"{N}/assignments", params={"member_id": gym["m1_id"]}, headers=gym["t1"]).json()
    assert sorted(a["status"] for a in rows) == ["active", "ended"]

    # Another trainer can't edit t1's plan.
    assert client.put(f"{N}/plans/{plan['id']}", json=plan_body(), headers=gym["t2"]).status_code == 403


def test_trainer_cannot_reach_unassigned_or_other_tenant(gym):
    plan = client.post(f"{N}/plans", json=plan_body(), headers=gym["owner"]).json()
    assert client.post(f"{N}/members/{gym['m2_id']}/assignments", json={"plan_id": plan["id"]},
                       headers=gym["t1"]).status_code == 403
    assert client.get(f"{N}/day", params={"member_id": gym["m2_id"]}, headers=gym["t1"]).status_code == 403
    # Cross-tenant: owner of gym B can't see gym A's plan or member.
    assert client.get(f"{N}/plans/{plan['id']}", headers=gym["owner_b"]).status_code == 404
    assert client.post(f"{N}/members/{gym['m1_id']}/assignments", json={"plan_id": plan["id"]},
                       headers=gym["owner_b"]).status_code == 404
    # Members can't list plans or assign.
    assert client.get(f"{N}/plans", headers=gym["m1"]).status_code == 403


def test_meal_logging_idempotent_and_adherence(gym):
    plan = client.post(f"{N}/plans", json=plan_body(), headers=gym["t1"]).json()
    client.post(f"{N}/members/{gym['m1_id']}/assignments", json={"plan_id": plan["id"]}, headers=gym["t1"])
    d = str(today())
    body = {"log_date": d, "slot": "breakfast", "calories": 380, "protein": 9, "client_ref": "offline-1"}
    first = client.post(f"{N}/meals", json=body, headers=gym["m1"])
    again = client.post(f"{N}/meals", json=body, headers=gym["m1"])
    assert first.status_code == 201 and first.json()["id"] == again.json()["id"]
    client.post(f"{N}/meals", json={"log_date": d, "slot": "lunch", "status": "skipped"}, headers=gym["m1"])
    client.post(f"{N}/water", json={"log_date": d, "amount_ml": 500, "client_ref": "w1"}, headers=gym["m1"])
    day = client.post(f"{N}/water", json={"log_date": d, "amount_ml": 500, "client_ref": "w1"}, headers=gym["m1"]).json()
    assert day["water_ml"] == 500 and day["totals"]["calories"] == 380

    adh = client.get(f"{N}/adherence", params={"member_id": gym["m1_id"]}, headers=gym["t1"]).json()
    assert adh["planned_meals"] == 2 and adh["followed"] == 1 and adh["skipped"] == 1 and adh["adherence_pct"] == 50.0

    future = str(today() + timedelta(days=2))
    assert client.post(f"{N}/meals", json={"log_date": future, "slot": "lunch"}, headers=gym["m1"]).status_code == 422
    # A member's member_id is ignored; they can only log for themselves.
    r = client.post(f"{N}/meals", json={"member_id": gym["m2_id"], "log_date": d, "slot": "dinner"}, headers=gym["m1"])
    assert r.json()["member_id"] == gym["m1_id"]


def test_chat_flow_and_unassignment_revokes_trainer_access(gym):
    conv = client.post(f"{C}/conversations", json={"member_id": gym["m1_id"]}, headers=gym["t1"])
    assert conv.status_code == 200, conv.text
    cid = conv.json()["id"]
    sent = client.post(f"{C}/conversations/{cid}/messages", json={"body": "Hi Mia", "client_ref": "c1"}, headers=gym["t1"])
    dup = client.post(f"{C}/conversations/{cid}/messages", json={"body": "Hi Mia", "client_ref": "c1"}, headers=gym["t1"])
    assert sent.status_code == 201 and sent.json()["id"] == dup.json()["id"]

    inbox = client.get(f"{C}/conversations", headers=gym["m1"]).json()
    assert inbox[0]["unread"] == 1
    assert client.post(f"{C}/conversations/{cid}/read", headers=gym["m1"]).json()["unread"] == 0
    assert client.post(f"{C}/conversations/{cid}/messages", json={"body": "Hello"}, headers=gym["m1"]).status_code == 201

    # Other trainer, other member, owner and other tenant are all denied.
    assert client.get(f"{C}/conversations/{cid}/messages", headers=gym["t2"]).status_code == 404
    assert client.get(f"{C}/conversations/{cid}/messages", headers=gym["m2"]).status_code == 404
    assert client.get(f"{C}/conversations", headers=gym["owner"]).status_code == 403
    assert client.get(f"{C}/conversations/{cid}/messages", headers=gym["mb"]).status_code == 404  # scoped to gym B
    assert client.post(f"{C}/conversations", json={"member_id": gym["m2_id"]}, headers=gym["t1"]).status_code == 403

    # Unassigning ends trainer access immediately; the member keeps read-only history.
    db = TestingSessionLocal()
    db.query(TrainerClient).filter(TrainerClient.id == gym["rel1_id"]).update({"status": TrainerClientStatus.ENDED})
    db.commit()
    db.close()
    assert client.get(f"{C}/conversations/{cid}/messages", headers=gym["t1"]).status_code == 403
    assert len(client.get(f"{C}/conversations/{cid}/messages", headers=gym["m1"]).json()) == 2
    assert client.post(f"{C}/conversations/{cid}/messages", json={"body": "?"}, headers=gym["m1"]).status_code == 403


def test_permission_revocation_is_immediate(gym):
    assert client.post(f"{N}/plans", json=plan_body(), headers=gym["t1"]).status_code == 201
    _revoke(gym["ws_a"], "trainer1@a.test", ["nutrition.manage", "chat.use"])
    assert client.post(f"{N}/plans", json=plan_body(), headers=gym["t1"]).status_code == 403
    assert client.get(f"{C}/conversations", headers=gym["t1"]).status_code == 403


def test_trainer_presets_and_delegation(gym):
    db = TestingSessionLocal()
    from app.models.user import User
    t1 = db.query(User).filter(User.email == "trainer1@a.test").one()
    wm_id = db.query(WorkspaceMember).filter(WorkspaceMember.user_id == t1.id).one().id
    db.close()

    cat = client.get("/api/v1/team/permissions/catalog", headers=gym["owner"]).json()
    assert {"personal_trainer", "nutrition_coach", "trainer_admin"} <= {p["key"] for p in cat["trainer_presets"]}

    r = client.put(f"/api/v1/team/{wm_id}/permissions", json={"preset": "nutrition_coach"}, headers=gym["owner"])
    assert r.status_code == 200, r.text
    # Nutrition coach can't build workout programs any more, but can still make diet plans.
    assert client.post(f"{N}/plans", json=plan_body(), headers=gym["t1"]).status_code == 201
    me = client.get("/api/v1/team/me/permissions", headers=gym["t1"]).json()["permissions"]
    assert "programs.manage" not in me and "nutrition.manage" in me

    assert client.put(f"/api/v1/team/{wm_id}/permissions", json={"preset": "nope"}, headers=gym["owner"]).status_code == 422
    # Trainers can't change permissions (including their own).
    assert client.put(f"/api/v1/team/{wm_id}/permissions", json={"preset": "trainer_admin"}, headers=gym["t1"]).status_code == 403


def test_chat_report_reaches_owner_with_context_and_history(gym):
    cid = client.post(f"{C}/conversations", json={"member_id": gym["m1_id"]}, headers=gym["t1"]).json()["id"]
    bad = client.post(f"{C}/conversations/{cid}/messages", json={"body": "unwanted message"}, headers=gym["t1"]).json()
    mine = client.post(f"{C}/conversations/{cid}/messages", json={"body": "please stop"}, headers=gym["m1"]).json()

    # Only participants can report, and not their own message.
    assert client.post(f"{C}/conversations/{cid}/report", json={"reason": "harassment"}, headers=gym["m2"]).status_code == 404
    assert client.post(f"{C}/conversations/{cid}/report", json={"reason": "harassment"}, headers=gym["owner"]).status_code == 403
    assert client.post(f"{C}/conversations/{cid}/report", json={"reason": "spam", "message_id": mine["id"]},
                       headers=gym["m1"]).status_code == 422
    assert client.post(f"{C}/conversations/{cid}/report", json={"reason": "nonsense"}, headers=gym["m1"]).status_code == 422

    r = client.post(f"{C}/conversations/{cid}/report",
                    json={"reason": "harassment", "details": "Off-topic personal messages", "message_id": bad["id"]},
                    headers=gym["m1"])
    assert r.status_code == 201, r.text
    rid = r.json()["id"]
    # One open report per conversation per reporter.
    assert client.post(f"{C}/conversations/{cid}/report", json={"reason": "spam"}, headers=gym["m1"]).status_code == 409
    # The trainer can report the same conversation independently.
    assert client.post(f"{C}/conversations/{cid}/report", json={"reason": "off_topic"}, headers=gym["t1"]).status_code == 201

    # Owner is notified and sees reporter, reported user, reason, excerpt and conversation context.
    notes = client.get("/api/v1/notifications", headers=gym["owner"]).json()["items"]
    assert any(n["title"] == "Chat reported" and rid in (n["action_url"] or "") for n in notes)
    listed = client.get(f"{C}/reports", params={"status": "open"}, headers=gym["owner"]).json()
    assert {x["id"] for x in listed} >= {rid}
    detail = client.get(f"{C}/reports/{rid}", headers=gym["owner"]).json()
    assert detail["reporter_kind"] == "member" and detail["reported_kind"] == "trainer"
    assert detail["message_excerpt"] == "unwanted message" and detail["reason"] == "harassment"
    assert [m["body"] for m in detail["messages"]] == ["unwanted message"]

    # Reviewers only; members, trainers and other tenants cannot read reports.
    assert client.get(f"{C}/reports", headers=gym["m1"]).status_code == 403
    assert client.get(f"{C}/reports/{rid}", headers=gym["t1"]).status_code == 403
    assert client.get(f"{C}/reports/{rid}", headers=gym["owner_b"]).status_code == 404

    # Review appends history instead of overwriting it.
    client.patch(f"{C}/reports/{rid}", json={"status": "reviewing"}, headers=gym["owner"])
    done = client.patch(f"{C}/reports/{rid}", json={"status": "resolved", "note": "Spoke to the trainer."}, headers=gym["owner"])
    assert done.status_code == 200 and done.json()["status"] == "resolved"
    events = client.get(f"{C}/reports/{rid}", headers=gym["owner"]).json()["events"]
    assert [e["to_status"] for e in events] == ["open", "reviewing", "resolved"]
    assert client.get(f"{C}/reports/mine", headers=gym["m1"]).json()[0]["status"] == "resolved"


def test_trainer_member_directory_is_limited_to_assigned_clients(gym):
    M = "/api/v1/members"
    # t1 is assigned m1 only: the directory and detail never expose m2.
    ids = {m["id"] for m in client.get(M, headers=gym["t1"]).json()["items"]}
    assert ids == {gym["m1_id"]}
    assert client.get(f"{M}/{gym['m1_id']}", headers=gym["t1"]).status_code == 200
    assert client.get(f"{M}/{gym['m2_id']}", headers=gym["t1"]).status_code == 404
    # Gym roles still see everyone; members and other tenants are refused.
    owner_ids = {m["id"] for m in client.get(M, headers=gym["owner"]).json()["items"]}
    assert {gym["m1_id"], gym["m2_id"]} <= owner_ids
    assert client.get(M, headers=gym["m1"]).status_code == 403
    assert client.get(f"{M}/{gym['m1_id']}", headers=gym["owner_b"]).status_code == 404
    # An owner-granted member permission widens a trainer's reach (front-desk check-ins).
    db = TestingSessionLocal()
    from app.models.user import User
    from app.core.permissions import serialize_overrides
    u = db.query(User).filter(User.email == "trainer1@a.test").one()
    wm = db.query(WorkspaceMember).filter(WorkspaceMember.workspace_id == gym["ws_a"], WorkspaceMember.user_id == u.id).one()
    wm.permissions = serialize_overrides(["attendance.record"], [])
    db.commit()
    db.close()
    assert client.get(f"{M}/{gym['m2_id']}", headers=gym["t1"]).status_code == 200
