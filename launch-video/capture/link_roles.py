"""
Give one seeded demo trainer and one of their clients a login, so the trainer portal and the member app
can be captured with real demo data.

    python -m ... (run with app/api on sys.path; see start-stack.sh)

Only runs against the scratch SQLite database start-stack.sh creates. Passwords are random and written to
the --out file (gitignored), never printed.
"""
import argparse
import json
import secrets
import sys
from pathlib import Path

API_DIR = Path(__file__).resolve().parents[2] / "app" / "api"
sys.path.insert(0, str(API_DIR))

from app.core.config import settings  # noqa: E402

if not settings.DATABASE_URL.startswith("sqlite") or "launch-video" not in settings.DATABASE_URL:
    raise SystemExit("link_roles only runs against the launch-video scratch database.")

from app.core.database import SessionLocal  # noqa: E402
from app.core.security import get_password_hash  # noqa: E402
import app.models  # noqa: E402,F401
from app.models.member import Member, MemberStatus  # noqa: E402
from app.models.trainer import Trainer, TrainerClient, TrainerClientStatus  # noqa: E402
from app.models.user import User, UserRole, Workspace, WorkspaceMember  # noqa: E402


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--out", required=True, type=Path)
    args = parser.parse_args()
    db = SessionLocal()
    try:
        ws = db.query(Workspace).filter(Workspace.slug == settings.DEMO_WORKSPACE_SLUG).one()
        link = (
            db.query(TrainerClient)
            .join(Member, Member.id == TrainerClient.client_id)
            .filter(TrainerClient.workspace_id == ws.id, TrainerClient.status == TrainerClientStatus.ACTIVE,
                    Member.status == MemberStatus.ACTIVE)
            .first()
        )
        trainer = db.get(Trainer, link.trainer_id)
        member = db.get(Member, link.client_id)
        accounts = {"workspace": ws.slug, "owner": {"email": settings.DEMO_ACCOUNT_EMAIL,
                                                     "password": settings.DEMO_ACCOUNT_PASSWORD}}

        def login(key: str, email: str, name: str, role: UserRole) -> User:
            user = db.query(User).filter(User.email == email).first()
            password = secrets.token_urlsafe(16)
            if user is None:
                user = User(email=email, full_name=name, is_active=True, email_verified=True,
                            hashed_password=get_password_hash(password))
                db.add(user)
                db.flush()
                db.add(WorkspaceMember(workspace_id=ws.id, user_id=user.id, role=role, is_active=True))
            else:
                user.hashed_password = get_password_hash(password)
            accounts[key] = {"email": email, "password": password}
            return user

        coach = login("trainer", "coach.capture@repsi.test", trainer.name, UserRole.TRAINER)
        trainer.user_id = coach.id
        athlete = login("member", "member.capture@repsi.test", f"{member.first_name} {member.last_name}",
                        UserRole.USER)
        member.user_id = athlete.id
        db.commit()
        args.out.write_text(json.dumps(accounts, indent=2), encoding="utf-8")
        print(f"Linked trainer '{trainer.name}' and member '{member.first_name}' -> {args.out}")
        return 0
    finally:
        db.close()


if __name__ == "__main__":
    raise SystemExit(main())
