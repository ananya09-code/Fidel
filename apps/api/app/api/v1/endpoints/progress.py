"""Authenticated lesson progress endpoints."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Annotated, Any, Generator, Mapping
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import JSON, bindparam, text
from sqlalchemy.orm import Session

from app.core.clerk_auth import ClerkUser, get_current_user
from app.db.database import SessionLocal
from app.schemas.progress import (
    AnswerRequest,
    LessonAttempt,
    LessonCheckpointRequest,
    ProgressSummary,
    SavedAnswer,
    StartLessonRequest,
)

router = APIRouter(prefix="/progress", tags=["progress"])


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _ensure_user(db: Session, clerk_id: str, now: datetime) -> UUID:
    candidate = uuid4()
    db.execute(
        text(
            """
            INSERT INTO users (id, clerk_id, created_at, updated_at)
            VALUES (:id, :clerk_id, :now, :now)
            ON CONFLICT (clerk_id) DO NOTHING
            """
        ),
        {"id": candidate, "clerk_id": clerk_id, "now": now},
    )
    return db.execute(
        text("SELECT id FROM users WHERE clerk_id = :clerk_id"),
        {"clerk_id": clerk_id},
    ).scalar_one()


def _user_id(db: Session, clerk_id: str) -> UUID | None:
    return db.execute(
        text("SELECT id FROM users WHERE clerk_id = :clerk_id"),
        {"clerk_id": clerk_id},
    ).scalar_one_or_none()


def _answers(db: Session, attempt_id: UUID, user_id: UUID) -> list[SavedAnswer]:
    rows = db.execute(
        text(
            """
            SELECT question_id, is_correct
            FROM answer_attempts
            WHERE attempt_id = :attempt_id AND user_id = :user_id
            ORDER BY answered_at, question_id
            """
        ),
        {"attempt_id": attempt_id, "user_id": user_id},
    ).mappings().all()
    return [
        SavedAnswer(question_id=row["question_id"], is_correct=bool(row["is_correct"]))
        for row in rows
    ]


def _serialize(db: Session, row: Mapping[str, Any], user_id: UUID) -> LessonAttempt:
    return LessonAttempt(
        id=row["id"],
        lesson_key=row["lesson_key"],
        difficulty=row["difficulty"],
        category_key=row["category_key"],
        category_label=row["category_label"],
        difficulty_label=row["difficulty_label"],
        status=row["status"],
        stage=row["stage"],
        question_index=row["question_index"],
        question_count=row["question_count"],
        correct_count=row["correct_count"],
        started_at=row["started_at"],
        completed_at=row["completed_at"],
        updated_at=row["updated_at"],
        answers=_answers(db, row["id"], user_id),
    )


def _attempt_row(
    db: Session, attempt_id: UUID, user_id: UUID
) -> Mapping[str, Any] | None:
    return db.execute(
        text(
            """
            SELECT id, lesson_key, difficulty, category_key, category_label,
                   difficulty_label, status, stage, question_index,
                   question_count, correct_count, started_at, completed_at,
                   updated_at
            FROM lesson_attempts
            WHERE id = :attempt_id AND user_id = :user_id
            """
        ),
        {"attempt_id": attempt_id, "user_id": user_id},
    ).mappings().first()


def _require_attempt(
    db: Session, attempt_id: UUID, user_id: UUID
) -> Mapping[str, Any]:
    row = _attempt_row(db, attempt_id, user_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Lesson attempt not found.")
    return row


@router.get("", response_model=ProgressSummary)
def get_progress_summary(
    current_user: Annotated[ClerkUser, Depends(get_current_user)],
    db: Session = Depends(get_db),
) -> ProgressSummary:
    """Return progress owned by the verified Clerk user."""

    user_id = _user_id(db, current_user.user_id)
    if user_id is None:
        return ProgressSummary(
            lessons_completed=0,
            questions_answered=0,
            correct_answers=0,
            completed_lesson_keys=[],
            in_progress=[],
        )

    completed = db.execute(
        text(
            """
            SELECT DISTINCT lesson_key
            FROM lesson_attempts
            WHERE user_id = :user_id AND status = 'completed'
            ORDER BY lesson_key
            """
        ),
        {"user_id": user_id},
    ).scalars().all()
    counts = db.execute(
        text(
            """
            SELECT COUNT(*) AS answered,
                   COALESCE(SUM(CASE WHEN is_correct THEN 1 ELSE 0 END), 0) AS correct
            FROM answer_attempts
            WHERE user_id = :user_id
            """
        ),
        {"user_id": user_id},
    ).mappings().one()
    active = db.execute(
        text(
            """
            SELECT id, lesson_key, difficulty, category_key, category_label,
                   difficulty_label, status, stage, question_index,
                   question_count, correct_count, started_at, completed_at,
                   updated_at
            FROM lesson_attempts
            WHERE user_id = :user_id AND status = 'in_progress'
            ORDER BY updated_at DESC
            """
        ),
        {"user_id": user_id},
    ).mappings().all()
    return ProgressSummary(
        lessons_completed=len(completed),
        questions_answered=int(counts["answered"]),
        correct_answers=int(counts["correct"]),
        completed_lesson_keys=list(completed),
        in_progress=[_serialize(db, row, user_id) for row in active],
    )


@router.get("/lessons/{lesson_key}", response_model=LessonAttempt | None)
def get_lesson_attempt(
    lesson_key: str,
    current_user: Annotated[ClerkUser, Depends(get_current_user)],
    db: Session = Depends(get_db),
) -> LessonAttempt | None:
    user_id = _user_id(db, current_user.user_id)
    if user_id is None:
        return None
    row = db.execute(
        text(
            """
            SELECT id, lesson_key, difficulty, category_key, category_label,
                   difficulty_label, status, stage, question_index,
                   question_count, correct_count, started_at, completed_at,
                   updated_at
            FROM lesson_attempts
            WHERE user_id = :user_id AND lesson_key = :lesson_key
              AND status = 'in_progress'
            """
        ),
        {"user_id": user_id, "lesson_key": lesson_key},
    ).mappings().first()
    return _serialize(db, row, user_id) if row else None


@router.post("/lessons/{lesson_key}/start", response_model=LessonAttempt)
def start_lesson(
    lesson_key: str,
    payload: StartLessonRequest,
    current_user: Annotated[ClerkUser, Depends(get_current_user)],
    db: Session = Depends(get_db),
) -> LessonAttempt:
    now = datetime.now(timezone.utc)
    user_id = _ensure_user(db, current_user.user_id, now)
    attempt_id = uuid4()
    db.execute(
        text(
            """
            INSERT INTO lesson_attempts (
                id, user_id, lesson_key, difficulty, category_key,
                category_label, difficulty_label, status, stage,
                question_index, question_count, correct_count,
                started_at, completed_at, updated_at
            ) VALUES (
                :id, :user_id, :lesson_key, :difficulty, :category_key,
                :category_label, :difficulty_label, 'in_progress',
                'vocabulary', 0, :question_count, 0, :now, NULL, :now
            )
            ON CONFLICT DO NOTHING
            """
        ),
        {
            "id": attempt_id,
            "user_id": user_id,
            "lesson_key": lesson_key,
            "difficulty": payload.difficulty,
            "category_key": payload.category_key,
            "category_label": payload.category_label,
            "difficulty_label": payload.difficulty_label,
            "question_count": payload.question_count,
            "now": now,
        },
    )
    db.commit()
    row = db.execute(
        text(
            """
            SELECT id, lesson_key, difficulty, category_key, category_label,
                   difficulty_label, status, stage, question_index,
                   question_count, correct_count, started_at, completed_at,
                   updated_at
            FROM lesson_attempts
            WHERE user_id = :user_id AND lesson_key = :lesson_key
              AND status = 'in_progress'
            """
        ),
        {"user_id": user_id, "lesson_key": lesson_key},
    ).mappings().one()
    return _serialize(db, row, user_id)


@router.patch("/attempts/{attempt_id}", response_model=LessonAttempt)
def checkpoint_lesson(
    attempt_id: UUID,
    payload: LessonCheckpointRequest,
    current_user: Annotated[ClerkUser, Depends(get_current_user)],
    db: Session = Depends(get_db),
) -> LessonAttempt:
    user_id = _user_id(db, current_user.user_id)
    if user_id is None:
        raise HTTPException(status_code=404, detail="Lesson attempt not found.")
    row = _require_attempt(db, attempt_id, user_id)
    if row["status"] == "completed":
        return _serialize(db, row, user_id)
    if payload.question_index > row["question_count"]:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Question index cannot exceed the lesson question count.",
        )
    question_index = payload.question_index
    if payload.stage == row["stage"]:
        question_index = max(question_index, row["question_index"])
    elif row["stage"] == "practice" and payload.stage == "vocabulary":
        raise HTTPException(
            status_code=409,
            detail="Practice progress cannot return to vocabulary.",
        )
    db.execute(
        text(
            """
            UPDATE lesson_attempts
            SET stage = :stage, question_index = :question_index,
                updated_at = :now
            WHERE id = :attempt_id AND user_id = :user_id
            """
        ),
        {
            "stage": payload.stage,
            "question_index": question_index,
            "now": datetime.now(timezone.utc),
            "attempt_id": attempt_id,
            "user_id": user_id,
        },
    )
    db.commit()
    return _serialize(db, _require_attempt(db, attempt_id, user_id), user_id)


@router.put("/attempts/{attempt_id}/answers", response_model=LessonAttempt)
def save_answer(
    attempt_id: UUID,
    payload: AnswerRequest,
    current_user: Annotated[ClerkUser, Depends(get_current_user)],
    db: Session = Depends(get_db),
) -> LessonAttempt:
    user_id = _user_id(db, current_user.user_id)
    if user_id is None:
        raise HTTPException(status_code=404, detail="Lesson attempt not found.")
    row = _require_attempt(db, attempt_id, user_id)
    if row["status"] != "in_progress":
        raise HTTPException(status_code=409, detail="Lesson is already completed.")
    if payload.question_index >= row["question_count"]:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Question index is outside this lesson.",
        )

    now = datetime.now(timezone.utc)
    word_ids = [str(payload.word_id), str(payload.selected_word_id)]
    previous_correct = db.execute(
        text(
            """
            SELECT is_correct FROM answer_attempts
            WHERE attempt_id = :attempt_id AND question_id = :question_id
              AND user_id = :user_id
            """
        ),
        {
            "attempt_id": attempt_id,
            "question_id": payload.question_id,
            "user_id": user_id,
        },
    ).scalar_one_or_none()
    statement = text(
        """
        INSERT INTO answer_attempts (
            attempt_id, user_id, question_id, question_type,
            word_ids, is_correct, answered_at
        ) VALUES (
            :attempt_id, :user_id, :question_id, :question_type,
            :word_ids, :is_correct, :now
        )
        ON CONFLICT (attempt_id, question_id) DO UPDATE SET
            question_type = excluded.question_type,
            word_ids = excluded.word_ids,
            is_correct = excluded.is_correct,
            answered_at = excluded.answered_at
        """
    ).bindparams(bindparam("word_ids", type_=JSON()))
    db.execute(
        statement,
        {
            "attempt_id": attempt_id,
            "user_id": user_id,
            "question_id": payload.question_id,
            "question_type": payload.question_type,
            "word_ids": word_ids,
            "is_correct": payload.word_id == payload.selected_word_id,
            "now": now,
        },
    )
    is_correct = payload.word_id == payload.selected_word_id
    seen_increment = 1 if previous_correct is None else 0
    correct_delta = int(is_correct) - (
        int(previous_correct) if previous_correct is not None else 0
    )
    db.execute(
        text(
            """
            INSERT INTO user_words (
                user_id, word_id, times_seen, times_correct, text, meaning,
                first_seen_at, last_seen_at, is_favorite, learning_state
            )
            SELECT
                :user_id, w.id, 1, :correct_increment, w.text,
                (SELECT wt.meaning FROM word_translations AS wt
                 WHERE wt.word_id = w.id AND wt.language_code = 'en'
                 ORDER BY wt.created_at LIMIT 1),
                :now, :now, false, :learning_state
            FROM words AS w
            WHERE w.id = :word_id AND w.status = 'approved'
            ON CONFLICT (user_id, word_id) DO UPDATE SET
                times_seen = user_words.times_seen + :seen_increment,
                times_correct = user_words.times_correct + :correct_delta,
                learning_state = :learning_state,
                last_seen_at = :now
            """
        ),
        {
            "user_id": user_id,
            "word_id": payload.word_id,
            "correct_increment": 1 if is_correct else 0,
            "seen_increment": seen_increment,
            "correct_delta": correct_delta,
            "learning_state": "learned" if is_correct else "needs_review",
            "now": now,
        },
    )
    correct_count = db.execute(
        text(
            """
            SELECT COUNT(*) FROM answer_attempts
            WHERE attempt_id = :attempt_id AND user_id = :user_id
              AND is_correct = true
            """
        ),
        {"attempt_id": attempt_id, "user_id": user_id},
    ).scalar_one()
    db.execute(
        text(
            """
            UPDATE lesson_attempts
            SET stage = 'practice', question_index = :question_index,
                correct_count = :correct_count, updated_at = :now
            WHERE id = :attempt_id AND user_id = :user_id
            """
        ),
        {
            "question_index": max(row["question_index"], payload.question_index + 1),
            "correct_count": correct_count,
            "now": now,
            "attempt_id": attempt_id,
            "user_id": user_id,
        },
    )
    db.commit()
    return _serialize(db, _require_attempt(db, attempt_id, user_id), user_id)


@router.post("/attempts/{attempt_id}/complete", response_model=LessonAttempt)
def complete_lesson(
    attempt_id: UUID,
    current_user: Annotated[ClerkUser, Depends(get_current_user)],
    db: Session = Depends(get_db),
) -> LessonAttempt:
    user_id = _user_id(db, current_user.user_id)
    if user_id is None:
        raise HTTPException(status_code=404, detail="Lesson attempt not found.")
    row = _require_attempt(db, attempt_id, user_id)
    if row["status"] == "completed":
        return _serialize(db, row, user_id)
    answered = db.execute(
        text(
            """
            SELECT COUNT(*) FROM answer_attempts
            WHERE attempt_id = :attempt_id AND user_id = :user_id
            """
        ),
        {"attempt_id": attempt_id, "user_id": user_id},
    ).scalar_one()
    if answered < row["question_count"]:
        raise HTTPException(
            status_code=409,
            detail="Answer every practice question before completing the lesson.",
        )
    now = datetime.now(timezone.utc)
    db.execute(
        text(
            """
            UPDATE lesson_attempts
            SET status = 'completed', stage = 'practice',
                question_index = question_count, completed_at = :now,
                updated_at = :now
            WHERE id = :attempt_id AND user_id = :user_id
            """
        ),
        {"now": now, "attempt_id": attempt_id, "user_id": user_id},
    )
    db.commit()
    return _serialize(db, _require_attempt(db, attempt_id, user_id), user_id)

