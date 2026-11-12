"""Keep review sessions and their history with the language they practise.

Revision ID: 0010_review_language
Revises: 0009_quests
"""

from alembic import op
import sqlalchemy as sa

revision = "0010_review_language"
down_revision = "0009_quests"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("review_sessions", sa.Column("language_code", sa.String(), nullable=True))
    # Old sessions can contain words from several languages. Attribute only
    # homogeneous sessions; retain mixed sessions without guessing a course.
    op.execute("""
        WITH session_languages AS (
            SELECT rs.id, MIN(w.language_code) AS language_code
            FROM review_sessions AS rs
            CROSS JOIN LATERAL json_array_elements_text(rs.word_ids) AS selected(word_id)
            LEFT JOIN words AS w ON w.id::text = selected.word_id
            GROUP BY rs.id
            HAVING COUNT(*) = COUNT(w.id) AND COUNT(DISTINCT w.language_code) = 1
        )
        UPDATE review_sessions AS rs
        SET language_code = sl.language_code
        FROM session_languages AS sl
        WHERE rs.id = sl.id
    """)
    op.drop_index("review_sessions_one_in_progress_per_user", table_name="review_sessions")
    op.create_index(
        "review_sessions_one_in_progress_per_language", "review_sessions",
        ["user_id", "language_code"], unique=True,
        postgresql_where=sa.text("status = 'in_progress' AND language_code IS NOT NULL"),
        sqlite_where=sa.text("status = 'in_progress' AND language_code IS NOT NULL"),
    )
    op.create_index(
        "review_sessions_one_legacy_in_progress", "review_sessions", ["user_id"],
        unique=True,
        postgresql_where=sa.text("status = 'in_progress' AND language_code IS NULL"),
        sqlite_where=sa.text("status = 'in_progress' AND language_code IS NULL"),
    )
    op.create_check_constraint(
        "review_sessions_language_check", "review_sessions",
        "language_code IS NULL OR language_code IN ('om','am','ti')",
    )


def downgrade() -> None:
    # A user can have simultaneous active sessions after this migration;
    # reverting requires resolving those sessions first.
    op.drop_constraint("review_sessions_language_check", "review_sessions", type_="check")
    op.drop_index("review_sessions_one_legacy_in_progress", table_name="review_sessions")
    op.drop_index("review_sessions_one_in_progress_per_language", table_name="review_sessions")
    op.create_index(
        "review_sessions_one_in_progress_per_user", "review_sessions", ["user_id"],
        unique=True, postgresql_where=sa.text("status = 'in_progress'"),
    )
    op.drop_column("review_sessions", "language_code")
