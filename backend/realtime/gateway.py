"""
realtime/gateway.py — FastAPI WebSocket route.
"""
from __future__ import annotations

import asyncio

import structlog
from fastapi import APIRouter, Depends, Query, WebSocket, WebSocketDisconnect
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db_session
from core.security import decode_access_token
from models.capacity_update import CapacityUpdate
from models.queue_entry import QueueEntry
from realtime.events import build_connected_event, build_ping_event
from realtime.manager import connection_manager

router = APIRouter()
log = structlog.get_logger(__name__)


async def _get_ws_payload(token: str) -> dict | None:
    try:
        return decode_access_token(token)
    except Exception:
        return None


@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(...),
    db: AsyncSession = Depends(get_db_session),
) -> None:
    """
    WebSocket gateway for both farmers (my-status) and officers (centre dashboard).
    """
    payload = await _get_ws_payload(token)
    if not payload:
        await websocket.close(code=1008)
        return

    user_id = payload["sub"]
    role = payload.get("role")
    centre_id = payload.get("centre_id")

    # If farmer, auto-resolve their active centre
    if role == "FARMER":
        result = await db.execute(
            select(QueueEntry).where(
                QueueEntry.farmer_user_id == user_id,
                QueueEntry.status.in_(("WAITING", "CHECKED_IN", "PROCESSING")),
            )
        )
        entry = result.scalar_one_or_none()
        if entry:
            centre_id = entry.centre_id

    await connection_manager.connect(websocket, user_id=user_id, centre_id=centre_id)

    # Initial snapshot
    snapshot = {}
    if centre_id:
        cap_res = await db.execute(
            select(CapacityUpdate)
            .where(CapacityUpdate.centre_id == centre_id)
            .order_by(CapacityUpdate.effective_from.desc())
            .limit(1)
        )
        cap = cap_res.scalar_one_or_none()
        snapshot["status"] = cap.status if cap else "NORMAL"

    await websocket.send_json(build_connected_event(centre_id or "", user_id, snapshot))

    try:
        # Keep connection open and respond to client pings if needed
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_json(build_ping_event())
    except WebSocketDisconnect:
        connection_manager.disconnect(websocket, user_id=user_id, centre_id=centre_id)
    except Exception as e:
        log.warning("ws.exception", error=str(e))
        connection_manager.disconnect(websocket, user_id=user_id, centre_id=centre_id)
