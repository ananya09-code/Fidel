"""Tests for the health-check endpoint."""

from fastapi.testclient import TestClient


def test_health_returns_healthy_status(client: TestClient) -> None:
    """GET /api/health responds with the expected JSON payload."""
    response = client.get("/api/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "healthy",
        "service": "fidel-api",
    }