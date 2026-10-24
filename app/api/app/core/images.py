"""
Public images (gym logos, profile photos) behind one interface.

When Cloudinary is configured (CLOUDINARY_URL, or CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET) images are
uploaded there with a signed request and the stored URL is Cloudinary's HTTPS delivery URL. Otherwise
they go to the private storage backend (app/core/storage.py) and are streamed back by our own public
image endpoints, as before. Only content that is meant to be shown publicly belongs here: documents,
payment receipts and merchant QR codes stay in private storage.

Uploads and deletes call Cloudinary's REST API through httpx, so there is no SDK dependency. A failed
upload raises ImageUploadFailed; callers turn it into a 502 and never record a URL that wasn't stored.
"""
from __future__ import annotations

import hashlib
import logging
import re
import time
import uuid
from dataclasses import dataclass
from typing import Optional
from urllib.parse import urlparse

import httpx

from app.core.config import settings
from app.core.storage import detect_mime_type, get_storage

logger = logging.getLogger(__name__)

IMAGE_EXT = {"image/png": "png", "image/jpeg": "jpg", "image/webp": "webp"}
_FOLDER_RE = re.compile(r"^[a-z0-9_-]+(/[A-Za-z0-9_-]+)*$")


class ImageUploadFailed(RuntimeError):
    pass


@dataclass(frozen=True)
class CloudinaryConfig:
    cloud_name: str
    api_key: str
    api_secret: str
    folder: str


def cloudinary_config() -> Optional[CloudinaryConfig]:
    """The configured Cloudinary account, or None when images use the storage backend."""
    cloud, key, secret = settings.CLOUDINARY_CLOUD_NAME, settings.CLOUDINARY_API_KEY, settings.CLOUDINARY_API_SECRET
    if settings.CLOUDINARY_URL:
        parsed = urlparse(settings.CLOUDINARY_URL.strip())
        if parsed.scheme != "cloudinary" or not (parsed.hostname and parsed.username and parsed.password):
            raise ValueError("CLOUDINARY_URL must look like cloudinary://<api_key>:<api_secret>@<cloud_name>.")
        cloud, key, secret = parsed.hostname, parsed.username, parsed.password
    if not (cloud and key and secret):
        return None
    return CloudinaryConfig(cloud, key, secret, (settings.CLOUDINARY_FOLDER or "repsi").strip("/"))


def _sign(params: dict, secret: str) -> str:
    """Cloudinary request signature: sorted key=value pairs joined by '&', then the secret, SHA-1."""
    payload = "&".join(f"{k}={params[k]}" for k in sorted(params))
    return hashlib.sha1((payload + secret).encode("utf-8")).hexdigest()


def validate_image(data: bytes, max_bytes: int, label: str) -> str:
    """Magic-byte check and size cap shared by every public image upload. Returns the MIME type."""
    from fastapi import HTTPException

    if not data:
        raise HTTPException(status_code=400, detail="Choose an image to upload.")
    if len(data) > max_bytes:
        raise HTTPException(status_code=413, detail=f"{label} must be {max_bytes // (1024 * 1024)} MB or smaller.")
    mime = detect_mime_type(data)
    if mime not in IMAGE_EXT:
        raise HTTPException(status_code=415, detail=f"{label} must be a PNG, JPG or WebP image.")
    return mime


def _local_key(folder: str, name: str) -> str:
    return f"{folder}/{name}"


def upload_image(folder: str, data: bytes, mime: str, local_url_prefix: str) -> str:
    """
    Stores an already validated image and returns the URL to save on the record.

    `folder` is a key prefix such as "logos/<workspace_id>"; `local_url_prefix` is the public endpoint
    that serves files of that folder when the storage backend is used (the file name is appended).
    """
    if not _FOLDER_RE.match(folder):
        raise ValueError("Invalid image folder")
    name = uuid.uuid4().hex
    cfg = cloudinary_config()
    if cfg is None:
        filename = f"{name}.{IMAGE_EXT[mime]}"
        get_storage().put(_local_key(folder, filename), data, mime)
        return f"{local_url_prefix.rstrip('/')}/{filename}"

    params = {"public_id": f"{cfg.folder}/{folder}/{name}", "timestamp": str(int(time.time()))}
    form = {**params, "api_key": cfg.api_key, "signature": _sign(params, cfg.api_secret)}
    try:
        resp = httpx.post(
            f"https://api.cloudinary.com/v1_1/{cfg.cloud_name}/image/upload",
            data=form,
            files={"file": (f"{name}.{IMAGE_EXT[mime]}", data, mime)},
            timeout=settings.CLOUDINARY_TIMEOUT_SECONDS,
        )
    except httpx.HTTPError as exc:
        logger.warning("Cloudinary upload failed: %s", type(exc).__name__)
        raise ImageUploadFailed("The image service could not be reached.") from exc
    if resp.status_code != 200:
        # Cloudinary's error body names the problem without echoing credentials.
        logger.warning("Cloudinary upload rejected: HTTP %s %s", resp.status_code, resp.text[:300])
        raise ImageUploadFailed("The image service rejected the upload.")
    url = resp.json().get("secure_url")
    if not url:
        raise ImageUploadFailed("The image service did not return a URL.")
    return url


def _cloudinary_public_id(url: str, cfg: CloudinaryConfig) -> Optional[str]:
    """The public id inside a delivery URL we issued, or None for anything else."""
    prefix = f"https://res.cloudinary.com/{cfg.cloud_name}/image/upload/"
    if not url.startswith(prefix):
        return None
    path = url[len(prefix):]
    path = re.sub(r"^v\d+/", "", path)
    public_id = path.rsplit(".", 1)[0]
    return public_id if public_id.startswith(f"{cfg.folder}/") and ".." not in public_id else None


def delete_image(url: Optional[str], folder: str, local_url_prefix: str) -> None:
    """Best-effort removal of an image this module stored. Unknown URLs are left alone."""
    if not url:
        return
    try:
        prefix = local_url_prefix.rstrip("/") + "/"
        if url.startswith(prefix):
            filename = url[len(prefix):]
            if re.fullmatch(r"[0-9a-f]{32}\.(png|jpg|webp)", filename):
                get_storage().delete(_local_key(folder, filename))
            return
        cfg = cloudinary_config()
        public_id = _cloudinary_public_id(url, cfg) if cfg else None
        if not public_id:
            return
        params = {"public_id": public_id, "timestamp": str(int(time.time()))}
        httpx.post(
            f"https://api.cloudinary.com/v1_1/{cfg.cloud_name}/image/destroy",
            data={**params, "api_key": cfg.api_key, "signature": _sign(params, cfg.api_secret)},
            timeout=settings.CLOUDINARY_TIMEOUT_SECONDS,
        )
    except Exception as exc:  # deleting an old image must never fail the request that replaced it
        logger.warning("Could not delete old image: %s", type(exc).__name__)


def read_local_image(folder: str, filename: str) -> Optional[tuple[bytes, str]]:
    """Bytes and MIME type of an image kept on the storage backend (for the public image endpoints)."""
    if not re.fullmatch(r"[0-9a-f]{32}\.(png|jpg|webp)", filename) or not _FOLDER_RE.match(folder):
        return None
    data = get_storage().get(_local_key(folder, filename))
    if data is None:
        return None
    return data, {"png": "image/png", "jpg": "image/jpeg", "webp": "image/webp"}[filename.rsplit(".", 1)[1]]


def images_health() -> dict:
    try:
        cfg = cloudinary_config()
    except ValueError as exc:
        return {"backend": "cloudinary", "status": "NOT_CONFIGURED", "error": str(exc)}
    return {"backend": "cloudinary" if cfg else "storage", "status": "CONFIGURED" if cfg else "FALLBACK"}
