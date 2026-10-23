"""
Back up the REPSI database and private uploads.

    python -m scripts.backup                     # dump DB + archive private_storage into ./backups
    python -m scripts.backup --label pre-deploy  # name the backup
    python -m scripts.backup --prune-days 30     # also delete local backups older than 30 days
    python -m scripts.backup --upload            # also copy to the S3 bucket (STORAGE_S3_*; needs boto3)

PostgreSQL uses `pg_dump -Fc` (custom format, restore with pg_restore); SQLite uses the online
backup API, so a running app is fine. The password is passed through PGPASSWORD, never on the
command line or in logs. Restore steps: docs/RUNBOOK_BACKUP_RESTORE.md.
"""
import argparse
import hashlib
import json
import os
import shutil
import sqlite3
import subprocess
import sys
import tarfile
from datetime import datetime, timedelta, timezone
from pathlib import Path
from urllib.parse import unquote, urlparse

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.config import settings  # noqa: E402
from app.core.storage import LOCAL_ROOT  # noqa: E402

DEFAULT_DIR = Path(os.getenv("BACKUP_DIR", Path(__file__).resolve().parents[1] / "backups"))


def _sha256(path: Path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as fh:
        for chunk in iter(lambda: fh.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def dump_database(target_dir: Path, stamp: str) -> Path:
    url = settings.DATABASE_URL
    if url.startswith("sqlite"):
        src = url.split("///", 1)[1] if "///" in url else ""
        if not src or src == ":memory:":
            raise SystemExit("Nothing to back up: in-memory SQLite.")
        out = target_dir / f"repsi-{stamp}.sqlite3"
        with sqlite3.connect(src) as source, sqlite3.connect(out) as dest:
            source.backup(dest)
        return out
    parsed = urlparse(url.replace("postgresql+psycopg2://", "postgresql://"))
    if shutil.which("pg_dump") is None:
        raise SystemExit("pg_dump is not installed (apt-get install postgresql-client).")
    out = target_dir / f"repsi-{stamp}.dump"
    env = {**os.environ, "PGPASSWORD": unquote(parsed.password or "")}
    query = dict(p.split("=", 1) for p in (parsed.query or "").split("&") if "=" in p)
    if query.get("sslmode"):
        env["PGSSLMODE"] = query["sslmode"]
    cmd = ["pg_dump", "-Fc", "--no-owner", "--no-privileges", "-f", str(out),
           "-h", parsed.hostname or "localhost", "-p", str(parsed.port or 5432),
           "-U", unquote(parsed.username or ""), parsed.path.lstrip("/")]
    subprocess.run(cmd, check=True, env=env)
    return out


def archive_uploads(target_dir: Path, stamp: str) -> Path | None:
    root = Path(LOCAL_ROOT)
    if settings.STORAGE_BACKEND.lower() != "local" or not root.exists():
        return None  # S3 buckets have their own versioning / lifecycle rules
    out = target_dir / f"private_storage-{stamp}.tar.gz"
    with tarfile.open(out, "w:gz") as tar:
        tar.add(root, arcname="private_storage")
    return out


def upload(paths: list[Path]) -> list[str]:
    try:
        import boto3
    except ImportError:
        raise SystemExit("--upload needs boto3 (pip install boto3).")
    if not settings.STORAGE_S3_BUCKET:
        raise SystemExit("--upload needs STORAGE_S3_BUCKET and credentials.")
    s3 = boto3.client("s3", endpoint_url=settings.STORAGE_S3_ENDPOINT_URL or None,
                      region_name=settings.STORAGE_S3_REGION or None,
                      aws_access_key_id=settings.STORAGE_S3_ACCESS_KEY_ID,
                      aws_secret_access_key=settings.STORAGE_S3_SECRET_ACCESS_KEY)
    keys = []
    for p in paths:
        key = f"backups/{p.name}"
        s3.upload_file(str(p), settings.STORAGE_S3_BUCKET, key, ExtraArgs={"ServerSideEncryption": "AES256"})
        keys.append(key)
    return keys


def prune(target_dir: Path, days: int) -> int:
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    removed = 0
    for p in target_dir.glob("*"):
        if p.is_file() and datetime.fromtimestamp(p.stat().st_mtime, timezone.utc) < cutoff:
            p.unlink()
            removed += 1
    return removed


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--dir", type=Path, default=DEFAULT_DIR)
    parser.add_argument("--label", default="scheduled")
    parser.add_argument("--prune-days", type=int, default=0)
    parser.add_argument("--upload", action="store_true")
    args = parser.parse_args()

    args.dir.mkdir(parents=True, exist_ok=True)
    stamp = f"{datetime.now(timezone.utc):%Y%m%dT%H%M%SZ}-{''.join(c for c in args.label if c.isalnum() or c in '-_')[:40]}"
    files = [dump_database(args.dir, stamp)]
    uploads = archive_uploads(args.dir, stamp)
    if uploads:
        files.append(uploads)
    manifest = {"created_at": datetime.now(timezone.utc).isoformat(), "label": args.label,
                "environment": settings.ENVIRONMENT,
                "files": [{"name": f.name, "bytes": f.stat().st_size, "sha256": _sha256(f)} for f in files]}
    manifest_path = args.dir / f"manifest-{stamp}.json"
    manifest_path.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    files.append(manifest_path)
    if args.upload:
        manifest["uploaded"] = upload(files)
    if args.prune_days:
        manifest["pruned"] = prune(args.dir, args.prune_days)
    print(json.dumps(manifest, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
