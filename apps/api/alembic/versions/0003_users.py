"""Add local profiles for Clerk-authenticated users.

Revision ID: 0003_users
Revises: 0002_batch_review

Reconstructed from the verified deployed schema at revision 0004_progress.
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa

revision = "0003_users"
down_revision = "0002_batch_review"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("clerk_id", sa.String(), nullable=False),
        sa.Column("email", sa.String(), nullable=True),
        sa.Column("display_name", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id", name="users_pkey"),
        sa.UniqueConstraint("clerk_id", name="users_clerk_id_key"),
    )
    op.create_index("users_email_idx", "users", ["email"])


def downgrade() -> None:
    op.drop_index("users_email_idx", table_name="users")
    op.drop_table("users")
