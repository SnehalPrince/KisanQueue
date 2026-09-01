"""
modules/notifications/service.py — Notification dispatcher (mock for MVP).

Writes to the notifications table (for in-app bell icon).
Simulates external delivery to WhatsApp / SMS.
"""
from __future__ import annotations

import uuid

import structlog
from sqlalchemy.ext.asyncio import AsyncSession

from models.centre import Centre
from models.notification import Notification
from models.queue_entry import QueueEntry
from models.user import User

log = structlog.get_logger(__name__)


class NotificationService:
    """Dispatches notifications (in-app + external channels)."""

    async def dispatch(
        self,
        event_type: str,
        user: User,
        queue_entry: QueueEntry | None,
        centre: Centre | None,
        db: AsyncSession,
    ) -> None:
        """
        Create a Notification row and dispatch to external channels.
        """
        # Render text (in a real app, use a templating engine or i18n bundle)
        if event_type == "NOTIF_QUEUE_JOINED":
            title_en = "Pass Generated"
            title_hi = "पास जनरेट हो गया"
            body_en = f"Your pass {queue_entry.token_code} for {centre.name} is confirmed."
            body_hi = f"आपका पास {queue_entry.token_code} ({centre.hindi_name or centre.name}) कन्फर्म हो गया है।"
        elif event_type == "NOTIF_QUEUE_TURN_APPROACHING":
            title_en = "Turn Approaching"
            title_hi = "आपकी बारी आने वाली है"
            body_en = f"You are now at position {queue_entry.queue_position}."
            body_hi = f"आप अब कतार में {queue_entry.queue_position} स्थान पर हैं।"
        elif event_type == "NOTIF_PROCUREMENT_COMPLETED":
            title_en = "Procurement Completed"
            title_hi = "खरीद पूरी हुई"
            body_en = "Your crop has been weighed and recorded."
            body_hi = "आपकी फसल तौली जा चुकी है और रिकॉर्ड कर ली गई है।"
        else:
            title_en = "Update"
            title_hi = "अपडेट"
            body_en = "Your queue status has been updated."
            body_hi = "आपकी कतार की स्थिति अपडेट कर दी गई है।"

        # 1. Write to DB for in-app bell
        notif = Notification(
            id=str(uuid.uuid4()),
            user_id=user.id,
            event_type=event_type,
            title_en=title_en,
            title_hi=title_hi,
            body_en=body_en,
            body_hi=body_hi,
            is_read=False,
            related_queue_entry_id=queue_entry.id if queue_entry else None,
        )
        db.add(notif)
        await db.flush()

        # 2. External dispatch (Mocked)
        log.info(
            "notification.dispatched_external",
            user_id=user.id,
            phone=user.phone,
            event=event_type,
            adapter="mock",
        )


notification_service = NotificationService()
