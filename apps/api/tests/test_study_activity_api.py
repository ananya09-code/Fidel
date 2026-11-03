"""Rolling study calendars use persisted answers and the authenticated learner's days."""

from datetime import date, datetime, time, timedelta, timezone
from uuid import uuid4
from zoneinfo import ZoneInfo

from sqlalchemy import text

from app.api.v1.endpoints import dashboard
from tests.conftest import AUTH_HEADERS

BASE = "/api/v1/dashboard/activity"


def seed_user(session_factory, clerk_id="user_test", zone="UTC"):
    user_id = uuid4()
    with session_factory() as session:
        session.execute(text("INSERT INTO users (id, clerk_id) VALUES (:id, :clerk_id)"), {"id": user_id, "clerk_id": clerk_id})
        session.execute(text("INSERT INTO user_preferences (user_id, timezone) VALUES (:id, :zone)"), {"id": user_id, "zone": zone})
        session.commit()
    return user_id


def seed_answer(session_factory, user_id, answered_at):
    with session_factory() as session:
        attempt_id = session.execute(text("SELECT id FROM lesson_attempts WHERE user_id = :user_id"), {"user_id": user_id}).scalar_one_or_none()
        if attempt_id is None:
            attempt_id = uuid4()
            session.execute(text("""
                INSERT INTO lesson_attempts (id, user_id, lesson_key, difficulty, category_key,
                    question_count, started_at, updated_at)
                VALUES (:id, :user_id, 'om-beginner-greetings', 'beginner', 'greetings', 50, :at, :at)
            """), {"id": attempt_id, "user_id": user_id, "at": answered_at})
        session.execute(text("""
            INSERT INTO answer_attempts (attempt_id, user_id, question_id, question_type,
                word_ids, is_correct, answered_at)
            VALUES (:id, :user_id, :question_id, 'multiple_choice', '[]', false, :at)
        """), {"id": attempt_id, "user_id": user_id, "question_id": str(uuid4()), "at": answered_at})
        session.commit()


def test_study_activity_requires_authentication(auth_client, mock_clerk):
    mock_clerk(user_id="")
    assert auth_client.get(BASE, headers=AUTH_HEADERS).status_code == 401


def test_empty_calendar_is_complete_and_read_only(auth_client, mock_clerk, session_factory):
    response = auth_client.get(BASE, headers=AUTH_HEADERS)
    assert response.status_code == 200
    body = response.json()
    assert body["timezone"] == "UTC"
    assert len(body["days"]) == 365
    start, end = date.fromisoformat(body["start_date"]), date.fromisoformat(body["end_date"])
    assert end - start == timedelta(days=364)
    assert [day["date"] for day in body["days"]] == [(start + timedelta(days=i)).isoformat() for i in range(365)]
    assert all(day["answers"] == 0 for day in body["days"])
    with session_factory() as session:
        assert session.execute(text("SELECT COUNT(*) FROM users")).scalar_one() == 0


def test_saved_timezone_groups_answers_across_utc_midnight(
    auth_client, mock_clerk, session_factory, monkeypatch,
):
    fixed_now = datetime(2026, 11, 3, 22, 30, tzinfo=timezone.utc)
    monkeypatch.setattr(dashboard, "_local_today", lambda zone: fixed_now.astimezone(zone).date())
    user_id = seed_user(session_factory, zone="Africa/Addis_Ababa")
    seed_answer(session_factory, user_id, datetime(2026, 11, 3, 20, 59, tzinfo=timezone.utc))
    seed_answer(session_factory, user_id, datetime(2026, 11, 3, 21, 1, tzinfo=timezone.utc))
    body = auth_client.get(BASE, headers=AUTH_HEADERS).json()
    counts = {day["date"]: day["answers"] for day in body["days"]}
    assert body["end_date"] == "2026-11-04"
    assert counts["2026-11-03"] == 1
    assert counts["2026-11-04"] == 1

    # Both incorrect answers in unfinished sessions count. Another user sees neither.
    seed_user(session_factory, clerk_id="user_other")
    mock_clerk(user_id="user_other")
    assert sum(day["answers"] for day in auth_client.get(BASE, headers=AUTH_HEADERS).json()["days"]) == 0


def test_range_boundaries_and_daylight_saving_days(
    auth_client, mock_clerk, session_factory, monkeypatch,
):
    today = date(2026, 3, 8)  # Spring-forward day is 23 hours in Los Angeles.
    monkeypatch.setattr(dashboard, "_local_today", lambda zone: today)
    zone = ZoneInfo("America/Los_Angeles")
    user_id = seed_user(session_factory, zone=zone.key)
    start = datetime.combine(today - timedelta(days=364), time.min, tzinfo=zone).astimezone(timezone.utc)
    end = datetime.combine(today + timedelta(days=1), time.min, tzinfo=zone).astimezone(timezone.utc)
    for value in (start - timedelta(seconds=1), start, end - timedelta(seconds=1), end):
        seed_answer(session_factory, user_id, value)
    body = auth_client.get(BASE, headers=AUTH_HEADERS).json()
    assert body["days"][0]["answers"] == 1
    assert body["days"][-1]["answers"] == 1
    assert sum(day["answers"] for day in body["days"]) == 2


def test_calendar_includes_leap_day_and_invalid_timezone_falls_back(
    auth_client, mock_clerk, session_factory, monkeypatch,
):
    monkeypatch.setattr(dashboard, "_local_today", lambda zone: date(2024, 3, 1))
    seed_user(session_factory, zone="invalid/timezone")
    body = auth_client.get(BASE, headers=AUTH_HEADERS).json()
    assert body["timezone"] == "UTC"
    assert {"date": "2024-02-29", "answers": 0} in body["days"]
    assert len(body["days"]) == 365
