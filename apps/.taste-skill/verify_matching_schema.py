"""Inspect only schema metadata in an enforced read-only transaction."""
import json
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "api"))
from scripts.inspect_database_schema import inspect_schema
try:
    schema = inspect_schema()
    columns = [row for row in schema["columns"] if row["table_name"] == "answer_attempts" and row["column_name"] == "question_type"]
    checks = [row["definition"] for row in schema["constraints"] if row["table_name"] == "answer_attempts" and row["type"] == "c" and "question_type" in row["definition"]]
    print(json.dumps({"read_only":schema["transaction_read_only"],"revision":schema["alembic_versions"],"question_type_column":[{"data_type":row["data_type"],"nullable":row["is_nullable"]} for row in columns],"question_type_checks":checks},indent=2))
except Exception as failure:
    print(json.dumps({"verified":False,"error_type":type(failure).__name__}));sys.exit(1)
