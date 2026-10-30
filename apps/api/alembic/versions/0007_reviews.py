"""Add persisted vocabulary review sessions.

Revision ID: 0007_reviews
Revises: 0006_user_word_state
"""

from alembic import op
import sqlalchemy as sa

revision = "0007_reviews"
down_revision = "0006_user_word_state"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "review_sessions",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("word_ids", sa.JSON(), nullable=False),
        sa.Column("status", sa.String(), nullable=False, server_default="in_progress"),
        sa.Column("total_count", sa.Integer(), nullable=False),
        sa.Column("correct_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id", name="review_sessions_pkey"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name="review_sessions_user_id_fkey", ondelete="CASCADE"),
        sa.CheckConstraint("status IN ('in_progress','completed')", name="review_sessions_status_check"),
        sa.CheckConstraint("total_count > 0", name="review_sessions_total_count_check"),
        sa.CheckConstraint("correct_count >= 0 AND correct_count <= total_count", name="review_sessions_correct_count_check"),
        sa.CheckConstraint("(status = 'completed') = (completed_at IS NOT NULL)", name="review_sessions_completion_check"),
    )
    op.create_index(
        "review_sessions_one_in_progress_per_user", "review_sessions", ["user_id"],
        unique=True, postgresql_where=sa.text("status = 'in_progress'"),
    )
    op.create_index("review_sessions_user_recent_idx", "review_sessions", ["user_id", "started_at"])
    op.create_table(
        "review_answers",
        sa.Column("session_id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("word_id", sa.Uuid(), nullable=False),
        sa.Column("selected_word_id", sa.Uuid(), nullable=False),
        sa.Column("is_correct", sa.Boolean(), nullable=False),
        sa.Column("answered_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("session_id", "word_id", name="review_answers_pkey"),
        sa.ForeignKeyConstraint(["session_id"], ["review_sessions.id"], name="review_answers_session_id_fkey", ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name="review_answers_user_id_fkey", ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["word_id"], ["words.id"], name="review_answers_word_id_fkey", ondelete="CASCADE"),
    )
    op.create_index("review_answers_user_recent_idx", "review_answers", ["user_id", "answered_at"])


def downgrade() -> None:
    op.drop_index("review_answers_user_recent_idx", table_name="review_answers")
    op.drop_table("review_answers")
    op.drop_index("review_sessions_user_recent_idx", table_name="review_sessions")
    op.drop_index("review_sessions_one_in_progress_per_user", table_name="review_sessions")
    op.drop_table("review_sessions")

