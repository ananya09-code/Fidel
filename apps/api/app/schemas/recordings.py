"""Schemas for the audio-review API."""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class RecordingTranslation(BaseModel):
    """One translation of a vocabulary entry."""

    language_code: str
    meaning: str
    context_note: str | None = None


class RecordingItem(BaseModel):
    """A recording as shown in the review dashboard."""

    id: str
    word_id: str
    text: str
    transliteration: str | None = None
    content_type: str | None = None
    language_code: str
    translations: list[RecordingTranslation] = Field(default_factory=list)
    storage_key: str | None = None
    speaker_id: str | None = None
    speed: str
    duration_ms: int | None = None
    status: str
    batch_id: str | None = None
    attempt: int = 1
    generation_error: str | None = None
    reviewed_at: str | None = None
    reviewed_by: str | None = None
    rejection_reason: str | None = None
    superseded_at: str | None = None
    created_at: str | None = None
    has_audio: bool = False


class RecordingPage(BaseModel):
    """Paginated recording list."""

    items: list[RecordingItem]
    page: int
    page_size: int
    total: int
    total_pages: int


class AudioUrl(BaseModel):
    """Short-lived playback URL."""

    url: str
    expires_in: int
    storage_key: str


class BatchState(BaseModel):
    """Generation batch state, including live review counts."""

    id: str
    language_code: str
    speaker_id: str
    speed: str
    status: str
    requested_size: int
    total_selected: int
    generated_count: int
    failed_count: int
    total: int = 0
    pending_review: int = 0
    approved: int = 0
    rejected: int = 0
    failed: int = 0
    remaining_review: int = 0
    complete: bool = False
    error: str | None = None
    created_at: str | None = None
    started_at: str | None = None
    completed_at: str | None = None


class BatchListResponse(BaseModel):
    """Recent batches plus the running one, if any."""

    running: BatchState | None = None
    batches: list[BatchState] = Field(default_factory=list)


class StartBatchRequest(BaseModel):
    """Body for starting a batch."""

    batch_size: int | None = Field(
        default=None,
        ge=1,
        description="Words per batch; defaults to 100.",
    )


class RejectRequest(BaseModel):
    """Body for rejecting a recording."""

    reason: str | None = Field(
        default=None,
        max_length=2000,
        description="Why the recording was rejected.",
    )


class RetryRequest(BaseModel):
    """Body for retrying failed generation attempts."""

    recording_ids: list[str] = Field(default_factory=list)


class RecordingActionResponse(BaseModel):
    """Result of a review action."""

    recording: RecordingItem
    message: str | None = None


class RetryResponse(BaseModel):
    """Result of retrying failed attempts."""

    results: list[dict[str, Any]]
    retried: int
    recovered: int
    failed: int


class ReviewSummary(BaseModel):
    """Overview cards for the dashboard."""

    total_recordings: int
    pending: int
    approved: int
    rejected: int
    failed: int
    superseded: int
    total_vocabulary: int
    remaining_eligible: int
    running_batch: BatchState | None = None
    has_audio: int = 0