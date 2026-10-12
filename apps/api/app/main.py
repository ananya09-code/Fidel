"""FastAPI application factory."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import api_router
from app.core.config import get_settings


def create_app() -> FastAPI:
    """Build and configure the Fidel API application."""
    settings = get_settings()

    app = FastAPI(
        title="Fidel API",
        summary="Backend services for Fidel, a language-learning app for Ethiopian languages.",
        version="0.1.0",
        debug=settings.debug,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Every route lives under the /api prefix.
    app.include_router(api_router, prefix="/api")

    return app


app = create_app()