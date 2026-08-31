# 16 — ETA Engine

## Design Philosophy

The ETA engine must satisfy four constraints simultaneously:
1. **Explainable** — a judge, officer, or farmer must be able to understand *why* the number is what it is.
2. **Deterministic** — given the same inputs, it always returns the same output. No randomness, no black-box ML.
3. **Demo-friendly** — officer changes a setting → ETA visibly changes → farmer sees it. The causal chain must be obvious.
4. **Honest** — never claims false precision. ETA is always labelled as an *estimate* with a *confidence level*.

**Decision**: Deterministic formula-based model. ML rejected at MVP stage — it offers no explainability advantage over a well-specified formula when the primary inputs are already known (queue length, processing rate, counters, capacity factor).

---

## Variables

| Variable | Symbol | Source | Notes |
|---|---|---|---|
| Farmers waiting ahead (including currently being processed) | `N` | `COUNT(queue_entries WHERE status IN ('WAITING','CHECKED_IN') AND position <= my_position)` | Recomputed on every ETA call |
| Base processing time (minutes per farmer) | `T_base` | `centres.avg_processing_minutes` | Default 25 min; updated by admin if real data available |
| Number of active counters | `C` | Latest `capacity_updates.active_counters` (fallback: `centres.active_counters_default`) | Officer-reported |
| Capacity factor | `F` | Latest `capacity_updates.capacity_factor` (default 1.00) | 1.00 = normal, 0.60 = 40% reduction |
| Operational status | `S` | Latest `capacity_updates.status` | Affects both formula and confidence |

---

## Formula

### Step 1 — Effective processing time per farmer (per counter)

```
T_eff = T_base / F
```

This models the reality that reduced capacity (lifting delays, fewer resources) increases per-farmer processing time.

**Example**: `T_base = 25 min`, `F = 0.60` → `T_eff = 41.7 min`

---

### Step 2 — Effective parallel throughput per minute

```
throughput_per_minute = C / T_eff
```

Where `C` is the number of simultaneously active counters.

**Example**: `C = 1 counter`, `T_eff = 41.7 min` → `throughput_per_minute = 0.024 farmers/min`

---

### Step 3 — ETA for position N

```
ETA_minutes = ceil(N / throughput_per_minute)
             = ceil(N × T_eff / C)
```

**Simplified combined formula**:

```
ETA_minutes = ceil( N × T_base / (C × F) )
```

---

## Worked Examples

### Example A — Normal Day
```
N = 14, T_base = 25, C = 2, F = 1.00
ETA = ceil(14 × 25 / (2 × 1.00)) = ceil(175) = 175 min ≈ 2h 55m
```

### Example B — Officer reports Lifting Delay (capacity 60%)
```
N = 14, T_base = 25, C = 1, F = 0.60
ETA = ceil(14 × 25 / (1 × 0.60)) = ceil(583.3) = 584 min ≈ 9h 44m
```
→ System should flag as VERY_HIGH and show "Centre experiencing significant delay."

### Example C — Busy but normal capacity
```
N = 14, T_base = 25, C = 2, F = 0.80
ETA = ceil(14 × 25 / (2 × 0.80)) = ceil(218.75) = 219 min ≈ 3h 39m
```

### Example D — Position 1 (next to be called), Normal
```
N = 1, T_base = 25, C = 2, F = 1.00
ETA = ceil(1 × 25 / (2 × 1.00)) = ceil(12.5) = 13 min
```

---

## Confidence Level

The confidence level communicates to the farmer how reliable this estimate is.

| Condition | Confidence | Label (EN) | Label (HI) |
|---|---|---|---|
| `S = NORMAL`, last update < 30 min | `HIGH` | "Good estimate" | "सटीक अनुमान" |
| `S = BUSY` or `S = REDUCED_CAPACITY`, last update < 30 min | `MEDIUM` | "Approximate estimate" | "अनुमानित" |
| `S = LIFTING_DELAYED` | `LOW` | "Rough estimate — delay reported" | "अनुमानित — देरी की सूचना" |
| Last capacity update > 30 min ago (any status) | `LOW` | "Data may be outdated" | "डेटा पुराना हो सकता है" |
| `S = PAUSED` | `N/A` | "Centre paused — ETA unavailable" | "केंद्र बंद है" |

---

## Edge Cases

| Scenario | Handling |
|---|---|
| `C = 0` (all counters closed) | Return `ETA = None`, status display: "Centre not processing. Please wait." |
| `S = PAUSED` | Return `ETA = None`, display pause message |
| `F ≤ 0` | Clamp to minimum `F = 0.05` (prevents division-by-zero; represents extreme slowdown) |
| `N = 0` | ETA = 0 — farmer is next (already at or near front). Display: "You are next!" |
| `N` extremely large (> daily capacity) | Display ETA but add warning: "Queue very long. Consider returning tomorrow." |
| No capacity update exists yet today | Use centre defaults (`active_counters_default`, `F = 1.00`, `S = NORMAL`) and `confidence = MEDIUM` |
| `T_base` not set on centre | Default to 25 min with `confidence = LOW` |

---

## Pseudocode Implementation

```python
# modules/eta/engine.py

from math import ceil
from dataclasses import dataclass
from enum import Enum

class Confidence(str, Enum):
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"
    NA = "NA"

@dataclass
class ETAResult:
    eta_minutes: int | None           # None when PAUSED or C=0
    confidence: Confidence
    factors_used: dict                 # for transparency/debugging
    computed_at: datetime

async def compute(centre_id: UUID, farmer_position: int, db: AsyncSession) -> ETAResult:
    # 1. Get centre base data
    centre = await db.get(Centre, centre_id)
    T_base = centre.avg_processing_minutes  # default 25

    # 2. Get latest capacity update (or use defaults)
    latest_cap = await get_latest_capacity_update(centre_id, db)
    if latest_cap:
        S = latest_cap.status
        F = float(latest_cap.capacity_factor)
        C = latest_cap.active_counters
        cap_age_minutes = (utcnow() - latest_cap.effective_from).total_seconds() / 60
    else:
        S = OperationalStatus.NORMAL
        F = 1.00
        C = centre.active_counters_default
        cap_age_minutes = 9999  # no update ever → treat as stale

    # 3. Handle special statuses
    if S == OperationalStatus.PAUSED or C == 0:
        return ETAResult(eta_minutes=None, confidence=Confidence.NA, ...)

    # 4. Clamp F to prevent division errors
    F = max(F, 0.05)

    # 5. Apply formula
    N = farmer_position  # number of farmers ahead including self
    eta = ceil((N * T_base) / (C * F))

    # 6. Determine confidence
    if S == OperationalStatus.NORMAL and cap_age_minutes < 30:
        confidence = Confidence.HIGH
    elif S in (OperationalStatus.LIFTING_DELAYED,) or cap_age_minutes > 30:
        confidence = Confidence.LOW
    else:
        confidence = Confidence.MEDIUM

    return ETAResult(
        eta_minutes=eta,
        confidence=confidence,
        factors_used={"N": N, "T_base": T_base, "C": C, "F": F, "S": S, "cap_age_minutes": cap_age_minutes},
        computed_at=utcnow()
    )
```

---

## Recalculation Triggers

The engine is called (always synchronously in-process) on:

| Trigger | Who calls | Which farmer(s) get new ETA |
|---|---|---|
| `POST /queue/join` | Queue service | Joining farmer only (initial ETA) |
| `POST /officer/capacity` | Officer service | All WAITING + CHECKED_IN entries at centre |
| `POST /officer/queue/{id}/complete` | Officer service | All WAITING entries behind completed entry |
| `POST /officer/queue/{id}/start` | Officer service | No ETA change — position not yet shifted |
| Entry SKIPPED / NO_SHOW | Officer service | All WAITING entries behind skipped entry |
| Entry CANCELLED | Queue service | All WAITING entries behind cancelled entry |

After each recalculation, results are broadcast via `ConnectionManager.send_to_farmer()` as `ETA_UPDATED` events.

---

## What This Model Does NOT Do

Explicitly out of scope to avoid false precision:
- Does not account for lunch breaks, shift changes, or unexpected equipment failures (unmeasurable without sensors).
- Does not adjust for crop type (Wheat vs Paddy processing differences) in MVP — noted as a post-MVP refinement.
- Does not use historical data to predict future throughput.
- Does not guarantee accuracy — the UI must always label the value as "Estimated Wait" and show the confidence indicator.

---

## UI Representation

The frontend receives `eta_minutes`, `confidence`, and `computed_at`.

**Display rules**:
- Show as: `"~2 घंटे 15 मिनट"` / `"~2h 15m"` (round to nearest 5 minutes when > 30 min to avoid implying false precision).
- Confidence badge: green (HIGH), amber (MEDIUM), red (LOW).
- If `eta_minutes = null`: show `"Centre processing paused"` / `"केंद्र बंद है"`.
- Always show `"Computed at HH:MM"` in small text below.

Full UI spec: `07_UX_UI_DESIGN.md`.
