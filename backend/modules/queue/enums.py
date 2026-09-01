"""
modules/queue/enums.py — Canonical crop identifier enum.

All crop identifiers in the system MUST use lowercase values from this enum.
This prevents the ₹0 payout bug caused by a casing mismatch between
frontend crop IDs (lowercase) and backend MSP rate dict keys.
"""
from enum import Enum


class CropId(str, Enum):
    """Canonical crop identifier. Values are lowercase strings stored in the DB."""
    wheat = "wheat"
    soybean = "soybean"
    paddy = "paddy"
    barley = "barley"
