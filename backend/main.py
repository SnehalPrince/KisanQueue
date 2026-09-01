"""
main.py — KisanQueue FastAPI application entry point.

Startup order:
  1. Logging initialised
  2. Database pool warmed up
  3. Connection manager (WebSocket) ready
  4. Routers mounted

Error envelope format (all errors):
    {
        "error_code": "MACHINE_READABLE_CODE",
        "message": "Human-readable description",
        "detail": null | str,
        "request_id": "uuid"
    }
"""
from __future__ import annotations

import time
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from core.config import settings
from core.database import close_db_pool, init_db_pool
from core.exceptions import KisanQueueError
from core.middleware import CorrelationIdMiddleware

# ── Logging setup ─────────────────────────────────────────────────────────────
import logging

import structlog

logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format="%(message)s",
)

if settings.LOG_FORMAT == "json":
    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            structlog.processors.add_log_level,
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.JSONRenderer(),
        ],
        wrapper_class=structlog.BoundLogger,
        logger_factory=structlog.PrintLoggerFactory(),
    )
else:
    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            structlog.processors.add_log_level,
            structlog.processors.TimeStamper(fmt="%H:%M:%S"),
            structlog.dev.ConsoleRenderer(),
        ],
        wrapper_class=structlog.BoundLogger,
        logger_factory=structlog.PrintLoggerFactory(),
    )

log = structlog.get_logger(__name__)


# ── Lifespan ──────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    log.info("kisanqueue.startup", version=settings.APP_VERSION, env=settings.APP_ENV)
    await init_db_pool()
    log.info("kisanqueue.db_pool_ready")
    yield
    log.info("kisanqueue.shutdown")
    await close_db_pool()


# ── App factory ───────────────────────────────────────────────────────────────
app = FastAPI(
    title="KisanQueue API",
    description="Farmer-first procurement queue and visibility platform (SIH 2026 PS-26032)",
    version=settings.APP_VERSION,
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    openapi_url="/openapi.json" if settings.DEBUG else None,
    lifespan=lifespan,
)

# ── Middleware (added in reverse order of execution) ──────────────────────────
app.add_middleware(CorrelationIdMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Error handlers ────────────────────────────────────────────────────────────
def _request_id(request: Request) -> str:
    return getattr(request.state, "request_id", "unknown")


@app.exception_handler(KisanQueueError)
async def kisan_queue_error_handler(request: Request, exc: KisanQueueError) -> JSONResponse:
    log.warning(
        "kisanqueue.domain_error",
        error_code=exc.error_code,
        message=exc.message,
        path=request.url.path,
        request_id=_request_id(request),
    )
    return JSONResponse(
        status_code=exc.http_status,
        content={
            "error_code": exc.error_code,
            "message": exc.message,
            "detail": exc.detail,
            "request_id": _request_id(request),
        },
    )


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    detail = exc.detail
    if isinstance(detail, dict):
        error_code = detail.get("error_code", "HTTP_ERROR")
        message = detail.get("message", str(exc.detail))
    else:
        error_code = "HTTP_ERROR"
        message = str(detail)

    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error_code": error_code,
            "message": message,
            "detail": None,
            "request_id": _request_id(request),
        },
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    log.exception(
        "kisanqueue.unhandled_error",
        path=request.url.path,
        request_id=_request_id(request),
    )
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error_code": "INTERNAL_ERROR",
            "message": "An unexpected error occurred",
            "detail": str(exc) if settings.DEBUG else None,
            "request_id": _request_id(request),
        },
    )


# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/health", tags=["Infrastructure"])
async def health_check() -> dict:
    """
    Returns 200 OK if the server is alive.

    Does NOT check database connectivity — use /health/db for that.
    """
    return {
        "status": "ok",
        "version": settings.APP_VERSION,
        "env": settings.APP_ENV,
        "timestamp": time.time(),
    }


@app.get("/health/db", tags=["Infrastructure"])
async def health_db(request: Request) -> dict:
    """Returns 200 if the database connection pool is healthy."""
    from sqlalchemy import text

    from core.database import get_session_factory

    factory = get_session_factory()
    async with factory() as session:
        result = await session.execute(text("SELECT 1"))
        row = result.scalar()
    return {"status": "ok", "db": "connected", "ping": row}


# ── Router registration ───────────────────────────────────────────────────────
from modules.auth.router import router as auth_router
from modules.centres.router import router as centres_router
from modules.farmer.router import router as farmer_router
from modules.notifications.router import router as notifications_router
from modules.officer.router import router as officer_router
from modules.procurement.router import router as procurement_router
from modules.queue.router import router as queue_router
from realtime.gateway import router as ws_router

app.include_router(auth_router, prefix="/v1/auth", tags=["Auth"])
app.include_router(farmer_router, prefix="/v1/farmer", tags=["Farmer"])
app.include_router(centres_router, prefix="/v1/centres", tags=["Centres"])
app.include_router(queue_router, prefix="/v1", tags=["Queue"])
app.include_router(officer_router, prefix="/v1/officer", tags=["Officer"])
app.include_router(procurement_router, prefix="/v1", tags=["Procurement"])
app.include_router(notifications_router, prefix="/v1/notifications", tags=["Notifications"])
app.include_router(ws_router, prefix="/v1/realtime", tags=["Realtime"])
