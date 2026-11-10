"""Multilingual imports/audio use isolated SQLite and fake speech/storage."""
from pathlib import Path

import pytest
from sqlalchemy import create_engine, text

from app.services import audio_batches as batches
from app.services.speech import build_storage_key, resolve_voice
from scripts.import_vocabulary import load_rows, import_rows, normalize_row

SAMPLE = Path(__file__).resolve().parents[1] / "data/vocabulary/tigrinya_sample.csv"


def test_sample_dry_run_and_supported_languages():
    rows = load_rows(SAMPLE, None)
    assert len(rows) == 5
    assert all(row["language_code"] == "ti" and row["meaning"] and row["meaning_amharic"] for row in rows)
    assert import_rows(None, rows, True)["words_inserted"] == 0
    with pytest.raises(ValueError, match="unsupported language"):
        normalize_row({"language_code": "xx", "text": "fixture"}, 2)


def test_multilingual_import_is_idempotent_and_keeps_words_draft():
    engine = create_engine("sqlite://")
    with engine.begin() as connection:
        connection.execute(text("CREATE TABLE words (id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))), language_code TEXT, text TEXT, transliteration TEXT, content_type TEXT, category TEXT, difficulty TEXT, status TEXT, UNIQUE(language_code,text))"))
        connection.execute(text("CREATE TABLE word_translations (id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))), word_id TEXT, language_code TEXT, meaning TEXT, UNIQUE(word_id,language_code,meaning))"))
    rows = load_rows(SAMPLE, None)
    assert import_rows(engine, rows, False)["words_inserted"] == 5
    repeated = import_rows(engine, rows, False)
    assert repeated == {"words_inserted": 0, "words_existing": 5, "translations_inserted": 0}
    with engine.connect() as connection:
        assert connection.execute(text("SELECT COUNT(*) FROM words WHERE status='draft' AND language_code='ti'")).scalar_one() == 5
        assert connection.execute(text("SELECT COUNT(*) FROM word_translations")).scalar_one() == 10
    engine.dispose()


def test_storage_paths_preserve_oromo_and_separate_other_languages():
    assert build_storage_key("word", "om-hawi", "normal") == "afaan-oromoo/words/word/om-hawi-normal.mp3"
    assert build_storage_key("word", "ti-berhane", "normal", 2) == "tigrinya/words/word/ti-berhane-normal-a2.mp3"
    assert build_storage_key("word", "am-hamen", "normal").startswith("amharic/")
    with pytest.raises(ValueError, match="selected language"):
        resolve_voice("ti", "om-hawi")


def tigrinya_word(db_session, seed_words):
    identifier = str(seed_words[0]["id"])
    db_session.execute(text("UPDATE words SET language_code='ti', text='ሰላም', content_type='word' WHERE id=:id"), {"id": identifier})
    db_session.commit()
    return identifier


def test_batch_uses_saved_language_and_voice_without_touching_oromo(
    db_session, session_factory, seed_words, fake_addis, fake_storage,
):
    identifier = tigrinya_word(db_session, seed_words)
    batch = batches.create_batch(db_session, 1, language_code="ti", speaker_id="ti-berhane")
    batches.run_batch(session_factory, str(batch["id"]), addis=fake_addis)
    assert fake_addis.voice.calls == [{"voice_id": "ti-berhane", "language": "ti", "text": "ሰላም", "output_format": "mp3_44100"}]
    row = db_session.execute(text("SELECT word_id,storage_key,status FROM audio_recordings")).mappings().one()
    assert str(row["word_id"]) == identifier
    assert row["storage_key"].startswith("tigrinya/")
    assert row["status"] == "pending"
    assert batches.count_eligible_words(db_session) == 11
    assert batches.count_eligible_words(db_session, "ti", "ti-berhane") == 0
    batches.run_batch(session_factory, str(batch["id"]), addis=fake_addis)
    assert len(fake_addis.voice.calls) == 1


def test_tigrinya_retry_and_regeneration_preserve_language(
    db_session, seed_words, fake_addis, fake_storage,
):
    identifier = tigrinya_word(db_session, seed_words)
    word = {"word_id": identifier, "text": "ሰላም", "content_type": "word"}
    fake_addis.voice.fail_for.add("ሰላም")
    batches.generate_one(db_session, word, batch_id=None, speaker_id="ti-berhane", addis=fake_addis)
    failed = db_session.execute(text("SELECT id FROM audio_recordings WHERE status='failed'")).scalar_one()
    fake_addis.voice.fail_for.clear()
    batches.retry_failed_recordings(db_session, [str(failed)], addis=fake_addis)
    pending = db_session.execute(text("SELECT id FROM audio_recordings WHERE status='pending' AND superseded_at IS NULL")).scalar_one()
    batches.regenerate_recording(db_session, str(pending), addis=fake_addis)
    assert all(call["language"] == "ti" and call["voice_id"] == "ti-berhane" for call in fake_addis.voice.calls)
    assert db_session.execute(text("SELECT COUNT(*) FROM audio_recordings WHERE superseded_at IS NULL")).scalar_one() == 1


def test_wrong_language_voice_fails_before_generation(db_session, seed_words, fake_addis, fake_storage):
    identifier = tigrinya_word(db_session, seed_words)
    with pytest.raises(ValueError, match="selected language"):
        batches.generate_one(db_session, {"word_id": identifier, "text": "ሰላም"}, batch_id=None, speaker_id="om-hawi", addis=fake_addis)
    assert not fake_addis.voice.calls
    assert db_session.execute(text("SELECT COUNT(*) FROM audio_recordings")).scalar_one() == 0


def test_admin_api_supports_tigrinya_and_rejects_mismatched_voice(
    admin_client, db_session, seed_words, fake_addis, fake_storage,
):
    tigrinya_word(db_session, seed_words)
    assert admin_client.post("/api/audio-review/batches", json={"batch_size": 1, "language_code": "ti", "speaker_id": "om-hawi"}).status_code == 422
    response = admin_client.post("/api/audio-review/batches", json={"batch_size": 1, "language_code": "ti", "speaker_id": "ti-berhane"})
    assert response.status_code == 202
    result = admin_client.get("/api/audio-review/batches?language_code=ti").json()
    assert result["batches"][0]["language_code"] == "ti"
    assert result["batches"][0]["generated_count"] == 1
    assert not admin_client.get("/api/audio-review/batches?language_code=am").json()["batches"]
    assert admin_client.get("/api/audio-review/summary?language_code=ti&speaker_id=ti-berhane").json()["total_vocabulary"] == 1


def test_voice_catalog_filters_language(admin_client, monkeypatch):
    # Exercise the guarded route with a fake catalog; no external API call.
    from app.api.v1.endpoints import recordings
    monkeypatch.setattr(recordings, "list_available_voices", lambda language: [{"id": f"{language}-fixture", "name": "Fixture"}])
    assert admin_client.get("/api/audio-review/voices?language_code=ti").json() == [{"id": "ti-fixture", "name": "Fixture"}]
    assert admin_client.get("/api/audio-review/voices?language_code=xx").status_code == 422


def test_voice_catalog_requires_admin(anonymous_admin_client, monkeypatch):
    from app.api.v1.endpoints import recordings
    monkeypatch.setattr(recordings, "list_available_voices", lambda language: pytest.fail("Unauthorized catalog lookup"))
    assert anonymous_admin_client.get("/api/audio-review/voices?language_code=ti").status_code == 401
