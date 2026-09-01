"""
tests/conftest.py — Pytest configuration.
"""
from __future__ import annotations

import pytest
from httpx import AsyncClient, ASGITransport

from main import app
from core.database import init_db_pool, close_db_pool


@pytest.fixture(autouse=True)
async def setup_db():
    await init_db_pool()
    yield
    await close_db_pool()

@pytest.fixture
async def async_client() -> AsyncClient:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client
