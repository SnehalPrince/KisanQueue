"""
tests/test_eta.py — Verify the ETA engine matches 16_ETA_ENGINE.md perfectly.
"""
from __future__ import annotations

import math
from datetime import datetime, timedelta, timezone

from modules.eta.engine import compute_eta


def test_base_formula_example_1():
    """
    Example 1 from docs: N=20, T_base=25, C=2, F=1.0.
    ETA = ceil(20 * 25 / (2 * 1.0)) = ceil(250) = 250 minutes.
    Confidence = HIGH.
    """
    res = compute_eta(n=20, t_base=25, active_counters=2, capacity_factor=1.0)
    assert res.eta_minutes == 250
    assert res.confidence == "HIGH"


def test_capacity_reduction_example_2():
    """
    Example 2 from docs: N=20, T_base=25, C=2, F=0.8 (status BUSY).
    ETA = ceil(20 * 25 / (2 * 0.8)) = ceil(500 / 1.6) = ceil(312.5) = 313 minutes.
    Confidence = MEDIUM.
    """
    res = compute_eta(n=20, t_base=25, active_counters=2, capacity_factor=0.8, status="BUSY")
    assert res.eta_minutes == 313
    assert res.confidence == "MEDIUM"


def test_zero_counters_or_paused():
    """
    Edge case: C=0 or PAUSED -> ETA=None, Confidence=NA
    """
    res = compute_eta(n=5, t_base=20, active_counters=0, capacity_factor=1.0, status="NORMAL")
    assert res.eta_minutes is None
    assert res.confidence == "NA"

    res2 = compute_eta(n=5, t_base=20, active_counters=2, capacity_factor=1.0, status="PAUSED")
    assert res2.eta_minutes is None
    assert res2.confidence == "NA"


def test_first_in_line():
    """N=1 -> ceil(25 / 2) = 13"""
    res = compute_eta(n=1, t_base=25, active_counters=2, capacity_factor=1.0)
    assert res.eta_minutes == 13


def test_zero_in_line():
    """N=0 -> 0"""
    res = compute_eta(n=0, t_base=25, active_counters=2, capacity_factor=1.0)
    assert res.eta_minutes == 0


def test_freshness_degradation():
    """Stale data reduces confidence."""
    now = datetime.now(timezone.utc)
    # Fresh (5 min ago) + NORMAL = HIGH
    res = compute_eta(
        n=10, t_base=25, active_counters=2, capacity_factor=1.0,
        status="NORMAL", last_update_at=now - timedelta(minutes=5)
    )
    assert res.confidence == "HIGH"

    # Slightly stale (20 min ago) + NORMAL = MEDIUM
    res2 = compute_eta(
        n=10, t_base=25, active_counters=2, capacity_factor=1.0,
        status="NORMAL", last_update_at=now - timedelta(minutes=20)
    )
    assert res2.confidence == "MEDIUM"

    # Very stale (45 min ago) + NORMAL = LOW
    res3 = compute_eta(
        n=10, t_base=25, active_counters=2, capacity_factor=1.0,
        status="NORMAL", last_update_at=now - timedelta(minutes=45)
    )
    assert res3.confidence == "LOW"


def test_anomalous_capacity_factor():
    """F <= 0 is clamped to 0.05 to prevent ZeroDivisionError."""
    res = compute_eta(n=10, t_base=25, active_counters=2, capacity_factor=-0.5, status="REDUCED_CAPACITY")
    # F clamped to 0.05
    # raw = (10 * 25) / (2 * 0.05) = 250 / 0.1 = 2500
    assert res.eta_minutes == 2500
    assert res.confidence == "LOW"
