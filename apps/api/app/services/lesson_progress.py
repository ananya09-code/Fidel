"""Derive lesson completion from word coverage, rather than session size."""

from collections import defaultdict
from uuid import UUID

from sqlalchemy import JSON, text
from sqlalchemy.orm import Session

from app.api.v1.endpoints.learning import make_slug, normalize_level


def lesson_word_coverage(
    db: Session, user_id: UUID, language_code: str | None = None
) -> tuple[list[str], dict[str, list[str]]]:
    """Count distinct target words in this user's finished practice sessions.

    Incorrect answers still count as practised; mastery is tracked separately
    by user_words. Replays, distractors and other users cannot add coverage.
    Existing partial sessions remain saved without marking a lesson complete.
    """
    catalog: dict[str, set[str]] = defaultdict(set)
    for word in db.execute(text("""
        SELECT id, language_code, difficulty,
               COALESCE(NULLIF(TRIM(category), ''), 'uncategorized') AS category
        FROM words WHERE status = 'approved' AND content_type <> 'sentence' AND language_code LIKE :language_filter
    """), {"language_filter": language_code or "%"}).mappings():
        key = "-".join((
            make_slug(word["language_code"]),
            make_slug(normalize_level(word["difficulty"])),
            make_slug(word["category"]),
        ))
        catalog[key].add(str(word["id"]))

    practiced: dict[str, set[str]] = defaultdict(set)
    answers = db.execute(text("""
        SELECT l.lesson_key, a.word_ids
        FROM answer_attempts AS a
        JOIN lesson_attempts AS l ON l.id = a.attempt_id AND l.user_id = a.user_id
        WHERE a.user_id = :user_id AND l.status = 'completed'
          AND l.lesson_key LIKE :language_prefix
    """).columns(word_ids=JSON()), {"user_id": user_id, "language_prefix": f"{language_code}-%" if language_code else "%"}).mappings()
    for answer in answers:
        targets = answer["word_ids"]
        key = answer["lesson_key"]
        if targets and str(targets[0]) in catalog.get(key, set()):
            practiced[key].add(str(targets[0]))

    completed = sorted(
        key for key, words in catalog.items()
        if words and words.issubset(practiced.get(key, set()))
    )
    return completed, {key: sorted(words) for key, words in practiced.items()}
