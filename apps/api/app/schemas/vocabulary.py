"""Schemas for authenticated per-user vocabulary state."""

from typing import Literal
from uuid import UUID

from pydantic import BaseModel

LearningState = Literal["learning", "learned", "needs_review"]


class VocabularyStateUpdate(BaseModel):
    is_favorite: bool | None = None
    learning_state: LearningState | None = None


class VocabularyState(BaseModel):
    word_id: UUID
    is_favorite: bool
    learning_state: LearningState
    times_seen: int
    times_correct: int


class VocabularyStateList(BaseModel):
    data: list[VocabularyState]

