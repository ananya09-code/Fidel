"""Schemas for authenticated lesson progress."""

from __future__ import annotations

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field

LessonStage = Literal["vocabulary", "practice"]
LessonStatus = Literal["in_progress", "completed"]


class StartLessonRequest(BaseModel):
    difficulty: str = Field(min_length=1, max_length=100)
    category_key: str = Field(min_length=1, max_length=200)
    category_label: str | None = Field(default=None, max_length=200)
    difficulty_label: str | None = Field(default=None, max_length=200)
    question_count: int = Field(ge=1, le=50)


class LessonCheckpointRequest(BaseModel):
    stage: LessonStage
    question_index: int = Field(ge=0, le=50)


class AnswerRequest(BaseModel):
    question_id: str = Field(min_length=1, max_length=200)
    question_type: Literal["multiple_choice"] = "multiple_choice"
    word_id: UUID
    selected_word_id: UUID
    question_index: int = Field(ge=0, le=49)


class SavedAnswer(BaseModel):
    question_id: str
    is_correct: bool


class LessonAttempt(BaseModel):
    id: UUID
    lesson_key: str
    difficulty: str
    category_key: str
    category_label: str | None
    difficulty_label: str | None
    status: LessonStatus
    stage: LessonStage
    question_index: int
    question_count: int
    correct_count: int
    started_at: datetime
    completed_at: datetime | None
    updated_at: datetime
    answers: list[SavedAnswer] = Field(default_factory=list)


class ProgressSummary(BaseModel):
    lessons_completed: int
    questions_answered: int
    correct_answers: int
    completed_lesson_keys: list[str]
    in_progress: list[LessonAttempt]

