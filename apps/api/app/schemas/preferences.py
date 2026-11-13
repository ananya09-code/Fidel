"""Schemas for authenticated learner preferences."""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import AliasChoices, BaseModel, Field, computed_field, field_validator

LanguageCode = Literal["om", "am", "ti"]
ProficiencyLevel = Literal["beginner", "some", "conversational", "improving"]
Motivation = Literal[
    "family", "conversation", "culture", "work", "travel", "literacy", "personal"
]
InterfaceLanguage = Literal["en", "om", "am", "ti"]
Appearance = Literal["light", "dark", "system"]
DailyGoal = Literal[5, 10, 15, 20]


class UserPreferencesUpdate(BaseModel):
    learning_language: LanguageCode | None = None
    proficiency_level: ProficiencyLevel | None = None
    motivations: list[Motivation] | None = Field(default=None, max_length=7)
    daily_goal_words: DailyGoal | None = Field(
        default=None,
        validation_alias=AliasChoices("daily_goal_words", "daily_goal_minutes"),
    )
    interface_language: InterfaceLanguage | None = None
    reminders_enabled: bool | None = None
    reminder_time: str | None = Field(
        default=None, pattern=r"^(?:[01][0-9]|2[0-3]):[0-5][0-9]$"
    )
    sound_enabled: bool | None = None
    sound_volume: int | None = Field(default=None, ge=0, le=100)
    haptics_enabled: bool | None = None
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
    daily_goal_words: DailyGoal = Field(
        default=5,
        validation_alias=AliasChoices("daily_goal_words", "daily_goal_minutes"),
    )
    interface_language: InterfaceLanguage = "en"
    reminders_enabled: bool = True
    reminder_time: str = "19:00"
    sound_enabled: bool = True
    sound_volume: int = Field(default=75, ge=0, le=100)
    haptics_enabled: bool = True
    appearance: Appearance = "system"
    timezone: str = "UTC"
    onboarding_completed: bool = False
    created_at: datetime | None = None
    updated_at: datetime | None = None

    @computed_field(json_schema_extra={"deprecated": True})
    @property
    def daily_goal_minutes(self) -> DailyGoal:
        """Legacy response key for clients deployed before word-based goals."""
        return self.daily_goal_words
