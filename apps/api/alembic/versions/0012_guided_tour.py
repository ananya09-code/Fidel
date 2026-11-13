"""Remember each learner's tour and release-note progress.

Revision ID: 0012_guided_tour
Revises: 0011_haptics_preference
"""

from alembic import op
import sqlalchemy as sa

revision = "0012_guided_tour"
down_revision = "0011_haptics_preference"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Existing learners get release notes; new learners get the first-run tour.
    op.add_column("user_preferences", sa.Column("tour_completed_version", sa.Integer(), nullable=False, server_default="1"))
    op.alter_column("user_preferences", "tour_completed_version", server_default="0")
    op.add_column("user_preferences", sa.Column("last_seen_update", sa.String(length=40), nullable=True))
    op.create_check_constraint("user_preferences_tour_version_check", "user_preferences", "tour_completed_version >= 0")


def downgrade() -> None:
    op.drop_constraint("user_preferences_tour_version_check", "user_preferences", type_="check")
    op.drop_column("user_preferences", "last_seen_update")
    op.drop_column("user_preferences", "tour_completed_version")
