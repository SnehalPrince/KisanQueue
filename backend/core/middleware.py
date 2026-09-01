"""
core/middleware.py — Custom ASGI middleware for KisanQueue.

CorrelationIdMiddleware:
  - Reads X-Request-ID from incoming headers (or generates a new UUID4)
  - Injects it into the response headers
  - Stores it in the request state for use in logging
"""
from __future__ import annotations

import uuid

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response


class CorrelationIdMiddleware(BaseHTTPMiddleware):
    """Ensure every request has a correlation ID for distributed tracing."""

    async def dispatch(self, request: Request, call_next: object) -> Response:
        request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
        request.state.request_id = request_id

        response: Response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        return response
