"""
Load the SaaS plan catalogue (app/core/saas_catalog.py) into saas_plan / saas_plan_price / saas_entitlement.

    python -m scripts.sync_saas_plans

Idempotent upsert by stable plan code. Never resets the database and never touches subscriptions,
orders, invoices or founder price overrides. Run it before the existing-gym backfill.
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.database import SessionLocal  # noqa: E402
import app.models  # noqa: E402,F401  (registers every table)
from app.services.saas_billing import sync_catalog  # noqa: E402


def main() -> int:
    db = SessionLocal()
    try:
        print(json.dumps(sync_catalog(db), indent=2))
    finally:
        db.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
