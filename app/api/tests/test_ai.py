"""REPSI AI: knowledge-base-first assistant, insights, report summaries, reminders, workouts, quotas, safety, isolation."""
import json
import uuid
from datetime import date, datetime, timedelta, timezone

import httpx
import pytest
from fastapi.testclient import TestClient

from app.core.config import settings
from app.core.exercise_seed import seed_global_exercises
from app.core.security import create_access_token, get_password_hash
from app.main import app
from app.models.ai import AiUsageLog
from app.models.attendance import Attendance
from app.models.finance import Payment, PaymentStatus
from app.models.member import Member, MemberStatus, Membership, MembershipPlan
from app.models.member_records import MembershipFreeze
from app.models.user import User, UserRole, Workspace, WorkspaceMember
from app.services.billing import BillingService
from tests.conftest import TestingSessionLocal

client = TestClient(app)
API = "/api/v1/ai"


@pytest.fixture
def gym():
    db = TestingSessionLocal()
    seed_global_exercises(db)
    tag = uuid.uuid4().hex[:8]

    def user(name, ws, role):
        u = User(email=f"{name}.{tag}@example.com", full_name=f"{name.title()} Tester",
                 hashed_password=get_password_hash("pass1234"), is_active=True)
        db.add(u)
        db.flush()
        db.add(WorkspaceMember(workspace_id=ws.id, user_id=u.id, role=role, is_active=True))
        return u

    ws = Workspace(name="AI Gym", slug=f"ai-gym-{tag}", is_active=True, timezone="UTC", currency="INR")
    ws_b = Workspace(name="Other Gym", slug=f"ai-other-{tag}", is_active=True, timezone="UTC")
    db.add_all([ws, ws_b])
    db.flush()
    owner, trainer, staff = user("owner", ws, UserRole.OWNER), user("coach", ws, UserRole.TRAINER), user("desk", ws, UserRole.STAFF)
    m_user, owner_b = user("mia", ws, UserRole.USER), user("ownerb", ws_b, UserRole.OWNER)
    today = date.today()
    plan = MembershipPlan(workspace_id=ws.id, name=f"Monthly {tag}", duration_months=1, price=2000.0)
    db.add(plan)
    db.flush()
    mia = Member(workspace_id=ws.id, user_id=m_user.id, first_name="Mia", last_name="Secretname", email=m_user.email,
                 phone="+919800000001", status=MemberStatus.ACTIVE, joined_date=today - timedelta(days=5))
    raj = Member(workspace_id=ws.id, first_name="Raj", last_name="Frozenfellow", phone="+919800000002",
                 status=MemberStatus.ACTIVE, joined_date=today - timedelta(days=90))
    db.add_all([mia, raj])
    db.flush()
    m1 = Membership(workspace_id=ws.id, member_id=mia.id, plan_id=plan.id, start_date=today - timedelta(days=25),
                    end_date=today + timedelta(days=4), status=MemberStatus.ACTIVE, price_paid=2000.0)
    m2 = Membership(workspace_id=ws.id, member_id=raj.id, plan_id=plan.id, start_date=today - timedelta(days=40),
                    end_date=today + timedelta(days=30), status=MemberStatus.FROZEN, price_paid=2000.0)
    db.add_all([m1, m2])
    db.flush()
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    db.add_all([
        Payment(workspace_id=ws.id, member_id=mia.id, membership_id=m1.id, amount=1500.0, status=PaymentStatus.SUCCESS, paid_at=now - timedelta(days=3)),
        Payment(workspace_id=ws.id, member_id=raj.id, membership_id=m2.id, amount=500.0, status=PaymentStatus.SUCCESS, paid_at=now - timedelta(days=40)),
        MembershipFreeze(workspace_id=ws.id, membership_id=m2.id, start_date=today - timedelta(days=3), end_date=today + timedelta(days=2)),
        Attendance(workspace_id=ws.id, member_id=mia.id, check_in_time=now - timedelta(days=1), check_out_time=now - timedelta(days=1, hours=-1)),
        Attendance(workspace_id=ws.id, member_id=mia.id, check_in_time=now - timedelta(days=2), check_out_time=now - timedelta(days=2, hours=-1)),
    ])
    db.commit()

    def hdr(u, w, role):
        return {"Authorization": f"Bearer {create_access_token(u.id, w.id, role)}"}

    ctx = {"ws": ws.id, "ws_b": ws_b.id, "owner": hdr(owner, ws, "OWNER"), "trainer": hdr(trainer, ws, "TRAINER"),
           "staff": hdr(staff, ws, "STAFF"), "member": hdr(m_user, ws, "USER"), "owner_b": hdr(owner_b, ws_b, "OWNER"),
           "mia_id": mia.id, "raj_id": raj.id, "member_user_id": m_user.id}
    db.close()
    return ctx


class FakeGemini:
    """Stands in for httpx.post at the Gemini boundary; records every payload."""

    def __init__(self, reply=None, status=200, raw_text=None):
        self.calls, self.reply, self.status, self.raw_text = [], reply, status, raw_text

    def __call__(self, url, headers=None, json=None, timeout=None):
        self.calls.append({"url": url, "body": json})
        if self.status >= 400:
            return httpx.Response(self.status)
        text = self.raw_text if self.raw_text is not None else __import__("json").dumps(self.reply)
        return httpx.Response(200, json={"candidates": [{"content": {"parts": [{"text": text}]}, "finishReason": "STOP"}],
                                         "usageMetadata": {"promptTokenCount": 120, "candidatesTokenCount": 60}})


@pytest.fixture
def gemini(monkeypatch):
    monkeypatch.setattr(settings, "GEMINI_API_KEY", "test-key")

    def install(**kw):
        fake = FakeGemini(**kw)
        monkeypatch.setattr(httpx, "post", fake)
        return fake
    return install


def usage_rows(ws_id):
    db = TestingSessionLocal()
    try:
        return [(r.feature, r.status) for r in db.query(AiUsageLog).filter(AiUsageLog.workspace_id == ws_id)]
    finally:
        db.close()


def test_auth_roles_and_isolation(gym):
    assert client.get(f"{API}/insights").status_code == 401
    assert client.get(f"{API}/insights", headers=gym["member"]).status_code == 403
    assert client.get(f"{API}/insights", headers=gym["trainer"]).status_code == 403
    assert client.get(f"{API}/reminders", headers=gym["member"]).status_code == 403
    assert client.get(f"{API}/reminders", headers=gym["staff"]).status_code == 200  # front desk chases dues
    assert client.get(f"{API}/admin/usage", headers=gym["owner"]).status_code == 403
    # Another gym's owner sees only their own (empty) numbers and reminders.
    other = client.get(f"{API}/insights", headers=gym["owner_b"]).json()
    assert other["metrics"]["revenue"]["collected_last_30d"] == 0
    assert client.get(f"{API}/reminders", headers=gym["owner_b"]).json()["groups"] == []


def test_assistant_answers_from_knowledge_base_without_a_model_call(gym, gemini):
    fake = gemini(reply={"answer": "should not be used"})
    r = client.post(f"{API}/assistant", headers=gym["owner"], json={"question": "How do I add a new member?"})
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["source"] == "kb" and body["links"][0]["path"] == "/members/new"
    assert fake.calls == []
    # Members get member help, never staff screens.
    m = client.post(f"{API}/assistant", headers=gym["member"], json={"question": "show my qr pass for entry"}).json()
    assert m["links"][0]["path"] == "/member/qr"


def test_assistant_uses_gemini_only_when_unclear_validates_links_and_caches(gym, gemini):
    fake = gemini(reply={"answer": "Open Payments to record it. Call me at 9876543210.", "paths": ["/payments", "/superadmin/users"]})
    q = {"question": "renew or payment first? my number is +91 98765 43210"}
    first = client.post(f"{API}/assistant", headers=gym["owner"], json=q).json()
    assert first["source"] == "ai"
    assert [l["path"] for l in first["links"]] == ["/payments"]  # non-whitelisted link dropped
    sent = json.dumps(fake.calls[0]["body"])
    assert "98765" not in sent and "[number removed]" in sent  # PII scrubbed before leaving REPSI
    assert "<user_input>" in sent
    again = client.post(f"{API}/assistant", headers=gym["staff"], json=q).json()
    assert again["source"] == "cached" and len(fake.calls) == 1


def test_assistant_without_key_falls_back_honestly(gym):
    r = client.post(f"{API}/assistant", headers=gym["owner"], json={"question": "renew or payment first?"}).json()
    assert r["source"] == "fallback" and "not set up" in r["notice"]


def test_insights_metrics_are_real_and_no_personal_data_reaches_gemini(gym, gemini):
    fake = gemini(reply={"summary": "Collections are healthy and two members owe money this month.",
                         "highlights": ["<b>1500</b> collected"], "actions": ["Send dues reminders"]})
    r = client.get(f"{API}/insights", headers=gym["owner"])
    assert r.status_code == 200, r.text
    body = r.json()
    m = body["metrics"]
    assert m["revenue"]["collected_last_30d"] == 1500.0
    assert m["revenue"]["outstanding_dues"] == 2000.0 and m["revenue"]["members_with_dues"] == 2
    assert m["members"]["expiring_next_7d"] == 1 and m["members"]["frozen"] == 1
    assert m["attendance"]["visits_last_30d"] == 2
    assert body["source"] == "ai" and body["highlights"] == ["1500 collected"]  # tags stripped
    sent = json.dumps(fake.calls[0]["body"])
    for secret in ("Secretname", "Frozenfellow", "Mia", "+9198", "@example.com"):
        assert secret not in sent
    assert client.get(f"{API}/insights", headers=gym["owner"]).json()["source"] == "cached"
    assert len(fake.calls) == 1


def test_invalid_model_output_never_reaches_the_user(gym, gemini):
    gemini(raw_text="Sure! Here's a summary: things are great")
    body = client.get(f"{API}/reports/revenue/summary", headers=gym["owner"]).json()
    assert body["source"] == "fallback" and body["summary"]
    assert ("report", "invalid_output") in usage_rows(gym["ws"])


def test_report_summary_types(gym):
    for t in ("overview", "revenue", "attendance", "memberships"):
        r = client.get(f"{API}/reports/{t}/summary", headers=gym["owner"])
        assert r.status_code == 200, (t, r.text)
        assert r.json()["summary"]
    assert client.get(f"{API}/reports/salaries/summary", headers=gym["owner"]).status_code == 422


def test_smart_reminders_are_rule_based(gym, gemini):
    fake = gemini(reply={})
    groups = {g["key"]: g for g in client.get(f"{API}/reminders", headers=gym["owner"]).json()["groups"]}
    assert [m["member_id"] for m in groups["unpaid_dues"]["members"]] == [gym["mia_id"]]
    assert [m["member_id"] for m in groups["frozen_unpaid"]["members"]] == [gym["raj_id"]]
    assert gym["raj_id"] in [m["member_id"] for m in groups["freeze_ending"]["members"]]
    assert gym["mia_id"] in [m["member_id"] for m in groups["expiring_soon"]["members"]]
    assert "{{first_name}}" in groups["unpaid_dues"]["suggested_message"]
    assert fake.calls == []


BASE_ANSWERS = {"goal": "muscle_gain", "experience": "beginner", "days_per_week": 3, "session_minutes": 45,
                "equipment": "bodyweight", "limitations": ["knees"], "health_flags": []}


def test_workout_rule_plan_respects_equipment_limitations_and_health(gym, gemini):
    fake = gemini(reply={})
    qs = client.get(f"{API}/workout/questions", headers=gym["member"]).json()["questions"]
    assert {q["key"] for q in qs} >= {"goal", "experience", "days_per_week", "equipment", "health_flags"}
    r = client.post(f"{API}/workout/suggest", headers=gym["member"], json={"answers": BASE_ANSWERS})
    assert r.status_code == 200, r.text
    plan = r.json()["plan"]
    assert r.json()["source"] == "rules" and len(plan["days"]) == 3 and fake.calls == []
    db = TestingSessionLocal()
    try:
        from app.models.fitness import Exercise
        used = [db.get(Exercise, x["exercise_id"]) for d in plan["days"] for x in d["exercises"]]
        assert all(json.loads(e.equipment or "[]") in ([], ["bodyweight"]) for e in used)
        assert all(e.movement_pattern not in ("squat", "lunge", "plyometric") for e in used)
        assert all(e.difficulty == "beginner" for e in used)
    finally:
        db.close()
    stop = client.post(f"{API}/workout/suggest", headers=gym["member"],
                       json={"answers": {**BASE_ANSWERS, "health_flags": ["chest_pain_dizziness"]}, "use_ai": True}).json()
    assert stop["plan"] is None and "doctor" in stop["safety_message"] and fake.calls == []
    assert client.post(f"{API}/workout/suggest", headers=gym["member"],
                       json={"answers": {**BASE_ANSWERS, "goal": "be a superhero"}}).status_code == 422


def test_workout_ai_plan_only_uses_library_ids(gym, gemini):
    good = {"title": "Bodyweight builder", "overview": "Three short sessions.", "tips": ["Sleep well"],
            "days": [{"focus": f"Day {i}", "exercises": [{"id": "e1", "sets": 3, "reps": "8-12", "rest_seconds": 60, "note": "slow"},
                                                         {"id": "e2", "sets": 3, "reps": "30s", "rest_seconds": 45, "note": ""}]}
                     for i in range(3)]}
    fake = gemini(reply=good)
    body = client.post(f"{API}/workout/suggest", headers=gym["member"], json={"answers": BASE_ANSWERS, "use_ai": True}).json()
    assert body["source"] == "ai" and body["plan"]["title"] == "Bodyweight builder"
    assert len(fake.calls[0]["body"]["contents"][0]["parts"][0]["text"]) < 6000  # compact prompt

    bad = {**good, "days": [{"focus": "x", "exercises": [{"id": "e999", "sets": 3, "reps": "8", "rest_seconds": 60}] * 2}] * 3}
    gemini(reply=bad)
    body = client.post(f"{API}/workout/suggest", headers=gym["member"],
                       json={"answers": {**BASE_ANSWERS, "days_per_week": 2}, "use_ai": True}).json()
    assert body["source"] == "fallback" and len(body["plan"]["days"]) == 2


def test_quotas_fall_back_instead_of_calling(gym, gemini, monkeypatch):
    fake = gemini(reply={"summary": "x" * 20})
    monkeypatch.setattr(settings, "AI_MEMBER_DAILY_CALLS", 1)
    first = client.post(f"{API}/workout/suggest", headers=gym["member"], json={"answers": {**BASE_ANSWERS, "days_per_week": 4}, "use_ai": True}).json()
    assert first["source"] == "fallback"  # invalid shape still spends the call
    second = client.post(f"{API}/workout/suggest", headers=gym["member"], json={"answers": {**BASE_ANSWERS, "days_per_week": 5}, "use_ai": True}).json()
    assert second["source"] == "fallback" and "today's 1 AI requests" in second["notice"]
    assert len(fake.calls) == 1

    monkeypatch.setattr(settings, "AI_GLOBAL_DAILY_CALLS", 0)
    capped = client.get(f"{API}/reports/attendance/summary", headers=gym["owner"]).json()
    assert capped["source"] == "fallback" and "capacity" in capped["notice"] and len(fake.calls) == 1
    status = client.get(f"{API}/status", headers=gym["member"]).json()
    assert status["person_used"] == 1 and status["person_limit"] == 1


def test_provider_errors_and_plan_gating(gym, gemini):
    fake = gemini(status=500)
    body = client.get(f"{API}/reports/memberships/summary", headers=gym["owner"]).json()
    assert body["source"] == "fallback" and len(fake.calls) == 2  # primary + fallback model, then honest fallback
    assert ("report", "error") in usage_rows(gym["ws"])

    db = TestingSessionLocal()
    try:
        BillingService.set_gym_overrides(db, gym["ws"], custom_features={"ai_insights": False}, reason="test")
    finally:
        db.close()
    r = client.get(f"{API}/insights", headers=gym["owner"])
    assert r.status_code == 403 and r.json()["detail"]["error_code"] == "FEATURE_NOT_IN_PLAN"


def test_superadmin_usage_report(gym):
    client.post(f"{API}/assistant", headers=gym["owner"], json={"question": "How do I add a new member?"})
    db = TestingSessionLocal()
    try:
        admin = User(email=f"ai.admin.{uuid.uuid4().hex[:6]}@example.com", full_name="AI Admin",
                     hashed_password=get_password_hash("x"), is_superadmin=True, is_active=True)
        db.add(admin)
        db.commit()
        headers = {"Authorization": f"Bearer {create_access_token(admin.id, None, 'SUPER_ADMIN')}"}
    finally:
        db.close()
    body = client.get(f"{API}/admin/usage", headers=headers).json()
    assert body["config"]["model"] == settings.GEMINI_MODEL
    assert body["today"]["requests"] >= 1 and body["today"]["free_answers"] >= 1
