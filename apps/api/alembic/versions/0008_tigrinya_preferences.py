"""Allow Tigrinya course and interface preferences without rewriting rows.

Revision ID: 0008_tigrinya_preferences
Revises: 0007_reviews

Words, translations, recordings and batches already accept language codes.
Only the two preference check constraints need expanding. Downgrade never
changes a learner's selection; switch Tigrinya preferences first if necessary.
"""
from alembic import op

revision = "0008_tigrinya_preferences"
down_revision = "0007_reviews"
branch_labels = None
depends_on = None


def _constraints(learning: str, interface: str) -> None:
    # Batch mode also permits testing the constraint change on isolated SQLite.
    with op.batch_alter_table("user_preferences") as batch:
        batch.drop_constraint("user_preferences_learning_language_check", type_="check")
        batch.drop_constraint("user_preferences_interface_language_check", type_="check")
        batch.create_check_constraint("user_preferences_learning_language_check", learning)
        batch.create_check_constraint("user_preferences_interface_language_check", interface)


def upgrade() -> None:
    _constraints("learning_language IN ('om','am','ti')", "interface_language IN ('en','om','am','ti')")


def downgrade() -> None:
    # Existing Tigrinya values cause constraint validation to reject downgrade;
    # no user data is silently reassigned or deleted.
    _constraints("learning_language IN ('om','am')", "interface_language IN ('en','om','am')")
