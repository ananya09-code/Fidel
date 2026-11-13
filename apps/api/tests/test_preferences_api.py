"""Tests for authenticated onboarding and user preferences."""

from __future__ import annotations

import pytest
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
            "sound_volume": 85,
            "haptics_enabled": True,
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
    assert body["sound_enabled"] is False
    assert body["sound_volume"] == 85
    assert body["haptics_enabled"] is True


def test_preferences_are_isolated_by_clerk_user(auth_client, mock_clerk):
    auth_client.patch(
        BASE,
        headers=AUTH_HEADERS,
        json={"learning_language": "am", "daily_goal_minutes": 20, "haptics_enabled": False, "sound_volume": 30},
    )

    mock_clerk(user_id="user_other")
    other = auth_client.patch(
        BASE,
        headers=AUTH_HEADERS,
        json={"learning_language": "om", "daily_goal_minutes": 5},
    )
    assert other.status_code == 200
    assert other.json()["haptics_enabled"] is True
    assert other.json()["sound_volume"] == 75

    mock_clerk(user_id="user_test")
    first = auth_client.get(BASE, headers=AUTH_HEADERS)
    assert first.json()["learning_language"] == "am"
    assert first.json()["daily_goal_minutes"] == 20
    assert first.json()["haptics_enabled"] is False
    assert first.json()["sound_volume"] == 30


def test_haptics_preference_is_independent_of_sound(auth_client, mock_clerk):
    saved = auth_client.patch(
        BASE, headers=AUTH_HEADERS,
        json={"sound_enabled": False, "haptics_enabled": True},
    )
    assert saved.status_code == 200
    assert saved.json()["sound_enabled"] is False
    assert saved.json()["haptics_enabled"] is True
    auth_client.patch(BASE, headers=AUTH_HEADERS, json={"haptics_enabled": False})
    loaded = auth_client.get(BASE, headers=AUTH_HEADERS).json()
    assert loaded["sound_enabled"] is False
    assert loaded["haptics_enabled"] is False


def test_feedback_volume_persists_and_rejects_out_of_range_values(auth_client, mock_clerk):
    saved = auth_client.patch(BASE, headers=AUTH_HEADERS, json={"sound_volume": 0})
    assert saved.status_code == 200
    assert auth_client.get(BASE, headers=AUTH_HEADERS).json()["sound_volume"] == 0
    for value in (-1, 101):
        rejected = auth_client.patch(BASE, headers=AUTH_HEADERS, json={"sound_volume": value})
        assert rejected.status_code == 422
    assert auth_client.get(BASE, headers=AUTH_HEADERS).json()["sound_volume"] == 0


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


@pytest.mark.parametrize("word_goal", [5, 10, 15, 20])
def test_word_goal_persists_and_drives_dashboard(auth_client, mock_clerk, word_goal):
    saved = auth_client.patch(
        BASE, headers=AUTH_HEADERS, json={"daily_goal_words": word_goal}
    )
    assert saved.status_code == 200
    assert saved.json()["daily_goal_words"] == word_goal
    assert saved.json()["daily_goal_minutes"] == word_goal  # Older clients.

    loaded = auth_client.get(BASE, headers=AUTH_HEADERS).json()
    assert loaded["daily_goal_words"] == word_goal
    dashboard = auth_client.get("/api/v1/dashboard", headers=AUTH_HEADERS).json()
    assert dashboard["daily_word_goal"] == word_goal
    assert dashboard["words_learned_today"] == 0

    # Unrelated settings must not overwrite the chosen word target.
    auth_client.patch(BASE, headers=AUTH_HEADERS, json={"sound_enabled": False})
    assert auth_client.get(BASE, headers=AUTH_HEADERS).json()["daily_goal_words"] == word_goal

    mock_clerk(user_id="another_learner")
    assert auth_client.get(BASE, headers=AUTH_HEADERS).json()["daily_goal_words"] == 5
    assert auth_client.get("/api/v1/dashboard", headers=AUTH_HEADERS).json()["daily_word_goal"] == 5


def test_legacy_goal_maps_to_words_without_rewriting_data(
    auth_client, mock_clerk, session_factory,
):
    auth_client.patch(BASE, headers=AUTH_HEADERS, json={"daily_goal_minutes": 15})
    assert auth_client.get(BASE, headers=AUTH_HEADERS).json()["daily_goal_words"] == 15
    with session_factory() as session:
        assert session.execute(text("SELECT daily_goal_minutes FROM user_preferences")).scalar_one() == 15


def test_invalid_word_goal_is_rejected(auth_client, mock_clerk):
    response = auth_client.patch(BASE, headers=AUTH_HEADERS, json={"daily_goal_words": 999})
    assert response.status_code == 422


@pytest.mark.parametrize("appearance", ["light", "dark", "system"])
def test_appearance_persists_and_is_isolated(auth_client, mock_clerk, appearance):
    saved = auth_client.patch(
        BASE, headers=AUTH_HEADERS,
        json={"appearance": appearance, "learning_language": "am"},
    )
    assert saved.status_code == 200
    assert auth_client.get(BASE, headers=AUTH_HEADERS).json()["appearance"] == appearance
    # Saving other settings must not reset the theme.
    auth_client.patch(BASE, headers=AUTH_HEADERS, json={"sound_enabled": False})
    assert auth_client.get(BASE, headers=AUTH_HEADERS).json()["appearance"] == appearance
    mock_clerk(user_id="another_theme_user")
    assert auth_client.get(BASE, headers=AUTH_HEADERS).json()["appearance"] == "system"
    auth_client.patch(BASE, headers=AUTH_HEADERS, json={"appearance": "light"})
    mock_clerk(user_id="user_test")
    assert auth_client.get(BASE, headers=AUTH_HEADERS).json()["appearance"] == appearance


def test_invalid_appearance_does_not_change_saved_choice(auth_client, mock_clerk):
    auth_client.patch(BASE, headers=AUTH_HEADERS, json={"appearance": "dark"})
    rejected = auth_client.patch(BASE, headers=AUTH_HEADERS, json={"appearance": "invalid"})
    assert rejected.status_code == 422
    assert auth_client.get(BASE, headers=AUTH_HEADERS).json()["appearance"] == "dark"


def test_guide_progress_persists_and_is_isolated(auth_client, mock_clerk):
    initial = auth_client.get(BASE, headers=AUTH_HEADERS).json()
    assert initial["tour_completed_version"] == 0
    assert initial["last_seen_update"] is None

    saved = auth_client.patch(
        BASE, headers=AUTH_HEADERS,
        json={"tour_completed_version": 1, "last_seen_update": "2026-11"},
    )
    assert saved.status_code == 200
    assert saved.json()["tour_completed_version"] == 1
    assert saved.json()["last_seen_update"] == "2026-11"
    auth_client.patch(BASE, headers=AUTH_HEADERS, json={"sound_enabled": False})
    assert auth_client.get(BASE, headers=AUTH_HEADERS).json()["tour_completed_version"] == 1

    mock_clerk(user_id="another_guide_user")
    other = auth_client.get(BASE, headers=AUTH_HEADERS).json()
    assert other["tour_completed_version"] == 0
    assert other["last_seen_update"] is None
    auth_client.patch(BASE, headers=AUTH_HEADERS, json={"last_seen_update": "2026-11"})
    mock_clerk(user_id="user_test")
    assert auth_client.get(BASE, headers=AUTH_HEADERS).json()["last_seen_update"] == "2026-11"


def test_negative_tour_version_is_rejected(auth_client, mock_clerk):
    response = auth_client.patch(BASE, headers=AUTH_HEADERS, json={"tour_completed_version": -1})
    assert response.status_code == 422
