"""
modules/auth/schemas.py — Pydantic schemas for auth endpoints.
"""
from __future__ import annotations

from pydantic import BaseModel, Field, field_validator


# ── Requests ──────────────────────────────────────────────────────────────────
class OTPRequest(BaseModel):
    phone: str = Field(..., description="10-digit Indian mobile number or E.164 (+91xxxxxxxxxx)")

    @field_validator("phone")
    @classmethod
    def normalize_phone(cls, v: str) -> str:
        digits = "".join(c for c in v if c.isdigit())
        if len(digits) == 10:
            return f"+91{digits}"
        if len(digits) == 12 and digits.startswith("91"):
            return f"+{digits}"
        if v.startswith("+91") and len(v) == 13:
            return v
        raise ValueError("Enter a valid 10-digit Indian mobile number")


class OTPVerifyRequest(BaseModel):
    phone: str
    otp: str = Field(..., min_length=4, max_length=6)

    @field_validator("phone")
    @classmethod
    def normalize_phone(cls, v: str) -> str:
        return OTPRequest(phone=v).phone


class LoginRequest(BaseModel):
    """Officer / admin username + password login."""
    username: str = Field(..., description="Officer employee_id (e.g. officer_rajgarh)")
    password: str = Field(..., min_length=1)


# ── Responses ─────────────────────────────────────────────────────────────────
class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds
    role: str
    user_id: str
    is_profile_complete: bool = True


class OTPSendResponse(BaseModel):
    success: bool
    message: str
