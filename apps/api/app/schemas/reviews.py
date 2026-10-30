"""Schemas for vocabulary review sessions."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class ReviewWord(BaseModel):
    id: UUID
    text: str
    meaning: str
    amharic: str | None = None
    category: str
    audio_url: str | None = None


class ReviewAnswer(BaseModel):
    word_id: UUID
    is_correct: bool


class ReviewSession(BaseModel):
    id: UUID
    status: str
    total_count: int
    correct_count: int
    started_at: datetime
    completed_at: datetime | None
    words: list[ReviewWord]
    answers: list[ReviewAnswer] = Field(default_factory=list)


class ReviewAnswerRequest(BaseModel):
    word_id: UUID
    selected_word_id: UUID


class ReviewHistoryItem(BaseModel):
    id: UUID
    total_count: int
    correct_count: int
    completed_at: datetime


class ReviewOverview(BaseModel):
    queue: list[ReviewWord]
    active_session: ReviewSession | None
    history: list[ReviewHistoryItem]

