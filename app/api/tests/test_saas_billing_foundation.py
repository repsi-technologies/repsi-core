"""Stage 2: saas_* schema, migrations, invoice numbering, calendar math, existing-gym backfill, DB guard."""
import uuid
from datetime import datetime, timedelta, timezone

import pytest
from sqlalchemy import create_engine, inspect
from sqlalchemy.exc import IntegrityError

from app.models.billing import GymSubscription, SubscriptionPlan
from app.models.saas import (
    SaasAudit, SaasEntitlement, SaasInvoice, SaasOrder, SaasPlan, SaasPlanPrice, SaasSubscription, SaasWebhookEvent,
)
from app.models.user import User, UserRole, Workspace, WorkspaceMember
from app.services.billing import BillingService
from app.services.saas_billing import (
    add_months, allocate_invoice_number, backfill_subscriptions, fiscal_year, plan_backfill_row,
)
from tests.db_guard import UnsafeTestDatabase, assert_disposable_database

UTC = timezone.utc
NOW = datetime(2026, 11, 1, 12, 0, tzinfo=UTC)
LAUNCH = datetime(2026, 12, 1, tzinfo=UTC)

SAAS_TABLES = {
    "saas_plan", "saas_plan_price", "saas_entitlement", "saas_subscription", "saas_order",
    "saas_payment_attempt", "saas_webhook_event", "saas_invoice", "saas_invoice_counter", "saas_audit",
    "saas_refund", "saas_handoff_token",
}


@pytest.fixture
def db():
    from tests.conftest import TestingSessionLocal
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.rollback()
        session.close()


def _growth(db) -> SaasPlan:
    plan = db.query(SaasPlan).filter_by(code="growth").first()
    if plan is None:
        plan = SaasPlan(code="growth", name="Growth", rank=20)
        db.add(plan)
        db.commit()
    return plan


def _workspace(db, with_owner: bool = True) -> Workspace:
    ws = Workspace(id=f"ws_{uuid.uuid4().hex[:10]}", name="Gym", slug=f"gym-{uuid.uuid4().hex[:10]}", is_active=True)
    db.add(ws)
    if with_owner:
        user = User(id=f"u_{uuid.uuid4().hex[:10]}", email=f"{uuid.uuid4().hex[:8]}@example.test", full_name="Owner", hashed_password="x")
        db.add(user)
        db.flush()
        db.add(WorkspaceMember(workspace_id=ws.id, user_id=user.id, role=UserRole.OWNER, is_active=True))
    db.commit()
    return ws


def _legacy(db, ws, **fields) -> GymSubscription:
    BillingService.ensure_default_plans(db)
    plan = db.query(SubscriptionPlan).filter_by(code=fields.pop("plan_code", "growth")).one()
    sub = GymSubscription(id=str(uuid.uuid4()), workspace_id=ws.id, plan_id=plan.id, **fields)
    db.add(sub)
    db.commit()
    return sub


# --- schema and migrations -------------------------------------------------------------------

def test_migrations_create_saas_tables_additively_and_are_repeatable(tmp_path, monkeypatch):
    import app.core.migrations as migrations

    engine = create_engine(f"sqlite:///{tmp_path / 'migrate_test.db'}")
    monkeypatch.setattr(migrations, "engine", engine)
    monkeypatch.setattr(migrations, "sync_plan_catalog", lambda: None)
    monkeypatch.setattr(migrations, "_seed_global_exercises", lambda: None)

    migrations.run_database_migrations()
    migrations.run_database_migrations()  # second run must be a no-op, not an error

    tables = set(inspect(engine).get_table_names())
    assert SAAS_TABLES <= tables
    # Legacy billing and gym-member payment tables are kept.
    assert {"subscription_plans", "gym_subscriptions", "billing_invoices", "payments", "memberships"} <= tables
    money_cols = {c["name"]: c for c in inspect(engine).get_columns("saas_order")}
    assert "INT" in str(money_cols["amount_minor"]["type"]).upper()
    engine.dispose()


def test_price_is_unique_per_plan_cycle_currency(db):
    plan = SaasPlan(code=f"p_{uuid.uuid4().hex[:6]}", name="P")
    db.add(plan)
    db.flush()
    db.add(SaasPlanPrice(plan_id=plan.id, billing_cycle="monthly", period_months=1, currency="INR", amount_minor=99900))
    db.flush()
    db.add(SaasPlanPrice(plan_id=plan.id, billing_cycle="monthly", period_months=1, currency="INR", amount_minor=1))
    with pytest.raises(IntegrityError):
        db.flush()


@pytest.mark.parametrize("bad", [
    {"billing_cycle": "weekly"}, {"currency": "JPY"}, {"amount_minor": -1}, {"period_months": 0},
])
def test_price_constraints_reject_bad_values(db, bad):
    plan = SaasPlan(code=f"p_{uuid.uuid4().hex[:6]}", name="P")
    db.add(plan)
    db.flush()
    row = dict(plan_id=plan.id, billing_cycle="monthly", period_months=1, currency="INR", amount_minor=100) | bad
    db.add(SaasPlanPrice(**row))
    with pytest.raises(IntegrityError):
        db.flush()


def test_subscription_one_per_workspace_and_status_checked(db):
    ws, plan = _workspace(db), _growth(db)
    db.add(SaasSubscription(workspace_id=ws.id, plan_id=plan.id, status="cancelled"))
    with pytest.raises(IntegrityError):
        db.flush()
    db.rollback()
    db.add(SaasSubscription(workspace_id=ws.id, plan_id=plan.id))
    db.flush()
    db.add(SaasSubscription(workspace_id=ws.id, plan_id=plan.id))
    with pytest.raises(IntegrityError):
        db.flush()


def test_founder_override_needs_currency(db):
    ws, plan = _workspace(db), _growth(db)
    db.add(SaasSubscription(workspace_id=ws.id, plan_id=plan.id, price_override_minor=49900))
    with pytest.raises(IntegrityError):
        db.flush()


def test_order_idempotency_key_unique_within_workspace(db):
    ws, plan = _workspace(db), _growth(db)
    sub = SaasSubscription(workspace_id=ws.id, plan_id=plan.id)
    db.add(sub)
    db.flush()

    def order(ref):
        return SaasOrder(workspace_id=ws.id, subscription_id=sub.id, order_ref=ref, kind="new", plan_id=plan.id,
                         billing_cycle="monthly", period_months=1, currency="INR", amount_minor=99900,
                         idempotency_key="click-1")
    db.add(order(f"o_{uuid.uuid4().hex[:8]}"))
    db.flush()
    db.add(order(f"o_{uuid.uuid4().hex[:8]}"))
    with pytest.raises(IntegrityError):
        db.flush()


def test_webhook_event_id_unique_per_provider(db):
    eid = f"evt_{uuid.uuid4().hex[:8]}"
    db.add(SaasWebhookEvent(provider="cashfree", event_id=eid, event_type="PAYMENT_SUCCESS_WEBHOOK", raw_body="{}"))
    db.flush()
    db.add(SaasWebhookEvent(provider="cashfree", event_id=eid, event_type="PAYMENT_SUCCESS_WEBHOOK", raw_body="{}"))
    with pytest.raises(IntegrityError):
        db.flush()


def test_entitlement_kind_checked(db):
    plan = _growth(db)
    db.add(SaasEntitlement(plan_id=plan.id, key=f"k_{uuid.uuid4().hex[:6]}", kind="quota", int_value=1))
    with pytest.raises(IntegrityError):
        db.flush()


# --- calendar and invoices -------------------------------------------------------------------

@pytest.mark.parametrize("start,months,expected", [
    (datetime(2027, 1, 31, tzinfo=UTC), 1, datetime(2027, 2, 28, tzinfo=UTC)),
    (datetime(2028, 1, 31, tzinfo=UTC), 1, datetime(2028, 2, 29, tzinfo=UTC)),
    (datetime(2026, 8, 31, tzinfo=UTC), 6, datetime(2027, 2, 28, tzinfo=UTC)),
    (datetime(2026, 11, 15, tzinfo=UTC), 12, datetime(2027, 11, 15, tzinfo=UTC)),
    (datetime(2026, 3, 31, tzinfo=UTC), 3, datetime(2026, 6, 30, tzinfo=UTC)),
])
def test_add_months_clamps_to_month_end(start, months, expected):
    assert add_months(start, months) == expected


def test_fiscal_year_uses_india_time():
    assert fiscal_year(datetime(2026, 4, 1, 0, 0, tzinfo=UTC)) == "26-27"
    assert fiscal_year(datetime(2027, 3, 31, 18, 29, tzinfo=UTC)) == "26-27"  # 23:59 IST
    assert fiscal_year(datetime(2027, 3, 31, 18, 31, tzinfo=UTC)) == "27-28"  # 00:01 IST, 1 April
    assert fiscal_year(datetime(2099, 6, 1, tzinfo=UTC)) == "99-00"


def test_invoice_numbers_are_sequential_per_fiscal_year(db):
    first, fy, seq = allocate_invoice_number(db, datetime(2031, 5, 1, tzinfo=UTC))
    second, _, seq2 = allocate_invoice_number(db, datetime(2031, 6, 1, tzinfo=UTC))
    other_fy, fy2, seq3 = allocate_invoice_number(db, datetime(2032, 4, 2, tzinfo=UTC))
    db.commit()
    assert (first, fy, seq) == ("RP/31-32/000001", "31-32", 1)
    assert (second, seq2) == ("RP/31-32/000002", 2)
    assert (other_fy, fy2, seq3) == ("RP/32-33/000001", "32-33", 1)
    assert len(first) <= 16


def test_invoice_number_column_rejects_duplicates(db):
    ws, plan = _workspace(db), _growth(db)
    sub = SaasSubscription(workspace_id=ws.id, plan_id=plan.id)
    db.add(sub)
    db.flush()
    orders = []
    for _ in range(2):
        o = SaasOrder(workspace_id=ws.id, subscription_id=sub.id, order_ref=f"o_{uuid.uuid4().hex[:8]}", kind="new",
                      plan_id=plan.id, billing_cycle="monthly", period_months=1, currency="INR", amount_minor=100,
                      idempotency_key=uuid.uuid4().hex)
        db.add(o)
        orders.append(o)
    db.flush()
    for o in orders:
        db.add(SaasInvoice(workspace_id=ws.id, order_id=o.id, invoice_number="RP/40-41/000001", fiscal_year="40-41",
                           sequence=1, amount_minor=100, currency="INR", issued_at=NOW))
    with pytest.raises(IntegrityError):
        db.flush()


# --- backfill ---------------------------------------------------------------------------------

def test_backfill_rules_for_each_legacy_state(db):
    grandfather_end = LAUNCH + timedelta(days=60)

    class Legacy:
        def __init__(self, **kw):
            self.status, self.is_complimentary, self.complimentary_until = "trialing", False, None
            self.current_period_end = self.trial_ends_at = self.trial_end = None
            self.billing_cycle = "monthly"
            self.__dict__.update(kw)

    assert plan_backfill_row(None, LAUNCH, NOW)["trial_ends_at"] == grandfather_end
    assert plan_backfill_row(Legacy(status="expired"), LAUNCH, NOW)["status"] == "trialing"
    assert plan_backfill_row(Legacy(status="suspended"), LAUNCH, NOW)["status"] == "suspended"
    late_trial = datetime(2027, 6, 1)  # naive, as legacy rows store it
    assert plan_backfill_row(Legacy(trial_ends_at=late_trial), LAUNCH, NOW)["trial_ends_at"] == late_trial.replace(tzinfo=UTC)
    comp = plan_backfill_row(Legacy(is_complimentary=True), LAUNCH, NOW)
    assert (comp["status"], comp["paid_until"], comp["is_complimentary"]) == ("active", None, True)
    lapsed_comp = plan_backfill_row(Legacy(is_complimentary=True, complimentary_until=datetime(2026, 1, 1)), LAUNCH, NOW)
    assert lapsed_comp["status"] == "trialing"
    paid = plan_backfill_row(Legacy(status="active", current_period_end=datetime(2027, 3, 1)), LAUNCH, NOW)
    assert (paid["status"], paid["paid_until"]) == ("active", datetime(2027, 3, 1, tzinfo=UTC))
    stale_paid = plan_backfill_row(Legacy(status="active", current_period_end=datetime(2026, 1, 1)), LAUNCH, NOW)
    assert stale_paid["status"] == "trialing"


def test_backfill_dry_run_writes_nothing_and_apply_is_idempotent(db):
    _growth(db)
    plain, paid, owner_less = _workspace(db), _workspace(db), _workspace(db, with_owner=False)
    _legacy(db, paid, plan_code="pro", status="active", current_period_end=datetime(2027, 2, 1))
    mine = {plain.id, paid.id, owner_less.id}

    dry = backfill_subscriptions(db, LAUNCH, now=NOW, dry_run=True)
    assert {r["workspace_id"] for r in dry["rows"]} >= mine
    assert db.query(SaasSubscription).filter(SaasSubscription.workspace_id.in_(mine)).count() == 0

    applied = backfill_subscriptions(db, LAUNCH, now=NOW, dry_run=False)
    by_ws = {s.workspace_id: s for s in db.query(SaasSubscription).filter(SaasSubscription.workspace_id.in_(mine))}
    assert len(by_ws) == 3
    assert by_ws[plain.id].status == "trialing" and by_ws[plain.id].is_grandfathered
    assert by_ws[plain.id].trial_owner_user_id is not None
    assert by_ws[owner_less.id].trial_owner_user_id is None
    paid_sub = by_ws[paid.id]
    assert paid_sub.status == "active" and paid_sub.billing_cycle == "monthly"
    # Legacy plan code without a matching saas_plan falls back to Growth rather than failing.
    expected_plan = db.query(SaasPlan).filter_by(code="pro").first() or _growth(db)
    assert paid_sub.plan_id == expected_plan.id
    audits = db.query(SaasAudit).filter(SaasAudit.workspace_id.in_(mine), SaasAudit.action == "backfill").count()
    assert audits == 3
    assert not any(r["workspace_id"] in mine for r in backfill_subscriptions(db, LAUNCH, now=NOW, dry_run=False)["rows"])
    assert db.query(SaasSubscription).filter(SaasSubscription.workspace_id.in_(mine)).count() == 3
    # Legacy row untouched.
    assert db.query(GymSubscription).filter_by(workspace_id=paid.id).one().status == "active"
    assert applied["counts"]["paid"] >= 1


def test_backfill_requires_growth_plan(db, monkeypatch):
    from app.services import saas_billing
    monkeypatch.setattr(saas_billing, "GRANDFATHER_PLAN_CODE", "does-not-exist")
    with pytest.raises(RuntimeError, match="plan sync"):
        backfill_subscriptions(db, LAUNCH, now=NOW)


# --- disposable database guard -----------------------------------------------------------------

@pytest.mark.parametrize("url", [
    "sqlite:///:memory:", "sqlite://", "sqlite:///./repsi_test.db",
    "postgresql://repsi@localhost:5432/repsi_test", "postgresql+psycopg://u:p@127.0.0.1/x_test",
])
def test_db_guard_allows_disposable(url):
    assert_disposable_database(url)


@pytest.mark.parametrize("url", [
    "sqlite:///./repsi.db", "postgresql://u:p@db.example.com/repsi_test",
    "postgresql://u:p@localhost/repsi", "postgresql://u:p@10.0.0.5/repsi_test",
])
def test_db_guard_refuses_everything_else(url):
    with pytest.raises(UnsafeTestDatabase):
        assert_disposable_database(url)
