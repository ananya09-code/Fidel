"""Tests for authenticated onboarding and user preferences."""

from __future__ import annotations

from sqlalchemy import text

from tests.conftest import AUTH_HEADERS

BASE = "/api/v1/preferences"


def test_preferences_require_authentication(auth_client, mock_clerk):
    response = auth_client.get(BASE)

    assert response.status_code == 401


def test_get_returns_defaults_without_creating_rows(
    auth_client, mock_clerk, session_factory
):
    response = auth_client.get(BASE, headers=AUTH_HEADERS)

    assert response.status_code == 200
    assert response.json()["learning_language"] == "om"
    assert response.json()["onboarding_completed"] is False

    with session_factory() as session:
        assert session.execute(text("SELECT COUNT(*) FROM users")).scalar_one() == 0
        assert (
            session.execute(text("SELECT COUNT(*) FROM user_preferences")).scalar_one()
            == 0
        )


def test_onboarding_preferences_are_persisted(auth_client, mock_clerk):
    response = auth_client.patch(
        BASE,
        headers=AUTH_HEADERS,
        json={
            "learning_language": "am",
            "proficiency_level": "some",
            "motivations": ["family", "culture"],
            "daily_goal_minutes": 15,
            "timezone": "America/Los_Angeles",
            "onboarding_completed": True,
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["learning_language"] == "am"
    assert body["proficiency_level"] == "some"
    assert body["motivations"] == ["family", "culture"]
    assert body["daily_goal_minutes"] == 15
    assert body["onboarding_completed"] is True
    assert body["created_at"] is not None

    loaded = auth_client.get(BASE, headers=AUTH_HEADERS)
    assert loaded.status_code == 200
    assert loaded.json()["learning_language"] == "am"


def test_settings_patch_preserves_onboarding_values(auth_client, mock_clerk):
    auth_client.patch(
        BASE,
        headers=AUTH_HEADERS,
        json={
            "learning_language": "am",
            "proficiency_level": "improving",
            "motivations": ["work"],
            "onboarding_completed": True,
        },
    )

    response = auth_client.patch(
        BASE,
        headers=AUTH_HEADERS,
        json={
            "daily_goal_minutes": 20,
            "reminders_enabled": False,
            "sound_enabled": False,
            "appearance": "dark",
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["proficiency_level"] == "improving"
    assert body["motivations"] == ["work"]
    assert body["onboarding_completed"] is True
    assert body["daily_goal_minutes"] == 20
    assert body["appearance"] == "dark"


def test_preferences_are_isolated_by_clerk_user(auth_client, mock_clerk):
    auth_client.patch(
        BASE,
        headers=AUTH_HEADERS,
        json={"learning_language": "am", "daily_goal_minutes": 20},
    )

    mock_clerk(user_id="user_other")
    other = auth_client.patch(
        BASE,
        headers=AUTH_HEADERS,
        json={"learning_language": "om", "daily_goal_minutes": 5},
    )
    assert other.status_code == 200

    mock_clerk(user_id="user_test")
    first = auth_client.get(BASE, headers=AUTH_HEADERS)
    assert first.json()["learning_language"] == "am"
    assert first.json()["daily_goal_minutes"] == 20


def test_invalid_preferences_are_rejected(auth_client, mock_clerk):
    response = auth_client.patch(
        BASE,
        headers=AUTH_HEADERS,
        json={
            "daily_goal_minutes": 999,
            "reminder_time": "29:70",
            "motivations": ["family", "family"],
        },
    )

    assert response.status_code == 422
