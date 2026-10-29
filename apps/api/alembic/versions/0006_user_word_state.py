"""Add favorite and learning state to per-user vocabulary.

Revision ID: 0006_user_word_state
Revises: 0005_user_preferences
"""

from alembic import op
import sqlalchemy as sa

revision = "0006_user_word_state"
down_revision = "0005_user_preferences"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "user_words",
        sa.Column("is_favorite", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.add_column(
        "user_words",
        sa.Column("learning_state", sa.String(), nullable=False, server_default="learning"),
    )
    op.create_check_constraint(
        "user_words_learning_state_check",
        "user_words",
        "learning_state IN ('learning','learned','needs_review')",
    )
    op.create_index("user_words_user_state_idx", "user_words", ["user_id", "learning_state"])
    op.create_index(
        "user_words_user_favorite_idx", "user_words", ["user_id", "is_favorite"]
    )


def downgrade() -> None:
    op.drop_index("user_words_user_favorite_idx", table_name="user_words")
    op.drop_index("user_words_user_state_idx", table_name="user_words")
    op.drop_constraint("user_words_learning_state_check", "user_words", type_="check")
    op.drop_column("user_words", "learning_state")
    op.drop_column("user_words", "is_favorite")

