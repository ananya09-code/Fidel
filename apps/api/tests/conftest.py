"""Pytest configuration for the Fidel API."""

from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.main import create_app

API_ROOT = Path(__file__).parent


@pytest.fixture(scope="session")
def client() -> TestClient:
    """Provide a synchronous test client bound to the ASGI app."""
    with TestClient(create_app()) as test_client:
        yield test_client