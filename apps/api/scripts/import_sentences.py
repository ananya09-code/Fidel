"""Preview or import editor-reviewed sentence exercises after migration 0014.

Run from apps/api: uv run python scripts/import_sentences.py --file path.json
Writing requires an explicit --write. New sentence catalogue entries remain drafts
until their complete audio recording is approved in the admin review workflow.
"""

import argparse
import json
import sys
from pathlib import Path
from uuid import uuid4

from sqlalchemy import JSON, bindparam, text

API_ROOT = Path(__file__).resolve().parents[1]
if str(API_ROOT) not in sys.path:
    sys.path.insert(0, str(API_ROOT))


def validate_item(item: dict, index: int) -> dict:
    label = f"Exercise {index}"
    if not isinstance(item, dict):
        raise ValueError(f"{label}: expected an object.")
    language = item.get("language_code")
    sentence = item.get("sentence")
    meaning = item.get("meaning")
    meaning_amharic = item.get("meaning_amharic")
    tiles = item.get("tiles")
    order = item.get("accepted_order")
    if language not in {"am", "om", "ti"} or not isinstance(sentence, str) or not sentence.strip() or len(sentence) > 200:
        raise ValueError(f"{label}: provide a supported language and a sentence of at most 200 characters.")
    if not isinstance(meaning, str) or not meaning.strip():
        raise ValueError(f"{label}: provide an English meaning.")
    if not isinstance(meaning_amharic, str) or not meaning_amharic.strip():
        raise ValueError(f"{label}: provide an Amharic meaning.")
    if not isinstance(tiles, list) or not 2 <= len(tiles) <= 24:
        raise ValueError(f"{label}: provide 2–24 tiles.")
    for tile in tiles:
        if not isinstance(tile, dict) or not isinstance(tile.get("word"), str) or not tile["word"].strip() or not isinstance(tile.get("text"), str) or not tile["text"].strip():
            raise ValueError(f"{label}: every tile needs an existing word and displayed text.")
    if not isinstance(order, list) or sorted(order) != list(range(len(tiles))):
        raise ValueError(f"{label}: accepted_order must list every zero-based tile index exactly once.")
    return {"language_code": language, "sentence": sentence.strip(), "meaning": meaning.strip(),
            "meaning_amharic": meaning_amharic.strip(), "tiles": tiles, "accepted_order": order}


def import_items(connection, items: list[dict]) -> tuple[int, int]:
    created = existing = 0
    for item in items:
        word_ids = []
        for tile in item["tiles"]:
            word_id = connection.execute(text("""SELECT id FROM words WHERE language_code=:lang AND text=:word
                AND content_type <> 'sentence' AND status='approved'"""),
                {"lang": item["language_code"], "word": tile["word"]}).scalar_one_or_none()
            if word_id is None:
                raise ValueError(f"Missing approved {item['language_code']} prerequisite word: {tile['word']}")
            word_ids.append(word_id)
        sentence_id = connection.execute(text("""INSERT INTO words (id,language_code,text,content_type,difficulty,status)
            VALUES (:id,:lang,:sentence,'sentence','beginner','draft')
            ON CONFLICT (language_code,text) DO NOTHING RETURNING id"""),
            {"id": uuid4(), "lang": item["language_code"], "sentence": item["sentence"]}).scalar_one_or_none()
        if sentence_id is None:
            sentence_id = connection.execute(text("SELECT id FROM words WHERE language_code=:lang AND text=:sentence"),
                {"lang": item["language_code"], "sentence": item["sentence"]}).scalar_one()
            existing += 1
        else:
            created += 1
        kind = connection.execute(text("SELECT content_type FROM words WHERE id=:id"), {"id": sentence_id}).scalar_one()
        if kind != "sentence":
            raise ValueError(f"Existing catalogue entry is not a sentence: {item['sentence']}")
        for code, value in (("en", item["meaning"]), ("am", item["meaning_amharic"])):
            connection.execute(text("""INSERT INTO word_translations (id,word_id,language_code,meaning)
                VALUES (:id,:word,:lang,:meaning) ON CONFLICT (word_id,language_code,meaning) DO NOTHING"""),
                {"id": uuid4(), "word": sentence_id, "lang": code, "meaning": value})
        tiles = [{"id": str(index), "text": tile["text"], "word_id": str(word_ids[index])} for index, tile in enumerate(item["tiles"])]
        connection.execute(text("""INSERT INTO sentence_exercises (id,sentence_word_id,tiles,accepted_orders)
            VALUES (:id,:word,:tiles,:orders) ON CONFLICT (sentence_word_id) DO NOTHING""").bindparams(
                bindparam("tiles", type_=JSON), bindparam("orders", type_=JSON)),
            {"id": uuid4(), "word": sentence_id, "tiles": tiles,
             "orders": [[str(index) for index in item["accepted_order"]]]})
    return created, existing


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--file", type=Path, required=True, help="Editor-reviewed JSON manifest")
    parser.add_argument("--write", action="store_true", help="Insert drafts and exercises into the configured database")
    args = parser.parse_args()
    try:
        raw = json.loads(args.file.read_text(encoding="utf-8"))
        if not isinstance(raw, list):
            raise ValueError("The manifest must be an array.")
        items = [validate_item(item, index) for index, item in enumerate(raw, 1)]
        print(f"Validated {len(items)} sentence exercise(s).")
        if not args.write:
            print("Preview only. No database connection or changes were made.")
            return 0
        from app.db.database import engine
        with engine.begin() as connection:
            created, existing = import_items(connection, items)
        print(f"Imported {created} draft sentence(s); {existing} already existed. Review audio before learners can use them.")
        return 0
    except (OSError, ValueError, json.JSONDecodeError) as exc:
        print(f"Import failed: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
