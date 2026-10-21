import os

# Tests must never read a developer's .env (which may point at a real database or set
# ENVIRONMENT=production). Real environment variables take precedence over .env files.
os.environ["ENVIRONMENT"] = "test"
os.environ["DATABASE_URL"] = "sqlite:///:memory:"
os.environ["OTP_PROVIDER"] = "test"
os.environ["OTP_TEST_CODE"] = "123456"
os.environ["GOOGLE_CLIENT_ID"] = "test-google-client-id"
os.environ["SMTP_USER"] = ""
os.environ["SMTP_PASSWORD"] = ""
os.environ["SECRET_KEY"] = "test-secret-key-that-is-long-enough-for-hs256-signing"

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.core.database import Base, get_db
import app.models
from app.main import app as fastapi_app

TEST_DATABASE_URL = "sqlite:///:memory:"
test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
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
