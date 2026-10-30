"""Tests for real, authenticated dashboard statistics."""

import json
from datetime import datetime, timedelta, timezone
from uuid import uuid4

from sqlalchemy import text

from tests.conftest import AUTH_HEADERS
from app.api.v1.endpoints.dashboard import _calculate_streak

BASE = "/api/v1/dashboard"


def test_streak_handles_today_yesterday_and_gaps():
    today = datetime(2026, 10, 30, tzinfo=timezone.utc).date()
    assert _calculate_streak({today, today - timedelta(days=1)}, today) == 2
    assert _calculate_streak({today - timedelta(days=1), today - timedelta(days=2)}, today) == 2
    assert _calculate_streak({today, today - timedelta(days=2)}, today) == 1


def test_dashboard_requires_authentication(auth_client, mock_clerk):
    mock_clerk(user_id="")
    assert auth_client.get(BASE).status_code == 401


def test_empty_dashboard_is_safe_and_does_not_create_user(auth_client, mock_clerk, session_factory):
    response = auth_client.get(BASE, headers=AUTH_HEADERS)
    assert response.status_code == 200
    body = response.json()
    assert body["lessons_completed"] == 0
    assert body["learned_words"] == 0
    assert body["daily_word_goal"] == 5
    assert body["words_learned_today"] == 0
    assert body["current_lesson"] is None
    assert len(body["weekly_activity"]) == 7
    with session_factory() as session:
        assert session.execute(text("SELECT COUNT(*) FROM users")).scalar_one() == 0


def test_dashboard_uses_persisted_user_data(auth_client, mock_clerk, session_factory):
    now = datetime.now(timezone.utc)
    started = now - timedelta(minutes=8)
    user_id, word_one, word_two = uuid4(), uuid4(), uuid4()
    completed_attempt, active_attempt, review_id = uuid4(), uuid4(), uuid4()
    with session_factory() as session:
        session.execute(text("INSERT INTO users (id, clerk_id, created_at, updated_at) VALUES (:id, 'user_test', :now, :now)"), {"id": user_id, "now": now})
        session.execute(text("INSERT INTO user_preferences (user_id, daily_goal_minutes, timezone, motivations, created_at, updated_at) VALUES (:id, 15, 'UTC', '[]', :now, :now)"), {"id": user_id, "now": now})
        for word_id, value in ((word_one, "learned"), (word_two, "needs_review")):
            session.execute(text("INSERT INTO words (id, language_code, text, content_type, category, difficulty, status, created_at) VALUES (:id, 'om', :text, 'word', 'greetings', 'beginner', 'approved', :now)"), {"id": word_id, "text": str(word_id), "now": now})
            session.execute(text("INSERT INTO user_words (user_id, word_id, times_seen, times_correct, first_seen_at, last_seen_at, is_favorite, learning_state) VALUES (:user, :word, 1, :correct, :now, :now, false, :state)"), {"user": user_id, "word": word_id, "correct": 1 if value == "learned" else 0, "state": value, "now": now})
        session.execute(text("""
            INSERT INTO lesson_attempts (id, user_id, lesson_key, difficulty, category_key, category_label, status, stage, question_index, question_count, correct_count, started_at, completed_at, updated_at)
            VALUES (:id, :user, 'lesson-complete', 'beginner', 'greetings', 'Greetings', 'completed', 'practice', 1, 1, 1, :started, :now, :now)
        """), {"id": completed_attempt, "user": user_id, "started": started, "now": now})
        session.execute(text("""
            INSERT INTO lesson_attempts (id, user_id, lesson_key, difficulty, category_key, category_label, status, stage, question_index, question_count, correct_count, started_at, completed_at, updated_at)
            VALUES (:id, :user, 'lesson-current', 'beginner', 'family', 'Family', 'in_progress', 'vocabulary', 2, 5, 0, :now, NULL, :now)
        """), {"id": active_attempt, "user": user_id, "now": now})
        session.execute(text("INSERT INTO answer_attempts (attempt_id, user_id, question_id, question_type, word_ids, is_correct, answered_at) VALUES (:attempt, :user, 'q1', 'multiple_choice', :words, true, :now)"), {"attempt": completed_attempt, "user": user_id, "words": json.dumps([str(word_one)]), "now": now})
        session.execute(text("""
            INSERT INTO review_sessions (id, user_id, word_ids, status, total_count, correct_count, started_at, completed_at, updated_at)
            VALUES (:id, :user, :words, 'completed', 1, 1, :started, :now, :now)
        """), {"id": review_id, "user": user_id, "words": json.dumps([str(word_one)]), "started": started, "now": now})
        session.execute(text("INSERT INTO review_answers (session_id, user_id, word_id, selected_word_id, is_correct, answered_at) VALUES (:session, :user, :word, :word, true, :now)"), {"session": review_id, "user": user_id, "word": word_one, "now": now})
        session.commit()

    body = auth_client.get(BASE, headers=AUTH_HEADERS).json()
    assert body["goal_minutes"] == 15
    assert body["daily_word_goal"] == 5
    assert body["words_learned_today"] == 1
    assert body["learned_words"] == 1
    assert body["needs_review_words"] == 1
    assert body["lessons_completed"] == 1
    assert body["reviews_completed"] == 1
    assert body["correct_answers"] == 2
    assert body["streak_days"] == 1
    assert body["study_minutes_today"] == 16
    assert body["current_lesson"]["lesson_key"] == "lesson-current"
    assert len(body["recent_activity"]) == 2


def test_dashboard_is_cross_user_isolated(auth_client, mock_clerk, session_factory):
    mock_clerk(user_id="another_user")
    body = auth_client.get(BASE, headers=AUTH_HEADERS).json()
    assert body["learned_words"] == 0
    assert body["lessons_completed"] == 0

