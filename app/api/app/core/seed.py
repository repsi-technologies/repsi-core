import os
import secrets
from pathlib import Path
import datetime
from typing import Optional
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.models.user import User, Workspace, WorkspaceMember, UserRole
from app.models.member import Member, MembershipPlan, MemberStatus
from app.models.trainer import Trainer
from app.services.billing import BillingService


def ensure_seed_allowed() -> None:
    """Seeding and resets are for local SQLite databases only, never production."""
    from app.core.config import settings

    url = settings.DATABASE_URL.lower()
    if settings.ENVIRONMENT.lower() in ("production", "prod", "staging"):
        raise SystemExit(f"Refusing to seed or reset: ENVIRONMENT={settings.ENVIRONMENT}.")
    if not url.startswith("sqlite") and os.getenv("SEED_ALLOW_NON_SQLITE") != "1":
        raise SystemExit("Refusing to seed or reset a non-SQLite database. Set SEED_ALLOW_NON_SQLITE=1 for a disposable one.")


_SEED_PASSWORD: str | None = None


def _seed_password() -> str:
    """
    One password for every seeded demo account: SEED_PASSWORD if set, otherwise a random one
    written to app/api/.seed-credentials.local (gitignored). Nothing is hard-coded in git.
    """
    global _SEED_PASSWORD
    if _SEED_PASSWORD is None:
        _SEED_PASSWORD = os.getenv("SEED_PASSWORD") or secrets.token_urlsafe(12)
        if not os.getenv("SEED_PASSWORD"):
            try:
                path = Path(__file__).resolve().parents[2] / ".seed-credentials.local"
                path.write_text(f"Seeded demo accounts password: {_SEED_PASSWORD}\n", encoding="utf-8")
                print(f"[SEED] Demo account password written to {path}")
            except OSError as exc:
                print(f"[SEED] Warning: Could not write credentials file ({exc}). Demo password: {_SEED_PASSWORD}")
    return _SEED_PASSWORD


def _ensure_workspace_member(db: Session, workspace_id: str, user_id: str, role: UserRole) -> WorkspaceMember:
    """Ensure a user belongs to a workspace with at least the requested role."""
    member = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == workspace_id,
        WorkspaceMember.user_id == user_id,
    ).first()
    if not member:
        member = WorkspaceMember(
            workspace_id=workspace_id,
            user_id=user_id,
            role=role,
            is_active=True,
        )
        db.add(member)
        db.flush()
    return member


def seed_database(db: Optional[Session] = None, seed_dummy_records: bool = False):
    ensure_seed_allowed()
    close_db = False
    if db is None:
        from app.core.migrations import run_database_migrations
        run_database_migrations()
        db = SessionLocal()
        close_db = True

    try:
        # 1. Base Workspace
        workspace = db.query(Workspace).filter(Workspace.slug == "apex-fitness").first()
        if not workspace:
            workspace = Workspace(
                id="ws_apex_fitness_001",
                name="Apex Fitness Club",
                slug="apex-fitness",
                phone="+91 98450 11223",
                email="contact@apexfitness.in",
                address="100 Feet Road, Indiranagar",
                city="Bangalore",
                country="India",
                gym_type="Commercial Fitness",
                is_active=True,
            )
            db.add(workspace)
            db.flush()

        # 2. Seed Real Admin (admin@repsi.app / nitheesh@repsi.app)
        user_admin = db.query(User).filter(User.email == "admin@repsi.app").first()
        if not user_admin:
            user_admin = User(
                id="usr_admin_001",
                email="admin@repsi.app",
                full_name="Super Admin",
                hashed_password=get_password_hash(_seed_password()),
                phone="+91 99999 00000",
                is_superadmin=True,
                is_active=True,
            )
            db.add(user_admin)
            db.flush()
        _ensure_workspace_member(db, workspace.id, user_admin.id, UserRole.OWNER)

        user_nitheesh = db.query(User).filter(User.email == "nitheesh@repsi.app").first()
        if not user_nitheesh:
            user_nitheesh = User(
                id="usr_nitheesh_001",
                email="nitheesh@repsi.app",
                full_name="Nitheesh",
                hashed_password=get_password_hash(_seed_password()),
                phone="+91 99999 88888",
                is_superadmin=True,
                is_active=True,
            )
            db.add(user_nitheesh)
            db.flush()
        else:
            # Never reset an existing account's password from a seed run.
            user_nitheesh.is_superadmin = True
            user_nitheesh.is_active = True
            db.add(user_nitheesh)
        _ensure_workspace_member(db, workspace.id, user_nitheesh.id, UserRole.OWNER)

        # 3. Seed Real Owner (owner@repsi.app & owner@apexfitness.in)
        user_owner = db.query(User).filter(User.email == "owner@repsi.app").first()
        if not user_owner:
            user_owner = User(
                id="usr_owner_001",
                email="owner@repsi.app",
                full_name="Apex Owner",
                hashed_password=get_password_hash(_seed_password()),
                phone="+91 98450 11223",
                is_superadmin=False,
                is_active=True,
            )
            db.add(user_owner)
            db.flush()
        _ensure_workspace_member(db, workspace.id, user_owner.id, UserRole.OWNER)

        user_apex_owner = db.query(User).filter(User.email == "owner@apexfitness.in").first()
        if not user_apex_owner:
            user_apex_owner = User(
                id="usr_rajesh_001",
                email="owner@apexfitness.in",
                full_name="Rajesh Kumar",
                hashed_password=get_password_hash(_seed_password()),
                phone="+91 98450 11223",
                is_superadmin=False,
                is_active=True,
            )
            db.add(user_apex_owner)
            db.flush()
        _ensure_workspace_member(db, workspace.id, user_apex_owner.id, UserRole.OWNER)

        # 4. Seed Real Trainer Account (trainer@repsi.app)
        user_trainer = db.query(User).filter(User.email == "trainer@repsi.app").first()
        if not user_trainer:
            user_trainer = User(
                id="usr_trainer_001",
                email="trainer@repsi.app",
                full_name="REPSI Trainer",
                hashed_password=get_password_hash(_seed_password()),
                phone="+91 99999 66666",
                is_superadmin=False,
                is_active=True,
            )
            db.add(user_trainer)
            db.flush()
        _ensure_workspace_member(db, workspace.id, user_trainer.id, UserRole.TRAINER)

        # Add Trainer Profile in trainers table if not already present
        trainer = db.query(Trainer).filter(
            (Trainer.id == "tr_repsi_001") | (Trainer.user_id == user_trainer.id)
        ).first()
        if not trainer:
            db.add(Trainer(
                id="tr_repsi_001",
                workspace_id=workspace.id,
                user_id=user_trainer.id,
                name="REPSI Trainer",
                email="trainer@repsi.app",
                phone="+91 99999 66666",
                specialization="Fitness & Conditioning",
                hourly_rate=800.0,
                is_active=True,
            ))

        # 5. Seed Real User / Member Account (user@repsi.app)
        user_user = db.query(User).filter(User.email == "user@repsi.app").first()
        if not user_user:
            user_user = User(
                id="usr_user_001",
                email="user@repsi.app",
                full_name="REPSI Member User",
                hashed_password=get_password_hash(_seed_password()),
                phone="+91 99999 55555",
                is_superadmin=False,
                is_active=True,
            )
            db.add(user_user)
            db.flush()
        _ensure_workspace_member(db, workspace.id, user_user.id, UserRole.STAFF)

        # Add Member Profile in members table if not already present
        member = db.query(Member).filter(
            (Member.id == "mem_user_001") | (Member.user_id == user_user.id)
        ).first()
        if not member:
            db.add(Member(
                id="mem_user_001",
                workspace_id=workspace.id,
                user_id=user_user.id,
                first_name="REPSI",
                last_name="Member",
                email="user@repsi.app",
                phone="+91 99999 55555",
                status=MemberStatus.ACTIVE,
                joined_date=datetime.date.today(),
            ))

        # 6. Seed Default Membership Plans
        plans_data = [
            {"id": "plan_monthly", "name": "Monthly", "duration": 1, "price": 1000.0},
            {"id": "plan_quarterly", "name": "Quarterly", "duration": 3, "price": 2700.0},
            {"id": "plan_half_yearly", "name": "Half-Yearly", "duration": 6, "price": 5000.0},
            {"id": "plan_yearly", "name": "Yearly", "duration": 12, "price": 9000.0},
        ]
        for p in plans_data:
            plan = db.query(MembershipPlan).filter(
                (MembershipPlan.id == p["id"]) |
                ((MembershipPlan.workspace_id == workspace.id) & (MembershipPlan.name == p["name"]))
            ).first()
            if not plan:
                db.add(MembershipPlan(
                    id=p["id"],
                    workspace_id=workspace.id,
                    name=p["name"],
                    duration_months=p["duration"],
                    price=p["price"],
                    description=f"{p['name']} membership plan with full gym access",
                    is_active=True,
                ))

        # 7. Seed SaaS Subscription Plans & Default 14-day Growth Trial
        BillingService.ensure_default_plans(db)
        BillingService.get_or_create_workspace_subscription(db, workspace.id)

        if seed_dummy_records:
            # Optional sample records for demo mode
            pass

        db.commit()
        print("[SUCCESS] REPSI database successfully initialized with clean real accounts and SaaS subscription catalog.")
    except Exception:
        db.rollback()
        raise
    finally:
        if close_db:
            db.close()


if __name__ == "__main__":
    seed_database()
