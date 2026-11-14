"""Authenticated, device-specific Web Push subscriptions."""

from __future__ import annotations

from typing import Annotated
from urllib.parse import urlsplit
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Response, status
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.v1.endpoints.preferences import get_db
from app.core.clerk_auth import ClerkUser, get_current_user
from app.core.config import get_settings

router = APIRouter(prefix="/notifications", tags=["notifications"])


class PushKeys(BaseModel):
    p256dh: str = Field(min_length=32, max_length=256, pattern=r"^[A-Za-z0-9_-]+={0,2}$")
    auth: str = Field(min_length=16, max_length=256, pattern=r"^[A-Za-z0-9_-]+={0,2}$")


class PushSubscription(BaseModel):
    endpoint: str = Field(min_length=20, max_length=2048)
    keys: PushKeys


class PushConfig(BaseModel):
    public_key: str | None


class SubscriptionList(BaseModel):
    endpoints: list[str]


_PUSH_HOSTS = {
    "fcm.googleapis.com",
    "fcm-xm.googleapis.com",
    "updates.push.services.mozilla.com",
    "web.push.apple.com",
}


def _validated_endpoint(endpoint: str) -> str:
    parsed = urlsplit(endpoint)
    try:
        valid = parsed.scheme == "https" and parsed.hostname in _PUSH_HOSTS and not parsed.username and not parsed.password and not parsed.port and not parsed.fragment
    except ValueError:
        valid = False
    if not valid:
        raise HTTPException(status_code=422, detail="Unsupported push service endpoint.")
    return endpoint


def _user_id(db: Session, clerk_id: str):
    return db.execute(text("SELECT id FROM users WHERE clerk_id = :clerk_id"), {"clerk_id": clerk_id}).scalar_one_or_none()


@router.get("/config", response_model=PushConfig)
def push_config(current_user: Annotated[ClerkUser, Depends(get_current_user)]) -> PushConfig:
    settings = get_settings()
    key = settings.vapid_public_key if settings.vapid_private_key and settings.vapid_subject else None
    return PushConfig(public_key=key)


@router.get("/subscriptions", response_model=SubscriptionList)
def subscriptions(current_user: Annotated[ClerkUser, Depends(get_current_user)], db: Session = Depends(get_db)) -> SubscriptionList:
    user_id = _user_id(db, current_user.user_id)
    if user_id is None:
        return SubscriptionList(endpoints=[])
    rows = db.execute(text("SELECT endpoint FROM push_subscriptions WHERE user_id = :user_id"), {"user_id": user_id}).scalars().all()
    return SubscriptionList(endpoints=list(rows))


@router.post("/subscriptions", status_code=status.HTTP_204_NO_CONTENT)
def save_subscription(payload: PushSubscription, current_user: Annotated[ClerkUser, Depends(get_current_user)], db: Session = Depends(get_db)) -> Response:
    settings = get_settings()
    if not (settings.vapid_public_key and settings.vapid_private_key and settings.vapid_subject):
        raise HTTPException(status_code=503, detail="Push notifications are not configured yet.")
    endpoint = _validated_endpoint(payload.endpoint)
    user_id = _user_id(db, current_user.user_id)
    if user_id is None:
        raise HTTPException(status_code=409, detail="Complete your Fidel profile before enabling notifications.")
    owner = db.execute(text("SELECT user_id FROM push_subscriptions WHERE endpoint = :endpoint"), {"endpoint": endpoint}).scalar_one_or_none()
    if owner is not None and owner != user_id:
        raise HTTPException(status_code=409, detail="This device is linked to another account. Remove its subscription before continuing.")
    try:
        saved = db.execute(text("""
            INSERT INTO push_subscriptions (id, user_id, endpoint, p256dh, auth)
            VALUES (:id, :user_id, :endpoint, :p256dh, :auth)
            ON CONFLICT (endpoint) DO UPDATE SET p256dh = excluded.p256dh, auth = excluded.auth
            WHERE push_subscriptions.user_id = excluded.user_id
            RETURNING id
        """), {"id": uuid4(), "user_id": user_id, "endpoint": endpoint, "p256dh": payload.keys.p256dh, "auth": payload.keys.auth}).scalar_one_or_none()
        if saved is None:
            db.rollback()
            raise HTTPException(status_code=409, detail="This device is linked to another account.")
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="This device is linked to another account.") from None
    return Response(status_code=204)


@router.delete("/subscriptions", status_code=status.HTTP_204_NO_CONTENT)
def remove_subscription(payload: PushSubscription, current_user: Annotated[ClerkUser, Depends(get_current_user)], db: Session = Depends(get_db)) -> Response:
    user_id = _user_id(db, current_user.user_id)
    if user_id is not None:
        db.execute(text("DELETE FROM push_subscriptions WHERE user_id = :user_id AND endpoint = :endpoint"), {"user_id": user_id, "endpoint": _validated_endpoint(payload.endpoint)})
        db.commit()
    return Response(status_code=204)
