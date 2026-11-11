"""Add isolated per-user, per-course quest progress; existing rows are untouched."""
from alembic import op
import sqlalchemy as sa

revision = "0009_quests"
down_revision = "0008_tigrinya_preferences"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "quest_progress",
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("language_code", sa.String(), nullable=False),
        sa.Column("quest_key", sa.String(), nullable=False),
        sa.Column("definition_version", sa.Integer(), nullable=False),
        sa.Column("step_index", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("answers", sa.JSON(), nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True)),
        sa.PrimaryKeyConstraint("user_id", "language_code", "quest_key"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.CheckConstraint("language_code IN ('om','am','ti')", name="quest_language_check"),
        sa.CheckConstraint("step_index >= 0", name="quest_step_check"),
        sa.CheckConstraint("definition_version > 0", name="quest_version_check"),
    )


def downgrade():
    # Downgrade would destroy quest history; require an explicit archival plan.
    raise RuntimeError("Archive quest_progress and review data retention before removing this table.")
