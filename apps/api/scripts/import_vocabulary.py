"""Import Afaan Oromoo vocabulary CSV into Fidel's existing PostgreSQL tables.

Run from apps/api with:
    uv run python scripts/import_vocabulary.py --limit 5 --dry-run
    uv run python scripts/import_vocabulary.py --limit 5
    uv run python scripts/import_vocabulary.py

This script does not generate audio or approve/publish content. It creates words
as drafts and adds English/Amharic translations idempotently.
"""

from __future__ import annotations

import argparse
import csv
import sys
from pathlib import Path
from typing import Any

from sqlalchemy import text
from sqlalchemy.engine import Engine

# Resolve imports whether run as `python scripts/import_vocabulary.py` from
# apps/api or as a module from the repository root.
API_ROOT = Path(__file__).resolve().parents[1]
REPO_ROOT = API_ROOT.parent.parent
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

try:
    from app.db.database import engine
except ImportError:
    # When the current working directory is apps/api, this is the expected path.
    if str(API_ROOT) not in sys.path:
        sys.path.insert(0, str(API_ROOT))
    from app.db.database import engine  # type: ignore[no-redef]

DEFAULT_CSV = API_ROOT / "data" / "vocabulary" / "afaan_oromoo_vocabulary.csv"
REQUIRED_COLUMNS = {
    "language_code",
    "text",
    "transliteration",
    "meaning",
    "meaning_amharic",
    "category",
    "difficulty",
}

INSERT_WORD_SQL = text("""
    INSERT INTO words (
        language_code, text, transliteration, content_type,
        category, difficulty, status
    )
    VALUES (
        :language_code, :text, :transliteration, :content_type,
        :category, :difficulty, 'draft'
    )
    ON CONFLICT (language_code, text) DO NOTHING
    RETURNING id
""")

SELECT_WORD_ID_SQL = text("""
    SELECT id FROM words WHERE language_code = :language_code AND text = :text
""")

INSERT_TRANSLATION_SQL = text("""
    INSERT INTO word_translations (word_id, language_code, meaning)
    VALUES (:word_id, :language_code, :meaning)
    ON CONFLICT (word_id, language_code, meaning) DO NOTHING
    RETURNING id
""")


def clean(value: Any) -> str | None:
    if value is None:
        return None
    value = str(value).strip()
    return value or None


def classify_content(text_value: str) -> str:
    """Choose a schema-valid type based on the CSV text, without changing it."""
    value = text_value.strip()
    if value.endswith((".", "?", "!", "…")):
        return "sentence"
    if any(char.isspace() for char in value):
        return "phrase"
    return "word"


def normalize_row(row: dict[str, Any], line_number: int) -> dict[str, Any]:
    language_code = clean(row.get("language_code")) or "om"
    word_text = clean(row.get("text"))
    if not word_text:
        raise ValueError(f"CSV line {line_number}: missing required 'text'.")
    if len(word_text) > 200:
        raise ValueError(f"CSV line {line_number}: word text exceeds 200 characters.")

    difficulty = (clean(row.get("difficulty")) or "beginner").lower()
    if difficulty not in {"beginner", "intermediate", "advanced"}:
        difficulty = "beginner"

    category = clean(row.get("category"))
    if category and len(category) > 50:
        category = category[:50]

    transliteration = clean(row.get("transliteration"))
    if transliteration and len(transliteration) > 200:
        transliteration = transliteration[:200]

    return {
        "language_code": language_code,
        "text": word_text,
        "transliteration": transliteration,
        "content_type": classify_content(word_text),
        "category": category,
        "difficulty": difficulty,
        "meaning": clean(row.get("meaning")),
        "meaning_amharic": clean(row.get("meaning_amharic")),
        "line_number": line_number,
    }


def load_rows(csv_path: Path, limit: int | None) -> list[dict[str, Any]]:
    if not csv_path.exists():
        raise FileNotFoundError(
            f"CSV not found: {csv_path}\n"
            "Place afaan_oromoo_vocabulary.csv in apps/api/data/vocabulary/ "
            "or pass --csv PATH."
        )

    rows: list[dict[str, Any]] = []
    with csv_path.open("r", encoding="utf-8-sig", newline="") as file:
        reader = csv.DictReader(file)
        headers = set(reader.fieldnames or [])
        missing = REQUIRED_COLUMNS - headers
        if missing:
            raise ValueError(
                f"CSV is missing required columns: {', '.join(sorted(missing))}. "
                f"Found: {', '.join(reader.fieldnames or [])}"
            )

        for line_number, raw_row in enumerate(reader, start=2):
            row = normalize_row(raw_row, line_number)
            if row["language_code"] != "om":
                print(
                    f"Skipping line {line_number}: language_code is "
                    f"{row['language_code']!r}, expected 'om'."
                )
                continue
            rows.append(row)
            if limit is not None and len(rows) >= limit:
                break
    return rows


def import_rows(db_engine: Engine, rows: list[dict[str, Any]], dry_run: bool) -> dict[str, int]:
    counts = {"words_inserted": 0, "words_existing": 0, "translations_inserted": 0}

    if dry_run:
        print("\nDRY RUN — no database changes will be made.")
        for row in rows:
            translations = sum(bool(row[key]) for key in ("meaning", "meaning_amharic"))
            print(
                f"  [{row['category'] or 'uncategorized'} / {row['difficulty']}] "
                f"{row['text']} -> {translations} translation(s); "
                f"type={row['content_type']}"
            )
        return counts

    # One transaction means an error rolls back this import instead of leaving
    # half-written word/translation rows.
    with db_engine.begin() as connection:
        for row in rows:
            result = connection.execute(INSERT_WORD_SQL, row)
            word_id = result.scalar_one_or_none()

            if word_id is not None:
                counts["words_inserted"] += 1
            else:
                word_id = connection.execute(
                    SELECT_WORD_ID_SQL,
                    {"language_code": row["language_code"], "text": row["text"]},
                ).scalar_one()
                counts["words_existing"] += 1

            for language_code, meaning in (
                ("en", row["meaning"]),
                ("am", row["meaning_amharic"]),
            ):
                if not meaning:
                    continue
                translation_id = connection.execute(
                    INSERT_TRANSLATION_SQL,
                    {
                        "word_id": word_id,
                        "language_code": language_code,
                        "meaning": meaning[:300],
                    },
                ).scalar_one_or_none()
                if translation_id is not None:
                    counts["translations_inserted"] += 1

    return counts


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Import Fidel vocabulary CSV into PostgreSQL.")
    parser.add_argument("--csv", type=Path, default=DEFAULT_CSV, help="Path to vocabulary CSV.")
    parser.add_argument("--limit", type=int, default=None, help="Import only the first N valid rows.")
    parser.add_argument("--dry-run", action="store_true", help="Validate and preview without writing to DB.")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    if args.limit is not None and args.limit < 1:
        print("--limit must be at least 1.", file=sys.stderr)
        return 2

    try:
        rows = load_rows(args.csv, args.limit)
        print(f"CSV: {args.csv}")
        print(f"Prepared {len(rows)} Afaan Oromoo row(s).")
        counts = import_rows(engine, rows, args.dry_run)
    except Exception as exc:
        print(f"Import failed: {exc}", file=sys.stderr)
        return 1

    if not args.dry_run:
        print("\nImport complete:")
        print(f"  New words:              {counts['words_inserted']}")
        print(f"  Existing words reused:  {counts['words_existing']}")
        print(f"  New translations:       {counts['translations_inserted']}")
        print("  Word status: draft")
        print("  Audio: not generated by this importer")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
