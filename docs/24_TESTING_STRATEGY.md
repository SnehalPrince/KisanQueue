# 24 — Testing Strategy

## Principle
Tests serve two goals for this project:
1. **Demo safety**: ensure the SIH demo flow cannot break from a regression.
2. **Logic correctness**: the ETA engine and queue state machine are the core of KisanQueue's value — they must behave correctly under edge cases.

Do not waste hackathon time testing trivial CRUD boilerplate. Prioritize tests that cover the critical paths a judge will observe.

---

## Priority Stack

| Priority | Test Type | Rationale |
|---|---|---|
| P0 | ETA engine unit tests | The ETA formula is the technical centerpiece — must be provably correct |
| P0 | Queue state machine tests | Illegal state transitions must be rejected |
| P0 | QR token sign/verify tests | Security correctness of HMAC signing |
| P0 | Capacity update → ETA propagation (integration) | Core demo moment: officer changes status → farmer ETA updates |
| P1 | API endpoint tests (critical paths) | Smoke test join, check-in, capacity update |
| P1 | Auth tests (JWT role enforcement) | Officer cannot access farmer routes and vice versa |
| P2 | Frontend component tests | Centre card, ETA display, Hindi/English toggle |
| P2 | WebSocket integration test | ETA_UPDATED event reaches subscribed client |
| P3 | Accessibility tests | ARIA labels, tab order, contrast |

---

## Backend Tests (Python + pytest)

### Setup
```bash
pytest  # run all tests
pytest tests/test_eta.py -v  # run ETA tests specifically
pytest tests/ -k "integration"  # run integration tests only
```

Test database: SQLite in-memory or a separate PostgreSQL test DB (preferred). Fixtures create/teardown schema per test session.

---

### P0: ETA Engine Unit Tests

```python
# tests/test_eta.py

import pytest
from modules.eta.engine import compute_eta_formula, Confidence

# Test normal day scenario
def test_eta_normal_day():
    result = compute_eta_formula(N=14, T_base=25, C=2, F=1.00, status="NORMAL", cap_age_minutes=5)
    assert result.eta_minutes == 175  # ceil(14*25/(2*1.00))
    assert result.confidence == Confidence.HIGH

# Test lifting delay
def test_eta_lifting_delay():
    result = compute_eta_formula(N=14, T_base=25, C=1, F=0.60, status="LIFTING_DELAYED", cap_age_minutes=2)
    assert result.eta_minutes == 584  # ceil(14*25/(1*0.60))
    assert result.confidence == Confidence.LOW

# Test position 1 (almost next)
def test_eta_position_one():
    result = compute_eta_formula(N=1, T_base=25, C=2, F=1.00, status="NORMAL", cap_age_minutes=5)
    assert result.eta_minutes == 13  # ceil(1*25/(2*1.00))

# Test paused centre
def test_eta_paused_centre():
    result = compute_eta_formula(N=10, T_base=25, C=2, F=1.00, status="PAUSED", cap_age_minutes=0)
    assert result.eta_minutes is None
    assert result.confidence == Confidence.NA

# Test zero counters
def test_eta_zero_counters():
    result = compute_eta_formula(N=10, T_base=25, C=0, F=1.00, status="NORMAL", cap_age_minutes=5)
    assert result.eta_minutes is None

# Test stale data confidence
def test_eta_stale_data_downgrades_confidence():
    result = compute_eta_formula(N=5, T_base=25, C=2, F=1.00, status="NORMAL", cap_age_minutes=45)
    assert result.confidence == Confidence.LOW

# Test F floor clamping (prevents division by zero)
def test_eta_f_floor_clamping():
    result = compute_eta_formula(N=5, T_base=25, C=2, F=0.00, status="REDUCED_CAPACITY", cap_age_minutes=5)
    # F clamped to 0.05
    expected = math.ceil(5 * 25 / (2 * 0.05))
    assert result.eta_minutes == expected

# Test the exact Scenario C from demo script
def test_eta_demo_scenario_c_before():
    result = compute_eta_formula(N=5, T_base=25, C=2, F=1.00, status="NORMAL", cap_age_minutes=5)
    assert result.eta_minutes == 63

def test_eta_demo_scenario_c_after():
    result = compute_eta_formula(N=5, T_base=25, C=1, F=0.60, status="LIFTING_DELAYED", cap_age_minutes=0)
    assert result.eta_minutes == 209
```

---

### P0: Queue State Machine Tests

```python
# tests/test_queue_state.py

async def test_farmer_cannot_join_paused_centre(client, db, paused_centre, farmer_token):
    response = await client.post("/v1/queue/join",
        json={"centre_id": str(paused_centre.id), "crop": "Wheat"},
        headers={"Authorization": f"Bearer {farmer_token}"}
    )
    assert response.status_code == 409
    assert response.json()["error_code"] == "CENTRE_PAUSED"

async def test_duplicate_join_rejected(client, db, normal_centre, farmer_token, existing_queue_entry):
    response = await client.post("/v1/queue/join",
        json={"centre_id": str(normal_centre.id), "crop": "Wheat"},
        headers={"Authorization": f"Bearer {farmer_token}"}
    )
    assert response.status_code == 409
    assert response.json()["error_code"] == "QUEUE_ALREADY_ACTIVE"

async def test_farmer_can_cancel_waiting_entry(client, db, waiting_entry, farmer_token):
    response = await client.delete(f"/v1/queue/my-entry/{waiting_entry.id}",
        headers={"Authorization": f"Bearer {farmer_token}"}
    )
    assert response.status_code == 200
    assert response.json()["status"] == "CANCELLED"

async def test_cannot_cancel_processing_entry(client, db, processing_entry, farmer_token):
    response = await client.delete(f"/v1/queue/my-entry/{processing_entry.id}",
        headers={"Authorization": f"Bearer {farmer_token}"}
    )
    assert response.status_code == 409
    assert response.json()["error_code"] == "CANNOT_CANCEL"
```

---

### P0: QR Token Tests

```python
# tests/test_qr.py

from modules.qr.service import QRService

def test_qr_sign_and_verify():
    service = QRService()
    qr_data = service._sign({"qeid": "uuid-1", "cid": "centre-1", "fid": "farmer-1", "tn": 47, "exp": future_unix(), "iss": "kisanqueue"})
    payload = service._verify(qr_data)
    assert payload is not None
    assert payload["tn"] == 47

def test_qr_invalid_signature_rejected():
    service = QRService()
    tampered = "KQ:eyJxZWlkIjoidXVpZC0xIn0.invalid_signature"
    assert service._verify(tampered) is None

def test_qr_expired_rejected():
    service = QRService()
    payload = {"qeid": "uuid-1", "cid": "centre-1", "fid": "farmer-1", "tn": 47, "exp": past_unix(), "iss": "kisanqueue"}
    qr_data = service._sign(payload)
    assert service._verify(qr_data) is None

def test_qr_revoked_rejected(client, db, revoked_token, officer_token):
    response = await client.post("/v1/officer/checkin",
        json={"qr_data": revoked_token.qr_data},
        headers={"Authorization": f"Bearer {officer_token}"}
    )
    assert response.status_code == 400
    # error_code is INVALID_QR_TOKEN (revoked treated same as invalid for security)

def test_qr_centre_mismatch_rejected(client, db, valid_token, officer_at_different_centre):
    response = await client.post("/v1/officer/checkin",
        json={"qr_data": valid_token.qr_data},
        headers={"Authorization": f"Bearer {officer_at_different_centre}"}
    )
    assert response.status_code == 403
    assert response.json()["error_code"] == "CENTRE_MISMATCH"
```

---

### P0: Capacity Update → ETA Propagation (Integration)

This is the most important integration test — it validates the core demo flow.

```python
# tests/test_integration_eta_propagation.py

async def test_officer_capacity_update_triggers_eta_recalculation(client, db, normal_centre, officer_token, farmer_in_queue):
    # 1. Get initial ETA
    status_before = await client.get("/v1/queue/my-status", headers=farmer_headers)
    eta_before = status_before.json()["eta"]["minutes"]

    # 2. Officer reports lifting delay
    await client.post("/v1/officer/capacity", json={
        "status": "LIFTING_DELAYED",
        "capacity_factor": 0.60,
        "active_counters": 1,
        "notes": "FCI truck delayed"
    }, headers=officer_headers)

    # 3. Verify ETA has increased
    status_after = await client.get("/v1/queue/my-status", headers=farmer_headers)
    eta_after = status_after.json()["eta"]["minutes"]

    assert eta_after > eta_before
    assert status_after.json()["eta"]["confidence"] == "LOW"
    assert status_after.json()["centre_operational_status"] == "LIFTING_DELAYED"
```

---

### P1: Auth & RBAC Tests

```python
# tests/test_auth.py

async def test_farmer_cannot_access_officer_route(client, farmer_token):
    response = await client.post("/v1/officer/capacity", json={...},
        headers={"Authorization": f"Bearer {farmer_token}"})
    assert response.status_code == 403

async def test_officer_cannot_access_other_centres_queue(client, officer_centre_A_token, centre_B):
    response = await client.get(f"/v1/queue/{centre_B.id}/list",
        headers={"Authorization": f"Bearer {officer_centre_A_token}"})
    assert response.status_code == 403

async def test_expired_token_rejected(client, expired_jwt):
    response = await client.get("/v1/queue/my-status",
        headers={"Authorization": f"Bearer {expired_jwt}"})
    assert response.status_code == 401

async def test_farmer_cannot_view_other_farmers_qr(client, farmer_A_token, farmer_B_queue_entry):
    response = await client.get(f"/v1/qr/{farmer_B_queue_entry.id}",
        headers={"Authorization": f"Bearer {farmer_A_token}"})
    assert response.status_code == 403
```

---

## Frontend Tests (Vitest + React Testing Library)

```typescript
// tests/CentreCard.test.tsx
test("shows STALE warning when data is > 30 minutes old", () => {
  render(<CentreCard centre={mockCentreWithStaleness(45)} />);
  expect(screen.getByText(/data may be outdated/i)).toBeInTheDocument();
});

test("hides Join Queue button when centre is PAUSED", () => {
  render(<CentreDetail centre={{...mockCentre, status: "PAUSED"}} />);
  expect(screen.queryByRole("button", { name: /join queue/i })).not.toBeInTheDocument();
});

// tests/ETADisplay.test.tsx
test("rounds ETA to nearest 5 minutes when > 30 min", () => {
  render(<ETADisplay etaMinutes={87} confidence="MEDIUM" />);
  expect(screen.getByText(/~85 min/i)).toBeInTheDocument(); // rounded to 85
});

test("shows 'Centre paused' when eta is null", () => {
  render(<ETADisplay etaMinutes={null} confidence="NA" />);
  expect(screen.getByText(/centre paused/i)).toBeInTheDocument();
});

// tests/LanguageToggle.test.tsx
test("switching to Hindi renders Hindi text", () => {
  render(<App />, { wrapper: I18nProvider });
  fireEvent.click(screen.getByRole("button", { name: /हिंदी/i }));
  expect(screen.getByText(/केंद्र खोजें/i)).toBeInTheDocument();
});
```

---

## WebSocket Integration Test (P2)

```python
# tests/test_websocket.py
import asyncio, websockets, json

async def test_eta_updated_event_received_after_capacity_change():
    # Connect farmer WS client
    async with websockets.connect(f"ws://localhost:8000/ws/centre-001?token={farmer_jwt}") as ws:
        # Read initial snapshot
        initial = json.loads(await ws.recv())
        assert initial["event"] == "CONNECTED"

        # Officer updates capacity (via REST in a background task)
        asyncio.create_task(officer_update_capacity("LIFTING_DELAYED", 0.60, 1))

        # Expect ETA_UPDATED event within 3 seconds
        with timeout(3):
            msg = json.loads(await ws.recv())
        assert msg["event"] in ("CENTRE_STATUS_CHANGED", "ETA_UPDATED")
```

---

## Test Running Commands

```bash
# Backend
cd backend
pytest tests/ -v --tb=short
pytest tests/test_eta.py tests/test_qr.py -v  # critical path only

# Frontend
cd frontend
npx vitest run
npx vitest run --reporter=verbose
```

---

## What NOT to Test (in the 7-hour build)

- ORM model definition correctness (trust SQLAlchemy).
- Third-party library behavior (JWT library, QR library).
- UI pixel-perfect layout.
- Performance/load testing.
- Full E2E browser automation (time cost too high for MVP).
