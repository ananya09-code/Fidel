"""Tests for safe database URL configuration."""

from alembic.config import Config

from app.db.url import escape_alembic_config_value


def test_percent_encoded_database_url_survives_alembic_config() -> None:
    database_url = "postgresql://user:p%40ss%25word@example.test/fidel"
    config = Config()

    config.set_main_option(
        "sqlalchemy.url",
        escape_alembic_config_value(database_url),
    )

    assert config.get_main_option("sqlalchemy.url") == database_url
