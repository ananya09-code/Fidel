"""Approved-audio corrections use only the isolated test database and bucket."""

from pathlib import Path
import shutil
import subprocess
from types import SimpleNamespace

import pytest
from sqlalchemy import text

from app.services import audio_batches
from app.api.v1.endpoints.words import _load_audio
from tests.conftest import make_word_record

BASE = "/api/audio-review/recordings"


def _word_status(session_factory, word_id):
    with session_factory() as db:
        return db.execute(text("SELECT status FROM words WHERE id=:id"), {"id": word_id}).scalar_one()


def test_disapproving_only_active_audio_unpublishes_word(
    admin_client, session_factory, seed_words, fake_storage,
):
    word_id = seed_words[0]["id"]
    with session_factory() as db:
        recording_id = make_word_record(db, word_id)
    assert admin_client.post(f"{BASE}/{recording_id}/approve").status_code == 200
    assert _word_status(session_factory, word_id) == "approved"

    result = admin_client.post(f"{BASE}/{recording_id}/reject", json={"reason": "clip is too long"})
    assert result.status_code == 200
    assert result.json()["recording"]["status"] == "rejected"
    assert _word_status(session_factory, word_id) == "draft"

    assert admin_client.post(f"{BASE}/{recording_id}/approve").status_code == 200
    assert _word_status(session_factory, word_id) == "approved"


def test_disapproving_one_of_two_active_voices_keeps_word_published(
    admin_client, session_factory, seed_words, fake_storage,
):
    word_id = seed_words[0]["id"]
    with session_factory() as db:
        first = make_word_record(db, word_id)
        second = make_word_record(
            db, word_id, storage_key="afaan-oromoo/words/test/om-another-normal.mp3",
            speaker_id="om-another",
        )
    for recording_id in (first, second):
        assert admin_client.post(f"{BASE}/{recording_id}/approve").status_code == 200
    assert admin_client.post(f"{BASE}/{first}/reject").status_code == 200
    assert _word_status(session_factory, word_id) == "approved"
    assert admin_client.post(f"{BASE}/{second}/reject").status_code == 200
    assert _word_status(session_factory, word_id) == "draft"


def test_trim_publishes_new_attempt_and_retains_original(
    admin_client, session_factory, seed_words, fake_storage, monkeypatch,
):
    word_id = seed_words[0]["id"]
    with session_factory() as db:
        recording_id = make_word_record(db, word_id, status="approved")
        db.execute(text("UPDATE words SET status='approved' WHERE id=:id"), {"id": word_id})
        db.commit()
    fake_storage.objects["afaan-oromoo/words/test/om-hawi-normal.mp3"] = b"original"
    monkeypatch.setattr(audio_batches.shutil, "which", lambda name: "ffmpeg-test")

    def fake_run(args, **kwargs):
        assert args[0] == "ffmpeg-test"
        assert args[args.index("-ss") + 1] == "0.100"
        assert args[args.index("-t") + 1] == "0.700"
        Path(args[-1]).write_bytes(b"trimmed")
        return SimpleNamespace(returncode=0)

    monkeypatch.setattr(audio_batches.subprocess, "run", fake_run)
    response = admin_client.post(f"{BASE}/{recording_id}/trim", json={"start_ms": 100, "end_ms": 800})
    assert response.status_code == 200, response.text
    replacement = response.json()["recording"]
    assert replacement["status"] == "approved"
    assert replacement["attempt"] == 2
    assert replacement["duration_ms"] == 700
    assert replacement["reviewed_by"] == "tester"
    assert fake_storage.objects[replacement["storage_key"]] == b"trimmed"
    assert fake_storage.objects["afaan-oromoo/words/test/om-hawi-normal.mp3"] == b"original"
    with session_factory() as db:
        old = audio_batches.get_recording(db, str(recording_id))
        assert old["status"] == "approved" and old["superseded_at"] is not None
        assert _load_audio(db, [word_id])[str(word_id)]["storage_key"] == replacement["storage_key"]
    assert _word_status(session_factory, word_id) == "approved"
    listed = admin_client.get(f"{BASE}?status=approved").json()["items"]
    assert [item["id"] for item in listed] == [replacement["id"]]


def test_failed_trim_keeps_original_active(
    admin_client, session_factory, seed_words, fake_storage, monkeypatch,
):
    with session_factory() as db:
        recording_id = make_word_record(db, seed_words[0]["id"], status="approved")
    source_key = "afaan-oromoo/words/test/om-hawi-normal.mp3"
    fake_storage.objects[source_key] = b"original"
    monkeypatch.setattr(audio_batches.shutil, "which", lambda name: "ffmpeg-test")
    monkeypatch.setattr(audio_batches.subprocess, "run", lambda *args, **kwargs: SimpleNamespace(returncode=1))

    result = admin_client.post(f"{BASE}/{recording_id}/trim", json={"start_ms": 100, "end_ms": 800})
    assert result.status_code == 409
    with session_factory() as db:
        original = audio_batches.get_recording(db, str(recording_id))
        assert original["status"] == "approved" and original["superseded_at"] is None
        assert db.execute(text("SELECT COUNT(*) FROM audio_recordings")).scalar_one() == 1
    assert fake_storage.objects == {source_key: b"original"}


def test_failed_trim_upload_keeps_original_active(
    admin_client, session_factory, seed_words, fake_storage, monkeypatch,
):
    with session_factory() as db:
        recording_id = make_word_record(db, seed_words[0]["id"], status="approved")
    source_key = "afaan-oromoo/words/test/om-hawi-normal.mp3"
    fake_storage.objects[source_key] = b"original"
    fake_storage.fail_upload_for.add("trimmed.mp3")
    monkeypatch.setattr(audio_batches.shutil, "which", lambda name: "ffmpeg-test")

    def fake_run(args, **kwargs):
        Path(args[-1]).write_bytes(b"trimmed")
        return SimpleNamespace(returncode=0)

    monkeypatch.setattr(audio_batches.subprocess, "run", fake_run)
    response = admin_client.post(f"{BASE}/{recording_id}/trim", json={"start_ms": 100, "end_ms": 800})
    assert response.status_code == 409
    with session_factory() as db:
        assert audio_batches.get_recording(db, str(recording_id))["superseded_at"] is None
        assert db.execute(text("SELECT COUNT(*) FROM audio_recordings")).scalar_one() == 1
    assert fake_storage.objects == {source_key: b"original"}


def test_trim_validates_boundaries_and_admin_key(
    admin_client, session_factory, seed_words, fake_storage,
):
    with session_factory() as db:
        recording_id = make_word_record(db, seed_words[0]["id"], status="approved")
    assert admin_client.post(f"{BASE}/{recording_id}/trim", json={"start_ms": 0, "end_ms": 100}).status_code == 409
    assert admin_client.post(f"{BASE}/{recording_id}/trim", json={"start_ms": 0, "end_ms": 2000}).status_code == 409


def test_trim_requires_admin_key(anonymous_admin_client):
    response = anonymous_admin_client.post(
        f"{BASE}/00000000-0000-0000-0000-000000000001/trim",
        json={"start_ms": 0, "end_ms": 500},
    )
    assert response.status_code == 401


@pytest.mark.skipif(shutil.which("ffmpeg") is None, reason="ffmpeg is not installed")
def test_real_mp3_trim_preserves_original(
    admin_client, session_factory, seed_words, fake_storage, tmp_path,
):
    """Exercise the actual encoder with generated fixture audio, never user data."""
    source = tmp_path / "tone.mp3"
    subprocess.run(
        [shutil.which("ffmpeg"), "-hide_banner", "-loglevel", "error", "-y",
         "-f", "lavfi", "-i", "sine=frequency=440:duration=1", str(source)],
        check=True, capture_output=True,
    )
    key = "afaan-oromoo/words/test/om-hawi-normal.mp3"
    fake_storage.objects[key] = source.read_bytes()
    with session_factory() as db:
        recording_id = make_word_record(db, seed_words[0]["id"], status="approved")
    response = admin_client.post(f"{BASE}/{recording_id}/trim", json={"start_ms": 100, "end_ms": 700})
    assert response.status_code == 200, response.text
    assert fake_storage.objects[key] == source.read_bytes()
    assert fake_storage.objects[response.json()["recording"]["storage_key"]] != source.read_bytes()
