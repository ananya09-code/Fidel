"""Select and send at most one useful reminder per local day and device."""

from __future__ import annotations

import json
import logging
from datetime import date, datetime, time, timedelta, timezone
from uuid import UUID, uuid4
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from pywebpush import WebPushException, webpush
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.database import SessionLocal
from app.services.spaced_repetition import schedule

logger = logging.getLogger(__name__)


def _zone(value: str) -> ZoneInfo:
    try:
        return ZoneInfo(value)
    except (ZoneInfoNotFoundError, ValueError):
        return ZoneInfo("UTC")


def _local_window(now: datetime, timezone_name: str, reminder_time: str) -> tuple[date, datetime, datetime] | None:
    zone = _zone(timezone_name)
    local = now.astimezone(zone)
    try:
        hour, minute = (int(part) for part in reminder_time.split(":"))
        reminder = time(hour, minute)
    except (ValueError, TypeError):
        return None
    scheduled = datetime.combine(local.date(), reminder, tzinfo=zone)
    if not scheduled <= local < scheduled + timedelta(hours=1):
        return None
    start = datetime.combine(local.date(), time.min, tzinfo=zone).astimezone(timezone.utc)
    end = datetime.combine(local.date() + timedelta(days=1), time.min, tzinfo=zone).astimezone(timezone.utc)
    return local.date(), start, end


def _has_activity(db: Session, user_id: UUID, language: str, start: datetime, end: datetime) -> bool:
    return bool(db.execute(text("""
        SELECT EXISTS (
          SELECT 1 FROM answer_attempts a JOIN lesson_attempts l ON l.id = a.attempt_id AND l.user_id = a.user_id
          WHERE a.user_id = :user_id AND l.lesson_key LIKE :lesson AND a.answered_at >= :start AND a.answered_at < :end
          UNION ALL
          SELECT 1 FROM review_answers a JOIN words w ON w.id = a.word_id
          WHERE a.user_id = :user_id AND w.language_code = :language AND a.answered_at >= :start AND a.answered_at < :end
        )
    """), {"user_id": user_id, "lesson": f"{language}-%", "language": language, "start": start, "end": end}).scalar_one())


def choose_reminder(db: Session, row, now: datetime) -> tuple[str, str, str, str] | None:
    """Return kind, title, body and in-app path from persisted learner state."""
    window = _local_window(now, row["timezone"], row["reminder_time"])
    if window is None:
        return None
    _, start, end = window
    language = row["learning_language"]
    if row["quiz_notifications_enabled"]:
        planned = schedule(db, row["user_id"], language)
        due = sum(next_at <= now for _, next_at in planned)
        if len(planned) >= 2 and due:
            return "quiz", "Your word quiz is ready", f"{due} {('word is' if due == 1 else 'words are')} ready to revisit.", "/test"
    if row["reminders_enabled"]:
        learned = db.execute(text("""
            SELECT COUNT(*) FROM user_words uw JOIN words w ON w.id = uw.word_id
            WHERE uw.user_id = :user_id AND w.language_code = :language AND uw.learning_state = 'learned'
              AND uw.last_seen_at >= :start AND uw.last_seen_at < :end
        """), {"user_id": row["user_id"], "language": language, "start": start, "end": end}).scalar_one()
        if learned < row["daily_goal_minutes"]:
            remaining = row["daily_goal_minutes"] - learned
            return "goal", "A few words for today", f"{remaining} {('word' if remaining == 1 else 'words')} to reach your daily goal.", "/Home"
    if row["streak_notifications_enabled"] and not _has_activity(db, row["user_id"], language, start, end):
        yesterday = start.astimezone(_zone(row["timezone"])).date() - timedelta(days=1)
        previous_start = datetime.combine(yesterday, time.min, tzinfo=_zone(row["timezone"])).astimezone(timezone.utc)
        if _has_activity(db, row["user_id"], language, previous_start, start):
            return "streak", "Keep your learning going", "A short lesson today keeps your streak moving.", "/Learn"
    return None


def deliver_due(db: Session, now: datetime, send=webpush) -> int:
    """Run from a trusted scheduler. No learner token or public HTTP trigger."""
    settings = get_settings()
    if not (settings.vapid_public_key and settings.vapid_private_key and settings.vapid_subject):
        raise RuntimeError("VAPID configuration is incomplete")
    rows = db.execute(text("""
        SELECT s.id AS subscription_id, s.user_id, s.endpoint, s.p256dh, s.auth,
               p.learning_language, p.daily_goal_minutes, p.timezone, p.reminder_time,
               p.reminders_enabled, p.quiz_notifications_enabled, p.streak_notifications_enabled
        FROM push_subscriptions s JOIN user_preferences p ON p.user_id = s.user_id
        WHERE p.onboarding_completed = true
          AND (p.reminders_enabled OR p.quiz_notifications_enabled OR p.streak_notifications_enabled)
    """)).mappings().all()
    delivered = 0
    for row in rows:
        selected = choose_reminder(db, row, now)
        if selected is None:
            continue
        kind, title, body, path = selected
        local_date = now.astimezone(_zone(row["timezone"])).date()
        claim = db.execute(text("""
            INSERT INTO notification_deliveries (id, subscription_id, kind, local_date)
            VALUES (:id, :subscription_id, :kind, :local_date)
            ON CONFLICT (subscription_id, local_date) DO NOTHING
            RETURNING id
        """), {"id": uuid4(), "subscription_id": row["subscription_id"], "kind": kind, "local_date": local_date}).scalar_one_or_none()
        db.commit()
        if claim is None:
            continue
        try:
            send(
                subscription_info={"endpoint": row["endpoint"], "keys": {"p256dh": row["p256dh"], "auth": row["auth"]}},
                data=json.dumps({"title": title, "body": body, "path": path}),
                vapid_private_key=settings.vapid_private_key.get_secret_value(),
                vapid_claims={"sub": settings.vapid_subject},
                ttl=3600,
                timeout=10,
            )
            delivered += 1
        except WebPushException as exc:
            code = getattr(exc.response, "status_code", None) if exc.response is not None else None
            if code in (404, 410):
                db.execute(text("DELETE FROM push_subscriptions WHERE id = :id"), {"id": row["subscription_id"]})
            else:
                db.execute(text("DELETE FROM notification_deliveries WHERE id = :id"), {"id": claim})
            db.commit()
            logger.warning("Push delivery failed (status=%s)", code)
        except Exception:
            db.execute(text("DELETE FROM notification_deliveries WHERE id = :id"), {"id": claim})
            db.commit()
            logger.exception("Push delivery failed")
    return delivered


def main() -> None:
    with SessionLocal() as db:
        count = deliver_due(db, datetime.now(timezone.utc))
    logger.info("Delivered %s notifications", count)


if __name__ == "__main__":
    main()
