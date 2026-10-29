"""Schemas for the authenticated user profile endpoints."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class UserProfile(BaseModel):
    """The local profile associated with a Clerk user."""

    id: UUID
    clerk_user_id: str
    username: str | None = None
    email: str | None = None
    first_name: str | None = None
    last_name: str | None = None
    display_name: str | None = None
    image_url: str | None = None
    created_at: datetime
    updated_at: datetime
