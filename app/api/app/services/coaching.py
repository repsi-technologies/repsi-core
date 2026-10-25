"""
Member goals, goal-based workout suggestions and trainer / personal-training requests.

Authorization reuses FitnessActor: members only reach themselves; trainers only their ACTIVE clients;
gym-wide roles see everyone. Approving or declining a request needs `trainers.assign`, the same
permission as assigning a trainer directly.
"""
import json
from datetime import datetime, timezone
from typing import Optional

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.audit import record_audit
from app.core.exercise_seed import slugify
from app.core.permissions import has_permission
from app.middleware.tenant import TenantContext
from app.models.coaching import MemberGoal, TrainerRequest
from app.models.fitness import GLOBAL_SCOPE, Exercise
from app.models.member import Member
from app.models.system import Notification
from app.models.trainer import Trainer, TrainerClient, TrainerClientStatus, TrainerStatus
from app.models.user import UserRole, WorkspaceMember
from app.services.fitness import FitnessActor
from app.services.trainer import TrainerService

GOALS = ("fat_loss", "muscle_gain", "strength", "endurance", "general_fitness", "mobility")
LEVELS = ("beginner", "intermediate", "advanced")
FOCUS_AREAS = ("full_body", "upper_body", "lower_body", "core", "arms", "back", "chest", "glutes", "cardio", "flexibility")
REQUEST_KINDS = ("trainer", "personal_training")
MANAGER_ROLES = (UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER)


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


# ---------------------------------------------------------------- suggestions

# Exercise pools per training day, in preference order, by name in the global library
# (app/core/exercise_seed.py). Harder movements are filtered out for lower levels, so each pool
# lists easier alternatives too.
POOLS = {
    "full_body": ["Barbell Back Squat", "Goblet Squat", "Barbell Bench Press", "Push-Up", "Bent-Over Barbell Row",
                  "One-Arm Dumbbell Row", "Romanian Deadlift", "Overhead Press", "Plank", "Kettlebell Swing", "Dead Bug"],
    "upper": ["Barbell Bench Press", "Push-Up", "Bent-Over Barbell Row", "One-Arm Dumbbell Row", "Overhead Press",
              "Lat Pulldown", "Incline Dumbbell Press", "Dumbbell Lateral Raise", "Barbell Biceps Curl", "Triceps Rope Pushdown"],
    "lower": ["Barbell Back Squat", "Goblet Squat", "Romanian Deadlift", "Walking Lunge", "Leg Press", "Hip Thrust",
              "Standing Calf Raise", "Hanging Knee Raise", "Plank"],
    "push": ["Barbell Bench Press", "Push-Up", "Incline Dumbbell Press", "Overhead Press", "Dumbbell Lateral Raise",
             "Cable Chest Fly", "Triceps Rope Pushdown", "Bench Dip"],
    "pull": ["Pull-Up", "Lat Pulldown", "Bent-Over Barbell Row", "Seated Cable Row", "One-Arm Dumbbell Row", "Face Pull",
             "Barbell Biceps Curl", "Hammer Curl"],
    "legs": ["Barbell Back Squat", "Goblet Squat", "Romanian Deadlift", "Leg Press", "Walking Lunge", "Hip Thrust",
             "Standing Calf Raise", "Hanging Knee Raise"],
    "conditioning": ["Kettlebell Swing", "Goblet Squat", "Burpee", "Push-Up", "Walking Lunge", "Rowing Machine",
                     "Russian Twist", "Plank"],
    "cardio": ["Treadmill Run", "Rowing Machine", "Stationary Bike", "Burpee", "Plank", "Dead Bug"],
    "mobility": ["World's Greatest Stretch", "Cat-Cow", "Dead Bug", "Goblet Squat", "Face Pull", "Plank", "Hip Thrust"],
}

# Weekly split per goal and number of training days.
SPLITS = {
    "strength": {2: ["full_body", "full_body"], 3: ["full_body", "full_body", "full_body"],
                 4: ["upper", "lower", "upper", "lower"], 5: ["upper", "lower", "push", "pull", "legs"],
                 6: ["push", "pull", "legs", "push", "pull", "legs"]},
    "muscle_gain": {2: ["upper", "lower"], 3: ["push", "pull", "legs"], 4: ["upper", "lower", "upper", "lower"],
                    5: ["push", "pull", "legs", "upper", "lower"], 6: ["push", "pull", "legs", "push", "pull", "legs"]},
    "fat_loss": {2: ["full_body", "conditioning"], 3: ["full_body", "conditioning", "full_body"],
                 4: ["upper", "conditioning", "lower", "cardio"], 5: ["upper", "conditioning", "lower", "cardio", "full_body"],
                 6: ["upper", "conditioning", "lower", "cardio", "full_body", "conditioning"]},
    "endurance": {2: ["cardio", "full_body"], 3: ["cardio", "full_body", "cardio"],
                  4: ["cardio", "full_body", "cardio", "conditioning"],
                  5: ["cardio", "full_body", "cardio", "conditioning", "cardio"],
                  6: ["cardio", "full_body", "cardio", "conditioning", "cardio", "mobility"]},
    "general_fitness": {2: ["full_body", "full_body"], 3: ["full_body", "cardio", "full_body"],
                        4: ["upper", "lower", "conditioning", "mobility"],
                        5: ["upper", "lower", "cardio", "full_body", "mobility"],
                        6: ["upper", "lower", "cardio", "push", "pull", "mobility"]},
    "mobility": {2: ["mobility", "full_body"], 3: ["mobility", "full_body", "mobility"],
                 4: ["mobility", "full_body", "mobility", "cardio"],
                 5: ["mobility", "full_body", "mobility", "cardio", "mobility"],
                 6: ["mobility", "full_body", "mobility", "cardio", "mobility", "full_body"]},
}

# sets, reps, rest seconds for rep-tracked exercises.
PRESCRIPTION = {
    "strength": (5, "5", 150), "muscle_gain": (4, "8-12", 75), "fat_loss": (3, "12-15", 45),
    "endurance": (3, "15-20", 30), "general_fitness": (3, "10-12", 60), "mobility": (2, "8-10", 30),
}


def _exercise_count(minutes: int) -> int:
    if minutes <= 30:
        return 4
    if minutes <= 45:
        return 5
    if minutes <= 60:
        return 6
    return 7


def _loads(value: Optional[str]) -> list:
    try:
        parsed = json.loads(value) if value else []
    except ValueError:
        return []
    return parsed if isinstance(parsed, list) else []


def build_plan(db: Session, goal: str, level: str, days: int, minutes: int) -> dict:
    """A weekly routine from the global exercise library. Deterministic for the same inputs."""
    library = {e.slug: e for e in db.query(Exercise).filter(
        Exercise.scope_key == GLOBAL_SCOPE, Exercise.status == "active").all()}
    max_rank = LEVELS.index(level) if level in LEVELS else 0
    sets, reps, rest = PRESCRIPTION.get(goal, PRESCRIPTION["general_fitness"])
    if level == "beginner":
        sets = max(2, sets - 1)
    per_day = _exercise_count(minutes)
    split = SPLITS.get(goal, SPLITS["general_fitness"])[max(2, min(6, days))]

    out_days = []
    for index, focus in enumerate(split, start=1):
        picked = []
        for name in POOLS[focus]:
            e = library.get(slugify(name))
            if not e or (LEVELS.index(e.difficulty) if e.difficulty in LEVELS else 0) > max_rank:
                continue
            picked.append(e)
            if len(picked) == per_day:
                break
        exercises = []
        for e in picked:
            timed = e.category == "cardio" or e.tracking_type == "duration"
            if e.category == "cardio":
                duration = max(5, minutes // 3) * 60
            elif timed:
                duration = 30 if level == "beginner" else 45
            else:
                duration = None
            exercises.append({
                "exercise_id": e.id, "name": e.name, "category": e.category,
                "tracking_type": e.tracking_type, "difficulty": e.difficulty,
                "sets": 1 if e.category == "cardio" else sets,
                "reps": None if timed else reps,
                "duration_seconds": duration,
                "rest_seconds": 60 if e.category == "cardio" else rest,
                "primary_muscles": _loads(e.primary_muscles),
                "equipment": _loads(e.equipment),
                "instructions": _loads(e.instructions),
                "description": e.description,
                "media_url": e.media_url,
                "media_type": e.media_type,
            })
        out_days.append({"index": index, "focus": focus, "estimated_minutes": minutes, "exercises": exercises})
    return {"goal": goal, "fitness_level": level, "days_per_week": len(split), "session_minutes": minutes,
            "days": out_days}


# ---------------------------------------------------------------- service

class CoachingService:
    def __init__(self, db: Session, tenant: TenantContext):
        self.db = db
        self.tenant = tenant
        self.actor = FitnessActor(db, tenant)
        self.ws = tenant.workspace_id

    # -- helpers
    def _require_member(self) -> Member:
        if self.actor.kind != "member":
            raise HTTPException(status_code=403, detail="Only members can do this.")
        return self.actor.member

    def _require_assigner(self) -> None:
        if not has_permission(self.db, self.tenant, "trainers.assign"):
            raise HTTPException(status_code=403, detail="You don't have permission to assign trainers.")

    def current_goal(self, member_id: str) -> Optional[MemberGoal]:
        return self.db.query(MemberGoal).filter(
            MemberGoal.workspace_id == self.ws, MemberGoal.member_id == member_id,
        ).order_by(MemberGoal.created_at.desc(), MemberGoal.id.desc()).first()

    @staticmethod
    def goal_out(g: Optional[MemberGoal]) -> Optional[dict]:
        if not g:
            return None
        return {"id": g.id, "member_id": g.member_id, "goal": g.goal, "fitness_level": g.fitness_level,
                "days_per_week": g.days_per_week, "session_minutes": g.session_minutes,
                "focus_areas": _loads(g.focus_areas), "notes": g.notes, "created_at": g.created_at}

    @staticmethod
    def trainer_out(t: Trainer) -> dict:
        # Member-facing fields only: no pay, commission or emergency contact.
        return {"id": t.id, "name": t.name, "specialization": t.specialization, "bio": t.bio,
                "experience": t.experience, "profile_photo": t.profile_photo, "certifications": t.certifications}

    def _member_name(self, member_id: str) -> str:
        m = self.db.query(Member).filter(Member.workspace_id == self.ws, Member.id == member_id).first()
        return f"{m.first_name} {m.last_name or ''}".strip() if m else ""

    def _trainer(self, trainer_id: Optional[str]) -> Optional[Trainer]:
        if not trainer_id:
            return None
        return self.db.query(Trainer).filter(Trainer.workspace_id == self.ws, Trainer.id == trainer_id).first()

    def request_out(self, r: TrainerRequest) -> dict:
        preferred = self._trainer(r.preferred_trainer_id)
        assigned = self._trainer(r.assigned_trainer_id)
        goal = self.current_goal(r.member_id)
        return {"id": r.id, "member_id": r.member_id, "member_name": self._member_name(r.member_id),
                "kind": r.kind, "message": r.message, "status": r.status,
                "preferred_trainer_id": r.preferred_trainer_id,
                "preferred_trainer_name": preferred.name if preferred else None,
                "assigned_trainer_id": r.assigned_trainer_id, "assigned_trainer_name": assigned.name if assigned else None,
                "resolution_note": r.resolution_note, "resolved_at": r.resolved_at, "created_at": r.created_at,
                "member_goal": self.goal_out(goal)}

    def _active_trainers_for(self, member_id: str) -> list:
        rows = self.db.query(TrainerClient, Trainer).join(Trainer, TrainerClient.trainer_id == Trainer.id).filter(
            TrainerClient.workspace_id == self.ws, TrainerClient.client_id == member_id,
            TrainerClient.status == TrainerClientStatus.ACTIVE, Trainer.status == TrainerStatus.ACTIVE,
        ).order_by(TrainerClient.assigned_at.desc()).all()
        return [{**self.trainer_out(t), "relationship_id": tc.id, "assigned_at": tc.assigned_at} for tc, t in rows]

    def _notify(self, user_id: Optional[str], title: str, message: str) -> None:
        if user_id:
            self.db.add(Notification(workspace_id=self.ws, user_id=user_id, title=title[:255], message=message,
                                     is_read=False))

    # -- member
    def me(self) -> dict:
        member = self._require_member()
        requests = self.db.query(TrainerRequest).filter(
            TrainerRequest.workspace_id == self.ws, TrainerRequest.member_id == member.id,
        ).order_by(TrainerRequest.created_at.desc()).limit(10).all()
        return {"member_id": member.id, "goal": self.goal_out(self.current_goal(member.id)),
                "trainers": self._active_trainers_for(member.id),
                "requests": [self.request_out(r) for r in requests],
                "has_pending_request": any(r.status == "pending" for r in requests)}

    def set_goal(self, data) -> dict:
        member = self._require_member()
        g = MemberGoal(workspace_id=self.ws, member_id=member.id, goal=data.goal, fitness_level=data.fitness_level,
                       days_per_week=data.days_per_week, session_minutes=data.session_minutes,
                       focus_areas=json.dumps(list(dict.fromkeys(data.focus_areas))), notes=data.notes,
                       set_by_user_id=self.tenant.user_id)
        self.db.add(g)
        self.db.commit()
        self.db.refresh(g)
        return self.goal_out(g)

    def goal_history(self) -> list:
        member = self._require_member()
        rows = self.db.query(MemberGoal).filter(
            MemberGoal.workspace_id == self.ws, MemberGoal.member_id == member.id,
        ).order_by(MemberGoal.created_at.desc()).limit(50).all()
        return [self.goal_out(g) for g in rows]

    def my_suggestions(self) -> dict:
        member = self._require_member()
        g = self.current_goal(member.id)
        if not g:
            raise HTTPException(status_code=404, detail="Set your fitness goal to get workout suggestions.")
        return {**build_plan(self.db, g.goal, g.fitness_level, g.days_per_week, g.session_minutes),
                "goal_id": g.id}

    def available_trainers(self) -> list:
        self._require_member()
        trainers = self.db.query(Trainer).filter(
            Trainer.workspace_id == self.ws, Trainer.status == TrainerStatus.ACTIVE, Trainer.is_active.is_(True),
        ).order_by(Trainer.name).all()
        out = []
        for t in trainers:
            active = self.db.query(TrainerClient.id).filter(
                TrainerClient.workspace_id == self.ws, TrainerClient.trainer_id == t.id,
                TrainerClient.status == TrainerClientStatus.ACTIVE).count()
            out.append({**self.trainer_out(t),
                        "accepting_clients": not t.max_active_clients or active < t.max_active_clients})
        return out

    def create_request(self, data) -> dict:
        member = self._require_member()
        pending = self.db.query(TrainerRequest.id).filter(
            TrainerRequest.workspace_id == self.ws, TrainerRequest.member_id == member.id,
            TrainerRequest.status == "pending").first()
        if pending:
            raise HTTPException(status_code=409, detail="You already have a pending request. Wait for the gym to reply or cancel it.")
        if data.preferred_trainer_id:
            t = self._trainer(data.preferred_trainer_id)
            if not t or t.status != TrainerStatus.ACTIVE or not t.is_active:
                raise HTTPException(status_code=404, detail="Trainer not found.")
        r = TrainerRequest(workspace_id=self.ws, member_id=member.id, kind=data.kind,
                           preferred_trainer_id=data.preferred_trainer_id, message=(data.message or "").strip() or None,
                           status="pending", requested_by_user_id=self.tenant.user_id)
        self.db.add(r)
        self.db.flush()
        name = f"{member.first_name} {member.last_name or ''}".strip()
        label = "personal training" if data.kind == "personal_training" else "a trainer"
        managers = self.db.query(WorkspaceMember.user_id).filter(
            WorkspaceMember.workspace_id == self.ws, WorkspaceMember.is_active.is_(True),
            WorkspaceMember.role.in_(MANAGER_ROLES)).all()
        for (uid,) in managers:
            self._notify(uid, "New trainer request", f"{name} requested {label}.")
        record_audit(self.db, self.ws, self.tenant.user_id, "trainer_request.created",
                     resource_type="trainer_request", resource_id=r.id, details={"kind": data.kind})
        self.db.commit()
        self.db.refresh(r)
        return self.request_out(r)

    def cancel_request(self, request_id: str) -> dict:
        member = self._require_member()
        r = self._request(request_id)
        if r.member_id != member.id:
            raise HTTPException(status_code=404, detail="Request not found.")
        if r.status != "pending":
            raise HTTPException(status_code=409, detail=f"This request is already {r.status}.")
        r.status, r.resolved_at, r.resolved_by_user_id = "cancelled", utcnow(), self.tenant.user_id
        self.db.commit()
        return self.request_out(r)

    # -- staff
    def _request(self, request_id: str) -> TrainerRequest:
        r = self.db.query(TrainerRequest).filter(
            TrainerRequest.workspace_id == self.ws, TrainerRequest.id == request_id).first()
        if not r:
            raise HTTPException(status_code=404, detail="Request not found.")
        return r

    def list_requests(self, status: Optional[str]) -> dict:
        self._require_assigner()
        q = self.db.query(TrainerRequest).filter(TrainerRequest.workspace_id == self.ws)
        if status:
            q = q.filter(TrainerRequest.status == status)
        rows = q.order_by(TrainerRequest.created_at.desc()).limit(200).all()
        pending = self.db.query(TrainerRequest.id).filter(
            TrainerRequest.workspace_id == self.ws, TrainerRequest.status == "pending").count()
        return {"items": [self.request_out(r) for r in rows], "pending_count": pending}

    def approve(self, request_id: str, trainer_id: str, note: Optional[str]) -> dict:
        self._require_assigner()
        r = self._request(request_id)
        if r.status != "pending":
            raise HTTPException(status_code=409, detail=f"This request is already {r.status}.")
        rel = TrainerService(self.db, self.tenant).assign_client_to_trainer(
            trainer_id=trainer_id, client_id=r.member_id, notes=note or r.message)
        trainer = self._trainer(trainer_id)
        r.status, r.resolved_at, r.resolved_by_user_id = "approved", utcnow(), self.tenant.user_id
        r.assigned_trainer_id, r.relationship_id, r.resolution_note = trainer_id, rel.id, note
        member = self.db.query(Member).filter(Member.id == r.member_id).first()
        self._notify(member.user_id if member else None, "Trainer assigned",
                     f"{trainer.name if trainer else 'A trainer'} is now your trainer. Say hello in Messages.")
        self.db.commit()
        return self.request_out(r)

    def decline(self, request_id: str, note: Optional[str]) -> dict:
        self._require_assigner()
        r = self._request(request_id)
        if r.status != "pending":
            raise HTTPException(status_code=409, detail=f"This request is already {r.status}.")
        r.status, r.resolved_at, r.resolved_by_user_id = "declined", utcnow(), self.tenant.user_id
        r.resolution_note = (note or "").strip() or None
        member = self.db.query(Member).filter(Member.id == r.member_id).first()
        self._notify(member.user_id if member else None, "Trainer request update",
                     r.resolution_note or "The gym couldn't take your trainer request right now.")
        self.db.commit()
        return self.request_out(r)

    def member_goal(self, member_id: str) -> dict:
        member = self.actor.member_for(member_id)
        return {"member_id": member.id, "goal": self.goal_out(self.current_goal(member.id))}
