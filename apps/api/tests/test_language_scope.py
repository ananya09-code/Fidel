"""A learner's selected course must not borrow another course's progress."""

import json
from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import text

from tests.conftest import AUTH_HEADERS


def _seed_course(db, user_id, code, now):
    word_id, attempt_id, review_id = uuid4(), uuid4(), uuid4()
    db.execute(text("""
        INSERT INTO words (id, language_code, text, content_type, category, difficulty, status, created_at)
        VALUES (:id, :code, :word, 'word', 'greetings', 'beginner', 'approved', :now)
    """), {"id": word_id, "code": code, "word": f"{code}-hello", "now": now})
    db.execute(text("""
        INSERT INTO user_words (user_id, word_id, times_seen, times_correct, first_seen_at,
                                last_seen_at, is_favorite, learning_state)
        VALUES (:user, :word, 1, 1, :now, :now, false, 'needs_review')
    """), {"user": user_id, "word": word_id, "now": now})
    db.execute(text("""
        INSERT INTO lesson_attempts (id, user_id, lesson_key, difficulty, category_key,
                                     category_label, status, stage, question_index,
                                     question_count, correct_count, started_at, completed_at, updated_at)
        VALUES (:id, :user, :key, 'beginner', 'greetings', 'Greetings', 'completed',
                'practice', 1, 1, 1, :now, :now, :now)
    """), {"id": attempt_id, "user": user_id, "key": f"{code}-beginner-greetings", "now": now})
    db.execute(text("""
        INSERT INTO answer_attempts (attempt_id, user_id, question_id, question_type,
                                     word_ids, is_correct, answered_at)
        VALUES (:id, :user, 'q1', 'multiple_choice', :words, true, :now)
    """), {"id": attempt_id, "user": user_id, "words": json.dumps([str(word_id)]), "now": now})
    db.execute(text("""
        INSERT INTO review_sessions (id, user_id, language_code, word_ids, status,
                                     total_count, correct_count, started_at, completed_at, updated_at)
        VALUES (:id, :user, :code, :words, 'completed', 1, 1, :now, :now, :now)
    """), {"id": review_id, "user": user_id, "code": code,
           "words": json.dumps([str(word_id)]), "now": now})
    db.execute(text("""
        INSERT INTO review_answers (session_id, user_id, word_id, selected_word_id,
                                    is_correct, answered_at)
        VALUES (:id, :user, :word, :word, true, :now)
    """), {"id": review_id, "user": user_id, "word": word_id, "now": now})
    return word_id, review_id


def test_course_views_and_reviews_are_language_and_user_scoped(auth_client, mock_clerk, session_factory):
    now = datetime.now(timezone.utc)
    user_id = uuid4()
    with session_factory() as db:
        db.execute(text("INSERT INTO users (id, clerk_id) VALUES (:id, 'user_test')"), {"id": user_id})
        om_word, om_review = _seed_course(db, user_id, "om", now)
        am_word, am_review = _seed_course(db, user_id, "am", now)
        db.commit()

    for code, expected_word, expected_review, other_word in (
        ("om", om_word, om_review, am_word),
        ("am", am_word, am_review, om_word),
    ):
        params = {"language_code": code}
        dashboard = auth_client.get("/api/v1/dashboard", params=params, headers=AUTH_HEADERS).json()
        assert dashboard["learned_words"] == 0
        assert dashboard["needs_review_words"] == 1
        assert dashboard["lessons_completed"] == 1
        assert dashboard["reviews_completed"] == 1
        assert dashboard["correct_answers"] == 2
        activity = auth_client.get("/api/v1/dashboard/activity", params=params, headers=AUTH_HEADERS).json()
        assert sum(day["answers"] for day in activity["days"]) == 2
        progress = auth_client.get("/api/v1/progress", params=params, headers=AUTH_HEADERS).json()
        assert progress["completed_lesson_keys"] == [f"{code}-beginner-greetings"]
        assert progress["questions_answered"] == 1
        vocabulary = auth_client.get("/api/v1/vocabulary", params=params, headers=AUTH_HEADERS).json()
        assert [item["word_id"] for item in vocabulary["data"]] == [str(expected_word)]
        reviews = auth_client.get("/api/v1/reviews", params=params, headers=AUTH_HEADERS).json()
        assert [item["id"] for item in reviews["queue"]] == [str(expected_word)]
        assert [item["id"] for item in reviews["history"]] == [str(expected_review)]
        assert str(other_word) not in str(reviews)

    om_session = auth_client.post("/api/v1/reviews/start?language_code=om", headers=AUTH_HEADERS).json()
    am_session = auth_client.post("/api/v1/reviews/start?language_code=am", headers=AUTH_HEADERS).json()
    assert om_session["id"] != am_session["id"]
    assert [word["id"] for word in om_session["words"]] == [str(om_word)]
    assert [word["id"] for word in am_session["words"]] == [str(am_word)]
    for code, expected in (("om", om_session), ("am", am_session)):
        overview = auth_client.get("/api/v1/reviews", params={"language_code": code}, headers=AUTH_HEADERS).json()
        assert overview["active_session"]["id"] == expected["id"]

    mock_clerk(user_id="other_user")
    assert auth_client.get("/api/v1/dashboard", params={"language_code": "om"}, headers=AUTH_HEADERS).json()["learned_words"] == 0
    assert auth_client.get("/api/v1/reviews", params={"language_code": "om"}, headers=AUTH_HEADERS).json()["active_session"] is None
