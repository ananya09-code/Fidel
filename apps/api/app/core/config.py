"""Application configuration, loaded from environment variables / .env."""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime settings for the Fidel API.

    Values are read from the process environment, falling back to a local
    ``.env`` file. Secrets must never be placed in client-side environment
    variables -- everything here is server-only.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "fidel-api"
    debug: bool = True

    # Origins allowed to call the API from a browser during local development.
    cors_origins: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]


@lru_cache
def get_settings() -> Settings:
    """Return the cached application settings."""
    return Settings()