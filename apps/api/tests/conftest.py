"""Pytest configuration for the Fidel API."""

from pathlib import Path
from typing import Generator

import pytest
from fastapi.testclient import TestClient

from app.main import create_app

API_ROOT = Path(__file__).parent

# Test-only administrative key. Never a real credential.
TEST_ADMIN_KEY = "test-admin-key"

# Test-only Clerk configuration. No network request is made in the test suite.
TEST_CLERK_ISSUER = "https://clerk.example.test"
AUTH_HEADERS = {"Authorization": "Bearer test-session-token"}


@pytest.fixture(scope="session")
def client() -> Generator[TestClient, None, None]:
    """Provide a synchronous test client bound to the ASGI app."""
    with TestClient(create_app()) as test_client:
        yield test_client


@pytest.fixture()
def db_engine():
    """An isolated in-memory database containing the review schema."""
    from tests.support_schema import create_test_engine

    engine = create_test_engine()

    yield engine

    engine.dispose()


@pytest.fixture()
def session_factory(db_engine):
    """Session factory bound to the isolated database."""
    from sqlalchemy.orm import sessionmaker

    return sessionmaker(bind=db_engine, autoflush=False, autocommit=False)


@pytest.fixture()
def db_session(session_factory):
    """A session on the isolated database."""
    with session_factory() as session:
        yield session


@pytest.fixture(autouse=True)
def isolate_app_session_local(session_factory, monkeypatch, request):
    """Point the endpoint module at the isolated database for every test.

    Background tasks run after the response with the module-level
    ``SessionLocal``; without this they would reach the real Neon database.
    """
    if "db_engine" not in request.fixturenames and "session_factory" not in request.fixturenames:
        # Tests that do not use the database at all still get a valid object.
        pass

    from app.api.v1.endpoints import recordings as endpoint_module

    monkeypatch.setattr(endpoint_module, "SessionLocal", session_factory)


@pytest.fixture()
def admin_client(client, session_factory, monkeypatch):
    """Test client wired to the isolated database with a valid admin key."""
    from app.api.v1.endpoints import recordings
    from app.core.config import get_settings

    settings = get_settings()
    monkeypatch.setattr(settings, "admin_api_key", TEST_ADMIN_KEY, raising=False)

    def override_get_db():
        with session_factory() as session:
            yield session

    client.app.dependency_overrides[recordings.get_db] = override_get_db
    client.app.dependency_overrides[recordings.require_admin] = lambda: "tester"

    client.headers.update({"X-Admin-Key": TEST_ADMIN_KEY})

    try:
        yield client
    finally:
        client.app.dependency_overrides.clear()
        client.headers.pop("X-Admin-Key", None)


@pytest.fixture()
def anonymous_admin_client(client, session_factory, monkeypatch):
    """Test client on the isolated database without a valid admin key."""
    from app.api.v1.endpoints import recordings
    from app.core.config import get_settings

    settings = get_settings()
    monkeypatch.setattr(settings, "admin_api_key", TEST_ADMIN_KEY, raising=False)

    def override_get_db():
        with session_factory() as session:
            yield session

    client.app.dependency_overrides[recordings.get_db] = override_get_db

    try:
        yield client
    finally:
        client.app.dependency_overrides.clear()


@pytest.fixture()
def auth_client(client, session_factory, monkeypatch):
    """Test client with Clerk configured and the profile DB isolated."""

    from pydantic import SecretStr

    from app.api.v1.endpoints import auth as endpoint_module
    from app.api.v1.endpoints import preferences as preferences_module
    from app.api.v1.endpoints import progress as progress_module
    from app.api.v1.endpoints import vocabulary as vocabulary_module
    from app.api.v1.endpoints import reviews as reviews_module
    from app.api.v1.endpoints import dashboard as dashboard_module
    from app.core.config import get_settings
    from app.services.clerk_users import ClerkProfileData

    settings = get_settings()
    monkeypatch.setattr(
        settings, "clerk_secret_key", SecretStr("sk_test"), raising=False
    )
    monkeypatch.setattr(settings, "clerk_issuer", TEST_CLERK_ISSUER, raising=False)
    monkeypatch.setattr(settings, "clerk_jwt_key", None, raising=False)
    monkeypatch.setattr(
        settings, "clerk_authorized_parties", None, raising=False
    )

    def override_get_db():
        with session_factory() as session:
            yield session

    client.app.dependency_overrides[endpoint_module.get_db] = override_get_db
    client.app.dependency_overrides[preferences_module.get_db] = override_get_db
    client.app.dependency_overrides[progress_module.get_db] = override_get_db
    client.app.dependency_overrides[vocabulary_module.get_db] = override_get_db
    client.app.dependency_overrides[reviews_module.get_db] = override_get_db
    client.app.dependency_overrides[dashboard_module.get_db] = override_get_db
    monkeypatch.setattr(
        endpoint_module,
        "fetch_clerk_profile",
        lambda user_id, secret_key: ClerkProfileData(
            email=f"{user_id}@example.test",
            first_name="Test",
            last_name="Learner",
            username=user_id,
            image_url="https://images.example.test/avatar.png",
        ),
    )

    try:
        yield client
    finally:
        client.app.dependency_overrides.clear()
        client.headers.pop("Authorization", None)


@pytest.fixture()
def mock_clerk(monkeypatch):
    """Install a fake Clerk verifier; return a function to change its state."""

    from app.core import clerk_auth
    from clerk_backend_api.security import (
        AuthErrorReason,
        AuthStatus,
        RequestState,
    )

    def install(
        user_id: str = "user_test",
        issuer: str = TEST_CLERK_ISSUER,
        reason=None,
    ) -> None:
        if user_id:
            state = RequestState(
                status=AuthStatus.SIGNED_IN,
                token="test-session-token",
                payload={
                    "sub": user_id,
                    "sid": "sess_test",
                    "iss": issuer,
                },
            )
        else:
            state = RequestState(
                status=AuthStatus.SIGNED_OUT,
                reason=reason or AuthErrorReason.SESSION_TOKEN_MISSING,
            )

        monkeypatch.setattr(
            clerk_auth,
            "authenticate_request",
            lambda request, options: state,
        )

    install()
    return install


@pytest.fixture()
def fake_storage(monkeypatch):
    """Replace object storage with an in-memory fake."""
    import app.services.audio_batches as batches
    import app.services.storage as storage

    class FakeStorage:
        def __init__(self) -> None:
            self.objects: dict[str, bytes] = {}
            self.fail_upload_for: set[str] = set()
            self.deleted: list[str] = []

        def upload_audio(self, file_path, storage_key):
            from pathlib import Path

            if any(token in str(file_path) for token in self.fail_upload_for):
                raise RuntimeError(f"upload rejected for {file_path}")

            self.objects[storage_key] = Path(file_path).read_bytes()
            return storage_key

        def delete_audio(self, storage_key):
            self.deleted.append(storage_key)
            self.objects.pop(storage_key, None)

        def audio_exists(self, storage_key):
            return storage_key in self.objects

        def generate_audio_url(self, storage_key, expires_in=3600):
            return f"https://example.invalid/{storage_key}?expires={expires_in}"

    fake = FakeStorage()

    monkeypatch.setattr(batches, "upload_audio", fake.upload_audio)
    monkeypatch.setattr(batches, "delete_audio", fake.delete_audio)
    monkeypatch.setattr(batches, "audio_exists", fake.audio_exists)
    monkeypatch.setattr(storage, "audio_exists", fake.audio_exists)
    monkeypatch.setattr(storage, "generate_audio_url", fake.generate_audio_url)

    # The endpoint module imports these names directly, so patch them there
    # too, otherwise real object storage would be contacted.
    from app.api.v1.endpoints import recordings as endpoint_module

    monkeypatch.setattr(endpoint_module, "audio_exists", fake.audio_exists, raising=False)
    monkeypatch.setattr(
        endpoint_module,
        "generate_audio_url",
        fake.generate_audio_url,
        raising=False,
    )

    return fake


@pytest.fixture()
def fake_addis(monkeypatch):
    """Replace Addis AI with a fake client that writes a small MP3."""
    import app.services.audio_batches as batches
    import app.services.speech as speech

    class FakeClip:
        def __init__(self, path):
            self.path = path

        def to_file(self, target):
            with open(target, "wb") as handle:
                handle.write(b"\xff\xfb" + b"\x00" * 2048)

        duration_seconds = 1.25

    class FakeVoice:
        def __init__(self):
            self.calls: list[dict] = []
            self.fail_for: set[str] = set()

        def generate(self, *, voice_id, text, language, output_format):
            self.calls.append(
                {
                    "voice_id": voice_id,
                    "text": text,
                    "language": language,
                    "output_format": output_format,
                }
            )

            if text in self.fail_for:
                raise RuntimeError(f"Addis AI failed for {text!r}")

            return FakeClip(None)

    class FakeAddis:
        def __init__(self):
            self.voice = FakeVoice()

    fake = FakeAddis()

    monkeypatch.setattr(batches, "create_addis_client", lambda *a, **k: fake)
    monkeypatch.setattr(speech, "create_addis_client", lambda *a, **k: fake)
    monkeypatch.setattr(
        batches,
        "generate_mp3",
        lambda client, speech_text, output_path, voice_id: speech.generate_mp3(
            client, speech_text, output_path, voice_id
        ),
    )

    return fake


@pytest.fixture()
def seed_words(session_factory):
    """Insert vocabulary entries and return them."""
    import uuid

    from sqlalchemy import text

    created: list[dict] = []

    with session_factory() as session:
        for index in range(12):
            word_id = uuid.uuid4()
            content_type = "word" if index % 3 == 0 else "phrase"
            text_value = (
                f"word{index}" if content_type == "word" else f"word{index} jirta"
            )

            session.execute(
                text("""
                    INSERT INTO words (
                        id, language_code, text, content_type,
                        difficulty, status, created_at
                    )
                    VALUES (
                        :id, 'om', :text, :content_type,
                        'beginner', 'draft', :created_at
                    )
                """),
                {
                    "id": word_id,
                    "text": text_value,
                    "content_type": content_type,
                    "created_at": f"2026-01-01 00:00:{index:02d}+00",
                },
            )
            session.execute(
                text("""
                    INSERT INTO word_translations (
                        id, word_id, language_code, meaning
                    )
                    VALUES (:id, :word_id, 'en', :meaning)
                """),
                {
                    "id": uuid.uuid4(),
                    "word_id": word_id,
                    "meaning": f"meaning {index}",
                },
            )

            created.append(
                {
                    "id": word_id,
                    "text": text_value,
                    "content_type": content_type,
                }
            )

        session.commit()

    return created


def make_word_record(
    session,
    word_id,
    storage_key: str = "afaan-oromoo/words/test/om-hawi-normal.mp3",
    status: str = "pending",
    speaker_id: str = "om-hawi",
    speed: str = "normal",
    attempt: int = 1,
    batch_id=None,
    generation_error: str | None = None,
):
    """Insert an audio_recordings row directly."""
    import uuid

    from sqlalchemy import text

    recording_id = uuid.uuid4()

    session.execute(
        text("""
            INSERT INTO audio_recordings (
                id, word_id, storage_key, speaker_id, speed, duration_ms,
                status, batch_id, attempt, generation_error
            )
            VALUES (
                :id, :word_id, :storage_key, :speaker_id, :speed, 1000,
                :status, :batch_id, :attempt, :generation_error
            )
        """),
        {
            "id": recording_id,
            "word_id": word_id,
            "storage_key": storage_key,
            "speaker_id": speaker_id,
            "speed": speed,
            "status": status,
            "batch_id": batch_id,
            "attempt": attempt,
            "generation_error": generation_error,
        },
    )
    session.commit()

    return recording_id
