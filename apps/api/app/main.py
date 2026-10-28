"""Fidel API application entry point."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import api_router
from app.core.config import get_settings


def create_app() -> FastAPI:
    """Build and configure the Fidel API application."""
    settings = get_settings()

    application = FastAPI(
        title="Fidel API",
        debug=settings.debug,
    )

    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Public vocabulary routes live under /api/v1; admin routes stay under /api.
    application.include_router(api_router, prefix="/api")

    @application.get("/")
    def health_check():
        """Check whether the API is running."""
        return {"message": "Fidel API is running"}

    return application


app = create_app()
