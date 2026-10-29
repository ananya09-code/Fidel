"""Add persisted onboarding and user preferences.

Revision ID: 0005_user_preferences
Revises: 0004_progress
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa

revision = "0005_user_preferences"
down_revision = "0004_progress"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "user_preferences",
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("learning_language", sa.String(), nullable=False, server_default="om"),
        sa.Column("proficiency_level", sa.String(), nullable=True),
        sa.Column("motivations", sa.JSON(), nullable=False, server_default=sa.text("'[]'::json")),
        sa.Column("daily_goal_minutes", sa.Integer(), nullable=False, server_default="5"),
        sa.Column("interface_language", sa.String(), nullable=False, server_default="en"),
        sa.Column("reminders_enabled", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("reminder_time", sa.String(), nullable=False, server_default="19:00"),
        sa.Column("sound_enabled", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("appearance", sa.String(), nullable=False, server_default="system"),
        sa.Column("timezone", sa.String(), nullable=False, server_default="UTC"),
        sa.Column("onboarding_completed", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("user_id", name="user_preferences_pkey"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name="user_preferences_user_id_fkey", ondelete="CASCADE"),
        sa.CheckConstraint("learning_language IN ('om','am')", name="user_preferences_learning_language_check"),
        sa.CheckConstraint("proficiency_level IS NULL OR proficiency_level IN ('beginner','some','conversational','improving')", name="user_preferences_proficiency_level_check"),
        sa.CheckConstraint("daily_goal_minutes IN (5,10,15,20)", name="user_preferences_daily_goal_check"),
        sa.CheckConstraint("interface_language IN ('en','om','am')", name="user_preferences_interface_language_check"),
        sa.CheckConstraint("appearance IN ('light','dark','system')", name="user_preferences_appearance_check"),
        sa.CheckConstraint("reminder_time ~ '^(?:[01][0-9]|2[0-3]):[0-5][0-9]$'", name="user_preferences_reminder_time_check"),
    )


def downgrade() -> None:
    op.drop_table("user_preferences")
