"""Authenticated vocabulary review sessions."""

import json
from datetime import datetime, timezone
from typing import Annotated, Generator
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import JSON, bindparam, text
from sqlalchemy.orm import Session

from app.api.v1.endpoints.words import _audio_payload, _load_audio
from app.core.clerk_auth import ClerkUser, get_current_user
from app.db.database import SessionLocal
from app.schemas.reviews import (
    ReviewAnswer,
    ReviewAnswerRequest,
    ReviewHistoryItem,
    ReviewOverview,
    ReviewSession,
    ReviewWord,
)

router = APIRouter(prefix="/reviews", tags=["reviews"])


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _user_id(db: Session, clerk_id: str) -> UUID | None:
    return db.execute(
        text("SELECT id FROM users WHERE clerk_id = :clerk_id"),
        {"clerk_id": clerk_id},
    ).scalar_one_or_none()


def _word_ids(value) -> list[UUID]:
    if isinstance(value, str):
        value = json.loads(value)
    return [UUID(str(item)) for item in value]


def _load_words(
    db: Session,
    word_ids: list[UUID],
    user_id: UUID,
) -> list[ReviewWord]:
    if not word_ids:
        return []
    rows = db.execute(
        text(
            """
            SELECT w.id, w.text, COALESCE(w.category, 'Uncategorized') AS category,
                   COALESCE(
                     (SELECT wt.meaning FROM word_translations AS wt
                      WHERE wt.word_id = w.id AND wt.language_code = 'en'
                      ORDER BY wt.created_at LIMIT 1),
                     uw.meaning, 'Meaning unavailable'
                   ) AS meaning,
                   (SELECT wt.meaning FROM word_translations AS wt
                    WHERE wt.word_id = w.id AND wt.language_code = 'am'
                    ORDER BY wt.created_at LIMIT 1) AS amharic
            FROM words AS w
            JOIN user_words AS uw
              ON uw.word_id = w.id AND uw.user_id = :user_id
            WHERE w.id IN :word_ids
            """
        ).bindparams(bindparam("word_ids", expanding=True)),
        {"word_ids": word_ids, "user_id": user_id},
    ).mappings().all()
    by_id = {str(row["id"]): row for row in rows}
    audio = _load_audio(db, word_ids)
    result = []
    for word_id in word_ids:
        row = by_id.get(str(word_id))
        if row is None:
            continue
        result.append(
            ReviewWord(
                id=word_id,
                text=row["text"],
                meaning=row["meaning"],
                amharic=row["amharic"],
                category=row["category"],
                audio_url=_audio_payload(audio.get(str(word_id))).url,
            )
        )
    return result


def _session(db: Session, row, user_id: UUID) -> ReviewSession:
    answers = db.execute(
        text(
            """
            SELECT word_id, is_correct FROM review_answers
            WHERE session_id = :session_id AND user_id = :user_id
            ORDER BY answered_at
            """
        ),
        {"session_id": row["id"], "user_id": user_id},
    ).mappings().all()
    ids = _word_ids(row["word_ids"])
    return ReviewSession(
        id=row["id"],
        status=row["status"],
        total_count=row["total_count"],
        correct_count=row["correct_count"],
        started_at=row["started_at"],
        completed_at=row["completed_at"],
        words=_load_words(db, ids, user_id),
        answers=[ReviewAnswer(word_id=item["word_id"], is_correct=bool(item["is_correct"])) for item in answers],
    )


def _active_row(db: Session, user_id: UUID):
    return db.execute(
        text(
            """
            SELECT id, word_ids, status, total_count, correct_count,
                   started_at, completed_at, updated_at
            FROM review_sessions
            WHERE user_id = :user_id AND status = 'in_progress'
            """
        ),
        {"user_id": user_id},
    ).mappings().first()


def _owned_row(db: Session, session_id: UUID, user_id: UUID):
    row = db.execute(
        text(
            """
            SELECT id, word_ids, status, total_count, correct_count,
                   started_at, completed_at, updated_at
            FROM review_sessions WHERE id = :id AND user_id = :user_id
            """
        ),
        {"id": session_id, "user_id": user_id},
    ).mappings().first()
    if row is None:
        raise HTTPException(status_code=404, detail="Review session not found.")
    return row


@router.get("", response_model=ReviewOverview)
def get_review_overview(
    current_user: Annotated[ClerkUser, Depends(get_current_user)],
    db: Session = Depends(get_db),
) -> ReviewOverview:
    user_id = _user_id(db, current_user.user_id)
    if user_id is None:
        return ReviewOverview(queue=[], active_session=None, history=[])
    queue_ids = db.execute(
        text(
            """
            SELECT word_id FROM user_words
            WHERE user_id = :user_id AND learning_state = 'needs_review'
            ORDER BY last_seen_at ASC LIMIT 20
            """
        ),
        {"user_id": user_id},
    ).scalars().all()
    active = _active_row(db, user_id)
    history_rows = db.execute(
        text(
            """
            SELECT id, total_count, correct_count, completed_at
            FROM review_sessions
            WHERE user_id = :user_id AND status = 'completed'
            ORDER BY completed_at DESC LIMIT 10
            """
        ),
        {"user_id": user_id},
    ).mappings().all()
    return ReviewOverview(
        queue=_load_words(db, list(queue_ids), user_id),
        active_session=_session(db, active, user_id) if active else None,
        history=[ReviewHistoryItem(**row) for row in history_rows],
    )


@router.post("/start", response_model=ReviewSession)
def start_review(
    current_user: Annotated[ClerkUser, Depends(get_current_user)],
    db: Session = Depends(get_db),
) -> ReviewSession:
    user_id = _user_id(db, current_user.user_id)
    if user_id is None:
        raise HTTPException(status_code=409, detail="No words need review.")
    active = _active_row(db, user_id)
    if active:
        return _session(db, active, user_id)
    ids = list(db.execute(
        text(
            """
            SELECT word_id FROM user_words
            WHERE user_id = :user_id AND learning_state = 'needs_review'
            ORDER BY last_seen_at ASC LIMIT 20
            """
        ),
        {"user_id": user_id},
    ).scalars().all())
    if not ids:
        raise HTTPException(status_code=409, detail="No words need review.")
    now = datetime.now(timezone.utc)
    session_id = uuid4()
    statement = text(
        """
        INSERT INTO review_sessions (
            id, user_id, word_ids, status, total_count, correct_count,
            started_at, completed_at, updated_at
        ) VALUES (:id, :user_id, :word_ids, 'in_progress', :total, 0, :now, NULL, :now)
        ON CONFLICT DO NOTHING
        """
    ).bindparams(bindparam("word_ids", type_=JSON()))
    db.execute(statement, {"id": session_id, "user_id": user_id, "word_ids": [str(item) for item in ids], "total": len(ids), "now": now})
    db.commit()
    return _session(db, _active_row(db, user_id), user_id)


@router.put("/{session_id}/answers", response_model=ReviewSession)
def save_review_answer(
    session_id: UUID,
    payload: ReviewAnswerRequest,
    current_user: Annotated[ClerkUser, Depends(get_current_user)],
    db: Session = Depends(get_db),
) -> ReviewSession:
    user_id = _user_id(db, current_user.user_id)
    if user_id is None:
        raise HTTPException(status_code=404, detail="Review session not found.")
    row = _owned_row(db, session_id, user_id)
    if row["status"] != "in_progress":
        raise HTTPException(status_code=409, detail="Review session is completed.")
    ids = _word_ids(row["word_ids"])
    if payload.word_id not in ids or payload.selected_word_id not in ids:
        raise HTTPException(status_code=422, detail="Answer word is not in this review session.")
    previous = db.execute(
        text("SELECT is_correct FROM review_answers WHERE session_id = :id AND user_id = :user_id AND word_id = :word_id"),
        {"id": session_id, "user_id": user_id, "word_id": payload.word_id},
    ).scalar_one_or_none()
    correct = payload.word_id == payload.selected_word_id
    now = datetime.now(timezone.utc)
    db.execute(
        text(
            """
            INSERT INTO review_answers (session_id, user_id, word_id, selected_word_id, is_correct, answered_at)
            VALUES (:id, :user_id, :word_id, :selected, :correct, :now)
            ON CONFLICT (session_id, word_id) DO UPDATE SET
              selected_word_id = excluded.selected_word_id,
              is_correct = excluded.is_correct, answered_at = excluded.answered_at
            """
        ),
        {"id": session_id, "user_id": user_id, "word_id": payload.word_id, "selected": payload.selected_word_id, "correct": correct, "now": now},
    )
    seen_increment = 1 if previous is None else 0
    correct_delta = int(correct) - (int(previous) if previous is not None else 0)
    db.execute(
        text(
            """
            UPDATE user_words SET
              times_seen = times_seen + :seen_increment,
              times_correct = times_correct + :correct_delta,
              learning_state = :state, last_seen_at = :now
            WHERE user_id = :user_id AND word_id = :word_id
            """
        ),
        {"seen_increment": seen_increment, "correct_delta": correct_delta, "state": "learned" if correct else "needs_review", "now": now, "user_id": user_id, "word_id": payload.word_id},
    )
    correct_count = db.execute(
        text("SELECT COUNT(*) FROM review_answers WHERE session_id = :id AND user_id = :user_id AND is_correct = true"),
        {"id": session_id, "user_id": user_id},
    ).scalar_one()
    db.execute(
        text("UPDATE review_sessions SET correct_count = :correct, updated_at = :now WHERE id = :id AND user_id = :user_id"),
        {"correct": correct_count, "now": now, "id": session_id, "user_id": user_id},
    )
    db.commit()
    return _session(db, _owned_row(db, session_id, user_id), user_id)


@router.post("/{session_id}/complete", response_model=ReviewSession)
def complete_review(
    session_id: UUID,
    current_user: Annotated[ClerkUser, Depends(get_current_user)],
    db: Session = Depends(get_db),
) -> ReviewSession:
    user_id = _user_id(db, current_user.user_id)
    if user_id is None:
        raise HTTPException(status_code=404, detail="Review session not found.")
    row = _owned_row(db, session_id, user_id)
    if row["status"] == "completed":
        return _session(db, row, user_id)
    answered = db.execute(
        text("SELECT COUNT(*) FROM review_answers WHERE session_id = :id AND user_id = :user_id"),
        {"id": session_id, "user_id": user_id},
    ).scalar_one()
    if answered < row["total_count"]:
        raise HTTPException(status_code=409, detail="Answer every review word before completing the session.")
    now = datetime.now(timezone.utc)
    db.execute(
        text("UPDATE review_sessions SET status = 'completed', completed_at = :now, updated_at = :now WHERE id = :id AND user_id = :user_id"),
        {"now": now, "id": session_id, "user_id": user_id},
    )
    db.commit()
    return _session(db, _owned_row(db, session_id, user_id), user_id)

