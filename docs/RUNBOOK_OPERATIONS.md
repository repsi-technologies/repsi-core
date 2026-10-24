# REPSI operations runbook

Covers backups and restore, background jobs, deployment and rollback, environments, and the
optional providers (S3, SMS, push, Sentry). Commands run from `app/api` unless noted.

## 1. Backups

`scripts/backup.py` writes a database dump, an archive of `private_storage` (local storage backend
only) and a manifest with SHA-256 checksums.

```bash
python -m scripts.backup --label nightly --prune-days 30 --upload
```

- PostgreSQL: `pg_dump -Fc --no-owner --no-privileges` (needs `postgresql-client`, included in the image).
  The password goes through `PGPASSWORD`, never the command line.
- SQLite (dev): the online backup API, safe while the app runs.
- `--upload` copies the files to `s3://$STORAGE_S3_BUCKET/backups/` (needs `boto3`). Turn on bucket
  versioning and a lifecycle rule (for example 30 days hot, 180 days cold).

**Schedule** (host crontab on the VPS):

```cron
15 2 * * * cd /opt/repsi && docker compose -f docker-compose.production.yml run --rm --no-deps api uv run --no-sync python -m scripts.backup --label nightly --prune-days 30 --upload >> /var/log/repsi-backup.log 2>&1
```

The deploy workflow also takes a `pre-deploy-<sha>` backup before every release.

## 2. Restore (rehearse monthly)

1. Create an empty database: `createdb repsi_restore`.
2. Restore: `pg_restore --clean --if-exists --no-owner -d "$RESTORE_URL" repsi-<stamp>.dump`
3. Uploads: `tar -xzf private_storage-<stamp>.tar.gz -C /restore/path`
4. Check the manifest checksums: `sha256sum repsi-<stamp>.dump`.
5. Smoke test against the restored copy with a scratch API:
   `DATABASE_URL=$RESTORE_URL ENVIRONMENT=staging uvicorn app.main:app --port 8001`, then
   `curl localhost:8001/health` and sign in with a staff test account.
6. Only then point production at it (change `DATABASE_URL`, `docker compose up -d`).

Record each rehearsal (date, backup used, time to restore, issues) in the ops log.

## 3. Background jobs

| Job | Every | Purpose |
|---|---|---|
| dispatch_notifications | 1 min | Send queued email / WhatsApp / SMS / push |
| membership_transitions | 15 min | Scheduled freezes, auto-resume, expiry |
| membership_reminders | 60 min | 7/3/1-day expiry reminders and "membership ended" |
| attendance_auto_checkout | 15 min | Close visits past max duration / closing time |
| class_no_shows | 30 min | Mark unattended bookings as no-shows |
| trial_lifecycle | 60 min | Expire trials, trial reminders |
| subscription_status | 60 min | SaaS grace period and expiry |

Run them in **one** place:
- Production compose: the `worker` service runs `python -m scripts.run_jobs` every minute.
- Or set `SCHEDULER_ENABLED=true` on exactly one API process.

Each time slot is claimed in `job_runs` (unique job + slot), so a second runner never repeats a slot.
Super admins see runs and can trigger a job at `GET /api/v1/superadmin/jobs` and
`POST /api/v1/superadmin/jobs/{name}/run`. `GET /superadmin/system-health` flags stale or failed jobs.

```bash
python -m scripts.run_jobs --list
python -m scripts.run_jobs --job membership_reminders --force
```

## 4. Deployment and rollback

- `.github/workflows/ci.yml`: API tests, web lint + type check + build, Playwright e2e.
- `.github/workflows/deploy.yml`: after CI passes on `main`, deploys to **staging**. Production is a
  manual run (`workflow_dispatch`, environment `production`); add required reviewers to that
  GitHub environment.
- The deploy script backs up, builds, starts, then polls `/health` for 150 s. If the check fails it
  checks out the previous commit and redeploys it.
- Manual rollback: `git checkout <previous-sha> && REPSI_RELEASE=<sha> docker compose -f docker-compose.production.yml up -d --build`.
- Schema changes are additive and applied on startup (`app/core/migrations.py`), so rolling back code
  never needs a schema rollback.

Required GitHub secrets per environment: `VPS_HOST`, `VPS_USERNAME`, `VPS_SSH_KEY`, `VPS_PASSPHRASE`.
Optional variable: `REPSI_DIR` (default `/opt/repsi`).

## 5. Environments

| | Development | Staging | Production |
|---|---|---|---|
| `ENVIRONMENT` | development | staging | production |
| Database | SQLite file (scratch) | managed Postgres (separate) | managed Postgres |
| `OTP_PROVIDER` | test | test or aisensy | aisensy |
| `LEGACY_REGISTRATION_ENABLED` | default (on) | false | default (off) |
| Seed scripts | allowed (SQLite only) | refused | refused |
| `SCHEDULER_ENABLED` | optional | worker service | worker service |

Never point a developer machine at production. `app/api/.env` on a developer machine must use a
scratch SQLite `DATABASE_URL`.

## 6. Optional providers

All of these are off by default. Without configuration every attempt is logged as
`skipped_not_configured`; nothing is reported as sent.

| Provider | Settings | Extra package |
|---|---|---|
| S3-compatible storage | `STORAGE_BACKEND=s3`, `STORAGE_S3_BUCKET`, `STORAGE_S3_REGION`, `STORAGE_S3_ENDPOINT_URL` (R2/MinIO), `STORAGE_S3_ACCESS_KEY_ID`, `STORAGE_S3_SECRET_ACCESS_KEY` | `boto3` |
| Image hosting (Cloudinary) | `CLOUDINARY_URL=cloudinary://<key>:<secret>@<cloud>` (or `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`), optional `CLOUDINARY_FOLDER` (default `repsi`). Only public images: gym logos and profile photos. Documents, receipts and payment QR stay in file storage | — (uses httpx) |
| SMS | `SMS_PROVIDER=msg91` + `MSG91_AUTH_KEY`, `MSG91_SENDER_ID` (DLT template ids on `sms` message templates), or `SMS_PROVIDER=twilio` + `TWILIO_*` | — |
| Push | `FCM_PROJECT_ID`, `FCM_SERVICE_ACCOUNT_FILE` (path to service-account JSON, outside git) | — (google-auth already installed) |
| Error monitoring | `SENTRY_DSN`, `SENTRY_TRACES_SAMPLE_RATE` | `sentry-sdk` |
| WhatsApp | `AISENSY_API_KEY`, approved templates linked to events (template `category` = event type) | — |

Moving existing local uploads to S3: copy `private_storage/` to the bucket under the same keys
(`aws s3 sync private_storage/ s3://$BUCKET/$STORAGE_S3_PREFIX/`), then switch `STORAGE_BACKEND`.

## 7. Load testing

`scripts/load_test.py` (see its `--help`). Run it against staging PostgreSQL with several workers
(`--allow-remote`), never against production.

## 8. Sales demo gym

`cd app/api && python -m scripts.seed_demo --yes` creates the demo login (`DEMO_ACCOUNT_EMAIL`, default
`demo@repsi.app`, password `DEMO_ACCOUNT_PASSWORD` from `.env`) and the `repsi-demo` gym, flagged `is_demo`.
It is on Enterprise as complimentary access with unlimited members, staff, trainers and branches, and holds
~140 members with renewal history, receipts, part-paid dues, 60 days of check-ins, trainers, classes,
expenses and leads.

Isolation (`app/core/demo.py`): tenant scoping keeps it apart from every real gym; email, WhatsApp, SMS
and push from it are recorded as `skipped_demo` and never sent; account security, billing, payment
gateways and settings, invitations, website publishing, support tickets, team roles, rename/deregister,
onboarding and logo uploads return 403 `DEMO_RESTRICTED`; password reset emails are never sent for it.
The demo login is an owner, not a platform admin, so it cannot see other gyms.

Re-running updates the password and plan; sample data is only created once. Prospects can edit the demo
data, so plan a periodic refresh (not automated yet). The seeder refuses to reuse an email or slug
that belongs to a real account or gym.

