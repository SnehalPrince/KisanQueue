"""
core/exceptions.py — Domain exceptions for KisanQueue backend.

Each exception carries a machine-readable error_code and maps to a specific
HTTP status code. The global exception handler in main.py converts these to
the standard JSON error envelope:

    {
        "error_code": "QUEUE_ALREADY_ACTIVE",
        "message": "Human-readable message",
        "detail": null | str,
        "request_id": "uuid"
    }
"""
from __future__ import annotations


class KisanQueueError(Exception):
    """Base class for all domain errors."""

    error_code: str = "INTERNAL_ERROR"
    http_status: int = 500
    message: str = "An unexpected error occurred"

    def __init__(self, message: str | None = None, detail: str | None = None) -> None:
        self.message = message or self.__class__.message
        self.detail = detail
        super().__init__(self.message)


# ── Auth / OTP ────────────────────────────────────────────────────────────────
class InvalidOTPError(KisanQueueError):
    error_code = "INVALID_OTP"
    http_status = 401
    message = "Invalid or incorrect OTP"


class OTPExpiredError(KisanQueueError):
    error_code = "OTP_EXPIRED"
    http_status = 401
    message = "OTP has expired — please request a new one"


class OTPRateLimitError(KisanQueueError):
    error_code = "OTP_RATE_LIMIT"
    http_status = 429
    message = "Too many OTP requests — please wait before trying again"


class InvalidCredentialsError(KisanQueueError):
    error_code = "INVALID_CREDENTIALS"
    http_status = 401
    message = "Invalid username or password"


class TokenExpiredError(KisanQueueError):
    error_code = "TOKEN_EXPIRED"
    http_status = 401
    message = "Session has expired — please log in again"


class TokenInvalidError(KisanQueueError):
    error_code = "TOKEN_INVALID"
    http_status = 401
    message = "Invalid authentication token"


class InsufficientPermissionsError(KisanQueueError):
    error_code = "INSUFFICIENT_PERMISSIONS"
    http_status = 403
    message = "You do not have permission to perform this action"


# ── User / Farmer ─────────────────────────────────────────────────────────────
class UserNotFoundError(KisanQueueError):
    error_code = "USER_NOT_FOUND"
    http_status = 404
    message = "User not found"


class ProfileAlreadyExistsError(KisanQueueError):
    error_code = "PROFILE_ALREADY_EXISTS"
    http_status = 409
    message = "Farmer profile already exists for this account"


# ── Centre ────────────────────────────────────────────────────────────────────
class CentreNotFoundError(KisanQueueError):
    error_code = "CENTRE_NOT_FOUND"
    http_status = 404
    message = "Procurement centre not found"


class CentrePausedError(KisanQueueError):
    error_code = "CENTRE_PAUSED"
    http_status = 409
    message = "Centre has paused operations — cannot join queue right now"


class CapacityReachedError(KisanQueueError):
    error_code = "CAPACITY_REACHED"
    http_status = 409
    message = "Centre has reached its daily capacity"


# ── Queue ─────────────────────────────────────────────────────────────────────
class DuplicateQueueEntryError(KisanQueueError):
    error_code = "QUEUE_ALREADY_ACTIVE"
    http_status = 409
    message = "You already have an active queue entry at this centre"


class QueueEntryNotFoundError(KisanQueueError):
    error_code = "QUEUE_ENTRY_NOT_FOUND"
    http_status = 404
    message = "Queue entry not found"


class InvalidQueueStatusTransitionError(KisanQueueError):
    error_code = "INVALID_STATUS_TRANSITION"
    http_status = 422
    message = "Invalid queue entry status transition"


# ── QR Token ──────────────────────────────────────────────────────────────────
class InvalidQRTokenError(KisanQueueError):
    error_code = "INVALID_QR_TOKEN"
    http_status = 422
    message = "QR token is invalid or has been tampered with"


class QRTokenExpiredError(KisanQueueError):
    error_code = "QR_TOKEN_EXPIRED"
    http_status = 422
    message = "QR token has expired — please regenerate your pass"


class TokenRevokedError(KisanQueueError):
    error_code = "TOKEN_REVOKED"
    http_status = 422
    message = "This QR token has been revoked"


class AlreadyCheckedInError(KisanQueueError):
    error_code = "ALREADY_CHECKED_IN"
    http_status = 409
    message = "This token has already been used for check-in"


class CentreMismatchError(KisanQueueError):
    error_code = "CENTRE_MISMATCH"
    http_status = 422
    message = "This QR code is for a different procurement centre"


# ── Procurement ───────────────────────────────────────────────────────────────
class ProcurementNotFoundError(KisanQueueError):
    error_code = "PROCUREMENT_NOT_FOUND"
    http_status = 404
    message = "Procurement record not found"


class PaymentNotFoundError(KisanQueueError):
    error_code = "PAYMENT_NOT_FOUND"
    http_status = 404
    message = "Payment record not found"
