"""
modules/queue/cancel_router.py — Farmer-initiated queue entry cancellation.

Route:
    POST /v1/queue/{entry_id}/cancel — Cancel an active WAITING pass (farmer-auth only)

Design notes:
- Only WAITING entries can be cancelled (CHECKED_IN/PROCESSING are too far along).
- Returns opaque 404 if the entry belongs to a different farmer (prevents enumeration).
- Revokes the QR token on cancellation so the physical pass cannot be scanned.
- Triggers _recalculate_and_broadcast so other farmers' ETAs update immediately.
"""
from __future__ import annotations

import structlog
from fastapi import APIRouter
from sqlalchemy import select

from core.dependencies import DbSession, FarmerOnly
from core.exceptions import InvalidQueueStatusTransitionError, QueueEntryNotFoundError
from models.queue_entry import QueueEntry
from modules.qr.service import QRService

router = APIRouter()
log = structlog.get_logger(__name__)


@router.post("/{entry_id}/cancel")
async def cancel_pass(entry_id: str, db: DbSession, payload: FarmerOnly) -> dict:
    """
    Cancel a WAITING queue entry owned by the authenticated farmer.

    Returns 404 if:
    - The entry doesn't exist
    - The entry belongs to a different farmer (opaque — prevents ID enumeration)

    Returns 409 if the entry is already past WAITING (checked-in or processing).
    """
    farmer_id = payload["sub"]

    result = await db.execute(
        select(QueueEntry).where(QueueEntry.id == entry_id)
    )
    entry = result.scalar_one_or_none()

    # Opaque 404: either doesn't exist or belongs to someone else
    if entry is None or entry.farmer_user_id != farmer_id:
        raise QueueEntryNotFoundError()

    if entry.status != "WAITING":
        raise InvalidQueueStatusTransitionError(
            f"Cannot cancel from status '{entry.status}'. "
            "Only WAITING passes can be cancelled."
        )

    entry.status = "CANCELLED"

    # Revoke the QR token so the physical pass cannot be scanned
    await QRService.revoke(entry.id, db)

    # Recalculate ETAs for remaining farmers in the queue
    try:
        from modules.officer.router import _recalculate_and_broadcast
        await _recalculate_and_broadcast(entry.centre_id, db)
    except Exception as e:
        log.warning("cancel.broadcast_failed", error=str(e))

    log.info("queue.pass_cancelled", entry_id=entry_id, farmer_id=farmer_id,
             token=entry.token_code)
    return {
        "status": "cancelled",
        "queue_entry_id": entry_id,
        "token_code": entry.token_code,
    }
