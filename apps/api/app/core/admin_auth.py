"""Guard for the administrative audio-review endpoints.

The project has no user accounts yet, so this module provides the smallest
usable control: a shared secret supplied in the ``X-Admin-Key`` header and
compared against ``ADMIN_API_KEY``.

This is a stopgap, not real authentication:

* it authenticates a *deployment*, not a person;
* there is no per-user identity, so ``reviewed_by`` records the key's label
  only (``admin`` unless configured otherwise);
* before exposing the API publicly, put the dashboard behind proper
  user authentication and authorisation.

If ``ADMIN_API_KEY`` is not configured the review endpoints refuse every
request rather than defaulting to open access.
"""

from __future__ import annotations

import hmac

from fastapi import Header, HTTPException, status

from app.core.config import get_settings

ADMIN_KEY_HEADER = "X-Admin-Key"
DEFAULT_REVIEWER = "admin"


def require_admin(
    x_admin_key: str | None = Header(
        default=None,
        alias=ADMIN_KEY_HEADER,
        description="Administrative dashboard key.",
    ),
) -> str:
    """Verify the admin key and return the reviewer label to record."""
    settings = get_settings()
    expected = settings.admin_api_key

    if not expected:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "Administrative endpoints are disabled because ADMIN_API_KEY "
                "is not configured on the server."
            ),
        )

    if not x_admin_key or not hmac.compare_digest(x_admin_key, expected):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing administrative key.",
        )

    return DEFAULT_REVIEWER