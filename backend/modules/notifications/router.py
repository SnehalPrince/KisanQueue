"""
modules/notifications/router.py — Notification read endpoints.

Routes:
    GET /v1/notifications        — List user's notifications
    POST /v1/notifications/read  — Mark notifications as read
"""
from __future__ import annotations

import structlog
from fastapi import APIRouter
from sqlalchemy import func, select, update

from core.dependencies import AnyAuthenticatedUser, DbSession
from models.notification import Notification
from modules.notifications.schemas import NotificationListResponse, NotificationSchema

router = APIRouter()
log = structlog.get_logger(__name__)


@router.get("", response_model=NotificationListResponse)
async def list_notifications(db: DbSession, payload: AnyAuthenticatedUser) -> NotificationListResponse:
    """List all notifications for the authenticated user."""
    user_id = payload["sub"]

    # Fetch notifications
    result = await db.execute(
        select(Notification)
        .where(Notification.user_id == user_id)
        .order_by(Notification.created_at.desc())
        .limit(50)
    )
    notifs = result.scalars().all()

    # Unread count
    count_result = await db.execute(
        select(func.count(Notification.id))
        .where(Notification.user_id == user_id, Notification.is_read == False)  # noqa: E712
    )
    unread = count_result.scalar() or 0

    return NotificationListResponse(
        notifications=[
            NotificationSchema(
                id=n.id,
                event_type=n.event_type,
                title_en=n.title_en,
                title_hi=n.title_hi,
                body_en=n.body_en,
                body_hi=n.body_hi,
                is_read=n.is_read,
                related_queue_entry_id=n.related_queue_entry_id,
                created_at=n.created_at.isoformat(),
            )
            for n in notifs
        ],
        unread_count=unread,
    )


@router.post("/read")
async def mark_read(db: DbSession, payload: AnyAuthenticatedUser) -> dict:
    """Mark all unread notifications as read for the user."""
    user_id = payload["sub"]

    await db.execute(
        update(Notification)
        .where(Notification.user_id == user_id, Notification.is_read == False)  # noqa: E712
        .values(is_read=True)
    )

    return {"status": "ok"}
