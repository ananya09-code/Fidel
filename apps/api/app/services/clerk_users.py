"""Read basic profile fields from Clerk's Backend API."""

from __future__ import annotations

import logging
from dataclasses import dataclass

from clerk_backend_api import Clerk

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class ClerkProfileData:
    """The Clerk-owned fields mirrored into the local users table."""

    email: str | None = None
    first_name: str | None = None
    last_name: str | None = None
    username: str | None = None
    image_url: str | None = None


def fetch_clerk_profile(
    user_id: str,
    secret_key: str,
) -> ClerkProfileData | None:
    """Fetch profile fields for a verified Clerk user.

    This is best-effort: a temporary Clerk API failure must not prevent the
    user from using the app. The verified token remains the source of identity.
    """

    try:
        with Clerk(bearer_auth=secret_key, timeout_ms=5000) as clerk:
            user = clerk.users.get(user_id=user_id)
    except Exception:
        logger.warning(
            "Unable to fetch Clerk profile for user %s", user_id, exc_info=True
        )
        return None

    email = None
    primary_email_id = getattr(user, "primary_email_address_id", None)
    for address in getattr(user, "email_addresses", []) or []:
        if getattr(address, "id", None) == primary_email_id:
            email = getattr(address, "email_address", None)
            break

    return ClerkProfileData(
        email=email,
        first_name=getattr(user, "first_name", None),
        last_name=getattr(user, "last_name", None),
        username=getattr(user, "username", None),
        image_url=getattr(user, "image_url", None),
    )
