"""Administrative endpoints for the audio-review dashboard."""

from __future__ import annotations

import math
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, status
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.admin_auth import require_admin
from app.core.config import get_settings
from app.db.database import SessionLocal
from app.schemas.recordings import (
    AudioUrl,
    BatchListResponse,
    BatchState,
    RecordingActionResponse,
    RecordingItem,
    RecordingPage,
    RecordingTranslation,
    RejectRequest,
    RetryRequest,
    RetryResponse,
    ReviewSummary,
    StartBatchRequest,
)
from app.services.audio_batches import (
    DEFAULT_BATCH_SIZE,
    BATCH_RUNNING,
    BatchAlreadyRunning,
    BatchError,
    RecordingError,
    approve_recording,
    count_eligible_words,
    create_batch,
    fail_abandoned_batches,
    get_batch,
    get_running_batch,
    list_batches,
    regenerate_recording,
    reject_recording,
    retry_failed_recordings,
    run_batch,
    validate_batch_size,
)
from app.services.speech import LANGUAGE_CODE, SPEED
from app.services.storage import audio_exists, generate_audio_url

router = APIRouter()


def get_db():
    """Yield a database session for request handlers."""
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


# --------------------------------------------------
# Serialization
# --------------------------------------------------


def _iso(value: Any) -> str | None:
    """Return an ISO timestamp, tolerating drivers that return strings."""
    if value is None:
        return None

    if hasattr(value, "isoformat"):
        return value.isoformat()

    return str(value)


def _serialize_recording(row: dict[str, Any]) -> RecordingItem:
    translations = [
        RecordingTranslation(
            language_code=t["language_code"],
            meaning=t["meaning"],
            context_note=t.get("context_note"),
        )
        for t in row.get("translations") or []
    ]

    return RecordingItem(
        id=str(row["id"]),
        word_id=str(row["word_id"]),
        text=row["text"],
        transliteration=row.get("transliteration"),
        content_type=row.get("content_type"),
        language_code=row["language_code"],
        translations=translations,
        storage_key=row.get("storage_key"),
        speaker_id=row.get("speaker_id"),
        speed=row.get("speed") or SPEED,
        duration_ms=row.get("duration_ms"),
        status=row["status"],
        batch_id=str(row["batch_id"]) if row.get("batch_id") else None,
        attempt=int(row.get("attempt") or 1),
        generation_error=row.get("generation_error"),
        reviewed_at=_iso(row.get("reviewed_at")),
        reviewed_by=row.get("reviewed_by"),
        rejection_reason=row.get("rejection_reason"),
        superseded_at=_iso(row.get("superseded_at")),
        created_at=_iso(row.get("created_at")),
        has_audio=bool(row.get("storage_key")),
    )


def _serialize_batch(batch: dict[str, Any] | None) -> BatchState | None:
    if batch is None:
        return None

    data = dict(batch)
    for field in ("created_at", "started_at", "completed_at"):
        data[field] = _iso(data.get(field))

    data["id"] = str(data["id"])

    return BatchState(**data)


def _load_recording_row(db: Session, recording_id: str) -> dict[str, Any] | None:
    """Fetch a recording joined with its vocabulary entry."""
    row = db.execute(
        text("""
            SELECT
                a.*,
                w.text, w.transliteration, w.content_type,
                w.language_code
            FROM audio_recordings AS a
            JOIN words AS w ON w.id = a.word_id
            WHERE a.id = :recording_id
        """),
        {"recording_id": recording_id},
    ).mappings().first()

    return dict(row) if row is not None else None


def _attach_translations(db: Session, items: list[dict[str, Any]]) -> None:
    if not items:
        return

    word_ids = [row["word_id"] for row in items]
    placeholders = ", ".join(f":w{i}" for i in range(len(word_ids)))
    params = {f"w{i}": wid for i, wid in enumerate(word_ids)}

    rows = db.execute(
        text(f"""
            SELECT word_id, language_code, meaning, context_note
            FROM word_translations
            WHERE word_id IN ({placeholders})
            ORDER BY language_code, meaning
        """),
        params,
    ).mappings().all()

    by_word: dict[Any, list[dict[str, Any]]] = {}
    for row in rows:
        by_word.setdefault(str(row["word_id"]), []).append(dict(row))

    for row in items:
        row["translations"] = by_word.get(str(row["word_id"]), [])


# --------------------------------------------------
# Overview
# --------------------------------------------------


@router.get("/summary", response_model=ReviewSummary)
def get_summary(
    db: Session = Depends(get_db),
    reviewer: str = Depends(require_admin),
) -> ReviewSummary:
    """Return the dashboard overview cards."""
    del reviewer  # dependency exists to protect the endpoint

    # Recover before reporting: a batch left running by a dead worker would
    # otherwise make the dashboard claim "batch running" forever.
    fail_abandoned_batches(db)

    counts = db.execute(
        text("""
            SELECT
                COUNT(*)                                          AS total,
                SUM(CASE WHEN status = 'pending'  THEN 1 ELSE 0 END) AS pending,
                SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) AS approved,
                SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) AS rejected,
                SUM(CASE WHEN status = 'failed'   THEN 1 ELSE 0 END) AS failed,
                SUM(CASE WHEN superseded_at IS NOT NULL THEN 1 ELSE 0 END)
                                                               AS superseded,
                SUM(CASE WHEN storage_key IS NOT NULL THEN 1 ELSE 0 END)
                                                               AS has_audio
            FROM audio_recordings
        """)
    ).mappings().one()

    vocabulary = int(
        db.execute(
            text("SELECT COUNT(*) FROM words WHERE language_code = :language_code"),
            {"language_code": LANGUAGE_CODE},
        ).scalar_one()
    )

    return ReviewSummary(
        total_recordings=int(counts["total"] or 0),
        pending=int(counts["pending"] or 0),
        approved=int(counts["approved"] or 0),
        rejected=int(counts["rejected"] or 0),
        failed=int(counts["failed"] or 0),
        superseded=int(counts["superseded"] or 0),
        has_audio=int(counts["has_audio"] or 0),
        total_vocabulary=vocabulary,
        remaining_eligible=count_eligible_words(db),
        running_batch=_serialize_batch(get_running_batch(db)),
    )


# --------------------------------------------------
# Recordings
# --------------------------------------------------


@router.get("/recordings", response_model=RecordingPage)
def list_recordings(
    status_filter: str | None = Query(
        default=None,
        alias="status",
        description="pending, approved, rejected or failed.",
    ),
    language_code: str | None = Query(default=None),
    batch_id: str | None = Query(default=None),
    speaker_id: str | None = Query(default=None),
    has_error: bool | None = Query(
        default=None, description="Only rows with a generation error."
    ),
    include_superseded: bool = Query(default=False),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    reviewer: str = Depends(require_admin),
) -> RecordingPage:
    """List recordings with filters and pagination."""
    del reviewer

    where: list[str] = []
    params: dict[str, Any] = {"limit": page_size, "offset": (page - 1) * page_size}

    if status_filter:
        if status_filter not in ("pending", "approved", "rejected", "failed"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="status must be pending, approved, rejected or failed.",
            )
        where.append("a.status = :status_filter")
        params["status_filter"] = status_filter

    if language_code:
        where.append("w.language_code = :language_code")
        params["language_code"] = language_code

    if batch_id:
        where.append("a.batch_id = :batch_id")
        params["batch_id"] = batch_id

    if speaker_id:
        where.append("a.speaker_id = :speaker_id")
        params["speaker_id"] = speaker_id

    if has_error is not None:
        where.append(
            "a.generation_error IS NOT NULL"
            if has_error
            else "a.generation_error IS NULL"
        )

    if not include_superseded:
        where.append("a.superseded_at IS NULL")

    clause = f"WHERE {' AND '.join(where)}" if where else ""

    total = int(
        db.execute(
            text(f"""
                SELECT COUNT(*)
                FROM audio_recordings AS a
                JOIN words AS w ON w.id = a.word_id
                {clause}
            """),
            params,
        ).scalar_one()
    )

    rows = [
        dict(row)
        for row in db.execute(
            text(f"""
                SELECT
                    a.*,
                    w.text, w.transliteration, w.content_type,
                    w.language_code
                FROM audio_recordings AS a
                JOIN words AS w ON w.id = a.word_id
                {clause}
                ORDER BY a.created_at DESC, a.id
                LIMIT :limit OFFSET :offset
            """),
            params,
        ).mappings().all()
    ]

    _attach_translations(db, rows)

    return RecordingPage(
        items=[_serialize_recording(row) for row in rows],
        page=page,
        page_size=page_size,
        total=total,
        total_pages=max(1, math.ceil(total / page_size)),
    )


@router.get("/recordings/{recording_id}", response_model=RecordingItem)
def get_recording_detail(
    recording_id: str,
    db: Session = Depends(get_db),
    reviewer: str = Depends(require_admin),
) -> RecordingItem:
    """Return a single recording."""
    del reviewer

    row = _load_recording_row(db, recording_id)

    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recording not found.",
        )

    _attach_translations(db, [row])

    return _serialize_recording(row)


@router.get("/recordings/{recording_id}/audio", response_model=AudioUrl)
def get_recording_audio(
    recording_id: str,
    db: Session = Depends(get_db),
    reviewer: str = Depends(require_admin),
) -> AudioUrl:
    """Return a short-lived presigned URL for playback."""
    del reviewer

    row = db.execute(
        text("""
            SELECT storage_key, status
            FROM audio_recordings
            WHERE id = :recording_id
        """),
        {"recording_id": recording_id},
    ).mappings().first()

    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recording not found.",
        )

    storage_key = row["storage_key"]

    if not storage_key:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "This recording has no audio"
                + (
                    f": generation failed ({row['status']})."
                    if row["status"] == "failed"
                    else " yet."
                )
            ),
        )

    # Reject 409 when the object is gone, so the UI can show a clear error
    # instead of an expired/failing audio element.
    if not audio_exists(storage_key):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="The stored audio object is missing from object storage.",
        )

    settings = get_settings()

    try:
        url = generate_audio_url(
            storage_key, expires_in=settings.audio_url_expires_in
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not create a playback URL: {exc}",
        ) from exc

    return AudioUrl(
        url=url,
        expires_in=settings.audio_url_expires_in,
        storage_key=storage_key,
    )


@router.post(
    "/recordings/{recording_id}/approve",
    response_model=RecordingActionResponse,
)
def approve(
    recording_id: str,
    db: Session = Depends(get_db),
    reviewer: str = Depends(require_admin),
) -> RecordingActionResponse:
    """Approve a pending recording."""
    try:
        approve_recording(db, recording_id, reviewed_by=reviewer)
    except RecordingError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail=str(exc)
        ) from exc

    row = _load_recording_row(db, recording_id)
    _attach_translations(db, [row])

    return RecordingActionResponse(
        recording=_serialize_recording(row),
        message="Recording approved.",
    )


@router.post(
    "/recordings/{recording_id}/reject",
    response_model=RecordingActionResponse,
)
def reject(
    recording_id: str,
    payload: RejectRequest | None = None,
    db: Session = Depends(get_db),
    reviewer: str = Depends(require_admin),
) -> RecordingActionResponse:
    """Reject a recording with an optional reason."""
    reason = payload.reason if payload else None

    try:
        reject_recording(db, recording_id, reason=reason, reviewed_by=reviewer)
    except RecordingError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail=str(exc)
        ) from exc

    row = _load_recording_row(db, recording_id)
    _attach_translations(db, [row])

    return RecordingActionResponse(
        recording=_serialize_recording(row),
        message="Recording rejected.",
    )


@router.post(
    "/recordings/{recording_id}/regenerate",
    response_model=RecordingActionResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
def regenerate(
    recording_id: str,
    tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    reviewer: str = Depends(require_admin),
) -> RecordingActionResponse:
    """Regenerate audio for a recording.

    Generation can take several seconds, so it is queued as a background task.
    The current recording stays active (and playable) until the replacement is
    generated, uploaded and stored successfully.
    """
    del reviewer

    recording = db.execute(
        text("SELECT id, speaker_id, speed, batch_id, status "
             "FROM audio_recordings WHERE id = :recording_id"),
        {"recording_id": recording_id},
    ).mappings().first()

    if recording is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recording not found.",
        )

    if recording["status"] == "running":  # pragma: no cover - defensive
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This recording is already being regenerated.",
        )

    def _run() -> None:
        with SessionLocal() as session:
            try:
                regenerate_recording(session, recording_id)
            except RecordingError:
                pass  # The dashboard surfaces the unchanged status + error.

    tasks.add_task(_run)

    return RecordingActionResponse(
        recording=_serialize_recording(
            _load_recording_row(db, recording_id)
        ),
        message="Regeneration started.",
    )


@router.post("/recordings/retry", response_model=RetryResponse)
def retry_failed(
    payload: RetryRequest,
    tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    reviewer: str = Depends(require_admin),
) -> RetryResponse:
    """Retry failed generation attempts without touching successful ones."""
    del reviewer, db

    recording_ids = payload.recording_ids

    def _run() -> None:
        with SessionLocal() as session:
            retry_failed_recordings(session, recording_ids)

    if recording_ids:
        tasks.add_task(_run)

    return RetryResponse(
        results=[],
        retried=len(recording_ids),
        recovered=0,
        failed=0,
    )


# --------------------------------------------------
# Batches
# --------------------------------------------------


@router.post("/batches", response_model=BatchState, status_code=status.HTTP_202_ACCEPTED)
def start_batch(
    tasks: BackgroundTasks,
    payload: StartBatchRequest | None = None,
    db: Session = Depends(get_db),
    reviewer: str = Depends(require_admin),
) -> BatchState:
    """Start the next generation batch in the background."""
    del reviewer

    requested = payload.batch_size if payload else None

    try:
        batch_size = validate_batch_size(requested)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)
        ) from exc

    # Recover first: a batch left running by a crashed worker would otherwise
    # block this request forever.
    fail_abandoned_batches(db)

    remaining = count_eligible_words(db)

    if remaining == 0:
        # Check *before* creating the row: a 'running' batch blocks every
        # later batch for this configuration.
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "No eligible vocabulary remains for this language, voice "
                "and speed."
            ),
        )

    try:
        batch = create_batch(db, batch_size=batch_size)
    except BatchAlreadyRunning as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail=str(exc)
        ) from exc
    except BatchError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)
        ) from exc

    batch_id = str(batch["id"])

    def _run() -> None:
        run_batch(SessionLocal, batch_id)

    tasks.add_task(_run)

    return _serialize_batch(batch)


@router.get("/batches", response_model=BatchListResponse)
def get_batches(
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    reviewer: str = Depends(require_admin),
) -> BatchListResponse:
    """List recent batches and the running one."""
    del reviewer

    batches = [b for b in list_batches(db, limit=limit) if b is not None]

    return BatchListResponse(
        running=_serialize_batch(get_running_batch(db)),
        batches=[_serialize_batch(b) for b in batches],  # type: ignore[misc]
    )


@router.post("/batches/{batch_id}/cancel", response_model=BatchState)
def cancel_batch(
    batch_id: str,
    db: Session = Depends(get_db),
    reviewer: str = Depends(require_admin),
) -> BatchState:
    """Cancel a batch that is stuck or no longer wanted.

    Marking it ``failed`` releases the one-running-batch-per-configuration
    rule so a new batch can start. Recordings already generated by the batch
    are kept.
    """
    del reviewer

    batch = get_batch(db, batch_id)

    if batch is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Batch not found."
        )

    if batch["status"] != BATCH_RUNNING:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Batch is {batch['status']} and cannot be cancelled.",
        )

    db.execute(
        text("""
            UPDATE generation_batches
            SET status = 'failed',
                error = COALESCE(:reason, error),
                completed_at = :now
            WHERE id = :batch_id
        """),
        {
            "batch_id": batch_id,
            "reason": "Cancelled from the review dashboard.",
            "now": datetime.now(timezone.utc),
        },
    )
    db.commit()

    return _serialize_batch(get_batch(db, batch_id))  # type: ignore[arg-type,return-value]


@router.get("/batches/{batch_id}", response_model=BatchState)
def get_batch_status(
    batch_id: str,
    db: Session = Depends(get_db),
    reviewer: str = Depends(require_admin),
) -> BatchState:
    """Return the state and progress of one batch."""
    del reviewer

    batch = get_batch(db, batch_id)

    if batch is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Batch not found."
        )

    return _serialize_batch(batch)


__all__ = ["router", "DEFAULT_BATCH_SIZE"]