"""Member goals (append-only), goal-based suggestions and trainer / PT requests."""
from app.models.coaching import MemberGoal
from app.models.system import Notification
from app.models.trainer import TrainerClient, TrainerClientStatus
from tests.conftest import TestingSessionLocal
from tests.test_fitness_module import client, gym, today  # noqa: F401  (fixture reuse)

CO = "/api/v1/coaching"
C = "/api/v1/chat"

GOAL = {"goal": "muscle_gain", "fitness_level": "beginner", "days_per_week": 3, "session_minutes": 45,
        "focus_areas": ["chest", "arms"]}


def test_goal_is_appended_and_drives_suggestions(gym):
    assert client.get(f"{CO}/me/suggestions", headers=gym["m1"]).status_code == 404
    first = client.put(f"{CO}/me/goal", json=GOAL, headers=gym["m1"])
    assert first.status_code == 200, first.text
    second = client.put(f"{CO}/me/goal", json={**GOAL, "goal": "strength", "days_per_week": 4}, headers=gym["m1"])
    assert second.json()["goal"] == "strength"

    history = client.get(f"{CO}/me/goal/history", headers=gym["m1"]).json()
    assert [g["goal"] for g in history] == ["strength", "muscle_gain"]
    assert client.get(f"{CO}/me", headers=gym["m1"]).json()["goal"]["goal"] == "strength"

    plan = client.get(f"{CO}/me/suggestions", headers=gym["m1"]).json()
    assert plan["days_per_week"] == 4 and [d["focus"] for d in plan["days"]] == ["upper", "lower", "upper", "lower"]
    for day in plan["days"]:
        assert len(day["exercises"]) == 5
        # Beginners never get intermediate/advanced movements.
        assert all(e["difficulty"] == "beginner" for e in day["exercises"])
        assert all(e["sets"] >= 1 and (e["reps"] or e["duration_seconds"]) for e in day["exercises"])


def test_goal_validation_and_staff_view(gym):
    assert client.put(f"{CO}/me/goal", json={**GOAL, "goal": "fly"}, headers=gym["m1"]).status_code == 422
    assert client.put(f"{CO}/me/goal", json={**GOAL, "days_per_week": 9}, headers=gym["m1"]).status_code == 422
    assert client.put(f"{CO}/me/goal", json={**GOAL, "focus_areas": ["toes"]}, headers=gym["m1"]).status_code == 422
    # Staff can't set a member's goal through the member endpoint.
    assert client.put(f"{CO}/me/goal", json=GOAL, headers=gym["t1"]).status_code == 403

    client.put(f"{CO}/me/goal", json=GOAL, headers=gym["m1"])
    assert client.get(f"{CO}/members/{gym['m1_id']}/goal", headers=gym["t1"]).json()["goal"]["goal"] == "muscle_gain"
    assert client.get(f"{CO}/members/{gym['m1_id']}/goal", headers=gym["owner"]).status_code == 200
    # Not t2's client, another member, another gym.
    assert client.get(f"{CO}/members/{gym['m1_id']}/goal", headers=gym["t2"]).status_code == 403
    assert client.get(f"{CO}/members/{gym['m1_id']}/goal", headers=gym["m2"]).status_code in (403, 404)
    assert client.get(f"{CO}/members/{gym['m1_id']}/goal", headers=gym["owner_b"]).status_code == 404


def test_member_request_approval_assigns_trainer_and_opens_chat(gym):
    trainers = client.get(f"{CO}/trainers", headers=gym["m2"]).json()
    assert {t["id"] for t in trainers} >= {gym["t1_id"]}
    assert "hourly_rate" not in trainers[0] and "commission_percentage" not in trainers[0]

    r = client.post(f"{CO}/requests", json={"kind": "personal_training", "preferred_trainer_id": gym["t1_id"],
                                             "message": "Evenings please"}, headers=gym["m2"])
    assert r.status_code == 201, r.text
    req = r.json()
    assert req["status"] == "pending" and req["preferred_trainer_name"]
    # One pending request at a time.
    assert client.post(f"{CO}/requests", json={}, headers=gym["m2"]).status_code == 409

    db = TestingSessionLocal()
    assert db.query(Notification).filter(Notification.title == "New trainer request").count() == 1
    db.close()

    # Members and trainers without trainers.assign can't see or resolve requests.
    assert client.get(f"{CO}/requests", headers=gym["m2"]).status_code == 403
    assert client.get(f"{CO}/requests", headers=gym["t1"]).status_code == 403
    assert client.post(f"{CO}/requests/{req['id']}/approve", json={"trainer_id": gym["t1_id"]},
                       headers=gym["t1"]).status_code == 403
    # Other gym can't see it.
    assert client.post(f"{CO}/requests/{req['id']}/approve", json={"trainer_id": gym["t1_id"]},
                       headers=gym["owner_b"]).status_code == 404

    listing = client.get(f"{CO}/requests", params={"status": "pending"}, headers=gym["owner"]).json()
    assert listing["pending_count"] == 1 and listing["items"][0]["member_name"].startswith("Max")

    ok = client.post(f"{CO}/requests/{req['id']}/approve", json={"trainer_id": gym["t1_id"]}, headers=gym["owner"])
    assert ok.status_code == 200, ok.text
    assert ok.json()["status"] == "approved" and ok.json()["assigned_trainer_id"] == gym["t1_id"]
    assert client.post(f"{CO}/requests/{req['id']}/decline", json={}, headers=gym["owner"]).status_code == 409

    me = client.get(f"{CO}/me", headers=gym["m2"]).json()
    assert gym["t1_id"] in {t["id"] for t in me["trainers"]} and not me["has_pending_request"]
    # The member can now start a chat with the new trainer.
    conv = client.post(f"{C}/conversations", json={"trainer_id": gym["t1_id"]}, headers=gym["m2"])
    assert conv.status_code == 200 and conv.json()["can_send"] is True

    db = TestingSessionLocal()
    rel = db.query(TrainerClient).filter(TrainerClient.trainer_id == gym["t1_id"],
                                         TrainerClient.client_id == gym["m2_id"]).one()
    assert rel.status == TrainerClientStatus.ACTIVE
    db.close()


def test_decline_and_cancel(gym):
    req = client.post(f"{CO}/requests", json={"kind": "trainer"}, headers=gym["m1"]).json()
    declined = client.post(f"{CO}/requests/{req['id']}/decline", json={"note": "Trainers are full this month"},
                           headers=gym["owner"])
    assert declined.json()["status"] == "declined"
    assert client.post(f"{CO}/requests/{req['id']}/cancel", headers=gym["m1"]).status_code == 409

    again = client.post(f"{CO}/requests", json={"kind": "trainer"}, headers=gym["m1"]).json()
    # Another member can't cancel it.
    assert client.post(f"{CO}/requests/{again['id']}/cancel", headers=gym["m2"]).status_code == 404
    assert client.post(f"{CO}/requests/{again['id']}/cancel", headers=gym["m1"]).json()["status"] == "cancelled"
    statuses = [r["status"] for r in client.get(f"{CO}/me", headers=gym["m1"]).json()["requests"]]
    assert sorted(statuses) == ["cancelled", "declined"]


def test_preferred_trainer_must_belong_to_gym(gym):
    assert client.post(f"{CO}/requests", json={"preferred_trainer_id": "nope"}, headers=gym["m1"]).status_code == 404
    assert client.get(f"{CO}/trainers", headers=gym["owner"]).status_code == 403
    db = TestingSessionLocal()
    assert db.query(MemberGoal).count() == 0
    db.close()
