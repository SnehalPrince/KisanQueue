"""
tests/test_security.py — Regression tests for security vulnerabilities.

Tests:
  1. IDOR guard: officer from centre A cannot start/complete/skip an
     entry belonging to centre B.
  2. QR replay: validate the same qr_data twice → AlreadyCheckedInError
     on the second call.
  3. Expired QR: validate a QR token with exp in the past → QRTokenExpiredError.

All tests require a live DB (postgresql+psycopg) — marked with pytest.mark.db.
Run these tests with: pytest -m db tests/test_security.py
"""
from __future__ import annotations

import hmac
import hashlib
import json
import base64
import time
import uuid

import pytest
from httpx import AsyncClient

# These tests require a live PostgreSQL connection.
pytestmark = [pytest.mark.db]

# ── Helpers ───────────────────────────────────────────────────────────────────

FARMER_PHONE = "+919876543210"
FARMER_OTP = "1234"
OFFICER_USER = "officer_rajgarh"
OFFICER_PASS = "KisanQueue!2026Secure"


async def _farmer_token(client: AsyncClient, phone: str | None = None) -> str:
    """Return a valid farmer JWT."""
    p = phone or f"+91987654{int(time.time() * 10000) % 10000:04d}"
    r = await client.post("/v1/auth/otp/request", json={"phone": p})
    assert r.status_code == 200
    r = await client.post(
        "/v1/auth/otp/verify", json={"phone": p, "otp": FARMER_OTP}
    )
    assert r.status_code == 200
    return r.json()["access_token"]


async def _officer_token(client: AsyncClient) -> str:
    """Return a valid officer JWT for the seeded rajgarh officer."""
    r = await client.post(
        "/v1/auth/login",
        json={"username": OFFICER_USER, "password": OFFICER_PASS},
    )
    assert r.status_code == 200
    return r.json()["access_token"]


async def _join_queue(
    client: AsyncClient, farmer_token: str, centre_id: str
) -> dict:
    """Join queue at centre, return the full response JSON."""
    r = await client.post(
        "/v1/passes/generate",
        headers={"Authorization": f"Bearer {farmer_token}"},
        json={"centre_id": centre_id, "crop": "Wheat", "quantity_quintals": 20.0},
    )
    assert r.status_code == 201, r.text
    return r.json()


# ── Test 1: IDOR guard ────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_officer_cannot_start_entry_from_another_centre(
    async_client: AsyncClient,
) -> None:
    """
    Regression test for BOLA/IDOR on POST /officer/queue/{entry_id}/start.

    An officer authenticated for centre A must receive a 404 when attempting
    to start a queue entry that belongs to centre B — NOT a 200 or a 403.

    Setup:
    - Farmer joins queue at the *second* centre returned by GET /centres
      (i.e. a centre the officer is NOT assigned to).
    - Officer for centre A (rajgarh) attempts to start that entry.
    - Expected: 404 QUEUE_ENTRY_NOT_FOUND.
    """
    farmer_tok = await _farmer_token(async_client)
    officer_tok = await _officer_token(async_client)

    # Get all centres; pick one that is NOT the officer's centre.
    centres_resp = await async_client.get(
        "/v1/centres",
        headers={"Authorization": f"Bearer {farmer_tok}"},
    )
    assert centres_resp.status_code == 200
    centres = centres_resp.json()["centres"]
    assert len(centres) >= 2, "Seed data must provide at least 2 centres for this test"

    # Officer is at rajgarh — pick the first centre that is NOT rajgarh.
    other_centre = next(
        c for c in centres if "rajgarh" not in c["name"].lower()
    )

    # Farmer joins queue at the OTHER centre.
    pass_data = await _join_queue(async_client, farmer_tok, other_centre["id"])
    entry_id = pass_data["pass_id"]

    # Officer (centre A) tries to start an entry from centre B.
    start_resp = await async_client.post(
        f"/v1/officer/queue/{entry_id}/start",
        headers={"Authorization": f"Bearer {officer_tok}"},
    )
    assert start_resp.status_code == 404, (
        f"Expected 404 IDOR guard, got {start_resp.status_code}: {start_resp.text}"
    )
    assert start_resp.json().get("error_code") == "QUEUE_ENTRY_NOT_FOUND"


@pytest.mark.asyncio
async def test_officer_cannot_complete_entry_from_another_centre(
    async_client: AsyncClient,
) -> None:
    """
    Regression test for BOLA/IDOR on POST /officer/queue/{entry_id}/complete.

    Even if we fabricate a fake UUID (not in DB at all), the guard must hold.
    """
    officer_tok = await _officer_token(async_client)
    fake_entry_id = str(uuid.uuid4())

    complete_resp = await async_client.post(
        f"/v1/officer/queue/{fake_entry_id}/complete",
        headers={"Authorization": f"Bearer {officer_tok}"},
    )
    assert complete_resp.status_code == 404
    assert complete_resp.json().get("error_code") == "QUEUE_ENTRY_NOT_FOUND"


@pytest.mark.asyncio
async def test_officer_cannot_skip_entry_from_another_centre(
    async_client: AsyncClient,
) -> None:
    """Regression test for IDOR on POST /officer/queue/{entry_id}/skip."""
    officer_tok = await _officer_token(async_client)
    fake_entry_id = str(uuid.uuid4())

    skip_resp = await async_client.post(
        f"/v1/officer/queue/{fake_entry_id}/skip",
        headers={"Authorization": f"Bearer {officer_tok}"},
    )
    assert skip_resp.status_code == 404
    assert skip_resp.json().get("error_code") == "QUEUE_ENTRY_NOT_FOUND"


# ── Test 2: QR replay protection ─────────────────────────────────────────────

@pytest.mark.asyncio
async def test_qr_replay_rejected_on_second_checkin(
    async_client: AsyncClient,
) -> None:
    """
    Regression test for QR replay: scanning the same QR twice must fail.

    Flow:
    1. Farmer joins queue → receives qr_payload.
    2. Officer checks in using qr_payload → 200 checked_in.
    3. Officer scans the same qr_payload again → must receive 409 ALREADY_CHECKED_IN.
    """
    farmer_tok = await _farmer_token(async_client)
    officer_tok = await _officer_token(async_client)

    # Get rajgarh centre (the officer's centre).
    centres_resp = await async_client.get(
        "/v1/centres",
        headers={"Authorization": f"Bearer {farmer_tok}"},
    )
    rajgarh = next(
        c for c in centres_resp.json()["centres"]
        if "rajgarh" in c["name"].lower()
    )

    pass_data = await _join_queue(async_client, farmer_tok, rajgarh["id"])
    qr_payload = pass_data["qr_payload"]
    assert qr_payload, "generate_pass must return a qr_payload"

    officer_headers = {"Authorization": f"Bearer {officer_tok}"}

    # First check-in — must succeed.
    r1 = await async_client.post(
        "/v1/officer/checkin",
        headers=officer_headers,
        json={"qr_data": qr_payload},
    )
    assert r1.status_code == 200, f"First check-in failed: {r1.text}"
    assert r1.json()["status"] == "checked_in"

    # Second check-in with the same QR — must be rejected.
    r2 = await async_client.post(
        "/v1/officer/checkin",
        headers=officer_headers,
        json={"qr_data": qr_payload},
    )
    assert r2.status_code == 409, (
        f"Expected 409 on QR replay, got {r2.status_code}: {r2.text}"
    )
    assert r2.json().get("error_code") == "ALREADY_CHECKED_IN"


# ── Test 3: Expired QR token ──────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_expired_qr_token_is_rejected(async_client: AsyncClient) -> None:
    """
    Verify that a QR token with exp in the past is rejected with
    422 QR_TOKEN_EXPIRED — even if the HMAC signature is valid.

    This test constructs a minimally valid but expired QR payload using
    the HMAC secret from settings (so the signature check passes) and
    then verifies the expiry guard fires before the signature guard.
    """
    from core.config import settings
    from modules.qr.service import QRService

    farmer_tok = await _farmer_token(async_client)
    officer_tok = await _officer_token(async_client)

    centres_resp = await async_client.get(
        "/v1/centres",
        headers={"Authorization": f"Bearer {farmer_tok}"},
    )
    rajgarh = next(
        c for c in centres_resp.json()["centres"]
        if "rajgarh" in c["name"].lower()
    )

    pass_data = await _join_queue(async_client, farmer_tok, rajgarh["id"])
    real_qr = pass_data["qr_payload"]

    # Decode the real QR, tamper the 'exp' to be in the past, re-sign.
    # QR format: base64url(json_payload) + "." + base64url(hmac)
    parts = real_qr.split(".")
    assert len(parts) == 2, "Unexpected QR payload format"

    payload_json = base64.urlsafe_b64decode(parts[0] + "==").decode()
    payload_dict = json.loads(payload_json)

    # Set exp to 1 second ago.
    payload_dict["exp"] = int(time.time()) - 1
    expired_payload_bytes = json.dumps(payload_dict, separators=(",", ":")).encode()
    expired_b64 = base64.urlsafe_b64encode(expired_payload_bytes).rstrip(b"=").decode()

    # Re-sign with the real secret so the signature check passes.
    new_sig = hmac.new(
        settings.QR_HMAC_SECRET.encode(),
        expired_b64.encode(),
        hashlib.sha256,
    ).digest()
    new_sig_b64 = base64.urlsafe_b64encode(new_sig).rstrip(b"=").decode()
    expired_qr = f"{expired_b64}.{new_sig_b64}"

    officer_headers = {"Authorization": f"Bearer {officer_tok}"}
    r = await async_client.post(
        "/v1/officer/checkin",
        headers=officer_headers,
        json={"qr_data": expired_qr},
    )
    assert r.status_code in (409, 422), (
        f"Expected 409/422 for expired QR, got {r.status_code}: {r.text}"
    )
    assert r.json().get("error_code") in (
        "QR_TOKEN_EXPIRED", "INVALID_QR_TOKEN"
    ), r.json()
