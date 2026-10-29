"""Print non-sensitive PostgreSQL schema metadata in a read-only transaction.

Run from ``apps/api`` with::

    uv run python -m scripts.inspect_database_schema

The script never reads application rows. Its first SQL statement starts a
read-only transaction, applies a local timeout, reads catalog metadata and the
Alembic revision, and then rolls the transaction back.
"""

from __future__ import annotations

import json

from psycopg import connect
from psycopg.rows import dict_row

from app.db.database import DATABASE_URL


METADATA_QUERIES = {
    "tables": """
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_type = 'BASE TABLE'
        ORDER BY table_name
    """,
    "columns": """
        SELECT table_name, column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public'
        ORDER BY table_name, ordinal_position
    """,
    "constraints": """
        SELECT
            relation.relname AS table_name,
            constraint_record.conname AS name,
            constraint_record.contype AS type,
            pg_get_constraintdef(constraint_record.oid) AS definition
        FROM pg_constraint AS constraint_record
        JOIN pg_class AS relation
          ON relation.oid = constraint_record.conrelid
        JOIN pg_namespace AS namespace
          ON namespace.oid = relation.relnamespace
        WHERE namespace.nspname = 'public'
          AND constraint_record.contype IN ('p', 'u', 'f', 'c')
        ORDER BY relation.relname, constraint_record.conname
    """,
    "indexes": """
        SELECT tablename AS table_name, indexname AS name, indexdef AS definition
        FROM pg_indexes
        WHERE schemaname = 'public'
        ORDER BY tablename, indexname
    """,
}


def inspect_schema() -> dict[str, object]:
    """Return catalog metadata without permitting database writes."""

    with connect(DATABASE_URL, connect_timeout=15, row_factory=dict_row) as connection:
        with connection.cursor() as cursor:
            cursor.execute("BEGIN READ ONLY")
            cursor.execute("SET LOCAL statement_timeout = '10s'")
            cursor.execute("SHOW transaction_read_only")
            read_only = cursor.fetchone()["transaction_read_only"]
            if read_only != "on":
                raise RuntimeError("Schema inspection transaction is not read-only.")

            result: dict[str, object] = {"transaction_read_only": read_only}
            for name, query in METADATA_QUERIES.items():
                cursor.execute(query)
                result[name] = cursor.fetchall()

            table_names = {row["table_name"] for row in result["tables"]}
            if "alembic_version" in table_names:
                cursor.execute(
                    "SELECT version_num FROM public.alembic_version ORDER BY version_num"
                )
                result["alembic_versions"] = cursor.fetchall()
            else:
                result["alembic_versions"] = []

            cursor.execute("ROLLBACK")

    return result


if __name__ == "__main__":
    print(json.dumps(inspect_schema(), indent=2, default=str))
