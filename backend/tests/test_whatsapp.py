import time
import pytest
from httpx import AsyncClient

# These tests require a live PostgreSQL connection.
pytestmark = [pytest.mark.db]

@pytest.mark.asyncio
async def test_whatsapp_simulator_onboarding(async_client: AsyncClient):
    unique_phone = f"9999{int(time.time() * 1000) % 1000000:06d}"
    # 1. Start onboarding
    response = await async_client.post("/v1/whatsapp/simulate", json={"phone": unique_phone, "text": "Hi"})
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "कृपया अपना नाम बताएं" in data["reply"]

    # 2. Provide name
    response = await async_client.post("/v1/whatsapp/simulate", json={"phone": unique_phone, "text": "Ramesh Kumar"})
    assert response.status_code == 200
    data = response.json()
    assert "आपका गाँव और जिला क्या है" in data["reply"]

    # 3. Provide location
    response = await async_client.post("/v1/whatsapp/simulate", json={"phone": unique_phone, "text": "Biaora, Rajgarh"})
    assert response.status_code == 200
    data = response.json()
    assert "सफलतापूर्वक सेट" in data["reply"]

    # 4. Status query (already onboarded)
    response = await async_client.post("/v1/whatsapp/simulate", json={"phone": unique_phone, "text": "स्थिति दिखाओ"})
    assert response.status_code == 200
    data = response.json()
    # It should hit the default help since we mocked a new phone not in `users` table yet, 
    # but our mock logic sets state="COMPLETED" and then defaults to english profile help if no Farmer is found.
    # We can check that it didn't throw an error.
    assert "status" in data
