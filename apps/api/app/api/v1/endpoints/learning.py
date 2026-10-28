"""Learning path endpoints."""

import re
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.db.database import SessionLocal

router = APIRouter(prefix="/learning", tags=["Learning"])


def get_db():
    """Provide a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


LEVEL_ORDER = {
    "beginner": 1,
    "elementary": 2,
    "intermediate": 3,
    "upper-intermediate": 4,
    "advanced": 5,
}

LEVEL_TITLES = {
    "beginner": "Beginner",
    "elementary": "Elementary",
    "intermediate": "Intermediate",
    "upper-intermediate": "Upper Intermediate",
    "advanced": "Advanced",
}


def normalize_level(value: Any) -> str:
    """Normalize existing difficulty values into display levels."""
    if value is None or not str(value).strip():
        return "beginner"

    normalized = re.sub(
        r"[_\s]+",
        "-",
        str(value).strip().lower(),
    )

    aliases = {
        "easy": "beginner",
        "basic": "beginner",
        "a1": "beginner",
        "a2": "elementary",
        "medium": "intermediate",
        "intermediate": "intermediate",
        "hard": "advanced",
        "expert": "advanced",
        "b1": "intermediate",
        "b2": "upper-intermediate",
        "c1": "advanced",
        "c2": "advanced",
    }

    return aliases.get(normalized, normalized)


def title_from_value(value: str) -> str:
    """Convert a category or level identifier to a readable title."""
    return " ".join(
        part.capitalize()
        for part in value.replace("_", " ").replace("-", " ").split()
    )


def make_slug(value: str) -> str:
    """Create a stable identifier from a category or level."""
    return re.sub(
        r"[^a-z0-9]+",
        "-",
        value.lower(),
    ).strip("-")


@router.get("/path")
def get_learning_path(
    language_code: str = Query(
        ...,
        min_length=2,
        max_length=10,
        description="Language code, such as om or am",
    ),
    db: Session = Depends(get_db),
):
    """Return vocabulary grouped into levels and lessons."""

    language_code = language_code.strip().lower()

    # Read existing vocabulary only. No tables or records are created.
    query = text(
         """
    SELECT
        id,
        category,
        difficulty
    FROM words
    WHERE language_code = :language_code
      AND status = 'approved'
    ORDER BY category, difficulty, id
    """
    )    
    try:
        rows = db.execute(
            query,
            {"language_code": language_code},
        ).mappings().all()
    except Exception as exc:
        # Keep the database exception available in server logs.
        raise HTTPException(
            status_code=500,
            detail="Unable to retrieve the learning path.",
        ) from exc

    # An empty result is valid; it may mean that vocabulary has not
    # yet been added for this language.
    grouped: dict[str, dict[str, dict[str, Any]]] = {}

    for row in rows:
        raw_difficulty = row["difficulty"]
        level_key = normalize_level(raw_difficulty)

        raw_category = row["category"]
        category_key = (
            str(raw_category).strip()
            if raw_category is not None and str(raw_category).strip()
            else "uncategorized"
        )

        if level_key not in grouped:
            grouped[level_key] = {}

        if category_key not in grouped[level_key]:
            grouped[level_key][category_key] = {
                "ids": [],
                "title": (
                    "Uncategorized"
                    if category_key == "uncategorized"
                    else title_from_value(category_key)
                ),
            }

        grouped[level_key][category_key]["ids"].append(row["id"])

    levels = []

    sorted_levels = sorted(
        grouped.items(),
        key=lambda item: (
            LEVEL_ORDER.get(item[0], 99),
            item[0],
        ),
    )

    for level_index, (level_key, categories) in enumerate(
        sorted_levels,
        start=1,
    ):
        lessons = []

        sorted_categories = sorted(
            categories.items(),
            key=lambda item: item[1]["title"].lower(),
        )

        for lesson_index, (category_key, category_data) in enumerate(
            sorted_categories,
            start=1,
        ):
            word_count = len(category_data["ids"])

            lessons.append(
                {
                    "id": (
                        f"{make_slug(language_code)}-"
                        f"{make_slug(level_key)}-"
                        f"{make_slug(category_key)}"
                    ),
                    "title": category_data["title"],
                    "subtitle": f"{word_count} words to learn",
                    "order": lesson_index,
                    "word_count": word_count,
                }
            )

        total_words = sum(
            lesson["word_count"]
            for lesson in lessons
        )

        levels.append(
            {
                "id": f"{make_slug(language_code)}-{make_slug(level_key)}",
                "title": LEVEL_TITLES.get(
                    level_key,
                    title_from_value(level_key),
                ),
                "subtitle": f"{total_words} words available",
                "order": level_index,
                "total_words": total_words,
                "lessons": lessons,
            }
        )

    return {
        "language_code": language_code,
        "total_words": len(rows),
        "levels": levels,
    }
