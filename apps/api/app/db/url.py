"""Helpers for passing database URLs to configuration libraries."""


def escape_alembic_config_value(value: str) -> str:
    """Escape percent signs before storing a URL in Alembic's ConfigParser.

    Percent-encoded credentials are valid in a PostgreSQL URL, but Alembic's
    underlying ConfigParser treats percent signs as interpolation markers.
    Doubling them preserves the original URL when Alembic reads it back.
    """

    return value.replace("%", "%%")
