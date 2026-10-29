"""Authenticated user-profile endpoints."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Annotated, Any, Generator, Mapping
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.clerk_auth import ClerkUser, get_current_user
from app.core.config import get_settings
from app.db.database import SessionLocal
from app.schemas.auth import UserProfile
from app.services.clerk_users import ClerkProfileData, fetch_clerk_profile

router = APIRouter(prefix="/auth", tags=["auth"])


def get_db() -> Generator[Session, None, None]:
    """Yield a database session for request handlers."""

    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _display_name(
    first_name: str | None,
    last_name: str | None,
    username: str | None,
) -> str | None:
    full_name = " ".join(
        part for part in (first_name, last_name) if part and part.strip()
    ).strip()
    return full_name or username


def _serialize(
    row: Mapping[str, Any],
    details: ClerkProfileData | None = None,
) -> UserProfile:
    return UserProfile(
        id=row["id"],
        clerk_user_id=row["clerk_id"],
        username=details.username if details else None,
        email=row["email"],
        first_name=details.first_name if details else None,
        last_name=details.last_name if details else None,
        display_name=row["display_name"],
        image_url=details.image_url if details else None,
        created_at=row["created_at"],
        updated_at=row["updated_at"],
    )


def _load_profile(db: Session, clerk_id: str) -> Mapping[str, Any] | None:
    return db.execute(
        text(
            """
            SELECT
                id,
                clerk_id,
                email,
                display_name,
                created_at,
                updated_at
            FROM users
            WHERE clerk_id = :clerk_id
            """
        ),
        {"clerk_id": clerk_id},
    ).mappings().first()


def _clerk_profile(current_user: ClerkUser) -> ClerkProfileData | None:
    settings = get_settings()
    if settings.clerk_secret_key is None:
        return None

    return fetch_clerk_profile(
        current_user.user_id,
        settings.clerk_secret_key.get_secret_value(),
    )


@router.post(
    "/profile",
    response_model=UserProfile,
    summary="Get or create the signed-in user's profile",
)
def sync_profile(
    current_user: Annotated[ClerkUser, Depends(get_current_user)],
    db: Session = Depends(get_db),
) -> UserProfile:
    """Create the local profile on first use and refresh Clerk-owned fields."""

    details = _clerk_profile(current_user)
    now = datetime.now(timezone.utc)
    params = {
        "id": uuid4(),
        "clerk_id": current_user.user_id,
        "email": details.email if details else None,
        "display_name": (
            _display_name(details.first_name, details.last_name, details.username)
            if details
            else None
        ),
        "created_at": now,
        "updated_at": now,
    }

    db.execute(
        text(
            """
            INSERT INTO users (
                id, clerk_id, email, display_name, created_at, updated_at
            )
            VALUES (
                :id, :clerk_id, :email, :display_name, :created_at, :updated_at
            )
            ON CONFLICT (clerk_id) DO NOTHING
            """
        ),
        params,
    )

    db.execute(
        text(
            """
            UPDATE users
            SET
                email = COALESCE(:email, email),
                display_name = COALESCE(:display_name, display_name),
                updated_at = :updated_at
            WHERE clerk_id = :clerk_id
            """
        ),
        params,
    )
    db.commit()

    row = _load_profile(db, current_user.user_id)
    if row is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to initialize the user profile.",
        )

    return _serialize(row, details)


@router.get(
    "/profile",
    response_model=UserProfile,
    summary="Get the signed-in user's profile",
)
def get_profile(
    current_user: Annotated[ClerkUser, Depends(get_current_user)],
    db: Session = Depends(get_db),
) -> UserProfile:
    """Return the local profile without creating or changing it."""

    row = _load_profile(db, current_user.user_id)
    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User profile not found.",
        )

    return _serialize(row, _clerk_profile(current_user))


@router.delete(
    "/profile",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete the signed-in user's profile",
)
def delete_profile(
    current_user: Annotated[ClerkUser, Depends(get_current_user)],
    db: Session = Depends(get_db),
) -> Response:
    """Remove local profile data for the signed-in user."""

    db.execute(
        text("DELETE FROM users WHERE clerk_id = :clerk_id"),
        {"clerk_id": current_user.user_id},
    )
    db.commit()

    return Response(status_code=status.HTTP_204_NO_CONTENT)
