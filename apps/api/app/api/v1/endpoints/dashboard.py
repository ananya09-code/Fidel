"""Authenticated dashboard statistics derived from persisted learning data."""

from __future__ import annotations

from collections import Counter, defaultdict
from datetime import date, datetime, time, timedelta, timezone
from math import ceil
from typing import Annotated, Generator
from uuid import UUID
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.clerk_auth import ClerkUser, get_current_user
from app.db.database import SessionLocal
from app.schemas.dashboard import (
    CurrentLesson,
    DailyActivity,
    DashboardSummary,
    RecentActivity,
)

router = APIRouter(prefix="/dashboard", tags=["dashboard"])
DAILY_WORD_GOAL = 5


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _as_datetime(value) -> datetime:
    if isinstance(value, datetime):
        result = value
    else:
        result = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    return result if result.tzinfo else result.replace(tzinfo=timezone.utc)


def _minutes(started, completed) -> int:
    seconds = max(0, (_as_datetime(completed) - _as_datetime(started)).total_seconds())
    return max(1, ceil(seconds / 60))


def _calculate_streak(activity_dates: set[date], today: date) -> int:
    """Count consecutive active days, allowing today to be unfinished."""
    cursor = today if today in activity_dates else today - timedelta(days=1)
    streak = 0
    while cursor in activity_dates:
        streak += 1
        cursor -= timedelta(days=1)
    return streak


def _empty(today: date) -> DashboardSummary:
    return DashboardSummary(
        daily_word_goal=DAILY_WORD_GOAL,
        words_learned_today=0,
        goal_minutes=5,
        study_minutes_today=0,
        streak_days=0,
        learned_words=0,
        needs_review_words=0,
        lessons_completed=0,
        reviews_completed=0,
        correct_answers=0,
        current_lesson=None,
        weekly_activity=[
            DailyActivity(date=today - timedelta(days=offset), minutes=0, events=0)
            for offset in range(6, -1, -1)
        ],
        recent_activity=[],
    )


@router.get("", response_model=DashboardSummary)
def get_dashboard(
    current_user: Annotated[ClerkUser, Depends(get_current_user)],
    db: Session = Depends(get_db),
) -> DashboardSummary:
    user = db.execute(
        text(
            """
            SELECT u.id, COALESCE(p.daily_goal_minutes, 5) AS goal_minutes,
                   COALESCE(p.timezone, 'UTC') AS timezone
            FROM users AS u
            LEFT JOIN user_preferences AS p ON p.user_id = u.id
            WHERE u.clerk_id = :clerk_id
            """
        ),
        {"clerk_id": current_user.user_id},
    ).mappings().first()
    if user is None:
        return _empty(datetime.now(timezone.utc).date())
    user_id: UUID = user["id"]
    try:
        learner_tz = ZoneInfo(user["timezone"])
    except (ZoneInfoNotFoundError, ValueError):
        learner_tz = ZoneInfo("UTC")
    today = datetime.now(learner_tz).date()
    today_start = datetime.combine(today, time.min, tzinfo=learner_tz).astimezone(timezone.utc)
    tomorrow_start = (today_start.astimezone(learner_tz) + timedelta(days=1)).astimezone(timezone.utc)

    word_counts = db.execute(
        text(
            """
            SELECT
              COALESCE(SUM(CASE WHEN learning_state = 'learned' THEN 1 ELSE 0 END), 0) AS learned,
              COALESCE(SUM(CASE WHEN learning_state = 'needs_review' THEN 1 ELSE 0 END), 0) AS review
            FROM user_words WHERE user_id = :user_id
            """
        ),
        {"user_id": user_id},
    ).mappings().one()
    words_learned_today = db.execute(
        text(
            """
            SELECT COUNT(*) FROM user_words
            WHERE user_id = :user_id
              AND learning_state = 'learned'
              AND last_seen_at >= :today_start
              AND last_seen_at < :tomorrow_start
            """
        ),
        {
            "user_id": user_id,
            "today_start": today_start,
            "tomorrow_start": tomorrow_start,
        },
    ).scalar_one()
    lesson_rows = db.execute(
        text(
            """
            SELECT lesson_key, category_label, status, stage, question_index,
                   question_count, correct_count, started_at, completed_at, updated_at
            FROM lesson_attempts WHERE user_id = :user_id
            ORDER BY updated_at DESC
            """
        ),
        {"user_id": user_id},
    ).mappings().all()
    review_rows = db.execute(
        text(
            """
            SELECT status, total_count, correct_count, started_at, completed_at, updated_at
            FROM review_sessions WHERE user_id = :user_id
            ORDER BY updated_at DESC
            """
        ),
        {"user_id": user_id},
    ).mappings().all()
    answer_times = list(db.execute(
        text("SELECT answered_at FROM answer_attempts WHERE user_id = :user_id"),
        {"user_id": user_id},
    ).scalars().all()) + list(db.execute(
        text("SELECT answered_at FROM review_answers WHERE user_id = :user_id"),
        {"user_id": user_id},
    ).scalars().all())
    correct_answers = db.execute(
        text(
            """
            SELECT
              (SELECT COUNT(*) FROM answer_attempts WHERE user_id = :user_id AND is_correct = true) +
              (SELECT COUNT(*) FROM review_answers WHERE user_id = :user_id AND is_correct = true)
            """
        ),
        {"user_id": user_id},
    ).scalar_one()

    minutes_by_date: dict[date, int] = defaultdict(int)
    events_by_date: Counter[date] = Counter()
    activity_dates: set[date] = set()
    recent: list[RecentActivity] = []
    for value in answer_times:
        local_date = _as_datetime(value).astimezone(learner_tz).date()
        activity_dates.add(local_date)
        events_by_date[local_date] += 1
    for row in lesson_rows:
        if row["status"] == "completed" and row["completed_at"]:
            local_date = _as_datetime(row["completed_at"]).astimezone(learner_tz).date()
            activity_dates.add(local_date)
            minutes_by_date[local_date] += _minutes(row["started_at"], row["completed_at"])
            recent.append(RecentActivity(
                kind="lesson", title=row["category_label"] or row["lesson_key"],
                occurred_at=_as_datetime(row["completed_at"]), correct_count=row["correct_count"],
                total_count=row["question_count"],
            ))
    for row in review_rows:
        if row["status"] == "completed" and row["completed_at"]:
            local_date = _as_datetime(row["completed_at"]).astimezone(learner_tz).date()
            activity_dates.add(local_date)
            minutes_by_date[local_date] += _minutes(row["started_at"], row["completed_at"])
            recent.append(RecentActivity(
                kind="review", title="Vocabulary review",
                occurred_at=_as_datetime(row["completed_at"]), correct_count=row["correct_count"],
                total_count=row["total_count"],
            ))

    streak = _calculate_streak(activity_dates, today)
    active = next((row for row in lesson_rows if row["status"] == "in_progress"), None)
    current = CurrentLesson(
        lesson_key=active["lesson_key"],
        title=active["category_label"] or active["lesson_key"],
        stage=active["stage"],
        question_index=active["question_index"],
        question_count=active["question_count"],
    ) if active else None
    week = [today - timedelta(days=offset) for offset in range(6, -1, -1)]
    recent.sort(key=lambda item: item.occurred_at, reverse=True)
    return DashboardSummary(
        daily_word_goal=DAILY_WORD_GOAL,
        words_learned_today=int(words_learned_today),
        goal_minutes=user["goal_minutes"],
        study_minutes_today=minutes_by_date[today],
        streak_days=streak,
        learned_words=int(word_counts["learned"]),
        needs_review_words=int(word_counts["review"]),
        lessons_completed=len({row["lesson_key"] for row in lesson_rows if row["status"] == "completed"}),
        reviews_completed=sum(row["status"] == "completed" for row in review_rows),
        correct_answers=int(correct_answers),
        current_lesson=current,
        weekly_activity=[DailyActivity(date=day, minutes=minutes_by_date[day], events=events_by_date[day]) for day in week],
        recent_activity=recent[:10],
    )

