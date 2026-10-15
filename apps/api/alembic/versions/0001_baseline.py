"""Baseline: marks the schema that already existed in Neon as revision 0001.

The production database was created before Alembic was introduced, so this
empty revision exists only to give the version table a starting point. Stamped
with: `alembic stamp 0001`.
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa  # noqa: F401  (template consistency)

revision = "0001_baseline"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    """No-op: the baseline schema predates Alembic."""


def downgrade() -> None:
    """No-op."""