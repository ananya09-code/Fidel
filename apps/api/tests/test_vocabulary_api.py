"""Tests for persisted, user-isolated vocabulary state."""

from datetime import datetime, timezone
from uuid import uuid4

import pytest
from sqlalchemy import text

from tests.conftest import AUTH_HEADERS

BASE = "/api/v1/vocabulary"


@pytest.fixture()
def approved_word(session_factory):
    word_id = uuid4()
    now = datetime.now(timezone.utc)
    with session_factory() as session:
        session.execute(
            text(
                """
                INSERT INTO words (
                    id, language_code, text, content_type, category,
                    difficulty, status, created_at
                ) VALUES (
                    :id, 'om', 'akkam', 'word', 'greetings',
                    'beginner', 'approved', :now
                )
                """
            ),
            {"id": word_id, "now": now},
        )
        session.execute(
            text(
                """
                INSERT INTO word_translations (
                    id, word_id, language_code, meaning, created_at
                ) VALUES (:id, :word_id, 'en', 'hello', :now)
                """
            ),
            {"id": uuid4(), "word_id": word_id, "now": now},
        )
        session.commit()
    return word_id


def test_vocabulary_requires_authentication(auth_client, mock_clerk):
    mock_clerk(user_id="")
    assert auth_client.get(BASE).status_code == 401


def test_empty_list_does_not_create_user(auth_client, mock_clerk, session_factory):
    response = auth_client.get(BASE, headers=AUTH_HEADERS)
    assert response.status_code == 200
    assert response.json() == {"data": []}
    with session_factory() as session:
        assert session.execute(text("SELECT COUNT(*) FROM users")).scalar_one() == 0


def test_favorite_and_learning_state_persist(auth_client, mock_clerk, approved_word):
    favorite = auth_client.put(
        f"{BASE}/{approved_word}",
        headers=AUTH_HEADERS,
        json={"is_favorite": True},
    )
    assert favorite.status_code == 200
    assert favorite.json()["is_favorite"] is True
    assert favorite.json()["learning_state"] == "learning"

    learned = auth_client.put(
        f"{BASE}/{approved_word}",
        headers=AUTH_HEADERS,
        json={"learning_state": "learned"},
    )
    assert learned.status_code == 200
    assert learned.json()["is_favorite"] is True
    assert learned.json()["learning_state"] == "learned"

    listed = auth_client.get(BASE, headers=AUTH_HEADERS).json()["data"]
    assert len(listed) == 1
    assert listed[0]["word_id"] == str(approved_word)


def test_vocabulary_is_isolated_between_users(auth_client, mock_clerk, approved_word):
    mock_clerk(user_id="first_user")
    auth_client.put(
        f"{BASE}/{approved_word}", headers=AUTH_HEADERS, json={"is_favorite": True}
    )

    mock_clerk(user_id="second_user")
    assert auth_client.get(BASE, headers=AUTH_HEADERS).json() == {"data": []}
    second = auth_client.put(
        f"{BASE}/{approved_word}",
        headers=AUTH_HEADERS,
        json={"learning_state": "needs_review"},
    ).json()
    assert second["is_favorite"] is False

    mock_clerk(user_id="first_user")
    first = auth_client.get(BASE, headers=AUTH_HEADERS).json()["data"][0]
    assert first["is_favorite"] is True
    assert first["learning_state"] == "learning"


def test_unknown_word_is_rejected(auth_client, mock_clerk):
    response = auth_client.put(
        f"{BASE}/{uuid4()}", headers=AUTH_HEADERS, json={"is_favorite": True}
    )
    assert response.status_code == 404


def test_lesson_answer_updates_word_mastery(auth_client, mock_clerk, approved_word):
    attempt = auth_client.post(
        "/api/v1/progress/lessons/om-beginner-greetings/start",
        headers=AUTH_HEADERS,
        json={
            "difficulty": "beginner",
            "category_key": "greetings",
            "question_count": 1,
        },
    ).json()
    response = auth_client.put(
        f"/api/v1/progress/attempts/{attempt['id']}/answers",
        headers=AUTH_HEADERS,
        json={
            "question_id": str(approved_word),
            "word_id": str(approved_word),
            "selected_word_id": str(approved_word),
            "question_index": 0,
        },
    )
    assert response.status_code == 200
    state = auth_client.get(BASE, headers=AUTH_HEADERS).json()["data"][0]
    assert state["learning_state"] == "learned"
    assert state["times_seen"] == 1
    assert state["times_correct"] == 1

