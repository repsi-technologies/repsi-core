"""Refuse to run tests against anything but a disposable database.

Allowed: in-memory SQLite, a SQLite file whose name ends in `_test`, or a server database on
localhost whose name ends in `_test` (e.g. postgresql://repsi@localhost/repsi_test).
"""
from pathlib import PurePath

from sqlalchemy.engine import make_url

LOCAL_HOSTS = {"localhost", "127.0.0.1", "::1"}


class UnsafeTestDatabase(RuntimeError):
    pass


def assert_disposable_database(url: str) -> None:
    parsed = make_url(url)
    name = parsed.database or ""
    if parsed.get_backend_name() == "sqlite":
        if name in ("", ":memory:") or PurePath(name).stem.endswith("_test"):
            return
        raise UnsafeTestDatabase("SQLite test database file name must end in _test.")
    if (parsed.host or "").lower() not in LOCAL_HOSTS:
        raise UnsafeTestDatabase("Test database host must be localhost.")
    if not name.endswith("_test"):
        raise UnsafeTestDatabase("Test database name must end in _test.")
