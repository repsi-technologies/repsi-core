"""Workout & fitness module: functionality plus owner / trainer / member authorization and tenant isolation."""
import json
from datetime import date, datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient

from app.core.database import Base
from app.core.exercise_seed import seed_global_exercises
from app.core.security import create_access_token, get_password_hash
from app.main import app
from app.models.fitness import Exercise, WorkoutProgramVersion
from app.models.member import Member, MemberStatus
from app.models.trainer import Trainer, TrainerClient, TrainerClientStatus, TrainerStatus
from app.models.user import User, UserRole, Workspace, WorkspaceMember
from app.models.workout import Workout
from tests.conftest import TestingSessionLocal, test_engine

client = TestClient(app)
API = "/api/v1/fitness"


def today() -> date:
    return datetime.now(timezone.utc).date()


@pytest.fixture
def gym():
    Base.metadata.drop_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)
    db = TestingSessionLocal()
    seed_global_exercises(db)

    def user(email, ws, role):
        u = User(email=email, full_name=email.split("@")[0].title(), hashed_password=get_password_hash("pass1234"), is_active=True)
        db.add(u)
        db.flush()
        db.add(WorkspaceMember(workspace_id=ws.id, user_id=u.id, role=role, is_active=True))
        return u

    def member(ws, first, u=None):
        m = Member(workspace_id=ws.id, user_id=u.id if u else None, first_name=first, last_name="Test",
                   email=u.email if u else None, status=MemberStatus.ACTIVE, joined_date=date(2026, 1, 1))
        db.add(m)
        db.flush()
        return m

    def trainer(ws, u):
        t = Trainer(workspace_id=ws.id, user_id=u.id, name=u.full_name, email=u.email, phone="",
                    status=TrainerStatus.ACTIVE, is_active=True)
        db.add(t)
        db.flush()
        return t

    ws_a = Workspace(name="Gym A", slug="fit-gym-a", is_active=True, timezone="UTC")
    ws_b = Workspace(name="Gym B", slug="fit-gym-b", is_active=True, timezone="UTC")
    db.add_all([ws_a, ws_b])
    db.flush()

    owner_a = user("owner@a.test", ws_a, UserRole.OWNER)
    t1_user = user("trainer1@a.test", ws_a, UserRole.TRAINER)
    t2_user = user("trainer2@a.test", ws_a, UserRole.TRAINER)
    m1_user = user("member1@a.test", ws_a, UserRole.USER)
    m2_user = user("member2@a.test", ws_a, UserRole.USER)
    owner_b = user("owner@b.test", ws_b, UserRole.OWNER)
    mb_user = user("member@b.test", ws_b, UserRole.USER)

    t1, t2 = trainer(ws_a, t1_user), trainer(ws_a, t2_user)
    m1, m2, m3 = member(ws_a, "Mia", m1_user), member(ws_a, "Max", m2_user), member(ws_a, "Noor")
    mb = member(ws_b, "Bea", mb_user)
    rel1 = TrainerClient(workspace_id=ws_a.id, trainer_id=t1.id, client_id=m1.id, status=TrainerClientStatus.ACTIVE)
    db.add_all([rel1, TrainerClient(workspace_id=ws_a.id, trainer_id=t2.id, client_id=m2.id, status=TrainerClientStatus.ACTIVE)])
    db.commit()

    def hdr(u, ws, role):
        return {"Authorization": f"Bearer {create_access_token(u.id, ws.id, role)}"}

    ctx = {
        "ws_a": ws_a.id, "ws_b": ws_b.id,
        "owner": hdr(owner_a, ws_a, "OWNER"), "t1": hdr(t1_user, ws_a, "TRAINER"), "t2": hdr(t2_user, ws_a, "TRAINER"),
        "m1": hdr(m1_user, ws_a, "USER"), "m2": hdr(m2_user, ws_a, "USER"),
        "owner_b": hdr(owner_b, ws_b, "OWNER"), "mb": hdr(mb_user, ws_b, "USER"),
        "m1_id": m1.id, "m2_id": m2.id, "m3_id": m3.id, "mb_id": mb.id, "t1_id": t1.id, "rel1_id": rel1.id,
        "t1_user_id": t1_user.id, "m1_user_id": m1_user.id,
    }
    ctx["ex"] = {e.slug: e.id for e in db.query(Exercise).all()}
    db.close()
    return ctx


def item(ex_id, **kw):
    return {"exercise_id": ex_id, "sets": 3, "reps_min": 8, "reps_max": 12, "rest_seconds": 90, **kw}


def program_payload(g, name="Full Body A", publish=True, days=None):
    ex = g["ex"]
    return {
        "name": name, "difficulty": "beginner", "objective": "strength", "duration_weeks": 8, "publish": publish,
        "days": days or [
            {"name": "Day 1", "items": [
                item(ex["cat-cow"], section="warmup", sets=1, reps_min=10, reps_max=10),
                item(ex["barbell-back-squat"], target_weight_kg=60),
                item(ex["barbell-bench-press"], group_type="superset", group_label="A"),
                item(ex["bent-over-barbell-row"], group_type="superset", group_label="A"),
                item(ex["plank"], section="cooldown", sets=2, reps_min=None, reps_max=None, duration_seconds=45),
            ]},
            {"name": "Day 2", "items": [item(ex["conventional-deadlift"]), item(ex["pull-up"])]},
        ],
    }


def make_program(g, headers=None, **kw):
    res = client.post(f"{API}/programs", json=program_payload(g, **kw), headers=headers or g["owner"])
    assert res.status_code == 201, res.text
    return res.json()


def assign(g, program_id, member_ids, headers=None, start=None, weekdays=None, expect=201):
    res = client.post(f"{API}/assignments", headers=headers or g["owner"], json={
        "program_id": program_id, "member_ids": member_ids,
        "start_date": str(start or today()), "schedule_weekdays": weekdays or [],
    })
    assert res.status_code == expect, res.text
    return res.json()


# ------------------------------------------------------------------ exercise library

def test_exercise_library_roles_and_validation(gym):
    g = gym
    res = client.get(f"{API}/exercises?page_size=100", headers=g["owner"])
    assert res.status_code == 200 and res.json()["total"] >= 30
    assert client.get(f"{API}/exercises?category=legs&muscle=glutes", headers=g["owner"]).json()["total"] >= 3
    assert client.get(f"{API}/exercises?search=squat", headers=g["t1"]).json()["total"] >= 2

    custom = {"name": "Landmine Press", "category": "shoulders", "primary_muscles": ["front_delts"],
              "equipment": ["barbell"], "instructions": ["Hold the bar end", "Press up and forward"]}
    res = client.post(f"{API}/exercises", json=custom, headers=g["t1"])
    assert res.status_code == 201, res.text
    landmine = res.json()
    assert landmine["scope"] == "gym" and landmine["can_edit"] is True

    # Duplicates in the gym library and against the global library are rejected.
    assert client.post(f"{API}/exercises", json=custom, headers=g["owner"]).status_code == 409
    assert client.post(f"{API}/exercises", json={**custom, "name": "push-up"}, headers=g["owner"]).status_code == 409
    # Validation: missing primary muscle, insecure media URL, media type without URL.
    assert client.post(f"{API}/exercises", json={**custom, "name": "X1", "primary_muscles": []}, headers=g["owner"]).status_code == 422
    assert client.post(f"{API}/exercises", json={**custom, "name": "X2", "media_type": "image", "media_url": "http://x.test/a.png"}, headers=g["owner"]).status_code == 422
    assert client.post(f"{API}/exercises", json={**custom, "name": "X3", "media_type": "video", "media_url": "https://cdn.test/a.png"}, headers=g["owner"]).status_code == 422
    assert client.post(f"{API}/exercises", json={**custom, "name": "X4", "media_type": "image"}, headers=g["owner"]).status_code == 422
    ok = client.post(f"{API}/exercises", json={**custom, "name": "X5", "media_type": "youtube", "media_url": "https://youtu.be/abc"}, headers=g["owner"])
    assert ok.status_code == 201

    # Trainer 2 can't edit trainer 1's exercise; owner can. Nobody in a gym edits global exercises.
    edit = {**custom, "description": "Updated"}
    assert client.put(f"{API}/exercises/{landmine['id']}", json=edit, headers=g["t2"]).status_code == 403
    assert client.put(f"{API}/exercises/{landmine['id']}", json=edit, headers=g["owner"]).status_code == 200
    squat = g["ex"]["barbell-back-squat"]
    assert client.post(f"{API}/exercises/{squat}/archive", headers=g["owner"]).status_code == 403

    # Members can't create; other gyms can't see gym A's custom exercise.
    assert client.post(f"{API}/exercises", json={**custom, "name": "Member Move"}, headers=g["m1"]).status_code == 403
    assert client.get(f"{API}/exercises/{landmine['id']}", headers=g["owner_b"]).status_code == 404
    assert client.put(f"{API}/exercises/{landmine['id']}", json=edit, headers=g["owner_b"]).status_code == 404

    # Archive hides from default list; restore brings it back.
    assert client.post(f"{API}/exercises/{landmine['id']}/archive", headers=g["t1"]).json()["status"] == "archived"
    names = [e["name"] for e in client.get(f"{API}/exercises?scope=gym", headers=g["owner"]).json()["items"]]
    assert "Landmine Press" not in names
    assert client.post(f"{API}/exercises/{landmine['id']}/restore", headers=g["t1"]).json()["status"] == "active"

    # Members only see exercises from their own plans.
    assert client.get(f"{API}/exercises", headers=g["m1"]).json()["total"] == 0
    assert client.get(f"{API}/exercises/{squat}", headers=g["m1"]).status_code == 404
    p = make_program(g)
    assign(g, p["id"], [g["m1_id"]])
    mine = client.get(f"{API}/exercises?page_size=100", headers=g["m1"]).json()
    assert mine["total"] == 7 and client.get(f"{API}/exercises/{squat}", headers=g["m1"]).status_code == 200
    assert client.get(f"{API}/exercises", headers=g["m2"]).json()["total"] == 0


def test_revoked_permission_blocks_trainer(gym):
    g = gym
    db = TestingSessionLocal()
    wm = db.query(WorkspaceMember).filter(WorkspaceMember.user_id == g["t1_user_id"]).first()
    wm.permissions = json.dumps({"grant": [], "revoke": ["exercises.manage", "programs.manage", "workouts.assign"]})
    db.commit()
    db.close()
    body = {"name": "Blocked Move", "category": "core", "primary_muscles": ["core"]}
    assert client.post(f"{API}/exercises", json=body, headers=g["t1"]).status_code == 403
    assert client.post(f"{API}/programs", json=program_payload(g), headers=g["t1"]).status_code == 403
    p = make_program(g)
    assign(g, p["id"], [g["m1_id"]], headers=g["t1"], expect=403)
    assert client.get(f"{API}/me", headers=g["t1"]).json()["can_assign"] is False


# ------------------------------------------------------------------ programs & versioning

def test_program_validation_and_versioning_keeps_assignments_stable(gym):
    g = gym
    ex = g["ex"]
    bad = program_payload(g, days=[{"name": "Empty", "items": []}])
    assert client.post(f"{API}/programs", json=bad, headers=g["owner"]).status_code == 422
    rest_with_items = program_payload(g, days=[{"name": "Rest", "is_rest_day": True, "items": [item(ex["plank"])]}])
    assert client.post(f"{API}/programs", json=rest_with_items, headers=g["owner"]).status_code == 422
    inverted = program_payload(g, days=[{"name": "D", "items": [item(ex["plank"], reps_min=12, reps_max=8)]}])
    assert client.post(f"{API}/programs", json=inverted, headers=g["owner"]).status_code == 422
    # A draft may be incomplete, but can't be assigned until it's published.
    draft = client.post(f"{API}/programs", json={**bad, "publish": False}, headers=g["owner"]).json()
    assert draft["status"] == "draft"
    assign(g, draft["id"], [g["m1_id"]], expect=409)

    p = make_program(g)
    assert p["status"] == "published" and p["current_version_number"] == 1 and p["training_days"] == 2
    a = assign(g, p["id"], [g["m1_id"]])["created"][0]
    assert a["program_version_number"] == 1

    # Edit the program: creates draft v2; the assignment keeps v1's structure.
    payload = program_payload(g, publish=False)
    payload["days"][1]["items"].append(item(ex["hip-thrust"]))
    edited = client.put(f"{API}/programs/{p['id']}", json=payload, headers=g["owner"]).json()
    assert edited["has_unpublished_changes"] and edited["editing_version_number"] == 2
    published = client.post(f"{API}/programs/{p['id']}/publish", headers=g["owner"]).json()
    assert published["current_version_number"] == 2 and not published["has_unpublished_changes"]
    assert [v["assignment_count"] for v in published["versions"]] == [0, 1]

    detail = client.get(f"{API}/assignments/{a['id']}", headers=g["owner"]).json()
    assert detail["program_version_number"] == 1 and detail["newer_version_available"] is True
    assert len(detail["days"][1]["items"]) == 2
    v1 = client.get(f"{API}/programs/{p['id']}/versions/{a['program_version_id']}", headers=g["owner"]).json()
    assert len(v1["days"][1]["items"]) == 2

    db = TestingSessionLocal()
    assert db.query(WorkoutProgramVersion).filter(WorkoutProgramVersion.program_id == p["id"]).count() == 2
    db.close()

    dup = client.post(f"{API}/programs/{p['id']}/duplicate", headers=g["t1"]).json()
    assert dup["status"] == "draft" and dup["exercise_count"] == 8 and dup["can_edit"]
    archived = client.post(f"{API}/programs/{p['id']}/archive", headers=g["owner"]).json()
    assert archived["status"] == "archived"
    assign(g, p["id"], [g["m2_id"]], expect=409)
    assert client.get(f"{API}/assignments/{a['id']}", headers=g["owner"]).json()["status"] == "active"


def test_program_visibility_between_trainers_and_members(gym):
    g = gym
    t1_draft = make_program(g, headers=g["t1"], name="T1 Draft", publish=False)
    t1_pub = make_program(g, headers=g["t1"], name="T1 Published")
    assert client.get(f"{API}/programs/{t1_draft['id']}", headers=g["t2"]).status_code == 404
    seen = client.get(f"{API}/programs/{t1_pub['id']}", headers=g["t2"]).json()
    assert seen["can_edit"] is False
    assert client.put(f"{API}/programs/{t1_pub['id']}", json=program_payload(g), headers=g["t2"]).status_code == 403
    names = [p["name"] for p in client.get(f"{API}/programs", headers=g["t2"]).json()["items"]]
    assert names == ["T1 Published"]
    assert len(client.get(f"{API}/programs", headers=g["owner"]).json()["items"]) == 2
    assert client.get(f"{API}/programs", headers=g["m1"]).status_code == 403
    assert client.get(f"{API}/programs/{t1_pub['id']}", headers=g["m1"]).status_code == 403
    assert client.post(f"{API}/programs", json=program_payload(g), headers=g["m1"]).status_code == 403
    assert client.get(f"{API}/programs/{t1_pub['id']}", headers=g["owner_b"]).status_code == 404
    assert client.get(f"{API}/programs", headers=g["owner_b"]).json()["total"] == 0


# ------------------------------------------------------------------ assignment authorization

def test_assignment_permissions_and_duplicates(gym):
    g = gym
    p = make_program(g)
    res = assign(g, p["id"], [g["m1_id"]], headers=g["t1"])
    assert len(res["created"]) == 1 and res["created"][0]["trainer_id"] == g["t1_id"]

    # Trainer 1 can't assign trainer 2's client; a mixed request writes nothing.
    assign(g, p["id"], [g["m2_id"]], headers=g["t1"], expect=403)
    assign(g, p["id"], [g["m3_id"], g["m2_id"]], headers=g["t1"], expect=403)
    assert client.get(f"{API}/assignments?member_id={g['m3_id']}", headers=g["owner"]).json()["total"] == 0
    # Cross-gym member id and self-assignment are rejected.
    assign(g, p["id"], [g["mb_id"]], headers=g["t1"], expect=404)
    assign(g, p["id"], [g["m1_id"]], headers=g["m1"], expect=403)
    assign(g, p["id"], [g["m1_id"]], headers=g["owner_b"], expect=404)

    # Duplicate active assignment is skipped, bulk assign covers the rest.
    bulk = assign(g, p["id"], [g["m1_id"], g["m2_id"], g["m3_id"]])
    assert {c["member_id"] for c in bulk["created"]} == {g["m2_id"], g["m3_id"]}
    assert [s["member_id"] for s in bulk["skipped"]] == [g["m1_id"]]

    m1_assignment = res["created"][0]["id"]
    assert client.get(f"{API}/assignments/{m1_assignment}", headers=g["t2"]).status_code == 403
    assert client.get(f"{API}/assignments/{m1_assignment}", headers=g["m2"]).status_code == 404
    assert client.get(f"{API}/assignments/{m1_assignment}", headers=g["owner_b"]).status_code == 404
    assert client.get(f"{API}/assignments/{m1_assignment}", headers=g["m1"]).status_code == 200
    assert client.patch(f"{API}/assignments/{m1_assignment}", json={"status": "cancelled"}, headers=g["m1"]).status_code == 403

    # Scoped lists.
    assert {a["member_id"] for a in client.get(f"{API}/assignments", headers=g["t1"]).json()["items"]} == {g["m1_id"]}
    assert {a["member_id"] for a in client.get(f"{API}/assignments", headers=g["m1"]).json()["items"]} == {g["m1_id"]}
    assert client.get(f"{API}/assignments", headers=g["owner"]).json()["total"] == 3
    assert client.get(f"{API}/assignments?member_id={g['m1_id']}", headers=g["m2"]).status_code == 404
    assert client.get(f"{API}/assignments", headers=g["owner_b"]).json()["total"] == 0


def test_customization_is_isolated_and_audited(gym):
    g = gym
    ex = g["ex"]
    p = make_program(g)
    created = assign(g, p["id"], [g["m1_id"], g["m2_id"]])["created"]
    a1 = next(a for a in created if a["member_id"] == g["m1_id"])
    a2 = next(a for a in created if a["member_id"] == g["m2_id"])
    plan = client.get(f"{API}/assignments/{a1['id']}", headers=g["t1"]).json()

    days = [{"id": d["id"], "name": d["name"], "is_rest_day": d["is_rest_day"],
             "items": [{k: v for k, v in it.items() if k in (
                 "id", "exercise_id", "section", "group_type", "group_label", "sets", "reps_min", "reps_max",
                 "target_weight_kg", "duration_seconds", "rest_seconds", "tempo", "notes")} for it in d["items"]]}
            for d in plan["days"]]
    days[0]["items"][1]["exercise_id"] = ex["goblet-squat"]  # substitution
    days[0]["items"][1]["target_weight_kg"] = 20
    days[1]["items"].pop()  # remove pull-up
    days.append({"name": "Conditioning", "items": [item(ex["rowing-machine"], sets=None, reps_min=None, reps_max=None, duration_seconds=600)]})

    res = client.put(f"{API}/assignments/{a1['id']}/plan", json={"days": days, "reason": "Knee pain"}, headers=g["t1"])
    assert res.status_code == 200, res.text
    custom = res.json()
    assert custom["is_customized"] and len(custom["days"]) == 3
    assert custom["days"][0]["items"][1]["exercise_name"] == "Goblet Squat"

    # The other member and the reusable program are untouched.
    other = client.get(f"{API}/assignments/{a2['id']}", headers=g["owner"]).json()
    assert other["days"][0]["items"][1]["exercise_name"] == "Barbell Back Squat" and not other["is_customized"]
    prog = client.get(f"{API}/programs/{p['id']}", headers=g["owner"]).json()
    assert prog["days"][0]["items"][1]["exercise_name"] == "Barbell Back Squat" and len(prog["days"]) == 2

    events = client.get(f"{API}/assignments/{a1['id']}/events", headers=g["t1"]).json()
    assert events[0]["event_type"] == "customized" and events[0]["actor_name"] == "Trainer1"
    assert events[0]["details"]["replaced"] == [{"from": "Barbell Back Squat", "to": "Goblet Squat"}]
    assert events[0]["details"]["removed"] == ["Pull-Up"] and events[0]["details"]["reason"] == "Knee pain"
    assert events[-1]["event_type"] == "assigned"

    assert client.put(f"{API}/assignments/{a1['id']}/plan", json={"days": days}, headers=g["m1"]).status_code == 403
    assert client.put(f"{API}/assignments/{a1['id']}/plan", json={"days": days}, headers=g["t2"]).status_code == 403
    assert client.get(f"{API}/assignments/{a1['id']}/events", headers=g["m1"]).status_code == 403
    # An item id from another member's plan can't be smuggled in.
    foreign = [{**days[0], "items": [{**days[0]["items"][0], "id": other["days"][0]["items"][0]["id"]}]}]
    assert client.put(f"{API}/assignments/{a1['id']}/plan", json={"days": foreign}, headers=g["t1"]).status_code == 422

    # Reschedule is recorded with before/after values.
    res = client.patch(f"{API}/assignments/{a1['id']}", json={"schedule_weekdays": [0, 2, 4], "reason": "Work shifts"}, headers=g["t1"])
    assert res.status_code == 200 and res.json()["schedule_weekdays"] == [0, 2, 4]
    ev = client.get(f"{API}/assignments/{a1['id']}/events", headers=g["owner"]).json()[0]
    assert ev["event_type"] == "rescheduled" and ev["details"]["changes"]["schedule_weekdays"] == [[], [0, 2, 4]]


# ------------------------------------------------------------------ schedule & execution

def test_schedule_and_session_execution(gym):
    g = gym
    p = make_program(g)
    start = today() - timedelta(days=3)
    a = assign(g, p["id"], [g["m1_id"]], start=start)["created"][0]

    sched = client.get(f"{API}/schedule?date_from={start}&date_to={today() + timedelta(days=2)}", headers=g["m1"]).json()
    assert [r["day_name"] for r in sched] == ["Day 1", "Day 2", "Day 1", "Day 2", "Day 1", "Day 2"]
    assert [r["status"] for r in sched] == ["missed", "missed", "missed", "today", "upcoming", "upcoming"]
    assert client.get(f"{API}/schedule?member_id={g['m1_id']}", headers=g["t2"]).status_code == 403
    assert client.get(f"{API}/schedule?member_id={g['m1_id']}", headers=g["m2"]).status_code == 404
    assert client.get(f"{API}/schedule?member_id={g['m1_id']}", headers=g["t1"]).status_code == 200

    # Can't start future sessions or other members' sessions.
    future = {"assignment_id": a["id"], "scheduled_date": str(today() + timedelta(days=1))}
    assert client.post(f"{API}/sessions/start", json=future, headers=g["m1"]).status_code == 422
    body = {"assignment_id": a["id"], "scheduled_date": str(today())}
    assert client.post(f"{API}/sessions/start", json=body, headers=g["m2"]).status_code == 404

    s = client.post(f"{API}/sessions/start", json=body, headers=g["m1"]).json()
    assert s["status"] == "in_progress" and s["day_name"] == "Day 2" and len(s["items"]) == 2
    again = client.post(f"{API}/sessions/start", json=body, headers=g["m1"]).json()
    assert again["id"] == s["id"]  # idempotent: no duplicate session
    assert client.get(f"{API}/sessions/{s['id']}", headers=g["t2"]).status_code == 403
    assert client.get(f"{API}/sessions/{s['id']}", headers=g["m2"]).status_code == 404

    deadlift, pullup = s["items"]
    sets = [{"item_id": deadlift["id"], "set_number": 1, "reps": 5, "weight_kg": 100, "completed": False}]
    assert client.put(f"{API}/sessions/{s['id']}/sets", json={"sets": sets}, headers=g["m1"]).status_code == 200
    # Opening and saving without finishing a set does not complete the workout.
    assert client.post(f"{API}/sessions/{s['id']}/complete", headers=g["m1"]).status_code == 422

    paused = client.post(f"{API}/sessions/{s['id']}/pause", headers=g["m1"]).json()
    assert paused["status"] == "paused"
    sets = [
        {"item_id": deadlift["id"], "set_number": 1, "reps": 5, "weight_kg": 100, "completed": True},
        {"item_id": deadlift["id"], "set_number": 2, "reps": 5, "weight_kg": 110, "completed": True},
        {"item_id": pullup["id"], "set_number": 1, "reps": 8, "completed": True},
    ]
    saved = client.put(f"{API}/sessions/{s['id']}/sets", json={"sets": sets, "member_notes": "Felt strong"}, headers=g["m1"]).json()
    assert saved["completed_sets"] == 3 and saved["total_volume_kg"] == 1050
    # Re-sending the same save (network retry) doesn't duplicate rows.
    retry = client.put(f"{API}/sessions/{s['id']}/sets", json={"sets": sets}, headers=g["m1"]).json()
    assert len(retry["sets"]) == 3
    assert retry["sets"][0]["target_reps_min"] == 8  # prescription snapshotted beside actuals
    assert client.put(f"{API}/sessions/{s['id']}/sets", json={"sets": [{**sets[0], "item_id": "not-in-day"}]}, headers=g["m1"]).status_code == 422

    assert client.post(f"{API}/sessions/{s['id']}/resume", headers=g["m1"]).json()["status"] == "in_progress"
    done = client.post(f"{API}/sessions/{s['id']}/complete", headers=g["m1"]).json()
    assert done["status"] == "completed" and done["duration_seconds"] is not None
    twice = client.post(f"{API}/sessions/{s['id']}/complete", headers=g["m1"]).json()
    assert twice["completed_at"] == done["completed_at"]
    assert client.put(f"{API}/sessions/{s['id']}/sets", json={"sets": sets}, headers=g["m1"]).status_code == 409
    assert client.post(f"{API}/sessions/{s['id']}/abandon", headers=g["m1"]).status_code == 409

    # Abandon an overdue workout, then reopen it via start (same record, no duplicate).
    past = {"assignment_id": a["id"], "scheduled_date": str(start)}
    ps = client.post(f"{API}/sessions/start", json=past, headers=g["m1"]).json()
    assert client.post(f"{API}/sessions/{ps['id']}/abandon", headers=g["m1"]).json()["status"] == "abandoned"
    assert client.post(f"{API}/sessions/start", json=past, headers=g["m1"]).json()["id"] == ps["id"]

    # Trainer feedback is visible to the member; members can't write it.
    assert client.put(f"{API}/sessions/{s['id']}/feedback", json={"trainer_feedback": "Nice"}, headers=g["m1"]).status_code == 403
    assert client.put(f"{API}/sessions/{s['id']}/feedback", json={"trainer_feedback": "Great pulls"}, headers=g["t2"]).status_code == 403
    assert client.put(f"{API}/sessions/{s['id']}/feedback", json={"trainer_feedback": "Great pulls"}, headers=g["t1"]).status_code == 200
    assert client.get(f"{API}/sessions/{s['id']}", headers=g["m1"]).json()["trainer_feedback"] == "Great pulls"

    sched = client.get(f"{API}/schedule?date_from={start}&date_to={today()}", headers=g["m1"]).json()
    assert [r["status"] for r in sched] == ["in_progress", "missed", "missed", "completed"]
    stats = client.get(f"{API}/assignments/{a['id']}", headers=g["m1"]).json()["stats"]
    assert stats["completed"] == 1 and stats["missed"] == 3 and stats["adherence_pct"] == 25.0

    history = client.get(f"{API}/sessions?status=completed", headers=g["m1"]).json()
    assert history["total"] == 1
    assert client.get(f"{API}/sessions?member_id={g['m1_id']}", headers=g["m2"]).status_code == 404
    assert client.get(f"{API}/sessions", headers=g["t2"]).json()["total"] == 0

    # Pausing the plan stops future occurrences; sessions can't start on it.
    client.patch(f"{API}/assignments/{a['id']}", json={"status": "paused"}, headers=g["owner"])
    assert client.post(f"{API}/sessions/start", json=body, headers=g["m1"]).status_code == 409
    upcoming = client.get(f"{API}/schedule?date_from={today() + timedelta(days=1)}&date_to={today() + timedelta(days=7)}", headers=g["m1"]).json()
    assert upcoming == []


def test_weekday_schedule_maps_training_days(gym):
    g = gym
    ex = g["ex"]
    days = [{"name": "Upper", "items": [item(ex["push-up"])]}, {"name": "Rest", "is_rest_day": True, "items": []},
            {"name": "Lower", "items": [item(ex["goblet-squat"])]}]
    p = make_program(g, days=days)
    monday = today() - timedelta(days=today().weekday()) + timedelta(days=7)
    assign(g, p["id"], [g["m1_id"]], start=monday, weekdays=[0, 3])
    rows = client.get(f"{API}/schedule?date_from={monday}&date_to={monday + timedelta(days=13)}", headers=g["m1"]).json()
    assert [(r["date"], r["day_name"]) for r in rows] == [
        (str(monday), "Upper"), (str(monday + timedelta(days=3)), "Lower"),
        (str(monday + timedelta(days=7)), "Upper"), (str(monday + timedelta(days=10)), "Lower"),
    ]


# ------------------------------------------------------------------ measurements, assessments, progress

def test_measurements_and_progress(gym):
    g = gym
    m1 = g["m1_id"]
    url = f"{API}/members/{m1}/measurements"
    d0 = today() - timedelta(days=20)
    assert client.post(url, json={"measured_on": str(d0), "values": [{"metric": "weight", "value": 82.5}, {"metric": "waist", "value": 90}]}, headers=g["m1"]).status_code == 201
    assert client.post(url, json={"measured_on": str(today()), "values": [{"metric": "weight", "value": 900}]}, headers=g["m1"]).status_code == 422
    assert client.post(url, json={"measured_on": str(today() + timedelta(days=1)), "values": [{"metric": "weight", "value": 80}]}, headers=g["m1"]).status_code == 422
    assert client.post(url, json={"measured_on": str(today()), "values": [{"metric": "shoe_size", "value": 9}]}, headers=g["m1"]).status_code == 422
    assert client.post(url, json={"measured_on": str(today()), "values": [{"metric": "weight", "value": 80}]}, headers=g["m2"]).status_code == 404
    assert client.post(url, json={"measured_on": str(today()), "values": [{"metric": "weight", "value": 80}]}, headers=g["t2"]).status_code == 403
    assert client.post(url, json={"measured_on": str(today()), "values": [{"metric": "weight", "value": 80}]}, headers=g["owner_b"]).status_code == 404
    rec = client.post(url, json={"measured_on": str(today()), "values": [{"metric": "weight", "value": 80.4}]}, headers=g["t1"])
    assert rec.status_code == 201 and rec.json()[0]["recorded_by_role"] == "trainer"
    # Same-day correction voids the earlier value instead of adding a second point.
    client.post(url, json={"measured_on": str(today()), "values": [{"metric": "weight", "value": 80.1}]}, headers=g["t1"])
    weights = client.get(f"{url}?metric=weight", headers=g["m1"]).json()
    assert [w["value"] for w in weights] == [80.1, 82.5]
    # Members can't remove a trainer's entry; owners can.
    assert client.delete(f"{url}/{weights[0]['id']}", headers=g["m1"]).status_code == 403

    # Custom measurement type (owner only).
    assert client.post(f"{API}/measurement-types", json={"key": "calf", "label": "Calf", "unit": "cm", "min_value": 20, "max_value": 70}, headers=g["t1"]).status_code == 403
    assert client.post(f"{API}/measurement-types", json={"key": "calf", "label": "Calf", "unit": "cm", "min_value": 20, "max_value": 70}, headers=g["owner"]).status_code == 201
    assert client.post(url, json={"measured_on": str(today()), "values": [{"metric": "calf", "value": 38}]}, headers=g["m1"]).status_code == 201
    assert "calf" not in [t["key"] for t in client.get(f"{API}/measurement-types", headers=g["owner_b"]).json()]

    # Log two completed sessions to produce strength data and PRs.
    p = make_program(g)
    a = assign(g, p["id"], [m1], start=today() - timedelta(days=2))["created"][0]
    for offset, weight in ((2, 60), (0, 70)):
        s = client.post(f"{API}/sessions/start", json={"assignment_id": a["id"], "scheduled_date": str(today() - timedelta(days=offset))}, headers=g["m1"]).json()
        squat = next(i for i in s["items"] if i["exercise_name"] == "Barbell Back Squat")
        plank = next(i for i in s["items"] if i["exercise_name"] == "Plank")
        client.put(f"{API}/sessions/{s['id']}/sets", json={"sets": [
            {"item_id": squat["id"], "set_number": 1, "reps": 5, "weight_kg": weight, "completed": True},
            {"item_id": squat["id"], "set_number": 2, "reps": 3, "weight_kg": weight + 5, "completed": True},
            {"item_id": plank["id"], "set_number": 1, "duration_seconds": 40 + offset, "completed": True},
        ]}, headers=g["m1"])
        assert client.post(f"{API}/sessions/{s['id']}/complete", headers=g["m1"]).status_code == 200

    prog = client.get(f"{API}/members/{m1}/progress?date_from={d0}", headers=g["m1"]).json()
    assert [pt["value"] for pt in prog["measurements"]["weight"]["points"]] == [82.5, 80.1]
    weight_summary = next(s for s in prog["measurement_summary"] if s["metric"] == "weight")
    assert weight_summary["change"] == -2.4 and weight_summary["unit"] == "kg"
    assert prog["adherence"] == {"scheduled": 3, "completed": 2, "missed": 1, "rate_pct": 66.7}
    squat_series = next(s for s in prog["strength"] if s["exercise_name"] == "Barbell Back Squat")
    assert [pt["top_weight_kg"] for pt in squat_series["points"]] == [65, 75]
    assert squat_series["points"][1]["estimated_1rm_kg"] == 82.5  # 75 x (1 + 3/30)
    prs = {(r["exercise_name"], r["kind"]): r for r in prog["personal_records"]}
    assert prs[("Barbell Back Squat", "heaviest_weight")]["value"] == 75
    assert prs[("Plank", "longest_duration")]["value"] == 42
    assert len(prog["recent_sessions"]) == 2

    assert client.get(f"{API}/members/{m1}/progress", headers=g["t1"]).status_code == 200
    assert client.get(f"{API}/members/{m1}/progress", headers=g["owner"]).status_code == 200
    assert client.get(f"{API}/members/{m1}/progress", headers=g["t2"]).status_code == 403
    assert client.get(f"{API}/members/{m1}/progress", headers=g["m2"]).status_code == 404
    assert client.get(f"{API}/members/{m1}/progress", headers=g["owner_b"]).status_code == 404

    ov = client.get(f"{API}/overview", headers=g["owner"]).json()
    assert ov["scope"] == "gym" and ov["sessions_completed_30d"] == 2
    t2_ov = client.get(f"{API}/overview", headers=g["t2"]).json()
    assert t2_ov["scope"] == "trainer" and t2_ov["members"] == []
    assert client.get(f"{API}/overview", headers=g["m1"]).status_code == 403


def test_assessments_keep_private_notes_private(gym):
    g = gym
    url = f"{API}/members/{g['m1_id']}/assessments"
    body = {"assessed_on": str(today()), "goals": "Lose 5 kg", "fitness_level": "beginner",
            "summary": "Good mobility", "private_notes": "Watch left knee; possible old injury"}
    assert client.post(url, json=body, headers=g["m1"]).status_code == 403
    assert client.post(url, json=body, headers=g["t2"]).status_code == 403
    assert client.post(url, json=body, headers=g["t1"]).status_code == 201
    staff = client.get(url, headers=g["t1"]).json()
    assert staff[0]["private_notes"].startswith("Watch left knee")
    mine = client.get(url, headers=g["m1"]).json()
    assert mine[0]["summary"] == "Good mobility" and "private_notes" not in mine[0]
    assert client.get(url, headers=g["m2"]).status_code == 404


# ------------------------------------------------------------------ revocation & legacy endpoints

def test_removed_relationship_and_inactive_accounts_lose_access(gym):
    g = gym
    p = make_program(g)
    a = assign(g, p["id"], [g["m1_id"]], headers=g["t1"])["created"][0]
    assert client.get(f"{API}/members/{g['m1_id']}/progress", headers=g["t1"]).status_code == 200

    assert client.delete(f"/api/v1/trainer-client/{g['rel1_id']}", headers=g["owner"]).status_code == 200
    assert client.get(f"{API}/members/{g['m1_id']}/progress", headers=g["t1"]).status_code == 403
    assert client.get(f"{API}/assignments/{a['id']}", headers=g["t1"]).status_code == 403
    assert client.get(f"{API}/assignments", headers=g["t1"]).json()["total"] == 0
    assign(g, p["id"], [g["m1_id"]], headers=g["t1"], expect=403)
    # History is preserved for the owner.
    assert client.get(f"{API}/assignments/{a['id']}", headers=g["owner"]).json()["trainer_id"] == g["t1_id"]

    db = TestingSessionLocal()
    wm = db.query(WorkspaceMember).filter(WorkspaceMember.user_id == g["m1_user_id"]).first()
    wm.is_active = False
    db.commit()
    db.close()
    assert client.get(f"{API}/assignments", headers=g["m1"]).status_code == 403
    assert client.get(f"{API}/assignments").status_code == 401
    assert client.get(f"{API}/assignments", headers={"Authorization": "Bearer not-a-token"}).status_code == 401


def test_legacy_workout_endpoints_are_locked_down(gym):
    g = gym
    db = TestingSessionLocal()
    w = Workout(workspace_id=g["ws_a"], member_id=g["m2_id"], title="Legacy")
    db.add(w)
    db.commit()
    wid = w.id
    db.close()
    assert client.get("/api/v1/workouts/", headers=g["m1"]).status_code == 403
    assert client.patch(f"/api/v1/workouts/{wid}", json={"trainer_feedback": "x"}, headers=g["m1"]).status_code == 403
    assert client.post(f"/api/v1/workouts/{wid}/complete", headers=g["m1"]).status_code == 403
    assert client.patch(f"/api/v1/workouts/{wid}", json={"trainer_feedback": "x"}, headers=g["t1"]).status_code == 403
    assert client.patch(f"/api/v1/workouts/{wid}", json={"trainer_feedback": "x"}, headers=g["t2"]).status_code == 200
    assert client.get(f"/api/v1/clients/{g['m2_id']}/trainers", headers=g["m1"]).status_code == 404
    assert client.get(f"/api/v1/clients/{g['m1_id']}/trainers", headers=g["m1"]).status_code == 200
