"""Feedback is saved for the verified learner and read only by an administrator."""

from sqlalchemy import text

from app.core.config import get_settings
from tests.conftest import AUTH_HEADERS

BASE = "/api/v1/feedback"
PAYLOAD = {
    "category": "bug",
    "message": "The audio button does not respond on my phone.",
    "page_path": "/Learn/lesson",
    "contact_allowed": False,
}


def test_submit_requires_clerk_and_validates_input(auth_client, mock_clerk, session_factory):
    assert auth_client.post(BASE, json=PAYLOAD).status_code == 401
    assert auth_client.post(BASE, headers=AUTH_HEADERS, json={**PAYLOAD, "message": "  short  "}).status_code == 422
    assert auth_client.post(BASE, headers=AUTH_HEADERS, json={**PAYLOAD, "page_path": "//other.site/path"}).status_code == 422
    assert auth_client.post(BASE, headers=AUTH_HEADERS, json={**PAYLOAD, "category": "unknown"}).status_code == 422
    with session_factory() as db:
        assert db.execute(text("SELECT COUNT(*) FROM feedback_submissions")).scalar_one() == 0


def test_feedback_is_persisted_and_admin_only(auth_client, mock_clerk, session_factory, monkeypatch):
    settings = get_settings()
    monkeypatch.setattr(settings, "admin_api_key", "feedback-test-admin-key")

    first = auth_client.post(BASE, headers=AUTH_HEADERS, json=PAYLOAD)
    assert first.status_code == 201
    assert first.json()["id"]

    mock_clerk("another_user")
    second = auth_client.post(BASE, headers=AUTH_HEADERS, json={
        **PAYLOAD, "category": "idea", "message": "Please add more everyday words.", "contact_allowed": True,
    })
    assert second.status_code == 201
    with session_factory() as db:
        db.execute(text("UPDATE users SET email = 'second@example.test' WHERE clerk_id = 'another_user'"))
        db.commit()
        rows = db.execute(text("""
            SELECT u.clerk_id, f.category FROM feedback_submissions f
            JOIN users u ON u.id = f.user_id ORDER BY f.category
        """)).all()
        assert rows == [("user_test", "bug"), ("another_user", "idea")]

    assert auth_client.get(f"{BASE}/admin", headers=AUTH_HEADERS).status_code == 401
    assert auth_client.get(f"{BASE}/admin", headers={"X-Admin-Key": "wrong"}).status_code == 401
    admin = auth_client.get(f"{BASE}/admin?page=1&page_size=1", headers={"X-Admin-Key": "feedback-test-admin-key"})
    assert admin.status_code == 200
    assert admin.json()["total"] == 2
    assert len(admin.json()["items"]) == 1
    full = auth_client.get(f"{BASE}/admin", headers={"X-Admin-Key": "feedback-test-admin-key"})
    items = {item["category"]: item for item in full.json()["items"]}
    assert items["bug"]["email"] is None
    assert items["idea"]["email"] == "second@example.test"
    assert items["bug"]["message"] == PAYLOAD["message"]


def test_feedback_rate_limit_is_scoped_to_user(auth_client, mock_clerk, session_factory):
    for _ in range(5):
        assert auth_client.post(BASE, headers=AUTH_HEADERS, json=PAYLOAD).status_code == 201
    assert auth_client.post(BASE, headers=AUTH_HEADERS, json=PAYLOAD).status_code == 429

    mock_clerk("another_user")
    assert auth_client.post(BASE, headers=AUTH_HEADERS, json=PAYLOAD).status_code == 201
    with session_factory() as db:
        assert db.execute(text("SELECT COUNT(*) FROM feedback_submissions")).scalar_one() == 6
