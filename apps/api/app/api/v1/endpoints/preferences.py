"""Authenticated onboarding and preference endpoints."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Annotated, Any, Generator, Mapping
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends
from sqlalchemy import JSON, bindparam, text
from sqlalchemy.orm import Session

from app.core.clerk_auth import ClerkUser, get_current_user
from app.db.database import SessionLocal
from app.schemas.preferences import UserPreferences, UserPreferencesUpdate

router = APIRouter(prefix="/preferences", tags=["preferences"])


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _load_row(db: Session, clerk_id: str) -> Mapping[str, Any] | None:
    return db.execute(
        text(
            """
            SELECT
                p.learning_language, p.proficiency_level, p.motivations,
                p.daily_goal_minutes, p.interface_language,
                p.reminders_enabled, p.quiz_notifications_enabled,
                p.streak_notifications_enabled, p.reminder_time, p.sound_enabled,
                p.sound_volume,
                p.haptics_enabled,
                p.appearance, p.timezone, p.onboarding_completed,
                p.tour_completed_version, p.last_seen_update,
                p.created_at, p.updated_at
            FROM users AS u
            JOIN user_preferences AS p ON p.user_id = u.id
            WHERE u.clerk_id = :clerk_id
            """
        ),
        {"clerk_id": clerk_id},
    ).mappings().first()


def _serialize(row: Mapping[str, Any] | None) -> UserPreferences:
    if row is None:
        return UserPreferences()

    motivations = row["motivations"]
    if isinstance(motivations, str):
        motivations = json.loads(motivations)

    return UserPreferences(
        learning_language=row["learning_language"],
        proficiency_level=row["proficiency_level"],
        motivations=motivations,
        daily_goal_words=row["daily_goal_minutes"],
        interface_language=row["interface_language"],
        reminders_enabled=bool(row["reminders_enabled"]),
        quiz_notifications_enabled=bool(row["quiz_notifications_enabled"]),
        streak_notifications_enabled=bool(row["streak_notifications_enabled"]),
        reminder_time=row["reminder_time"],
        sound_enabled=bool(row["sound_enabled"]),
        sound_volume=row["sound_volume"],
        haptics_enabled=bool(row["haptics_enabled"]),
        appearance=row["appearance"],
        timezone=row["timezone"],
        onboarding_completed=bool(row["onboarding_completed"]),
        tour_completed_version=row["tour_completed_version"],
        last_seen_update=row["last_seen_update"],
        created_at=row["created_at"],
        updated_at=row["updated_at"],
    )


def _ensure_user(db: Session, clerk_id: str, now: datetime) -> UUID:
    user_id = uuid4()
    db.execute(
        text(
            """
            INSERT INTO users (id, clerk_id, created_at, updated_at)
            VALUES (:id, :clerk_id, :now, :now)
            ON CONFLICT (clerk_id) DO NOTHING
            """
        ),
        {"id": user_id, "clerk_id": clerk_id, "now": now},
    )
    return db.execute(
        text("SELECT id FROM users WHERE clerk_id = :clerk_id"),
        {"clerk_id": clerk_id},
    ).scalar_one()


@router.get("", response_model=UserPreferences)
def get_preferences(
    current_user: Annotated[ClerkUser, Depends(get_current_user)],
    db: Session = Depends(get_db),
) -> UserPreferences:
    """Return saved preferences, or defaults without writing to the database."""

    return _serialize(_load_row(db, current_user.user_id))


@router.patch("", response_model=UserPreferences)
def update_preferences(
    payload: UserPreferencesUpdate,
    current_user: Annotated[ClerkUser, Depends(get_current_user)],
    db: Session = Depends(get_db),
) -> UserPreferences:
    """Create or partially update preferences for the verified Clerk user."""

    existing = _serialize(_load_row(db, current_user.user_id))
    changes = payload.model_dump(exclude_unset=True, exclude_none=True)
    values = existing.model_dump(exclude={"created_at", "updated_at", "daily_goal_minutes"})
    values.update(changes)

    now = datetime.now(timezone.utc)
    user_id = _ensure_user(db, current_user.user_id, now)
    params = {
        **values,
        # Keep the deployed column name; its saved value now represents words.
        "daily_goal_minutes": values["daily_goal_words"],
        "user_id": user_id,
        "motivations": values["motivations"],
        "now": now,
    }
    statement = text(
            """
            INSERT INTO user_preferences (
                user_id, learning_language, proficiency_level, motivations,
                daily_goal_minutes, interface_language, reminders_enabled,
                quiz_notifications_enabled, streak_notifications_enabled,
                reminder_time, sound_enabled, sound_volume, haptics_enabled, appearance, timezone,
                onboarding_completed, tour_completed_version, last_seen_update, created_at, updated_at
            ) VALUES (
                :user_id, :learning_language, :proficiency_level, :motivations,
                :daily_goal_minutes, :interface_language, :reminders_enabled,
                :quiz_notifications_enabled, :streak_notifications_enabled,
                :reminder_time, :sound_enabled, :sound_volume, :haptics_enabled, :appearance, :timezone,
                :onboarding_completed, :tour_completed_version, :last_seen_update, :now, :now
            )
            ON CONFLICT (user_id) DO UPDATE SET
                learning_language = excluded.learning_language,
                proficiency_level = excluded.proficiency_level,
                motivations = excluded.motivations,
                daily_goal_minutes = excluded.daily_goal_minutes,
                interface_language = excluded.interface_language,
                reminders_enabled = excluded.reminders_enabled,
                quiz_notifications_enabled = excluded.quiz_notifications_enabled,
                streak_notifications_enabled = excluded.streak_notifications_enabled,
                reminder_time = excluded.reminder_time,
                sound_enabled = excluded.sound_enabled,
                sound_volume = excluded.sound_volume,
                haptics_enabled = excluded.haptics_enabled,
                appearance = excluded.appearance,
                timezone = excluded.timezone,
                onboarding_completed = excluded.onboarding_completed,
                tour_completed_version = excluded.tour_completed_version,
                last_seen_update = excluded.last_seen_update,
                updated_at = excluded.updated_at
            """
        ).bindparams(bindparam("motivations", type_=JSON()))
    db.execute(statement, params)
    db.commit()
    return _serialize(_load_row(db, current_user.user_id))
