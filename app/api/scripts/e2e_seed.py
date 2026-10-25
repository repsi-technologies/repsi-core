"""
Seed isolated accounts for the Playwright end-to-end tests.

    python -m scripts.e2e_seed --out ../web/e2e/.tmp/accounts.json

Refuses to run unless DATABASE_URL is a SQLite file and ENVIRONMENT is not production/staging,
so it can never touch real data. Passwords are random per run and only written to the output
file (gitignored), never printed.
"""
import argparse
import json
import secrets
import sys
import uuid
from datetime import date, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.config import settings  # noqa: E402

if not settings.DATABASE_URL.startswith("sqlite") or ":memory:" in settings.DATABASE_URL:
    raise SystemExit("e2e_seed only runs against a scratch SQLite file database.")
if settings.ENVIRONMENT.lower() in ("production", "prod", "staging"):
    raise SystemExit(f"e2e_seed refuses ENVIRONMENT={settings.ENVIRONMENT}.")

from app.core.database import SessionLocal  # noqa: E402
from app.core.migrations import run_database_migrations  # noqa: E402
from app.core.security import get_password_hash  # noqa: E402
import app.models  # noqa: E402,F401
from app.models.member import Member, MemberStatus, Membership, MembershipPlan  # noqa: E402
from app.models.trainer import Trainer  # noqa: E402
from app.models.user import User, UserRole, Workspace, WorkspaceMember  # noqa: E402
from app.services.billing import BillingService  # noqa: E402
from app.services.saas_billing import sync_catalog  # noqa: E402


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--out", required=True, type=Path)
    args = parser.parse_args()
    run_database_migrations()
    db = SessionLocal()
    sync_catalog(db)  # central SaaS billing plans (the e2e stack runs with SAAS_BILLING_ENABLED=true)
    tag = uuid.uuid4().hex[:6]
    accounts: dict = {}
    try:
        def gym(name: str, slug: str) -> Workspace:
            ws = Workspace(name=name, slug=slug, is_active=True, onboarding_completed=True, timezone="Asia/Kolkata",
                           country_code="IN", currency="INR", city="Chennai")
            db.add(ws)
            db.flush()
            BillingService.get_or_create_workspace_subscription(db, ws.id)
            return ws

        def account(key: str, ws: Workspace | None, role: str, superadmin: bool = False) -> User:
            password = secrets.token_urlsafe(12)
            u = User(email=f"e2e.{key}.{tag}@repsi.test", full_name=f"E2E {key.replace('_', ' ').title()}",
                     hashed_password=get_password_hash(password), is_active=True, email_verified=True,
                     is_superadmin=superadmin)
            db.add(u)
            db.flush()
            if ws is not None:
                db.add(WorkspaceMember(workspace_id=ws.id, user_id=u.id, role=UserRole(role), is_active=True))
            accounts[key] = {"email": u.email, "password": password, "role": role,
                             "workspace": ws.slug if ws else None, "user_id": u.id}
            return u

        alpha = gym(f"E2E Alpha {tag}", f"e2e-alpha-{tag}")
        beta = gym(f"E2E Beta {tag}", f"e2e-beta-{tag}")
        account("owner", alpha, "OWNER")
        account("staff", alpha, "STAFF")
        trainer_user = account("trainer", alpha, "TRAINER")
        member_user = account("member", alpha, "USER")
        account("other_owner", beta, "OWNER")
        account("superadmin", None, "SUPER_ADMIN", superadmin=True)

        db.add(Trainer(workspace_id=alpha.id, user_id=trainer_user.id, name="E2E Coach", phone="+919800000010",
                       email=trainer_user.email))
        plan = MembershipPlan(workspace_id=alpha.id, name="E2E Monthly", duration_months=1, price=1500.0, is_active=True)
        db.add(plan)
        db.flush()
        member = Member(workspace_id=alpha.id, user_id=member_user.id, first_name="Mia", last_name="E2E",
                        email=member_user.email, phone="+919800000011", status=MemberStatus.ACTIVE,
                        joined_date=date.today() - timedelta(days=10))
        db.add(member)
        db.flush()
        db.add(Membership(workspace_id=alpha.id, member_id=member.id, plan_id=plan.id,
                          start_date=date.today() - timedelta(days=10), end_date=date.today() + timedelta(days=20),
                          status=MemberStatus.ACTIVE, price_paid=1500.0))
        db.commit()
        args.out.parent.mkdir(parents=True, exist_ok=True)
        args.out.write_text(json.dumps({"alpha": alpha.slug, "beta": beta.slug, "plan_id": plan.id,
                                        "member_id": member.id, "accounts": accounts}, indent=2), encoding="utf-8")
        print(f"Seeded e2e accounts for {alpha.slug} and {beta.slug} -> {args.out}")
        return 0
    finally:
        db.close()


if __name__ == "__main__":
    raise SystemExit(main())
