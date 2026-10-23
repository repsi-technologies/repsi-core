"""
Check a production env file before deploying. Prints findings, never values.

    python3 app/api/scripts/check_production_env.py /etc/repsi/production.env

Uses only the standard library, so it runs on the host without the API's virtualenv.
Exit code 1 when there are blocking problems; warnings do not fail the check.
"""
import os
import stat
import sys
from pathlib import Path

DEFAULT_SECRET = "repsi-super-secret-key-change-in-production-min-32-chars-long"
PLACEHOLDERS = ("change-me", "changeme", "your-", "example", "xxxx")


def parse(path: Path) -> dict[str, str]:
    values: dict[str, str] = {}
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, val = line.partition("=")
        values[key.strip()] = val.strip().strip("'\"")
    return values


def main() -> int:
    path = Path(sys.argv[1] if len(sys.argv) > 1 else "/etc/repsi/production.env")
    if not path.is_file():
        print(f"ERROR  {path} does not exist.")
        return 1
    env = parse(path)
    errors: list[str] = []
    warnings: list[str] = []

    mode = stat.S_IMODE(path.stat().st_mode)
    if os.name != "nt" and mode & 0o007:
        errors.append(f"{path} is readable by everyone (mode {oct(mode)}). Run: sudo chmod 640 {path}")

    def get(key: str) -> str:
        return env.get(key, "")

    if get("ENVIRONMENT").lower() != "production":
        errors.append("ENVIRONMENT must be 'production'.")

    secret = get("SECRET_KEY")
    if not secret or secret == DEFAULT_SECRET or any(p in secret.lower() for p in PLACEHOLDERS):
        errors.append("SECRET_KEY is missing or still a placeholder. Generate one: python3 -c \"import secrets;print(secrets.token_urlsafe(48))\"")
    elif len(secret) < 32:
        errors.append("SECRET_KEY must be at least 32 characters.")

    db = get("DATABASE_URL")
    if not db:
        errors.append("DATABASE_URL is missing.")
    elif db.startswith("sqlite"):
        errors.append("DATABASE_URL points at SQLite. Production must use PostgreSQL.")
    elif "@localhost" in db or "@127.0.0.1" in db:
        warnings.append("DATABASE_URL points at localhost; inside Docker that is the container itself, not the host.")
    elif "sslmode=" not in db and "localhost" not in db:
        warnings.append("DATABASE_URL has no sslmode; use ?sslmode=require for a hosted database.")
    if "repsi:repsi@" in db:
        errors.append("DATABASE_URL uses the example credentials.")

    otp = get("OTP_PROVIDER").lower()
    if otp == "test" and get("ALLOW_TEST_OTP_IN_PRODUCTION").lower() != "true":
        errors.append("OTP_PROVIDER=test is refused in production. Use aisensy (with AISENSY_API_KEY and AISENSY_CAMPAIGN_NAME).")
    if otp == "aisensy" and not (get("AISENSY_API_KEY") and get("AISENSY_CAMPAIGN_NAME")):
        errors.append("OTP_PROVIDER=aisensy needs AISENSY_API_KEY and AISENSY_CAMPAIGN_NAME.")
    if get("ALLOW_TEST_OTP_IN_PRODUCTION").lower() == "true":
        errors.append("ALLOW_TEST_OTP_IN_PRODUCTION=true lets anyone sign in with the fixed test code.")

    if get("DEBUG").lower() == "true":
        warnings.append("DEBUG=true in production.")
    if get("LEGACY_REGISTRATION_ENABLED").lower() == "true":
        warnings.append("LEGACY_REGISTRATION_ENABLED=true allows owner sign-up without email verification.")
    if get("RATE_LIMITS_ENABLED").lower() == "false":
        errors.append("RATE_LIMITS_ENABLED=false is not allowed in production.")
    if not get("GOOGLE_CLIENT_ID"):
        warnings.append("GOOGLE_CLIENT_ID is empty; Google sign-in will be refused in production.")
    cors = get("BACKEND_CORS_ORIGINS")
    if not cors:
        warnings.append("BACKEND_CORS_ORIGINS is empty; the built-in list (repsi.app, www.repsi.app, localhost) is used. Set it explicitly and drop localhost.")
    elif "localhost" in cors or "127.0.0.1" in cors:
        warnings.append("BACKEND_CORS_ORIGINS still allows localhost.")
    if not (get("SMTP_USER") and get("SMTP_PASSWORD")):
        warnings.append("SMTP is not configured; verification and reset emails cannot be sent.")
    if get("CASHFREE_ENV").upper() == "TEST" and get("CASHFREE_APP_ID"):
        warnings.append("CASHFREE_ENV=TEST with live-looking keys.")
    if get("STORAGE_BACKEND").lower() == "s3" and not (get("STORAGE_S3_BUCKET") and get("STORAGE_S3_ACCESS_KEY_ID")):
        errors.append("STORAGE_BACKEND=s3 needs STORAGE_S3_BUCKET and credentials.")
    if get("TRUST_FORWARDED_FOR") == "":
        warnings.append("TRUST_FORWARDED_FOR is not set in the file (docker-compose.production.yml sets it to true behind your proxy).")

    for w in warnings:
        print(f"WARN   {w}")
    for e in errors:
        print(f"ERROR  {e}")
    keys = sorted(k for k in env)
    print(f"{len(keys)} settings read from {path} ({len(errors)} error(s), {len(warnings)} warning(s)).")
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
