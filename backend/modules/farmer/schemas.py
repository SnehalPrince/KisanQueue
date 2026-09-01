"""
modules/farmer/schemas.py — Farmer profile Pydantic schemas.
"""
from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


class CreateProfileRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    phone: str  # already verified via OTP — used for lookup, not re-verified here
    village: str = Field(..., min_length=1, max_length=100)
    district: str = Field(..., min_length=1, max_length=100)
    state: str | None = None
    language: Literal["hi", "en", "pa", "mr", "gu"] = "hi"
    aadhaar_last4: str | None = Field(None, pattern=r"^\d{4}$")
    primary_crop: str | None = None
    is_whatsapp_linked: bool = False


class FarmerProfileResponse(BaseModel):
    id: str
    name: str
    phone: str
    language: str
    village: str | None
    district: str | None
    state: str | None
    primary_crop: str | None
    aadhaar_last4: str | None
    is_whatsapp_linked: bool
    created_at: str

    model_config = {"from_attributes": True}
