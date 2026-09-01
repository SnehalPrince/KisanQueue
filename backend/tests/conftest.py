"""
tests/conftest.py — Pytest configuration.

Markers:
  db — tests that require a live PostgreSQL connection. Apply with
       @pytest.mark.db or pytestmark = [pytest.mark.db] at module level.
       Pure unit tests (e.g. test_eta.py) do NOT use this marker and
       run without any infrastructure.
"""
from __future__ import annotations

import pytest
from httpx import AsyncClient, ASGITransport

from main import app
from core.database import init_db_pool, close_db_pool


@pytest.fixture
async def db_pool():
    """Initialise and tear down the async DB connection pool.

    Use via @pytest.mark.usefixtures("db_pool") or as an explicit
    fixture argument. Do NOT add autouse=True — tests without a DB
    dependency must remain infrastructure-free.
    """
    await init_db_pool()
    yield
    await close_db_pool()


@pytest.fixture
async def async_client(db_pool) -> AsyncClient:
    """HTTP test client backed by the ASGI app (requires db_pool)."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client
