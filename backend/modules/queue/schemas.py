"""
modules/queue/schemas.py — Queue / pass Pydantic schemas.
"""
from __future__ import annotations

from pydantic import BaseModel, Field, field_validator


class GeneratePassRequest(BaseModel):
    centre_id: str
    crop: str
    quantity_quintals: float = Field(..., gt=0, le=1000, description="Quantity in quintals")
    farmer_id: str | None = None  # derived from JWT if not provided

    @field_validator("crop")
    @classmethod
    def normalize_crop(cls, v: str) -> str:
        return v.strip().lower()


class GeneratePassResponse(BaseModel):
    pass_id: str
    token: str                    # e.g. "KQ-1047"
    farmer_id: str
    farmer_name: str
    centre_id: str
    centre_name: str
    centre_hindi_name: str | None
    crop: str
    quantity_quintals: float
    queue_position: int
    eta_minutes: int | None
    eta_confidence: str
    status: str
    queue_entry_status: str
    issued_at: str
    valid_until: str | None
    qr_payload: str               # full "KQ:<b64>.<sig>" string for QR code rendering


class QueueStatusResponse(BaseModel):
    has_active_pass: bool
    pass_id: str | None = None
    token: str | None = None
    centre_id: str | None = None
    centre_name: str | None = None
    crop: str | None = None
    quantity_quintals: float | None = None
    queue_position: int | None = None
    eta_minutes: int | None = None
    eta_confidence: str | None = None
    status: str | None = None
    queue_entry_status: str | None = None
    issued_at: str | None = None
    valid_until: str | None = None
    qr_payload: str | None = None
