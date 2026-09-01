"""
modules/eta/engine.py — KisanQueue ETA calculation engine.

Implements the formula from docs/16_ETA_ENGINE.md exactly:
    ETA = ceil(N × T_base / (C × F))

This MUST produce the same output as frontend/src/lib/eta.ts::computeEta()
for identical inputs. Tests in backend/tests/test_eta.py cross-check all
worked examples from the doc.

Edge cases (per 16_ETA_ENGINE.md §4 "Edge Cases"):
    - C = 0 or status = PAUSED → ETA = None (infinity)
    - F ≤ 0 → clamped to 0.05 (prevents division-by-zero while flagging anomaly)
    - N = 0 → ETA = 0
    - Infinite result → returned as None

Confidence levels (per 16_ETA_ENGINE.md §3):
    HIGH   — status NORMAL + data freshness < 30 min
    MEDIUM — status BUSY or freshness 15–30 min
    LOW    — status LIFTING_DELAYED or REDUCED_CAPACITY, or freshness > 30 min
    NA     — status PAUSED or ETA is None
"""
from __future__ import annotations

import math
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Literal

ConfidenceLevel = Literal["HIGH", "MEDIUM", "LOW", "NA"]
CentreStatus = Literal["NORMAL", "BUSY", "LIFTING_DELAYED", "REDUCED_CAPACITY", "PAUSED"]

# Confidence factors per status (used when no override is supplied)
_STATUS_FACTOR: dict[str, float] = {
    "NORMAL": 1.0,
    "BUSY": 0.8,
    "LIFTING_DELAYED": 0.6,
    "REDUCED_CAPACITY": 0.7,
    "PAUSED": 0.0,
}

# Minimum factor — prevents division by zero for anomalous values
_MIN_FACTOR = 0.05

# Freshness thresholds (minutes)
_HIGH_FRESHNESS_MAX_MINUTES = 30
_MEDIUM_FRESHNESS_MAX_MINUTES = 60


@dataclass
class ETAResult:
    eta_minutes: int | None  # None = indeterminate / paused
    confidence: ConfidenceLevel
    factors_used: dict  # transparency dict for debugging / API response


def compute_eta(
    n: int,
    t_base: int,
    active_counters: int,
    capacity_factor: float,
    status: str = "NORMAL",
    last_update_at: datetime | None = None,
) -> ETAResult:
    """
    Compute ETA and confidence level for a farmer at position *n*.

    Args:
        n:                 Number of farmers ahead + 1 (the farmer's own slot).
                           Use queue_position directly.
        t_base:            Average processing time per farmer in minutes.
        active_counters:   Number of active processing counters (C).
        capacity_factor:   Centre capacity factor (F). 1.0 = normal.
        status:            Current centre status string.
        last_update_at:    When the latest capacity_update was created (for
                           freshness-based confidence degradation).

    Returns:
        ETAResult with eta_minutes (int or None) and confidence.
    """
    factors_used = {
        "n": n,
        "t_base": t_base,
        "active_counters": active_counters,
        "capacity_factor": capacity_factor,
        "status": status,
    }

    # PAUSED or no counters → indeterminate
    if status == "PAUSED" or active_counters <= 0:
        return ETAResult(eta_minutes=None, confidence="NA", factors_used=factors_used)

    # N=0 → done (no wait)
    if n <= 0:
        return ETAResult(eta_minutes=0, confidence="HIGH", factors_used=factors_used)

    # Clamp anomalous factor
    effective_factor = max(capacity_factor, _MIN_FACTOR)
    factors_used["effective_factor"] = effective_factor

    # Core formula: ETA = ceil(N × T_base / (C × F))
    raw = (n * t_base) / (active_counters * effective_factor)
    eta = math.ceil(raw)
    factors_used["raw_minutes"] = raw

    # Confidence calculation
    confidence = _compute_confidence(status, last_update_at)

    return ETAResult(eta_minutes=eta, confidence=confidence, factors_used=factors_used)


def _compute_confidence(status: str, last_update_at: datetime | None) -> ConfidenceLevel:
    """Determine confidence level based on status and data freshness."""
    # Stale data degrades confidence regardless of status
    freshness_minutes = _data_freshness_minutes(last_update_at)

    if status == "PAUSED":
        return "NA"
    if status in ("LIFTING_DELAYED", "REDUCED_CAPACITY"):
        return "LOW"
    if freshness_minutes is not None and freshness_minutes > _HIGH_FRESHNESS_MAX_MINUTES:
        return "LOW"
    if status == "BUSY":
        return "MEDIUM"
    if freshness_minutes is not None and freshness_minutes > 15:
        return "MEDIUM"
    # NORMAL + fresh
    return "HIGH"


def _data_freshness_minutes(last_update_at: datetime | None) -> float | None:
    """Return minutes since last_update_at, or None if unknown."""
    if last_update_at is None:
        return None
    now = datetime.now(timezone.utc)
    if last_update_at.tzinfo is None:
        last_update_at = last_update_at.replace(tzinfo=timezone.utc)
    delta = now - last_update_at
    return delta.total_seconds() / 60
