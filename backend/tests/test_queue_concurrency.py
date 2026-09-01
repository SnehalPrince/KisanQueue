"""
tests/test_queue_concurrency.py — Regression tests for queue concurrency race.

Tests:
  1. Two simultaneous generate_pass requests for the same farmer+centre must
     produce exactly one 201 and one 409 — no duplicate active entries.
  2. After concurrent joins by different farmers, no two WAITING entries at
     the same centre share the same queue_position.

All tests require a live DB — marked with pytest.mark.db.
Run with: pytest -m db tests/test_queue_concurrency.py
"""
from __future__ import annotations

import asyncio
import pytest
from httpx import AsyncClient

pytestmark = [pytest.mark.db]

# Seeded demo credentials
FARMER_PHONE = "+919876543210"
FARMER_OTP = "1234"
# A second farmer must exist in seed data; if not, this test is skipped.
FARMER2_PHONE = "+919876543211"
FARMER2_OTP = "1234"


async def _farmer_token(client: AsyncClient, phone: str, otp: str) -> str | None:
    r = await client.post("/v1/auth/otp/request", json={"phone": phone})
    if r.status_code != 200:
        return None
    r = await client.post("/v1/auth/otp/verify", json={"phone": phone, "otp": otp})
    if r.status_code != 200:
        return None
    return r.json()["access_token"]


async def _join(client: AsyncClient, token: str, centre_id: str) -> int:
    """Attempt to join queue; return HTTP status code."""
    r = await client.post(
        "/v1/passes/generate",
        headers={"Authorization": f"Bearer {token}"},
        json={"centre_id": centre_id, "crop": "Wheat", "quantity_quintals": 10.0},
    )
    return r.status_code


@pytest.mark.asyncio
async def test_concurrent_join_same_farmer_same_centre(
    async_client: AsyncClient,
) -> None:
    """
    Regression test for TOCTOU race in generate_pass.

    Fire two simultaneous join requests for the same farmer + centre.
    Expected outcome: exactly one 201 and one 409 (DuplicateQueueEntryError).
    A 500 (uncaught IntegrityError) is also treated as a failure.
    """
    tok = await _farmer_token(async_client, FARMER_PHONE, FARMER_OTP)
    assert tok is not None, "Demo farmer auth failed — check seed data"

    centres_resp = await async_client.get(
        "/v1/centres",
        headers={"Authorization": f"Bearer {tok}"},
    )
    assert centres_resp.status_code == 200
    centres = centres_resp.json()["centres"]
    centre_id = centres[0]["id"]

    # Fire two concurrent requests. asyncio.gather preserves order.
    status_a, status_b = await asyncio.gather(
        _join(async_client, tok, centre_id),
        _join(async_client, tok, centre_id),
    )

    statuses = sorted([status_a, status_b])

    # One must succeed (201), the other must conflict (409).
    assert statuses == [201, 409], (
        f"Concurrent join produced unexpected statuses: {status_a}, {status_b}. "
        "Expected exactly one 201 and one 409."
    )


@pytest.mark.asyncio
async def test_no_duplicate_queue_positions_after_concurrent_joins(
    async_client: AsyncClient,
) -> None:
    """
    After two farmers join the queue concurrently, no two WAITING entries
    at the same centre share the same queue_position.

    Requires a second seeded farmer (FARMER2_PHONE). If that farmer doesn't
    exist in the seed data, the test is skipped.
    """
    tok1 = await _farmer_token(async_client, FARMER_PHONE, FARMER_OTP)
    tok2 = await _farmer_token(async_client, FARMER2_PHONE, FARMER2_OTP)

    if tok1 is None or tok2 is None:
        pytest.skip("Second demo farmer not in seed data — skipping concurrency test")

    centres_resp = await async_client.get(
        "/v1/centres",
        headers={"Authorization": f"Bearer {tok1}"},
    )
    centres = centres_resp.json()["centres"]
    centre_id = centres[0]["id"]

    # Both farmers join concurrently.
    status_a, status_b = await asyncio.gather(
        _join(async_client, tok1, centre_id),
        _join(async_client, tok2, centre_id),
    )

    assert status_a == 201, f"Farmer 1 join failed: {status_a}"
    assert status_b == 201, f"Farmer 2 join failed: {status_b}"

    # Fetch the officer queue for the centre and verify unique positions.
    # We need an officer token to use the officer queue endpoint.
    # Fall back to checking via the farmer's own status endpoint.
    r1 = await async_client.get(
        "/v1/queue/my-status",
        headers={"Authorization": f"Bearer {tok1}"},
    )
    r2 = await async_client.get(
        "/v1/queue/my-status",
        headers={"Authorization": f"Bearer {tok2}"},
    )
    assert r1.status_code == 200
    assert r2.status_code == 200

    pos1 = r1.json().get("queue_position")
    pos2 = r2.json().get("queue_position")

    assert pos1 != pos2, (
        f"Duplicate queue_position detected: both farmers got position {pos1}. "
        "TOCTOU race not resolved."
    )
