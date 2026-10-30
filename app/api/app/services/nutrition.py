"""
Diet plans, meal/water logging, adherence and trainer-member chat.

Authorization reuses FitnessActor: gym-wide roles see every member, trainers only their ACTIVE
assigned clients (re-checked on every request, so unassigning or revoking a permission takes
effect immediately), members only themselves.
"""
import json
from datetime import date, datetime, timedelta, timezone
from typing import Optional

from fastapi import HTTPException
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.audit import record_audit
from app.middleware.tenant import TenantContext
from app.models.member import Member
from app.models.nutrition import (
    ChatMessage, ChatReport, ChatReportEvent, Conversation, DietAssignment, DietPlan, DietPlanVersion, DietPreference,
    MealLog, WaterLog,
)
from app.models.trainer import Trainer, TrainerClient, TrainerClientStatus
from app.services.fitness import FitnessActor
from app.services.membership_lifecycle import workspace_today

MEAL_STATUSES = {"eaten", "modified", "skipped"}


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _meals_totals(meals: list) -> dict:
    totals = {"calories": 0.0, "protein": 0.0, "carbs": 0.0, "fat": 0.0}
    for meal in meals:
        for item in meal.get("items") or []:
            for k in totals:
                totals[k] += float(item.get(k) or 0)
    return {k: round(v, 1) for k, v in totals.items()}


class NutritionService:
    def __init__(self, db: Session, tenant: TenantContext):
        self.db = db
        self.tenant = tenant
        self.actor = FitnessActor(db, tenant)
        self.ws = tenant.workspace_id

    def today(self) -> date:
        return workspace_today(self.db, self.ws)

    # ------------------------------------------------------------------ plans

    def _plan(self, plan_id: str) -> DietPlan:
        p = self.db.query(DietPlan).filter(DietPlan.workspace_id == self.ws, DietPlan.id == plan_id).first()
        if not p:
            raise HTTPException(status_code=404, detail="Diet plan not found.")
        return p

    def _editable_plan(self, plan_id: str) -> DietPlan:
        self.actor.require("nutrition.manage", "You don't have permission to edit diet plans.")
        p = self._plan(plan_id)
        if self.actor.kind == "trainer" and p.created_by_user_id != self.tenant.user_id:
            raise HTTPException(status_code=403, detail="Only the plan's author or a gym manager can edit it.")
        return p

    def _version(self, version_id: Optional[str]) -> Optional[DietPlanVersion]:
        if not version_id:
            return None
        return self.db.query(DietPlanVersion).filter(
            DietPlanVersion.workspace_id == self.ws, DietPlanVersion.id == version_id).first()

    def version_out(self, v: Optional[DietPlanVersion]) -> Optional[dict]:
        if not v:
            return None
        meals = json.loads(v.meals or "[]")
        return {
            "id": v.id, "version_number": v.version_number, "meals": meals, "totals": _meals_totals(meals),
            "calories_target": v.calories_target, "protein_target": v.protein_target,
            "carbs_target": v.carbs_target, "fat_target": v.fat_target, "water_ml_target": v.water_ml_target,
            "notes": v.notes, "change_summary": v.change_summary, "created_at": v.created_at,
        }

    def plan_out(self, p: DietPlan, *, with_version: bool = True) -> dict:
        out = {
            "id": p.id, "name": p.name, "goal": p.goal, "diet_type": p.diet_type, "status": p.status,
            "created_by_user_id": p.created_by_user_id, "current_version_id": p.current_version_id,
            "can_edit": self.actor.can("nutrition.manage") and (
                self.actor.kind == "gym" or p.created_by_user_id == self.tenant.user_id),
            "updated_at": p.updated_at,
        }
        if with_version:
            out["current_version"] = self.version_out(self._version(p.current_version_id))
        return out

    def list_plans(self, search: Optional[str] = None, include_archived: bool = False) -> list:
        self.actor.require_staff()
        # Members' personal plans are theirs, not part of the gym's reusable library.
        q = self.db.query(DietPlan).filter(DietPlan.workspace_id == self.ws, DietPlan.owner_member_id.is_(None))
        if not include_archived:
            q = q.filter(DietPlan.status == "active")
        if search:
            q = q.filter(DietPlan.name.ilike(f"%{search.strip()}%"))
        return [self.plan_out(p, with_version=False) for p in q.order_by(DietPlan.updated_at.desc()).limit(200)]

    def get_plan(self, plan_id: str) -> dict:
        self.actor.require_staff()
        p = self._plan(plan_id)
        out = self.plan_out(p)
        versions = self.db.query(DietPlanVersion).filter(
            DietPlanVersion.workspace_id == self.ws, DietPlanVersion.plan_id == p.id,
        ).order_by(DietPlanVersion.version_number.desc()).all()
        out["versions"] = [{"id": v.id, "version_number": v.version_number, "change_summary": v.change_summary,
                            "created_at": v.created_at} for v in versions]
        return out

    def _add_version(self, p: DietPlan, data) -> DietPlanVersion:
        number = (self.db.query(func.max(DietPlanVersion.version_number))
                  .filter(DietPlanVersion.plan_id == p.id).scalar() or 0) + 1
        v = DietPlanVersion(
            workspace_id=self.ws, plan_id=p.id, version_number=number,
            meals=json.dumps([m.model_dump() for m in data.meals]),
            calories_target=data.calories_target, protein_target=data.protein_target,
            carbs_target=data.carbs_target, fat_target=data.fat_target, water_ml_target=data.water_ml_target,
            notes=data.notes, change_summary=data.change_summary, created_by_user_id=self.tenant.user_id,
        )
        self.db.add(v)
        self.db.flush()
        p.current_version_id = v.id
        return v

    def create_plan(self, data) -> dict:
        self.actor.require("nutrition.manage", "You don't have permission to create diet plans.")
        p = DietPlan(workspace_id=self.ws, name=data.name.strip(), goal=data.goal, diet_type=data.diet_type,
                     created_by_user_id=self.tenant.user_id)
        self.db.add(p)
        self.db.flush()
        self._add_version(p, data)
        record_audit(self.db, self.ws, self.tenant.user_id, "diet_plan.created", resource_type="diet_plan", resource_id=p.id)
        self.db.commit()
        return self.get_plan(p.id)

    def revise_plan(self, plan_id: str, data) -> dict:
        """Appends a new version; existing versions and the assignments pinned to them stay as they were."""
        p = self._editable_plan(plan_id)
        if p.status != "active":
            raise HTTPException(status_code=409, detail="Restore the plan before revising it.")
        p.name, p.goal, p.diet_type = data.name.strip(), data.goal, data.diet_type
        v = self._add_version(p, data)
        record_audit(self.db, self.ws, self.tenant.user_id, "diet_plan.revised", resource_type="diet_plan",
                     resource_id=p.id, details={"version": v.version_number})
        self.db.commit()
        return self.get_plan(p.id)

    def set_plan_status(self, plan_id: str, status: str) -> dict:
        if status not in ("active", "archived"):
            raise HTTPException(status_code=422, detail="Status must be active or archived.")
        p = self._editable_plan(plan_id)
        p.status = status
        record_audit(self.db, self.ws, self.tenant.user_id, f"diet_plan.{status}", resource_type="diet_plan", resource_id=p.id)
        self.db.commit()
        return self.get_plan(p.id)

    # ------------------------------------------------------------ assignments

    def assignment_out(self, a: DietAssignment) -> dict:
        return {
            "id": a.id, "member_id": a.member_id, "plan_id": a.plan_id, "version_id": a.version_id,
            "title": a.title, "trainer_id": a.trainer_id, "start_date": a.start_date, "end_date": a.end_date,
            "status": a.status, "ended_on": a.ended_on, "notes": a.notes, "created_at": a.created_at,
            "version": self.version_out(self._version(a.version_id)),
        }

    def assign(self, member_id: str, data) -> dict:
        self.actor.require("nutrition.assign", "You don't have permission to assign diet plans.")
        member = self.actor.member_for(member_id)
        p = self._plan(data.plan_id)
        if p.owner_member_id and p.owner_member_id != member.id:
            raise HTTPException(status_code=409, detail="That is another member's personal plan.")
        if p.status != "active" or not p.current_version_id:
            raise HTTPException(status_code=409, detail="Only active diet plans can be assigned.")
        start = data.start_date or self.today()
        # A member follows one diet plan at a time; the previous one is ended, not overwritten.
        for prev in self.db.query(DietAssignment).filter(
            DietAssignment.workspace_id == self.ws, DietAssignment.member_id == member.id,
            DietAssignment.status == "active",
        ).with_for_update().all():
            prev.status, prev.ended_on = "ended", start
        a = DietAssignment(
            workspace_id=self.ws, member_id=member.id, plan_id=p.id, version_id=p.current_version_id, title=p.name,
            trainer_id=self.actor.trainer.id if self.actor.trainer else None, assigned_by_user_id=self.tenant.user_id,
            start_date=start, end_date=data.end_date, notes=data.notes,
        )
        self.db.add(a)
        self.db.flush()
        record_audit(self.db, self.ws, self.tenant.user_id, "diet_plan.assigned", resource_type="diet_assignment",
                     resource_id=a.id, details={"member_id": member.id, "plan_id": p.id, "version_id": a.version_id})
        self.db.commit()
        return self.assignment_out(a)

    def end_assignment(self, assignment_id: str) -> dict:
        self.actor.require("nutrition.assign", "You don't have permission to change diet assignments.")
        a = self.db.query(DietAssignment).filter(
            DietAssignment.workspace_id == self.ws, DietAssignment.id == assignment_id).first()
        if not a:
            raise HTTPException(status_code=404, detail="Diet assignment not found.")
        self.actor.member_for(a.member_id)
        if a.status == "active":
            a.status, a.ended_on = "ended", self.today()
            record_audit(self.db, self.ws, self.tenant.user_id, "diet_plan.unassigned",
                         resource_type="diet_assignment", resource_id=a.id)
            self.db.commit()
        return self.assignment_out(a)

    def _member_id(self, member_id: Optional[str]) -> str:
        if self.actor.kind == "member":
            return self.actor.member.id
        if not member_id:
            raise HTTPException(status_code=422, detail="member_id is required.")
        self.actor.require("nutrition.assign", "You don't have permission to view member nutrition.")
        return self.actor.member_for(member_id).id

    def member_assignments(self, member_id: Optional[str]) -> list:
        mid = self._member_id(member_id)
        rows = self.db.query(DietAssignment).filter(
            DietAssignment.workspace_id == self.ws, DietAssignment.member_id == mid,
        ).order_by(DietAssignment.start_date.desc(), DietAssignment.created_at.desc()).all()
        return [self.assignment_out(a) for a in rows]

    # ------------------------------------------------------- member self-service

    def _require_member(self):
        if self.actor.kind != "member":
            raise HTTPException(status_code=403, detail="Only members can do this for themselves.")
        return self.actor.member

    @staticmethod
    def preference_out(p: Optional[DietPreference]) -> Optional[dict]:
        if not p:
            return None
        return {"id": p.id, "member_id": p.member_id, "diet_type": p.diet_type, "goal": p.goal,
                "ingredients": json.loads(p.ingredients or "[]"), "notes": p.notes,
                "asked_trainer": bool(p.asked_trainer), "created_at": p.created_at}

    def preferences(self, member_id: Optional[str]) -> Optional[dict]:
        """The member's latest food preferences (members: their own; staff: an accessible member's)."""
        mid = self._member_id(member_id)
        p = self.db.query(DietPreference).filter(
            DietPreference.workspace_id == self.ws, DietPreference.member_id == mid,
        ).order_by(DietPreference.created_at.desc()).first()
        return self.preference_out(p)

    def save_preferences(self, data) -> dict:
        """Appends the member's preferences; with ask_trainer, notifies their active trainers."""
        from app.models.system import Notification
        from app.services.ai_features import INGREDIENTS, _DIET_ALLOWS

        member = self._require_member()
        unknown = [k for k in data.ingredients if k not in INGREDIENTS]
        if unknown:
            raise HTTPException(status_code=422, detail="Unknown ingredient.")
        ingredients = [k for k in dict.fromkeys(data.ingredients) if INGREDIENTS[k][1] in _DIET_ALLOWS[data.diet_type]]
        p = DietPreference(workspace_id=self.ws, member_id=member.id, diet_type=data.diet_type, goal=data.goal,
                           ingredients=json.dumps(ingredients), notes=(data.notes or "").strip() or None,
                           asked_trainer=data.ask_trainer, created_by_user_id=self.tenant.user_id)
        self.db.add(p)
        self.db.flush()
        notified = 0
        if data.ask_trainer:
            rows = self.db.query(Trainer.user_id).join(TrainerClient, TrainerClient.trainer_id == Trainer.id).filter(
                TrainerClient.workspace_id == self.ws, TrainerClient.client_id == member.id,
                TrainerClient.status == TrainerClientStatus.ACTIVE,
            ).all()
            name = f"{member.first_name} {member.last_name or ''}".strip()
            food = data.diet_type.replace("_", "-")
            for (uid,) in rows:
                if uid:
                    self.db.add(Notification(
                        workspace_id=self.ws, user_id=uid, title="Diet plan requested",
                        message=f"{name} asked for a {food} diet plan using the foods they have.",
                        action_url=f"/trainer/clients/{member.id}", is_read=False))
                    notified += 1
        self.db.commit()
        return {**self.preference_out(p), "trainers_notified": notified}

    def choose_own_plan(self, data) -> dict:
        """A member saves a plan for themselves (e.g. a suggested one) and starts following it.
        It's a personal plan (owner_member_id), so it never appears in the gym's plan library."""
        member = self._require_member()
        p = DietPlan(workspace_id=self.ws, name=data.name.strip(), goal=data.goal, diet_type=data.diet_type,
                     created_by_user_id=self.tenant.user_id, owner_member_id=member.id)
        self.db.add(p)
        self.db.flush()
        v = self._add_version(p, data)
        start = self.today()
        for prev in self.db.query(DietAssignment).filter(
            DietAssignment.workspace_id == self.ws, DietAssignment.member_id == member.id,
            DietAssignment.status == "active",
        ).with_for_update().all():
            prev.status, prev.ended_on = "ended", start
        a = DietAssignment(workspace_id=self.ws, member_id=member.id, plan_id=p.id, version_id=v.id, title=p.name,
                           assigned_by_user_id=self.tenant.user_id, start_date=start, notes="Chosen by the member")
        self.db.add(a)
        self.db.flush()
        record_audit(self.db, self.ws, self.tenant.user_id, "diet_plan.self_assigned", resource_type="diet_assignment",
                     resource_id=a.id, details={"plan_id": p.id})
        self.db.commit()
        return self.assignment_out(a)

    def _active_assignment(self, member_id: str) -> Optional[DietAssignment]:
        return self.db.query(DietAssignment).filter(
            DietAssignment.workspace_id == self.ws, DietAssignment.member_id == member_id,
            DietAssignment.status == "active",
        ).first()

    # ---------------------------------------------------------------- logging

    def _log_target(self, member_id: Optional[str]) -> str:
        """Members log for themselves; staff log on behalf only with nutrition.assign and access."""
        return self._member_id(member_id)

    def log_meal(self, data) -> dict:
        mid = self._log_target(data.member_id)
        if data.status not in MEAL_STATUSES:
            raise HTTPException(status_code=422, detail="Status must be eaten, modified or skipped.")
        if data.log_date > self.today():
            raise HTTPException(status_code=422, detail="Meals can't be logged for a future date.")
        if data.client_ref:
            existing = self.db.query(MealLog).filter(
                MealLog.workspace_id == self.ws, MealLog.member_id == mid, MealLog.client_ref == data.client_ref).first()
            if existing:
                return self.meal_out(existing)
        active = self._active_assignment(mid)
        log = MealLog(
            workspace_id=self.ws, member_id=mid, assignment_id=active.id if active else None,
            log_date=data.log_date, slot=data.slot.strip().lower(), status=data.status, description=data.description,
            calories=data.calories, protein=data.protein, carbs=data.carbs, fat=data.fat, notes=data.notes,
            logged_by_user_id=self.tenant.user_id, client_ref=data.client_ref,
        )
        self.db.add(log)
        try:
            self.db.commit()
        except IntegrityError:  # concurrent retry with the same client_ref
            self.db.rollback()
            log = self.db.query(MealLog).filter(
                MealLog.workspace_id == self.ws, MealLog.member_id == mid, MealLog.client_ref == data.client_ref).one()
        return self.meal_out(log)

    @staticmethod
    def meal_out(m: MealLog) -> dict:
        return {"id": m.id, "member_id": m.member_id, "assignment_id": m.assignment_id, "log_date": m.log_date,
                "slot": m.slot, "status": m.status, "description": m.description, "calories": m.calories,
                "protein": m.protein, "carbs": m.carbs, "fat": m.fat, "notes": m.notes, "created_at": m.created_at}

    def log_water(self, data) -> dict:
        mid = self._log_target(data.member_id)
        if data.client_ref and self.db.query(WaterLog.id).filter(
            WaterLog.workspace_id == self.ws, WaterLog.member_id == mid, WaterLog.client_ref == data.client_ref,
        ).first():
            return self.day(mid, data.log_date)
        self.db.add(WaterLog(workspace_id=self.ws, member_id=mid, log_date=data.log_date,
                             amount_ml=data.amount_ml, client_ref=data.client_ref))
        try:
            self.db.commit()
        except IntegrityError:
            self.db.rollback()
        return self.day(mid, data.log_date)

    def day(self, member_id: Optional[str], on: Optional[date] = None) -> dict:
        mid = self._member_id(member_id)
        on = on or self.today()
        meals = self.db.query(MealLog).filter(
            MealLog.workspace_id == self.ws, MealLog.member_id == mid, MealLog.log_date == on,
        ).order_by(MealLog.created_at).all()
        water = self.db.query(func.coalesce(func.sum(WaterLog.amount_ml), 0)).filter(
            WaterLog.workspace_id == self.ws, WaterLog.member_id == mid, WaterLog.log_date == on).scalar()
        active = self._active_assignment(mid)
        eaten = [m for m in meals if m.status != "skipped"]
        totals = {k: round(sum(float(getattr(m, k) or 0) for m in eaten), 1) for k in ("calories", "protein", "carbs", "fat")}
        return {"date": on, "member_id": mid, "meals": [self.meal_out(m) for m in meals], "totals": totals,
                "water_ml": int(water or 0), "assignment": self.assignment_out(active) if active else None}

    def adherence(self, member_id: Optional[str], days: int = 7) -> dict:
        """Planned meal slots vs logged ones over the last `days` days of the active plan."""
        mid = self._member_id(member_id)
        end = self.today()
        start = end - timedelta(days=max(1, min(days, 90)) - 1)
        active = self._active_assignment(mid)
        planned_slots: set = set()
        if active:
            v = self._version(active.version_id)
            planned_slots = {(m.get("slot") or "").lower() for m in json.loads(v.meals or "[]")} if v else set()
            start = max(start, active.start_date)
        logs = self.db.query(MealLog).filter(
            MealLog.workspace_id == self.ws, MealLog.member_id == mid,
            MealLog.log_date >= start, MealLog.log_date <= end,
        ).all() if start <= end else []
        followed = {(m.log_date, m.slot) for m in logs if m.status == "eaten" and m.slot in planned_slots}
        modified = {(m.log_date, m.slot) for m in logs if m.status == "modified" and m.slot in planned_slots} - followed
        skipped = {(m.log_date, m.slot) for m in logs if m.status == "skipped" and m.slot in planned_slots} - followed - modified
        n_days = (end - start).days + 1 if start <= end else 0
        planned = len(planned_slots) * n_days
        return {
            "member_id": mid, "from": start, "to": end, "planned_meals": planned,
            "followed": len(followed), "modified": len(modified), "skipped": len(skipped),
            "not_logged": max(0, planned - len(followed) - len(modified) - len(skipped)),
            "adherence_pct": round(100 * (len(followed) + 0.5 * len(modified)) / planned, 1) if planned else None,
        }


class ChatService:
    """One-to-one chat between a trainer and an assigned member. Gym managers don't read chats."""

    def __init__(self, db: Session, tenant: TenantContext):
        self.db = db
        self.tenant = tenant
        self.actor = FitnessActor(db, tenant)
        self.ws = tenant.workspace_id
        if self.actor.kind == "gym":
            raise HTTPException(status_code=403, detail="Chat is between trainers and their members.")
        if self.actor.kind == "trainer":
            self.actor.require("chat.use", "You don't have permission to message members.")

    def _relation_active(self, trainer_id: str, member_id: str) -> bool:
        return self.db.query(TrainerClient.id).filter(
            TrainerClient.workspace_id == self.ws, TrainerClient.trainer_id == trainer_id,
            TrainerClient.client_id == member_id, TrainerClient.status == TrainerClientStatus.ACTIVE,
        ).first() is not None

    def _conversation(self, conversation_id: str) -> Conversation:
        c = self.db.query(Conversation).filter(
            Conversation.workspace_id == self.ws, Conversation.id == conversation_id).first()
        mine = c and ((self.actor.kind == "trainer" and c.trainer_id == self.actor.trainer.id)
                      or (self.actor.kind == "member" and c.member_id == self.actor.member.id))
        if not mine:
            raise HTTPException(status_code=404, detail="Conversation not found.")
        # Trainers lose access as soon as the member is unassigned; members keep their history.
        if self.actor.kind == "trainer" and not self._relation_active(c.trainer_id, c.member_id):
            raise HTTPException(status_code=403, detail="This member is no longer assigned to you.")
        return c

    def _out(self, c: Conversation) -> dict:
        member = self.db.query(Member).filter(Member.id == c.member_id).first()
        trainer = self.db.query(Trainer).filter(Trainer.id == c.trainer_id).first()
        last = self.db.query(ChatMessage).filter(ChatMessage.conversation_id == c.id).order_by(
            ChatMessage.created_at.desc()).first()
        unread = self.db.query(func.count(ChatMessage.id)).filter(
            ChatMessage.conversation_id == c.id, ChatMessage.sender_user_id != self.tenant.user_id,
            ChatMessage.read_at.is_(None)).scalar()
        return {
            "id": c.id, "member_id": c.member_id, "trainer_id": c.trainer_id,
            "member_name": f"{member.first_name} {member.last_name or ''}".strip() if member else "",
            "trainer_name": trainer.name if trainer else "", "last_message_at": c.last_message_at,
            "last_message": (last.body or "")[:120] if last else None, "unread": int(unread or 0),
            "can_send": self._relation_active(c.trainer_id, c.member_id),
        }

    def list(self) -> list:
        if self.actor.kind == "trainer":
            cids = self.actor.client_ids()
            if not cids:
                return []
            q = self.db.query(Conversation).filter(
                Conversation.workspace_id == self.ws,
                Conversation.trainer_id == self.actor.trainer.id,
                Conversation.member_id.in_(cids),
            )
        else:
            q = self.db.query(Conversation).filter(
                Conversation.workspace_id == self.ws,
                Conversation.member_id == self.actor.member.id,
            )
        return [self._out(c) for c in q.order_by(Conversation.last_message_at.desc()).all()]

    def open(self, *, member_id: Optional[str] = None, trainer_id: Optional[str] = None) -> dict:
        if self.actor.kind == "trainer":
            if not member_id:
                raise HTTPException(status_code=422, detail="member_id is required.")
            mid, tid = self.actor.member_for(member_id).id, self.actor.trainer.id
        else:
            if not trainer_id:
                raise HTTPException(status_code=422, detail="trainer_id is required.")
            mid, tid = self.actor.member.id, trainer_id
            if not self._relation_active(tid, mid):
                raise HTTPException(status_code=403, detail="You can only message your assigned trainer.")
        c = self.db.query(Conversation).filter(Conversation.workspace_id == self.ws,
                                               Conversation.member_id == mid, Conversation.trainer_id == tid).first()
        if not c:
            c = Conversation(workspace_id=self.ws, member_id=mid, trainer_id=tid)
            self.db.add(c)
            try:
                self.db.commit()
            except IntegrityError:
                self.db.rollback()
                c = self.db.query(Conversation).filter(Conversation.workspace_id == self.ws,
                                                       Conversation.member_id == mid, Conversation.trainer_id == tid).one()
        return self._out(c)

    @staticmethod
    def message_out(m: ChatMessage) -> dict:
        return {"id": m.id, "conversation_id": m.conversation_id, "sender_user_id": m.sender_user_id,
                "sender_kind": m.sender_kind, "body": m.body, "attachment_type": m.attachment_type,
                "attachment_ref": m.attachment_ref, "read_at": m.read_at, "created_at": m.created_at}

    def messages(self, conversation_id: str, before: Optional[datetime] = None, limit: int = 50) -> list:
        c = self._conversation(conversation_id)
        q = self.db.query(ChatMessage).filter(ChatMessage.workspace_id == self.ws, ChatMessage.conversation_id == c.id)
        if before:
            q = q.filter(ChatMessage.created_at < before)
        rows = q.order_by(ChatMessage.created_at.desc()).limit(max(1, min(limit, 100))).all()
        return [self.message_out(m) for m in reversed(rows)]

    def send(self, conversation_id: str, data) -> dict:
        c = self._conversation(conversation_id)
        if not self._relation_active(c.trainer_id, c.member_id):
            raise HTTPException(status_code=403, detail="This trainer is no longer assigned, so new messages can't be sent.")
        body = (data.body or "").strip()
        if not body and not data.attachment_ref:
            raise HTTPException(status_code=422, detail="Message can't be empty.")
        if data.client_ref:
            existing = self.db.query(ChatMessage).filter(
                ChatMessage.conversation_id == c.id, ChatMessage.sender_user_id == self.tenant.user_id,
                ChatMessage.client_ref == data.client_ref).first()
            if existing:
                return self.message_out(existing)
        if data.attachment_type in ("workout_assignment", "diet_assignment"):
            self._check_shared_assignment(c, data.attachment_type, data.attachment_ref)
        m = ChatMessage(workspace_id=self.ws, conversation_id=c.id, sender_user_id=self.tenant.user_id,
                        sender_kind=self.actor.kind, body=body or None, attachment_type=data.attachment_type,
                        attachment_ref=data.attachment_ref, client_ref=data.client_ref)
        self.db.add(m)
        c.last_message_at = utcnow()
        self.db.commit()
        return self.message_out(m)

    def _check_shared_assignment(self, c: Conversation, kind: str, ref: Optional[str]) -> None:
        from app.models.fitness import WorkoutAssignment
        model = WorkoutAssignment if kind == "workout_assignment" else DietAssignment
        if not ref or not self.db.query(model.id).filter(
            model.workspace_id == self.ws, model.id == ref, model.member_id == c.member_id,
        ).first():
            raise HTTPException(status_code=422, detail="Shared plan must belong to this member.")

    def mark_read(self, conversation_id: str) -> dict:
        c = self._conversation(conversation_id)
        self.db.query(ChatMessage).filter(
            ChatMessage.conversation_id == c.id, ChatMessage.sender_user_id != self.tenant.user_id,
            ChatMessage.read_at.is_(None),
        ).update({ChatMessage.read_at: utcnow()}, synchronize_session=False)
        self.db.commit()
        return self._out(c)


REPORT_REASONS = ("harassment", "inappropriate", "spam", "off_topic", "safety", "other")
REPORT_STATUSES = ("open", "reviewing", "resolved", "dismissed")
REVIEWER_ROLES = {"OWNER", "ADMIN", "MANAGER"}
MAX_REPORTS_PER_DAY = 10


class ChatReportService:
    """Members and trainers report a conversation; owners/admins/managers review it.

    Reviewers never browse chats freely: they can read a conversation only through a report on it.
    """

    def __init__(self, db: Session, tenant: TenantContext):
        self.db = db
        self.tenant = tenant
        self.ws = tenant.workspace_id

    # -- filing (member / trainer)
    def file(self, conversation_id: str, data) -> dict:
        chat = ChatService(self.db, self.tenant)  # only participants get past this
        c = chat._conversation(conversation_id)
        if data.reason not in REPORT_REASONS:
            raise HTTPException(status_code=422, detail="Choose a reason for the report.")
        excerpt = None
        if data.message_id:
            m = self.db.query(ChatMessage).filter(
                ChatMessage.workspace_id == self.ws, ChatMessage.conversation_id == c.id,
                ChatMessage.id == data.message_id).first()
            if not m:
                raise HTTPException(status_code=404, detail="Message not found in this conversation.")
            if m.sender_user_id == self.tenant.user_id:
                raise HTTPException(status_code=422, detail="You cannot report your own message.")
            excerpt = (m.body or "")[:1000] or None
        # Abuse controls: one open report per conversation per reporter, and a daily cap.
        open_dup = self.db.query(ChatReport.id).filter(
            ChatReport.workspace_id == self.ws, ChatReport.conversation_id == c.id,
            ChatReport.reporter_user_id == self.tenant.user_id, ChatReport.status.in_(("open", "reviewing")),
        ).first()
        if open_dup:
            raise HTTPException(status_code=409, detail="You already reported this conversation. The gym is reviewing it.")
        since = utcnow() - timedelta(days=1)
        recent = self.db.query(func.count(ChatReport.id)).filter(
            ChatReport.workspace_id == self.ws, ChatReport.reporter_user_id == self.tenant.user_id,
            ChatReport.created_at >= since).scalar() or 0
        if recent >= MAX_REPORTS_PER_DAY:
            raise HTTPException(status_code=429, detail="Too many reports today. Please contact the gym directly.")

        kind = chat.actor.kind
        r = ChatReport(workspace_id=self.ws, conversation_id=c.id, message_id=data.message_id, message_excerpt=excerpt,
                       reporter_user_id=self.tenant.user_id, reporter_kind=kind,
                       reported_kind="member" if kind == "trainer" else "trainer", reason=data.reason,
                       details=(data.details or "").strip()[:2000] or None, status="open")
        self.db.add(r)
        self.db.flush()
        self.db.add(ChatReportEvent(workspace_id=self.ws, report_id=r.id, actor_user_id=self.tenant.user_id,
                                    from_status=None, to_status="open"))
        record_audit(self.db, self.ws, self.tenant.user_id, "chat_report.filed", resource_type="chat_report",
                     resource_id=r.id, details={"conversation_id": c.id, "reason": r.reason})
        self._notify_reviewers(r)
        self.db.commit()
        return {"id": r.id, "status": r.status, "created_at": r.created_at}

    def _notify_reviewers(self, r: ChatReport) -> None:
        from app.models.system import Notification
        from app.models.user import UserRole, WorkspaceMember
        reviewers = self.db.query(WorkspaceMember.user_id).filter(
            WorkspaceMember.workspace_id == self.ws, WorkspaceMember.is_active.is_(True),
            WorkspaceMember.role.in_((UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER))).all()
        who = "A trainer" if r.reporter_kind == "trainer" else "A member"
        reason = r.reason.replace("_", " ")
        for (uid,) in reviewers:
            self.db.add(Notification(workspace_id=self.ws, user_id=uid, title="Chat reported",
                                     message=f"{who} reported a conversation ({reason}). Please review it.",
                                     action_url=f"/chat/reports?report={r.id}", is_read=False))

    # -- review (owner / admin / manager)
    def _require_reviewer(self) -> None:
        if self.tenant.role not in REVIEWER_ROLES:
            raise HTTPException(status_code=403, detail="Only the gym's owner, admins and managers can review chat reports.")

    def _get(self, report_id: str) -> ChatReport:
        r = self.db.query(ChatReport).filter(ChatReport.workspace_id == self.ws, ChatReport.id == report_id).first()
        if not r:
            raise HTTPException(status_code=404, detail="Report not found.")
        return r

    def _out(self, r: ChatReport) -> dict:
        c = self.db.query(Conversation).filter(Conversation.id == r.conversation_id).first()
        member = self.db.query(Member).filter(Member.id == c.member_id).first() if c else None
        trainer = self.db.query(Trainer).filter(Trainer.id == c.trainer_id).first() if c else None
        member_name = f"{member.first_name} {member.last_name or ''}".strip() if member else ""
        trainer_name = trainer.name if trainer else ""
        return {
            "id": r.id, "conversation_id": r.conversation_id, "message_id": r.message_id,
            "message_excerpt": r.message_excerpt, "reason": r.reason, "details": r.details, "status": r.status,
            "reporter_kind": r.reporter_kind, "reported_kind": r.reported_kind,
            "reporter_name": trainer_name if r.reporter_kind == "trainer" else member_name,
            "reported_name": trainer_name if r.reported_kind == "trainer" else member_name,
            "member_id": c.member_id if c else None, "trainer_id": c.trainer_id if c else None,
            "resolution_note": r.resolution_note, "reviewed_at": r.reviewed_at, "created_at": r.created_at,
        }

    def list(self, status: Optional[str] = None) -> list:
        self._require_reviewer()
        q = self.db.query(ChatReport).filter(ChatReport.workspace_id == self.ws)
        if status:
            q = q.filter(ChatReport.status == status)
        return [self._out(r) for r in q.order_by(ChatReport.created_at.desc()).limit(200).all()]

    def detail(self, report_id: str) -> dict:
        self._require_reviewer()
        r = self._get(report_id)
        # Context: the 30 messages up to (and including) the reported one, or the latest 30.
        q = self.db.query(ChatMessage).filter(ChatMessage.workspace_id == self.ws,
                                              ChatMessage.conversation_id == r.conversation_id)
        if r.message_id:
            anchor = q.filter(ChatMessage.id == r.message_id).first()
            if anchor:
                q = q.filter(ChatMessage.created_at <= anchor.created_at)
        rows = list(reversed(q.order_by(ChatMessage.created_at.desc()).limit(30).all()))
        events = self.db.query(ChatReportEvent).filter(ChatReportEvent.report_id == r.id).order_by(
            ChatReportEvent.created_at).all()
        record_audit(self.db, self.ws, self.tenant.user_id, "chat_report.viewed", resource_type="chat_report",
                     resource_id=r.id)
        self.db.commit()
        return {**self._out(r), "messages": [ChatService.message_out(m) for m in rows],
                "events": [{"from_status": e.from_status, "to_status": e.to_status, "note": e.note,
                            "created_at": e.created_at} for e in events]}

    def update(self, report_id: str, status: str, note: Optional[str]) -> dict:
        self._require_reviewer()
        if status not in REPORT_STATUSES:
            raise HTTPException(status_code=422, detail="Unknown report status.")
        r = self._get(report_id)
        note = (note or "").strip()[:2000] or None
        if status == r.status and not note:
            return self._out(r)
        self.db.add(ChatReportEvent(workspace_id=self.ws, report_id=r.id, actor_user_id=self.tenant.user_id,
                                    from_status=r.status, to_status=status, note=note))
        r.status = status
        if note:
            r.resolution_note = note
        r.reviewed_by_user_id, r.reviewed_at = self.tenant.user_id, utcnow()
        record_audit(self.db, self.ws, self.tenant.user_id, f"chat_report.{status}", resource_type="chat_report",
                     resource_id=r.id)
        self.db.commit()
        return self._out(r)

    def mine(self) -> list:
        """The caller's own reports (status only), so a reporter can see the gym acted."""
        rows = self.db.query(ChatReport).filter(ChatReport.workspace_id == self.ws,
                                                ChatReport.reporter_user_id == self.tenant.user_id).order_by(
            ChatReport.created_at.desc()).limit(50).all()
        return [{"id": r.id, "conversation_id": r.conversation_id, "reason": r.reason, "status": r.status,
                 "created_at": r.created_at} for r in rows]
