"""Public vocabulary endpoints."""

from __future__ import annotations

from math import ceil
from typing import Any, Generator, Mapping
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import bindparam, text
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.database import SessionLocal
from app.schemas.words import (
    WordAudio,
    WordCategory,
    WordCategoryListResponse,
    WordDetail,
    WordListMeta,
    WordListResponse,
    WordPagination,
    WordSummary,
    WordTranslation,
)
from app.services import storage

router = APIRouter()


def get_db() -> Generator[Session, None, None]:
    """Yield a database session for request handlers."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _load_translations(
    db: Session,
    word_ids: list[Any],
) -> dict[str, list[Mapping[str, Any]]]:
    """Load translations for several words in one query."""
    if not word_ids:
        return {}

    rows = db.execute(
        text(
            """
            SELECT word_id, language_code, meaning, context_note
            FROM word_translations
            WHERE word_id IN :word_ids
            ORDER BY created_at, language_code
            """
        ).bindparams(bindparam("word_ids", expanding=True)),
        {"word_ids": word_ids},
    ).mappings().all()

    grouped: dict[str, list[Mapping[str, Any]]] = {}
    for row in rows:
        grouped.setdefault(str(row["word_id"]), []).append(row)

    return grouped


def _load_audio(
    db: Session,
    word_ids: list[Any],
) -> dict[str, Mapping[str, Any]]:
    """Load the newest active approved recording for several words."""
    if not word_ids:
        return {}

    rows = db.execute(
        text(
            """
            SELECT word_id, storage_key, speaker_id, speed
            FROM audio_recordings
            WHERE word_id IN :word_ids
              AND status = 'approved'
              AND superseded_at IS NULL
            ORDER BY created_at DESC
            """
        ).bindparams(bindparam("word_ids", expanding=True)),
        {"word_ids": word_ids},
    ).mappings().all()

    newest: dict[str, Mapping[str, Any]] = {}
    for row in rows:
        newest.setdefault(str(row["word_id"]), row)

    return newest


def _audio_payload(recording: Mapping[str, Any] | None) -> WordAudio:
    """Build a playable audio payload, using presigned URLs when possible."""
    if recording is None or not recording["storage_key"]:
        return WordAudio(available=False)

    try:
        url = storage.generate_audio_url(
            recording["storage_key"],
            expires_in=get_settings().audio_url_expires_in,
        )
    except Exception:
        url = None

    return WordAudio(
        available=url is not None,
        url=url,
        speaker_id=recording["speaker_id"],
        speed=recording["speed"],
    )


def _meaning(translations: list[Mapping[str, Any]]) -> str | None:
    """Prefer the English translation for the list summary."""
    for translation in translations:
        if translation["language_code"] == "en":
            return translation["meaning"]

    if translations:
        return translations[0]["meaning"]

    return None


@router.get(
    "",
    response_model=WordListResponse,
    summary="Get paginated vocabulary",
)
def get_vocabulary(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    language_code: str = Query("om", min_length=2, max_length=10),
    category: str | None = None,
    difficulty: str | None = None,
    content_type: str | None = Query(
        None,
        pattern="^(word|phrase|sentence)$",
    ),
    audio_available: bool | None = None,
    search: str | None = Query(None, max_length=100),
    db: Session = Depends(get_db),
) -> WordListResponse:
    """Return approved vocabulary with pagination and filters."""
    filters = [
        "w.status = 'approved'",
        "w.language_code = :language_code",
    ]

    params: dict[str, Any] = {
        "language_code": language_code,
        "limit": page_size,
        "offset": (page - 1) * page_size,
    }

    if category:
        filters.append("w.category = :category")
        params["category"] = category

    if difficulty:
        filters.append("w.difficulty = :difficulty")
        params["difficulty"] = difficulty

    if content_type:
        filters.append("w.content_type = :content_type")
        params["content_type"] = content_type

    if audio_available is True:
        filters.append(
            "EXISTS (SELECT 1 FROM audio_recordings filter_audio "
            "WHERE filter_audio.word_id = w.id "
            "AND filter_audio.status = 'approved' "
            "AND filter_audio.superseded_at IS NULL "
            "AND filter_audio.storage_key IS NOT NULL)"
        )

    if search:
        filters.append(
            "(LOWER(w.text) LIKE LOWER(:search) "
            "OR LOWER(COALESCE(w.transliteration, '')) LIKE LOWER(:search) "
            "OR LOWER(COALESCE(w.category, '')) LIKE LOWER(:search) OR EXISTS ("
            "SELECT 1 FROM word_translations search_wt "
            "WHERE search_wt.word_id = w.id "
            "AND LOWER(search_wt.meaning) LIKE LOWER(:search)))"
        )
        params["search"] = f"%{search}%"

    where_clause = " AND ".join(filters)

    count = db.execute(
        text(
            f"""
            SELECT COUNT(*)
            FROM words w
            WHERE {where_clause}
            """
        ),
        params,
    ).scalar_one()

    rows = db.execute(
        text(
            f"""
            SELECT
                w.id,
                w.language_code,
                w.text,
                w.transliteration,
                w.content_type,
                w.category,
                w.difficulty
            FROM words w
            WHERE {where_clause}
            ORDER BY LOWER(w.text), w.id
            LIMIT :limit OFFSET :offset
            """
        ),
        params,
    ).mappings().all()

    word_ids = [row["id"] for row in rows]
    translations = _load_translations(db, word_ids)
    audio = _load_audio(db, word_ids)
    total_pages = ceil(count / page_size) if count else 0

    data = []
    for row in rows:
        word_id = str(row["id"])
        word_translations = translations.get(word_id, [])
        data.append(
            WordSummary(
                id=word_id,
                language_code=row["language_code"],
                text=row["text"],
                transliteration=row["transliteration"],
                content_type=row["content_type"],
                category=row["category"],
                difficulty=row["difficulty"],
                meaning=_meaning(word_translations),
                translations=[
                    WordTranslation(
                        language_code=translation["language_code"],
                        meaning=translation["meaning"],
                        context_note=translation["context_note"],
                    )
                    for translation in word_translations
                ],
                audio=_audio_payload(audio.get(word_id)),
            )
        )
    return WordListResponse(
        data=data,
        meta=WordListMeta(
            request_id=f"req_{uuid4().hex}",
            pagination=WordPagination(
                page=page,
                page_size=page_size,
                total_items=count,
                total_pages=total_pages,
                has_next=page < total_pages,
                has_previous=page > 1 and total_pages > 0,
            ),
        ),
    )


@router.get(
    "/categories",
    response_model=WordCategoryListResponse,
    summary="Get vocabulary categories",
)
def get_categories(
    language_code: str = Query("om", min_length=2, max_length=10),
    db: Session = Depends(get_db),
) -> WordCategoryListResponse:
    """Return categories and counts from approved words for one language."""
    rows = db.execute(
        text(
            """
            SELECT
                COALESCE(NULLIF(TRIM(category), ''), 'Uncategorized') AS name,
                COUNT(*) AS word_count
            FROM words
            WHERE status = 'approved' AND language_code = :language_code
            GROUP BY COALESCE(NULLIF(TRIM(category), ''), 'Uncategorized')
            ORDER BY LOWER(
                COALESCE(NULLIF(TRIM(category), ''), 'Uncategorized')
            )
            """
        ),
        {"language_code": language_code},
    ).mappings().all()

    return WordCategoryListResponse(
        data=[
            WordCategory(name=row["name"], word_count=row["word_count"])
            for row in rows
        ]
    )


@router.get(
    "/{word_id}",
    response_model=WordDetail,
    summary="Get one approved word",
)
def get_word(
    word_id: UUID,
    db: Session = Depends(get_db),
) -> WordDetail:
    """Return one approved word with translations and active audio."""
    word = db.execute(
        text(
            """
            SELECT
                id,
                language_code,
                text,
                transliteration,
                content_type,
                category,
                difficulty
            FROM words
            WHERE id = :word_id
              AND status = 'approved'
            """
        ),
        {"word_id": word_id},
    ).mappings().first()

    if word is None:
        raise HTTPException(status_code=404, detail="Word not found")

    translations = _load_translations(db, [word_id]).get(str(word_id), [])
    audio = _load_audio(db, [word_id]).get(str(word_id))

    return WordDetail(
        id=str(word["id"]),
        language_code=word["language_code"],
        text=word["text"],
        transliteration=word["transliteration"],
        content_type=word["content_type"],
        category=word["category"],
        difficulty=word["difficulty"],
        translations=[
            WordTranslation(
                language_code=translation["language_code"],
                meaning=translation["meaning"],
                context_note=translation["context_note"],
            )
            for translation in translations
        ],
        audio=_audio_payload(audio),
    )
