"""Authenticated feedback submissions and private administrative review."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Annotated, Literal
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.api.v1.endpoints.preferences import _ensure_user, get_db
from app.core.admin_auth import require_admin
from app.core.clerk_auth import ClerkUser, get_current_user

router = APIRouter(prefix="/feedback", tags=["feedback"])


class FeedbackCreate(BaseModel):
    category: Literal["bug", "idea", "content", "other"]
    message: str = Field(min_length=10, max_length=3000)
    page_path: str = Field(max_length=512)
    contact_allowed: bool = False

    @field_validator("message")
    @classmethod
    def nonempty_message(cls, value: str) -> str:
        value = value.strip()
        if len(value) < 10:
            raise ValueError("Please write at least 10 characters.")
        return value

    @field_validator("page_path")
    @classmethod
    def local_path(cls, value: str) -> str:
        if not value.startswith("/") or value.startswith("//") or "?" in value or "#" in value:
            raise ValueError("page_path must be a local page path without a query.")
        return value


class FeedbackSaved(BaseModel):
    id: UUID
    created_at: datetime


class FeedbackItem(FeedbackSaved):
    category: Literal["bug", "idea", "content", "other"]
    message: str
    page_path: str
    contact_allowed: bool
    display_name: str | None
    email: str | None


class FeedbackPage(BaseModel):
    items: list[FeedbackItem]
    page: int
    page_size: int
    total: int


@router.post("", response_model=FeedbackSaved, status_code=status.HTTP_201_CREATED)
def submit_feedback(
    payload: FeedbackCreate,
    current_user: Annotated[ClerkUser, Depends(get_current_user)],
    db: Session = Depends(get_db),
) -> FeedbackSaved:
    now = datetime.now(timezone.utc)
    user_id = _ensure_user(db, current_user.user_id, now)
    count = db.execute(
        text("SELECT COUNT(*) FROM feedback_submissions WHERE user_id = :user_id AND created_at >= :since"),
        {"user_id": user_id, "since": now - timedelta(hours=1)},
    ).scalar_one()
    if count >= 5:
        db.rollback()
        raise HTTPException(status_code=429, detail="You have sent several notes recently. Please try again later.")

    feedback_id = uuid4()
    db.execute(
        text("""
            INSERT INTO feedback_submissions (id, user_id, category, message, page_path, contact_allowed, created_at)
            VALUES (:id, :user_id, :category, :message, :page_path, :contact_allowed, :created_at)
        """),
        {
            "id": feedback_id,
            "user_id": user_id,
            "category": payload.category,
            "message": payload.message,
            "page_path": payload.page_path,
            "contact_allowed": payload.contact_allowed,
            "created_at": now,
        },
    )
    db.commit()
    return FeedbackSaved(id=feedback_id, created_at=now)


@router.get("/admin", response_model=FeedbackPage)
def list_feedback(
    _: Annotated[str, Depends(require_admin)],
    db: Session = Depends(get_db),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=50),
) -> FeedbackPage:
    total = db.execute(text("SELECT COUNT(*) FROM feedback_submissions")).scalar_one()
    rows = db.execute(
        text("""
            SELECT f.id, f.category, f.message, f.page_path, f.contact_allowed, f.created_at,
                   u.display_name,
                   CASE WHEN f.contact_allowed THEN u.email ELSE NULL END AS email
            FROM feedback_submissions AS f
            JOIN users AS u ON u.id = f.user_id
            ORDER BY f.created_at DESC, f.id DESC
            LIMIT :limit OFFSET :offset
        """),
        {"limit": page_size, "offset": (page - 1) * page_size},
    ).mappings().all()
    return FeedbackPage(
        items=[FeedbackItem.model_validate(row) for row in rows],
        page=page,
        page_size=page_size,
        total=total,
    )
