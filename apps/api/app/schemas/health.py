"""Pydantic schemas returned by the API."""

from pydantic import BaseModel


class HealthResponse(BaseModel):
    """Payload returned by the health-check endpoint."""

    status: str
    service: str