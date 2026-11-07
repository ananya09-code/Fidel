"""Read-only verification. No application records or credentials are printed."""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "api"))
from scripts.inspect_database_schema import inspect_schema

required = {
    "users": {"id", "clerk_id"},
    "words": {"id", "language_code", "status"},
    "user_words": {"user_id", "word_id", "learning_state", "times_correct", "last_seen_at"},
    "review_sessions": {"id", "user_id", "word_ids", "status", "completed_at", "started_at", "updated_at", "total_count", "correct_count"},
    "review_answers": {"session_id", "user_id", "word_id", "selected_word_id", "is_correct", "answered_at"},
}
try:
    schema = inspect_schema()
    columns = {}
    for column in schema["columns"]:
        columns.setdefault(column["table_name"], set()).add(column["column_name"])
    print(json.dumps({
        "read_only": schema["transaction_read_only"],
        "alembic_revisions": schema["alembic_versions"],
        "missing_columns": {table: sorted(names - columns.get(table, set())) for table, names in required.items()},
        "review_indexes": [item["name"] for item in schema["indexes"] if item["table_name"] in ("review_sessions", "review_answers")],
    }, indent=2))
except Exception as error:
    print(json.dumps({"verified": False, "error_type": type(error).__name__, "detail": "Could not complete read-only database inspection. No credentials or records were printed."}))
    sys.exit(1)
