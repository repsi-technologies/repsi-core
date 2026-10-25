"""
Give every existing workspace a saas_subscription (grandfathered; never charged). Dry run by default.

    python -m scripts.backfill_saas_subscriptions --launch-date 2026-12-01            # report only
    python -m scripts.backfill_saas_subscriptions --launch-date 2026-12-01 --apply    # write

Safe to repeat: workspaces that already have a saas_subscription are skipped. Requires the
SaaS plan sync to have created the 'growth' plan. Rules: app/services/saas_billing.py.
"""
import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.database import SessionLocal  # noqa: E402
import app.models  # noqa: E402,F401  (registers every table)
from app.services.saas_billing import backfill_subscriptions  # noqa: E402


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--launch-date", required=True, help="YYYY-MM-DD; grandfathered trials end 60 days later")
    parser.add_argument("--apply", action="store_true", help="write the subscriptions (default: dry run)")
    parser.add_argument("--rows", action="store_true", help="print every workspace decision")
    args = parser.parse_args()

    launch_at = datetime.strptime(args.launch_date, "%Y-%m-%d").replace(tzinfo=timezone.utc)
    db = SessionLocal()
    try:
        report = backfill_subscriptions(db, launch_at, dry_run=not args.apply)
    finally:
        db.close()
    if not args.rows:
        report.pop("rows")
    print(json.dumps(report, indent=2, default=str))
    return 0


if __name__ == "__main__":
    sys.exit(main())
