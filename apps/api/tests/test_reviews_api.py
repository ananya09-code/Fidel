"""Tests for persisted vocabulary review sessions."""

from datetime import datetime, timezone
from uuid import uuid4

import pytest
from sqlalchemy import text

from tests.conftest import AUTH_HEADERS

BASE = "/api/v1/reviews"


@pytest.fixture()
def review_words(session_factory):
    user_id = uuid4()
    now = datetime.now(timezone.utc)
    ids = [uuid4(), uuid4()]
    with session_factory() as session:
        session.execute(
            text("INSERT INTO users (id, clerk_id, created_at, updated_at) VALUES (:id, 'user_test', :now, :now)"),
            {"id": user_id, "now": now},
        )
        for index, word_id in enumerate(ids):
            session.execute(
                text("""
                    INSERT INTO words (id, language_code, text, content_type, category, difficulty, status, created_at)
                    VALUES (:id, 'om', :word, 'word', 'greetings', 'beginner', 'approved', :now)
                """),
                {"id": word_id, "word": f"word{index}", "now": now},
            )
            session.execute(
                text("""
                    INSERT INTO word_translations (id, word_id, language_code, meaning, created_at)
                    VALUES (:id, :word_id, 'en', :meaning, :now)
                """),
                {"id": uuid4(), "word_id": word_id, "meaning": f"meaning{index}", "now": now},
            )
            session.execute(
                text("""
                    INSERT INTO word_translations (id, word_id, language_code, meaning, created_at)
                    VALUES (:id, :word_id, 'am', :meaning, :now)
                """),
                {"id": uuid4(), "word_id": word_id, "meaning": f"amharic{index}", "now": now},
            )
            session.execute(
                text("""
                    INSERT INTO user_words (
                      user_id, word_id, times_seen, times_correct, text, meaning,
                      first_seen_at, last_seen_at, is_favorite, learning_state
                    ) VALUES (:user_id, :word_id, 1, 0, :word, :meaning, :now, :now, false, 'needs_review')
                """),
                {"user_id": user_id, "word_id": word_id, "word": f"word{index}", "meaning": f"meaning{index}", "now": now},
            )
        session.commit()
    return ids


def test_reviews_require_authentication(auth_client, mock_clerk):
    mock_clerk(user_id="")
    assert auth_client.get(BASE).status_code == 401


def test_review_lifecycle_and_word_states(auth_client, mock_clerk, review_words):
    overview = auth_client.get(BASE, headers=AUTH_HEADERS)
    assert overview.status_code == 200
    assert len(overview.json()["queue"]) == 2
    assert {item["amharic"] for item in overview.json()["queue"]} == {
        "amharic0",
        "amharic1",
    }

    started = auth_client.post(f"{BASE}/start", headers=AUTH_HEADERS)
    assert started.status_code == 200
    session = started.json()
    assert len(session["words"]) == 2

    resumed = auth_client.post(f"{BASE}/start", headers=AUTH_HEADERS)
    assert resumed.json()["id"] == session["id"]

    correct = auth_client.put(
        f"{BASE}/{session['id']}/answers",
        headers=AUTH_HEADERS,
        json={"word_id": str(review_words[0]), "selected_word_id": str(review_words[0])},
    )
    assert correct.status_code == 200
    repeated = auth_client.put(
        f"{BASE}/{session['id']}/answers",
        headers=AUTH_HEADERS,
        json={"word_id": str(review_words[0]), "selected_word_id": str(review_words[0])},
    )
    assert repeated.status_code == 200
    wrong = auth_client.put(
        f"{BASE}/{session['id']}/answers",
        headers=AUTH_HEADERS,
        json={"word_id": str(review_words[1]), "selected_word_id": str(review_words[0])},
    )
    assert wrong.status_code == 200
    assert wrong.json()["correct_count"] == 1

    completed = auth_client.post(f"{BASE}/{session['id']}/complete", headers=AUTH_HEADERS)
    assert completed.status_code == 200
    assert completed.json()["status"] == "completed"

    final = auth_client.get(BASE, headers=AUTH_HEADERS).json()
    assert len(final["queue"]) == 1
    assert final["queue"][0]["id"] == str(review_words[1])
    assert final["active_session"] is None
    assert final["history"][0]["correct_count"] == 1


def test_review_session_is_user_isolated(auth_client, mock_clerk, review_words):
    first = auth_client.post(f"{BASE}/start", headers=AUTH_HEADERS).json()
    mock_clerk(user_id="another_user")
    assert auth_client.get(BASE, headers=AUTH_HEADERS).json()["active_session"] is None
    response = auth_client.put(
        f"{BASE}/{first['id']}/answers",
        headers=AUTH_HEADERS,
        json={"word_id": str(review_words[0]), "selected_word_id": str(review_words[0])},
    )
    assert response.status_code == 404


def test_incomplete_review_cannot_complete(auth_client, mock_clerk, review_words):
    session = auth_client.post(f"{BASE}/start", headers=AUTH_HEADERS).json()
    response = auth_client.post(f"{BASE}/{session['id']}/complete", headers=AUTH_HEADERS)
    assert response.status_code == 409

