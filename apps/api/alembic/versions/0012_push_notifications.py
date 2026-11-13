"""Store push subscriptions, notification choices, and delivery deduplication.

Revision ID: 0012_push_notifications
Revises: 0011_haptics_preference
"""

from alembic import op
import sqlalchemy as sa

revision = "0012_push_notifications"
down_revision = "0011_haptics_preference"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("user_preferences", sa.Column("quiz_notifications_enabled", sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column("user_preferences", sa.Column("streak_notifications_enabled", sa.Boolean(), nullable=False, server_default=sa.false()))
    op.create_table(
        "push_subscriptions",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("user_id", sa.Uuid(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("endpoint", sa.Text(), nullable=False, unique=True),
        sa.Column("p256dh", sa.Text(), nullable=False),
        sa.Column("auth", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("push_subscriptions_user_id_idx", "push_subscriptions", ["user_id"])
    op.create_table(
        "notification_deliveries",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("subscription_id", sa.Uuid(), sa.ForeignKey("push_subscriptions.id", ondelete="CASCADE"), nullable=False),
        sa.Column("kind", sa.String(16), nullable=False),
        sa.Column("local_date", sa.Date(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.UniqueConstraint("subscription_id", "local_date", name="notification_deliveries_once_per_day"),
        sa.CheckConstraint("kind IN ('goal','quiz','streak')", name="notification_deliveries_kind_check"),
    )


def downgrade() -> None:
    op.drop_table("notification_deliveries")
    op.drop_index("push_subscriptions_user_id_idx", table_name="push_subscriptions")
    op.drop_table("push_subscriptions")
    op.drop_column("user_preferences", "streak_notifications_enabled")
    op.drop_column("user_preferences", "quiz_notifications_enabled")
