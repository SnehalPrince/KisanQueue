"""
tests/conftest.py — Pytest configuration.
"""
from __future__ import annotations

import pytest
from httpx import AsyncClient

from main import app


@pytest.fixture
async def async_client() -> AsyncClient:
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client
