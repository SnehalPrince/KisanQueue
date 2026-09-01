"""
modules/centres/schemas.py — Centre list response schemas.
"""
from __future__ import annotations

from pydantic import BaseModel


class CentreSummary(BaseModel):
    id: str
    name: str
    hindi_name: str | None
    district: str
    state: str
    status: str
    queue_length: int
    eta_minutes: int | None
    eta_confidence: str
    active_counters: int
    capacity_factor: float
    avg_processing_minutes: int
    supported_crops: list[str]
    note: str | None
    updated_minutes_ago: int | None

    model_config = {"from_attributes": True}


class CentreListResponse(BaseModel):
    centres: list[CentreSummary]
    count: int
