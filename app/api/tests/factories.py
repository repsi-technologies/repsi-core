"""Shared test data for the newer module tests: two gyms with one account per role."""
import uuid
from dataclasses import dataclass, field
from datetime import date, timedelta

from app.core.security import create_access_token, get_password_hash
from app.models.member import Member, MemberStatus, Membership, MembershipPlan
from app.models.trainer import Trainer
from app.models.user import User, UserRole, Workspace, WorkspaceMember
from tests.conftest import TestingSessionLocal

PASSWORD = "pass1234-test"
ROLES = ("OWNER", "ADMIN", "MANAGER", "STAFF", "TRAINER", "USER")


@dataclass
class Gym:
    id: str
    slug: str
    headers: dict = field(default_factory=dict)  # role -> Authorization header
    user_ids: dict = field(default_factory=dict)  # role -> user id
    emails: dict = field(default_factory=dict)
    member_id: str = ""  # the USER account's Member record
    other_member_id: str = ""  # a walk-in member without an app account
    trainer_id: str = ""  # Trainer record of the TRAINER account
    plan_id: str = ""


def auth(user_id: str, workspace_id: str, role: str) -> dict:
    return {"Authorization": f"Bearer {create_access_token(user_id, workspace_id, role)}"}


def make_gym(name: str = "Factory Gym", with_membership: bool = True) -> Gym:
    db = TestingSessionLocal()
    tag = uuid.uuid4().hex[:8]
    try:
        ws = Workspace(name=f"{name} {tag}", slug=f"gym-{tag}", is_active=True, timezone="UTC", country_code="IN",
                       currency="INR")
        db.add(ws)
        db.flush()
        gym = Gym(id=ws.id, slug=ws.slug)
        for role in ROLES:
            email = f"{role.lower()}.{tag}@example.com"
            u = User(email=email, full_name=f"{role.title()} {tag}", hashed_password=get_password_hash(PASSWORD),
                     is_active=True, email_verified=True)
            db.add(u)
            db.flush()
            db.add(WorkspaceMember(workspace_id=ws.id, user_id=u.id, role=UserRole(role), is_active=True))
            gym.headers[role] = auth(u.id, ws.id, role)
            gym.user_ids[role] = u.id
            gym.emails[role] = email
        member = Member(workspace_id=ws.id, user_id=gym.user_ids["USER"], first_name="Mia", last_name="Member",
                        email=gym.emails["USER"], phone="+919800000001", status=MemberStatus.ACTIVE,
                        joined_date=date.today() - timedelta(days=40))
        walk_in = Member(workspace_id=ws.id, first_name="Noor", last_name="Walkin", phone="+919800000002",
                         status=MemberStatus.ACTIVE, joined_date=date.today())
        trainer = Trainer(workspace_id=ws.id, user_id=gym.user_ids["TRAINER"], name=f"Coach {tag}",
                          email=gym.emails["TRAINER"], phone="+919800000009")
        db.add_all([member, walk_in, trainer])
        db.flush()
        gym.member_id, gym.other_member_id, gym.trainer_id = member.id, walk_in.id, trainer.id
        plan = MembershipPlan(workspace_id=ws.id, name=f"Monthly {tag}", duration_months=1, price=1500.0)
        db.add(plan)
        db.flush()
        gym.plan_id = plan.id
        if with_membership:
            db.add(Membership(workspace_id=ws.id, member_id=member.id, plan_id=plan.id,
                              start_date=date.today() - timedelta(days=5), end_date=date.today() + timedelta(days=25),
                              status=MemberStatus.ACTIVE, price_paid=1500.0))
        db.commit()
        return gym
    finally:
        db.close()
