# 22 — Mock Data

## Purpose
This document defines the complete seeded dataset for the SIH demo. All data is realistic, internally consistent, and designed to support the five demo scenarios. The seed script should load this data into PostgreSQL before the demo.

---

## Centres (3 centres)

| ID | Name | State | District | Status | Avg Processing (min) | Daily Capacity | Counters | Crops |
|---|---|---|---|---|---|---|---|---|
| `centre-001` | Rajgarh Procurement Centre | Madhya Pradesh | Rajgarh | NORMAL → LIFTING_DELAYED (Scenario C) | 25 | 100 | 2 | Wheat, Soybean |
| `centre-002` | Hisar HAFED Centre | Haryana | Hisar | BUSY | 30 | 80 | 2 | Wheat, Barley |
| `centre-003` | Patiala Anaaj Kharid Centre | Punjab | Patiala | PAUSED (Scenario D) | 20 | 120 | 3 | Paddy, Wheat |

---

## Officers (3 officers, one per centre)

| ID | Name | Username | Password | Centre |
|---|---|---|---|---|
| `officer-001` | Suresh Patel | `officer_rajgarh` | `Demo@1234` | centre-001 |
| `officer-002` | Harpreet Singh | `officer_hisar` | `Demo@1234` | centre-002 |
| `officer-003` | Gurpreet Kaur | `officer_patiala` | `Demo@1234` | centre-003 |

---

## Farmers (10 farmers)

| ID | Name | Phone | Language | Village | District | Crop | Aadhaar Last 4 |
|---|---|---|---|---|---|---|---|
| `farmer-001` | Ramesh Kumar | +919876543210 | hi | Biaora | Rajgarh | Wheat | 4521 |
| `farmer-002` | Sunita Devi | +919876543211 | hi | Khilchipur | Rajgarh | Soybean | 8834 |
| `farmer-003` | Mahesh Yadav | +919876543212 | hi | Narsinghgarh | Rajgarh | Wheat | 2291 |
| `farmer-004` | Gurjeet Singh | +919876543213 | hi | Adampur | Hisar | Wheat | 7732 |
| `farmer-005` | Balwant Kaur | +919876543214 | hi | Jakhal | Hisar | Barley | 1190 |
| `farmer-006` | Amarjit Singh | +919876543215 | hi | Samana | Patiala | Paddy | 5567 |
| `farmer-007` | Priya Bai | +919876543216 | hi | Sehore | Rajgarh | Wheat | 3314 |
| `farmer-008` | Devendra Patel | +919876543217 | hi | Rajgarh | Rajgarh | Wheat | 9921 |
| `farmer-009` | Ramkishan | +919876543218 | hi | Biaora | Rajgarh | Soybean | 6678 |
| `farmer-010` | Kamlesh Singh | +919876543219 | hi | Rajgarh | Rajgarh | Wheat | 4410 |

> **Demo login**: Phone `+919876543210`, OTP `1234` → logs in as Ramesh Kumar (farmer-001).

---

## Queue Entries — Centre 001 (Rajgarh) — Demo Day

Simulates a mid-morning queue. Farmer-001 (Ramesh) is at position 9 when the demo starts.

| Token | Farmer | Crop | Qty (q) | Status | Position | Joined At |
|---|---|---|---|---|---|---|
| 39 | farmer-007 (Priya Bai) | Wheat | 22.0 | COMPLETED | — | 06:45 |
| 40 | farmer-008 (Devendra) | Wheat | 55.0 | COMPLETED | — | 07:00 |
| 41 | farmer-009 (Ramkishan) | Soybean | 18.5 | COMPLETED | — | 07:15 |
| 42 | farmer-010 (Kamlesh) | Wheat | 30.0 | COMPLETED | — | 07:30 |
| 43 | farmer-003 (Mahesh) | Wheat | 45.0 | PROCESSING | 1 | 07:45 |
| 44 | (seed-farmer-A) | Wheat | 38.0 | CHECKED_IN | 2 | 08:00 |
| 45 | (seed-farmer-B) | Soybean | 25.0 | WAITING | 3 | 08:10 |
| 46 | (seed-farmer-C) | Wheat | 60.0 | WAITING | 4 | 08:20 |
| 47 | **farmer-001 (Ramesh)** | Wheat | 40.5 | WAITING | **5** | 08:30 |
| 48 | (seed-farmer-D) | Wheat | 33.0 | WAITING | 6 | 08:35 |
| 49 | (seed-farmer-E) | Soybean | 28.0 | WAITING | 7 | 08:40 |
| 50 | (seed-farmer-F) | Wheat | 52.0 | WAITING | 8 | 08:45 |
| 51 | (seed-farmer-G) | Wheat | 19.5 | WAITING | 9 | 08:50 |
| 52 | farmer-002 (Sunita) | Soybean | 14.0 | WAITING | 10 | 08:55 |

> **Note**: 8 additional seed farmers (A–H) exist as minimal rows with only the queue-relevant fields needed for position calculation.

**Initial ETA for Ramesh (farmer-001, position 5)**:
- N=5, T_base=25, C=2, F=1.00 → `ETA = ceil(5×25/(2×1.00)) = 63 min`

---

## Capacity Updates — Rajgarh Centre

Pre-seeded to show a Normal morning. The demo will add a LIFTING_DELAYED update live.

| Time | Status | Capacity Factor | Counters | Notes |
|---|---|---|---|---|
| 07:00 | NORMAL | 1.00 | 2 | Start of day |
| **LIVE DEMO** | LIFTING_DELAYED | 0.60 | 1 | "FCI truck delayed by ~2 hours" |

**Post-update ETA for Ramesh (position 5)**:
- N=5, T_base=25, C=1, F=0.60 → `ETA = ceil(5×25/(1×0.60)) = ceil(208.3) = 209 min ≈ 3h 29m`

This is the "ETA jumps" moment that makes the demo compelling.

---

## Procurement Records (seeded for completed tokens)

| Queue Entry | Farmer | Crop | Qty | Grade | MSP Rate | Total |
|---|---|---|---|---|---|---|
| Token 39 (Priya) | farmer-007 | Wheat | 22.0 | A | ₹2,275 | ₹50,050 |
| Token 40 (Devendra) | farmer-008 | Wheat | 55.0 | B | ₹2,275 | ₹1,25,125 |
| Token 41 (Ramkishan) | farmer-009 | Soybean | 18.5 | A | ₹4,600 | ₹85,100 |

All marked `is_mock = TRUE`.

---

## Payment Status (seeded)

| Farmer | Status | Amount | UTR |
|---|---|---|---|
| farmer-007 | PAID | ₹50,050 | IMPS202609150001 |
| farmer-008 | PROCESSING | ₹1,25,125 | — |
| farmer-009 | PENDING | ₹85,100 | — |

Ramesh's payment (farmer-001) starts as PENDING after demo completion.

---

## Demo Scenarios

### Scenario A — Normal Day
**Centre**: Rajgarh (NORMAL status)
**Data**: As above — 10 queue entries, 2 counters, processing normally.
**Key flow**: Farmer joins → gets position 10 → ETA ~125 min.
**Purpose**: Baseline happy path.

---

### Scenario B — High Congestion
**Centre**: Hisar HAFED (BUSY, 2 counters, F=0.80)
**Data**: 22 farmers waiting.
```
N=22, T_base=30, C=2, F=0.80
ETA = ceil(22×30/(2×0.80)) = ceil(412.5) = 413 min ≈ 6h 53m (Confidence: MEDIUM)
```
**UI shows**: amber status badge, "Busy" label, MEDIUM confidence ETA.
**Purpose**: Shows the system honestly discouraging unnecessary travel.

---

### Scenario C — Lifting Delay
**Centre**: Rajgarh — starts NORMAL, officer changes to LIFTING_DELAYED mid-demo.
**Officer action**: Sets status = LIFTING_DELAYED, capacity_factor = 0.60, active_counters = 1.
```
Before: N=5, T_base=25, C=2, F=1.00 → ETA = 63 min
After:  N=5, T_base=25, C=1, F=0.60 → ETA = 209 min
```
**Purpose**: Core demo moment — ETA nearly triples, farmer sees it without refreshing.

---

### Scenario D — Centre Paused
**Centre**: Patiala Anaaj Kharid (PAUSED)
**UI shows**: red "Paused" badge, "Centre has paused operations" message, no ETA.
**Join queue**: blocked with "Centre is paused — cannot join queue right now."
**Purpose**: Shows graceful handling of worst-case centre condition.

---

### Scenario E — Real-Time Update
**Setup**: Demo Ramesh's screen on one device; officer dashboard on another (or split screen).
1. Officer completes Token 43 (Mahesh) → Ramesh's position shifts from 5 → 4.
2. Officer completes Token 44 → Ramesh 4 → 3.
3. Officer sets LIFTING_DELAYED → Ramesh's ETA jumps.
4. All changes appear on farmer screen without page refresh.
**Purpose**: Live proof of the real-time WebSocket system.

---

## Seed Script Skeleton

```python
# seed.py
import asyncio
from core.database import async_session
from modules.centres.models import Centre
from modules.auth.models import User
# ... etc

CENTRES = [
    {"id": "centre-001", "name": "Rajgarh Procurement Centre", ...},
    ...
]

FARMERS = [
    {"phone": "+919876543210", "name": "Ramesh Kumar", "role": "FARMER", ...},
    ...
]

OFFICERS = [
    {"username": "officer_rajgarh", "password_hash": bcrypt("Demo@1234"), ...},
    ...
]

async def seed():
    async with async_session() as db:
        # Insert centres, users, farmers, officers, queue_entries, capacity_updates, procurement_records, payment_status
        ...

if __name__ == "__main__":
    asyncio.run(seed())
```

Run: `python seed.py` (or `alembic upgrade head && python seed.py`).
