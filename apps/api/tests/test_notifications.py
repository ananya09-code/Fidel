"""Push subscriptions and reminder decisions use isolated learner data."""

from datetime import date, datetime, timedelta, timezone
from uuid import uuid4

from pydantic import SecretStr
from sqlalchemy import text

from app.core.config import get_settings
from app.services import notification_delivery
from app.services.notification_delivery import choose_reminder, deliver_due
from tests.conftest import AUTH_HEADERS

BASE = "/api/v1/notifications"
SUBSCRIPTION = {
    "endpoint": "https://fcm.googleapis.com/fcm/send/test-device",
    "keys": {"p256dh": "a" * 44, "auth": "b" * 22},
}


def _configure(monkeypatch):
    settings = get_settings()
    monkeypatch.setattr(settings, "vapid_public_key", "test-public-key")
    monkeypatch.setattr(settings, "vapid_private_key", SecretStr("test-private-key"))
    monkeypatch.setattr(settings, "vapid_subject", "mailto:notifications@example.test")


def test_push_subscription_is_authenticated_and_user_scoped(auth_client, mock_clerk, session_factory, monkeypatch):
    _configure(monkeypatch)
    assert auth_client.get(f"{BASE}/subscriptions").status_code == 401
    assert auth_client.post(f"{BASE}/subscriptions", headers=AUTH_HEADERS, json=SUBSCRIPTION).status_code == 409
    auth_client.patch("/api/v1/preferences", headers=AUTH_HEADERS, json={"onboarding_completed": True})
    assert auth_client.post(f"{BASE}/subscriptions", headers=AUTH_HEADERS, json=SUBSCRIPTION).status_code == 204
    assert auth_client.get(f"{BASE}/subscriptions", headers=AUTH_HEADERS).json()["endpoints"] == [SUBSCRIPTION["endpoint"]]

    mock_clerk("another_user")
    auth_client.patch("/api/v1/preferences", headers=AUTH_HEADERS, json={"onboarding_completed": True})
    assert auth_client.get(f"{BASE}/subscriptions", headers=AUTH_HEADERS).json()["endpoints"] == []
    assert auth_client.post(f"{BASE}/subscriptions", headers=AUTH_HEADERS, json=SUBSCRIPTION).status_code == 409
    assert auth_client.request("DELETE", f"{BASE}/subscriptions", headers=AUTH_HEADERS, json=SUBSCRIPTION).status_code == 204
    with session_factory() as db:
        assert db.execute(text("SELECT COUNT(*) FROM push_subscriptions")).scalar_one() == 1


def test_rejects_untrusted_push_endpoint(auth_client, mock_clerk, monkeypatch):
    _configure(monkeypatch)
    auth_client.patch("/api/v1/preferences", headers=AUTH_HEADERS, json={"onboarding_completed": True})
    unsafe = {**SUBSCRIPTION, "endpoint": "https://127.0.0.1/internal"}
    assert auth_client.post(f"{BASE}/subscriptions", headers=AUTH_HEADERS, json=unsafe).status_code == 422


def test_inbox_shows_only_authenticated_users_deliveries(auth_client, mock_clerk, session_factory, monkeypatch):
    _configure(monkeypatch)
    assert auth_client.get(f"{BASE}/inbox").status_code == 401

    auth_client.patch("/api/v1/preferences", headers=AUTH_HEADERS, json={"onboarding_completed": True})
    assert auth_client.get(f"{BASE}/inbox", headers=AUTH_HEADERS).json() == {"items": []}
    assert auth_client.post(f"{BASE}/subscriptions", headers=AUTH_HEADERS, json=SUBSCRIPTION).status_code == 204
    with session_factory() as db:
        first_subscription = db.execute(text("SELECT id FROM push_subscriptions WHERE endpoint = :endpoint"), {"endpoint": SUBSCRIPTION["endpoint"]}).scalar_one()
        db.execute(text("INSERT INTO notification_deliveries (id, subscription_id, kind, local_date) VALUES (:id, :subscription_id, 'goal', :day)"),
                   {"id": uuid4(), "subscription_id": first_subscription, "day": date(2026, 11, 13)})
        db.commit()
    assert auth_client.get(f"{BASE}/inbox", headers=AUTH_HEADERS).json() == {
        "items": [{"kind": "goal", "local_date": "2026-11-13"}]
    }

    mock_clerk("another_user")
    auth_client.patch("/api/v1/preferences", headers=AUTH_HEADERS, json={"onboarding_completed": True})
    assert auth_client.get(f"{BASE}/inbox", headers=AUTH_HEADERS).json() == {"items": []}
    second = {**SUBSCRIPTION, "endpoint": "https://fcm.googleapis.com/fcm/send/another-device"}
    assert auth_client.post(f"{BASE}/subscriptions", headers=AUTH_HEADERS, json=second).status_code == 204
    with session_factory() as db:
        second_subscription = db.execute(text("SELECT id FROM push_subscriptions WHERE endpoint = :endpoint"), {"endpoint": second["endpoint"]}).scalar_one()
        db.execute(text("INSERT INTO notification_deliveries (id, subscription_id, kind, local_date) VALUES (:id, :subscription_id, 'quiz', :day)"),
                   {"id": uuid4(), "subscription_id": second_subscription, "day": date(2026, 11, 14)})
        db.commit()
    assert auth_client.get(f"{BASE}/inbox", headers=AUTH_HEADERS).json() == {
        "items": [{"kind": "quiz", "local_date": "2026-11-14"}]
    }

    mock_clerk("user_test")
    assert auth_client.get(f"{BASE}/inbox", headers=AUTH_HEADERS).json() == {
        "items": [{"kind": "goal", "local_date": "2026-11-13"}]
    }


def test_daily_goal_delivery_is_deduplicated_and_uses_selected_language(auth_client, mock_clerk, session_factory, monkeypatch):
    _configure(monkeypatch)
    auth_client.patch("/api/v1/preferences", headers=AUTH_HEADERS, json={
        "onboarding_completed": True, "learning_language": "om", "daily_goal_words": 5,
        "timezone": "UTC", "reminder_time": "19:00",
    })
    auth_client.post(f"{BASE}/subscriptions", headers=AUTH_HEADERS, json=SUBSCRIPTION)
    now = datetime(2026, 11, 13, 19, 30, tzinfo=timezone.utc)
    sent = []
    with session_factory() as db:
        assert deliver_due(db, now, send=lambda **kwargs: sent.append(kwargs)) == 1
        assert deliver_due(db, now, send=lambda **kwargs: sent.append(kwargs)) == 0
        assert len(sent) == 1
        assert '"path": "/Home"' in sent[0]["data"]
        assert db.execute(text("SELECT kind FROM notification_deliveries")).scalar_one() == "goal"

        user_id = db.execute(text("SELECT id FROM users WHERE clerk_id = 'user_test'")).scalar_one()
        word_id = uuid4()
        db.execute(text("INSERT INTO words (id, language_code, text, status) VALUES (:id, 'om', 'test', 'approved')"), {"id": word_id})
        db.execute(text("INSERT INTO user_words (user_id, word_id, learning_state, last_seen_at) VALUES (:user_id, :word_id, 'learned', :seen)"), {"user_id": user_id, "word_id": word_id, "seen": now})
        db.commit()
        row = db.execute(text("""SELECT u.id AS user_id, p.learning_language, p.daily_goal_minutes,
            p.timezone, p.reminder_time, p.reminders_enabled, p.quiz_notifications_enabled,
            p.streak_notifications_enabled FROM users u JOIN user_preferences p ON p.user_id = u.id
            WHERE u.id = :id"""), {"id": user_id}).mappings().one()
        assert choose_reminder(db, row, now)[0] == "goal"
        assert choose_reminder(db, row, now - timedelta(hours=2)) is None
        assert choose_reminder(db, {**row, "learning_language": "am", "reminders_enabled": False}, now) is None


def test_no_delivery_when_all_reminders_disabled(auth_client, mock_clerk, session_factory, monkeypatch):
    _configure(monkeypatch)
    auth_client.patch("/api/v1/preferences", headers=AUTH_HEADERS, json={"onboarding_completed": True, "reminders_enabled": False})
    auth_client.post(f"{BASE}/subscriptions", headers=AUTH_HEADERS, json=SUBSCRIPTION)
    with session_factory() as db:
        assert deliver_due(db, datetime(2026, 11, 13, 19, 30, tzinfo=timezone.utc), send=lambda **_: None) == 0


def test_quiz_and_streak_use_saved_review_and_activity_rules(monkeypatch):
    now = datetime(2026, 11, 13, 19, 30, tzinfo=timezone.utc)
    row = {
        "user_id": uuid4(), "timezone": "UTC", "reminder_time": "19:00",
        "learning_language": "ti", "daily_goal_minutes": 5,
        "quiz_notifications_enabled": True, "reminders_enabled": False,
        "streak_notifications_enabled": True,
    }
    seen = []
    monkeypatch.setattr(notification_delivery, "schedule", lambda db, user_id, language: seen.append((user_id, language)) or [(uuid4(), now), (uuid4(), now + timedelta(days=3))])
    assert choose_reminder(None, row, now)[0] == "quiz"
    assert seen == [(row["user_id"], "ti")]

    monkeypatch.setattr(notification_delivery, "schedule", lambda *_: [])
    monkeypatch.setattr(notification_delivery, "_has_activity", lambda db, user_id, language, start, end: start.date() == now.date() - timedelta(days=1))
    assert choose_reminder(None, row, now)[0] == "streak"
    assert choose_reminder(None, row, now + timedelta(hours=2)) is None
