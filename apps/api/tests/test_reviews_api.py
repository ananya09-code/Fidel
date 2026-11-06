"""Tests for persisted vocabulary review sessions."""

from datetime import datetime, timedelta, timezone
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


def _learned_words(session_factory, days_ago=4):
    with session_factory() as db:
        db.execute(text("UPDATE user_words SET learning_state = 'learned', last_seen_at = :seen"),
                   {"seen": datetime.now(timezone.utc) - timedelta(days=days_ago)})
        db.commit()


def _finish_memory_check(auth_client, wrong=False):
    response = auth_client.post(f"{BASE}/start?mode=spaced", headers=AUTH_HEADERS)
    assert response.status_code == 200, response.text
    session = response.json()
    for index, word in enumerate(session["words"]):
        selected = session["choice_words"][(index + 1) % len(session["choice_words"])]["id"] if wrong else word["id"]
        if wrong and selected == word["id"]:
            selected = next(item["id"] for item in session["choice_words"] if item["id"] != word["id"])
        result = auth_client.put(f"{BASE}/{session['id']}/answers", headers=AUTH_HEADERS,
                                json={"word_id": word["id"], "selected_word_id": selected})
        assert result.status_code == 200, result.text
    completed = auth_client.post(f"{BASE}/{session['id']}/complete", headers=AUTH_HEADERS)
    assert completed.status_code == 200
    return completed.json()


def test_spaced_reviews_auth_and_new_user(auth_client, mock_clerk):
    assert auth_client.get(f"{BASE}/spaced", headers=AUTH_HEADERS).json()["scheduled_count"] == 0
    mock_clerk(user_id="")
    assert auth_client.get(f"{BASE}/spaced", headers=AUTH_HEADERS).status_code == 401


def test_learned_today_is_not_due(auth_client, mock_clerk, review_words, session_factory):
    _learned_words(session_factory, days_ago=0)
    result = auth_client.get(f"{BASE}/spaced", headers=AUTH_HEADERS).json()
    assert result["due_count"] == 0
    assert result["scheduled_count"] == 2
    expected = datetime.now(timezone.utc) + timedelta(days=3)
    assert abs((datetime.fromisoformat(result["next_review_at"]) - expected).total_seconds()) < 5
    assert auth_client.post(f"{BASE}/start?mode=spaced", headers=AUTH_HEADERS).status_code == 409


def test_due_session_persists_and_extends_to_two_weeks(auth_client, mock_clerk, review_words, session_factory):
    _learned_words(session_factory)
    before = auth_client.get(f"{BASE}/spaced", headers=AUTH_HEADERS).json()
    assert before["due_count"] == 2
    started = auth_client.post(f"{BASE}/start?mode=spaced", headers=AUTH_HEADERS).json()
    assert {word["id"] for word in started["words"]} == {str(word) for word in review_words}
    assert auth_client.post(f"{BASE}/start?mode=spaced", headers=AUTH_HEADERS).json()["id"] == started["id"]
    assert auth_client.get(f"{BASE}/spaced", headers=AUTH_HEADERS).json()["active_session"]["id"] == started["id"]
    completed = _finish_memory_check(auth_client)
    assert completed["correct_count"] == 2
    after = auth_client.get(f"{BASE}/spaced", headers=AUTH_HEADERS).json()
    assert after["due_count"] == 0
    expected = datetime.now(timezone.utc) + timedelta(days=14)
    assert abs((datetime.fromisoformat(after["next_review_at"]) - expected).total_seconds()) < 5
    # Re-completion cannot advance the schedule twice.
    auth_client.post(f"{BASE}/{completed['id']}/complete", headers=AUTH_HEADERS)
    assert auth_client.get(f"{BASE}/spaced", headers=AUTH_HEADERS).json()["next_review_at"] == after["next_review_at"]


def test_missed_words_return_tomorrow(auth_client, mock_clerk, review_words, session_factory):
    _learned_words(session_factory)
    assert _finish_memory_check(auth_client, wrong=True)["correct_count"] == 0
    result = auth_client.get(f"{BASE}/spaced", headers=AUTH_HEADERS).json()
    assert result["due_count"] == 0
    expected = datetime.now(timezone.utc) + timedelta(days=1)
    assert abs((datetime.fromisoformat(result["next_review_at"]) - expected).total_seconds()) < 5


def test_due_selection_uses_only_due_words_and_owned_choices(auth_client, mock_clerk, review_words, session_factory):
    _learned_words(session_factory)
    with session_factory() as db:
        db.execute(text("UPDATE user_words SET last_seen_at = :now WHERE word_id = :word"),
                   {"now": datetime.now(timezone.utc), "word": review_words[1]})
        db.commit()
    result = auth_client.post(f"{BASE}/start?mode=spaced", headers=AUTH_HEADERS).json()
    assert [word["id"] for word in result["words"]] == [str(review_words[0])]
    assert len(result["choice_words"]) == 2  # One due word still has a real distractor.
    wrong = auth_client.put(f"{BASE}/{result['id']}/answers", headers=AUTH_HEADERS,
                           json={"word_id": str(review_words[0]), "selected_word_id": str(uuid4())})
    assert wrong.status_code == 422
    mock_clerk(user_id="other_user")
    assert auth_client.get(f"{BASE}/spaced", headers=AUTH_HEADERS).json()["due_count"] == 0
    assert auth_client.put(f"{BASE}/{result['id']}/answers", headers=AUTH_HEADERS,
                          json={"word_id": str(review_words[0]), "selected_word_id": str(review_words[0])}).status_code == 404


def test_memory_check_filters_language_and_ignores_unlearned_words(auth_client, mock_clerk, review_words, session_factory):
    assert auth_client.get(f"{BASE}/spaced", headers=AUTH_HEADERS).json()["scheduled_count"] == 0
    _learned_words(session_factory)
    assert auth_client.get(f"{BASE}/spaced?language_code=am", headers=AUTH_HEADERS).json()["scheduled_count"] == 0
    assert auth_client.post(f"{BASE}/start?mode=spaced&language_code=am", headers=AUTH_HEADERS).status_code == 409
    assert auth_client.get(f"{BASE}/spaced?language_code=xx", headers=AUTH_HEADERS).status_code == 422


def test_favorite_change_does_not_postpone_memory_check(auth_client, mock_clerk, review_words, session_factory):
    _learned_words(session_factory)
    response = auth_client.put(f"/api/v1/vocabulary/{review_words[0]}", headers=AUTH_HEADERS, json={"is_favorite": True})
    assert response.status_code == 200
    assert auth_client.get(f"{BASE}/spaced", headers=AUTH_HEADERS).json()["due_count"] == 2


def test_random_memory_check_caps_at_ten_unique_due_words(auth_client, mock_clerk, review_words, session_factory):
    _learned_words(session_factory)
    with session_factory() as db:
        for index in range(12):
            word_id = uuid4()
            db.execute(text("""INSERT INTO words (id, language_code, text, content_type, category, difficulty, status, created_at)
                SELECT :id, language_code, :word, content_type, category, difficulty, status, created_at FROM words WHERE id = :source"""),
                       {"id": word_id, "word": f"extra{index}", "source": review_words[0]})
            db.execute(text("""INSERT INTO user_words (user_id, word_id, times_seen, times_correct, text, meaning, first_seen_at, last_seen_at, is_favorite, learning_state)
                SELECT user_id, :id, times_seen, times_correct, :word, :meaning, first_seen_at, last_seen_at, false, 'learned'
                FROM user_words WHERE word_id = :source"""),
                       {"id": word_id, "word": f"extra{index}", "meaning": f"meaning{index+2}", "source": review_words[0]})
        db.commit()
    assert auth_client.get(f"{BASE}/spaced", headers=AUTH_HEADERS).json()["due_count"] == 14
    session = auth_client.post(f"{BASE}/start?mode=spaced", headers=AUTH_HEADERS).json()
    assert len({word["id"] for word in session["words"]}) == session["total_count"] == 10


def test_saved_first_answer_cannot_be_replaced_or_extend_due_date(auth_client, mock_clerk, review_words, session_factory):
    _learned_words(session_factory)
    session = auth_client.post(f"{BASE}/start?mode=spaced", headers=AUTH_HEADERS).json()
    first, second = [word["id"] for word in session["words"]]
    url = f"{BASE}/{session['id']}/answers"
    wrong = auth_client.put(url, headers=AUTH_HEADERS, json={"word_id": first, "selected_word_id": second})
    assert wrong.status_code == 200
    with session_factory() as db:
        before = dict(db.execute(text("SELECT times_seen, times_correct, last_seen_at FROM user_words WHERE word_id = :word"), {"word": first}).mappings().one())
    retried = auth_client.put(url, headers=AUTH_HEADERS, json={"word_id": first, "selected_word_id": first})
    assert retried.status_code == 200
    assert retried.json()["correct_count"] == 0
    assert retried.json()["answers"] == [{"word_id": first, "is_correct": False}]
    with session_factory() as db:
        after = dict(db.execute(text("SELECT times_seen, times_correct, last_seen_at FROM user_words WHERE word_id = :word"), {"word": first}).mappings().one())
    assert after == before


def test_existing_other_account_cannot_read_or_change_memory_session(auth_client, mock_clerk, review_words, session_factory):
    _learned_words(session_factory)
    session = auth_client.post(f"{BASE}/start?mode=spaced", headers=AUTH_HEADERS).json()
    with session_factory() as db:
        db.execute(text("INSERT INTO users (id, clerk_id, created_at, updated_at) VALUES (:id, 'existing_other', :now, :now)"),
                   {"id": uuid4(), "now": datetime.now(timezone.utc)})
        db.commit()
    mock_clerk(user_id="existing_other")
    overview = auth_client.get(f"{BASE}/spaced", headers=AUTH_HEADERS).json()
    assert overview["scheduled_count"] == overview["due_count"] == 0
    assert overview["active_session"] is None
    assert auth_client.put(f"{BASE}/{session['id']}/answers", headers=AUTH_HEADERS,
                          json={"word_id": str(review_words[0]), "selected_word_id": str(review_words[0])}).status_code == 404
    assert auth_client.post(f"{BASE}/{session['id']}/complete", headers=AUTH_HEADERS).status_code == 404


def test_abandoned_memory_check_does_not_advance_interval(auth_client, mock_clerk, review_words, session_factory):
    _learned_words(session_factory)
    session = auth_client.post(f"{BASE}/start?mode=spaced", headers=AUTH_HEADERS).json()
    first = session["words"][0]["id"]
    auth_client.put(f"{BASE}/{session['id']}/answers", headers=AUTH_HEADERS,
                    json={"word_id": first, "selected_word_id": first})
    result = auth_client.get(f"{BASE}/spaced", headers=AUTH_HEADERS).json()
    assert result["active_session"]["id"] == session["id"]
    # The answer updates the practice timestamp, but no 14-day graduation until completion.
    expected = datetime.now(timezone.utc) + timedelta(days=3)
    assert abs((datetime.fromisoformat(result["next_review_at"]) - expected).total_seconds()) < 5


@pytest.mark.parametrize("streak,days", [(0, 3), (1, 14), (2, 30), (3, 90), (4, 180), (5, 365), (10, 365)])
def test_spacing_intervals_and_utc(streak, days):
    from app.services.spaced_repetition import next_review
    anchor = datetime(2026, 11, 6, 12, tzinfo=timezone.utc)
    history = [{"is_correct": True, "completed_at": anchor} for _ in range(streak)]
    assert next_review(anchor.replace(tzinfo=None), "learned", history) == anchor + timedelta(days=days)
    if history:
        assert next_review(anchor, "needs_review", history + [{"is_correct": False, "completed_at": anchor}]) == anchor + timedelta(days=1)

