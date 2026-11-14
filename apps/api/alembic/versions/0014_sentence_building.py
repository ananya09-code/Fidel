"""Add authored sentence tile exercises and saved learner answers.

Revision ID: 0014_sentence_building
Revises: 0013_guided_tour
"""

from alembic import op
import sqlalchemy as sa

revision = "0014_sentence_building"
down_revision = "0013_guided_tour"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("generation_batches", sa.Column("content_type", sa.String(20), nullable=True))
    op.create_table(
        "sentence_exercises",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("sentence_word_id", sa.Uuid(), nullable=False),
        sa.Column("tiles", sa.JSON(), nullable=False),
        sa.Column("accepted_orders", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["sentence_word_id"], ["words.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("sentence_word_id", name="sentence_exercises_sentence_word_id_key"),
    )
    op.create_table(
        "sentence_attempts",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("exercise_id", sa.Uuid(), nullable=False),
        sa.Column("selected_order", sa.JSON(), nullable=False),
        sa.Column("is_correct", sa.Boolean(), nullable=False),
        sa.Column("answered_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["exercise_id"], ["sentence_exercises.id"], ondelete="CASCADE"),
    )
    op.create_index("sentence_attempts_user_exercise_idx", "sentence_attempts", ["user_id", "exercise_id", "answered_at"])


def downgrade() -> None:
    op.drop_index("sentence_attempts_user_exercise_idx", table_name="sentence_attempts")
    op.drop_table("sentence_attempts")
    op.drop_table("sentence_exercises")
    op.drop_column("generation_batches", "content_type")
