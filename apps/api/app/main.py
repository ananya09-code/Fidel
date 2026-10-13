import os
from typing import Generator

from fastapi import Depends, FastAPI, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.db.database import SessionLocal

app = FastAPI(title="Fidel API")

AUDIO_BASE_URL = os.getenv("AUDIO_BASE_URL", "").rstrip("/")


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


@app.get("/")
def health_check():
    return {"message": "Fidel API is running"}


@app.get("/api/v1/words/{word_id}")
def get_word(word_id: str, db: Session = Depends(get_db)):
    query = text("""
        SELECT
            w.id,
            w.text,
            w.transliteration,
            w.language_code,
            w.category,
            w.difficulty,

            COALESCE(
                (
                    SELECT jsonb_agg(
                        jsonb_build_object(
                            'language_code', wt.language_code,
                            'meaning', wt.meaning,
                            'context_note', wt.context_note
                        )
                    )
                    FROM word_translations wt
                    WHERE wt.word_id = w.id
                ),
                '[]'::jsonb
            ) AS translations,

            COALESCE(
                (
                    SELECT jsonb_agg(
                        jsonb_build_object(
                            'storage_key', ar.storage_key,
                            'speed', ar.speed,
                            'status', ar.status
                        )
                    )
                    FROM audio_recordings ar
                    WHERE ar.word_id = w.id
                      AND ar.status = 'approved'
                ),
                '[]'::jsonb
            ) AS audio

        FROM words w
        WHERE w.id = :word_id
          AND w.status = 'approved'
    """)

    try:
        result = db.execute(
            query,
            {"word_id": word_id},
        ).mappings().first()
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve word",
        )

    if result is None:
        raise HTTPException(
            status_code=404,
            detail="Word not found",
        )

    word = dict(result)

    for recording in word["audio"]:
        recording["url"] = (
            f"{AUDIO_BASE_URL}/{recording['storage_key']}"
            if AUDIO_BASE_URL
            else None
        )

    return word
