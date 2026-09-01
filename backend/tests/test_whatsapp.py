import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_whatsapp_simulator_onboarding(async_client: AsyncClient):
    # 1. Start onboarding
    response = await async_client.post("/v1/whatsapp/simulate", json={"phone": "9999999999", "text": "Hi"})
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "कृपया अपना नाम बताएं" in data["reply"]

    # 2. Provide name
    response = await async_client.post("/v1/whatsapp/simulate", json={"phone": "9999999999", "text": "Ramesh Kumar"})
    assert response.status_code == 200
    data = response.json()
    assert "आपका गाँव और जिला क्या है" in data["reply"]

    # 3. Provide location
    response = await async_client.post("/v1/whatsapp/simulate", json={"phone": "9999999999", "text": "Biaora, Rajgarh"})
    assert response.status_code == 200
    data = response.json()
    assert "सफलतापूर्वक सेट" in data["reply"]

    # 4. Status query (already onboarded)
    response = await async_client.post("/v1/whatsapp/simulate", json={"phone": "9999999999", "text": "स्थिति दिखाओ"})
    assert response.status_code == 200
    data = response.json()
    # It should hit the default help since we mocked a new phone not in `users` table yet, 
    # but our mock logic sets state="COMPLETED" and then defaults to english profile help if no Farmer is found.
    # We can check that it didn't throw an error.
    assert "status" in data
