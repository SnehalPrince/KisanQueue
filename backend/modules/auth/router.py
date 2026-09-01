"""
modules/auth/router.py — Auth endpoints.

Routes:
    POST /v1/auth/otp/request   — Send OTP to phone
    POST /v1/auth/otp/verify    — Verify OTP, issue JWT
    POST /v1/auth/login         — Officer username+password login
"""
from __future__ import annotations

import structlog
from fastapi import APIRouter, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.config import settings
from core.database import get_db_session
from core.dependencies import DbSession
from core.exceptions import InvalidCredentialsError, UserNotFoundError
from core.security import create_access_token, verify_password
from models.farmer import Farmer
from models.officer import Officer
from models.user import User
from modules.auth.schemas import (
    LoginRequest,
    OTPRequest,
    OTPSendResponse,
    OTPVerifyRequest,
    TokenResponse,
)
from modules.auth.service import otp_service

router = APIRouter()
log = structlog.get_logger(__name__)


# ── POST /otp/request ─────────────────────────────────────────────────────────
@router.post("/otp/request", response_model=OTPSendResponse)
async def request_otp(body: OTPRequest) -> OTPSendResponse:
    """
    Request an OTP for the given phone number.

    In mock mode (OTP_MOCK_ENABLED=true), the OTP is always the value of
    OTP_MOCK_CODE (default "1234") — never use this in production.
    """
    otp_service.request_otp(body.phone)
    if settings.OTP_MOCK_ENABLED:
        msg = f"Demo OTP sent (use: {settings.OTP_MOCK_CODE})"
    else:
        msg = "OTP sent successfully"
    return OTPSendResponse(success=True, message=msg)


# ── POST /otp/verify ──────────────────────────────────────────────────────────
@router.post("/otp/verify", response_model=TokenResponse)
async def verify_otp(body: OTPVerifyRequest, db: DbSession) -> TokenResponse:
    """
    Verify OTP and issue a JWT.

    Returns is_profile_complete=False if this is a new farmer who hasn't
    completed their profile yet.
    """
    otp_service.verify_otp(body.phone, body.otp)

    # Fetch or create user
    result = await db.execute(select(User).where(User.phone == body.phone))
    user = result.scalar_one_or_none()

    if user is None:
        # New user — create a bare user row; profile completion happens later
        import uuid
        user = User(
            id=str(uuid.uuid4()),
            phone=body.phone,
            name="",  # filled in during profile creation
            role="FARMER",
            preferred_language="hi",
            is_active=True,
        )
        db.add(user)
        await db.flush()  # get the ID without committing
        is_profile_complete = False
    else:
        # Check if farmer profile is complete (has a name set)
        farmer_result = await db.execute(
            select(Farmer).where(Farmer.user_id == user.id)
        )
        farmer = farmer_result.scalar_one_or_none()
        is_profile_complete = farmer is not None and bool(user.name)

    token = create_access_token(
        {"sub": user.id, "role": user.role, "phone": body.phone}
    )
    return TokenResponse(
        access_token=token,
        expires_in=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        role=user.role,
        user_id=user.id,
        is_profile_complete=is_profile_complete,
    )


# ── POST /login ───────────────────────────────────────────────────────────────
@router.post("/login", response_model=TokenResponse)
async def officer_login(body: LoginRequest, db: DbSession) -> TokenResponse:
    """
    Officer / admin username + password login.

    Accepts officer employee_id as 'username'. Verifies bcrypt hash —
    wrong password always returns 401 (fixes AUDIT.md §4.2).
    """
    # Fetch officer by employee_id (= username field in the request)
    officer_result = await db.execute(
        select(Officer).where(Officer.employee_id == body.username)
    )
    officer = officer_result.scalar_one_or_none()

    if officer is None:
        # Use same error as wrong password to prevent user enumeration
        raise InvalidCredentialsError()

    if not verify_password(body.password, officer.password_hash):
        log.warning("auth.officer_login_failed", employee_id=body.username)
        raise InvalidCredentialsError()

    # Fetch the linked user row to get role and ID
    user_result = await db.execute(select(User).where(User.id == officer.user_id))
    user = user_result.scalar_one_or_none()
    if user is None or not user.is_active:
        raise InvalidCredentialsError()

    token = create_access_token(
        {
            "sub": user.id,
            "role": user.role,
            "employee_id": officer.employee_id,
            "centre_id": officer.centre_id,
        }
    )
    log.info("auth.officer_login_success", employee_id=body.username, centre=officer.centre_id)
    return TokenResponse(
        access_token=token,
        expires_in=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        role=user.role,
        user_id=user.id,
        is_profile_complete=True,
    )
