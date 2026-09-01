"""
core/database.py — Async SQLAlchemy engine and session factory.

Uses asyncpg driver. Pool is configured per 12_BACKEND_ARCHITECTURE.md §6:
  pool_size=20, max_overflow=10, pool_timeout=10

Session dependency auto-commits on success and rolls back on any exception.
"""
from __future__ import annotations

from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from core.config import settings

# ── Engine ────────────────────────────────────────────────────────────────────
_engine: AsyncEngine | None = None
_async_session_factory: async_sessionmaker[AsyncSession] | None = None


def _build_engine() -> AsyncEngine:
    """Build and return the async engine (called once at startup)."""
    return create_async_engine(
        settings.DATABASE_URL,
        pool_size=20,
        max_overflow=10,
        pool_timeout=10,
        pool_pre_ping=True,  # detect stale connections before use
        echo=settings.DEBUG,  # log SQL in debug mode only
    )


async def init_db_pool() -> None:
    """Called from the FastAPI lifespan — warms up the connection pool."""
    global _engine, _async_session_factory
    _engine = _build_engine()
    _async_session_factory = async_sessionmaker(
        _engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )
    # Verify connectivity
    async with _engine.connect() as conn:
        from sqlalchemy import text

        await conn.execute(text("SELECT 1"))


async def close_db_pool() -> None:
    """Called from the FastAPI lifespan — drains the pool gracefully."""
    global _engine
    if _engine is not None:
        await _engine.dispose()
        _engine = None


def get_session_factory() -> async_sessionmaker[AsyncSession]:
    """Return the session factory (must be called after init_db_pool)."""
    if _async_session_factory is None:
        raise RuntimeError("Database pool not initialised — call init_db_pool() first")
    return _async_session_factory


# ── Session dependency (used via FastAPI Depends) ─────────────────────────────
async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI dependency that yields an AsyncSession.

    Commits on clean exit; rolls back and re-raises on any exception.
    """
    factory = get_session_factory()
    async with factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
