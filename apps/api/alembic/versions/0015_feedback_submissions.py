"""Store authenticated learner feedback for private review.

Revision ID: 0015_feedback_submissions
Revises: 0014_sentence_building
"""

from alembic import op
import sqlalchemy as sa

revision = "0015_feedback_submissions"
down_revision = "0014_sentence_building"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "feedback_submissions",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("user_id", sa.Uuid(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("category", sa.String(20), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("page_path", sa.String(512), nullable=False),
        sa.Column("contact_allowed", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.CheckConstraint("category IN ('bug','idea','content','other')", name="feedback_submissions_category_check"),
    )
    op.create_index("feedback_submissions_user_created_idx", "feedback_submissions", ["user_id", "created_at"])
    op.create_index("feedback_submissions_created_idx", "feedback_submissions", ["created_at"])


def downgrade() -> None:
    op.drop_index("feedback_submissions_created_idx", table_name="feedback_submissions")
    op.drop_index("feedback_submissions_user_created_idx", table_name="feedback_submissions")
    op.drop_table("feedback_submissions")
