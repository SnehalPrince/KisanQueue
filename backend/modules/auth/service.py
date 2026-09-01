"""
modules/auth/service.py — OTP state management and auth business logic.

OTP state is kept in-memory (per-process). For production with multiple
workers, replace with Redis (T-01 open question).
"""
from __future__ import annotations

import random
import string
import time
from dataclasses import dataclass, field

import structlog

from core.config import settings
from core.exceptions import (
    InvalidOTPError,
    OTPExpiredError,
    OTPRateLimitError,
)

log = structlog.get_logger(__name__)


@dataclass
class _OTPEntry:
    otp: str
    expires_at: float  # Unix timestamp
    attempt_count: int = 0
    request_count: int = 1
    first_request_at: float = field(default_factory=time.time)


_MAX_ATTEMPTS = 3
_RATE_WINDOW_SECONDS = 3600  # 1 hour


class OTPService:
    """In-memory OTP store. Replace with Redis for multi-process deployments."""

    def __init__(self) -> None:
        self._store: dict[str, _OTPEntry] = {}

    def _generate_otp(self) -> str:
        if settings.OTP_MOCK_ENABLED:
            return settings.OTP_MOCK_CODE
        return "".join(random.choices(string.digits, k=6))

    def request_otp(self, phone: str) -> str:
        """
        Generate and store an OTP for *phone*.

        Rate limit: max RATE_LIMIT_OTP_PER_PHONE_PER_HOUR requests per hour.
        Returns the OTP (for mock mode logging; never expose in real mode).
        """
        now = time.time()
        existing = self._store.get(phone)

        if existing:
            window_elapsed = now - existing.first_request_at
            if window_elapsed < _RATE_WINDOW_SECONDS:
                if existing.request_count >= settings.RATE_LIMIT_OTP_PER_PHONE_PER_HOUR:
                    log.warning("auth.otp_rate_limited", phone=phone)
                    raise OTPRateLimitError()
                existing.request_count += 1
                existing.otp = self._generate_otp()
                existing.expires_at = now + settings.OTP_EXPIRY_SECONDS
                existing.attempt_count = 0
            else:
                # Window expired — reset
                self._store[phone] = _OTPEntry(
                    otp=self._generate_otp(),
                    expires_at=now + settings.OTP_EXPIRY_SECONDS,
                )
        else:
            self._store[phone] = _OTPEntry(
                otp=self._generate_otp(),
                expires_at=now + settings.OTP_EXPIRY_SECONDS,
            )

        otp = self._store[phone].otp
        if settings.OTP_MOCK_ENABLED:
            log.info("auth.otp_generated_mock", phone=phone, otp=otp)
        else:
            log.info("auth.otp_generated", phone=phone)
        return otp

    def verify_otp(self, phone: str, otp: str) -> None:
        """
        Verify OTP for *phone*. Raises on failure.

        Consumes the OTP on success (deleted from store).
        Increments attempt counter — raises after _MAX_ATTEMPTS.
        """
        now = time.time()
        entry = self._store.get(phone)

        if entry is None:
            raise InvalidOTPError("No OTP was requested for this number")

        if now > entry.expires_at:
            del self._store[phone]
            raise OTPExpiredError()

        entry.attempt_count += 1
        if entry.attempt_count > _MAX_ATTEMPTS:
            del self._store[phone]
            raise InvalidOTPError("Too many failed attempts — please request a new OTP")

        if entry.otp != otp:
            raise InvalidOTPError()

        # Success — consume OTP
        del self._store[phone]
        log.info("auth.otp_verified", phone=phone)


# Singleton (one per process; tests can instantiate their own)
otp_service = OTPService()
