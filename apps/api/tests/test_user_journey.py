"""End-to-end persistence test for the complete authenticated learner journey."""

from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import text

from tests.conftest import AUTH_HEADERS


def test_complete_journey_persists_and_is_user_isolated(
    auth_client, mock_clerk, session_factory
):
    now = datetime.now(timezone.utc)
    word_ids = [uuid4(), uuid4()]
    with session_factory() as session:
        for index, word_id in enumerate(word_ids):
            session.execute(
                text(
                    """
                    INSERT INTO words (
                      id, language_code, text, content_type, category,
                      difficulty, status, created_at
                    ) VALUES (
                      :id, 'om', :word, 'word', 'journey',
                      'beginner', 'approved', :now
                    )
                    """
                ),
                {"id": word_id, "word": f"journey{index}", "now": now},
            )
            session.execute(
                text(
                    """
                    INSERT INTO word_translations (
                      id, word_id, language_code, meaning, created_at
                    ) VALUES (:id, :word_id, 'en', :meaning, :now)
                    """
                ),
                {
                    "id": uuid4(),
                    "word_id": word_id,
                    "meaning": f"meaning{index}",
                    "now": now,
                },
            )
        session.commit()

    preferences = auth_client.patch(
        "/api/v1/preferences",
        headers=AUTH_HEADERS,
        json={
            "learning_language": "om",
            "proficiency_level": "beginner",
            "daily_goal_minutes": 10,
            "onboarding_completed": True,
        },
    )
    assert preferences.status_code == 200

    attempt = auth_client.post(
        "/api/v1/progress/lessons/om-beginner-journey/start",
        headers=AUTH_HEADERS,
        json={
            "difficulty": "beginner",
            "category_key": "journey",
            "category_label": "Journey",
            "question_count": 2,
        },
    ).json()
    for index, word_id in enumerate(word_ids):
        response = auth_client.put(
            f"/api/v1/progress/attempts/{attempt['id']}/answers",
            headers=AUTH_HEADERS,
            json={
                "question_id": str(word_id),
                "word_id": str(word_id),
                "selected_word_id": str(word_id),
                "question_index": index,
            },
        )
        assert response.status_code == 200

    completed = auth_client.post(
        f"/api/v1/progress/attempts/{attempt['id']}/complete",
        headers=AUTH_HEADERS,
    )
    assert completed.status_code == 200
    repeated_completion = auth_client.post(
        f"/api/v1/progress/attempts/{attempt['id']}/complete",
        headers=AUTH_HEADERS,
    )
    assert repeated_completion.status_code == 200

    marked = auth_client.put(
        f"/api/v1/vocabulary/{word_ids[0]}",
        headers=AUTH_HEADERS,
        json={"is_favorite": True, "learning_state": "needs_review"},
    )
    assert marked.status_code == 200

    review = auth_client.post("/api/v1/reviews/start", headers=AUTH_HEADERS).json()
    answer = auth_client.put(
        f"/api/v1/reviews/{review['id']}/answers",
        headers=AUTH_HEADERS,
        json={
            "word_id": str(word_ids[0]),
            "selected_word_id": str(word_ids[0]),
        },
    )
    assert answer.status_code == 200
    review_complete = auth_client.post(
        f"/api/v1/reviews/{review['id']}/complete", headers=AUTH_HEADERS
    )
    assert review_complete.status_code == 200
    assert auth_client.post(
        f"/api/v1/reviews/{review['id']}/complete", headers=AUTH_HEADERS
    ).status_code == 200

    dashboard = auth_client.get("/api/v1/dashboard", headers=AUTH_HEADERS).json()
    assert dashboard["goal_minutes"] == 10
    assert dashboard["lessons_completed"] == 1
    assert dashboard["reviews_completed"] == 1
    assert dashboard["learned_words"] == 2
    assert dashboard["needs_review_words"] == 0

    persisted_preferences = auth_client.get(
        "/api/v1/preferences", headers=AUTH_HEADERS
    ).json()
    persisted_words = auth_client.get(
        "/api/v1/vocabulary", headers=AUTH_HEADERS
    ).json()["data"]
    assert persisted_preferences["onboarding_completed"] is True
    assert any(item["is_favorite"] for item in persisted_words)

    mock_clerk(user_id="second_user")
    second_dashboard = auth_client.get(
        "/api/v1/dashboard", headers=AUTH_HEADERS
    ).json()
    assert second_dashboard["lessons_completed"] == 0
    assert auth_client.get(
        "/api/v1/vocabulary", headers=AUTH_HEADERS
    ).json() == {"data": []}
    assert auth_client.get(
        "/api/v1/reviews", headers=AUTH_HEADERS
    ).json()["history"] == []

    mock_clerk(user_id="user_test")
    assert auth_client.get(
        "/api/v1/dashboard", headers=AUTH_HEADERS
    ).json()["lessons_completed"] == 1

