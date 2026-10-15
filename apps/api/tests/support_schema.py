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
    CheckConstraint,
    Column,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    MetaData,
    String,
    Table,
    Text,
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