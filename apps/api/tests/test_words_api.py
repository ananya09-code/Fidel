"""HTTP-level tests for the public vocabulary API."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import text


@pytest.fixture()
def words_client(
    client: TestClient,
    session_factory,
    monkeypatch,
) -> Generator[TestClient, None, None]:
    """Test client wired to the isolated database and fake audio URLs."""
    from app.api.v1.endpoints import words
    from app.services import storage

    def override_get_db():
        with session_factory() as session:
            yield session

    def fake_audio_url(storage_key: str, expires_in: int = 3600) -> str:
        return f"https://audio.test/{storage_key}?expires={expires_in}"

    monkeypatch.setattr(storage, "generate_audio_url", fake_audio_url)
    client.app.dependency_overrides[words.get_db] = override_get_db

    try:
        yield client
    finally:
        client.app.dependency_overrides.pop(words.get_db, None)


def _insert_word(
    session,
    value: str,
    *,
    status: str = "approved",
    language_code: str = "om",
    content_type: str = "word",
    category: str = "greetings",
    difficulty: str = "beginner",
) -> uuid.UUID:
    word_id = uuid.uuid4()

    session.execute(
        text(
            """
            INSERT INTO words (
                id, language_code, text, transliteration, content_type,
                category, difficulty, status
            )
            VALUES (
                :id, :language_code, :text, :transliteration, :content_type,
                :category, :difficulty, :status
            )
            """
        ),
        {
            "id": word_id,
            "language_code": language_code,
            "text": value,
            "transliteration": None,
            "content_type": content_type,
            "category": category,
            "difficulty": difficulty,
            "status": status,
        },
    )
    session.commit()
    return word_id


def _insert_translation(
    session,
    word_id: uuid.UUID,
    meaning: str,
    *,
    language_code: str = "en",
    context_note: str | None = None,
) -> None:
    session.execute(
        text(
            """
            INSERT INTO word_translations (
                id, word_id, language_code, meaning, context_note
            )
            VALUES (:id, :word_id, :language_code, :meaning, :context_note)
            """
        ),
        {
            "id": uuid.uuid4(),
            "word_id": word_id,
            "language_code": language_code,
            "meaning": meaning,
            "context_note": context_note,
        },
    )
    session.commit()


def _insert_audio(
    session,
    word_id: uuid.UUID,
    storage_key: str,
    *,
    status: str = "approved",
    superseded: bool = False,
    created_at: datetime | None = None,
) -> None:
    session.execute(
        text(
            """
            INSERT INTO audio_recordings (
                id, word_id, storage_key, speaker_id, speed, status,
                created_at, superseded_at
            )
            VALUES (
                :id, :word_id, :storage_key, 'om-hawi', 'normal', :status,
                :created_at, :superseded_at
            )
            """
        ),
        {
            "id": uuid.uuid4(),
            "word_id": word_id,
            "storage_key": storage_key,
            "status": status,
            "created_at": created_at or datetime.now(timezone.utc),
            "superseded_at": (
                datetime.now(timezone.utc) if superseded else None
            ),
        },
    )
    session.commit()


def test_list_returns_only_approved_words(words_client: TestClient, session_factory) -> None:
    with session_factory() as session:
        word_id = _insert_word(session, "akkam")
        _insert_translation(session, word_id, "hello")
        _insert_audio(session, word_id, "afaan-oromoo/akkam.mp3")
        _insert_word(session, "draft-word", status="draft")

    response = words_client.get("/api/v1/words")

    assert response.status_code == 200
    body = response.json()
    assert len(body["data"]) == 1
    assert body["data"][0]["text"] == "akkam"
    assert body["data"][0]["meaning"] == "hello"
    assert body["data"][0]["content_type"] == "word"
    assert body["data"][0]["audio"]["available"] is True
    assert body["data"][0]["audio"]["url"].startswith("https://audio.test/")
    assert body["meta"]["pagination"]["total_items"] == 1


def test_list_filters_and_paginates(words_client: TestClient, session_factory) -> None:
    with session_factory() as session:
        first = _insert_word(session, "akkam jirta", content_type="phrase")
        _insert_translation(session, first, "how are you")
        second = _insert_word(session, "galatoomi")
        _insert_translation(session, second, "thank you")
        _insert_word(session, "bishaan", category="food")

    phrase_response = words_client.get(
        "/api/v1/words",
        params={"content_type": "phrase"},
    )
    assert phrase_response.status_code == 200
    assert [item["text"] for item in phrase_response.json()["data"]] == [
        "akkam jirta"
    ]

    search_response = words_client.get("/api/v1/words", params={"search": "thank"})
    assert search_response.status_code == 200
    assert [item["text"] for item in search_response.json()["data"]] == [
        "galatoomi"
    ]

    page_response = words_client.get(
        "/api/v1/words",
        params={"page": 1, "page_size": 2},
    )
    body = page_response.json()
    assert len(body["data"]) == 2
    assert body["meta"]["pagination"]["total_items"] == 3
    assert body["meta"]["pagination"]["total_pages"] == 2
    assert body["meta"]["pagination"]["has_next"] is True


def test_single_word_returns_translations_and_active_audio(
    words_client: TestClient,
    session_factory,
) -> None:
    with session_factory() as session:
        word_id = _insert_word(session, "akkam")
        _insert_translation(
            session,
            word_id,
            "hello",
            context_note="A greeting",
        )
        _insert_audio(
            session,
            word_id,
            "afaan-oromoo/akkam-old.mp3",
            created_at=datetime(2026, 1, 1, tzinfo=timezone.utc),
        )
        _insert_audio(
            session,
            word_id,
            "afaan-oromoo/akkam-new.mp3",
            superseded=True,
            created_at=datetime(2026, 1, 2, tzinfo=timezone.utc),
        )

    response = words_client.get(f"/api/v1/words/{word_id}")

    assert response.status_code == 200
    body = response.json()
    assert body["text"] == "akkam"
    assert body["translations"] == [
        {
            "language_code": "en",
            "meaning": "hello",
            "context_note": "A greeting",
        }
    ]
    assert body["audio"]["available"] is True
    assert "akkam-old.mp3" in body["audio"]["url"]
    assert "akkam-new.mp3" not in body["audio"]["url"]


def test_single_word_without_audio(words_client: TestClient, session_factory) -> None:
    with session_factory() as session:
        word_id = _insert_word(session, "bishaan")

    response = words_client.get(f"/api/v1/words/{word_id}")

    assert response.status_code == 200
    assert response.json()["audio"] == {
        "available": False,
        "url": None,
        "speaker_id": None,
        "speed": None,
    }


def test_single_word_rejects_invalid_uuid(words_client: TestClient) -> None:
    response = words_client.get("/api/v1/words/not-a-uuid")

    assert response.status_code == 422


def test_single_word_hides_drafts(words_client: TestClient, session_factory) -> None:
    with session_factory() as session:
        word_id = _insert_word(session, "draft-word", status="draft")

    response = words_client.get(f"/api/v1/words/{word_id}")

    assert response.status_code == 404
    assert response.json()["detail"] == "Word not found"
