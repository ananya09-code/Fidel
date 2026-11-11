from typing import Literal
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.reviews import ReviewWord

Language = Literal["om", "am", "ti"]


class QuestReply(BaseModel):
    model_config = ConfigDict(extra="forbid")
    expected_step: int = Field(ge=0, le=20)
    version: int = Field(ge=1)
    word_id: UUID | None = None
    name: str | None = Field(default=None, min_length=1, max_length=40)


class QuestTerm(BaseModel):
    key: str
    text: str
    english: str
    amharic: str
    alternatives: list[str]


class QuestStep(BaseModel):
    id: str
    prompt: str
    accepts: list[str]
    kind: Literal["name", "word"]


class QuestState(BaseModel):
    version: int
    step_index: int
    answers: list[dict]
    completed: bool


class QuestItem(BaseModel):
    id: str
    version: int
    title: str
    description: str
    character: Literal["guide", "host"]
    prerequisite: str | None
    required: list[QuestTerm]
    steps: list[QuestStep]
    state: QuestState | None
    locked: bool
    reasons: list[str]
    missing_words: list[str]
    unavailable_words: list[str]


class QuestOverview(BaseModel):
    language_code: Language
    quests: list[QuestItem]
    bank: list[ReviewWord]


class QuestReplyResult(BaseModel):
    accepted: bool
    feedback: str | None = None
    state: QuestState
