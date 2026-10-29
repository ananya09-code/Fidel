"""Schemas for authenticated learner preferences."""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, field_validator

LanguageCode = Literal["om", "am"]
ProficiencyLevel = Literal["beginner", "some", "conversational", "improving"]
Motivation = Literal[
    "family", "conversation", "culture", "work", "travel", "literacy", "personal"
]
InterfaceLanguage = Literal["en", "om", "am"]
Appearance = Literal["light", "dark", "system"]
DailyGoal = Literal[5, 10, 15, 20]


class UserPreferencesUpdate(BaseModel):
    learning_language: LanguageCode | None = None
    proficiency_level: ProficiencyLevel | None = None
    motivations: list[Motivation] | None = Field(default=None, max_length=7)
    daily_goal_minutes: DailyGoal | None = None
    interface_language: InterfaceLanguage | None = None
    reminders_enabled: bool | None = None
    reminder_time: str | None = Field(
        default=None, pattern=r"^(?:[01][0-9]|2[0-3]):[0-5][0-9]$"
    )
    sound_enabled: bool | None = None
    appearance: Appearance | None = None
    timezone: str | None = Field(default=None, min_length=1, max_length=100)
    onboarding_completed: bool | None = None

    @field_validator("motivations")
    @classmethod
    def motivations_are_unique(
        cls, value: list[Motivation] | None
    ) -> list[Motivation] | None:
        if value is not None and len(value) != len(set(value)):
            raise ValueError("Motivations must not contain duplicates.")
        return value


class UserPreferences(BaseModel):
    learning_language: LanguageCode = "om"
    proficiency_level: ProficiencyLevel | None = None
    motivations: list[Motivation] = Field(default_factory=list)
    daily_goal_minutes: DailyGoal = 5
    interface_language: InterfaceLanguage = "en"
    reminders_enabled: bool = True
    reminder_time: str = "19:00"
    sound_enabled: bool = True
    appearance: Appearance = "system"
    timezone: str = "UTC"
    onboarding_completed: bool = False
    created_at: datetime | None = None
    updated_at: datetime | None = None
