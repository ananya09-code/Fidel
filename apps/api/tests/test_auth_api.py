"""Tests for Clerk-authenticated user profile endpoints."""

from __future__ import annotations

import pytest
from sqlalchemy import text

from tests.conftest import AUTH_HEADERS, TEST_CLERK_ISSUER

BASE = "/api/v1/auth"


def test_profile_requires_a_bearer_token(auth_client, mock_clerk):
    response = auth_client.post(f"{BASE}/profile")

    assert response.status_code == 401
    assert response.headers["www-authenticate"] == "Bearer"


def test_profile_rejects_a_non_bearer_header(auth_client, mock_clerk):
    response = auth_client.post(
        f"{BASE}/profile", headers={"Authorization": "Basic abc"}
    )

    assert response.status_code == 401


def test_invalid_session_token_is_rejected(auth_client, mock_clerk):
    mock_clerk(user_id="")

    response = auth_client.post(f"{BASE}/profile", headers=AUTH_HEADERS)

    assert response.status_code == 401


def test_authentication_requires_configuration(auth_client, mock_clerk, monkeypatch):
    from app.core.config import get_settings

    settings = get_settings()
    monkeypatch.setattr(settings, "clerk_secret_key", None, raising=False)
    monkeypatch.setattr(settings, "clerk_jwt_key", None, raising=False)

    response = auth_client.post(f"{BASE}/profile", headers=AUTH_HEADERS)

    assert response.status_code == 503


def test_wrong_issuer_is_rejected(auth_client, mock_clerk):
    mock_clerk(issuer="https://unexpected.example.test")

    response = auth_client.post(f"{BASE}/profile", headers=AUTH_HEADERS)

    assert response.status_code == 401


def test_token_without_subject_is_rejected(
    auth_client, mock_clerk, monkeypatch
):
    from app.core import clerk_auth
    from clerk_backend_api.security import AuthStatus, RequestState

    state = RequestState(
        status=AuthStatus.SIGNED_IN,
        token="test-session-token",
        payload={"iss": TEST_CLERK_ISSUER, "sid": "sess_test"},
    )
    monkeypatch.setattr(
        clerk_auth,
        "authenticate_request",
        lambda request, options: state,
    )

    response = auth_client.post(f"{BASE}/profile", headers=AUTH_HEADERS)

    assert response.status_code == 401


def test_sync_creates_profile_from_verified_identity(auth_client, mock_clerk):
    response = auth_client.post(f"{BASE}/profile", headers=AUTH_HEADERS)

    assert response.status_code == 200
    body = response.json()
    assert body["clerk_user_id"] == "user_test"
    assert body["email"] == "user_test@example.test"
    assert body["first_name"] == "Test"
    assert body["last_name"] == "Learner"
    assert body["display_name"] == "Test Learner"
    assert body["image_url"] == "https://images.example.test/avatar.png"


def test_sync_is_idempotent(auth_client, mock_clerk, session_factory):
    first = auth_client.post(f"{BASE}/profile", headers=AUTH_HEADERS)
    second = auth_client.post(f"{BASE}/profile", headers=AUTH_HEADERS)

    assert first.status_code == 200
    assert second.status_code == 200
    assert first.json()["id"] == second.json()["id"]

    with session_factory() as session:
        count = session.execute(text("SELECT COUNT(*) FROM users")).scalar_one()
        clerk_id = session.execute(text("SELECT clerk_id FROM users")).scalar_one()

    assert count == 1
    assert clerk_id == "user_test"


def test_get_profile_does_not_create_a_row(auth_client, mock_clerk):
    response = auth_client.get(f"{BASE}/profile", headers=AUTH_HEADERS)

    assert response.status_code == 404


def test_get_profile_returns_the_synced_profile(auth_client, mock_clerk):
    auth_client.post(f"{BASE}/profile", headers=AUTH_HEADERS)

    response = auth_client.get(f"{BASE}/profile", headers=AUTH_HEADERS)

    assert response.status_code == 200
    assert response.json()["clerk_user_id"] == "user_test"


def test_profiles_are_isolated_per_clerk_user(
    auth_client, mock_clerk, session_factory
):
    first = auth_client.post(f"{BASE}/profile", headers=AUTH_HEADERS).json()

    mock_clerk(user_id="user_other")
    second = auth_client.post(f"{BASE}/profile", headers=AUTH_HEADERS).json()

    assert first["id"] != second["id"]

    mock_clerk(user_id="user_test")
    auth_client.delete(f"{BASE}/profile", headers=AUTH_HEADERS)

    mock_clerk(user_id="user_other")
    response = auth_client.get(f"{BASE}/profile", headers=AUTH_HEADERS)

    assert response.status_code == 200
    assert response.json()["id"] == second["id"]


def test_delete_profile_removes_only_local_data(auth_client, mock_clerk):
    auth_client.post(f"{BASE}/profile", headers=AUTH_HEADERS)

    response = auth_client.delete(f"{BASE}/profile", headers=AUTH_HEADERS)

    assert response.status_code == 204
    assert auth_client.get(f"{BASE}/profile", headers=AUTH_HEADERS).status_code == 404


def test_public_health_endpoint_still_needs_no_token(client):
    response = client.get("/api/health")

    assert response.status_code == 200
