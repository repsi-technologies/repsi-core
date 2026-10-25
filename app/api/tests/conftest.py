import os

# Tests must never read a developer's .env (which may point at a real database or set
# ENVIRONMENT=production). Real environment variables take precedence over .env files.
os.environ["ENVIRONMENT"] = "test"
# A local Postgres can be used via REPSI_TEST_DATABASE_URL; db_guard refuses anything not disposable.
TEST_DATABASE_URL = os.environ.get("REPSI_TEST_DATABASE_URL", "sqlite:///:memory:")
from tests.db_guard import UnsafeTestDatabase, assert_disposable_database  # noqa: E402
try:
    assert_disposable_database(TEST_DATABASE_URL)
except UnsafeTestDatabase as e:
    raise SystemExit(f"Refusing to run tests: {e}")
os.environ["DATABASE_URL"] = TEST_DATABASE_URL
os.environ["OTP_PROVIDER"] = "test"
os.environ["OTP_TEST_CODE"] = "123456"
os.environ["GOOGLE_CLIENT_ID"] = "test-google-client-id"
os.environ["SMTP_USER"] = ""
os.environ["SMTP_PASSWORD"] = ""
# Never reach a real WhatsApp provider from tests, whatever the developer .env holds.
os.environ["AISENSY_API_KEY"] = ""
os.environ["GEMINI_API_KEY"] = ""  # AI tests mock the HTTP boundary
# Images use local storage unless a test mocks the Cloudinary boundary.
os.environ["CLOUDINARY_URL"] = ""
os.environ["CLOUDINARY_CLOUD_NAME"] = ""
# Caching is exercised in its own tests; elsewhere every read must see the latest writes.
os.environ["CACHE_ENABLED"] = "false"
os.environ["SECRET_KEY"] = "test-secret-key-that-is-long-enough-for-hs256-signing"

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.core.database import Base, get_db
import app.models
from app.main import app as fastapi_app

test_engine = (
    create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False}, poolclass=StaticPool)
    if TEST_DATABASE_URL.startswith("sqlite")
    else create_engine(TEST_DATABASE_URL)
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(scope="session", autouse=True)
def setup_database():
    Base.metadata.create_all(bind=test_engine)
    fastapi_app.dependency_overrides[get_db] = override_get_db
    yield
    Base.metadata.drop_all(bind=test_engine)
    fastapi_app.dependency_overrides.clear()


@pytest.fixture(autouse=True)
def _reset_rate_limits():
    from app.core.rate_limit import reset_rate_limits
    reset_rate_limits()
    yield


def give_active_membership(workspace_id: str, member_id: str, months: int = 1):
    """Test helper: gives a member a paid-up active membership covering today (check-in requires one)."""
    from datetime import date, timedelta
    from app.models.member import Membership, MembershipPlan, MemberStatus

    db = TestingSessionLocal()
    try:
        plan = MembershipPlan(workspace_id=workspace_id, name=f"Test Plan {member_id[:6]}", duration_months=months, price=1000.0)
        db.add(plan)
        db.flush()
        db.add(Membership(
            workspace_id=workspace_id, member_id=member_id, plan_id=plan.id,
            start_date=date.today() - timedelta(days=1), end_date=date.today() + timedelta(days=30 * months),
            status=MemberStatus.ACTIVE, price_paid=1000.0,
        ))
        db.commit()
    finally:
        db.close()
