"""
Run REPSI background jobs from cron or a task scheduler.

    python -m scripts.run_jobs              # every job whose time slot is due (run this every minute)
    python -m scripts.run_jobs --job membership_reminders --force
    python -m scripts.run_jobs --list

Run from app/api with the production environment variables. Each slot runs at most once even when
the in-process scheduler is also enabled.
"""
import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.database import SessionLocal  # noqa: E402
import app.models  # noqa: E402,F401  (registers every table)
from app.services.jobs import JOBS, run_due_jobs, run_job  # noqa: E402


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--job", help="run only this job")
    parser.add_argument("--force", action="store_true", help="run now even if this slot already ran")
    parser.add_argument("--list", action="store_true", help="list jobs and exit")
    args = parser.parse_args()

    if args.list:
        for job in JOBS.values():
            print(f"{job.name:28} every {job.every_minutes:>3} min  {job.description}")
        return 0
    if args.job:
        job = JOBS.get(args.job)
        if job is None:
            print(f"Unknown job {args.job!r}. Use --list.", file=sys.stderr)
            return 2
        key = f"manual-{datetime.now(timezone.utc):%Y%m%dT%H%M%S}" if args.force else None
        runs = [r for r in [run_job(SessionLocal, job, "cli", key)] if r]
    else:
        runs = run_due_jobs(SessionLocal, trigger="cli")
    for r in runs:
        print(json.dumps({"job": r.job_name, "status": r.status, "duration_ms": r.duration_ms,
                          "result": r.result, "error": r.error}, default=str))
    return 1 if any(r.status == "failed" for r in runs) else 0


if __name__ == "__main__":
    raise SystemExit(main())
