"""Isolated schema used by the audio-review tests.

The tables mirror ``alembic/versions/0002_batch_review.py`` but are built with
SQLAlchemy types so they work on SQLite as well as PostgreSQL. Tests run
against an in-memory database, so no production recording, row or object is
ever created, changed or approved.
"""

from __future__ import annotations

import sqlite3
import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Column,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    JSON,
    MetaData,
    String,
    Table,
    Text,
    UniqueConstraint,
    Uuid,
    create_engine,
    event,
    text,
)
from sqlalchemy.engine import Engine
from sqlalchemy.pool import StaticPool

# Raw text() SQL carries no type information, so SQLite needs to be told how
# to bind uuid.UUID values. This is test-only and never touches PostgreSQL.
sqlite3.register_adapter(uuid.UUID, str)
sqlite3.register_adapter(
    datetime, lambda value: value.isoformat() if value is not None else None
)

metadata = MetaData()

words = Table(
    "words",
    metadata,
    Column("id", Uuid, primary_key=True, default=uuid.uuid4),
    Column("language_code", String, nullable=False),
    Column("text", String, nullable=False),
    Column("transliteration", String),
    Column("content_type", String, nullable=False, server_default="word"),
    Column("category", String),
    Column("difficulty", String, nullable=False, server_default="beginner"),
    Column("status", String, nullable=False, server_default="draft"),
    Column(
        "created_at",
        DateTime(timezone=True),
        nullable=False,
        server_default=text("CURRENT_TIMESTAMP"),
    ),
    CheckConstraint(
        "content_type IN ('word','phrase','sentence')",
        name="words_content_type_check",
    ),
    CheckConstraint("status IN ('draft','approved')", name="words_status_check"),
)

word_translations = Table(
    "word_translations",
    metadata,
    Column("id", Uuid, primary_key=True, default=uuid.uuid4),
    Column("word_id", Uuid, ForeignKey("words.id"), nullable=False),
    Column("language_code", String, nullable=False),
    Column("meaning", String, nullable=False),
    Column("context_note", String),
    Column(
        "created_at",
        DateTime(timezone=True),
        nullable=False,
        server_default=text("CURRENT_TIMESTAMP"),
    ),
)

users = Table(
    "users",
    metadata,
    Column("id", Uuid, primary_key=True, default=uuid.uuid4),
    Column("clerk_id", String, nullable=False),
    Column("email", String),
    Column("display_name", String),
    Column(
        "created_at",
        DateTime(timezone=True),
        nullable=False,
        server_default=text("CURRENT_TIMESTAMP"),
    ),
    Column(
        "updated_at",
        DateTime(timezone=True),
        nullable=False,
        server_default=text("CURRENT_TIMESTAMP"),
    ),
    UniqueConstraint("clerk_id", name="users_clerk_id_key"),
    Index("users_email_idx", "email"),
)

generation_batches = Table(
    "generation_batches",
    metadata,
    Column("id", Uuid, primary_key=True),
    Column("language_code", String, nullable=False),
    Column("speaker_id", String, nullable=False),
    Column("speed", String, nullable=False),
    Column("status", String, nullable=False, server_default="running"),
    Column("requested_size", Integer, nullable=False),
    Column("total_selected", Integer, nullable=False, server_default="0"),
    Column("generated_count", Integer, nullable=False, server_default="0"),
    Column("failed_count", Integer, nullable=False, server_default="0"),
    Column("error", Text),
    Column(
        "created_at",
        DateTime(timezone=True),
        nullable=False,
        server_default=text("CURRENT_TIMESTAMP"),
    ),
    Column("started_at", DateTime(timezone=True)),
    Column("completed_at", DateTime(timezone=True)),
    CheckConstraint(
        "status IN ('running','completed','failed')",
        name="generation_batches_status_check",
    ),
    CheckConstraint(
        "requested_size > 0", name="generation_batches_size_check"
    ),
    Index(
        "generation_batches_one_running_per_config",
        "language_code",
        "speaker_id",
        "speed",
        unique=True,
        sqlite_where=text("status = 'running'"),
        postgresql_where=text("status = 'running'"),
    ),
)

audio_recordings = Table(
    "audio_recordings",
    metadata,
    Column("id", Uuid, primary_key=True),
    Column("word_id", Uuid, ForeignKey("words.id"), nullable=False),
    Column("storage_key", String, nullable=True),
    Column("speaker_id", String),
    Column("speed", String, nullable=False, server_default="normal"),
    Column("duration_ms", Integer),
    Column("status", String, nullable=False, server_default="pending"),
    Column(
        "created_at",
        DateTime(timezone=True),
        nullable=False,
        server_default=text("CURRENT_TIMESTAMP"),
    ),
    Column("batch_id", Uuid, ForeignKey("generation_batches.id", ondelete="SET NULL")),
    Column("attempt", Integer, nullable=False, server_default="1"),
    Column("generation_error", Text),
    Column("reviewed_at", DateTime(timezone=True)),
    Column("reviewed_by", String),
    Column("rejection_reason", Text),
    Column("superseded_at", DateTime(timezone=True)),
    CheckConstraint(
        "status IN ('pending','draft','approved','rejected','failed')",
        name="audio_status_check",
    ),
    CheckConstraint("speed IN ('slow','normal')", name="audio_speed_check"),
    CheckConstraint("attempt > 0", name="audio_attempt_check"),
    Index("audio_recordings_word_config_idx", "word_id", "speaker_id", "speed"),
    Index("audio_recordings_batch_idx", "batch_id"),
    Index(
        "audio_recordings_one_active_per_config",
        "word_id",
        "speaker_id",
        "speed",
        unique=True,
        sqlite_where=text("superseded_at IS NULL"),
        postgresql_where=text("superseded_at IS NULL"),
    ),
)

lesson_attempts = Table(
    "lesson_attempts",
    metadata,
    Column("id", Uuid, primary_key=True),
    Column("user_id", Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
    Column("lesson_key", String, nullable=False),
    Column("difficulty", String, nullable=False),
    Column("category_key", String, nullable=False),
    Column("category_label", String),
    Column("difficulty_label", String),
    Column("status", String, nullable=False, server_default="in_progress"),
    Column("stage", String, nullable=False, server_default="vocabulary"),
    Column("question_index", Integer, nullable=False, server_default="0"),
    Column("question_count", Integer, nullable=False),
    Column("correct_count", Integer, nullable=False, server_default="0"),
    Column("started_at", DateTime(timezone=True), nullable=False, server_default=text("CURRENT_TIMESTAMP")),
    Column("completed_at", DateTime(timezone=True)),
    Column("updated_at", DateTime(timezone=True), nullable=False, server_default=text("CURRENT_TIMESTAMP")),
    CheckConstraint("status IN ('in_progress','completed')", name="lesson_attempts_status_check"),
    CheckConstraint("stage IN ('vocabulary','practice')", name="lesson_attempts_stage_check"),
    CheckConstraint("question_index >= 0", name="lesson_attempts_question_index_check"),
    CheckConstraint("question_count >= 0", name="lesson_attempts_question_count_check"),
    CheckConstraint("correct_count >= 0", name="lesson_attempts_correct_count_check"),
    CheckConstraint("(status = 'completed') = (completed_at IS NOT NULL)", name="lesson_attempts_completion_check"),
    Index("lesson_attempts_user_recent_idx", "user_id", "updated_at"),
    Index("lesson_attempts_user_status_idx", "user_id", "status"),
    Index(
        "lesson_attempts_one_in_progress_per_lesson",
        "user_id",
        "lesson_key",
        unique=True,
        sqlite_where=text("status = 'in_progress'"),
        postgresql_where=text("status = 'in_progress'"),
    ),
)

answer_attempts = Table(
    "answer_attempts",
    metadata,
    Column("attempt_id", Uuid, ForeignKey("lesson_attempts.id", ondelete="CASCADE"), primary_key=True),
    Column("user_id", Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
    Column("question_id", String, primary_key=True),
    Column("question_type", String, nullable=False),
    Column("word_ids", JSON, nullable=False),
    Column("is_correct", Boolean, nullable=False),
    Column("answered_at", DateTime(timezone=True), nullable=False, server_default=text("CURRENT_TIMESTAMP")),
    Index("answer_attempts_attempt_idx", "attempt_id"),
    Index("answer_attempts_user_correct_idx", "user_id", "is_correct"),
    Index("answer_attempts_user_recent_idx", "user_id", "answered_at"),
)

user_words = Table(
    "user_words",
    metadata,
    Column("user_id", Uuid, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("word_id", Uuid, ForeignKey("words.id", ondelete="CASCADE"), primary_key=True),
    Column("times_seen", Integer, nullable=False, server_default="0"),
    Column("times_correct", Integer, nullable=False, server_default="0"),
    Column("text", String),
    Column("meaning", String),
    Column("first_seen_at", DateTime(timezone=True), nullable=False, server_default=text("CURRENT_TIMESTAMP")),
    Column("last_seen_at", DateTime(timezone=True), nullable=False, server_default=text("CURRENT_TIMESTAMP")),
    CheckConstraint("times_seen >= 0", name="user_words_times_seen_check"),
    CheckConstraint("times_correct >= 0", name="user_words_times_correct_check"),
    CheckConstraint("times_correct <= times_seen", name="user_words_correct_not_above_seen_check"),
    Index("user_words_user_recent_idx", "user_id", "last_seen_at"),
)

user_preferences = Table(
    "user_preferences",
    metadata,
    Column("user_id", Uuid, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("learning_language", String, nullable=False, server_default="om"),
    Column("proficiency_level", String),
    Column("motivations", JSON, nullable=False, server_default="[]"),
    Column("daily_goal_minutes", Integer, nullable=False, server_default="5"),
    Column("interface_language", String, nullable=False, server_default="en"),
    Column("reminders_enabled", Boolean, nullable=False, server_default="1"),
    Column("reminder_time", String, nullable=False, server_default="19:00"),
    Column("sound_enabled", Boolean, nullable=False, server_default="1"),
    Column("appearance", String, nullable=False, server_default="system"),
    Column("timezone", String, nullable=False, server_default="UTC"),
    Column("onboarding_completed", Boolean, nullable=False, server_default="0"),
    Column("created_at", DateTime(timezone=True), nullable=False, server_default=text("CURRENT_TIMESTAMP")),
    Column("updated_at", DateTime(timezone=True), nullable=False, server_default=text("CURRENT_TIMESTAMP")),
    CheckConstraint("learning_language IN ('om','am')", name="user_preferences_learning_language_check"),
    CheckConstraint("proficiency_level IS NULL OR proficiency_level IN ('beginner','some','conversational','improving')", name="user_preferences_proficiency_level_check"),
    CheckConstraint("daily_goal_minutes IN (5,10,15,20)", name="user_preferences_daily_goal_check"),
    CheckConstraint("interface_language IN ('en','om','am')", name="user_preferences_interface_language_check"),
    CheckConstraint("appearance IN ('light','dark','system')", name="user_preferences_appearance_check"),
)


def _stringify_uuids(value: Any) -> Any:
    """SQLite cannot bind ``uuid.UUID``; store and compare them as text."""
    if isinstance(value, uuid.UUID):
        return str(value)

    if isinstance(value, dict):
        return {k: _stringify_uuids(v) for k, v in value.items()}

    if isinstance(value, (list, tuple)):
        return type(value)(_stringify_uuids(item) for item in value)

    return value


def create_test_engine() -> Engine:
    """Create an isolated in-memory database with the review schema."""
    engine = create_engine(
        "sqlite+pysqlite:///:memory:",
        connect_args={"check_same_thread": False},
        # A single shared connection, otherwise each session would get its own
        # empty in-memory database.
        poolclass=StaticPool,
    )

    @event.listens_for(engine, "before_cursor_execute")
    def _convert_uuids(conn, cursor, statement, parameters, context, executemany):
        return statement, _stringify_uuids(parameters)

    metadata.create_all(engine)
    return engine


def utcnow() -> datetime:
    return datetime.now(timezone.utc)
