"""
modules/notifications/schemas.py — Notification Pydantic schemas.
"""
from __future__ import annotations

from pydantic import BaseModel


class NotificationSchema(BaseModel):
    id: str
    event_type: str
    title_en: str
    title_hi: str | None
    body_en: str
    body_hi: str | None
    is_read: bool
    related_queue_entry_id: str | None
    created_at: str

    model_config = {"from_attributes": True}


class NotificationListResponse(BaseModel):
    notifications: list[NotificationSchema]
    unread_count: int
