"""
Workout & fitness business rules and access control.

Every entry point resolves a `FitnessActor` from the trusted TenantContext:
  gym     - OWNER / ADMIN / MANAGER / SUPER_ADMIN: every member in the workspace
  trainer - TRAINER with an active Trainer profile: only members with an ACTIVE TrainerClient row
  member  - any other workspace user linked to a Member (Member.user_id): only themselves
Nothing about identity, role, workspace or relationship is taken from the request body.

Unknown ids and ids from other workspaces return 404; same-workspace members a trainer is not
assigned to return 403 (mirrors TrainerService.verify_client_access).
"""
import json
from collections import defaultdict
from datetime import date, datetime, timedelta, timezone
from typing import Iterable, Optional
from urllib.parse import urlparse

from fastapi import HTTPException, status
from sqlalchemy import func, or_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.audit import record_audit
from app.core.exercise_seed import slugify
from app.core.permissions import has_permission
from app.middleware.tenant import TenantContext
from app.models.fitness import (
    GLOBAL_SCOPE,
    BodyMeasurement,
    Exercise,
    FitnessAssessment,
    MeasurementType,
    WorkoutAssignment,
    WorkoutAssignmentEvent,
    WorkoutDay,
    WorkoutItem,
    WorkoutProgram,
    WorkoutProgramVersion,
    WorkoutSession,
    WorkoutSetLog,
)
from app.models.member import Member, MemberStatus
from app.models.system import Notification
from app.models.trainer import Trainer, TrainerClient, TrainerClientStatus
from app.models.user import User
from app.services.membership_lifecycle import workspace_today
from app.services.trainer import TrainerService

GYM_WIDE_ROLES = {"OWNER", "ADMIN", "MANAGER", "SUPER_ADMIN"}
OPEN_SESSION_STATUSES = ("in_progress", "paused")
ASSIGNABLE_MEMBER_STATUSES = {MemberStatus.ACTIVE, MemberStatus.EXPIRING, MemberStatus.FROZEN}

BUILT_IN_METRICS = {
    "weight": ("Body weight", "kg", 20, 400),
    "body_fat": ("Body fat", "%", 2, 75),
    "waist": ("Waist", "cm", 30, 250),
    "chest": ("Chest", "cm", 40, 250),
    "hips": ("Hips", "cm", 40, 250),
    "arm_left": ("Left arm", "cm", 10, 100),
    "arm_right": ("Right arm", "cm", 10, 100),
    "thigh_left": ("Left thigh", "cm", 20, 150),
    "thigh_right": ("Right thigh", "cm", 20, 150),
    "neck": ("Neck", "cm", 20, 80),
}

ALLOWED_MEDIA_EXT = {
    "image": (".jpg", ".jpeg", ".png", ".webp", ".avif"),
    "gif": (".gif", ".webp"),
    "video": (".mp4", ".webm", ".mov"),
}
YOUTUBE_HOSTS = {"youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be", "www.youtube-nocookie.com"}


def utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _loads(raw: Optional[str], default=None):
    if not raw:
        return [] if default is None else default
    try:
        return json.loads(raw)
    except (TypeError, ValueError):
        return [] if default is None else default


def _member_name(m: Optional[Member]) -> str:
    if not m:
        return "Unknown member"
    return f"{m.first_name} {m.last_name or ''}".strip()


def _user_names(db: Session, user_ids: Iterable[Optional[str]]) -> dict:
    ids = {u for u in user_ids if u}
    if not ids:
        return {}
    return {u.id: u.full_name for u in db.query(User.id, User.full_name).filter(User.id.in_(ids)).all()}


class FitnessActor:
    def __init__(self, db: Session, tenant: TenantContext):
        self.db = db
        self.tenant = tenant
        self.trainer: Optional[Trainer] = None
        self.member: Optional[Member] = None
        if not tenant.workspace_id:
            raise HTTPException(status_code=403, detail="Workspace context required.")
        if tenant.role in GYM_WIDE_ROLES:
            self.kind = "gym"
        elif tenant.role == "TRAINER":
            self.kind = "trainer"
            self.trainer = TrainerService(db, tenant).verify_trainer_access()
        else:
            self.kind = "member"
            from app.services.member_lifecycle import get_or_create_member_for_user
            self.member = get_or_create_member_for_user(db, tenant.workspace_id, tenant.user_id)

    @property
    def ws(self) -> str:
        return self.tenant.workspace_id

    @property
    def is_staff(self) -> bool:
        return self.kind in ("gym", "trainer")

    def can(self, permission: str) -> bool:
        return self.is_staff and has_permission(self.db, self.tenant, permission)

    def require(self, permission: str, message: str) -> None:
        if not self.can(permission):
            raise HTTPException(status_code=403, detail=message)

    def require_staff(self) -> None:
        if not self.is_staff:
            raise HTTPException(status_code=403, detail="Only gym staff and trainers can do this.")

    def client_ids(self) -> Optional[set]:
        """Members this actor may see; None means every member in the workspace."""
        if self.kind == "gym":
            return None
        if self.kind == "member":
            return {self.member.id}
        rows = self.db.query(TrainerClient.client_id).filter(
            TrainerClient.workspace_id == self.ws,
            TrainerClient.trainer_id == self.trainer.id,
            TrainerClient.status == TrainerClientStatus.ACTIVE,
        ).all()
        return {r[0] for r in rows}

    def member_for(self, member_id: str) -> Member:
        member = self.db.query(Member).filter(Member.workspace_id == self.ws, Member.id == member_id).first()
        if not member:
            raise HTTPException(status_code=404, detail="Member not found.")
        if self.kind == "gym":
            return member
        if self.kind == "member":
            if member.id != self.member.id:
                raise HTTPException(status_code=404, detail="Member not found.")
            return member
        cids = self.client_ids()
        if cids is None or member.id not in cids:
            raise HTTPException(status_code=403, detail="Access denied. This member is not assigned to you.")
        return member


class FitnessService:
    def __init__(self, db: Session, tenant: TenantContext):
        self.db = db
        self.tenant = tenant
        self.actor = FitnessActor(db, tenant)
        self.ws = tenant.workspace_id

    # ================================================================ context

    def context(self) -> dict:
        a = self.actor
        return {
            "kind": a.kind,
            "member_id": a.member.id if a.member else None,
            "trainer_id": a.trainer.id if a.trainer else None,
            "can_manage_exercises": a.can("exercises.manage"),
            "can_manage_programs": a.can("programs.manage"),
            "can_assign": a.can("workouts.assign"),
        }

    def today(self) -> date:
        return workspace_today(self.db, self.ws)

    # ================================================================ exercises

    def _exercise_visible_q(self):
        return self.db.query(Exercise).filter(
            or_(Exercise.scope_key == GLOBAL_SCOPE, Exercise.workspace_id == self.ws)
        )

    def _member_exercise_ids(self, member_id: str) -> set:
        rows = (
            self.db.query(WorkoutItem.exercise_id)
            .join(WorkoutDay, WorkoutItem.day_id == WorkoutDay.id)
            .join(WorkoutAssignment, WorkoutDay.assignment_id == WorkoutAssignment.id)
            .filter(WorkoutAssignment.workspace_id == self.ws, WorkoutAssignment.member_id == member_id)
            .distinct().all()
        )
        logged = self.db.query(WorkoutSetLog.exercise_id).filter(
            WorkoutSetLog.workspace_id == self.ws, WorkoutSetLog.member_id == member_id
        ).distinct().all()
        return {r[0] for r in rows} | {r[0] for r in logged}

    def can_edit_exercise(self, ex: Exercise) -> bool:
        if ex.scope_key == GLOBAL_SCOPE:
            return self.tenant.role == "SUPER_ADMIN"
        if ex.workspace_id != self.ws or not self.actor.can("exercises.manage"):
            return False
        if self.actor.kind == "trainer":
            return ex.created_by_user_id == self.tenant.user_id
        return True

    def exercise_out(self, ex: Exercise) -> dict:
        return {
            "id": ex.id, "scope": "global" if ex.scope_key == GLOBAL_SCOPE else "gym", "name": ex.name,
            "slug": ex.slug, "description": ex.description, "category": ex.category,
            "movement_pattern": ex.movement_pattern, "primary_muscles": _loads(ex.primary_muscles),
            "secondary_muscles": _loads(ex.secondary_muscles), "equipment": _loads(ex.equipment),
            "difficulty": ex.difficulty, "exercise_type": ex.exercise_type, "tracking_type": ex.tracking_type,
            "instructions": _loads(ex.instructions), "breathing": ex.breathing,
            "safety_tips": _loads(ex.safety_tips), "common_mistakes": _loads(ex.common_mistakes),
            "media_type": ex.media_type, "media_url": ex.media_url, "status": ex.status,
            "created_by_user_id": ex.created_by_user_id if self.actor.is_staff else None,
            "can_edit": self.can_edit_exercise(ex), "created_at": ex.created_at, "updated_at": ex.updated_at,
        }

    def list_exercises(self, *, search=None, category=None, muscle=None, equipment=None, difficulty=None,
                       exercise_type=None, scope=None, include_archived=False, sort="name", page=1, page_size=24):
        q = self._exercise_visible_q()
        if self.actor.kind == "member":
            ids = self._member_exercise_ids(self.actor.member.id)
            q = q.filter(Exercise.id.in_(ids or {"__none__"}))
        elif not include_archived:
            q = q.filter(Exercise.status == "active")
        if search:
            term = f"%{search.strip().lower()}%"
            q = q.filter(or_(func.lower(Exercise.name).like(term), func.lower(Exercise.description).like(term)))
        if category:
            q = q.filter(Exercise.category == category)
        if difficulty:
            q = q.filter(Exercise.difficulty == difficulty)
        if exercise_type:
            q = q.filter(Exercise.exercise_type == exercise_type)
        if muscle:
            q = q.filter(or_(Exercise.primary_muscles.like(f'%"{muscle}"%'), Exercise.secondary_muscles.like(f'%"{muscle}"%')))
        if equipment:
            q = q.filter(Exercise.equipment.like(f'%"{equipment}"%'))
        if scope == "global":
            q = q.filter(Exercise.scope_key == GLOBAL_SCOPE)
        elif scope == "gym":
            q = q.filter(Exercise.workspace_id == self.ws)
        total = q.count()
        order = {
            "name": Exercise.name.asc(), "-name": Exercise.name.desc(),
            "newest": Exercise.created_at.desc(), "difficulty": Exercise.difficulty.asc(),
        }.get(sort, Exercise.name.asc())
        rows = q.order_by(order, Exercise.id).offset((page - 1) * page_size).limit(page_size).all()
        return {"items": [self.exercise_out(e) for e in rows], "total": total, "page": page, "page_size": page_size}

    def get_exercise(self, exercise_id: str) -> Exercise:
        ex = self._exercise_visible_q().filter(Exercise.id == exercise_id).first()
        if not ex:
            raise HTTPException(status_code=404, detail="Exercise not found.")
        if self.actor.kind == "member" and ex.id not in self._member_exercise_ids(self.actor.member.id):
            raise HTTPException(status_code=404, detail="Exercise not found.")
        return ex

    @staticmethod
    def _validate_media(media_type: Optional[str], url: Optional[str]) -> None:
        if not url:
            return
        parsed = urlparse(url)
        if parsed.scheme != "https" or not parsed.netloc:
            raise HTTPException(status_code=422, detail="Media must be an https:// URL.")
        host = parsed.netloc.lower().split(":")[0]
        if media_type == "youtube":
            if host not in YOUTUBE_HOSTS:
                raise HTTPException(status_code=422, detail="YouTube media must be a youtube.com or youtu.be link.")
            return
        if not parsed.path.lower().endswith(ALLOWED_MEDIA_EXT[media_type]):
            allowed = ", ".join(ALLOWED_MEDIA_EXT[media_type])
            raise HTTPException(status_code=422, detail=f"{media_type.title()} URL must end with {allowed}.")

    def _check_duplicate_exercise(self, name: str, exclude_id: Optional[str] = None) -> str:
        slug = slugify(name)
        if not slug:
            raise HTTPException(status_code=422, detail="Exercise name must contain letters or numbers.")
        q = self.db.query(Exercise).filter(
            Exercise.slug == slug, or_(Exercise.scope_key == GLOBAL_SCOPE, Exercise.scope_key == self.ws)
        )
        if exclude_id:
            q = q.filter(Exercise.id != exclude_id)
        clash = q.first()
        if clash:
            where = "the global library" if clash.scope_key == GLOBAL_SCOPE else "your gym's library"
            raise HTTPException(status_code=409, detail=f"An exercise named '{clash.name}' already exists in {where}.")
        return slug

    def _apply_exercise_fields(self, ex: Exercise, data) -> None:
        payload = data.model_dump()
        for key in ("primary_muscles", "secondary_muscles", "equipment", "instructions", "safety_tips", "common_mistakes"):
            payload[key] = json.dumps(payload[key])
        for key, value in payload.items():
            setattr(ex, key, value)

    def create_exercise(self, data) -> Exercise:
        self.actor.require("exercises.manage", "You don't have permission to create exercises.")
        self._validate_media(data.media_type, data.media_url)
        slug = self._check_duplicate_exercise(data.name)
        ex = Exercise(workspace_id=self.ws, scope_key=self.ws, slug=slug, status="active",
                      created_by_user_id=self.tenant.user_id)
        self._apply_exercise_fields(ex, data)
        self.db.add(ex)
        self.db.flush()
        record_audit(self.db, self.ws, self.tenant.user_id, "exercise.created", resource_type="exercise",
                     resource_id=ex.id, details={"name": ex.name})
        self._commit_unique("An exercise with this name already exists.")
        self.db.refresh(ex)
        return ex

    def _editable_exercise(self, exercise_id: str) -> Exercise:
        ex = self.get_exercise(exercise_id)
        if not self.can_edit_exercise(ex):
            if ex.scope_key == GLOBAL_SCOPE:
                raise HTTPException(status_code=403, detail="Global exercises are managed by REPSI and can't be edited.")
            raise HTTPException(status_code=403, detail="You can only edit exercises you are permitted to manage.")
        return ex

    def update_exercise(self, exercise_id: str, data) -> Exercise:
        ex = self._editable_exercise(exercise_id)
        self._validate_media(data.media_type, data.media_url)
        ex.slug = self._check_duplicate_exercise(data.name, exclude_id=ex.id)
        changed = [k for k, v in data.model_dump().items()
                   if (json.dumps(v) if isinstance(v, list) else v) != getattr(ex, k)]
        self._apply_exercise_fields(ex, data)
        record_audit(self.db, self.ws, self.tenant.user_id, "exercise.updated", resource_type="exercise",
                     resource_id=ex.id, details={"fields": changed})
        self._commit_unique("An exercise with this name already exists.")
        self.db.refresh(ex)
        return ex

    def set_exercise_status(self, exercise_id: str, new_status: str) -> Exercise:
        ex = self._editable_exercise(exercise_id)
        if ex.status != new_status:
            ex.status = new_status
            record_audit(self.db, self.ws, self.tenant.user_id, f"exercise.{'archived' if new_status == 'archived' else 'restored'}",
                         resource_type="exercise", resource_id=ex.id)
            self.db.commit()
            self.db.refresh(ex)
        return ex

    def _commit_unique(self, message: str) -> None:
        try:
            self.db.commit()
        except IntegrityError:
            self.db.rollback()
            raise HTTPException(status_code=409, detail=message)

    # ================================================================ plan structure (days/items)

    def _days_for(self, *, version_id: Optional[str] = None, assignment_id: Optional[str] = None):
        q = self.db.query(WorkoutDay).filter(WorkoutDay.workspace_id == self.ws)
        q = q.filter(WorkoutDay.program_version_id == version_id) if version_id else q.filter(WorkoutDay.assignment_id == assignment_id)
        days = q.order_by(WorkoutDay.position).all()
        items_by_day = defaultdict(list)
        if days:
            for it in self.db.query(WorkoutItem).filter(WorkoutItem.day_id.in_([d.id for d in days])).order_by(WorkoutItem.position).all():
                items_by_day[it.day_id].append(it)
        return [(d, items_by_day[d.id]) for d in days]

    def _exercise_map(self, ids: Iterable[str]) -> dict:
        ids = set(ids)
        if not ids:
            return {}
        return {e.id: e for e in self._exercise_visible_q().filter(Exercise.id.in_(ids)).all()}

    def item_out(self, it: WorkoutItem, exmap: dict) -> dict:
        ex = exmap.get(it.exercise_id)
        return {
            "id": it.id, "exercise_id": it.exercise_id, "exercise_name": ex.name if ex else "Unavailable exercise",
            "exercise_category": ex.category if ex else None,
            "tracking_type": ex.tracking_type if ex else "weight_reps",
            "media_type": ex.media_type if ex else None, "media_url": ex.media_url if ex else None,
            "primary_muscles": _loads(ex.primary_muscles) if ex else [],
            "secondary_muscles": _loads(ex.secondary_muscles) if ex else [],
            "equipment": _loads(ex.equipment) if ex else [],
            "position": it.position, "section": it.section, "group_type": it.group_type,
            "group_label": it.group_label, "sets": it.sets, "reps_min": it.reps_min, "reps_max": it.reps_max,
            "target_weight_kg": it.target_weight_kg, "duration_seconds": it.duration_seconds,
            "distance_m": it.distance_m, "rest_seconds": it.rest_seconds, "tempo": it.tempo, "notes": it.notes,
        }

    def days_out(self, days) -> list:
        exmap = self._exercise_map(it.exercise_id for _, items in days for it in items)
        return [{
            "id": d.id, "position": d.position, "name": d.name, "is_rest_day": d.is_rest_day, "notes": d.notes,
            "items": [self.item_out(it, exmap) for it in items],
        } for d, items in days]

    def _validate_exercises(self, days_in, already_used: set) -> dict:
        ids = {it.exercise_id for d in days_in for it in d.items}
        exmap = self._exercise_map(ids)
        missing = ids - set(exmap)
        if missing:
            raise HTTPException(status_code=422, detail="One or more exercises were not found in your library.")
        archived = [e.name for e in exmap.values() if e.status != "active" and e.id not in already_used]
        if archived:
            raise HTTPException(status_code=422, detail=f"Archived exercises can't be added: {', '.join(archived)}.")
        return exmap

    @staticmethod
    def _item_fields(it) -> dict:
        return {k: getattr(it, k) for k in (
            "exercise_id", "section", "group_type", "group_label", "sets", "reps_min", "reps_max",
            "target_weight_kg", "duration_seconds", "distance_m", "rest_seconds", "tempo", "notes")}

    def _write_days(self, days_in, *, version_id=None, assignment_id=None) -> None:
        for d_pos, d in enumerate(days_in):
            day = WorkoutDay(workspace_id=self.ws, program_version_id=version_id, assignment_id=assignment_id,
                             position=d_pos, name=d.name.strip(), is_rest_day=d.is_rest_day, notes=d.notes)
            self.db.add(day)
            self.db.flush()
            for i_pos, it in enumerate(d.items):
                self.db.add(WorkoutItem(workspace_id=self.ws, day_id=day.id, position=i_pos, **self._item_fields(it)))

    def _copy_days(self, src_days, *, version_id=None, assignment_id=None) -> None:
        for d, items in src_days:
            day = WorkoutDay(workspace_id=self.ws, program_version_id=version_id, assignment_id=assignment_id,
                             position=d.position, name=d.name, is_rest_day=d.is_rest_day, notes=d.notes)
            self.db.add(day)
            self.db.flush()
            for it in items:
                self.db.add(WorkoutItem(workspace_id=self.ws, day_id=day.id, position=it.position, **self._item_fields(it)))

    @staticmethod
    def _validate_publishable(days) -> None:
        """`days` is a list of (day, items) or DayIn objects."""
        training = 0
        for d in days:
            day, items = (d if isinstance(d, tuple) else (d, d.items))
            if not day.is_rest_day:
                if not items:
                    raise HTTPException(status_code=422, detail=f"Training day '{day.name}' has no exercises. Add exercises or mark it as a rest day.")
                training += 1
        if training == 0:
            raise HTTPException(status_code=422, detail="A program needs at least one training day with exercises before it can be published or assigned.")

    # ================================================================ programs

    def _program(self, program_id: str) -> WorkoutProgram:
        p = self.db.query(WorkoutProgram).filter(WorkoutProgram.workspace_id == self.ws, WorkoutProgram.id == program_id).first()
        if not p:
            raise HTTPException(status_code=404, detail="Program not found.")
        self.actor.require_staff()
        if self.actor.kind == "trainer" and p.status != "published" and p.created_by_user_id != self.tenant.user_id:
            raise HTTPException(status_code=404, detail="Program not found.")
        return p

    def can_edit_program(self, p: WorkoutProgram) -> bool:
        if not self.actor.can("programs.manage"):
            return False
        return self.actor.kind == "gym" or p.created_by_user_id == self.tenant.user_id

    def _editable_program(self, program_id: str) -> WorkoutProgram:
        p = self._program(program_id)
        if not self.can_edit_program(p):
            raise HTTPException(status_code=403, detail="You can only edit programs you created.")
        return p

    def _draft_version(self, p: WorkoutProgram) -> Optional[WorkoutProgramVersion]:
        return self.db.query(WorkoutProgramVersion).filter(
            WorkoutProgramVersion.program_id == p.id, WorkoutProgramVersion.status == "draft"
        ).order_by(WorkoutProgramVersion.version_number.desc()).first()

    def _version(self, version_id: Optional[str]) -> Optional[WorkoutProgramVersion]:
        if not version_id:
            return None
        return self.db.query(WorkoutProgramVersion).filter(
            WorkoutProgramVersion.workspace_id == self.ws, WorkoutProgramVersion.id == version_id
        ).first()

    def _next_version_number(self, program_id: str) -> int:
        current = self.db.query(func.max(WorkoutProgramVersion.version_number)).filter(
            WorkoutProgramVersion.program_id == program_id).scalar()
        return (current or 0) + 1

    def program_out(self, p: WorkoutProgram, names: Optional[dict] = None) -> dict:
        current = self._version(p.current_version_id)
        draft = self._draft_version(p)
        basis = draft or current
        days = self._days_for(version_id=basis.id) if basis else []
        active = self.db.query(WorkoutAssignment).filter(
            WorkoutAssignment.workspace_id == self.ws, WorkoutAssignment.program_id == p.id,
            WorkoutAssignment.status.in_(("active", "paused")),
        ).count()
        names = names if names is not None else _user_names(self.db, [p.created_by_user_id])
        return {
            "id": p.id, "name": p.name, "description": p.description, "objective": p.objective,
            "difficulty": p.difficulty, "duration_weeks": p.duration_weeks, "status": p.status,
            "created_by_user_id": p.created_by_user_id, "created_by_name": names.get(p.created_by_user_id),
            "current_version_id": p.current_version_id,
            "current_version_number": current.version_number if current else None,
            "has_unpublished_changes": draft is not None and current is not None,
            "training_days": sum(1 for d, _ in days if not d.is_rest_day),
            "exercise_count": sum(len(items) for _, items in days),
            "active_assignments": active, "can_edit": self.can_edit_program(p),
            "created_at": p.created_at, "updated_at": p.updated_at,
        }

    def program_detail(self, p: WorkoutProgram) -> dict:
        out = self.program_out(p)
        draft = self._draft_version(p)
        basis = draft or self._version(p.current_version_id)
        versions = self.db.query(WorkoutProgramVersion).filter(
            WorkoutProgramVersion.program_id == p.id).order_by(WorkoutProgramVersion.version_number.desc()).all()
        counts = dict(self.db.query(WorkoutAssignment.program_version_id, func.count(WorkoutAssignment.id)).filter(
            WorkoutAssignment.workspace_id == self.ws, WorkoutAssignment.program_id == p.id,
        ).group_by(WorkoutAssignment.program_version_id).all())
        out.update({
            "editing_version_id": basis.id if basis else None,
            "editing_version_number": basis.version_number if basis else None,
            "days": self.days_out(self._days_for(version_id=basis.id)) if basis else [],
            "versions": [{
                "id": v.id, "version_number": v.version_number, "status": v.status, "published_at": v.published_at,
                "change_note": v.change_note, "created_at": v.created_at, "assignment_count": counts.get(v.id, 0),
            } for v in versions],
        })
        return out

    def list_programs(self, *, search=None, status_filter=None, mine=False, page=1, page_size=24) -> dict:
        self.actor.require_staff()
        q = self.db.query(WorkoutProgram).filter(WorkoutProgram.workspace_id == self.ws)
        if self.actor.kind == "trainer":
            q = q.filter(or_(WorkoutProgram.status == "published", WorkoutProgram.created_by_user_id == self.tenant.user_id))
        if mine:
            q = q.filter(WorkoutProgram.created_by_user_id == self.tenant.user_id)
        if status_filter:
            q = q.filter(WorkoutProgram.status == status_filter)
        else:
            q = q.filter(WorkoutProgram.status != "archived")
        if search:
            q = q.filter(func.lower(WorkoutProgram.name).like(f"%{search.strip().lower()}%"))
        total = q.count()
        rows = q.order_by(WorkoutProgram.updated_at.desc(), WorkoutProgram.id).offset((page - 1) * page_size).limit(page_size).all()
        names = _user_names(self.db, [p.created_by_user_id for p in rows])
        return {"items": [self.program_out(p, names) for p in rows], "total": total, "page": page, "page_size": page_size}

    def _save_structure(self, p: WorkoutProgram, data) -> WorkoutProgramVersion:
        draft = self._draft_version(p)
        used = set()
        if draft:
            used = {it.exercise_id for _, items in self._days_for(version_id=draft.id) for it in items}
        current = self._version(p.current_version_id)
        if current:
            used |= {it.exercise_id for _, items in self._days_for(version_id=current.id) for it in items}
        self._validate_exercises(data.days, used)
        if draft:
            # Drafts are never referenced by assignments, so they can be rewritten in place.
            self._delete_version_days(draft.id)
            draft.change_note = data.change_note or draft.change_note
        else:
            draft = WorkoutProgramVersion(workspace_id=self.ws, program_id=p.id,
                                          version_number=self._next_version_number(p.id), status="draft",
                                          created_by_user_id=self.tenant.user_id, change_note=data.change_note)
            self.db.add(draft)
            self.db.flush()
        self._write_days(data.days, version_id=draft.id)
        self.db.flush()
        return draft

    def _delete_version_days(self, version_id: str) -> None:
        # Explicit child deletes: SQLite doesn't enforce ON DELETE CASCADE without a pragma.
        day_ids = [d for (d,) in self.db.query(WorkoutDay.id).filter(WorkoutDay.program_version_id == version_id).all()]
        if day_ids:
            self.db.query(WorkoutItem).filter(WorkoutItem.day_id.in_(day_ids)).delete(synchronize_session=False)
            self.db.query(WorkoutDay).filter(WorkoutDay.id.in_(day_ids)).delete(synchronize_session=False)
        self.db.flush()

    def _publish(self, p: WorkoutProgram, version: WorkoutProgramVersion) -> None:
        self._validate_publishable(self._days_for(version_id=version.id))
        version.status = "published"
        version.published_at = utcnow()
        p.current_version_id = version.id
        if p.status != "archived":
            p.status = "published"
        record_audit(self.db, self.ws, self.tenant.user_id, "program.published", resource_type="workout_program",
                     resource_id=p.id, details={"version": version.version_number})

    def create_program(self, data) -> WorkoutProgram:
        self.actor.require("programs.manage", "You don't have permission to create workout programs.")
        if data.publish:
            self._validate_publishable(data.days)
        p = WorkoutProgram(workspace_id=self.ws, name=data.name.strip(), description=data.description,
                           objective=data.objective, difficulty=data.difficulty, duration_weeks=data.duration_weeks,
                           status="draft", created_by_user_id=self.tenant.user_id,
                           created_by_trainer_id=self.actor.trainer.id if self.actor.trainer else None)
        self.db.add(p)
        self.db.flush()
        version = self._save_structure(p, data)
        record_audit(self.db, self.ws, self.tenant.user_id, "program.created", resource_type="workout_program",
                     resource_id=p.id, details={"name": p.name})
        if data.publish:
            self._publish(p, version)
        self.db.commit()
        self.db.refresh(p)
        return p

    def update_program(self, program_id: str, data) -> WorkoutProgram:
        p = self._editable_program(program_id)
        if p.status == "archived":
            raise HTTPException(status_code=409, detail="Restore this program before editing it.")
        if data.publish:
            self._validate_publishable(data.days)
        for key in ("name", "description", "objective", "difficulty", "duration_weeks"):
            setattr(p, key, getattr(data, key).strip() if key == "name" else getattr(data, key))
        version = self._save_structure(p, data)
        if data.publish:
            self._publish(p, version)
        p.updated_at = utcnow()
        self.db.commit()
        self.db.refresh(p)
        return p

    def publish_program(self, program_id: str) -> WorkoutProgram:
        p = self._editable_program(program_id)
        if p.status == "archived":
            raise HTTPException(status_code=409, detail="Restore this program before publishing it.")
        draft = self._draft_version(p)
        if not draft:
            raise HTTPException(status_code=409, detail="There are no unpublished changes.")
        self._publish(p, draft)
        self.db.commit()
        self.db.refresh(p)
        return p

    def discard_draft(self, program_id: str) -> WorkoutProgram:
        p = self._editable_program(program_id)
        draft = self._draft_version(p)
        if not draft:
            raise HTTPException(status_code=409, detail="There are no unpublished changes.")
        if not p.current_version_id:
            raise HTTPException(status_code=409, detail="This program has never been published; archive it instead.")
        self._delete_version_days(draft.id)
        self.db.delete(draft)
        self.db.commit()
        self.db.refresh(p)
        return p

    def duplicate_program(self, program_id: str) -> WorkoutProgram:
        self.actor.require("programs.manage", "You don't have permission to create workout programs.")
        src = self._program(program_id)
        basis = (self._draft_version(src) if self.can_edit_program(src) else None) or self._version(src.current_version_id)
        copy = WorkoutProgram(workspace_id=self.ws, name=f"{src.name} (copy)"[:150], description=src.description,
                              objective=src.objective, difficulty=src.difficulty, duration_weeks=src.duration_weeks,
                              status="draft", created_by_user_id=self.tenant.user_id,
                              created_by_trainer_id=self.actor.trainer.id if self.actor.trainer else None)
        self.db.add(copy)
        self.db.flush()
        version = WorkoutProgramVersion(workspace_id=self.ws, program_id=copy.id, version_number=1, status="draft",
                                        created_by_user_id=self.tenant.user_id, change_note=f"Copied from {src.name}")
        self.db.add(version)
        self.db.flush()
        if basis:
            self._copy_days(self._days_for(version_id=basis.id), version_id=version.id)
        record_audit(self.db, self.ws, self.tenant.user_id, "program.duplicated", resource_type="workout_program",
                     resource_id=copy.id, details={"source_program_id": src.id})
        self.db.commit()
        self.db.refresh(copy)
        return copy

    def set_program_status(self, program_id: str, archive: bool) -> WorkoutProgram:
        p = self._editable_program(program_id)
        target = "archived" if archive else ("published" if p.current_version_id else "draft")
        if p.status != target:
            p.status = target
            record_audit(self.db, self.ws, self.tenant.user_id, "program.archived" if archive else "program.restored",
                         resource_type="workout_program", resource_id=p.id)
            self.db.commit()
            self.db.refresh(p)
        return p

    def version_detail(self, program_id: str, version_id: str) -> dict:
        p = self._program(program_id)
        v = self._version(version_id)
        if not v or v.program_id != p.id:
            raise HTTPException(status_code=404, detail="Program version not found.")
        if v.status == "draft" and not self.can_edit_program(p):
            raise HTTPException(status_code=404, detail="Program version not found.")
        return {"id": v.id, "program_id": p.id, "version_number": v.version_number, "status": v.status,
                "days": self.days_out(self._days_for(version_id=v.id))}

    # ================================================================ assignments

    def _assignment(self, assignment_id: str) -> WorkoutAssignment:
        a = self.db.query(WorkoutAssignment).filter(
            WorkoutAssignment.workspace_id == self.ws, WorkoutAssignment.id == assignment_id).first()
        if not a:
            raise HTTPException(status_code=404, detail="Workout plan not found.")
        try:
            self.actor.member_for(a.member_id)
        except HTTPException as exc:
            if self.actor.kind == "member":
                raise HTTPException(status_code=404, detail="Workout plan not found.")
            raise exc
        return a

    def _manageable_assignment(self, assignment_id: str) -> WorkoutAssignment:
        a = self._assignment(assignment_id)
        self.actor.require("workouts.assign", "You don't have permission to change workout plans.")
        return a

    def _event(self, a: WorkoutAssignment, event_type: str, details: Optional[dict] = None) -> None:
        self.db.add(WorkoutAssignmentEvent(workspace_id=self.ws, assignment_id=a.id, member_id=a.member_id,
                                           actor_user_id=self.tenant.user_id, event_type=event_type,
                                           details=json.dumps(details, default=str) if details else None))

    def _notify_member(self, member: Member, title: str, message: str) -> None:
        if member.user_id:
            self.db.add(Notification(workspace_id=self.ws, user_id=member.user_id, title=title, message=message))

    def assignment_out(self, a: WorkoutAssignment, *, with_stats=True, members=None, trainers=None, names=None) -> dict:
        member = (members or {}).get(a.member_id) or self.db.query(Member).filter(Member.id == a.member_id).first()
        trainer = None
        if a.trainer_id:
            trainer = (trainers or {}).get(a.trainer_id) or self.db.query(Trainer).filter(Trainer.id == a.trainer_id).first()
        names = names if names is not None else _user_names(self.db, [a.assigned_by_user_id])
        version = self._version(a.program_version_id)
        program = self.db.query(WorkoutProgram).filter(WorkoutProgram.id == a.program_id).first() if a.program_id else None
        out = {
            "id": a.id, "member_id": a.member_id, "member_name": _member_name(member), "program_id": a.program_id,
            "program_version_id": a.program_version_id,
            "program_version_number": version.version_number if version else None,
            "newer_version_available": bool(self.actor.is_staff and program and program.current_version_id
                                            and program.current_version_id != a.program_version_id),
            "title": a.title, "trainer_id": a.trainer_id, "trainer_name": trainer.name if trainer else None,
            "assigned_by_user_id": a.assigned_by_user_id if self.actor.is_staff else None,
            "assigned_by_name": names.get(a.assigned_by_user_id),
            "start_date": a.start_date, "end_date": a.end_date, "schedule_weekdays": _loads(a.schedule_weekdays),
            "status": a.status, "notes": a.notes, "is_customized": a.is_customized, "created_at": a.created_at,
            "stats": None,
        }
        if with_stats:
            out["stats"] = self.assignment_stats(a)
        return out

    def create_assignments(self, data) -> dict:
        self.actor.require("workouts.assign", "You don't have permission to assign workout plans.")
        p = self._program(data.program_id)
        if p.status != "published" or not p.current_version_id:
            raise HTTPException(status_code=409, detail="Only published, non-archived programs can be assigned.")
        version = self._version(p.current_version_id)
        src_days = self._days_for(version_id=version.id)
        self._validate_publishable(src_days)
        member_ids = list(dict.fromkeys(data.member_ids))
        # Authorise every member before writing anything: one forbidden id rejects the whole request.
        members = [self.actor.member_for(mid) for mid in member_ids]
        created, skipped = [], []
        weekdays = json.dumps(data.schedule_weekdays)
        for member in members:
            if member.status not in ASSIGNABLE_MEMBER_STATUSES:
                skipped.append({"member_id": member.id, "member_name": _member_name(member),
                                "reason": f"Member is {member.status.value}."})
                continue
            overlap = self.db.query(WorkoutAssignment).filter(
                WorkoutAssignment.workspace_id == self.ws, WorkoutAssignment.member_id == member.id,
                WorkoutAssignment.program_id == p.id, WorkoutAssignment.status.in_(("active", "paused")),
                or_(WorkoutAssignment.end_date.is_(None), WorkoutAssignment.end_date >= data.start_date),
            )
            if data.end_date:
                overlap = overlap.filter(WorkoutAssignment.start_date <= data.end_date)
            if overlap.first():
                skipped.append({"member_id": member.id, "member_name": _member_name(member),
                                "reason": "Already has an active assignment of this program for these dates."})
                continue
            trainer_id = self.actor.trainer.id if self.actor.trainer else None
            if not trainer_id:
                rel = self.db.query(TrainerClient).filter(
                    TrainerClient.workspace_id == self.ws, TrainerClient.client_id == member.id,
                    TrainerClient.status == TrainerClientStatus.ACTIVE,
                ).order_by(TrainerClient.assigned_at.desc()).first()
                trainer_id = rel.trainer_id if rel else None
            a = WorkoutAssignment(workspace_id=self.ws, member_id=member.id, program_id=p.id,
                                  program_version_id=version.id, title=p.name, trainer_id=trainer_id,
                                  assigned_by_user_id=self.tenant.user_id, start_date=data.start_date,
                                  end_date=data.end_date, schedule_weekdays=weekdays, status="active",
                                  notes=data.notes, is_customized=False)
            self.db.add(a)
            self.db.flush()
            self._copy_days(src_days, assignment_id=a.id)
            self._event(a, "assigned", {"program": p.name, "version": version.version_number,
                                        "start_date": data.start_date, "end_date": data.end_date,
                                        "weekdays": data.schedule_weekdays})
            self._notify_member(member, "New workout plan", f"You've been assigned '{p.name}' starting {data.start_date:%d %b %Y}.")
            created.append(a)
        if created:
            record_audit(self.db, self.ws, self.tenant.user_id, "workout.assigned", resource_type="workout_program",
                         resource_id=p.id, details={"member_ids": [a.member_id for a in created], "version": version.version_number})
        self.db.commit()
        return {"created": [self.assignment_out(a) for a in created], "skipped": skipped}

    def list_assignments(self, *, member_id=None, status_filter=None, page=1, page_size=50) -> dict:
        q = self.db.query(WorkoutAssignment).filter(WorkoutAssignment.workspace_id == self.ws)
        if member_id:
            self.actor.member_for(member_id)
            q = q.filter(WorkoutAssignment.member_id == member_id)
        else:
            allowed = self.actor.client_ids()
            if allowed is not None:
                q = q.filter(WorkoutAssignment.member_id.in_(allowed or {"__none__"}))
        if status_filter:
            q = q.filter(WorkoutAssignment.status == status_filter)
        total = q.count()
        rows = q.order_by(WorkoutAssignment.created_at.desc(), WorkoutAssignment.id).offset((page - 1) * page_size).limit(page_size).all()
        members = {m.id: m for m in self.db.query(Member).filter(Member.id.in_({a.member_id for a in rows} or {"__none__"})).all()}
        trainers = {t.id: t for t in self.db.query(Trainer).filter(Trainer.id.in_({a.trainer_id for a in rows if a.trainer_id} or {"__none__"})).all()}
        names = _user_names(self.db, [a.assigned_by_user_id for a in rows])
        return {"items": [self.assignment_out(a, members=members, trainers=trainers, names=names) for a in rows],
                "total": total, "page": page, "page_size": page_size}

    def assignment_detail(self, assignment_id: str) -> dict:
        a = self._assignment(assignment_id)
        out = self.assignment_out(a)
        out["days"] = self.days_out(self._days_for(assignment_id=a.id))
        return out

    def update_assignment(self, assignment_id: str, data) -> dict:
        a = self._manageable_assignment(assignment_id)
        changes = {}
        payload = data.model_dump(exclude_unset=True)
        new_start = payload.get("start_date", a.start_date)
        new_end = None if data.clear_end_date else payload.get("end_date", a.end_date)
        if new_end and new_end < new_start:
            raise HTTPException(status_code=422, detail="End date cannot be before the start date.")
        if new_start != a.start_date:
            first_session = self.db.query(func.min(WorkoutSession.scheduled_date)).filter(WorkoutSession.assignment_id == a.id).scalar()
            if first_session and new_start > first_session:
                raise HTTPException(status_code=409, detail=f"Start date can't move past the first logged session ({first_session:%d %b %Y}).")
            changes["start_date"] = (a.start_date, new_start)
            a.start_date = new_start
        if new_end != a.end_date:
            changes["end_date"] = (a.end_date, new_end)
            a.end_date = new_end
        if data.schedule_weekdays is not None and data.schedule_weekdays != _loads(a.schedule_weekdays):
            changes["schedule_weekdays"] = (_loads(a.schedule_weekdays), data.schedule_weekdays)
            a.schedule_weekdays = json.dumps(data.schedule_weekdays)
        if "notes" in payload and payload["notes"] != a.notes:
            changes["notes"] = "updated"
            a.notes = payload["notes"]
        status_change = None
        if data.status and data.status != a.status:
            if a.status in ("completed", "cancelled"):
                raise HTTPException(status_code=409, detail=f"This plan is {a.status} and can't be changed. Assign the program again instead.")
            status_change = (a.status, data.status)
            a.status = data.status
            a.status_changed_on = None if data.status == "active" else self.today()
        if not changes and not status_change:
            return self.assignment_out(a)
        if changes:
            self._event(a, "rescheduled" if any(k in changes for k in ("start_date", "end_date", "schedule_weekdays")) else "updated",
                        {"changes": changes, "reason": data.reason})
        if status_change:
            self._event(a, "status_changed", {"from": status_change[0], "to": status_change[1], "reason": data.reason})
        self.db.commit()
        self.db.refresh(a)
        return self.assignment_out(a)

    def update_assignment_plan(self, assignment_id: str, data) -> dict:
        a = self._manageable_assignment(assignment_id)
        if a.status not in ("active", "paused"):
            raise HTTPException(status_code=409, detail=f"This plan is {a.status} and can't be customised.")
        self._validate_publishable(data.days)
        existing = self._days_for(assignment_id=a.id)
        day_by_id = {d.id: d for d, _ in existing}
        item_by_id = {it.id: it for _, items in existing for it in items}
        self._validate_exercises(data.days, {it.exercise_id for it in item_by_id.values()})
        exmap = self._exercise_map({it.exercise_id for d in data.days for it in d.items} | {it.exercise_id for it in item_by_id.values()})
        kept_days, kept_items = set(), set()
        summary = {"added": [], "removed": [], "replaced": [], "modified": 0}
        for d_pos, d in enumerate(data.days):
            if d.id:
                if d.id not in day_by_id:
                    raise HTTPException(status_code=422, detail="A day in the request doesn't belong to this plan.")
                day = day_by_id[d.id]
                day.position, day.name, day.is_rest_day, day.notes = d_pos, d.name.strip(), d.is_rest_day, d.notes
            else:
                day = WorkoutDay(workspace_id=self.ws, assignment_id=a.id, position=d_pos, name=d.name.strip(),
                                 is_rest_day=d.is_rest_day, notes=d.notes)
                self.db.add(day)
                self.db.flush()
            kept_days.add(day.id)
            for i_pos, it in enumerate(d.items):
                fields = self._item_fields(it)
                if it.id:
                    row = item_by_id.get(it.id)
                    if not row:
                        raise HTTPException(status_code=422, detail="An exercise in the request doesn't belong to this plan.")
                    if row.exercise_id != it.exercise_id:
                        summary["replaced"].append({"from": exmap[row.exercise_id].name, "to": exmap[it.exercise_id].name})
                    elif any(getattr(row, k) != v for k, v in fields.items()) or row.day_id != day.id:
                        summary["modified"] += 1
                    for k, v in fields.items():
                        setattr(row, k, v)
                    row.day_id, row.position = day.id, i_pos
                    kept_items.add(row.id)
                else:
                    self.db.add(WorkoutItem(workspace_id=self.ws, day_id=day.id, position=i_pos, **fields))
                    summary["added"].append(exmap[it.exercise_id].name)
        for item_id, row in item_by_id.items():
            if item_id not in kept_items:
                summary["removed"].append(exmap[row.exercise_id].name if row.exercise_id in exmap else row.exercise_id)
                self.db.query(WorkoutSetLog).filter(WorkoutSetLog.item_id == item_id).update({WorkoutSetLog.item_id: None})
                self.db.delete(row)
        self.db.flush()  # item moves/deletes must land before their old days go (PostgreSQL cascades)
        for day_id, day in day_by_id.items():
            if day_id not in kept_days:
                self.db.query(WorkoutSession).filter(WorkoutSession.day_id == day_id).update({WorkoutSession.day_id: None})
                self.db.delete(day)
        a.is_customized = True
        a.updated_at = utcnow()
        self._event(a, "customized", {**summary, "reason": data.reason})
        member = self.db.query(Member).filter(Member.id == a.member_id).first()
        self._notify_member(member, "Workout plan updated", f"Your plan '{a.title}' was updated by your trainer.")
        self.db.commit()
        return self.assignment_detail(a.id)

    def assignment_events(self, assignment_id: str) -> list:
        a = self._assignment(assignment_id)
        self.actor.require_staff()
        events = self.db.query(WorkoutAssignmentEvent).filter(
            WorkoutAssignmentEvent.assignment_id == a.id).order_by(WorkoutAssignmentEvent.created_at.desc()).all()
        names = _user_names(self.db, [e.actor_user_id for e in events])
        return [{"id": e.id, "event_type": e.event_type, "actor_user_id": e.actor_user_id,
                 "actor_name": names.get(e.actor_user_id), "details": _loads(e.details, default={}),
                 "created_at": e.created_at} for e in events]

    # ================================================================ schedule

    def _occurrences(self, a: WorkoutAssignment, days, date_from: date, date_to: date) -> list:
        """(date, day) pairs for the assignment within [date_from, date_to]."""
        if not days:
            return []
        end = a.end_date or date_to
        if a.status != "active" and a.status_changed_on:
            end = min(end, a.status_changed_on - timedelta(days=1))
        end = min(end, date_to)
        if end < a.start_date or end < date_from:
            return []
        weekdays = set(_loads(a.schedule_weekdays))
        out = []
        if not weekdays:
            start = max(date_from, a.start_date)
            n = len(days)
            d = start
            while d <= end:
                out.append((d, days[(d - a.start_date).days % n]))
                d += timedelta(days=1)
            return out
        training = [dd for dd in days if not dd[0].is_rest_day]
        if not training:
            return []
        k = 0
        d = a.start_date
        while d <= end:
            if d.weekday() in weekdays:
                if d >= date_from:
                    out.append((d, training[k % len(training)]))
                k += 1
            d += timedelta(days=1)
        return out

    def _sessions_by_key(self, assignment_ids: list, date_from: date, date_to: date) -> dict:
        if not assignment_ids:
            return {}
        rows = self.db.query(WorkoutSession).filter(
            WorkoutSession.workspace_id == self.ws, WorkoutSession.assignment_id.in_(assignment_ids),
            WorkoutSession.scheduled_date >= date_from, WorkoutSession.scheduled_date <= date_to,
        ).all()
        return {(s.assignment_id, s.scheduled_date): s for s in rows}

    def _schedule_rows(self, assignments, date_from: date, date_to: date) -> list:
        today = self.today()
        sessions = self._sessions_by_key([a.id for a in assignments], date_from, date_to)
        rows = []
        for a in assignments:
            days = self._days_for(assignment_id=a.id)
            seen = set()
            for d, (day, items) in self._occurrences(a, days, date_from, date_to):
                s = sessions.get((a.id, d))
                seen.add(d)
                if s:
                    st = s.status
                elif day.is_rest_day:
                    st = "rest"
                elif d == today:
                    st = "today"
                elif d < today:
                    st = "missed"
                else:
                    st = "upcoming"
                rows.append({"date": d, "assignment_id": a.id, "assignment_title": a.title, "member_id": a.member_id,
                             "day_id": day.id, "day_name": day.name, "is_rest_day": day.is_rest_day,
                             "exercise_count": len(items), "status": st, "session_id": s.id if s else None})
            # Sessions logged on dates no longer in the schedule (after a reschedule) stay visible.
            for (aid, d), s in sessions.items():
                if aid == a.id and d not in seen:
                    rows.append({"date": d, "assignment_id": a.id, "assignment_title": a.title, "member_id": a.member_id,
                                 "day_id": s.day_id, "day_name": s.day_name, "is_rest_day": False, "exercise_count": 0,
                                 "status": s.status, "session_id": s.id})
        rows.sort(key=lambda r: (r["date"], r["assignment_title"]))
        return rows

    def schedule(self, member_id: Optional[str], date_from: Optional[date], date_to: Optional[date]) -> list:
        if self.actor.kind == "member":
            member_id = member_id or self.actor.member.id
        if not member_id:
            raise HTTPException(status_code=422, detail="member_id is required.")
        self.actor.member_for(member_id)
        today = self.today()
        date_from = date_from or (today - timedelta(days=today.weekday()))
        date_to = date_to or (date_from + timedelta(days=6))
        if date_to < date_from:
            raise HTTPException(status_code=422, detail="date_to must be on or after date_from.")
        if (date_to - date_from).days > 120:
            raise HTTPException(status_code=422, detail="Schedule range is limited to 120 days.")
        assignments = self.db.query(WorkoutAssignment).filter(
            WorkoutAssignment.workspace_id == self.ws, WorkoutAssignment.member_id == member_id).all()
        return self._schedule_rows(assignments, date_from, date_to)

    def assignment_stats(self, a: WorkoutAssignment) -> dict:
        today = self.today()
        days = self._days_for(assignment_id=a.id)
        occ = [(d, day) for d, (day, _) in self._occurrences(a, days, a.start_date, today) if not day.is_rest_day]
        done = {s.scheduled_date for s in self.db.query(WorkoutSession).filter(
            WorkoutSession.assignment_id == a.id, WorkoutSession.status == "completed").all()}
        due = [d for d, _ in occ if d < today or d in done]
        completed = sum(1 for d in due if d in done)
        missed = sum(1 for d in due if d not in done)
        nxt = None
        if a.status == "active":
            upcoming = [d for d, (day, _) in self._occurrences(a, days, today, today + timedelta(days=21))
                        if not day.is_rest_day and d not in done]
            nxt = upcoming[0] if upcoming else None
        return {"scheduled_to_date": len(due), "completed": completed, "missed": missed,
                "adherence_pct": round(100 * completed / len(due), 1) if due else None, "next_date": nxt}

    # ================================================================ sessions

    def _session(self, session_id: str) -> WorkoutSession:
        s = self.db.query(WorkoutSession).filter(WorkoutSession.workspace_id == self.ws, WorkoutSession.id == session_id).first()
        if not s:
            raise HTTPException(status_code=404, detail="Workout session not found.")
        try:
            self.actor.member_for(s.member_id)
        except HTTPException as exc:
            if self.actor.kind == "member":
                raise HTTPException(status_code=404, detail="Workout session not found.")
            raise exc
        return s

    def _session_metrics(self, s: WorkoutSession, sets=None) -> tuple:
        sets = sets if sets is not None else self.db.query(WorkoutSetLog).filter(WorkoutSetLog.session_id == s.id).all()
        done = [x for x in sets if x.completed]
        volume = sum((x.weight_kg or 0) * (x.reps or 0) for x in done)
        return len(done), round(volume, 1)

    def _active_seconds(self, s: WorkoutSession) -> int:
        if s.duration_seconds is not None:
            return s.duration_seconds
        end = s.paused_at if s.status == "paused" and s.paused_at else utcnow()
        return max(0, int((end - s.started_at).total_seconds()) - (s.paused_seconds or 0))

    def session_out(self, s: WorkoutSession, sets=None, member=None, assignment=None) -> dict:
        completed_sets, volume = self._session_metrics(s, sets)
        member = member or self.db.query(Member).filter(Member.id == s.member_id).first()
        assignment = assignment or self.db.query(WorkoutAssignment).filter(WorkoutAssignment.id == s.assignment_id).first()
        return {
            "id": s.id, "member_id": s.member_id, "member_name": _member_name(member), "assignment_id": s.assignment_id,
            "assignment_title": assignment.title if assignment else None, "day_id": s.day_id, "day_name": s.day_name,
            "scheduled_date": s.scheduled_date, "status": s.status, "started_at": s.started_at, "paused_at": s.paused_at,
            "paused_seconds": s.paused_seconds or 0, "completed_at": s.completed_at, "duration_seconds": s.duration_seconds,
            "active_seconds": self._active_seconds(s), "member_notes": s.member_notes,
            "trainer_feedback": s.trainer_feedback, "completed_sets": completed_sets, "total_volume_kg": volume,
        }

    def session_detail(self, session_id: str) -> dict:
        s = self._session(session_id)
        sets = self.db.query(WorkoutSetLog).filter(WorkoutSetLog.session_id == s.id).order_by(WorkoutSetLog.created_at).all()
        out = self.session_out(s, sets)
        items = []
        if s.day_id:
            day_items = self.db.query(WorkoutItem).filter(WorkoutItem.day_id == s.day_id).order_by(WorkoutItem.position).all()
            exmap = self._exercise_map({i.exercise_id for i in day_items})
            items = [self.item_out(i, exmap) for i in day_items]
        out["items"] = items
        out["sets"] = [SetLike.dump(x) for x in sets]
        return out

    def start_session(self, data) -> dict:
        a = self._assignment(data.assignment_id)
        if a.status != "active":
            raise HTTPException(status_code=409, detail=f"This plan is {a.status}; sessions can't be started.")
        today = self.today()
        if data.scheduled_date > today:
            raise HTTPException(status_code=422, detail="You can't start a workout scheduled for a future date.")
        existing = self.db.query(WorkoutSession).filter(
            WorkoutSession.assignment_id == a.id, WorkoutSession.scheduled_date == data.scheduled_date).first()
        if existing:
            if existing.status == "abandoned":
                existing.status = "in_progress"
                existing.paused_at = None
                self._event(a, "session_reopened", {"session_id": existing.id, "date": data.scheduled_date})
                self.db.commit()
            return self.session_detail(existing.id)
        days = self._days_for(assignment_id=a.id)
        match = [day for d, (day, _) in self._occurrences(a, days, data.scheduled_date, data.scheduled_date)]
        if not match:
            raise HTTPException(status_code=422, detail="No workout is scheduled on that date for this plan.")
        if match[0].is_rest_day:
            raise HTTPException(status_code=422, detail="That date is a rest day.")
        s = WorkoutSession(workspace_id=self.ws, member_id=a.member_id, assignment_id=a.id, day_id=match[0].id,
                           day_name=match[0].name, scheduled_date=data.scheduled_date, status="in_progress",
                           started_at=utcnow(), paused_seconds=0, performed_by_user_id=self.tenant.user_id)
        self.db.add(s)
        try:
            self.db.commit()
        except IntegrityError:
            # A concurrent/repeated start won the race; return that session instead of a duplicate.
            self.db.rollback()
            s = self.db.query(WorkoutSession).filter(
                WorkoutSession.assignment_id == a.id, WorkoutSession.scheduled_date == data.scheduled_date).first()
        return self.session_detail(s.id)

    def save_sets(self, session_id: str, data) -> dict:
        s = self._session(session_id)
        if s.status not in OPEN_SESSION_STATUSES:
            raise HTTPException(status_code=409, detail=f"This session is {s.status}; logged sets can no longer change.")
        items = {i.id: i for i in self.db.query(WorkoutItem).filter(WorkoutItem.day_id == s.day_id).all()} if s.day_id else {}
        exmap = self._exercise_map({i.exercise_id for i in items.values()})
        existing = {(x.item_id, x.set_number): x for x in self.db.query(WorkoutSetLog).filter(WorkoutSetLog.session_id == s.id).all()}
        for entry in data.sets:
            item = items.get(entry.item_id)
            if not item:
                raise HTTPException(status_code=422, detail="A logged set refers to an exercise that isn't part of this workout.")
            values = entry.model_dump(exclude={"item_id", "set_number"})
            row = existing.get((item.id, entry.set_number))
            if row:
                for k, v in values.items():
                    setattr(row, k, v)
            else:
                ex = exmap.get(item.exercise_id)
                row = WorkoutSetLog(workspace_id=self.ws, session_id=s.id, member_id=s.member_id, item_id=item.id,
                                    exercise_id=item.exercise_id, exercise_name=ex.name if ex else "Exercise",
                                    set_number=entry.set_number, target_reps_min=item.reps_min,
                                    target_reps_max=item.reps_max, target_weight_kg=item.target_weight_kg, **values)
                self.db.add(row)
                existing[(item.id, entry.set_number)] = row
        if data.member_notes is not None:
            s.member_notes = data.member_notes
        s.updated_at = utcnow()
        try:
            self.db.commit()
        except IntegrityError:
            self.db.rollback()
            raise HTTPException(status_code=409, detail="These sets were saved by another request. Reload and try again.")
        return self.session_detail(s.id)

    def transition_session(self, session_id: str, action: str) -> dict:
        s = self._session(session_id)
        now = utcnow()
        if action == "pause":
            if s.status == "paused":
                return self.session_detail(s.id)
            if s.status != "in_progress":
                raise HTTPException(status_code=409, detail=f"A {s.status} session can't be paused.")
            s.status, s.paused_at = "paused", now
        elif action == "resume":
            if s.status == "in_progress":
                return self.session_detail(s.id)
            if s.status != "paused":
                raise HTTPException(status_code=409, detail=f"A {s.status} session can't be resumed.")
            s.paused_seconds = (s.paused_seconds or 0) + max(0, int((now - s.paused_at).total_seconds()))
            s.status, s.paused_at = "in_progress", None
        elif action == "complete":
            if s.status == "completed":
                return self.session_detail(s.id)  # repeated submit: no second completion
            if s.status not in OPEN_SESSION_STATUSES:
                raise HTTPException(status_code=409, detail=f"A {s.status} session can't be completed.")
            completed_sets, _ = self._session_metrics(s)
            if completed_sets == 0:
                raise HTTPException(status_code=422, detail="Log at least one completed set before finishing the workout.")
            if s.status == "paused" and s.paused_at:
                s.paused_seconds = (s.paused_seconds or 0) + max(0, int((now - s.paused_at).total_seconds()))
            s.status, s.paused_at, s.completed_at = "completed", None, now
            s.duration_seconds = max(0, int((now - s.started_at).total_seconds()) - (s.paused_seconds or 0))
        elif action == "abandon":
            if s.status == "abandoned":
                return self.session_detail(s.id)
            if s.status not in OPEN_SESSION_STATUSES:
                raise HTTPException(status_code=409, detail=f"A {s.status} session can't be abandoned.")
            s.status, s.paused_at = "abandoned", None
        else:
            raise HTTPException(status_code=400, detail="Unknown action.")
        s.updated_at = now
        self.db.commit()
        return self.session_detail(s.id)

    def session_feedback(self, session_id: str, text: str) -> dict:
        s = self._session(session_id)
        self.actor.require_staff()
        s.trainer_feedback = text.strip()
        s.feedback_by_user_id = self.tenant.user_id
        member = self.db.query(Member).filter(Member.id == s.member_id).first()
        self._notify_member(member, "Trainer feedback", f"Your trainer left feedback on '{s.day_name}' ({s.scheduled_date:%d %b}).")
        self.db.commit()
        return self.session_detail(s.id)

    def list_sessions(self, *, member_id=None, date_from=None, date_to=None, status_filter=None, page=1, page_size=20) -> dict:
        q = self.db.query(WorkoutSession).filter(WorkoutSession.workspace_id == self.ws)
        if self.actor.kind == "member":
            member_id = member_id or self.actor.member.id
        if member_id:
            self.actor.member_for(member_id)
            q = q.filter(WorkoutSession.member_id == member_id)
        else:
            allowed = self.actor.client_ids()
            if allowed is not None:
                q = q.filter(WorkoutSession.member_id.in_(allowed or {"__none__"}))
        if date_from:
            q = q.filter(WorkoutSession.scheduled_date >= date_from)
        if date_to:
            q = q.filter(WorkoutSession.scheduled_date <= date_to)
        if status_filter:
            q = q.filter(WorkoutSession.status == status_filter)
        total = q.count()
        rows = q.order_by(WorkoutSession.scheduled_date.desc(), WorkoutSession.started_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
        ids = [s.id for s in rows]
        sets_by = defaultdict(list)
        if ids:
            for x in self.db.query(WorkoutSetLog).filter(WorkoutSetLog.session_id.in_(ids)).all():
                sets_by[x.session_id].append(x)
        members = {m.id: m for m in self.db.query(Member).filter(Member.id.in_({s.member_id for s in rows} or {"__none__"})).all()}
        assignments = {a.id: a for a in self.db.query(WorkoutAssignment).filter(WorkoutAssignment.id.in_({s.assignment_id for s in rows} or {"__none__"})).all()}
        return {"items": [self.session_out(s, sets_by[s.id], members.get(s.member_id), assignments.get(s.assignment_id)) for s in rows],
                "total": total, "page": page, "page_size": page_size}

    # ================================================================ measurements

    def measurement_types(self) -> list:
        out = [{"key": k, "label": v[0], "unit": v[1], "min_value": v[2], "max_value": v[3], "built_in": True}
               for k, v in BUILT_IN_METRICS.items()]
        for t in self.db.query(MeasurementType).filter(MeasurementType.workspace_id == self.ws, MeasurementType.is_active.is_(True)).order_by(MeasurementType.label).all():
            out.append({"key": t.key, "label": t.label, "unit": t.unit, "min_value": t.min_value, "max_value": t.max_value, "built_in": False})
        return out

    def create_measurement_type(self, data) -> dict:
        if self.actor.kind != "gym" or self.tenant.role == "MANAGER":
            raise HTTPException(status_code=403, detail="Only gym owners and admins can add measurement types.")
        if data.key in BUILT_IN_METRICS:
            raise HTTPException(status_code=409, detail="That measurement type already exists.")
        if data.min_value is not None and data.max_value is not None and data.min_value >= data.max_value:
            raise HTTPException(status_code=422, detail="Minimum must be less than maximum.")
        t = MeasurementType(workspace_id=self.ws, key=data.key, label=data.label.strip(), unit=data.unit.strip(),
                            min_value=data.min_value, max_value=data.max_value, is_active=True)
        self.db.add(t)
        self._commit_unique("That measurement type already exists.")
        return {"key": t.key, "label": t.label, "unit": t.unit, "min_value": t.min_value, "max_value": t.max_value, "built_in": False}

    def _measurement_out(self, m: BodyMeasurement, names: dict) -> dict:
        return {"id": m.id, "member_id": m.member_id, "measured_on": m.measured_on, "metric": m.metric, "value": m.value,
                "unit": m.unit, "notes": m.notes, "recorded_by_user_id": m.recorded_by_user_id,
                "recorded_by_name": names.get(m.recorded_by_user_id), "recorded_by_role": m.recorded_by_role,
                "created_at": m.created_at}

    def record_measurements(self, member_id: str, data) -> list:
        member = self.actor.member_for(member_id)
        if data.measured_on > self.today():
            raise HTTPException(status_code=422, detail="Measurement date can't be in the future.")
        types = {t["key"]: t for t in self.measurement_types()}
        seen = set()
        rows = []
        for v in data.values:
            t = types.get(v.metric)
            if not t:
                raise HTTPException(status_code=422, detail=f"Unknown measurement type '{v.metric}'.")
            if v.metric in seen:
                raise HTTPException(status_code=422, detail=f"'{t['label']}' was entered twice.")
            seen.add(v.metric)
            if (t["min_value"] is not None and v.value < t["min_value"]) or (t["max_value"] is not None and v.value > t["max_value"]):
                raise HTTPException(status_code=422, detail=f"{t['label']} must be between {t['min_value']:g} and {t['max_value']:g} {t['unit']}.")
            # Same metric on the same date is a correction: void the earlier entry, keep it for history.
            self.db.query(BodyMeasurement).filter(
                BodyMeasurement.workspace_id == self.ws, BodyMeasurement.member_id == member.id,
                BodyMeasurement.metric == v.metric, BodyMeasurement.measured_on == data.measured_on,
                BodyMeasurement.voided_at.is_(None),
            ).update({BodyMeasurement.voided_at: utcnow(), BodyMeasurement.voided_by_user_id: self.tenant.user_id})
            row = BodyMeasurement(workspace_id=self.ws, member_id=member.id, measured_on=data.measured_on, metric=v.metric,
                                  value=round(v.value, 2), unit=t["unit"], notes=data.notes,
                                  recorded_by_user_id=self.tenant.user_id, recorded_by_role=self.actor.kind)
            self.db.add(row)
            rows.append(row)
        self.db.commit()
        names = _user_names(self.db, [self.tenant.user_id])
        return [self._measurement_out(r, names) for r in rows]

    def list_measurements(self, member_id: str, *, metric=None, date_from=None, date_to=None) -> list:
        self.actor.member_for(member_id)
        q = self.db.query(BodyMeasurement).filter(
            BodyMeasurement.workspace_id == self.ws, BodyMeasurement.member_id == member_id, BodyMeasurement.voided_at.is_(None))
        if metric:
            q = q.filter(BodyMeasurement.metric == metric)
        if date_from:
            q = q.filter(BodyMeasurement.measured_on >= date_from)
        if date_to:
            q = q.filter(BodyMeasurement.measured_on <= date_to)
        rows = q.order_by(BodyMeasurement.measured_on.desc(), BodyMeasurement.created_at.desc()).limit(500).all()
        names = _user_names(self.db, [r.recorded_by_user_id for r in rows])
        return [self._measurement_out(r, names) for r in rows]

    def void_measurement(self, member_id: str, measurement_id: str) -> None:
        self.actor.member_for(member_id)
        m = self.db.query(BodyMeasurement).filter(
            BodyMeasurement.workspace_id == self.ws, BodyMeasurement.member_id == member_id,
            BodyMeasurement.id == measurement_id, BodyMeasurement.voided_at.is_(None)).first()
        if not m:
            raise HTTPException(status_code=404, detail="Measurement not found.")
        if self.actor.kind != "gym" and m.recorded_by_user_id != self.tenant.user_id:
            raise HTTPException(status_code=403, detail="You can only remove measurements you recorded.")
        m.voided_at, m.voided_by_user_id = utcnow(), self.tenant.user_id
        self.db.commit()

    # ================================================================ assessments

    def record_assessment(self, member_id: str, data) -> dict:
        member = self.actor.member_for(member_id)
        self.actor.require_staff()
        if data.assessed_on > self.today():
            raise HTTPException(status_code=422, detail="Assessment date can't be in the future.")
        a = FitnessAssessment(workspace_id=self.ws, member_id=member.id,
                              trainer_id=self.actor.trainer.id if self.actor.trainer else None,
                              assessed_by_user_id=self.tenant.user_id, **data.model_dump())
        self.db.add(a)
        self.db.commit()
        self.db.refresh(a)
        return self._assessment_out(a, _user_names(self.db, [a.assessed_by_user_id]))

    def _assessment_out(self, a: FitnessAssessment, names: dict) -> dict:
        out = {"id": a.id, "member_id": a.member_id, "assessed_on": a.assessed_on, "goals": a.goals,
               "fitness_level": a.fitness_level, "limitations": a.limitations, "resting_heart_rate": a.resting_heart_rate,
               "summary": a.summary, "assessed_by_name": names.get(a.assessed_by_user_id), "created_at": a.created_at}
        if self.actor.is_staff:
            out["private_notes"] = a.private_notes
        return out

    def list_assessments(self, member_id: str) -> list:
        self.actor.member_for(member_id)
        rows = self.db.query(FitnessAssessment).filter(
            FitnessAssessment.workspace_id == self.ws, FitnessAssessment.member_id == member_id,
        ).order_by(FitnessAssessment.assessed_on.desc(), FitnessAssessment.created_at.desc()).all()
        names = _user_names(self.db, [r.assessed_by_user_id for r in rows])
        return [self._assessment_out(r, names) for r in rows]

    # ================================================================ progress & analytics

    def progress(self, member_id: str, date_from: Optional[date], date_to: Optional[date], exercise_id: Optional[str] = None) -> dict:
        member = self.actor.member_for(member_id)
        today = self.today()
        date_to = date_to or today
        date_from = date_from or (date_to - timedelta(days=89))
        if date_to < date_from:
            raise HTTPException(status_code=422, detail="date_to must be on or after date_from.")
        if (date_to - date_from).days > 730:
            raise HTTPException(status_code=422, detail="Progress range is limited to two years.")

        types = {t["key"]: t for t in self.measurement_types()}
        series = {}
        for m in self.db.query(BodyMeasurement).filter(
            BodyMeasurement.workspace_id == self.ws, BodyMeasurement.member_id == member.id,
            BodyMeasurement.voided_at.is_(None), BodyMeasurement.measured_on >= date_from, BodyMeasurement.measured_on <= date_to,
        ).order_by(BodyMeasurement.measured_on).all():
            t = types.get(m.metric, {"label": m.metric, "unit": m.unit})
            series.setdefault(m.metric, {"label": t["label"], "unit": m.unit, "points": []})["points"].append({"date": m.measured_on, "value": m.value})
        summary = []
        for key, s in series.items():
            pts = s["points"]
            summary.append({"metric": key, "label": s["label"], "unit": s["unit"], "first": pts[0]["value"], "last": pts[-1]["value"],
                            "change": round(pts[-1]["value"] - pts[0]["value"], 2), "first_date": pts[0]["date"],
                            "last_date": pts[-1]["date"], "entries": len(pts)})

        # Adherence over the range, capped at today: future sessions can't be missed yet.
        assignments = self.db.query(WorkoutAssignment).filter(
            WorkoutAssignment.workspace_id == self.ws, WorkoutAssignment.member_id == member.id).all()
        horizon = min(date_to, today)
        sched = [r for r in self._schedule_rows(assignments, date_from, horizon) if not r["is_rest_day"]] if horizon >= date_from else []
        due = [r for r in sched if r["date"] < today or r["status"] == "completed"]
        completed = sum(1 for r in due if r["status"] == "completed")
        weekly = defaultdict(lambda: {"scheduled": 0, "completed": 0})
        for r in due:
            wk = r["date"] - timedelta(days=r["date"].weekday())
            weekly[wk]["scheduled"] += 1
            weekly[wk]["completed"] += 1 if r["status"] == "completed" else 0
        week = date_from - timedelta(days=date_from.weekday())
        weekly_rows = []
        while week <= horizon:
            weekly_rows.append({"week_start": week, **weekly.get(week, {"scheduled": 0, "completed": 0})})
            week += timedelta(days=7)

        completed_sessions = self.db.query(WorkoutSession).filter(
            WorkoutSession.workspace_id == self.ws, WorkoutSession.member_id == member.id, WorkoutSession.status == "completed").all()
        session_date = {s.id: s.scheduled_date for s in completed_sessions}
        logs = self.db.query(WorkoutSetLog).filter(
            WorkoutSetLog.workspace_id == self.ws, WorkoutSetLog.member_id == member.id, WorkoutSetLog.completed.is_(True),
            WorkoutSetLog.session_id.in_(list(session_date) or ["__none__"])).all()

        per_ex_day = defaultdict(lambda: defaultdict(list))
        names = {}
        for x in logs:
            names[x.exercise_id] = x.exercise_name
            d = session_date[x.session_id]
            if date_from <= d <= date_to and x.weight_kg and x.reps:
                per_ex_day[x.exercise_id][d].append(x)
        strength = []
        ranked = sorted(per_ex_day, key=lambda e: -len(per_ex_day[e]))
        if exercise_id:
            ranked = [e for e in ranked if e == exercise_id]
        for ex_id in ranked[:12]:
            points = []
            for d in sorted(per_ex_day[ex_id]):
                sets = per_ex_day[ex_id][d]
                top = max(sets, key=lambda x: (x.weight_kg, x.reps))
                e1rm = max(x.weight_kg * (1 + x.reps / 30) for x in sets if x.reps <= 12) if any(x.reps <= 12 for x in sets) else None
                points.append({"date": d, "top_weight_kg": top.weight_kg, "top_set_reps": top.reps,
                               "estimated_1rm_kg": round(e1rm, 1) if e1rm else None,
                               "volume_kg": round(sum(x.weight_kg * x.reps for x in sets), 1)})
            strength.append({"exercise_id": ex_id, "exercise_name": names[ex_id], "points": points})

        records = {}

        def consider(key, value, unit, x, reps=None):
            if value and (key not in records or value > records[key]["value"]):
                records[key] = {"exercise_id": x.exercise_id, "exercise_name": x.exercise_name, "kind": key[1],
                                "value": round(value, 1), "unit": unit, "reps": reps,
                                "achieved_on": session_date[x.session_id], "session_id": x.session_id}

        for x in logs:
            if x.weight_kg and x.reps:
                consider((x.exercise_id, "heaviest_weight"), x.weight_kg, "kg", x, x.reps)
                if x.reps <= 12:
                    consider((x.exercise_id, "estimated_1rm"), x.weight_kg * (1 + x.reps / 30), "kg", x, x.reps)
            elif x.reps:
                consider((x.exercise_id, "most_reps"), x.reps, "reps", x, x.reps)
            if x.duration_seconds:
                consider((x.exercise_id, "longest_duration"), x.duration_seconds, "s", x)
            if x.distance_m:
                consider((x.exercise_id, "longest_distance"), x.distance_m, "m", x)

        recent = self.list_sessions(member_id=member.id, date_from=date_from, date_to=date_to, page=1, page_size=10)["items"]
        return {
            "member_id": member.id, "member_name": _member_name(member), "date_from": date_from, "date_to": date_to,
            "measurements": series, "measurement_summary": summary,
            "adherence": {"scheduled": len(due), "completed": completed, "missed": len(due) - completed,
                          "rate_pct": round(100 * completed / len(due), 1) if due else None},
            "weekly": weekly_rows, "strength": strength,
            "personal_records": sorted(records.values(), key=lambda r: (r["exercise_name"], r["kind"])),
            "recent_sessions": recent,
        }

    def overview(self) -> dict:
        self.actor.require_staff()
        allowed = self.actor.client_ids()
        q = self.db.query(WorkoutAssignment).filter(WorkoutAssignment.workspace_id == self.ws,
                                                    WorkoutAssignment.status.in_(("active", "paused")))
        if allowed is not None:
            q = q.filter(WorkoutAssignment.member_id.in_(allowed or {"__none__"}))
        assignments = q.all()
        today = self.today()
        start = today - timedelta(days=30)
        by_member = defaultdict(list)
        for a in assignments:
            by_member[a.member_id].append(a)
        members = {m.id: m for m in self.db.query(Member).filter(Member.id.in_(list(by_member) or ["__none__"])).all()}
        trainers = {t.id: t.name for t in self.db.query(Trainer).filter(Trainer.workspace_id == self.ws).all()}
        rows, total_done, total_missed = [], 0, 0
        for mid, alist in by_member.items():
            sched = [r for r in self._schedule_rows(alist, start, today) if not r["is_rest_day"]]
            due = [r for r in sched if r["date"] < today or r["status"] == "completed"]
            done = sum(1 for r in due if r["status"] == "completed")
            missed = len(due) - done
            total_done += done
            total_missed += missed
            last = self.db.query(func.max(WorkoutSession.scheduled_date)).filter(
                WorkoutSession.member_id == mid, WorkoutSession.status == "completed").scalar()
            trainer_name = next((trainers.get(a.trainer_id) for a in alist if a.trainer_id), None)
            rows.append({"member_id": mid, "member_name": _member_name(members.get(mid)), "trainer_name": trainer_name,
                         "active_assignments": sum(1 for a in alist if a.status == "active"), "completed_30d": done,
                         "missed_30d": missed, "adherence_pct": round(100 * done / len(due), 1) if due else None,
                         "last_session_date": last})
        rows.sort(key=lambda r: (r["adherence_pct"] if r["adherence_pct"] is not None else 101, r["member_name"]))
        due_total = total_done + total_missed
        return {"scope": "gym" if allowed is None else "trainer",
                "active_assignments": sum(1 for a in assignments if a.status == "active"),
                "members_with_plans": len(by_member), "sessions_completed_30d": total_done,
                "sessions_missed_30d": total_missed,
                "adherence_pct": round(100 * total_done / due_total, 1) if due_total else None,
                "members": rows[:200]}


class SetLike:
    @staticmethod
    def dump(x: WorkoutSetLog) -> dict:
        return {k: getattr(x, k) for k in (
            "id", "item_id", "exercise_id", "exercise_name", "set_number", "reps", "weight_kg", "duration_seconds",
            "distance_m", "rest_seconds", "rpe", "completed", "target_reps_min", "target_reps_max", "target_weight_kg")}
