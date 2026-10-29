"""Add persisted lesson attempts, answers and per-word progress.

Revision ID: 0004_progress
Revises: 0003_users

Reconstructed from the verified deployed Neon schema. Neon already reports
this revision, so no migration command is required there.
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa

revision = "0004_progress"
down_revision = "0003_users"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "lesson_attempts",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("lesson_key", sa.String(), nullable=False),
        sa.Column("difficulty", sa.String(), nullable=False),
        sa.Column("category_key", sa.String(), nullable=False),
        sa.Column("category_label", sa.String(), nullable=True),
        sa.Column("difficulty_label", sa.String(), nullable=True),
        sa.Column("status", sa.String(), nullable=False, server_default="in_progress"),
        sa.Column("stage", sa.String(), nullable=False, server_default="vocabulary"),
        sa.Column("question_index", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("question_count", sa.Integer(), nullable=False),
        sa.Column("correct_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id", name="lesson_attempts_pkey"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name="lesson_attempts_user_id_fkey", ondelete="CASCADE"),
        sa.CheckConstraint("status IN ('in_progress','completed')", name="lesson_attempts_status_check"),
        sa.CheckConstraint("stage IN ('vocabulary','practice')", name="lesson_attempts_stage_check"),
        sa.CheckConstraint("question_index >= 0", name="lesson_attempts_question_index_check"),
        sa.CheckConstraint("question_count >= 0", name="lesson_attempts_question_count_check"),
        sa.CheckConstraint("correct_count >= 0", name="lesson_attempts_correct_count_check"),
        sa.CheckConstraint("(status = 'completed') = (completed_at IS NOT NULL)", name="lesson_attempts_completion_check"),
    )
    op.create_index("lesson_attempts_one_in_progress_per_lesson", "lesson_attempts", ["user_id", "lesson_key"], unique=True, postgresql_where=sa.text("status = 'in_progress'"))
    op.create_index("lesson_attempts_user_recent_idx", "lesson_attempts", ["user_id", "updated_at"])
    op.create_index("lesson_attempts_user_status_idx", "lesson_attempts", ["user_id", "status"])

    op.create_table(
        "answer_attempts",
        sa.Column("attempt_id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("question_id", sa.String(), nullable=False),
        sa.Column("question_type", sa.String(), nullable=False),
        sa.Column("word_ids", sa.JSON(), nullable=False),
        sa.Column("is_correct", sa.Boolean(), nullable=False),
        sa.Column("answered_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("attempt_id", "question_id", name="answer_attempts_pkey"),
        sa.ForeignKeyConstraint(["attempt_id"], ["lesson_attempts.id"], name="answer_attempts_attempt_id_fkey", ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name="answer_attempts_user_id_fkey", ondelete="CASCADE"),
    )
    op.create_index("answer_attempts_attempt_idx", "answer_attempts", ["attempt_id"])
    op.create_index("answer_attempts_user_correct_idx", "answer_attempts", ["user_id", "is_correct"])
    op.create_index("answer_attempts_user_recent_idx", "answer_attempts", ["user_id", "answered_at"])

    op.create_table(
        "user_words",
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("word_id", sa.Uuid(), nullable=False),
        sa.Column("times_seen", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("times_correct", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("text", sa.String(), nullable=True),
        sa.Column("meaning", sa.String(), nullable=True),
        sa.Column("first_seen_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("last_seen_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("user_id", "word_id", name="user_words_pkey"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name="user_words_user_id_fkey", ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["word_id"], ["words.id"], name="user_words_word_id_fkey", ondelete="CASCADE"),
        sa.CheckConstraint("times_seen >= 0", name="user_words_times_seen_check"),
        sa.CheckConstraint("times_correct >= 0", name="user_words_times_correct_check"),
        sa.CheckConstraint("times_correct <= times_seen", name="user_words_correct_not_above_seen_check"),
    )
    op.create_index("user_words_user_recent_idx", "user_words", ["user_id", "last_seen_at"])


def downgrade() -> None:
    op.drop_index("user_words_user_recent_idx", table_name="user_words")
    op.drop_table("user_words")
    op.drop_index("answer_attempts_user_recent_idx", table_name="answer_attempts")
    op.drop_index("answer_attempts_user_correct_idx", table_name="answer_attempts")
    op.drop_index("answer_attempts_attempt_idx", table_name="answer_attempts")
    op.drop_table("answer_attempts")
    op.drop_index("lesson_attempts_user_status_idx", table_name="lesson_attempts")
    op.drop_index("lesson_attempts_user_recent_idx", table_name="lesson_attempts")
    op.drop_index("lesson_attempts_one_in_progress_per_lesson", table_name="lesson_attempts")
    op.drop_table("lesson_attempts")
