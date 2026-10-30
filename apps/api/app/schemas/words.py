"""Schemas for the public vocabulary API."""

from __future__ import annotations

from pydantic import BaseModel, Field


class WordTranslation(BaseModel):
    """One translation of a vocabulary entry."""

    language_code: str
    meaning: str
    context_note: str | None = None


class WordAudio(BaseModel):
    """Playable audio for a vocabulary entry."""

    available: bool
    url: str | None = None
    speaker_id: str | None = None
    speed: str | None = None

class WordSummary(BaseModel):
    id: str
    language_code: str
    text: str
    transliteration: str | None = None
    content_type: str
    category: str
    difficulty: str
    meaning: str | None = None
    translations: list[WordTranslation] = Field(default_factory=list)
    audio: WordAudio
class WordDetail(BaseModel):
    """A single vocabulary entry with every translation."""

    id: str
    language_code: str
    text: str
    transliteration: str | None = None
    content_type: str
    category: str | None = None
    difficulty: str
    translations: list[WordTranslation] = Field(default_factory=list)
    audio: WordAudio


class WordPagination(BaseModel):
    """Pagination metadata for a word list."""

    page: int
    page_size: int
    total_items: int
    total_pages: int
    has_next: bool
    has_previous: bool


class WordListMeta(BaseModel):
    """Envelope metadata for a word list."""

    request_id: str
    pagination: WordPagination


class WordListResponse(BaseModel):
    """Paginated vocabulary response."""

    data: list[WordSummary]
    meta: WordListMeta


class WordCategory(BaseModel):
    """One category represented by approved vocabulary."""

    name: str
    word_count: int


class WordCategoryListResponse(BaseModel):
    """Categories available for a language."""

    data: list[WordCategory]
