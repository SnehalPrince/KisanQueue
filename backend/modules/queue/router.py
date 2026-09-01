"""
modules/queue/router.py — Queue join and status endpoints.

Routes:
    POST /v1/passes/generate      — Join queue and generate procurement pass
    GET  /v1/queue/my-status      — Get authenticated farmer's active pass
"""
from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone

import structlog
from fastapi import APIRouter
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError

from core.dependencies import DbSession, FarmerOnly
from core.exceptions import (
    CentreNotFoundError,
    CentrePausedError,
    DuplicateQueueEntryError,
)
from models.capacity_update import CapacityUpdate
from models.centre import Centre
from models.processing_event import ProcessingEvent
from models.queue_entry import QueueEntry
from modules.eta.engine import compute_eta
from modules.qr.service import QRService
from modules.queue.schemas import GeneratePassResponse, QueueStatusResponse

router = APIRouter()
log = structlog.get_logger(__name__)

ACTIVE_STATUSES = ("WAITING", "CHECKED_IN", "PROCESSING")


@router.post("/passes/generate", response_model=GeneratePassResponse, status_code=201)
async def generate_pass(
    body_data: dict,
    db: DbSession,
    payload: FarmerOnly,
) -> GeneratePassResponse:
    """
    Join the queue at a procurement centre and generate a signed QR pass.

    Validates:
    - Centre exists and is active
    - Centre is not PAUSED
    - Farmer has no existing active entry at this centre
    """
    from modules.queue.schemas import GeneratePassRequest
    body = GeneratePassRequest(**body_data)

    farmer_user_id = payload["sub"]

    # Lock the centre row for the duration of this transaction.
    # This serialises concurrent generate_pass calls for the same centre,
    # eliminating the TOCTOU race on duplicate-check + position/token computation.
    centre_result = await db.execute(
        select(Centre).where(Centre.id == body.centre_id).with_for_update()
    )
    centre = centre_result.scalar_one_or_none()
    if centre is None:
        raise CentreNotFoundError()

    # Latest capacity update
    cap_result = await db.execute(
        select(CapacityUpdate)
        .where(CapacityUpdate.centre_id == centre.id)
        .order_by(CapacityUpdate.effective_from.desc())
        .limit(1)
    )
    cap = cap_result.scalar_one_or_none()
    status = cap.status if cap else "NORMAL"
    capacity_factor = cap.capacity_factor if cap else 1.0
    active_counters = cap.active_counters if cap else centre.active_counters_default

    if status == "PAUSED":
        raise CentrePausedError()

    # Check for duplicate active entry
    dup_result = await db.execute(
        select(QueueEntry).where(
            QueueEntry.centre_id == centre.id,
            QueueEntry.farmer_user_id == farmer_user_id,
            QueueEntry.status.in_(ACTIVE_STATUSES),
        )
    )
    if dup_result.scalar_one_or_none():
        raise DuplicateQueueEntryError()

    # Queue position = current active count + 1
    count_result = await db.execute(
        select(func.count(QueueEntry.id)).where(
            QueueEntry.centre_id == centre.id,
            QueueEntry.status.in_(ACTIVE_STATUSES),
        )
    )
    queue_length = count_result.scalar() or 0
    queue_position = queue_length + 1

    # Token number = today's total token count + 1 (across all statuses today)
    today_start = datetime.now(timezone.utc).replace(
        hour=0, minute=0, second=0, microsecond=0
    )
    token_count_result = await db.execute(
        select(func.count(QueueEntry.id)).where(
            QueueEntry.centre_id == centre.id,
            QueueEntry.joined_at >= today_start,
        )
    )
    token_number = (token_count_result.scalar() or 0) + 1
    token_code = f"KQ-{token_number}"

    # ETA
    eta_result = compute_eta(
        n=queue_position,
        t_base=centre.avg_processing_minutes,
        active_counters=active_counters,
        capacity_factor=capacity_factor,
        status=status,
        last_update_at=cap.effective_from if cap else None,
    )

    valid_until = datetime.now(timezone.utc) + timedelta(hours=8)

    # Create queue entry
    entry = QueueEntry(
        id=str(uuid.uuid4()),
        centre_id=centre.id,
        farmer_user_id=farmer_user_id,
        token_number=token_number,
        token_code=token_code,
        queue_position=queue_position,
        eta_minutes=eta_result.eta_minutes,
        eta_confidence=eta_result.confidence,
        crop=body.crop,
        quantity_quintals=body.quantity_quintals,
        status="WAITING",
        valid_until=valid_until,
    )
    db.add(entry)
    # Flush inside a try/except — the DB-level unique constraint on token_code is
    # the last-resort guard if two requests slip through the FOR UPDATE lock
    # (e.g. during a failover). Surfaces as a clean 409 instead of a raw 500.
    try:
        await db.flush()  # get entry.id
    except IntegrityError:
        await db.rollback()
        raise DuplicateQueueEntryError()

    # Issue QR token
    qr_data = await QRService.issue(entry, db)

    # Write processing event
    db.add(ProcessingEvent(
        id=str(uuid.uuid4()),
        queue_entry_id=entry.id,
        event_type="JOINED",
        from_status=None,
        to_status="WAITING",
        performed_by_id=farmer_user_id,
    ))

    # Broadcast QUEUE_JOINED event (import here to avoid circular imports)
    try:
        from realtime.manager import connection_manager
        from realtime.events import build_queue_joined_event
        await connection_manager.broadcast_to_centre(
            centre.id,
            build_queue_joined_event(entry, centre),
        )
    except Exception as e:
        log.warning("queue.ws_broadcast_failed", error=str(e))

    # Fire notification (non-blocking; failure doesn't abort the request)
    try:
        from modules.notifications.service import notification_service
        from models.user import User
        user_result = await db.execute(select(User).where(User.id == farmer_user_id))
        user = user_result.scalar_one_or_none()
        if user:
            await notification_service.dispatch(
                "NOTIF_QUEUE_JOINED",
                user=user,
                queue_entry=entry,
                centre=centre,
                db=db,
            )
    except Exception as e:
        log.warning("queue.notification_failed", error=str(e))

    log.info(
        "queue.pass_generated",
        token_code=token_code,
        position=queue_position,
        centre=centre.id,
    )

    return GeneratePassResponse(
        pass_id=entry.id,
        token=token_code,
        farmer_id=farmer_user_id,
        farmer_name="",  # filled from user in a real response; sufficient for MVP
        centre_id=centre.id,
        centre_name=centre.name,
        centre_hindi_name=centre.hindi_name,
        crop=body.crop,
        quantity_quintals=body.quantity_quintals,
        queue_position=queue_position,
        eta_minutes=eta_result.eta_minutes,
        eta_confidence=eta_result.confidence,
        status="ACTIVE",
        queue_entry_status="WAITING",
        issued_at=entry.joined_at.isoformat(),
        valid_until=valid_until.isoformat(),
        qr_payload=qr_data,
    )


@router.get("/queue/my-status", response_model=QueueStatusResponse)
async def my_queue_status(db: DbSession, payload: FarmerOnly) -> QueueStatusResponse:
    """Return the authenticated farmer's current active pass status."""
    farmer_user_id = payload["sub"]

    result = await db.execute(
        select(QueueEntry).where(
            QueueEntry.farmer_user_id == farmer_user_id,
            QueueEntry.status.in_(ACTIVE_STATUSES),
        ).order_by(QueueEntry.joined_at.desc()).limit(1)
    )
    entry = result.scalar_one_or_none()

    if entry is None:
        return QueueStatusResponse(has_active_pass=False)

    # Fetch centre for name
    centre_result = await db.execute(select(Centre).where(Centre.id == entry.centre_id))
    centre = centre_result.scalar_one_or_none()

    # Recalculate live ETA
    cap_result = await db.execute(
        select(CapacityUpdate)
        .where(CapacityUpdate.centre_id == entry.centre_id)
        .order_by(CapacityUpdate.effective_from.desc())
        .limit(1)
    )
    cap = cap_result.scalar_one_or_none()
    cap_status = cap.status if cap else "NORMAL"
    capacity_factor = cap.capacity_factor if cap else 1.0
    active_counters = cap.active_counters if cap else (centre.active_counters_default if centre else 2)

    eta_result = compute_eta(
        n=entry.queue_position or 1,
        t_base=centre.avg_processing_minutes if centre else 25,
        active_counters=active_counters,
        capacity_factor=capacity_factor,
        status=cap_status,
        last_update_at=cap.effective_from if cap else None,
    )

    # Fetch QR token
    from models.qr_token import QRToken
    qr_result = await db.execute(
        select(QRToken).where(QRToken.queue_entry_id == entry.id)
    )
    qr_token = qr_result.scalar_one_or_none()

    return QueueStatusResponse(
        has_active_pass=True,
        pass_id=entry.id,
        token=entry.token_code,
        centre_id=entry.centre_id,
        centre_name=centre.name if centre else None,
        crop=entry.crop,
        quantity_quintals=entry.quantity_quintals,
        queue_position=entry.queue_position,
        eta_minutes=eta_result.eta_minutes,
        eta_confidence=eta_result.confidence,
        status="ACTIVE",
        queue_entry_status=entry.status,
        issued_at=entry.joined_at.isoformat(),
        valid_until=entry.valid_until.isoformat() if entry.valid_until else None,
        qr_payload=None,  # QR payload not re-exposed for security; client stores it from initial issue
    )
