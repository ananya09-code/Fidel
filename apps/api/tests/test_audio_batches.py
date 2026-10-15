"""Tests for batch selection, generation, failure handling and persistence."""

from __future__ import annotations

import uuid

import pytest
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError

from app.services import audio_batches as batches
from tests.conftest import make_word_record


def _eligible(session, limit=10):
    return batches.select_batch_words(session, "batch", limit)


# --------------------------------------------------
# Selection
# --------------------------------------------------


def test_selects_eligible_words_without_recordings(db_session, seed_words):
    words = _eligible(db_session, limit=100)

    assert len(words) == len(seed_words)


def test_selection_excludes_words_with_an_active_recording(
    db_session, seed_words
):
    make_word_record(db_session, seed_words[0]["id"])

    remaining = _eligible(db_session, limit=100)

    assert str(seed_words[0]["id"]) not in {w["word_id"] for w in remaining}
    assert len(remaining) == len(seed_words) - 1


def test_selection_ignores_superseded_recordings(db_session, seed_words):
    """A replaced recording must not block regeneration eligibility."""
    recording_id = make_word_record(db_session, seed_words[0]["id"])
    db_session.execute(
        text("UPDATE audio_recordings SET superseded_at = :now WHERE id = :id"),
        {"now": "2026-01-02 00:00:00+00", "id": recording_id},
    )
    db_session.commit()

    assert str(seed_words[0]["id"]) in {w["word_id"] for w in _eligible(db_session, 100)}


def test_selection_respects_batch_limit(db_session, seed_words):
    assert len(_eligible(db_session, limit=3)) == 3


def test_selection_is_ordered_and_stable(db_session, seed_words):
    first = [w["word_id"] for w in _eligible(db_session, 5)]
    second = [w["word_id"] for w in _eligible(db_session, 5)]

    assert first == second


def test_count_eligible_matches_selection(db_session, seed_words):
    make_word_record(db_session, seed_words[0]["id"])

    count = batches.count_eligible_words(db_session)
    rows = _eligible(db_session, 100)

    assert count == len(rows) == len(seed_words) - 1


# --------------------------------------------------
# Batch size validation
# --------------------------------------------------


def test_batch_size_defaults_to_100():
    assert batches.validate_batch_size(None) == 100


@pytest.mark.parametrize("size", [1, 50, 100, 500])
def test_batch_size_accepts_valid_values(size):
    assert batches.validate_batch_size(size) == size


@pytest.mark.parametrize("size", [0, -1, 501, 10_000])
def test_batch_size_rejects_out_of_range(size):
    with pytest.raises(ValueError):
        batches.validate_batch_size(size)


def test_batch_size_rejects_non_integers():
    with pytest.raises(ValueError):
        batches.validate_batch_size("100")


# --------------------------------------------------
# Duplicate prevention
# --------------------------------------------------


def test_only_one_batch_may_run_per_configuration(db_session):
    batches.create_batch(db_session, batch_size=5)

    with pytest.raises(batches.BatchAlreadyRunning):
        batches.create_batch(db_session, batch_size=5)


def test_second_batch_allowed_after_first_completes(db_session):
    batch = batches.create_batch(db_session, batch_size=5)

    db_session.execute(
        text("UPDATE generation_batches SET status = 'completed' WHERE id = :id"),
        {"id": batch["id"]},
    )
    db_session.commit()

    second = batches.create_batch(db_session, batch_size=5)

    assert str(second["id"]) != str(batch["id"])


def test_active_recording_is_unique_per_word_and_config(db_session, seed_words):
    """The partial unique index blocks a second active recording."""
    word_id = seed_words[0]["id"]
    make_word_record(db_session, word_id)

    with pytest.raises(IntegrityError):
        make_word_record(
            db_session,
            word_id,
            storage_key="afaan-oromoo/words/test/om-hawi-normal-a2.mp3",
        )

    db_session.rollback()


# --------------------------------------------------
# Generation
# --------------------------------------------------


def test_generate_one_uploads_and_stores_pending(
    db_session, seed_words, fake_storage, fake_addis
):
    batch = batches.create_batch(db_session, batch_size=1)
    word = {
        "word_id": str(seed_words[0]["id"]),
        "text": seed_words[0]["text"],
        "content_type": seed_words[0]["content_type"],
    }

    result = batches.generate_one(
        db_session, word, batch_id=str(batch["id"]), addis=fake_addis
    )

    assert result["status"] == "pending"

    key = result["storage_key"]
    assert key in fake_storage.objects
    assert key.endswith("/om-hawi-normal.mp3")

    row = db_session.execute(
        text("SELECT * FROM audio_recordings WHERE id = :id"),
        {"id": result["recording_id"]},
    ).mappings().one()

    assert row["status"] == "pending"
    assert row["speaker_id"] == "om-hawi"
    assert row["speed"] == "normal"
    assert row["duration_ms"] == 1250
    assert row["batch_id"] == batch["id"]
    assert row["generation_error"] is None
    assert row["superseded_at"] is None


def test_generate_one_uses_two_dots_for_single_words(
    db_session, seed_words, fake_storage, fake_addis
):
    single = [w for w in seed_words if w["content_type"] == "word"][0]

    batches.generate_one(
        db_session,
        {
            "word_id": str(single["id"]),
            "text": single["text"],
            "content_type": "word",
        },
        batch_id=None,
        addis=fake_addis,
    )

    assert fake_addis.voice.calls[-1]["text"] == f"{single['text']}.."
    assert fake_addis.voice.calls[-1]["voice_id"] == "om-hawi"
    assert fake_addis.voice.calls[-1]["language"] == "om"


def test_generate_one_leaves_phrases_unchanged(
    db_session, seed_words, fake_storage, fake_addis
):
    phrase = [w for w in seed_words if w["content_type"] == "phrase"][0]

    batches.generate_one(
        db_session,
        {
            "word_id": str(phrase["id"]),
            "text": phrase["text"],
            "content_type": "phrase",
        },
        batch_id=None,
        addis=fake_addis,
    )

    assert fake_addis.voice.calls[-1]["text"] == phrase["text"]


def test_generate_one_never_modifies_vocabulary_text(
    db_session, seed_words, fake_storage, fake_addis
):
    original = seed_words[0]["text"]

    batches.generate_one(
        db_session,
        {
            "word_id": str(seed_words[0]["id"]),
            "text": original,
            "content_type": "word",
        },
        batch_id=None,
        addis=fake_addis,
    )

    stored = db_session.execute(
        text("SELECT text FROM words WHERE id = :id"),
        {"id": seed_words[0]["id"]},
    ).scalar_one()

    assert stored == original


def test_failed_generation_records_error_without_storage_key(
    db_session, seed_words, fake_storage, fake_addis
):
    word = seed_words[0]
    fake_addis.voice.fail_for.add(f"{word['text']}..")

    result = batches.generate_one(
        db_session,
        {
            "word_id": str(word["id"]),
            "text": word["text"],
            "content_type": word["content_type"],
        },
        batch_id=None,
        addis=fake_addis,
    )

    assert result["status"] == "failed"

    row = db_session.execute(
        text("SELECT * FROM audio_recordings WHERE word_id = :id"),
        {"id": word["id"]},
    ).mappings().one()

    assert row["status"] == "failed"
    assert row["storage_key"] is None
    assert "Addis AI failed" in row["generation_error"]
    assert fake_storage.objects == {}


def test_failed_upload_records_error_and_leaves_no_object(
    db_session, seed_words, fake_storage, fake_addis, tmp_path, monkeypatch
):
    monkeypatch.setattr(
        batches,
        "upload_audio",
        lambda *a, **k: (_ for _ in ()).throw(RuntimeError("bucket rejected")),
    )

    word = seed_words[0]

    result = batches.generate_one(
        db_session,
        {
            "word_id": str(word["id"]),
            "text": word["text"],
            "content_type": word["content_type"],
        },
        batch_id=None,
        addis=fake_addis,
    )

    assert result["status"] == "failed"

    row = db_session.execute(
        text("SELECT storage_key, status FROM audio_recordings WHERE word_id = :id"),
        {"id": word["id"]},
    ).mappings().one()

    assert row["status"] == "failed"
    assert row["storage_key"] is None


def test_invalid_vocabulary_text_is_never_sent_to_speech(
    db_session, seed_words, fake_storage, fake_addis
):
    word = seed_words[0]

    result = batches.generate_one(
        db_session,
        {
            "word_id": str(word["id"]),
            "text": "   ",
            "content_type": "word",
        },
        batch_id=None,
        addis=fake_addis,
    )

    assert result["status"] == "failed"
    assert fake_addis.voice.calls == []


# --------------------------------------------------
# Batch execution
# --------------------------------------------------


def test_run_batch_generates_requested_number(
    session_factory, seed_words, fake_storage, fake_addis
):
    batch = batches.create_batch(session_factory(), batch_size=4)

    batches.run_batch(session_factory, str(batch["id"]), addis=fake_addis)

    with session_factory() as session:
        state = batches.get_batch(session, str(batch["id"]))

    assert state["status"] == "completed"
    assert state["total_selected"] == 4
    assert state["generated_count"] == 4
    assert state["failed_count"] == 0
    assert state["pending_review"] == 4
    assert len(fake_storage.objects) == 4


def test_run_batch_records_failures_and_completes(
    session_factory, seed_words, fake_storage, fake_addis
):
    batch = batches.create_batch(session_factory(), batch_size=3)
    failing = [w for w in seed_words if w["content_type"] == "word"][0]
    fake_addis.voice.fail_for.add(f"{failing['text']}..")

    batches.run_batch(session_factory, str(batch["id"]), addis=fake_addis)

    with session_factory() as session:
        state = batches.get_batch(session, str(batch["id"]))

    assert state["status"] == "completed"
    assert state["generated_count"] + state["failed_count"] == 3
    assert state["failed"] == state["failed_count"] >= 1


def test_run_batch_does_not_regenerate_existing_recordings(
    session_factory, seed_words, fake_storage, fake_addis
):
    first = batches.create_batch(session_factory(), batch_size=2)
    batches.run_batch(session_factory, str(first["id"]), addis=fake_addis)
    calls_after_first = len(fake_addis.voice.calls)

    with session_factory() as session:
        session.execute(
            text("UPDATE generation_batches SET status = 'completed' WHERE id = :id"),
            {"id": first["id"]},
        )
        session.commit()

    second = batches.create_batch(session_factory(), batch_size=100)
    batches.run_batch(session_factory, str(second["id"]), addis=fake_addis)

    with session_factory() as session:
        state = batches.get_batch(session, str(second["id"]))
        recorded = int(
            session.execute(
                text(
                    "SELECT COUNT(*) FROM audio_recordings "
                    "WHERE speaker_id = 'om-hawi'"
                )
            ).scalar_one()
        )

    # The first two recordings are skipped, only new words are processed.
    assert calls_after_first == 2
    assert state["total_selected"] == len(seed_words) - 2
    assert recorded == len(seed_words)


def test_run_batch_progress_is_visible_while_running(
    session_factory, seed_words, fake_storage, fake_addis
):
    batch = batches.create_batch(session_factory(), batch_size=2)

    with session_factory() as session:
        assert batches.get_batch(session, str(batch["id"]))["status"] == "running"
        assert batches.get_running_batch(session)["id"] == batch["id"]


def test_remaining_eligible_is_zero_when_everything_is_generated(
    session_factory, seed_words, fake_storage, fake_addis
):
    batch = batches.create_batch(session_factory(), batch_size=100)
    batches.run_batch(session_factory, str(batch["id"]), addis=fake_addis)

    with session_factory() as session:
        assert batches.count_eligible_words(session) == 0


# --------------------------------------------------
# Regeneration and retries
# --------------------------------------------------


def test_regenerate_creates_pending_replacement_and_supersedes_original(
    db_session, seed_words, fake_storage, fake_addis
):
    word = seed_words[0]
    original_id = make_word_record(db_session, word["id"])

    replacement = batches.regenerate_recording(
        db_session, str(original_id), addis=fake_addis
    )

    assert replacement["status"] == "pending"
    assert replacement["attempt"] == 2
    assert replacement["storage_key"].endswith("-a2.mp3")
    assert replacement["storage_key"] in fake_storage.objects

    original = db_session.execute(
        text("SELECT superseded_at, status FROM audio_recordings WHERE id = :id"),
        {"id": original_id},
    ).mappings().one()

    assert original["superseded_at"] is not None
    assert original["status"] == "pending"  # history preserved


def test_regenerate_preserves_original_when_generation_fails(
    db_session, seed_words, fake_storage, fake_addis
):
    word = seed_words[0]
    original_id = make_word_record(db_session, word["id"])
    fake_addis.voice.fail_for.add(f"{word['text']}..")

    with pytest.raises(batches.RecordingError):
        batches.regenerate_recording(db_session, str(original_id), addis=fake_addis)

    original = db_session.execute(
        text("SELECT * FROM audio_recordings WHERE id = :id"),
        {"id": original_id},
    ).mappings().one()

    assert original["superseded_at"] is None
    assert original["status"] == "pending"
    assert original["storage_key"].endswith("om-hawi-normal.mp3")


def test_regenerate_keeps_original_when_upload_fails(
    db_session, seed_words, fake_storage, fake_addis, monkeypatch
):
    word = seed_words[0]
    original_id = make_word_record(db_session, word["id"])

    monkeypatch.setattr(
        batches,
        "upload_audio",
        lambda *a, **k: (_ for _ in ()).throw(RuntimeError("upload failed")),
    )

    with pytest.raises(batches.RecordingError):
        batches.regenerate_recording(db_session, str(original_id), addis=fake_addis)

    rows = db_session.execute(
        text("SELECT status, storage_key FROM audio_recordings WHERE word_id = :id"),
        {"id": word["id"]},
    ).mappings().all()

    active = [r for r in rows if r["storage_key"] is not None]
    assert len(active) == 1
    assert active[0]["storage_key"].endswith("om-hawi-normal.mp3")


def test_retry_recovers_failed_items_without_touching_successes(
    db_session, seed_words, fake_storage, fake_addis
):
    failed_word = seed_words[0]
    ok_word = seed_words[1]

    ok_id = make_word_record(db_session, ok_word["id"])
    make_word_record(
        db_session,
        failed_word["id"],
        storage_key=None,
        status="failed",
        generation_error="boom",
    )

    failed_row = db_session.execute(
        text(
            "SELECT id FROM audio_recordings WHERE word_id = :id AND status = 'failed'"
        ),
        {"id": failed_word["id"]},
    ).scalar_one()

    results = batches.retry_failed_recordings(
        db_session, [str(failed_row)], addis=fake_addis
    )

    assert results[0]["status"] == "pending"

    recovered = db_session.execute(
        text(
            "SELECT * FROM audio_recordings WHERE word_id = :id "
            "AND status = 'pending'"
        ),
        {"id": failed_word["id"]},
    ).mappings().one()

    assert recovered["storage_key"] is not None
    assert recovered["attempt"] == 2

    untouched = db_session.execute(
        text("SELECT * FROM audio_recordings WHERE id = :id"),
        {"id": ok_id},
    ).mappings().one()

    assert untouched["status"] == "pending"
    assert untouched["attempt"] == 1


def test_retry_skips_items_that_did_not_fail(
    db_session, seed_words, fake_storage, fake_addis
):
    recording_id = make_word_record(db_session, seed_words[0]["id"])

    results = batches.retry_failed_recordings(
        db_session, [str(recording_id)], addis=fake_addis
    )

    assert results[0]["status"] == "skipped"
    assert fake_addis.voice.calls == []