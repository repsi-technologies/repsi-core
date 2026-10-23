#!/usr/bin/env bash
# Deploy the REPSI API on the VPS. Run as the deploy user from anywhere:  deploy/deploy.sh [git-ref]
# Replaces the manual "git pull, build, up, seed" routine:
#   - never runs the seed (it is refused in production and would reset demo data)
#   - checks the env file first, backs up the database, builds, starts, waits for /health
#   - rolls back to the previous commit if the new release is not healthy
set -euo pipefail

REPO_DIR="${REPSI_DIR:-/opt/repsi-core}"
BRANCH="${REPSI_BRANCH:-master}"
REF="${1:-origin/$BRANCH}"
COMPOSE=(sudo -n docker compose -f docker-compose.production.yml)
HEALTH_URL="${REPSI_HEALTH_URL:-http://127.0.0.1:8000/health}"

cd "$REPO_DIR"
exec 9>/tmp/repsi-deploy.lock
flock -n 9 || { echo "Another deploy is running."; exit 1; }

PREVIOUS=$(git rev-parse HEAD)
git fetch --prune origin
git checkout --detach "$REF"
RELEASE=$(git rev-parse --short HEAD)
export REPSI_RELEASE="$RELEASE"
echo "Deploying $RELEASE (was ${PREVIOUS:0:7})"

echo "== Checking /etc/repsi/production.env"
python3 app/api/scripts/check_production_env.py "${REPSI_ENV_FILE:-/etc/repsi/production.env}"

echo "== Backing up before the release"
"${COMPOSE[@]}" run --rm --no-deps api uv run --no-sync python -m scripts.backup --label "pre-deploy-$RELEASE" --prune-days 30 \
  || echo "WARNING: pre-deploy backup failed (continuing)"

echo "== Building and starting"
"${COMPOSE[@]}" build api
"${COMPOSE[@]}" up -d --remove-orphans

echo "== Waiting for $HEALTH_URL"
for _ in $(seq 1 36); do
  if curl -fsS "$HEALTH_URL" >/dev/null 2>&1; then
    echo "Healthy. Release $RELEASE is live."
    "${COMPOSE[@]}" ps
    exit 0
  fi
  sleep 5
done

echo "Release $RELEASE did not become healthy. Logs:"
"${COMPOSE[@]}" logs --tail 60 api || true
echo "== Rolling back to ${PREVIOUS:0:7}"
git checkout --detach "$PREVIOUS"
export REPSI_RELEASE=$(git rev-parse --short HEAD)
"${COMPOSE[@]}" build api
"${COMPOSE[@]}" up -d --remove-orphans
exit 1
