"""
Set a user's password from the command line (used to rotate the super admin password in production).

    docker compose -f docker-compose.production.yml exec -it api uv run --no-sync python -m scripts.set_password you@example.com

The new password is typed at a hidden prompt; it is never passed as an argument or printed.
All the user's sessions are revoked so every device must sign in again.
"""
import getpass
import sys
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlalchemy import func  # noqa: E402

from app.core.database import SessionLocal  # noqa: E402
from app.core.security import get_password_hash  # noqa: E402
import app.models  # noqa: E402,F401
from app.models.auth import AuthSession  # noqa: E402
from app.models.user import User  # noqa: E402


def main() -> int:
    if len(sys.argv) != 2:
        print(__doc__)
        return 2
    email = sys.argv[1].strip().lower()
    db = SessionLocal()
    try:
        user = db.query(User).filter(func.lower(User.email) == email).first()
        if user is None:
            print("No user with that email.")
            return 1
        first = getpass.getpass("New password (min 12 characters): ")
        if len(first) < 12:
            print("Too short.")
            return 1
        if first != getpass.getpass("Repeat: "):
            print("Passwords do not match.")
            return 1
        user.hashed_password = get_password_hash(first)
        now = datetime.now(timezone.utc)
        revoked = 0
        for s in db.query(AuthSession).filter(AuthSession.user_id == user.id, AuthSession.revoked_at.is_(None)).all():
            s.revoked_at, s.revoked_reason = now, "password_set_cli"
            revoked += 1
        db.commit()
        print(f"Password updated for {user.email}; {revoked} session(s) signed out.")
        return 0
    finally:
        db.close()


if __name__ == "__main__":
    raise SystemExit(main())
