"""Tests for the audio-review API endpoints.

All of these run against an isolated in-memory database with fake storage and
a fake speech client, so no production recording, object or row is touched.
"""

from __future__ import annotations

import uuid

import pytest
from sqlalchemy import text

from app.services import audio_batches as batches
from tests.conftest import make_word_record

BASE = "/api/audio-review"


# --------------------------------------------------
# Authorization
# --------------------------------------------------


def test_review_endpoints_require_a_key(anonymous_admin_client):
    response = anonymous_admin_client.get(f"{BASE}/summary")

    assert response.status_code == 401


def test_wrong_key_is_rejected(anonymous_admin_client):
    response = anonymous_admin_client.get(
        f"{BASE}/summary", headers={"X-Admin-Key": "not-the-key"}
    )

    assert response.status_code == 401


def test_admin_endpoints_are_disabled_without_configuration(
    client, monkeypatch
):
    from app.core.config import get_settings

    monkeypatch.setattr(get_settings(), "admin_api_key", None, raising=False)

    response = client.get(f"{BASE}/summary")

    assert response.status_code == 503


def test_health_endpoint_stays_public(client):
    assert client.get("/api/health").status_code == 200


# --------------------------------------------------
# Summary
# --------------------------------------------------


def test_summary_counts_recordings_by_status(
    admin_client, session_factory, seed_words, fake_storage
):
    with session_factory() as session:
        make_word_record(session, seed_words[0]["id"])
        make_word_record(
            session,
            seed_words[1]["id"],
            storage_key="afaan-oromoo/words/b/om-hawi-normal.mp3",
            status="approved",
        )
        make_word_record(
            session,
            seed_words[2]["id"],
            storage_key="afaan-oromoo/words/c/om-hawi-normal.mp3",
            status="rejected",
        )
        make_word_record(
            session,
            seed_words[3]["id"],
            storage_key=None,
            status="failed",
            generation_error="speech failed",
        )

    body = admin_client.get(f"{BASE}/summary").json()

    assert body["total_recordings"] == 4
    assert body["pending"] == 1
    assert body["approved"] == 1
    assert body["rejected"] == 1
    assert body["failed"] == 1
    # Every active recording -- including the failed attempt -- occupies the
    # slot for its word, so only untouched words remain eligible.
    assert body["remaining_eligible"] == len(seed_words) - 4
    assert body["running_batch"] is None


# --------------------------------------------------
# Listing and pagination
# --------------------------------------------------


@pytest.fixture()
def seeded_recordings(session_factory, seed_words):
    ids = []
    with session_factory() as session:
        ids.append(str(make_word_record(session, seed_words[0]["id"])))
        ids.append(
            str(
                make_word_record(
                    session,
                    seed_words[1]["id"],
                    storage_key="afaan-oromoo/words/b/om-hawi-normal.mp3",
                    status="approved",
                )
            )
        )
        ids.append(
            str(
                make_word_record(
                    session,
                    seed_words[2]["id"],
                    storage_key="afaan-oromoo/words/c/om-hawi-normal.mp3",
                    status="rejected",
                )
            )
        )
        ids.append(
            str(
                make_word_record(
                    session,
                    seed_words[3]["id"],
                    storage_key=None,
                    status="failed",
                    generation_error="Addis AI timeout",
                )
            )
        )

    return ids


def test_list_recordings_includes_vocabulary_metadata(
    admin_client, seeded_recordings
):
    body = admin_client.get(f"{BASE}/recordings").json()

    item = body["items"][0]

    assert item["text"]
    assert item["language_code"] == "om"
    assert item["speaker_id"] == "om-hawi"
    assert item["speed"] == "normal"
    assert item["status"]
    assert item["translations"][0]["meaning"].startswith("meaning")
    assert item["attempt"] == 1
    assert "storage_key" in item
    assert "has_audio" in item


def test_list_recordings_filters_by_status(
    admin_client, seeded_recordings
):
    body = admin_client.get(f"{BASE}/recordings", params={"status": "pending"}).json()

    assert body["total"] == 1
    assert body["items"][0]["status"] == "pending"


def test_list_recordings_filters_failed_generation(
    admin_client, seeded_recordings
):
    body = admin_client.get(
        f"{BASE}/recordings", params={"has_error": "true"}
    ).json()

    assert body["total"] == 1
    assert body["items"][0]["generation_error"] == "Addis AI timeout"
    assert body["items"][0]["storage_key"] is None


def test_list_recordings_filters_by_language_and_voice(
    admin_client, seeded_recordings
):
    assert (
        admin_client.get(
            f"{BASE}/recordings", params={"language_code": "om"}
        ).json()["total"]
        == 4
    )
    assert (
        admin_client.get(
            f"{BASE}/recordings", params={"language_code": "am"}
        ).json()["total"]
        == 0
    )
    assert (
        admin_client.get(
            f"{BASE}/recordings", params={"speaker_id": "om-hawi"}
        ).json()["total"]
        == 4
    )
    assert (
        admin_client.get(
            f"{BASE}/recordings", params={"speaker_id": "am-hamen"}
        ).json()["total"]
        == 0
    )


def test_list_recordings_rejects_unknown_status(admin_client):
    response = admin_client.get(
        f"{BASE}/recordings", params={"status": "nonsense"}
    )

    assert response.status_code == 400


def test_list_recordings_paginates(admin_client, seeded_recordings):
    first = admin_client.get(
        f"{BASE}/recordings", params={"page": 1, "page_size": 2}
    ).json()
    second = admin_client.get(
        f"{BASE}/recordings", params={"page": 2, "page_size": 2}
    ).json()

    assert first["total"] == 4
    assert len(first["items"]) == 2
    assert len(second["items"]) == 2
    assert first["total_pages"] == 2
    assert {i["id"] for i in first["items"]} & {i["id"] for i in second["items"]} == set()


def test_list_recordings_filters_by_batch(
    admin_client, session_factory, seed_words, fake_storage
):
    batch = batches.create_batch(session_factory(), batch_size=1)

    with session_factory() as session:
        make_word_record(session, seed_words[0]["id"], batch_id=batch["id"])
        make_word_record(session, seed_words[1]["id"])

    body = admin_client.get(
        f"{BASE}/recordings", params={"batch_id": str(batch["id"])}
    ).json()

    assert body["total"] == 1
    assert body["items"][0]["batch_id"] == str(batch["id"])


def test_superseded_recordings_are_hidden_by_default(
    admin_client, session_factory, seed_words, fake_storage, fake_addis
):
    word = seed_words[0]
    with session_factory() as session:
        original = make_word_record(session, word["id"])

    with session_factory() as session:
        batches.regenerate_recording(session, str(original), addis=fake_addis)

    default_page = admin_client.get(f"{BASE}/recordings").json()
    with_history = admin_client.get(
        f"{BASE}/recordings", params={"include_superseded": "true"}
    ).json()

    assert default_page["total"] == 1
    assert with_history["total"] == 2


# --------------------------------------------------
# Playback
# --------------------------------------------------


def test_audio_endpoint_returns_presigned_url(
    admin_client, session_factory, seed_words, fake_storage
):
    word = seed_words[0]
    key = f"afaan-oromoo/words/{word['id']}/om-hawi-normal.mp3"
    fake_storage.objects[key] = b"\xff\xfb audio"

    with session_factory() as session:
        recording_id = make_word_record(session, word["id"], storage_key=key)

    response = admin_client.get(f"{BASE}/recordings/{recording_id}/audio")

    assert response.status_code == 200

    body = response.json()
    assert body["url"].startswith("https://")
    assert body["expires_in"] > 0
    assert "om-hawi-normal.mp3" in body["url"]


def test_audio_endpoint_404s_for_unknown_recording(admin_client):
    assert (
        admin_client.get(f"{BASE}/recordings/{uuid.uuid4()}/audio").status_code
        == 404
    )


def test_audio_endpoint_conflicts_when_object_missing(
    admin_client, session_factory, seed_words, fake_storage
):
    with session_factory() as session:
        recording_id = make_word_record(session, seed_words[0]["id"])

    # Object was never uploaded (or has been removed).
    response = admin_client.get(f"{BASE}/recordings/{recording_id}/audio")

    assert response.status_code == 409
    assert "missing" in response.json()["detail"].lower()


def test_audio_endpoint_conflicts_for_failed_recording(
    admin_client, session_factory, seed_words, fake_storage
):
    with session_factory() as session:
        recording_id = make_word_record(
            session,
            seed_words[0]["id"],
            storage_key=None,
            status="failed",
            generation_error="boom",
        )

    response = admin_client.get(f"{BASE}/recordings/{recording_id}/audio")

    assert response.status_code == 409


# --------------------------------------------------
# Review actions
# --------------------------------------------------


def test_approve_sets_status_and_review_metadata(
    admin_client, session_factory, seed_words, fake_storage
):
    with session_factory() as session:
        recording_id = make_word_record(session, seed_words[0]["id"])

    response = admin_client.post(f"{BASE}/recordings/{recording_id}/approve")

    assert response.status_code == 200

    recording = response.json()["recording"]
    assert recording["status"] == "approved"
    assert recording["reviewed_at"] is not None
    assert recording["reviewed_by"] == "tester"


def test_approve_rejects_unknown_recording(admin_client):
    response = admin_client.post(
        f"{BASE}/recordings/{uuid.uuid4()}/approve"
    )

    assert response.status_code == 409


def test_approve_rejects_failed_recording(
    admin_client, session_factory, seed_words, fake_storage
):
    with session_factory() as session:
        recording_id = make_word_record(
            session,
            seed_words[0]["id"],
            storage_key=None,
            status="failed",
            generation_error="boom",
        )

    response = admin_client.post(f"{BASE}/recordings/{recording_id}/approve")

    assert response.status_code == 409


def test_reject_stores_reason_and_metadata(
    admin_client, session_factory, seed_words, fake_storage
):
    with session_factory() as session:
        recording_id = make_word_record(session, seed_words[0]["id"])

    response = admin_client.post(
        f"{BASE}/recordings/{recording_id}/reject",
        json={"reason": "pronunciation is clipped"},
    )

    assert response.status_code == 200

    recording = response.json()["recording"]
    assert recording["status"] == "rejected"
    assert recording["rejection_reason"] == "pronunciation is clipped"
    assert recording["reviewed_by"] == "tester"


def test_reject_without_reason_is_allowed(
    admin_client, session_factory, seed_words, fake_storage
):
    with session_factory() as session:
        recording_id = make_word_record(session, seed_words[0]["id"])

    response = admin_client.post(f"{BASE}/recordings/{recording_id}/reject")

    assert response.status_code == 200
    assert response.json()["recording"]["rejection_reason"] is None


def test_double_approval_conflicts(
    admin_client, session_factory, seed_words, fake_storage
):
    with session_factory() as session:
        recording_id = make_word_record(
            session,
            seed_words[0]["id"],
            status="approved",
        )

    response = admin_client.post(f"{BASE}/recordings/{recording_id}/approve")

    assert response.status_code == 409


# --------------------------------------------------
# Regeneration
# --------------------------------------------------


def test_regenerate_returns_replacement_as_pending(
    admin_client,
    session_factory,
    seed_words,
    fake_storage,
    fake_addis,
    monkeypatch,
):
    word = seed_words[0]
    with session_factory() as session:
        recording_id = make_word_record(session, word["id"])

    response = admin_client.post(
        f"{BASE}/recordings/{recording_id}/regenerate"
    )

    assert response.status_code == 202

    with session_factory() as session:
        replacement = session.execute(
            text(
                "SELECT * FROM audio_recordings WHERE word_id = :id "
                "AND superseded_at IS NULL"
            ),
            {"id": word["id"]},
        ).mappings().one()

        original = session.execute(
            text("SELECT * FROM audio_recordings WHERE id = :id"),
            {"id": recording_id},
        ).mappings().one()

    assert replacement["status"] == "pending"
    assert replacement["attempt"] == 2
    assert replacement["storage_key"].endswith("-a2.mp3")
    assert original["superseded_at"] is not None


def test_regenerate_preserves_original_when_generation_fails(
    admin_client,
    session_factory,
    seed_words,
    fake_storage,
    fake_addis,
):
    word = seed_words[0]

    with session_factory() as session:
        recording_id = make_word_record(session, word["id"])
        original_key = str(
            session.execute(
                text("SELECT storage_key FROM audio_recordings WHERE id = :id"),
                {"id": recording_id},
            ).scalar_one()
        )

    fake_storage.objects[original_key] = b"\xff\xfb original"
    fake_addis.voice.fail_for.add(f"{word['text']}..")

    admin_client.post(f"{BASE}/recordings/{recording_id}/regenerate")

    with session_factory() as session:
        active = session.execute(
            text(
                "SELECT * FROM audio_recordings WHERE word_id = :id "
                "AND superseded_at IS NULL"
            ),
            {"id": word["id"]},
        ).mappings().one()

    assert str(active["id"]) == str(recording_id)
    assert active["status"] == "pending"
    assert active["storage_key"] == original_key
    assert original_key in fake_storage.objects


def test_regenerate_unknown_recording_returns_404(admin_client):
    response = admin_client.post(
        f"{BASE}/recordings/{uuid.uuid4()}/regenerate"
    )

    assert response.status_code == 404


# --------------------------------------------------
# Batches
# --------------------------------------------------


def test_start_batch_runs_generation_in_the_background(
    admin_client,
    session_factory,
    seed_words,
    fake_storage,
    fake_addis,
    monkeypatch,
):
    # BackgroundTasks use the app's SessionLocal, so point it at the test DB.
    from app.api.v1.endpoints import recordings as endpoint_module
    from sqlalchemy.orm import sessionmaker

    monkeypatch.setattr(
        endpoint_module, "SessionLocal", sessionmaker(bind=session_factory.kw["bind"])
    )

    response = admin_client.post(
        f"{BASE}/batches", json={"batch_size": 2}
    )

    assert response.status_code == 202

    batch_id = response.json()["id"]

    state = admin_client.get(f"{BASE}/batches/{batch_id}").json()
    assert state["status"] == "completed"
    assert state["generated_count"] == 2
    assert state["pending_review"] == 2
    assert state["total_selected"] == 2


def test_start_batch_rejects_invalid_size(admin_client):
    assert admin_client.post(f"{BASE}/batches", json={"batch_size": 0}).status_code == 422
    assert (
        admin_client.post(f"{BASE}/batches", json={"batch_size": 10_000}).status_code
        == 422
    )


def test_start_batch_conflicts_when_one_is_running(
    admin_client, session_factory, seed_words, fake_storage, fake_addis
):
    batches.create_batch(session_factory(), batch_size=2)

    response = admin_client.post(f"{BASE}/batches", json={"batch_size": 2})

    assert response.status_code == 409


def test_start_batch_conflicts_when_nothing_is_eligible(
    admin_client,
    session_factory,
    seed_words,
    fake_storage,
    fake_addis,
    monkeypatch,
):
    from app.api.v1.endpoints import recordings as endpoint_module
    from sqlalchemy.orm import sessionmaker

    monkeypatch.setattr(
        endpoint_module, "SessionLocal", sessionmaker(bind=session_factory.kw["bind"])
    )

    batches.run_batch(
        session_factory,
        str(
            batches.create_batch(session_factory(), batch_size=100)["id"]
        ),
        addis=fake_addis,
    )

    response = admin_client.post(f"{BASE}/batches", json={"batch_size": 100})

    assert response.status_code == 409
    assert "No eligible vocabulary" in response.json()["detail"]


def test_batch_status_reports_progress_and_completion(
    admin_client, session_factory, seed_words, fake_storage, fake_addis
):
    batch = batches.create_batch(session_factory(), batch_size=3)
    batches.run_batch(session_factory, str(batch["id"]), addis=fake_addis)

    body = admin_client.get(f"{BASE}/batches/{batch['id']}").json()

    assert body["status"] == "completed"
    assert body["total_selected"] == 3
    assert body["generated_count"] == 3
    assert body["pending_review"] == 3
    assert body["approved"] == 0
    assert body["rejected"] == 0
    assert body["failed"] == 0
    assert body["complete"] is False  # still awaiting review

    with session_factory() as session:
        session.execute(
            text("UPDATE audio_recordings SET status = 'approved' "
                 "WHERE batch_id = :batch_id"),
            {"batch_id": batch["id"]},
        )
        session.commit()

    reviewed = admin_client.get(f"{BASE}/batches/{batch['id']}").json()
    assert reviewed["complete"] is True


def test_batch_list_includes_running_batch(
    admin_client, session_factory, seed_words, fake_storage
):
    batches.create_batch(session_factory(), batch_size=2)

    body = admin_client.get(f"{BASE}/batches").json()

    assert body["running"] is not None
    assert body["running"]["status"] == "running"
    assert body["batches"][0]["id"] == body["running"]["id"]


def test_start_batch_does_not_leave_an_empty_running_batch(
    admin_client,
    session_factory,
    seed_words,
    fake_storage,
    fake_addis,
    monkeypatch,
):
    """A refused start must not create a stuck 'running' row."""
    from app.api.v1.endpoints import recordings as endpoint_module
    from sqlalchemy.orm import sessionmaker

    monkeypatch.setattr(
        endpoint_module, "SessionLocal", sessionmaker(bind=session_factory.kw["bind"])
    )

    batches.run_batch(
        session_factory,
        str(batches.create_batch(session_factory(), batch_size=100)["id"]),
        addis=fake_addis,
    )

    with session_factory() as session:
        session.execute(
            text("UPDATE generation_batches SET status = 'completed' "
                 "WHERE status = 'running'")
        )
        session.commit()

    response = admin_client.post(f"{BASE}/batches", json={"batch_size": 10})

    assert response.status_code == 409

    with session_factory() as session:
        rows = session.execute(
            text("SELECT status FROM generation_batches")
        ).all()

    assert all(row[0] != "running" for row in rows)


def test_abandoned_batch_is_closed_and_does_not_block(
    admin_client, session_factory, seed_words, fake_storage, fake_addis
):
    """A batch left running by a dead worker is failed, not blocking."""
    stuck = batches.create_batch(session_factory(), batch_size=5)

    with session_factory() as session:
        session.execute(
            text(
                "UPDATE generation_batches SET started_at = :old, "
                "created_at = :old WHERE id = :id"
            ),
            {
                "old": "2020-01-01 00:00:00+00",
                "id": stuck["id"],
            },
        )
        session.commit()

    batches.fail_abandoned_batches(session_factory())

    with session_factory() as session:
        state = batches.get_batch(session, str(stuck["id"]))
        running = batches.get_running_batch(session)

    assert state["status"] == "failed"
    assert state["error"]
    assert running is None


def test_fresh_running_batch_is_not_closed(
    session_factory, seed_words, fake_storage
):
    batch = batches.create_batch(session_factory(), batch_size=5)

    batches.fail_abandoned_batches(session_factory())

    with session_factory() as session:
        assert batches.get_batch(session, str(batch["id"]))["status"] == "running"


def test_summary_auto_recovers_a_stuck_running_batch(
    admin_client, session_factory, seed_words, fake_storage
):
    """The dashboard must not show 'batch running' for a dead worker."""
    stuck = batches.create_batch(session_factory(), batch_size=5)

    with session_factory() as session:
        session.execute(
            text(
                "UPDATE generation_batches SET started_at = :old, "
                "created_at = :old WHERE id = :id"
            ),
            {"old": "2020-01-01 00:00:00+00", "id": stuck["id"]},
        )
        session.commit()

    body = admin_client.get(f"{BASE}/summary").json()

    assert body["running_batch"] is None
    assert batches.get_batch(session_factory(), str(stuck["id"]))["status"] == "failed"


def test_cancel_batch_releases_the_configuration(
    admin_client, session_factory, seed_words, fake_storage, fake_addis
):
    """Cancelling a stuck batch lets a new one start."""
    stuck = batches.create_batch(session_factory(), batch_size=5)

    response = admin_client.post(f"{BASE}/batches/{stuck['id']}/cancel")

    assert response.status_code == 200
    assert response.json()["status"] == "failed"

    fresh = batches.create_batch(session_factory(), batch_size=5)
    assert str(fresh["id"]) != str(stuck["id"])


def test_cancel_unknown_batch_returns_404(admin_client):
    response = admin_client.post(f"{BASE}/batches/{uuid.uuid4()}/cancel")

    assert response.status_code == 404


def test_cancel_finished_batch_conflicts(
    admin_client, session_factory, seed_words, fake_storage
):
    batch = batches.create_batch(session_factory(), batch_size=5)

    with session_factory() as session:
        session.execute(
            text("UPDATE generation_batches SET status = 'completed' WHERE id = :id"),
            {"id": batch["id"]},
        )
        session.commit()

    response = admin_client.post(f"{BASE}/batches/{batch['id']}/cancel")

    assert response.status_code == 409


def test_unknown_batch_returns_404(admin_client):
    assert admin_client.get(f"{BASE}/batches/{uuid.uuid4()}").status_code == 404


def test_batches_do_not_chain_automatically(
    admin_client,
    session_factory,
    seed_words,
    fake_storage,
    fake_addis,
    monkeypatch,
):
    """Finishing one batch must not start another."""
    from app.api.v1.endpoints import recordings as endpoint_module
    from sqlalchemy.orm import sessionmaker

    monkeypatch.setattr(
        endpoint_module, "SessionLocal", sessionmaker(bind=session_factory.kw["bind"])
    )

    admin_client.post(f"{BASE}/batches", json={"batch_size": 2})

    with session_factory() as session:
        total_batches = int(
            session.execute(text("SELECT COUNT(*) FROM generation_batches")).scalar_one()
        )
        running = int(
            session.execute(
                text("SELECT COUNT(*) FROM generation_batches WHERE status = 'running'")
            ).scalar_one()
        )

    assert total_batches == 1
    assert running == 0


def test_retry_endpoint_queues_failed_items(
    admin_client,
    session_factory,
    seed_words,
    fake_storage,
    fake_addis,
    monkeypatch,
):
    from app.api.v1.endpoints import recordings as endpoint_module
    from sqlalchemy.orm import sessionmaker

    monkeypatch.setattr(
        endpoint_module, "SessionLocal", sessionmaker(bind=session_factory.kw["bind"])
    )

    word = seed_words[0]
    with session_factory() as session:
        failed_id = make_word_record(
            session,
            word["id"],
            storage_key=None,
            status="failed",
            generation_error="boom",
        )

    response = admin_client.post(
        f"{BASE}/recordings/retry", json={"recording_ids": [str(failed_id)]}
    )

    assert response.status_code == 200
    assert response.json()["retried"] == 1

    with session_factory() as session:
        active = session.execute(
            text(
                "SELECT * FROM audio_recordings WHERE word_id = :id "
                "AND superseded_at IS NULL"
            ),
            {"id": word["id"]},
        ).mappings().one()

    assert active["status"] == "pending"
    assert active["storage_key"] is not None
    assert active["attempt"] == 2