"""Recording approval publishes vocabulary using isolated databases only."""
import pytest
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError

from app.services import audio_batches as batches
from tests.conftest import make_word_record


@pytest.mark.parametrize("language", ["om", "am", "ti"])
def test_approval_publishes_only_its_word_and_exposes_lesson(
    admin_client, auth_client, session_factory, seed_words, fake_storage, language,
):
    word_id = seed_words[0]["id"]
    with session_factory() as session:
        session.execute(
            text("UPDATE words SET language_code=:language, category='greetings' WHERE id=:id"),
            {"language": language, "id": word_id},
        )
        recording_id = make_word_record(session, word_id)

    path = f"/api/v1/learning/path?language_code={language}"
    assert auth_client.get(path).json()["total_words"] == 0
    result = admin_client.post(f"/api/audio-review/recordings/{recording_id}/approve")
    assert result.status_code == 200
    assert result.json()["recording"]["status"] == "approved"
    with session_factory() as session:
        assert session.execute(text("SELECT status FROM words WHERE id=:id"), {"id": word_id}).scalar_one() == "approved"
        assert session.execute(text("SELECT COUNT(*) FROM words WHERE status='draft'")).scalar_one() == len(seed_words) - 1
    result = auth_client.get(path)
    assert result.status_code == 200
    assert result.json()["total_words"] == 1
    assert result.json()["levels"][0]["lessons"][0]["word_count"] == 1


def test_publication_failure_does_not_commit_recording_approval(db_session, seed_words):
    recording_id = make_word_record(db_session, seed_words[0]["id"])
    db_session.execute(text("""CREATE TRIGGER prevent_publication BEFORE UPDATE OF status ON words
        WHEN NEW.status='approved' BEGIN SELECT RAISE(ABORT, 'test publication failure'); END"""))
    db_session.commit()
    with pytest.raises(IntegrityError):
        batches.approve_recording(db_session, str(recording_id))
    db_session.rollback()
    assert batches.get_recording(db_session, str(recording_id))["status"] == "pending"
    assert db_session.execute(text("SELECT COUNT(*) FROM words WHERE status='approved'")).scalar_one() == 0


def test_failed_recording_does_not_publish_word(admin_client, session_factory, seed_words):
    with session_factory() as session:
        recording_id = make_word_record(session, seed_words[0]["id"], status="failed", storage_key=None)
    assert admin_client.post(f"/api/audio-review/recordings/{recording_id}/approve").status_code == 409
    with session_factory() as session:
        assert session.execute(text("SELECT COUNT(*) FROM words WHERE status='approved'")).scalar_one() == 0


def test_disapproval_removes_word_from_learning_path(
    admin_client, auth_client, session_factory, seed_words, fake_storage,
):
    word_id = seed_words[0]["id"]
    with session_factory() as session:
        session.execute(
            text("UPDATE words SET category='greetings' WHERE id=:id"),
            {"id": word_id},
        )
        recording_id = make_word_record(session, word_id)
    path = "/api/v1/learning/path?language_code=om"
    assert admin_client.post(f"/api/audio-review/recordings/{recording_id}/approve").status_code == 200
    assert auth_client.get(path).json()["total_words"] == 1
    assert admin_client.post(f"/api/audio-review/recordings/{recording_id}/reject").status_code == 200
    assert auth_client.get(path).json()["total_words"] == 0
