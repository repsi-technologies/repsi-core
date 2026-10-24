"""Profile photos and gym logos: storage fallback, the Cloudinary path (HTTP boundary mocked) and failures."""
import hashlib

import httpx
import pytest

from app.core import images
from app.core.config import settings
from tests.test_identity_onboarding import API, PNG, auth, client, onboard, phone_signup

JPEG = b"\xff\xd8\xff\xe0" + b"\x00" * 64


@pytest.fixture
def cloudinary(monkeypatch):
    """Configures a fake Cloudinary account and records every request sent to it."""
    monkeypatch.setattr(settings, "CLOUDINARY_URL", "cloudinary://key123:secret456@democloud")
    calls = []

    def fake_post(url, data=None, files=None, timeout=None):
        calls.append({"url": url, "data": data, "files": files})
        if url.endswith("/image/upload"):
            if fake_post.fail:
                return httpx.Response(500, json={"error": {"message": "boom"}})
            return httpx.Response(200, json={
                "secure_url": f"https://res.cloudinary.com/democloud/image/upload/v1700000000/{data['public_id']}.png",
            })
        return httpx.Response(200, json={"result": "ok"})

    fake_post.fail = False
    monkeypatch.setattr(images.httpx, "post", fake_post)
    return fake_post, calls


def test_avatar_on_storage_backend_upload_replace_and_remove():
    s = phone_signup()
    t = s["access_token"]

    r = client.post(f"{API}/auth/me/avatar", files={"file": ("me.png", PNG, "image/png")}, headers=auth(t))
    assert r.status_code == 200, r.text
    first = r.json()["avatar_url"]
    assert first.startswith(f"{API}/auth/avatars/")
    assert client.get(f"{API}/auth/me", headers=auth(t)).json()["avatar_url"] == first
    img = client.get(first)
    assert img.status_code == 200 and img.headers["content-type"] == "image/png"

    r = client.post(f"{API}/auth/me/avatar", files={"file": ("me.jpg", JPEG, "image/jpeg")}, headers=auth(t))
    assert r.status_code == 200, r.text
    second = r.json()["avatar_url"]
    assert second != first and second.endswith(".jpg")
    assert client.get(first).status_code == 404  # the replaced photo is removed

    r = client.delete(f"{API}/auth/me/avatar", headers=auth(t))
    assert r.status_code == 200 and r.json()["avatar_url"] is None
    assert client.get(second).status_code == 404


def test_avatar_rejects_non_images_oversize_and_anonymous(monkeypatch):
    t = phone_signup()["access_token"]
    r = client.post(f"{API}/auth/me/avatar", files={"file": ("x.png", b"MZ\x90\x00evil", "image/png")}, headers=auth(t))
    assert r.status_code == 415
    monkeypatch.setattr(settings, "AVATAR_MAX_BYTES", 32)
    r = client.post(f"{API}/auth/me/avatar", files={"file": ("big.png", PNG, "image/png")}, headers=auth(t))
    assert r.status_code == 413
    r = client.post(f"{API}/auth/me/avatar", files={"file": ("me.png", PNG, "image/png")})
    assert r.status_code == 401
    assert client.get(f"{API}/auth/avatars/../../etc/passwd.png").status_code == 404


def test_avatar_goes_to_cloudinary_with_a_signed_request(cloudinary):
    fake, calls = cloudinary
    s = phone_signup()
    t = s["access_token"]

    r = client.post(f"{API}/auth/me/avatar", files={"file": ("me.png", PNG, "image/png")}, headers=auth(t))
    assert r.status_code == 200, r.text
    url = r.json()["avatar_url"]
    assert url.startswith("https://res.cloudinary.com/democloud/image/upload/")

    upload = calls[-1]
    assert upload["url"] == "https://api.cloudinary.com/v1_1/democloud/image/upload"
    data = upload["data"]
    user_id = client.get(f"{API}/auth/me", headers=auth(t)).json()["id"]
    assert data["public_id"].startswith(f"repsi/avatars/{user_id}/")
    assert data["api_key"] == "key123" and "secret456" not in str(data)
    expected = hashlib.sha1(f"public_id={data['public_id']}&timestamp={data['timestamp']}secret456".encode()).hexdigest()
    assert data["signature"] == expected

    # Replacing the photo destroys the previous Cloudinary asset by its public id.
    r = client.post(f"{API}/auth/me/avatar", files={"file": ("me.png", PNG, "image/png")}, headers=auth(t))
    assert r.status_code == 200
    destroy = calls[-1]
    assert destroy["url"].endswith("/image/destroy")
    assert destroy["data"]["public_id"] == data["public_id"]


def test_cloudinary_failure_keeps_the_previous_photo(cloudinary):
    fake, _ = cloudinary
    t = phone_signup()["access_token"]
    first = client.post(f"{API}/auth/me/avatar", files={"file": ("me.png", PNG, "image/png")}, headers=auth(t)).json()["avatar_url"]

    fake.fail = True
    r = client.post(f"{API}/auth/me/avatar", files={"file": ("me.png", PNG, "image/png")}, headers=auth(t))
    assert r.status_code == 502
    assert client.get(f"{API}/auth/me", headers=auth(t)).json()["avatar_url"] == first


def test_gym_logo_goes_to_cloudinary(cloudinary):
    _, calls = cloudinary
    t = onboard(phone_signup()["access_token"])["session"]["access_token"]
    r = client.post(f"{API}/organization/logo", files={"file": ("logo.png", PNG, "image/png")}, headers=auth(t))
    assert r.status_code == 200, r.text
    assert r.json()["logo_url"].startswith("https://res.cloudinary.com/democloud/")
    assert calls[-1]["data"]["public_id"].startswith("repsi/logos/")

    r = client.delete(f"{API}/organization/logo", headers=auth(t))
    assert r.status_code == 200 and r.json()["logo_url"] is None
    assert calls[-1]["url"].endswith("/image/destroy")


def test_foreign_urls_are_never_deleted(cloudinary):
    _, calls = cloudinary
    before = len(calls)
    images.delete_image("https://res.cloudinary.com/othercloud/image/upload/v1/repsi/x.png", "avatars/u", "/api/v1/auth/avatars/u")
    images.delete_image("https://example.com/me.png", "avatars/u", "/api/v1/auth/avatars/u")
    assert len(calls) == before


def test_malformed_cloudinary_url_is_reported(monkeypatch):
    monkeypatch.setattr(settings, "CLOUDINARY_URL", "https://not-a-cloudinary-url")
    assert images.images_health()["status"] == "NOT_CONFIGURED"
