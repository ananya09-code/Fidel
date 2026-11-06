"""A deterministic review schedule derived from existing, persisted review history.

No new schema or background worker is needed: due dates are computed in UTC when
the learner opens the app. Only completed sessions advance the interval.
"""

from collections import defaultdict
from datetime import datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy import text
from sqlalchemy.orm import Session

INTERVAL_DAYS = (3, 14, 30, 90, 180, 365)


def utc(value: datetime | str) -> datetime:
    if isinstance(value, str):
        value = datetime.fromisoformat(value.replace("Z", "+00:00"))
    return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value.astimezone(timezone.utc)


def next_review(last_seen, state: str, history: list) -> datetime:
    """Correct recalls widen the gap; a miss resets it to one day."""
    streak = 0
    anchor = utc(last_seen)
    for answer in history:
        streak = streak + 1 if answer["is_correct"] else 0
        anchor = max(anchor, utc(answer["completed_at"]))
    days = 1 if state == "needs_review" else INTERVAL_DAYS[min(streak, len(INTERVAL_DAYS) - 1)]
    return anchor + timedelta(days=days)


def schedule(db: Session, user_id: UUID, language_code: str) -> list[tuple[UUID, datetime]]:
    history = db.execute(text("""
        SELECT a.word_id, a.is_correct, s.completed_at
        FROM review_answers a JOIN review_sessions s ON s.id = a.session_id
        JOIN words w ON w.id = a.word_id
        WHERE a.user_id = :user_id AND s.user_id = :user_id
          AND s.status = 'completed' AND w.language_code = :language
        ORDER BY s.completed_at, s.id
    """), {"user_id": user_id, "language": language_code}).mappings().all()
    by_word = defaultdict(list)
    for answer in history:
        by_word[str(answer["word_id"])].append(answer)
    rows = db.execute(text("""
        SELECT uw.word_id, uw.learning_state, uw.last_seen_at, uw.times_correct
        FROM user_words uw JOIN words w ON w.id = uw.word_id
        WHERE uw.user_id = :user_id AND w.language_code = :language
          AND w.status = 'approved' AND uw.learning_state IN ('learned', 'needs_review')
    """), {"user_id": user_id, "language": language_code}).mappings().all()
    result = []
    for row in rows:
        answers = by_word[str(row["word_id"])]
        if row["learning_state"] != "learned" and not row["times_correct"] and not answers:
            continue  # A word never learned successfully is ordinary practice.
        result.append((row["word_id"], next_review(row["last_seen_at"], row["learning_state"], answers)))
    return sorted(result, key=lambda item: (item[1], str(item[0])))
