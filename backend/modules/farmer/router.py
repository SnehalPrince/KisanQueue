"""
modules/farmer/router.py — Farmer profile endpoints.

Routes:
    POST /v1/farmer/profile  — Create farmer profile (one-time, after OTP verify)
    GET  /v1/farmer/profile  — Get authenticated farmer's profile
"""
from __future__ import annotations

import uuid

import structlog
from fastapi import APIRouter
from sqlalchemy import select

from core.dependencies import DbSession, FarmerOnly
from core.exceptions import ProfileAlreadyExistsError, UserNotFoundError
from models.farmer import Farmer
from models.user import User
from modules.farmer.schemas import CreateProfileRequest, FarmerProfileResponse

router = APIRouter()
log = structlog.get_logger(__name__)


@router.post("/profile", response_model=FarmerProfileResponse, status_code=201)
async def create_profile(body: CreateProfileRequest, db: DbSession, payload: FarmerOnly) -> FarmerProfileResponse:
    """Complete farmer profile after first login."""
    user_id = payload["sub"]

    # Check for existing profile
    existing = await db.execute(select(Farmer).where(Farmer.user_id == user_id))
    if existing.scalar_one_or_none():
        raise ProfileAlreadyExistsError()

    # Update user name and language
    user_result = await db.execute(select(User).where(User.id == user_id))
    user = user_result.scalar_one_or_none()
    if user is None:
        raise UserNotFoundError()

    user.name = body.name.strip()
    user.preferred_language = body.language

    # Create farmer profile
    farmer = Farmer(
        id=str(uuid.uuid4()),
        user_id=user_id,
        aadhaar_last4=body.aadhaar_last4,
        village=body.village.strip(),
        district=body.district.strip(),
        state=body.state,
        primary_crop=body.primary_crop,
        is_whatsapp_linked=body.is_whatsapp_linked,
    )
    db.add(farmer)
    await db.flush()

    log.info("farmer.profile_created", user_id=user_id)
    return _to_response(user, farmer)


@router.get("/profile", response_model=FarmerProfileResponse)
async def get_profile(db: DbSession, payload: FarmerOnly) -> FarmerProfileResponse:
    """Return the authenticated farmer's profile."""
    user_id = payload["sub"]

    user_result = await db.execute(select(User).where(User.id == user_id))
    user = user_result.scalar_one_or_none()
    if user is None:
        raise UserNotFoundError()

    farmer_result = await db.execute(select(Farmer).where(Farmer.user_id == user_id))
    farmer = farmer_result.scalar_one_or_none()

    return _to_response(user, farmer)


def _to_response(user: User, farmer: Farmer | None) -> FarmerProfileResponse:
    return FarmerProfileResponse(
        id=user.id,
        name=user.name,
        phone=user.phone or "",
        language=user.preferred_language,
        village=farmer.village if farmer else None,
        district=farmer.district if farmer else None,
        state=farmer.state if farmer else None,
        primary_crop=farmer.primary_crop if farmer else None,
        aadhaar_last4=farmer.aadhaar_last4 if farmer else None,
        is_whatsapp_linked=farmer.is_whatsapp_linked if farmer else False,
        created_at=user.created_at.isoformat() if user.created_at else "",
    )
