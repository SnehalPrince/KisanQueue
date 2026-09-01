"""
realtime/events.py — Typed WebSocket event builders.

All events follow the format from docs/15_REALTIME_QUEUE.md:
    { "event": "EVENT_TYPE", "data": {...}, "ts": <iso-timestamp> }
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any


def _ts() -> str:
    return datetime.now(timezone.utc).isoformat()


def _event(event_type: str, data: dict[str, Any]) -> dict:
    return {"event": event_type, "data": data, "ts": _ts()}


def build_connected_event(centre_id: str, user_id: str, snapshot: dict) -> dict:
    return _event("CONNECTED", {
        "centre_id": centre_id, "user_id": user_id, "snapshot": snapshot
    })


def build_queue_joined_event(entry: Any, centre: Any) -> dict:
    return _event("QUEUE_JOINED", {
        "queue_entry_id": entry.id,
        "token_code": entry.token_code,
        "farmer_user_id": entry.farmer_user_id,
        "queue_position": entry.queue_position,
        "eta_minutes": entry.eta_minutes,
        "centre_id": centre.id,
        "centre_name": centre.name,
        "crop": entry.crop,
    })


def build_queue_position_changed_event(entry: Any) -> dict:
    return _event("QUEUE_POSITION_CHANGED", {
        "queue_entry_id": entry.id,
        "token_code": entry.token_code,
        "farmer_user_id": entry.farmer_user_id,
        "queue_position": entry.queue_position,
        "eta_minutes": entry.eta_minutes,
        "eta_confidence": entry.eta_confidence,
        "status": entry.status,
    })


def build_eta_updated_event(entry: Any) -> dict:
    return _event("ETA_UPDATED", {
        "queue_entry_id": entry.id,
        "farmer_user_id": entry.farmer_user_id,
        "queue_position": entry.queue_position,
        "eta_minutes": entry.eta_minutes,
        "eta_confidence": entry.eta_confidence,
    })


def build_centre_status_changed_event(
    centre_id: str, status: str, capacity_factor: float, active_counters: int
) -> dict:
    return _event("CENTRE_STATUS_CHANGED", {
        "centre_id": centre_id,
        "status": status,
        "capacity_factor": capacity_factor,
        "active_counters": active_counters,
    })


def build_processing_started_event(entry: Any) -> dict:
    return _event("PROCESSING_STARTED", {
        "queue_entry_id": entry.id,
        "token_code": entry.token_code,
        "farmer_user_id": entry.farmer_user_id,
    })


def build_processing_completed_event(entry: Any) -> dict:
    """Safe for broadcast to entire centre — contains no financial or bank data."""
    return _event("PROCESSING_COMPLETED", {
        "queue_entry_id": entry.id,
        "token_code": entry.token_code,
        "farmer_user_id": entry.farmer_user_id,
    })


def build_farmer_payment_event(entry: Any, total_amount: float) -> dict:
    """Private event sent ONLY to the individual farmer over their direct connection."""
    return _event("FARMER_PAYMENT_READY", {
        "queue_entry_id": entry.id,
        "token_code": entry.token_code,
        "farmer_user_id": entry.farmer_user_id,
        "total_amount": total_amount,
    })


def build_ping_event() -> dict:
    return {"event": "PING", "ts": _ts()}
