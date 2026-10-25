"""
Private file storage behind one interface.

STORAGE_BACKEND=local (default) keeps files under app/api/private_storage. STORAGE_BACKEND=s3 uses any
S3-compatible bucket (AWS S3, Cloudflare R2, MinIO) through boto3, which is an optional dependency:
if it is missing or the bucket settings are empty, storage calls raise StorageNotConfigured instead
of silently writing to local disk. Files are never served by public URL; API endpoints stream them
after their own access checks.
"""
from __future__ import annotations

import logging
import os
import re
from typing import Optional

from app.core.config import settings

logger = logging.getLogger(__name__)

LOCAL_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "private_storage"))
_KEY_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._/-]{0,250}$")


class StorageNotConfigured(RuntimeError):
    pass


def detect_mime_type(data: bytes) -> Optional[str]:
    """Content type from magic bytes, so a renamed executable is never accepted as an image or PDF."""
    if data.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"
    if data.startswith(b"\xff\xd8\xff"):
        return "image/jpeg"
    if len(data) >= 12 and data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "image/webp"
    if data.startswith(b"%PDF-"):
        return "application/pdf"
    return None


def _check_key(key: str) -> str:
    if not _KEY_RE.match(key) or ".." in key or key.startswith("/"):
        raise ValueError("Invalid storage key")
    return key


class LocalStorage:
    name = "local"

    def __init__(self, root: str = LOCAL_ROOT):
        self.root = root

    def _path(self, key: str) -> str:
        path = os.path.abspath(os.path.join(self.root, _check_key(key)))
        if not path.startswith(os.path.abspath(self.root) + os.sep):
            raise ValueError("Invalid storage key")
        return path

    def put(self, key: str, data: bytes, content_type: str) -> None:
        path = self._path(key)
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "wb") as fh:
            fh.write(data)

    def get(self, key: str) -> Optional[bytes]:
        path = self._path(key)
        if not os.path.isfile(path):
            return None
        with open(path, "rb") as fh:
            return fh.read()

    def delete(self, key: str) -> None:
        path = self._path(key)
        if os.path.isfile(path):
            os.remove(path)

    def health(self) -> dict:
        return {"backend": self.name, "status": "HEALTHY" if os.access(self.root, os.W_OK) or not os.path.exists(self.root) else "DEGRADED"}


class S3Storage:
    name = "s3"

    def __init__(self):
        if not (settings.STORAGE_S3_BUCKET and settings.STORAGE_S3_ACCESS_KEY_ID and settings.STORAGE_S3_SECRET_ACCESS_KEY):
            raise StorageNotConfigured("S3 storage needs STORAGE_S3_BUCKET, STORAGE_S3_ACCESS_KEY_ID and STORAGE_S3_SECRET_ACCESS_KEY.")
        try:
            import boto3  # type: ignore[import-untyped,import-not-found] # optional dependency
        except ImportError as exc:
            raise StorageNotConfigured("STORAGE_BACKEND=s3 requires the boto3 package.") from exc
        self.bucket = settings.STORAGE_S3_BUCKET
        self.prefix = settings.STORAGE_S3_PREFIX.strip("/")
        self.client = boto3.client(
            "s3",
            endpoint_url=settings.STORAGE_S3_ENDPOINT_URL or None,
            region_name=settings.STORAGE_S3_REGION or None,
            aws_access_key_id=settings.STORAGE_S3_ACCESS_KEY_ID,
            aws_secret_access_key=settings.STORAGE_S3_SECRET_ACCESS_KEY,
        )

    def _key(self, key: str) -> str:
        key = _check_key(key)
        return f"{self.prefix}/{key}" if self.prefix else key

    def put(self, key: str, data: bytes, content_type: str) -> None:
        self.client.put_object(Bucket=self.bucket, Key=self._key(key), Body=data, ContentType=content_type,
                               ServerSideEncryption="AES256")

    def get(self, key: str) -> Optional[bytes]:
        try:
            obj = self.client.get_object(Bucket=self.bucket, Key=self._key(key))
        except self.client.exceptions.NoSuchKey:
            return None
        return obj["Body"].read()

    def delete(self, key: str) -> None:
        self.client.delete_object(Bucket=self.bucket, Key=self._key(key))

    def health(self) -> dict:
        try:
            self.client.head_bucket(Bucket=self.bucket)
            return {"backend": self.name, "status": "HEALTHY"}
        except Exception as exc:  # pragma: no cover - needs a real bucket
            return {"backend": self.name, "status": "DEGRADED", "error": type(exc).__name__}


_storage = None


def get_storage():
    """The configured backend (created once per process)."""
    global _storage
    if _storage is None:
        backend = (settings.STORAGE_BACKEND or "local").lower()
        if backend == "s3":
            _storage = S3Storage()
        elif backend == "local":
            _storage = LocalStorage()
        else:
            raise StorageNotConfigured(f"Unknown STORAGE_BACKEND {settings.STORAGE_BACKEND!r}.")
    return _storage


def storage_health() -> dict:
    try:
        return get_storage().health()
    except StorageNotConfigured as exc:
        return {"backend": settings.STORAGE_BACKEND, "status": "NOT_CONFIGURED", "error": str(exc)}
