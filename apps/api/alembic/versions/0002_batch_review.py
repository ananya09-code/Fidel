"""Add generation batches and extend audio recordings for the review workflow.

Revision ID: 0002_batch_review
Revises: 0001_baseline
Create Date: 2026-10-14

Changes (all additive, no existing data is modified or deleted):

* new table ``generation_batches`` -- one row per generation run
* ``audio_recordings`` gains batch / attempt / review / failure columns
* ``audio_recordings.status`` accepts ``rejected`` and ``failed`` in
  addition to the existing ``pending``, ``draft`` and ``approved``
* ``audio_recordings.storage_key`` becomes nullable so a *failed* attempt can
  be tracked without pointing at an object that does not exist
* two partial unique indexes make concurrent generation safe:
  - only one running batch per (language, voice, speed)
  - only one active (non-superseded) recording per (word, voice, speed)
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa

revision = "0002_batch_review"
down_revision = "0001_baseline"
branch_labels = None
depends_on = None

BATCH_STATUS_VALUES = "'running','completed','failed'"
RECORDING_STATUS_VALUES = "'pending','draft','approved','rejected','failed'"


def upgrade() -> None:
    op.create_table(
        "generation_batches",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("language_code", sa.String(), nullable=False),
        sa.Column("speaker_id", sa.String(), nullable=False),
        sa.Column("speed", sa.String(), nullable=False),
        sa.Column(
            "status",
            sa.String(),
            nullable=False,
            server_default="running",
        ),
        sa.Column("requested_size", sa.Integer(), nullable=False),
        sa.Column("total_selected", sa.Integer(), nullable=False,
                  server_default="0"),
        sa.Column("generated_count", sa.Integer(), nullable=False,
                  server_default="0"),
        sa.Column("failed_count", sa.Integer(), nullable=False,
                  server_default="0"),
        sa.Column("error", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id", name="generation_batches_pkey"),
        sa.CheckConstraint(
            f"status IN ({BATCH_STATUS_VALUES})",
            name="generation_batches_status_check",
        ),
        sa.CheckConstraint(
            "requested_size > 0",
            name="generation_batches_size_check",
        ),
    )

    # One running batch per language/voice/speed configuration. This is what
    # stops two dashboard clicks (or two workers) from duplicating work.
    op.create_index(
        "generation_batches_one_running_per_config",
        "generation_batches",
        ["language_code", "speaker_id", "speed"],
        unique=True,
        postgresql_where=sa.text("status = 'running'"),
        sqlite_where=sa.text("status = 'running'"),
    )

    op.add_column(
        "audio_recordings",
        sa.Column("batch_id", sa.Uuid(), nullable=True),
    )
    op.add_column(
        "audio_recordings",
        sa.Column("attempt", sa.Integer(), nullable=False,
                  server_default="1"),
    )
    op.add_column(
        "audio_recordings",
        sa.Column("generation_error", sa.Text(), nullable=True),
    )
    op.add_column(
        "audio_recordings",
        sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "audio_recordings",
        sa.Column("reviewed_by", sa.String(), nullable=True),
    )
    op.add_column(
        "audio_recordings",
        sa.Column("rejection_reason", sa.Text(), nullable=True),
    )
    op.add_column(
        "audio_recordings",
        sa.Column("superseded_at", sa.DateTime(timezone=True), nullable=True),
    )

    op.create_foreign_key(
        "audio_recordings_batch_id_fkey",
        "audio_recordings",
        "generation_batches",
        ["batch_id"],
        ["id"],
        ondelete="SET NULL",
    )

    # A failed attempt has no object behind it, so the key must be optional.
    op.alter_column(
        "audio_recordings",
        "storage_key",
        existing_type=sa.String(),
        nullable=True,
    )

    op.drop_constraint("audio_status_check", "audio_recordings",
                       type_="check")
    op.create_check_constraint(
        "audio_status_check",
        "audio_recordings",
        f"status IN ({RECORDING_STATUS_VALUES})",
    )

    op.create_check_constraint(
        "audio_attempt_check",
        "audio_recordings",
        "attempt > 0",
    )

    op.create_index(
        "audio_recordings_word_config_idx",
        "audio_recordings",
        ["word_id", "speaker_id", "speed"],
        unique=False,
    )

    op.create_index(
        "audio_recordings_batch_idx",
        "audio_recordings",
        ["batch_id"],
        unique=False,
    )

    # Regeneration history: every attempt keeps its own row, and only one row
    # per (word, voice, speed) may be current. NULLs (legacy rows with no
    # speaker_id) never collide, so existing data is safe.
    op.create_index(
        "audio_recordings_one_active_per_config",
        "audio_recordings",
        ["word_id", "speaker_id", "speed"],
        unique=True,
        postgresql_where=sa.text("superseded_at IS NULL"),
        sqlite_where=sa.text("superseded_at IS NULL"),
    )


def downgrade() -> None:
    op.drop_index("audio_recordings_one_active_per_config",
                  table_name="audio_recordings")
    op.drop_index("audio_recordings_batch_idx",
                  table_name="audio_recordings")
    op.drop_index("audio_recordings_word_config_idx",
                  table_name="audio_recordings")
    op.drop_constraint("audio_attempt_check", "audio_recordings",
                       type_="check")

    # Rows created by the new workflow may have a NULL storage key, so the
    # column cannot simply be made NOT NULL again without data loss.
    op.drop_constraint("audio_status_check", "audio_recordings",
                       type_="check")
    op.create_check_constraint(
        "audio_status_check",
        "audio_recordings",
        "status IN ('pending','draft','approved')",
    )

    op.drop_constraint("audio_recordings_batch_id_fkey",
                       "audio_recordings", type_="foreignkey")

    for column in (
        "superseded_at",
        "rejection_reason",
        "reviewed_by",
        "reviewed_at",
        "generation_error",
        "attempt",
        "batch_id",
    ):
        op.drop_column("audio_recordings", column)

    op.drop_index("generation_batches_one_running_per_config",
                  table_name="generation_batches")
    op.drop_table("generation_batches")