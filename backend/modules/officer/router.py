"""
modules/officer/router.py — Officer operations endpoints.

All routes require OFFICER or ADMIN role JWT.

Routes:
    POST /v1/officer/checkin                  — QR scan or manual token check-in
    POST /v1/officer/capacity                 — Update centre capacity status
    POST /v1/officer/queue/{entry_id}/start   — Mark PROCESSING_STARTED
    POST /v1/officer/queue/{entry_id}/complete — Mark COMPLETED
    POST /v1/officer/queue/{entry_id}/skip    — Skip a queue entry
    GET  /v1/officer/queue                    — List queue for officer's centre
"""
from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone
from typing import Annotated

import structlog
from fastapi import APIRouter, Body, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from core.dependencies import DbSession, OfficerOnly, require_role
from core.exceptions import (
    CentreNotFoundError,
    InvalidQRTokenError,
    InvalidQueueStatusTransitionError,
    QueueEntryNotFoundError,
)
from models.audit_log import AuditLog
from models.capacity_update import CapacityUpdate
from models.centre import Centre
from models.processing_event import ProcessingEvent
from models.procurement_record import ProcurementRecord
from models.queue_entry import QueueEntry
from modules.eta.engine import compute_eta
from modules.qr.service import QRService

router = APIRouter()
log = structlog.get_logger(__name__)

ACTIVE_STATUSES = ("WAITING", "CHECKED_IN", "PROCESSING")


def _write_audit(
    db: AsyncSession,
    action: str,
    performed_by_id: str,
    target_id: str | None = None,
    target_type: str | None = None,
    centre_id: str | None = None,
    detail: dict | None = None,
) -> None:
    db.add(AuditLog(
        id=str(uuid.uuid4()),
        action=action,
        performed_by_id=performed_by_id,
        target_id=target_id,
        target_type=target_type,
        centre_id=centre_id,
        detail=json.dumps(detail) if detail else None,
    ))


def _write_event(
    db: AsyncSession,
    entry: QueueEntry,
    event_type: str,
    from_status: str | None,
    to_status: str,
    performed_by_id: str,
) -> None:
    db.add(ProcessingEvent(
        id=str(uuid.uuid4()),
        queue_entry_id=entry.id,
        event_type=event_type,
        from_status=from_status,
        to_status=to_status,
        performed_by_id=performed_by_id,
    ))


async def _recalculate_and_broadcast(centre_id: str, db: AsyncSession) -> None:
    """Recalculate ETA for all WAITING+CHECKED_IN entries and broadcast updates."""
    cap_result = await db.execute(
        select(CapacityUpdate)
        .where(CapacityUpdate.centre_id == centre_id)
        .order_by(CapacityUpdate.effective_from.desc())
        .limit(1)
    )
    cap = cap_result.scalar_one_or_none()
    status = cap.status if cap else "NORMAL"
    factor = cap.capacity_factor if cap else 1.0
    counters = cap.active_counters if cap else 2

    centre_result = await db.execute(select(Centre).where(Centre.id == centre_id))
    centre = centre_result.scalar_one_or_none()
    t_base = centre.avg_processing_minutes if centre else 25

    # Fetch all active entries ordered by position
    entries_result = await db.execute(
        select(QueueEntry).where(
            QueueEntry.centre_id == centre_id,
            QueueEntry.status.in_(("WAITING", "CHECKED_IN")),
        ).order_by(QueueEntry.queue_position)
    )
    entries = entries_result.scalars().all()

    # Re-assign sequential positions
    for i, entry in enumerate(entries, start=1):
        entry.queue_position = i
        eta_res = compute_eta(
            n=i, t_base=t_base,
            active_counters=counters, capacity_factor=factor,
            status=status, last_update_at=cap.effective_from if cap else None,
        )
        entry.eta_minutes = eta_res.eta_minutes
        entry.eta_confidence = eta_res.confidence

    # Broadcast
    try:
        from realtime.manager import connection_manager
        from realtime.events import build_eta_updated_event
        for entry in entries:
            await connection_manager.send_to_farmer(
                entry.farmer_user_id,
                build_eta_updated_event(entry),
            )
    except Exception as e:
        log.warning("officer.ws_broadcast_failed", error=str(e))


# ── POST /checkin ─────────────────────────────────────────────────────────────
@router.post("/checkin")
async def checkin(
    db: DbSession,
    payload: OfficerOnly,
    qr_data: str | None = Body(None),
    token_code: str | None = Body(None),
) -> dict:
    """
    Check in a farmer by QR scan or manual token code.

    Provide either qr_data (QR scan) or token_code (manual fallback).
    """
    officer_id = payload["sub"]
    centre_id = payload.get("centre_id")
    if not centre_id:
        raise InvalidQRTokenError("Officer has no assigned centre")

    if qr_data:
        entry = await QRService.validate(qr_data, centre_id, db)
    elif token_code:
        # Manual fallback — look up by token code and centre
        result = await db.execute(
            select(QueueEntry).where(
                QueueEntry.token_code == token_code,
                QueueEntry.centre_id == centre_id,
            )
        )
        entry = result.scalar_one_or_none()
        if entry is None:
            raise QueueEntryNotFoundError()
    else:
        raise InvalidQRTokenError("Provide qr_data or token_code")

    if entry.status != "WAITING":
        if entry.status == "CHECKED_IN":
            from core.exceptions import AlreadyCheckedInError
            raise AlreadyCheckedInError()
        raise InvalidQueueStatusTransitionError(f"Cannot check in from status: {entry.status}")

    prev_status = entry.status
    entry.status = "CHECKED_IN"
    entry.checked_in_at = datetime.now(timezone.utc)

    _write_event(db, entry, "CHECKED_IN", prev_status, "CHECKED_IN", officer_id)
    _write_audit(db, "OFFICER_CHECKIN", officer_id,
                 target_id=entry.id, target_type="queue_entry", centre_id=centre_id,
                 detail={"token_code": entry.token_code})

    await _recalculate_and_broadcast(centre_id, db)
    log.info("officer.checkin", token=entry.token_code, officer=officer_id)
    return {"status": "checked_in", "token_code": entry.token_code, "queue_entry_id": entry.id}


# ── POST /capacity ────────────────────────────────────────────────────────────
@router.post("/capacity")
async def update_capacity(
    db: DbSession,
    payload: OfficerOnly,
    status: str = Body(...),
    capacity_factor: float = Body(...),
    active_counters: int = Body(...),
    note: str | None = Body(None),
) -> dict:
    """
    Insert a new capacity_update row (never UPDATE).
    Triggers ETA recalculation and broadcasts for all active entries.
    """
    officer_id = payload["sub"]
    centre_id = payload.get("centre_id")
    if not centre_id:
        raise CentreNotFoundError()

    cap = CapacityUpdate(
        id=str(uuid.uuid4()),
        centre_id=centre_id,
        status=status,
        capacity_factor=capacity_factor,
        active_counters=active_counters,
        note=note,
        updated_by_officer_id=officer_id,
    )
    db.add(cap)
    await db.flush()

    _write_audit(db, "CAPACITY_UPDATE", officer_id, centre_id=centre_id,
                 detail={"status": status, "factor": capacity_factor, "counters": active_counters})

    # Broadcast centre status change
    try:
        from realtime.manager import connection_manager
        from realtime.events import build_centre_status_changed_event
        await connection_manager.broadcast_to_centre(
            centre_id,
            build_centre_status_changed_event(centre_id, status, capacity_factor, active_counters),
        )
    except Exception as e:
        log.warning("officer.capacity_ws_failed", error=str(e))

    await _recalculate_and_broadcast(centre_id, db)
    log.info("officer.capacity_updated", centre=centre_id, status=status)
    return {"status": "updated", "new_status": status}


# ── POST /queue/{entry_id}/start ──────────────────────────────────────────────
@router.post("/queue/{entry_id}/start")
async def start_processing(entry_id: str, db: DbSession, payload: OfficerOnly) -> dict:
    """Transition CHECKED_IN -> PROCESSING."""
    officer_id = payload["sub"]
    officer_centre_id = payload.get("centre_id")
    result = await db.execute(select(QueueEntry).where(QueueEntry.id == entry_id))
    entry = result.scalar_one_or_none()
    # Opaque 404 (not 403) — prevents enumeration of valid entry IDs across centres.
    if entry is None or entry.centre_id != officer_centre_id:
        raise QueueEntryNotFoundError()
    if entry.status != "CHECKED_IN":
        raise InvalidQueueStatusTransitionError(f"Cannot start from status: {entry.status}")

    prev = entry.status
    entry.status = "PROCESSING"
    entry.processing_started_at = datetime.now(timezone.utc)
    _write_event(db, entry, "PROCESSING_STARTED", prev, "PROCESSING", officer_id)
    return {"status": "processing", "queue_entry_id": entry_id}


# ── POST /queue/{entry_id}/complete ──────────────────────────────────────────
@router.post("/queue/{entry_id}/complete")
async def complete_processing(entry_id: str, db: DbSession, payload: OfficerOnly) -> dict:
    """Transition PROCESSING -> COMPLETED. Creates procurement record."""
    officer_id = payload["sub"]
    centre_id = payload.get("centre_id")

    result = await db.execute(select(QueueEntry).where(QueueEntry.id == entry_id))
    entry = result.scalar_one_or_none()
    # Opaque 404 (not 403) — prevents enumeration of valid entry IDs across centres.
    if entry is None or entry.centre_id != centre_id:
        raise QueueEntryNotFoundError()
    if entry.status != "PROCESSING":
        raise InvalidQueueStatusTransitionError(f"Cannot complete from status: {entry.status}")

    prev = entry.status
    entry.status = "COMPLETED"
    entry.completed_at = datetime.now(timezone.utc)
    _write_event(db, entry, "COMPLETED", prev, "COMPLETED", officer_id)

    # Create procurement record via mock adapter
    from modules.integration.mock_adapter import MockGovernmentProcurementAdapter
    centre_result = await db.execute(select(Centre).where(Centre.id == entry.centre_id))
    centre = centre_result.scalar_one_or_none()
    msp_rate = (centre.msp_rates.get(entry.crop, 0.0) if centre else 0.0)
    total = round(msp_rate * entry.quantity_quintals, 2)

    proc = ProcurementRecord(
        id=str(uuid.uuid4()),
        queue_entry_id=entry.id,
        crop=entry.crop,
        declared_quantity_q=entry.quantity_quintals,
        actual_quantity_q=entry.quantity_quintals,
        grade="A",
        msp_rate=msp_rate,
        total_amount=total,
        is_mock=True,
        source_system="MOCK",
    )
    db.add(proc)
    await db.flush()

    from models.payment_status import PaymentStatus
    db.add(PaymentStatus(
        id=str(uuid.uuid4()),
        procurement_record_id=proc.id,
        status="PENDING",
        amount=total,
        is_mock=True,
    ))

    _write_audit(db, "PROCESSING_COMPLETED", officer_id,
                 target_id=entry_id, target_type="queue_entry", centre_id=centre_id)

    if centre_id:
        await _recalculate_and_broadcast(centre_id, db)
    return {"status": "completed", "queue_entry_id": entry_id, "total_amount": total}


# ── POST /queue/{entry_id}/skip ───────────────────────────────────────────────
@router.post("/queue/{entry_id}/skip")
async def skip_entry(entry_id: str, db: DbSession, payload: OfficerOnly) -> dict:
    """Transition WAITING/CHECKED_IN -> SKIPPED."""
    officer_id = payload["sub"]
    centre_id = payload.get("centre_id")

    result = await db.execute(select(QueueEntry).where(QueueEntry.id == entry_id))
    entry = result.scalar_one_or_none()
    # Opaque 404 (not 403) — prevents enumeration of valid entry IDs across centres.
    if entry is None or entry.centre_id != centre_id:
        raise QueueEntryNotFoundError()
    if entry.status not in ("WAITING", "CHECKED_IN"):
        raise InvalidQueueStatusTransitionError(f"Cannot skip from status: {entry.status}")

    prev = entry.status
    entry.status = "SKIPPED"
    _write_event(db, entry, "SKIPPED", prev, "SKIPPED", officer_id)
    _write_audit(db, "ENTRY_SKIPPED", officer_id, target_id=entry_id, centre_id=centre_id)

    if centre_id:
        await _recalculate_and_broadcast(centre_id, db)
    return {"status": "skipped", "queue_entry_id": entry_id}


# ── GET /queue ────────────────────────────────────────────────────────────────
@router.get("/queue")
async def get_officer_queue(db: DbSession, payload: OfficerOnly) -> dict:
    """List current queue for officer's centre."""
    centre_id = payload.get("centre_id")
    if not centre_id:
        return {"entries": [], "centre_id": None}

    result = await db.execute(
        select(QueueEntry).where(
            QueueEntry.centre_id == centre_id,
            QueueEntry.status.in_(ACTIVE_STATUSES),
        ).order_by(QueueEntry.queue_position)
    )
    entries = result.scalars().all()
    return {
        "centre_id": centre_id,
        "entries": [
            {
                "id": e.id, "token_code": e.token_code,
                "queue_position": e.queue_position, "status": e.status,
                "crop": e.crop, "quantity_q": e.quantity_quintals,
                "eta_minutes": e.eta_minutes, "joined_at": e.joined_at.isoformat(),
            }
            for e in entries
        ],
    }
