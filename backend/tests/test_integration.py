"""
tests/test_integration.py — Integration tests for core KisanQueue backend flows.
"""
import pytest
from httpx import AsyncClient

# These tests require a live PostgreSQL connection.
pytestmark = [pytest.mark.db]


@pytest.mark.asyncio
async def test_auth_and_pass_generation_flow(async_client: AsyncClient):
    # 1. OTP Request
    resp = await async_client.post("/v1/auth/otp/request", json={"phone": "+919999999999"})
    assert resp.status_code == 200
    assert resp.json()["success"] == True
    
    # 2. OTP Verify
    resp = await async_client.post("/v1/auth/otp/verify", json={"phone": "+919999999999", "otp": "1234"})
    assert resp.status_code == 200
    token = resp.json()["access_token"]
    
    # 3. List Centres
    headers = {"Authorization": f"Bearer {token}"}
    resp = await async_client.get("/v1/centres", headers=headers)
    assert resp.status_code == 200
    centres = resp.json()["centres"]
    assert len(centres) > 0
    centre_id = centres[0]["id"]
    
    # 4. Generate Pass
    resp = await async_client.post("/v1/passes/generate", headers=headers, json={
        "centre_id": centre_id,
        "crop": "Wheat",
        "quantity_quintals": 45.0
    })
    assert resp.status_code == 201
    pass_data = resp.json()
    assert pass_data["status"] == "ACTIVE"
    assert "token" in pass_data

@pytest.mark.asyncio
async def test_officer_login_flow(async_client: AsyncClient):
    # Officer login
    resp = await async_client.post("/v1/auth/login", json={
        "username": "officer_rajgarh",
        "password": "KisanQueue!2026Secure"
    })
    assert resp.status_code == 200
    assert "access_token" in resp.json()
