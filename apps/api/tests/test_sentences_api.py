"""Sentence gates and answers use only the authenticated learner's words."""

import importlib.util
from pathlib import Path
from uuid import uuid4

import httpx
import pytest
from alembic.migration import MigrationContext
from alembic.operations import Operations
from sqlalchemy import JSON, bindparam, text

from app.main import create_app
from app.services.clerk_users import ClerkProfileData
from tests.conftest import AUTH_HEADERS

BASE = "/api/v1/sentences"


@pytest.fixture
def anyio_backend():
    return "asyncio"


def _test_app(session_factory, monkeypatch):
    from app.api.v1.endpoints import auth, learning, sentences, words
    from app.core.config import get_settings
    from pydantic import SecretStr

    settings = get_settings()
    monkeypatch.setattr(settings, "clerk_secret_key", SecretStr("sk_test"))
    monkeypatch.setattr(settings, "clerk_issuer", "https://clerk.example.test")
    monkeypatch.setattr(settings, "clerk_jwt_key", None)
    monkeypatch.setattr(settings, "clerk_authorized_parties", None)
    monkeypatch.setattr(auth, "fetch_clerk_profile", lambda user_id, key: ClerkProfileData(
        email=f"{user_id}@example.test", first_name="Test", last_name="Learner",
        username=user_id, image_url="https://images.example.test/avatar.png"))
    app = create_app()
    def get_db():
        with session_factory() as session:
            yield session
    for module in (auth, learning, sentences, words):
        app.dependency_overrides[module.get_db] = get_db
    return app


async def _seed(client, session_factory, monkeypatch):
    from app.api.v1.endpoints import words

    monkeypatch.setattr(words.storage, "generate_audio_url", lambda *args, **kwargs: "https://audio.example.test/sentence.mp3")
    assert (await client.post("/api/v1/auth/profile", headers=AUTH_HEADERS)).status_code == 200
    ids = [uuid4(), uuid4()]
    sentence_id, exercise_id, recording_id = uuid4(), uuid4(), uuid4()
    with session_factory() as db:
        uid = db.execute(text("SELECT id FROM users WHERE clerk_id='user_test'")).scalar_one()
        for word_id, value in zip(ids, ["Buna", "maaloo"]):
            db.execute(text("INSERT INTO words (id,language_code,text,status,category) VALUES (:id,'om',:value,'approved','food')"),
                       {"id": word_id, "value": value})
        db.execute(text("""INSERT INTO words (id,language_code,text,status,content_type)
            VALUES (:id,'om','Buna maaloo.','approved','sentence')"""), {"id": sentence_id})
        db.execute(text("""INSERT INTO word_translations (id,word_id,language_code,meaning)
            VALUES (:id,:word,'en','Coffee, please.')"""), {"id": uuid4(), "word": sentence_id})
        db.execute(text("""INSERT INTO sentence_exercises (id,sentence_word_id,tiles,accepted_orders)
            VALUES (:id,:word,:tiles,:orders)""").bindparams(bindparam("tiles", type_=JSON), bindparam("orders", type_=JSON)),
            {"id": exercise_id, "word": sentence_id,
             "tiles": [{"id": "a", "word_id": str(ids[0]), "text": "Buna"},
                       {"id": "b", "word_id": str(ids[1]), "text": "maaloo"}],
             "orders": [["a", "b"]]})
        db.execute(text("""INSERT INTO audio_recordings (id,word_id,storage_key,status)
            VALUES (:id,:word,'sentences/test.mp3','approved')"""), {"id": recording_id, "word": sentence_id})
        db.commit()
    return uid, ids, sentence_id, exercise_id, recording_id


@pytest.mark.anyio
async def test_learning_audio_and_user_gates(session_factory, mock_clerk, monkeypatch):
    app = _test_app(session_factory, monkeypatch)
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as auth_client:
        await _check_gates(auth_client, session_factory, mock_clerk, monkeypatch)


async def _check_gates(auth_client, session_factory, mock_clerk, monkeypatch):
    uid, ids, sentence_id, exercise_id, recording_id = await _seed(auth_client, session_factory, monkeypatch)
    url = f"{BASE}/{exercise_id}/answers"
    async def get():
        return await auth_client.get(BASE, params={"language_code": "om"}, headers=AUTH_HEADERS)
    assert (await get()).json()["exercises"][0]["locked"]
    assert (await auth_client.post(url, json={"selected_order": ["a", "b"]}, headers=AUTH_HEADERS)).status_code == 409
    with session_factory() as db:
        for word_id in ids:
            db.execute(text("""INSERT INTO user_words (user_id,word_id,learning_state)
                VALUES (:uid,:word,'learned')"""), {"uid": uid, "word": word_id})
        db.commit()
    assert not (await get()).json()["exercises"][0]["locked"]
    with session_factory() as db:
        db.execute(text("""UPDATE user_words SET learning_state='needs_review',
            times_seen=1, times_correct=1 WHERE user_id=:uid AND word_id=:word"""),
            {"uid": uid, "word": ids[0]})
        db.commit()
    assert not (await get()).json()["exercises"][0]["locked"]
    assert (await auth_client.post(url, json={"selected_order": ["a", "a"]}, headers=AUTH_HEADERS)).status_code == 422
    wrong = await auth_client.post(url, json={"selected_order": ["b", "a"]}, headers=AUTH_HEADERS)
    assert wrong.status_code == 200 and not wrong.json()["is_correct"]
    assert wrong.json()["sentence"] is None and wrong.json()["hint"] == "Start with Buna."
    assert not (await get()).json()["exercises"][0]["completed"]
    right = await auth_client.post(url, json={"selected_order": ["a", "b"]}, headers=AUTH_HEADERS)
    assert right.status_code == 200 and right.json()["is_correct"]
    assert right.json()["sentence"] == "Buna maaloo."
    assert (await get()).json()["exercises"][0]["completed"]
    with session_factory() as db:
        assert db.execute(text("SELECT COUNT(*) FROM sentence_attempts WHERE user_id=:uid"), {"uid": uid}).scalar_one() == 2
        db.execute(text("UPDATE audio_recordings SET status='rejected' WHERE id=:id"), {"id": recording_id})
        db.commit()
    assert (await get()).json()["exercises"][0]["locked"]
    assert (await auth_client.post(url, json={"selected_order": ["a", "b"]}, headers=AUTH_HEADERS)).status_code == 409
    mock_clerk(user_id="another_learner")
    other = (await get()).json()["exercises"][0]
    assert other["locked"] and not other["completed"]
    assert (await auth_client.post(url, json={"selected_order": ["a", "b"]}, headers=AUTH_HEADERS)).status_code == 409
    mock_clerk(user_id="")
    assert (await get()).status_code == 401


@pytest.mark.anyio
async def test_sentences_do_not_become_lesson_words(session_factory, mock_clerk, monkeypatch):
    app = _test_app(session_factory, monkeypatch)
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as auth_client:
        await _seed(auth_client, session_factory, monkeypatch)
        path_response = await auth_client.get("/api/v1/learning/path", params={"language_code": "om"})
        path = path_response.json()
    assert path["total_words"] == 2
    lesson = path["levels"][0]["lessons"][0]["id"]
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        words = (await client.get(f"/api/v1/learning/lessons/{lesson}/words", params={"language_code": "om"})).json()
    assert words["pagination"]["total"] == 2
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        dictionary = (await client.get("/api/v1/words", params={"language_code": "om"})).json()
        assert dictionary["meta"]["pagination"]["total_items"] == 2


@pytest.mark.anyio
async def test_draft_sentence_is_not_published(session_factory, mock_clerk, monkeypatch):
    app = _test_app(session_factory, monkeypatch)
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        _, _, sentence_id, _, _ = await _seed(client, session_factory, monkeypatch)
        with session_factory() as db:
            db.execute(text("UPDATE words SET status='draft' WHERE id=:id"), {"id": sentence_id})
            db.commit()
        response = await client.get(BASE, params={"language_code": "om"}, headers=AUTH_HEADERS)
        assert response.status_code == 200 and response.json()["exercises"] == []


def test_migration_preserves_existing_catalogue(db_engine):
    with db_engine.begin() as connection:
        connection.execute(text("DROP TABLE sentence_attempts"))
        connection.execute(text("DROP TABLE sentence_exercises"))
        connection.execute(text("ALTER TABLE generation_batches DROP COLUMN content_type"))
        original = connection.execute(text("SELECT COUNT(*) FROM words")).scalar_one()
        spec = importlib.util.spec_from_file_location("sentence_migration", Path("alembic/versions/0014_sentence_building.py"))
        migration = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(migration)
        with Operations.context(MigrationContext.configure(connection)):
            migration.upgrade()
        assert connection.execute(text("SELECT COUNT(*) FROM sentence_exercises")).scalar_one() == 0
        assert connection.execute(text("SELECT COUNT(*) FROM words")).scalar_one() == original
