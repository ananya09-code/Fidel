"""Clerk session-token authentication for user-facing endpoints."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Mapping

from fastapi import HTTPException, Request, status
from clerk_backend_api.security import (
    AuthStatus,
    AuthenticateRequestOptions,
    authenticate_request,
)

from app.core.config import get_settings


@dataclass(frozen=True)
class ClerkUser:
    """The verified identity encoded in a Clerk session token."""

    user_id: str
    session_id: str | None
    claims: Mapping[str, Any]


class _BearerHeaders:
    """Minimal request object exposing only an Authorization header."""

    def __init__(self, token: str) -> None:
        self.headers = {"Authorization": f"Bearer {token}"}


def _normalize_issuer(value: str) -> str:
    return value.strip().rstrip("/")


def get_current_user(request: Request) -> ClerkUser:
    """Return the Clerk user for a valid Bearer session token.

    Configuration problems fail closed with 503, while missing or invalid
    credentials return 401. The token signature is verified by Clerk's SDK and
    the issuer is checked here because the SDK does not validate it.
    """

    settings = get_settings()
    secret_key = (
        settings.clerk_secret_key.get_secret_value()
        if settings.clerk_secret_key is not None
        else None
    )
    jwt_key = (
        settings.clerk_jwt_key.get_secret_value()
        if settings.clerk_jwt_key is not None
        else None
    )
    issuer = (
        _normalize_issuer(settings.clerk_issuer)
        if settings.clerk_issuer is not None
        else None
    )

    if (secret_key is None and jwt_key is None) or issuer is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="User authentication is not configured.",
        )

    authorization = request.headers.get("Authorization")
    scheme, _, token = (authorization or "").partition(" ")
    token = token.strip()
    if scheme.lower() != "bearer" or not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="A Bearer session token is required.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    state = authenticate_request(
        _BearerHeaders(token),
        AuthenticateRequestOptions(
            secret_key=secret_key,
            jwt_key=jwt_key,
            authorized_parties=settings.clerk_authorized_parties,
            accepts_token=["session_token"],
        ),
    )

    if state.status != AuthStatus.SIGNED_IN or state.payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="The session token is invalid or has expired.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    claims = state.payload
    token_issuer = claims.get("iss")
    if not isinstance(token_issuer, str) or _normalize_issuer(token_issuer) != issuer:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="The session token was issued by an unexpected instance.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = claims.get("sub")
    if not isinstance(user_id, str) or not user_id.strip():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="The session token does not identify a user.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    session_id = claims.get("sid")
    return ClerkUser(
        user_id=user_id,
        session_id=session_id if isinstance(session_id, str) else None,
        claims=claims,
    )
