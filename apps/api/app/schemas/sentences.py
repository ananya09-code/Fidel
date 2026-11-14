"""Build-a-sentence API contracts."""

from uuid import UUID

from pydantic import BaseModel, Field


class SentenceTile(BaseModel):
    id: str
    text: str
    word_id: UUID


class SentenceExercise(BaseModel):
    id: UUID
    language_code: str
    meaning: str | None
    meaning_amharic: str | None
    tiles: list[SentenceTile]
    missing_words: list[str]
    audio_available: bool
    audio_url: str | None
    locked: bool
    completed: bool


class SentenceList(BaseModel):
    language_code: str
    exercises: list[SentenceExercise]


class SentenceAnswer(BaseModel):
    selected_order: list[str] = Field(min_length=1, max_length=24)


class SentenceAnswerResult(BaseModel):
    is_correct: bool
    sentence: str | None
    meaning: str | None
    meaning_amharic: str | None
    audio_url: str | None
    hint: str | None
    attempt_id: UUID
