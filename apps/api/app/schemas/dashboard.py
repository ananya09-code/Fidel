"""Authenticated learner dashboard schemas."""

from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, Field


class CurrentLesson(BaseModel):
    lesson_key: str
    title: str
    stage: str
    question_index: int
    question_count: int


class DailyActivity(BaseModel):
    date: date
    minutes: int
    events: int


class RecentActivity(BaseModel):
    kind: Literal["lesson", "review"]
    title: str
    occurred_at: datetime
    correct_count: int
    total_count: int


class DashboardSummary(BaseModel):
    daily_word_goal: int
    words_learned_today: int
    goal_minutes: int
    study_minutes_today: int
    streak_days: int
    learned_words: int
    needs_review_words: int
    lessons_completed: int
    reviews_completed: int
    correct_answers: int
    current_lesson: CurrentLesson | None
    weekly_activity: list[DailyActivity] = Field(default_factory=list)
    recent_activity: list[RecentActivity] = Field(default_factory=list)

