"""Authenticated per-user vocabulary state."""

from datetime import datetime, timezone
from typing import Annotated, Generator
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.clerk_auth import ClerkUser, get_current_user
from app.db.database import SessionLocal
from app.schemas.vocabulary import VocabularyState, VocabularyStateList, VocabularyStateUpdate

router = APIRouter(prefix="/vocabulary", tags=["vocabulary"])


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _user_id(db: Session, clerk_id: str, create: bool = False) -> UUID | None:
    value = db.execute(
        text("SELECT id FROM users WHERE clerk_id = :clerk_id"),
        {"clerk_id": clerk_id},
    ).scalar_one_or_none()
    if value is not None or not create:
        return value
    now = datetime.now(timezone.utc)
    db.execute(
        text(
            """
            INSERT INTO users (id, clerk_id, created_at, updated_at)
            VALUES (:id, :clerk_id, :now, :now)
            ON CONFLICT (clerk_id) DO NOTHING
            """
        ),
        {"id": uuid4(), "clerk_id": clerk_id, "now": now},
    )
    return db.execute(
        text("SELECT id FROM users WHERE clerk_id = :clerk_id"),
        {"clerk_id": clerk_id},
    ).scalar_one()


def _serialize(row) -> VocabularyState:
    return VocabularyState(
        word_id=row["word_id"],
        is_favorite=bool(row["is_favorite"]),
        learning_state=row["learning_state"],
        times_seen=row["times_seen"],
        times_correct=row["times_correct"],
    )


@router.get("", response_model=VocabularyStateList)
def list_vocabulary_state(
    current_user: Annotated[ClerkUser, Depends(get_current_user)],
    db: Session = Depends(get_db),
) -> VocabularyStateList:
    user_id = _user_id(db, current_user.user_id)
    if user_id is None:
        return VocabularyStateList(data=[])
    rows = db.execute(
        text(
            """
            SELECT word_id, is_favorite, learning_state, times_seen, times_correct
            FROM user_words
            WHERE user_id = :user_id
            ORDER BY last_seen_at DESC, word_id
            """
        ),
        {"user_id": user_id},
    ).mappings().all()
    return VocabularyStateList(data=[_serialize(row) for row in rows])


@router.put("/{word_id}", response_model=VocabularyState)
def update_vocabulary_state(
    word_id: UUID,
    payload: VocabularyStateUpdate,
    current_user: Annotated[ClerkUser, Depends(get_current_user)],
    db: Session = Depends(get_db),
) -> VocabularyState:
    if payload.is_favorite is None and payload.learning_state is None:
        raise HTTPException(status_code=422, detail="Provide a vocabulary state change.")
    word = db.execute(
        text(
            """
            SELECT w.text, wt.meaning
            FROM words AS w
            LEFT JOIN word_translations AS wt
              ON wt.word_id = w.id AND wt.language_code = 'en'
            WHERE w.id = :word_id AND w.status = 'approved'
            ORDER BY wt.created_at
            LIMIT 1
            """
        ),
        {"word_id": word_id},
    ).mappings().first()
    if word is None:
        raise HTTPException(status_code=404, detail="Word not found.")
    user_id = _user_id(db, current_user.user_id, create=True)
    now = datetime.now(timezone.utc)
    db.execute(
        text(
            """
            INSERT INTO user_words (
                user_id, word_id, times_seen, times_correct, text, meaning,
                first_seen_at, last_seen_at, is_favorite, learning_state
            ) VALUES (
                :user_id, :word_id, 0, 0, :text, :meaning,
                :now, :now, COALESCE(:is_favorite, false),
                COALESCE(:learning_state, 'learning')
            )
            ON CONFLICT (user_id, word_id) DO UPDATE SET
                is_favorite = COALESCE(:is_favorite, user_words.is_favorite),
                learning_state = COALESCE(:learning_state, user_words.learning_state),
                text = COALESCE(user_words.text, excluded.text),
                meaning = COALESCE(user_words.meaning, excluded.meaning),
                last_seen_at = :now
            """
        ),
        {
            "user_id": user_id,
            "word_id": word_id,
            "text": word["text"],
            "meaning": word["meaning"],
            "is_favorite": payload.is_favorite,
            "learning_state": payload.learning_state,
            "now": now,
        },
    )
    db.commit()
    row = db.execute(
        text(
            """
            SELECT word_id, is_favorite, learning_state, times_seen, times_correct
            FROM user_words WHERE user_id = :user_id AND word_id = :word_id
            """
        ),
        {"user_id": user_id, "word_id": word_id},
    ).mappings().one()
    return _serialize(row)

