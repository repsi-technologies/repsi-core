"""CORS origins may be set as a comma list or a JSON list in the environment."""
import pytest

from app.core.config import Settings


@pytest.mark.parametrize("raw,expected", [
    ("http://localhost:3000,https://repsi.app", ["http://localhost:3000", "https://repsi.app"]),
    ('["https://repsi.app"]', ["https://repsi.app"]),
    ("", []),
])
def test_cors_origins_env_formats(monkeypatch, raw, expected):
    monkeypatch.setenv("BACKEND_CORS_ORIGINS", raw)
    assert Settings().BACKEND_CORS_ORIGINS == expected
