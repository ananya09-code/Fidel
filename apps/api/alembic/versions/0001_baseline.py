"""Create the original vocabulary and audio schema.

Revision ID: 0001_baseline
Revises: None

The first production database predated Alembic and was originally stamped at
this revision. Defining that verified baseline here does not affect databases
where the revision is already applied, while allowing a new database to be
created entirely from migration history.
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa

revision = "0001_baseline"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "words",
        sa.Column("id", sa.Uuid(), nullable=False, server_default=sa.text("gen_random_uuid()")),
        sa.Column("language_code", sa.String(), nullable=False),
        sa.Column("text", sa.String(), nullable=False),
        sa.Column("transliteration", sa.String(), nullable=True),
        sa.Column("content_type", sa.String(), nullable=False, server_default="word"),
        sa.Column("category", sa.String(), nullable=True),
        sa.Column("difficulty", sa.String(), nullable=False, server_default="beginner"),
        sa.Column("status", sa.String(), nullable=False, server_default="draft"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id", name="words_pkey"),
        sa.UniqueConstraint("language_code", "text", name="words_language_text_unique"),
        sa.CheckConstraint("content_type IN ('word','phrase','sentence')", name="words_content_type_check"),
        sa.CheckConstraint("difficulty IN ('beginner','intermediate','advanced')", name="words_difficulty_check"),
        sa.CheckConstraint("status IN ('draft','approved')", name="words_status_check"),
    )
    op.create_index("idx_words_category", "words", ["category"])
    op.create_index("idx_words_language", "words", ["language_code"])

    op.create_table(
        "word_translations",
        sa.Column("id", sa.Uuid(), nullable=False, server_default=sa.text("gen_random_uuid()")),
        sa.Column("word_id", sa.Uuid(), nullable=False),
        sa.Column("language_code", sa.String(), nullable=False),
        sa.Column("meaning", sa.String(), nullable=False),
        sa.Column("context_note", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id", name="word_translations_pkey"),
        sa.ForeignKeyConstraint(["word_id"], ["words.id"], name="word_translations_word_id_fkey", ondelete="CASCADE"),
        sa.UniqueConstraint("word_id", "language_code", "meaning", name="word_translations_unique"),
    )
    op.create_index("idx_translations_word", "word_translations", ["word_id"])

    op.create_table(
        "audio_recordings",
        sa.Column("id", sa.Uuid(), nullable=False, server_default=sa.text("gen_random_uuid()")),
        sa.Column("word_id", sa.Uuid(), nullable=False),
        sa.Column("storage_key", sa.String(), nullable=False),
        sa.Column("speaker_id", sa.String(), nullable=True),
        sa.Column("speed", sa.String(), nullable=False, server_default="normal"),
        sa.Column("duration_ms", sa.Integer(), nullable=True),
        sa.Column("status", sa.String(), nullable=False, server_default="pending"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id", name="audio_recordings_pkey"),
        sa.ForeignKeyConstraint(["word_id"], ["words.id"], name="audio_recordings_word_id_fkey", ondelete="CASCADE"),
        sa.UniqueConstraint("word_id", "storage_key", name="audio_storage_key_unique"),
        sa.CheckConstraint("speed IN ('slow','normal')", name="audio_speed_check"),
        sa.CheckConstraint("status IN ('pending','draft','approved')", name="audio_status_check"),
        sa.CheckConstraint("duration_ms IS NULL OR duration_ms >= 0", name="audio_duration_check"),
    )
    op.create_index("idx_recordings_word", "audio_recordings", ["word_id"])


def downgrade() -> None:
    op.drop_index("idx_recordings_word", table_name="audio_recordings")
    op.drop_table("audio_recordings")
    op.drop_index("idx_translations_word", table_name="word_translations")
    op.drop_table("word_translations")
    op.drop_index("idx_words_language", table_name="words")
    op.drop_index("idx_words_category", table_name="words")
    op.drop_table("words")
