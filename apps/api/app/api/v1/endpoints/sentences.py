"""Clerk-scoped sentence building with learned-word and reviewed-audio gates."""

import json
from typing import Annotated
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import JSON, bindparam, text
from sqlalchemy.orm import Session

from app.api.v1.endpoints.quests import _uid
from app.api.v1.endpoints.words import _audio_payload, _load_audio
from app.core.clerk_auth import ClerkUser, get_current_user
from app.db.database import SessionLocal
from app.schemas.sentences import SentenceAnswer, SentenceAnswerResult, SentenceExercise, SentenceList

router = APIRouter(prefix="/sentences", tags=["sentences"])


def get_db():
    with SessionLocal() as db:
        yield db


def _json(value):
    return json.loads(value) if isinstance(value, str) else value


def _catalogue(db: Session, language: str, user_id: UUID | None):
    rows = db.execute(text("""SELECT e.id, e.sentence_word_id, e.tiles, e.accepted_orders,
        w.text AS sentence, w.status, w.language_code,
        (SELECT wt.meaning FROM word_translations wt WHERE wt.word_id=w.id
         AND wt.language_code='en' ORDER BY wt.created_at LIMIT 1) AS meaning,
        (SELECT wt.meaning FROM word_translations wt WHERE wt.word_id=w.id
         AND wt.language_code='am' ORDER BY wt.created_at LIMIT 1) AS meaning_amharic
        FROM sentence_exercises e JOIN words w ON w.id=e.sentence_word_id
        WHERE w.language_code=:lang AND w.content_type='sentence' AND w.status='approved'
        ORDER BY e.created_at, e.id"""), {"lang": language}).mappings().all()
    if not rows:
        return []
    ids = list({UUID(str(tile["word_id"])) for row in rows for tile in _json(row["tiles"])})
    words = {str(row["id"]): row for row in db.execute(text("""SELECT id, text, language_code, content_type, status
        FROM words WHERE id IN :ids""").bindparams(bindparam("ids", expanding=True)), {"ids": ids}).mappings()}
    learned = set()
    if user_id:
        learned = {str(value) for value in db.execute(text("""SELECT word_id FROM user_words
            WHERE user_id=:uid AND (learning_state='learned' OR
                (learning_state='needs_review' AND times_correct>0)) AND word_id IN :ids""").bindparams(bindparam("ids", expanding=True)), {"uid": user_id, "ids": ids}).scalars()}
    completed = set()
    if user_id:
        completed = {str(value) for value in db.execute(text("""SELECT DISTINCT exercise_id FROM sentence_attempts
            WHERE user_id=:uid AND is_correct=true"""), {"uid": user_id}).scalars()}
    audio = _load_audio(db, [row["sentence_word_id"] for row in rows])
    result = []
    for row in rows:
        tiles = _json(row["tiles"])
        missing = []
        for tile in tiles:
            word = words.get(str(tile["word_id"]))
            if not word or word["language_code"] != language or word["content_type"] == "sentence" or word["status"] != "approved":
                missing.append(tile["text"])
            elif str(tile["word_id"]) not in learned:
                missing.append(word["text"])
        playable = _audio_payload(audio.get(str(row["sentence_word_id"]))) if row["status"] == "approved" else None
        result.append((row, sorted(set(missing)), playable))
    return [(row, missing, playable, str(row["id"]) in completed) for row, missing, playable in result]


@router.get("", response_model=SentenceList)
def list_sentences(current_user: Annotated[ClerkUser, Depends(get_current_user)],
                   language_code: str = Query(..., pattern="^(am|om|ti)$"),
                   db: Session = Depends(get_db)):
    rows = _catalogue(db, language_code, _uid(db, current_user.user_id))
    return SentenceList(language_code=language_code, exercises=[SentenceExercise(
        id=row["id"], language_code=language_code, meaning=row["meaning"], meaning_amharic=row["meaning_amharic"],
        tiles=_json(row["tiles"]), missing_words=missing,
        audio_available=bool(playable and playable.available),
        audio_url=playable.url if playable and playable.available else None,
        locked=bool(missing or not playable or not playable.available), completed=completed,
    ) for row, missing, playable, completed in rows])


@router.post("/{exercise_id}/answers", response_model=SentenceAnswerResult)
def answer_sentence(exercise_id: UUID, payload: SentenceAnswer,
                    current_user: Annotated[ClerkUser, Depends(get_current_user)],
                    db: Session = Depends(get_db)):
    user_id = _uid(db, current_user.user_id)
    row = db.execute(text("""SELECT w.language_code FROM sentence_exercises e
        JOIN words w ON w.id=e.sentence_word_id WHERE e.id=:id AND w.content_type='sentence'"""), {"id": exercise_id}).mappings().first()
    if not row:
        raise HTTPException(404, "Sentence exercise not found.")
    item = next((entry for entry in _catalogue(db, row["language_code"], user_id) if str(entry[0]["id"]) == str(exercise_id)), None)
    if item is None:
        raise HTTPException(404, "Sentence exercise not found.")
    exercise, missing, playable, _ = item
    if not user_id or missing or not playable or not playable.available:
        raise HTTPException(409, "Learn the required words and wait for approved sentence audio first.")
    tiles = _json(exercise["tiles"])
    tile_ids = [tile["id"] for tile in tiles]
    if len(tile_ids) != len(set(tile_ids)) or len(payload.selected_order) != len(tile_ids) or set(payload.selected_order) != set(tile_ids):
        raise HTTPException(422, "Select each word tile exactly once.")
    correct = payload.selected_order in _json(exercise["accepted_orders"])
    attempt_id = uuid4()
    db.execute(text("""INSERT INTO sentence_attempts (id,user_id,exercise_id,selected_order,is_correct)
        VALUES (:id,:uid,:exercise,:selected,:correct)""").bindparams(bindparam("selected", type_=JSON)),
        {"id": attempt_id, "uid": user_id, "exercise": exercise_id,
         "selected": payload.selected_order, "correct": correct})
    db.commit()
    first_id = _json(exercise["accepted_orders"])[0][0]
    first_word = next((tile["text"] for tile in tiles if tile["id"] == first_id), None)
    return SentenceAnswerResult(is_correct=correct,
                                sentence=exercise["sentence"] if correct else None,
                                meaning=exercise["meaning"], meaning_amharic=exercise["meaning_amharic"], audio_url=playable.url,
                                hint=None if correct or not first_word else f"Start with {first_word}.",
                                attempt_id=attempt_id)
