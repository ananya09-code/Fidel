"""Version 1 of the HTTP API."""
from app.api.v1.endpoints.learning import router as learning_router
from fastapi import APIRouter

from app.api.v1.endpoints import health, recordings, words,learning 

api_router = APIRouter()

api_router.include_router(health.router, tags=["health"])

api_router.include_router(
    recordings.router,
    prefix="/audio-review",
    tags=["audio-review"],
)

api_router.include_router(
    words.router,
    prefix="/v1/words",
    tags=["words"],
)
api_router.include_router(learning_router, prefix="/api/v1")
