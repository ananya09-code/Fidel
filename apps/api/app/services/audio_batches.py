"""Batch generation of vocabulary audio, plus review and regeneration.

Design notes
------------
* Every generation attempt is its own ``audio_recordings`` row, so history is
  preserved instead of overwritten. A superseded attempt keeps its review
  decision and gets ``superseded_at`` set.
* At most one *active* (non-superseded) recording may exist per
  (word, voice, speed). That is enforced by a partial unique index in the
  database, which is what makes concurrent generation safe.
* A failed attempt is stored with ``status='failed'``, a NULL ``storage_key``
  and ``generation_error``, so a row never points at an object that is missing.
* Batch creation is guarded by a partial unique index allowing only one
  ``running`` batch per (language, voice, speed).
"""

from __future__ import annotations

import logging
import tempfile
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Iterable

from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, sessionmaker

from app.services.speech import (
    DEFAULT_VOICE_ID,
    LANGUAGE_CODE,
    SPEED,
    clean_word_text,
    create_addis_client,
    generate_mp3,
    make_speech_text,
    safe_filename,
)
from app.services.storage import audio_exists, delete_audio, upload_audio

logger = logging.getLogger(__name__)

DEFAULT_BATCH_SIZE = 100
MAX_BATCH_SIZE = 500

STATUS_PENDING = "pending"
STATUS_APPROVED = "approved"
STATUS_REJECTED = "rejected"
STATUS_FAILED = "failed"

BATCH_RUNNING = "running"
BATCH_COMPLETED = "completed"
BATCH_FAILED = "failed"


class BatchError(RuntimeError):
    """Raised when a batch cannot be created."""


class BatchAlreadyRunning(BatchError):
    """Raised when a batch for the same configuration is already running."""


class RecordingError(RuntimeError):
    """Raised when a review action is not valid for the recording's state."""


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


# --------------------------------------------------
# SQL
# --------------------------------------------------

ELIGIBLE_WORDS_SQL = text("""
    SELECT
        w.id            AS word_id,
        w.text          AS text,
        w.content_type  AS content_type,
        w.transliteration
    FROM words AS w
    WHERE w.language_code = :language_code
      AND NOT EXISTS (
            SELECT 1
            FROM audio_recordings AS a
            WHERE a.word_id = w.id
              AND a.speaker_id = :speaker_id
              AND a.speed = :speed
              AND a.superseded_at IS NULL
      )
    ORDER BY w.created_at, w.text
    LIMIT :limit
""")

COUNT_ELIGIBLE_WORDS_SQL = text("""
    SELECT COUNT(*)
    FROM words AS w
    WHERE w.language_code = :language_code
      AND NOT EXISTS (
            SELECT 1
            FROM audio_recordings AS a
            WHERE a.word_id = w.id
              AND a.speaker_id = :speaker_id
              AND a.speed = :speed
              AND a.superseded_at IS NULL
      )
""")

INSERT_BATCH_SQL = text("""
    INSERT INTO generation_batches (
        id, language_code, speaker_id, speed, status,
        requested_size, total_selected, generated_count, failed_count,
        started_at
    )
    VALUES (
        :id, :language_code, :speaker_id, :speed, 'running',
        :requested_size, 0, 0, 0, :started_at
    )
    RETURNING id
""")

INSERT_RECORDING_SQL = text("""
    INSERT INTO audio_recordings (
        id, word_id, storage_key, speaker_id, speed, duration_ms,
        status, batch_id, attempt, generation_error
    )
    VALUES (
        :id, :word_id, :storage_key, :speaker_id, :speed, :duration_ms,
        :status, :batch_id, :attempt, :generation_error
    )
""")


def validate_batch_size(batch_size: int | None) -> int:
    """Validate a requested batch size and return it."""
    if batch_size is None:
        return DEFAULT_BATCH_SIZE

    if not isinstance(batch_size, int) or isinstance(batch_size, bool):
        raise ValueError("batch_size must be an integer")

    if batch_size < 1:
        raise ValueError("batch_size must be at least 1")

    if batch_size > MAX_BATCH_SIZE:
        raise ValueError(
            f"batch_size must not exceed {MAX_BATCH_SIZE}"
        )

    return batch_size


# --------------------------------------------------
# Batch lifecycle
# --------------------------------------------------


def create_batch(
    session: Session,
    batch_size: int | None = None,
    language_code: str = LANGUAGE_CODE,
    speaker_id: str = DEFAULT_VOICE_ID,
    speed: str = SPEED,
) -> dict[str, Any]:
    """Create a ``running`` batch row. The worker fills in the results."""
    size = validate_batch_size(batch_size)
    batch_id = uuid.uuid4()

    try:
        session.execute(
            INSERT_BATCH_SQL,
            {
                "id": batch_id,
                "language_code": language_code,
                "speaker_id": speaker_id,
                "speed": speed,
                "requested_size": size,
                "started_at": _utcnow(),
            },
        )
        session.commit()
    except IntegrityError as exc:
        session.rollback()
        raise BatchAlreadyRunning(
            f"A batch for {language_code}/{speaker_id}/{speed} is already "
            "running."
        ) from exc

    return get_batch(session, str(batch_id))  # type: ignore[return-value]


def get_batch(session: Session, batch_id: str) -> dict[str, Any] | None:
    """Return a batch with its live counts, or ``None`` when unknown."""
    row = session.execute(
        text("""
            SELECT
                b.id, b.language_code, b.speaker_id, b.speed, b.status,
                b.requested_size, b.total_selected, b.generated_count,
                b.failed_count, b.error, b.created_at, b.started_at,
                b.completed_at
            FROM generation_batches AS b
            WHERE b.id = :batch_id
        """),
        {"batch_id": batch_id},
    ).mappings().first()

    if row is None:
        return None

    counts = session.execute(
        text("""
            SELECT
                COUNT(*)                                        AS total,
                SUM(CASE WHEN status = 'pending'  THEN 1 ELSE 0 END) AS pending,
                SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) AS approved,
                SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) AS rejected,
                SUM(CASE WHEN status = 'failed'   THEN 1 ELSE 0 END) AS failed
            FROM audio_recordings
            WHERE batch_id = :batch_id
        """),
        {"batch_id": batch_id},
    ).mappings().first()

    result = dict(row)
    result.update(
        total=int((counts["total"] if counts else 0) or 0),
        pending_review=int((counts["pending"] if counts else 0) or 0),
        approved=int((counts["approved"] if counts else 0) or 0),
        rejected=int((counts["rejected"] if counts else 0) or 0),
        failed=int((counts["failed"] if counts else 0) or 0),
    )
    result["remaining_review"] = result["pending_review"]
    result["complete"] = (
        result["status"] != BATCH_RUNNING
        and result["pending_review"] == 0
        and result["failed"] == 0
    )

    return result


def fail_abandoned_batches(
    session: Session,
    older_than_minutes: int = 30,
) -> int:
    """Close batches whose worker died (for example the API was restarted).

    A batch left in ``running`` blocks every later batch for the same
    configuration, so a stale one is marked ``failed`` instead of waiting
    forever. Batches that are still making progress are left alone.
    """
    result = session.execute(
        text("""
            UPDATE generation_batches
            SET status = 'failed',
                error = COALESCE(error, :reason),
                completed_at = :now
            WHERE status = 'running'
              AND COALESCE(started_at, created_at) < :cutoff
        """),
        {
            "reason": (
                "Batch was abandoned before it finished: the API process was "
                "restarted or stopped mid-run."
            ),
            "now": _utcnow(),
            "cutoff": _utcnow() - timedelta(minutes=older_than_minutes),
        },
    )
    session.commit()

    return int(result.rowcount or 0)


def get_running_batch(session: Session) -> dict[str, Any] | None:
    """Return the currently running batch for the default configuration."""
    row = session.execute(
        text("""
            SELECT id
            FROM generation_batches
            WHERE status = 'running'
            ORDER BY created_at DESC
            LIMIT 1
        """)
    ).mappings().first()

    return get_batch(session, str(row["id"])) if row else None


def list_batches(session: Session, limit: int = 20) -> list[dict[str, Any]]:
    """Return the most recent batches, newest first."""
    rows = session.execute(
        text("""
            SELECT id
            FROM generation_batches
            ORDER BY created_at DESC
            LIMIT :limit
        """),
        {"limit": limit},
    ).mappings().all()

    return [get_batch(session, str(row["id"])) for row in rows]  # type: ignore[misc]


def count_eligible_words(
    session: Session,
    language_code: str = LANGUAGE_CODE,
    speaker_id: str = DEFAULT_VOICE_ID,
    speed: str = SPEED,
) -> int:
    """Number of vocabulary entries that still need audio."""
    return int(
        session.execute(
            COUNT_ELIGIBLE_WORDS_SQL,
            {
                "language_code": language_code,
                "speaker_id": speaker_id,
                "speed": speed,
            },
        ).scalar_one()
    )


def _update_batch_progress(
    session: Session,
    batch_id: str,
    *,
    selected: int | None = None,
    generated: int | None = None,
    failed: int | None = None,
    status: str | None = None,
    error: str | None = None,
) -> None:
    session.execute(
        text("""
            UPDATE generation_batches
            SET total_selected  = COALESCE(:selected, total_selected),
                generated_count = COALESCE(:generated, generated_count),
                failed_count    = COALESCE(:failed, failed_count),
                status          = COALESCE(:status, status),
                error           = :error,
                completed_at    = CASE
                                    WHEN :status IN ('completed', 'failed')
                                    THEN COALESCE(completed_at, :now)
                                    ELSE completed_at
                                  END
            WHERE id = :batch_id
        """),
        {
            "batch_id": batch_id,
            "selected": selected,
            "generated": generated,
            "failed": failed,
            "status": status,
            "error": error,
            "now": _utcnow(),
        },
    )
    session.commit()


# --------------------------------------------------
# Generation
# --------------------------------------------------


def select_batch_words(
    session: Session,
    batch_id: str,
    limit: int,
    language_code: str = LANGUAGE_CODE,
    speaker_id: str = DEFAULT_VOICE_ID,
    speed: str = SPEED,
) -> list[dict[str, Any]]:
    """Select the words this batch will attempt, skipping already-active ones."""
    rows = session.execute(
        ELIGIBLE_WORDS_SQL,
        {
            "language_code": language_code,
            "speaker_id": speaker_id,
            "speed": speed,
            "limit": limit,
        },
    ).mappings().all()

    return [dict(row) for row in rows]


def _next_attempt(session: Session, word_id: str, speaker_id: str, speed: str) -> int:
    current = session.execute(
        text("""
            SELECT COALESCE(MAX(attempt), 0) AS attempt
            FROM audio_recordings
            WHERE word_id = :word_id
              AND speaker_id = :speaker_id
              AND speed = :speed
        """),
        {"word_id": word_id, "speaker_id": speaker_id, "speed": speed},
    ).scalar_one()

    return int(current) + 1


def generate_one(
    session: Session,
    word: dict[str, Any],
    *,
    batch_id: str | None,
    speaker_id: str = DEFAULT_VOICE_ID,
    speed: str = SPEED,
    addis: Any | None = None,
    supersede_recording_id: str | None = None,
) -> dict[str, Any]:
    """Generate, upload and record audio for one vocabulary entry.

    Returns the created ``audio_recordings`` row. On failure a row with
    ``status='failed'`` is created (no storage key) so the error is visible
    and retryable, and any partially uploaded object is removed.

    When ``supersede_recording_id`` is given, that recording is deactivated
    first because only one *active* recording may exist per (word, voice,
    speed). If generation then fails, the previous recording is restored
    exactly as it was and the failed attempt is kept as history.
    """
    from app.services.speech import build_storage_key

    word_id = str(word["word_id"])
    attempt = _next_attempt(session, word_id, speaker_id, speed)
    storage_key = build_storage_key(word_id, speaker_id, speed, attempt)
    client = addis if addis is not None else create_addis_client()

    if supersede_recording_id is not None:
        _set_superseded(session, supersede_recording_id, _utcnow())

    try:
        speech_text = make_speech_text(
            clean_word_text(word["text"]),
            word.get("content_type") or "word",
        )

        with tempfile.TemporaryDirectory() as temp_dir:
            output_path = Path(temp_dir) / f"{safe_filename(word['text'])}.mp3"

            duration_ms = generate_mp3(
                client,
                speech_text,
                output_path,
                speaker_id,
            )

            if not output_path.is_file() or output_path.stat().st_size == 0:
                raise RuntimeError("Addis AI produced an empty MP3.")

            # Upload first: a database row must never point at a missing
            # object, and an upload failure means no row is written at all.
            upload_audio(str(output_path), storage_key)

    except Exception as exc:  # noqa: BLE001 - failures are recorded, not raised
        logger.warning("Generation failed for word %s: %s", word_id, exc)
        failure_id = _record_failure(
            session,
            word_id=word_id,
            speaker_id=speaker_id,
            speed=speed,
            batch_id=batch_id,
            attempt=attempt,
            storage_key=storage_key,
            error=str(exc)[:2000],
        )

        if supersede_recording_id is not None:
            # Keep the failed attempt as history instead of the active row,
            # and put the previous recording back exactly as it was.
            if failure_id is not None:
                _set_superseded(session, failure_id, _utcnow())
            _set_superseded(session, supersede_recording_id, None)

        return {
            "status": STATUS_FAILED,
            "word_id": word_id,
            "error": str(exc),
        }

    recording_id = uuid.uuid4()

    try:
        session.execute(
            INSERT_RECORDING_SQL,
            {
                "id": recording_id,
                "word_id": word_id,
                "storage_key": storage_key,
                "speaker_id": speaker_id,
                "speed": speed,
                "duration_ms": duration_ms,
                "status": STATUS_PENDING,
                "batch_id": batch_id,
                "attempt": attempt,
                "generation_error": None,
            },
        )
        session.commit()
    except Exception:
        # The object exists but the row does not: remove the object so the
        # bucket never keeps an untracked upload.
        session.rollback()
        try:
            delete_audio(storage_key)
        except Exception as cleanup_exc:  # noqa: BLE001
            logger.error(
                "Uploaded object %s has no database row and could not be "
                "removed: %s",
                storage_key,
                cleanup_exc,
            )

        if supersede_recording_id is not None:
            _set_superseded(session, supersede_recording_id, None)

        raise

    return {
        "status": STATUS_PENDING,
        "word_id": word_id,
        "recording_id": str(recording_id),
        "storage_key": storage_key,
        "duration_ms": duration_ms,
    }


def _set_superseded(
    session: Session,
    recording_id: str,
    when: datetime | None,
) -> None:
    """Deactivate (``when`` set) or reactivate (``when`` ``None``) a row."""
    session.execute(
        text("""
            UPDATE audio_recordings
            SET superseded_at = :when
            WHERE id = :recording_id
        """),
        {"when": when, "recording_id": recording_id},
    )
    session.commit()


def _record_failure(
    session: Session,
    *,
    word_id: str,
    speaker_id: str,
    speed: str,
    batch_id: str | None,
    attempt: int,
    storage_key: str | None,
    error: str,
) -> str | None:
    """Store a failed attempt without a storage key.

    Returns the new row id, or ``None`` when the row could not be stored.
    """
    recording_id = uuid.uuid4()

    try:
        session.execute(
            INSERT_RECORDING_SQL,
            {
                "id": recording_id,
                "word_id": word_id,
                # No key: the object does not exist (or was removed).
                "storage_key": None,
                "speaker_id": speaker_id,
                "speed": speed,
                "duration_ms": None,
                "status": STATUS_FAILED,
                "batch_id": batch_id,
                "attempt": attempt,
                "generation_error": error,
            },
        )
        session.commit()
        return str(recording_id)
    except IntegrityError:
        # Another worker already produced an active recording for this word.
        session.rollback()
        logger.info(
            "Skipping failed-attempt row for %s: an active recording exists.",
            word_id,
        )
    except Exception:  # noqa: BLE001
        session.rollback()
        logger.exception("Could not record failure for word %s", word_id)

    return None


def run_batch(
    session_factory: sessionmaker,
    batch_id: str,
    *,
    addis: Any | None = None,
    language_code: str = LANGUAGE_CODE,
    speaker_id: str = DEFAULT_VOICE_ID,
    speed: str = SPEED,
) -> None:
    """Execute a batch: generate, upload and record every selected word.

    Intended to run as a FastAPI background task. It never chains into the
    next batch; the dashboard starts those explicitly.
    """
    client = addis
    generated = 0
    failed = 0

    with session_factory() as session:
        batch = get_batch(session, batch_id)

        if batch is None:
            logger.error("Batch %s does not exist.", batch_id)
            return

        size = int(batch["requested_size"])
        words = select_batch_words(
            session,
            batch_id,
            size,
            language_code=language_code,
            speaker_id=speaker_id,
            speed=speed,
        )
        _update_batch_progress(session, batch_id, selected=len(words))

    try:
        if client is None:
            client = create_addis_client()

        for word in words:
            with session_factory() as session:
                result = generate_one(
                    session,
                    word,
                    batch_id=batch_id,
                    speaker_id=speaker_id,
                    speed=speed,
                    addis=client,
                )

            if result["status"] == STATUS_PENDING:
                generated += 1
            else:
                failed += 1

            # Checkpoint progress so the dashboard stays responsive.
            with session_factory() as session:
                _update_batch_progress(
                    session, batch_id, generated=generated, failed=failed
                )

    except Exception as exc:  # noqa: BLE001
        logger.exception("Batch %s aborted.", batch_id)
        with session_factory() as session:
            _update_batch_progress(
                session,
                batch_id,
                generated=generated,
                failed=failed,
                status=BATCH_FAILED,
                error=str(exc)[:2000],
            )
        return

    with session_factory() as session:
        _update_batch_progress(
            session,
            batch_id,
            generated=generated,
            failed=failed,
            status=BATCH_COMPLETED,
            error=None,
        )


# --------------------------------------------------
# Review actions
# --------------------------------------------------


def get_recording(session: Session, recording_id: str) -> dict[str, Any] | None:
    """Return a single recording, or ``None`` when it does not exist."""
    row = session.execute(
        text("SELECT * FROM audio_recordings WHERE id = :recording_id"),
        {"recording_id": recording_id},
    ).mappings().first()

    return dict(row) if row else None


def approve_recording(
    session: Session,
    recording_id: str,
    reviewed_by: str | None = None,
) -> dict[str, Any]:
    """Approve a pending recording."""
    recording = get_recording(session, recording_id)

    if recording is None:
        raise RecordingError("Recording not found.")

    if recording["status"] == STATUS_APPROVED:
        raise RecordingError("Recording is already approved.")

    if recording["status"] not in (STATUS_PENDING, STATUS_REJECTED):
        raise RecordingError(
            f"Only pending recordings can be approved (this one is "
            f"{recording['status']})."
        )

    if not recording.get("storage_key"):
        raise RecordingError("Recording has no audio to approve.")

    session.execute(
        text("""
            UPDATE audio_recordings
            SET status = 'approved',
                reviewed_at = :reviewed_at,
                reviewed_by = :reviewed_by,
                rejection_reason = NULL
            WHERE id = :recording_id
        """),
        {
            "recording_id": recording_id,
            "reviewed_at": _utcnow(),
            "reviewed_by": reviewed_by,
        },
    )
    session.commit()

    return get_recording(session, recording_id)  # type: ignore[return-value]


def reject_recording(
    session: Session,
    recording_id: str,
    reason: str | None = None,
    reviewed_by: str | None = None,
) -> dict[str, Any]:
    """Reject a recording, optionally recording why."""
    recording = get_recording(session, recording_id)

    if recording is None:
        raise RecordingError("Recording not found.")

    if recording["status"] == STATUS_REJECTED:
        raise RecordingError("Recording is already rejected.")

    if recording["status"] not in (STATUS_PENDING, STATUS_APPROVED):
        raise RecordingError(
            f"Only pending or approved recordings can be rejected (this one "
            f"is {recording['status']})."
        )

    session.execute(
        text("""
            UPDATE audio_recordings
            SET status = 'rejected',
                reviewed_at = :reviewed_at,
                reviewed_by = :reviewed_by,
                rejection_reason = :reason
            WHERE id = :recording_id
        """),
        {
            "recording_id": recording_id,
            "reviewed_at": _utcnow(),
            "reviewed_by": reviewed_by,
            "reason": (reason or None),
        },
    )
    session.commit()

    return get_recording(session, recording_id)  # type: ignore[return-value]


def regenerate_recording(
    session: Session,
    recording_id: str,
    *,
    batch_id: str | None = None,
    speaker_id: str | None = None,
    speed: str | None = None,
    addis: Any | None = None,
) -> dict[str, Any]:
    """Generate a replacement for an existing recording.

    The previous recording is only superseded once the replacement has been
    generated, uploaded and stored successfully, so a failure leaves the
    original untouched. The replacement always starts at ``pending``.
    """
    recording = get_recording(session, recording_id)

    if recording is None:
        raise RecordingError("Recording not found.")

    if recording["status"] == STATUS_FAILED:
        raise RecordingError(
            "This attempt failed generation and has no audio to replace. "
            "Use the retry endpoint instead."
        )

    word = session.execute(
        text("SELECT id, text, content_type FROM words WHERE id = :word_id"),
        {"word_id": recording["word_id"]},
    ).mappings().first()

    if word is None:
        raise RecordingError("Vocabulary entry no longer exists.")

    word_payload = {
        "word_id": str(word["id"]),
        "text": word["text"],
        "content_type": word["content_type"],
    }

    effective_speaker = speaker_id or recording["speaker_id"] or DEFAULT_VOICE_ID
    effective_speed = speed or recording["speed"] or SPEED

    # If an active recording already exists for this word/config it must be
    # this one; otherwise another attempt is already live.
    active = session.execute(
        text("""
            SELECT id FROM audio_recordings
            WHERE word_id = :word_id
              AND speaker_id = :speaker_id
              AND speed = :speed
              AND superseded_at IS NULL
        """),
        {
            "word_id": recording["word_id"],
            "speaker_id": effective_speaker,
            "speed": effective_speed,
        },
    ).mappings().first()

    if active is not None and str(active["id"]) != str(recording_id):
        raise RecordingError(
            "Another active recording already exists for this word."
        )

    result = generate_one(
        session,
        word_payload,
        batch_id=batch_id or recording.get("batch_id"),
        speaker_id=effective_speaker,
        speed=effective_speed,
        addis=addis,
        supersede_recording_id=recording_id,
    )

    if result["status"] == STATUS_FAILED:
        raise RecordingError(result.get("error") or "Regeneration failed.")

    return get_recording(session, result["recording_id"])  # type: ignore[return-value]


def delete_replacement(session: Session, recording_id: str) -> None:
    """Remove a replacement row and its object after a failed swap."""
    recording = get_recording(session, recording_id)

    if recording is None:
        return

    session.execute(
        text("DELETE FROM audio_recordings WHERE id = :recording_id"),
        {"recording_id": recording_id},
    )
    session.commit()

    if recording.get("storage_key"):
        try:
            delete_audio(recording["storage_key"])
        except Exception:  # noqa: BLE001
            logger.error(
                "Replacement object %s could not be removed.",
                recording["storage_key"],
            )


def retry_failed_recordings(
    session: Session,
    recording_ids: Iterable[str],
    *,
    speaker_id: str = DEFAULT_VOICE_ID,
    speed: str = SPEED,
    addis: Any | None = None,
) -> list[dict[str, Any]]:
    """Retry failed attempts without regenerating successful ones."""
    results: list[dict[str, Any]] = []

    for recording_id in recording_ids:
        recording = get_recording(session, recording_id)

        if recording is None:
            results.append({"recording_id": recording_id, "status": "not_found"})
            continue

        if recording["status"] != STATUS_FAILED:
            results.append(
                {
                    "recording_id": recording_id,
                    "status": "skipped",
                    "reason": f"Recording is {recording['status']}, not failed.",
                }
            )
            continue

        word = session.execute(
            text("SELECT id, text, content_type FROM words WHERE id = :word_id"),
            {"word_id": recording["word_id"]},
        ).mappings().first()

        if word is None:
            results.append(
                {"recording_id": recording_id, "status": "not_found"}
            )
            continue

        # The failed row occupies the active slot for this word/config, so it
        # is superseded first and only then regenerated.
        session.execute(
            text("""
                UPDATE audio_recordings
                SET superseded_at = :superseded_at
                WHERE id = :recording_id
            """),
            {"superseded_at": _utcnow(), "recording_id": recording_id},
        )
        session.commit()

        results.append(
            generate_one(
                session,
                {
                    "word_id": str(word["id"]),
                    "text": word["text"],
                    "content_type": word["content_type"],
                },
                batch_id=recording.get("batch_id"),
                speaker_id=recording.get("speaker_id") or speaker_id,
                speed=recording.get("speed") or speed,
                addis=addis,
            )
        )

    return results


def verify_object(storage_key: str | None) -> bool:
    """Return whether the object behind a storage key exists."""
    if not storage_key:
        return False

    return audio_exists(storage_key)