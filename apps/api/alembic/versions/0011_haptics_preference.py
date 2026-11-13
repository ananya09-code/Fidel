"""Save independent haptics and sound volume preferences for practice.

Revision ID: 0011_haptics_preference
Revises: 0010_review_language
"""

from alembic import op
import sqlalchemy as sa

revision = "0011_haptics_preference"
down_revision = "0010_review_language"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "user_preferences",
        sa.Column("haptics_enabled", sa.Boolean(), nullable=False, server_default=sa.true()),
    )
    op.add_column(
        "user_preferences",
        sa.Column("sound_volume", sa.Integer(), nullable=False, server_default="75"),
    )
    op.create_check_constraint(
        "user_preferences_sound_volume_check",
        "user_preferences",
        "sound_volume BETWEEN 0 AND 100",
    )


def downgrade() -> None:
    op.drop_constraint("user_preferences_sound_volume_check", "user_preferences", type_="check")
    op.drop_column("user_preferences", "sound_volume")
    op.drop_column("user_preferences", "haptics_enabled")
