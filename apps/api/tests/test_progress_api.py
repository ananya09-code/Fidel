"""Tests for authenticated, user-isolated lesson progress."""

from __future__ import annotations

from uuid import uuid4

from sqlalchemy import text

from tests.conftest import AUTH_HEADERS

BASE = "/api/v1/progress"


def start_payload(question_count: int = 2) -> dict[str, object]:
    return {
        "difficulty": "beginner",
        "category_key": "greetings",
        "category_label": "Greetings",
        "difficulty_label": "Beginner",
        "question_count": question_count,
    }


def start(auth_client, lesson: str = "om-beginner-greetings", count: int = 2):
    return auth_client.post(
        f"{BASE}/lessons/{lesson}/start",
        headers=AUTH_HEADERS,
        json=start_payload(count),
    )


def test_progress_requires_authentication(auth_client, mock_clerk):
    mock_clerk(user_id="")
    response = auth_client.get(BASE)
    assert response.status_code == 401


def test_empty_progress_does_not_create_a_user(auth_client, mock_clerk, session_factory):
    response = auth_client.get(BASE, headers=AUTH_HEADERS)
    assert response.status_code == 200
    assert response.json() == {
        "lessons_completed": 0,
        "questions_answered": 0,
        "correct_answers": 0,
        "completed_lesson_keys": [],
        "practiced_word_ids_by_lesson": {},
        "in_progress": [],
    }
    with session_factory() as session:
        assert session.execute(text("SELECT COUNT(*) FROM users")).scalar_one() == 0


def test_start_resumes_and_checkpoints_lesson(auth_client, mock_clerk):
    created = start(auth_client)
    assert created.status_code == 200
    attempt = created.json()
    assert attempt["stage"] == "vocabulary"
    assert attempt["question_index"] == 0

    resumed = start(auth_client)
    assert resumed.status_code == 200
    assert resumed.json()["id"] == attempt["id"]

    checkpoint = auth_client.patch(
        f"{BASE}/attempts/{attempt['id']}",
        headers=AUTH_HEADERS,
        json={"stage": "vocabulary", "question_index": 1},
    )
    assert checkpoint.status_code == 200
    assert checkpoint.json()["question_index"] == 1

    loaded = auth_client.get(
        f"{BASE}/lessons/om-beginner-greetings", headers=AUTH_HEADERS
    )
    assert loaded.status_code == 200
    assert loaded.json()["id"] == attempt["id"]
    assert loaded.json()["question_index"] == 1


def test_answers_are_idempotent_and_completion_is_persisted(auth_client, mock_clerk, session_factory):
    attempt = start(auth_client).json()
    first_word = uuid4()
    wrong_word = uuid4()
    second_word = uuid4()
    seed_lesson_words(session_factory, [first_word, second_word])

    first = auth_client.put(
        f"{BASE}/attempts/{attempt['id']}/answers",
        headers=AUTH_HEADERS,
        json={
            "question_id": str(first_word),
            "word_id": str(first_word),
            "selected_word_id": str(wrong_word),
            "question_index": 0,
        },
    )
    assert first.status_code == 200
    assert first.json()["correct_count"] == 0

    corrected = auth_client.put(
        f"{BASE}/attempts/{attempt['id']}/answers",
        headers=AUTH_HEADERS,
        json={
            "question_id": str(first_word),
            "word_id": str(first_word),
            "selected_word_id": str(first_word),
            "question_index": 0,
        },
    )
    assert corrected.status_code == 200
    assert corrected.json()["correct_count"] == 1
    assert len(corrected.json()["answers"]) == 1

    second = auth_client.put(
        f"{BASE}/attempts/{attempt['id']}/answers",
        headers=AUTH_HEADERS,
        json={
            "question_id": str(second_word),
            "word_id": str(second_word),
            "selected_word_id": str(second_word),
            "question_index": 1,
        },
    )
    assert second.status_code == 200

    completed = auth_client.post(
        f"{BASE}/attempts/{attempt['id']}/complete", headers=AUTH_HEADERS
    )
    assert completed.status_code == 200
    assert completed.json()["status"] == "completed"
    assert completed.json()["completed_at"] is not None

    summary = auth_client.get(BASE, headers=AUTH_HEADERS).json()
    assert summary["lessons_completed"] == 1
    assert summary["questions_answered"] == 2
    assert summary["correct_answers"] == 2
    assert summary["completed_lesson_keys"] == ["om-beginner-greetings"]
    assert summary["in_progress"] == []


def seed_lesson_words(session_factory, word_ids):
    with session_factory() as session:
        for word_id in word_ids:
            session.execute(text("""
                INSERT INTO words (id, language_code, text, category, difficulty, status)
                VALUES (:id, 'om', :text, 'greetings', 'beginner', 'approved')
            """), {"id": word_id, "text": str(word_id)})
        session.commit()


def finish_session(auth_client, word_ids, *, selected_word_id=None):
    attempt = start(auth_client, count=len(word_ids)).json()
    for index, word_id in enumerate(word_ids):
        response = auth_client.put(
            f"{BASE}/attempts/{attempt['id']}/answers",
            headers=AUTH_HEADERS,
            json={
                "question_id": str(word_id), "word_id": str(word_id),
                "selected_word_id": str(selected_word_id or word_id),
                "question_index": index,
            },
        )
        assert response.status_code == 200
    response = auth_client.post(
        f"{BASE}/attempts/{attempt['id']}/complete", headers=AUTH_HEADERS
    )
    assert response.status_code == 200


def test_category_completes_only_after_all_words_across_sessions(
    auth_client, mock_clerk, session_factory,
):
    words = [uuid4() for _ in range(3)]
    seed_lesson_words(session_factory, words)
    finish_session(auth_client, words[:2])
    summary = auth_client.get(BASE, headers=AUTH_HEADERS).json()
    assert summary["completed_lesson_keys"] == []
    assert summary["practiced_word_ids_by_lesson"] == {
        "om-beginner-greetings": sorted(map(str, words[:2]))
    }
    assert auth_client.get("/api/v1/dashboard", headers=AUTH_HEADERS).json()["lessons_completed"] == 0

    # Repeating words does not fill in the missing word.
    finish_session(auth_client, words[:2])
    assert auth_client.get(BASE, headers=AUTH_HEADERS).json()["lessons_completed"] == 0

    # Even an incorrect answer finishes practice; it remains a word to review.
    finish_session(auth_client, words[2:], selected_word_id=words[0])
    assert auth_client.get(BASE, headers=AUTH_HEADERS).json()["completed_lesson_keys"] == ["om-beginner-greetings"]
    assert auth_client.get("/api/v1/dashboard", headers=AUTH_HEADERS).json()["lessons_completed"] == 1

    # Newly approved vocabulary makes the lesson unfinished without rewriting history.
    seed_lesson_words(session_factory, [uuid4()])
    assert auth_client.get(BASE, headers=AUTH_HEADERS).json()["lessons_completed"] == 0


def test_coverage_ignores_other_users_distractors_and_foreign_words(
    auth_client, mock_clerk, session_factory,
):
    first, second, foreign = uuid4(), uuid4(), uuid4()
    seed_lesson_words(session_factory, [first, second, foreign])
    with session_factory() as session:
        session.execute(text("UPDATE words SET category = 'family' WHERE id = :id"), {"id": foreign})
        session.commit()
    mock_clerk(user_id="user_one")
    finish_session(auth_client, [first], selected_word_id=second)
    finish_session(auth_client, [foreign])
    mock_clerk(user_id="user_two")
    finish_session(auth_client, [second])
    for user_id, expected in (("user_one", first), ("user_two", second)):
        mock_clerk(user_id=user_id)
        summary = auth_client.get(BASE, headers=AUTH_HEADERS).json()
        assert summary["lessons_completed"] == 0
        assert summary["practiced_word_ids_by_lesson"] == {"om-beginner-greetings": [str(expected)]}


def test_lesson_pages_include_all_normalized_difficulties(
    auth_client, mock_clerk, session_factory, monkeypatch,
):
    from app.api.v1.endpoints import learning

    monkeypatch.setattr(learning, "SessionLocal", session_factory)
    words = [uuid4() for _ in range(55)]
    seed_lesson_words(session_factory, words)
    with session_factory() as session:
        session.execute(text("UPDATE words SET difficulty = 'easy' WHERE id = :id"), {"id": words[-1]})
        session.commit()
    returned = []
    for offset in (0, 50):
        response = auth_client.get(
            "/api/v1/learning/lessons/om-beginner-greetings/words",
            params={"language_code": "om", "limit": 50, "offset": offset},
        )
        assert response.status_code == 200
        assert response.json()["lesson"]["word_count"] == 55
        returned.extend(word["id"] for word in response.json()["words"])
    assert set(returned) == set(map(str, words))
    assert len(returned) == 55


def test_incomplete_lesson_cannot_be_completed(auth_client, mock_clerk):
    attempt = start(auth_client).json()
    response = auth_client.post(
        f"{BASE}/attempts/{attempt['id']}/complete", headers=AUTH_HEADERS
    )
    assert response.status_code == 409


def test_attempts_are_isolated_between_users(auth_client, mock_clerk):
    mock_clerk(user_id="user_one")
    first = start(auth_client).json()

    mock_clerk(user_id="user_two")
    second = start(auth_client).json()
    assert second["id"] != first["id"]

    forbidden_read = auth_client.patch(
        f"{BASE}/attempts/{first['id']}",
        headers=AUTH_HEADERS,
        json={"stage": "practice", "question_index": 0},
    )
    assert forbidden_read.status_code == 404

    second_summary = auth_client.get(BASE, headers=AUTH_HEADERS).json()
    assert [item["id"] for item in second_summary["in_progress"]] == [second["id"]]

    mock_clerk(user_id="user_one")
    first_summary = auth_client.get(BASE, headers=AUTH_HEADERS).json()
    assert [item["id"] for item in first_summary["in_progress"]] == [first["id"]]


def test_checkpoint_rejects_index_past_question_count(auth_client, mock_clerk):
    attempt = start(auth_client).json()
    response = auth_client.patch(
        f"{BASE}/attempts/{attempt['id']}",
        headers=AUTH_HEADERS,
        json={"stage": "vocabulary", "question_index": 3},
    )
    assert response.status_code == 422


def test_late_checkpoint_cannot_move_progress_backward(auth_client, mock_clerk):
    attempt = start(auth_client).json()
    for index in (1, 0):
        response = auth_client.patch(
            f"{BASE}/attempts/{attempt['id']}",
            headers=AUTH_HEADERS,
            json={"stage": "vocabulary", "question_index": index},
        )
        assert response.status_code == 200
    assert response.json()["question_index"] == 1

