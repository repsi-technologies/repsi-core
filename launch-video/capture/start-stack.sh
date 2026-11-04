#!/usr/bin/env bash
# Scratch REPSI stack for capturing real product screens:
#   API on 127.0.0.1:8100 with a throwaway SQLite file in launch-video/.tmp (never app/api/.env's database),
#   seeded with the sales demo gym (scripts/seed_demo.py) plus a trainer and member login (link_roles.py).
# Provider keys are blanked so nothing reaches WhatsApp, email, AI or payment providers.
# The web app is started separately: REMOTE_API_URL=http://127.0.0.1:8100/api/v1 npx next dev -p 3100
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
TMP="$ROOT/launch-video/.tmp"
PY="$ROOT/app/api/.venv/Scripts/python.exe"
[ -x "$PY" ] || PY="$ROOT/app/api/.venv/bin/python"
mkdir -p "$TMP"

if [ ! -f "$TMP/secrets.env" ]; then
  {
    echo "SECRET_KEY=$("$PY" -c 'import secrets; print(secrets.token_hex(32))')"
    echo "DEMO_ACCOUNT_PASSWORD=$("$PY" -c 'import secrets; print(secrets.token_urlsafe(18))')"
  } > "$TMP/secrets.env"
fi
set -a
# shellcheck disable=SC1091
. "$TMP/secrets.env"
DATABASE_URL="sqlite:///$(cygpath -m "$TMP" 2>/dev/null || echo "$TMP")/launch-video.db"
ENVIRONMENT=development
OTP_PROVIDER=test
SCHEDULER_ENABLED=false
STORAGE_BACKEND=local
RATE_LIMITS_ENABLED=false
PYTHONUTF8=1
AISENSY_API_KEY=""
SMTP_USER=""
SMTP_PASSWORD=""
GEMINI_API_KEY=""
CASHFREE_APP_ID=""
CASHFREE_SECRET_KEY=""
RAZORPAY_KEY_ID=""
RAZORPAY_KEY_SECRET=""
SAAS_ALERT_EMAIL=""
DEMO_ACCOUNT_EMAIL=demo@repsi.test
DEMO_WORKSPACE_SLUG=repsi-demo
set +a

cd "$ROOT/app/api"
"$PY" -m scripts.seed_demo
"$PY" "$ROOT/launch-video/capture/link_roles.py" --out "$TMP/accounts.json"
exec "$PY" -m uvicorn app.main:app --host 127.0.0.1 --port 8100
