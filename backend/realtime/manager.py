"""
realtime/manager.py — Connection manager for WebSockets.
"""
from __future__ import annotations

import asyncio
from typing import Dict, Set

import structlog
from fastapi import WebSocket
from starlette.websockets import WebSocketState

log = structlog.get_logger(__name__)


class ConnectionManager:
    def __init__(self) -> None:
        # Map: user_id -> set of active WebSockets
        self.active_user_connections: Dict[str, Set[WebSocket]] = {}
        # Map: centre_id -> set of active WebSockets
        self.active_centre_connections: Dict[str, Set[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: str, centre_id: str | None = None) -> None:
        await websocket.accept()

        if user_id not in self.active_user_connections:
            self.active_user_connections[user_id] = set()
        self.active_user_connections[user_id].add(websocket)

        if centre_id:
            if centre_id not in self.active_centre_connections:
                self.active_centre_connections[centre_id] = set()
            self.active_centre_connections[centre_id].add(websocket)

        log.debug("ws.connected", user_id=user_id, centre_id=centre_id)

    def disconnect(self, websocket: WebSocket, user_id: str, centre_id: str | None = None) -> None:
        if user_id in self.active_user_connections:
            self.active_user_connections[user_id].discard(websocket)
            if not self.active_user_connections[user_id]:
                del self.active_user_connections[user_id]

        if centre_id and centre_id in self.active_centre_connections:
            self.active_centre_connections[centre_id].discard(websocket)
            if not self.active_centre_connections[centre_id]:
                del self.active_centre_connections[centre_id]

        log.debug("ws.disconnected", user_id=user_id, centre_id=centre_id)

    async def send_to_farmer(self, user_id: str, message: dict) -> None:
        """Send message to all connections for a specific user (farmer)."""
        connections = self.active_user_connections.get(user_id, set())
        stale = set()
        for ws in connections:
            if ws.client_state == WebSocketState.CONNECTED:
                try:
                    await ws.send_json(message)
                except Exception:
                    stale.add(ws)
            else:
                stale.add(ws)

        for ws in stale:
            self.disconnect(ws, user_id=user_id)

    async def broadcast_to_centre(self, centre_id: str, message: dict) -> None:
        """Broadcast message to all connections subscribing to a centre (officers & queue screen)."""
        connections = self.active_centre_connections.get(centre_id, set())
        stale = set()
        for ws in connections:
            if ws.client_state == WebSocketState.CONNECTED:
                try:
                    await ws.send_json(message)
                except Exception:
                    stale.add(ws)
            else:
                stale.add(ws)

        for ws in stale:
            # We don't have user_id here easily without reverse mapping,
            # but discard works if we just discard from centre set.
            self.active_centre_connections[centre_id].discard(ws)


connection_manager = ConnectionManager()
