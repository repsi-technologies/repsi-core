import logging
from sqlalchemy import text, inspect
from app.core.database import engine, Base

logger = logging.getLogger(__name__)

def run_database_migrations():
    """
    Safely applies non-destructive schema migrations (new columns, audit tables)
    across PostgreSQL and SQLite without needing manual manual intervention.
    """
    # 1. Create any missing tables (e.g. subscription_audit_logs)
    Base.metadata.create_all(bind=engine)

    inspector = inspect(engine)
    dialect_name = engine.dialect.name.lower()

    with engine.begin() as conn:
        # Check subscription_plans columns
        if inspector.has_table("subscription_plans"):
            existing_cols = {col["name"] for col in inspector.get_columns("subscription_plans")}
            new_plan_cols = [
                ("staff_limit", "INTEGER DEFAULT 2"),
                ("is_active", "BOOLEAN DEFAULT TRUE"),
                ("contact_sales", "BOOLEAN DEFAULT FALSE"),
            ]
            for col_name, col_def in new_plan_cols:
                if col_name not in existing_cols:
                    try:
                        conn.execute(text(f"ALTER TABLE subscription_plans ADD COLUMN {col_name} {col_def}"))
                        logger.info(f"Added column {col_name} to subscription_plans.")
                    except Exception as e:
                        logger.warning(f"Could not add column {col_name} to subscription_plans: {e}")

        # Check gym_subscriptions columns
        if inspector.has_table("gym_subscriptions"):
            existing_cols = {col["name"] for col in inspector.get_columns("gym_subscriptions")}
            new_sub_cols = [
                ("custom_member_limit", "INTEGER"),
                ("custom_trainer_limit", "INTEGER"),
                ("custom_staff_limit", "INTEGER"),
                ("custom_branch_limit", "INTEGER"),
                ("custom_features", "JSONB" if "postgres" in dialect_name else "TEXT"),
                ("is_complimentary", "BOOLEAN DEFAULT FALSE"),
                ("complimentary_until", "TIMESTAMP"),
                ("suspended_at", "TIMESTAMP"),
                ("suspension_reason", "TEXT"),
                ("notes", "TEXT"),
                ("trial_started_at", "TIMESTAMP"),
                ("trial_ends_at", "TIMESTAMP"),
                ("trial_converted_at", "TIMESTAMP"),
                ("reminder_sent_flags", "JSONB" if "postgres" in dialect_name else "TEXT"),
                ("is_repeat_trial_blocked", "BOOLEAN DEFAULT FALSE"),
            ]
            if "postgres" in dialect_name:
                try:
                    conn.execute(text("ALTER TABLE gym_subscriptions ALTER COLUMN status TYPE VARCHAR(50) USING status::text;"))
                    conn.execute(text("ALTER TABLE gym_subscriptions ALTER COLUMN billing_cycle TYPE VARCHAR(50) USING billing_cycle::text;"))
                    conn.execute(text("UPDATE gym_subscriptions SET status = LOWER(status), billing_cycle = LOWER(billing_cycle);"))
                except Exception as e:
                    logger.debug(f"Status column conversion: {e}")

            for col_name, col_def in new_sub_cols:
                if col_name not in existing_cols:
                    try:
                        conn.execute(text(f"ALTER TABLE gym_subscriptions ADD COLUMN {col_name} {col_def}"))
                        logger.info(f"Added column {col_name} to gym_subscriptions.")
                    except Exception as e:
                        logger.warning(f"Could not add column {col_name} to gym_subscriptions: {e}")

            # Backfill trial_started_at / trial_ends_at from existing trial_start / trial_end
            try:
                conn.execute(text("UPDATE gym_subscriptions SET trial_started_at = trial_start WHERE trial_started_at IS NULL AND trial_start IS NOT NULL;"))
                conn.execute(text("UPDATE gym_subscriptions SET trial_ends_at = trial_end WHERE trial_ends_at IS NULL AND trial_end IS NOT NULL;"))
            except Exception as e:
                logger.debug(f"Trial timestamp backfill: {e}")

        # Check workspaces columns
        if inspector.has_table("workspaces"):
            existing_ws_cols = {col["name"] for col in inspector.get_columns("workspaces")}
            new_ws_cols = [
                ("business_types", "TEXT"),
                ("business_size", "VARCHAR(100)"),
                ("managed_features", "TEXT"),
                ("management_method", "VARCHAR(100)"),
                ("checkin_method", "VARCHAR(100) DEFAULT 'QR Code'"),
                ("brand_color", "VARCHAR(50) DEFAULT '#000000'"),
                ("onboarding_completed", "BOOLEAN DEFAULT FALSE"),
                ("onboarding_step", "INTEGER DEFAULT 1"),
                ("last_name_changed_at", "TIMESTAMP"),
                ("name_change_count", "INTEGER DEFAULT 0"),
            ]
            for col_name, col_def in new_ws_cols:
                if col_name not in existing_ws_cols:
                    try:
                        conn.execute(text(f"ALTER TABLE workspaces ADD COLUMN {col_name} {col_def}"))
                        logger.info(f"Added column {col_name} to workspaces.")
                    except Exception as e:
                        logger.warning(f"Could not add column {col_name} to workspaces: {e}")

        # Check users columns (preferred_language)
        if inspector.has_table("users"):
            existing_user_cols = {col["name"] for col in inspector.get_columns("users")}
            if "preferred_language" not in existing_user_cols:
                try:
                    conn.execute(text("ALTER TABLE users ADD COLUMN preferred_language VARCHAR(10) DEFAULT 'en'"))
                    logger.info("Added preferred_language to users.")
                except Exception as e:
                    logger.warning(f"Could not add preferred_language to users: {e}")

        # Check members columns (user_id, trainer_id)
        if inspector.has_table("members"):
            existing_mem_cols = {col["name"] for col in inspector.get_columns("members")}
            new_mem_cols = [
                ("user_id", "VARCHAR(64)"),
                ("trainer_id", "VARCHAR(64)"),
            ]
            for col_name, col_def in new_mem_cols:
                if col_name not in existing_mem_cols:
                    try:
                        conn.execute(text(f"ALTER TABLE members ADD COLUMN {col_name} {col_def}"))
                        logger.info(f"Added column {col_name} to members.")
                    except Exception as e:
                        logger.warning(f"Could not add column {col_name} to members: {e}")

        _apply_identity_and_onboarding_migrations(conn, inspector, dialect_name)
        _apply_operations_module_migrations(conn, inspector, dialect_name)

        # Check invoices columns (amount_paid, membership_id)
        if inspector.has_table("invoices"):
            existing_inv_cols = {col["name"] for col in inspector.get_columns("invoices")}
            new_inv_cols = [
                ("amount_paid", "FLOAT DEFAULT 0.0"),
                ("membership_id", "VARCHAR(64)"),
            ]
            for col_name, col_def in new_inv_cols:
                if col_name not in existing_inv_cols:
                    try:
                        conn.execute(text(f"ALTER TABLE invoices ADD COLUMN {col_name} {col_def}"))
                        logger.info(f"Added column {col_name} to invoices.")
                    except Exception as e:
                        logger.warning(f"Could not add column {col_name} to invoices: {e}")

    # Outside the migration transaction: the catalog sync uses its own session (a second
    # connection would wait on the open transaction's lock on SQLite files).
    sync_plan_catalog()
    _seed_global_exercises()


def _seed_global_exercises() -> None:
    """Platform exercise library; idempotent by slug and never overwrites existing rows."""
    from sqlalchemy.orm import Session as _Session
    from app.core.exercise_seed import seed_global_exercises

    try:
        with _Session(bind=engine) as session:
            added = seed_global_exercises(session)
            if added:
                logger.info(f"Seeded {added} global exercises.")
    except Exception as e:
        logger.warning(f"Could not seed global exercises: {e}")


def _add_missing_columns(conn, inspector, table: str, columns: list[tuple[str, str]]) -> None:
    if not inspector.has_table(table):
        return
    existing = {col["name"] for col in inspector.get_columns(table)}
    for col_name, col_def in columns:
        if col_name in existing:
            continue
        try:
            conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {col_name} {col_def}"))
            logger.info(f"Added column {col_name} to {table}.")
        except Exception as e:
            logger.warning(f"Could not add column {col_name} to {table}: {e}")


def _apply_operations_module_migrations(conn, inspector, dialect_name: str) -> None:
    """
    Columns for bookings, appointments, plan benefits, receipts/refunds and lifecycle messages
    (2026-10). New tables (class_sessions, coupons, refunds, …) come from create_all. Additive only.
    """
    is_pg = "postgres" in dialect_name
    json_type = "JSONB" if is_pg else "TEXT"
    tz_ts = "TIMESTAMP WITH TIME ZONE" if is_pg else "TIMESTAMP"
    _add_missing_columns(conn, inspector, "membership_plans", [
        ("access_rules", "TEXT"),
        ("class_credits", "INTEGER"),
        ("guest_passes", "INTEGER"),
    ])
    _add_missing_columns(conn, inspector, "classes", [
        ("description", "TEXT"),
        ("branch_id", "VARCHAR(64)"),
        ("booking_open_hours", "INTEGER NOT NULL DEFAULT 168"),
        ("cancel_cutoff_hours", "INTEGER NOT NULL DEFAULT 2"),
        ("waitlist_enabled", "BOOLEAN NOT NULL DEFAULT TRUE"),
    ])
    _add_missing_columns(conn, inspector, "training_sessions", [
        ("source", "VARCHAR(20)"),
        ("booked_by_user_id", "VARCHAR(64)"),
        ("location", "VARCHAR(150)"),
        ("cancelled_at", tz_ts),
        ("cancelled_by_user_id", "VARCHAR(64)"),
        ("cancel_reason", "VARCHAR(255)"),
    ])
    _add_missing_columns(conn, inspector, "payments", [
        ("receipt_number", "VARCHAR(40)"),
        ("refunded_amount", "FLOAT NOT NULL DEFAULT 0"),
        ("recorded_by_user_id", "VARCHAR(64)"),
        ("notes", "TEXT"),
    ])
    _add_missing_columns(conn, inspector, "notification_deliveries", [
        ("subject", "VARCHAR(255)"),
        ("body", "TEXT"),
        ("provider_template_name", "VARCHAR(150)"),
        ("template_params", json_type),
    ])
    _add_missing_columns(conn, inspector, "gym_subscriptions", [
        ("custom_grace_days", "INTEGER"),
        ("custom_ai_daily_calls", "INTEGER"),
    ])
    for statement in (
        "CREATE INDEX IF NOT EXISTS ix_payments_receipt_number ON payments (receipt_number)",
    ):
        try:
            if is_pg:
                with conn.begin_nested():
                    conn.execute(text(statement))
            else:
                conn.execute(text(statement))
        except Exception as e:
            logger.warning(f"Index statement skipped ({statement}): {e}")


def _apply_identity_and_onboarding_migrations(conn, inspector, dialect_name: str) -> None:
    """
    Unified identity, phone OTP, onboarding and branch columns. Additive only:
    existing rows keep their data, and backfills only fill NULL/default values.
    """
    is_pg = "postgres" in dialect_name
    false_default = "BOOLEAN NOT NULL DEFAULT FALSE"
    # First run of this migration on a pre-existing database (users table without the new column).
    first_identity_run = inspector.has_table("users") and "email_verified" not in {
        col["name"] for col in inspector.get_columns("users")
    }

    _add_missing_columns(conn, inspector, "users", [
        ("phone_e164", "VARCHAR(20)"),
        ("phone_verified", false_default),
        ("email_verified", false_default),
    ])
    _add_missing_columns(conn, inspector, "workspaces", [
        ("address_line2", "VARCHAR(255)"),
        ("state", "VARCHAR(100)"),
        ("postal_code", "VARCHAR(20)"),
        ("country_code", "VARCHAR(2)"),
        ("timezone", "VARCHAR(64)"),
        ("currency", "VARCHAR(3)"),
        ("locale", "VARCHAR(16)"),
        ("opening_hours", "TEXT"),
        ("closed_dates", "TEXT"),
        # Sales demo gym (scripts/seed_demo.py): outbound messages and risky actions are blocked.
        ("is_demo", false_default),
    ])
    _add_missing_columns(conn, inspector, "gym_locations", [
        ("address_line2", "VARCHAR(255)"),
        ("city", "VARCHAR(100)"),
        ("state", "VARCHAR(100)"),
        ("postal_code", "VARCHAR(20)"),
        ("country_code", "VARCHAR(2)"),
        ("phone", "VARCHAR(20)"),
        ("email", "VARCHAR(255)"),
        ("timezone", "VARCHAR(64)"),
        ("opening_hours", "TEXT"),
        ("is_primary", false_default),
    ])
    _add_missing_columns(conn, inspector, "attendance", [
        ("recorded_by_user_id", "VARCHAR(64)"),
        ("checked_out_by_user_id", "VARCHAR(64)"),
        ("override_reason", "VARCHAR(500)"),
        ("corrected_at", "TIMESTAMP"),
    ])
    _add_missing_columns(conn, inspector, "attendance_settings", [
        ("require_active_membership", "BOOLEAN NOT NULL DEFAULT TRUE"),
        ("expiry_grace_days", "INTEGER NOT NULL DEFAULT 0"),
        ("max_visits_per_day", "INTEGER NOT NULL DEFAULT 0"),
        ("block_on_overdue_invoice", "BOOLEAN NOT NULL DEFAULT TRUE"),
    ])
    _add_missing_columns(conn, inspector, "trainers", [
        ("max_active_clients", "INTEGER"),
    ])
    _add_missing_columns(conn, inspector, "audit_logs", [
        ("resource_type", "VARCHAR(50)"),
        ("resource_id", "VARCHAR(64)"),
        ("outcome", "VARCHAR(20)"),
    ])
    _add_missing_columns(conn, inspector, "gym_invitations", [
        ("branch_ids", "TEXT"),
        ("accepted_user_id", "VARCHAR(64)"),
    ])

    # Unique/lookup indexes. Created only when existing data allows it.
    statements = [
        "CREATE UNIQUE INDEX IF NOT EXISTS uq_users_phone_e164 ON users (phone_e164)",
        "CREATE UNIQUE INDEX IF NOT EXISTS uq_gym_location_ws_code ON gym_locations (workspace_id, code)",
        # One open visit per person. Skipped (with a warning) if existing data has duplicate open visits;
        # run the auto-checkout or close them before restarting.
        "CREATE UNIQUE INDEX IF NOT EXISTS uq_attendance_open_member ON attendance (workspace_id, member_id) "
        "WHERE check_out_time IS NULL AND member_id IS NOT NULL",
        "CREATE UNIQUE INDEX IF NOT EXISTS uq_attendance_open_trainer ON attendance (workspace_id, trainer_id) "
        "WHERE check_out_time IS NULL AND trainer_id IS NOT NULL",
        "CREATE INDEX IF NOT EXISTS ix_audit_logs_resource_type ON audit_logs (resource_type)",
        "CREATE INDEX IF NOT EXISTS ix_audit_logs_resource_id ON audit_logs (resource_id)",
        # Composite indexes for hot dashboard/report filters (2026-10).
        "CREATE INDEX IF NOT EXISTS ix_members_ws_status ON members (workspace_id, status)",
        "CREATE INDEX IF NOT EXISTS ix_members_ws_joined ON members (workspace_id, joined_date)",
        "CREATE INDEX IF NOT EXISTS ix_memberships_ws_member_status ON memberships (workspace_id, member_id, status)",
        "CREATE INDEX IF NOT EXISTS ix_memberships_ws_status_end ON memberships (workspace_id, status, end_date)",
        "CREATE INDEX IF NOT EXISTS ix_notifications_ws_user_read ON notifications (workspace_id, user_id, is_read, created_at)",
        "CREATE INDEX IF NOT EXISTS ix_audit_logs_ws_created ON audit_logs (workspace_id, created_at)",
        "CREATE INDEX IF NOT EXISTS ix_workspace_members_ws_role_active ON workspace_members (workspace_id, role, is_active)",
        "CREATE INDEX IF NOT EXISTS ix_subscription_payments_status_created ON subscription_payments (status, created_at)",
        "CREATE INDEX IF NOT EXISTS ix_gym_subscriptions_status ON gym_subscriptions (status)",
        "CREATE INDEX IF NOT EXISTS ix_payments_ws_created ON payments (workspace_id, created_at)",
    ]
    for stmt in statements:
        try:
            with conn.begin_nested():
                conn.execute(text(stmt))
        except Exception as e:
            logger.warning(f"Skipped index ({stmt}): {e}")

    # Existing accounts were admitted by the previous email-based flows (email OTP
    # registration, emailed invitations, Google). Treat emails of users that already
    # belong to a workspace as verified so Google sign-in keeps resolving to the same
    # account after this release. New accounts start unverified.
    try:
        with conn.begin_nested():
            conn.execute(text(
                "UPDATE users SET email = LOWER(TRIM(email)) WHERE email <> LOWER(TRIM(email)) "
                "AND NOT EXISTS (SELECT 1 FROM users u2 WHERE u2.email = LOWER(TRIM(users.email)) AND u2.id <> users.id)"
            ))
            conn.execute(text(
                "UPDATE users SET email_verified = TRUE WHERE email_verified = FALSE AND "
                "(is_superadmin = TRUE OR EXISTS (SELECT 1 FROM workspace_members wm WHERE wm.user_id = users.id))"
            ))
            conn.execute(text(
                "UPDATE workspaces SET country_code = 'IN' WHERE country_code IS NULL AND (country IS NULL OR country = 'India')"
            ))
            conn.execute(text(
                "UPDATE gym_locations SET is_primary = TRUE WHERE code = 'MAIN' AND NOT EXISTS "
                "(SELECT 1 FROM gym_locations g2 WHERE g2.workspace_id = gym_locations.workspace_id AND g2.is_primary = TRUE)"
            ))
            if first_identity_run:
                # Workspaces that existed before the server-side onboarding flow are already in
                # use (the old wizard could skip its completion call). Never push them back
                # through onboarding.
                conn.execute(text("UPDATE workspaces SET onboarding_completed = TRUE WHERE onboarding_completed = FALSE"))
    except Exception as e:
        logger.warning(f"Identity backfill skipped: {e}")

    if is_pg:
        # SQLAlchemy stores Enum member names; extend the native type for new invitation roles.
        for value in ("STAFF", "MANAGER", "ADMIN"):
            try:
                with conn.begin_nested():
                    conn.execute(text(f"ALTER TYPE invitationrole ADD VALUE IF NOT EXISTS '{value}'"))
            except Exception as e:
                logger.warning(f"Could not extend invitationrole enum with {value}: {e}")
        # Account statuses for members (memberships share the same enum type).
        for value in ("INACTIVE", "ARCHIVED"):
            try:
                with conn.begin_nested():
                    conn.execute(text(f"ALTER TYPE memberstatus ADD VALUE IF NOT EXISTS '{value}'"))
            except Exception as e:
                logger.warning(f"Could not extend memberstatus enum with {value}: {e}")


def sync_plan_catalog() -> None:
    """Adds new default plans/feature keys to existing catalogs without touching admin-edited prices or flags."""
    from app.core.database import SessionLocal
    from app.services.billing import BillingService

    db = SessionLocal()
    try:
        BillingService.ensure_default_plans(db)
    except Exception as e:
        db.rollback()
        logger.warning(f"Plan catalog sync skipped: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    run_database_migrations()
    print("[SUCCESS] Database migrations completed successfully.")
