"""Version 1 of the HTTP API."""
from fastapi import APIRouter

from app.api.v1.endpoints import auth, health, learning, preferences, progress, recordings, vocabulary, words

api_router = APIRouter()

api_router.include_router(health.router, tags=["health"])

api_router.include_router(
    recordings.router,
    prefix="/audio-review",
    tags=["audio-review"],
)

api_router.include_router(
    auth.router,
    prefix="/v1",
)

api_router.include_router(
    preferences.router,
    prefix="/v1",
)

api_router.include_router(
    progress.router,
    prefix="/v1",
)

api_router.include_router(
    vocabulary.router,
    prefix="/v1",
)

api_router.include_router(
    words.router,
    prefix="/v1/words",
    tags=["words"],
)
api_router.include_router(learning.router, prefix="/v1")
