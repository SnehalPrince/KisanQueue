"""
core/security.py — JWT signing, QR HMAC signing, and password hashing.

QR token format (18_QR_TOKEN_SYSTEM.md):
    KQ:<base64url(JSON payload)>.<HMAC-SHA256 hex>

JWT uses HS256 (python-jose). Passwords use bcrypt with cost factor 12
(passlib). All comparisons use constant-time functions to prevent
timing attacks.
"""
from __future__ import annotations

import base64
import hashlib
import hmac
import json
import time
from datetime import datetime, timedelta, timezone
from typing import Any

from jose import JWTError, jwt
from passlib.context import CryptContext

from core.config import settings

# ── Password hashing ──────────────────────────────────────────────────────────
_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=12)


def hash_password(plain: str) -> str:
    """Return bcrypt hash of *plain* (cost factor 12)."""
    return _pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    """Constant-time comparison of *plain* against *hashed* bcrypt hash."""
    return _pwd_context.verify(plain, hashed)


# ── JWT ───────────────────────────────────────────────────────────────────────
def create_access_token(
    data: dict[str, Any],
    expires_delta: timedelta | None = None,
) -> str:
    """
    Create a signed HS256 JWT.

    *data* must contain at least 'sub' (user UUID str).
    Expiry defaults to JWT_ACCESS_TOKEN_EXPIRE_MINUTES from settings.
    """
    payload = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta
        or timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    payload.update({"exp": expire, "iat": datetime.now(timezone.utc)})
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token: str) -> dict[str, Any]:
    """
    Decode and verify a JWT.  Raises JWTError on invalid / expired tokens.
    Callers should catch JWTError and raise HTTPException 401.
    """
    return jwt.decode(
        token,
        settings.JWT_SECRET_KEY,
        algorithms=[settings.JWT_ALGORITHM],
    )


# ── QR Token (HMAC-SHA256) ────────────────────────────────────────────────────
# Implements the spec in docs/18_QR_TOKEN_SYSTEM.md exactly.
# Format: KQ:<base64url(json payload, no padding)>.<sha256 hex digest>


def _b64url_encode(data: bytes) -> str:
    """URL-safe base64 encode without trailing '=' padding."""
    return base64.urlsafe_b64encode(data).decode().rstrip("=")


def _b64url_decode(s: str) -> bytes:
    """URL-safe base64 decode; re-adds padding as needed."""
    padding = 4 - len(s) % 4
    if padding != 4:
        s += "=" * padding
    return base64.urlsafe_b64decode(s)


def _hmac_sign(message: str) -> str:
    """Return HMAC-SHA256 hex digest of *message* using QR_HMAC_SECRET."""
    return hmac.new(
        settings.QR_HMAC_SECRET.encode(),
        message.encode(),
        hashlib.sha256,
    ).hexdigest()


def sign_qr_payload(payload_dict: dict[str, Any]) -> str:
    """
    Sign a QR payload dict and return the full QR data string.

    payload_dict must contain: qeid, cid, fid, tn, exp, iss.
    Returns: ``KQ:<base64url-json>.<hmac-sha256-hex>``
    """
    payload_bytes = json.dumps(payload_dict, separators=(",", ":"), sort_keys=True).encode()
    payload_b64 = _b64url_encode(payload_bytes)
    sig = _hmac_sign(payload_b64)
    return f"KQ:{payload_b64}.{sig}"


def verify_qr_payload(qr_data: str) -> dict[str, Any] | None:
    """
    Verify a QR data string.

    Returns the decoded payload dict if the signature is valid and the
    token has not expired. Returns None on any failure (invalid format,
    bad signature, expired).
    """
    if not qr_data.startswith("KQ:"):
        return None
    try:
        rest = qr_data[3:]  # strip "KQ:"
        payload_b64, received_sig = rest.rsplit(".", 1)
        expected_sig = _hmac_sign(payload_b64)
        if not hmac.compare_digest(expected_sig, received_sig):
            return None  # Timing-safe comparison — signature mismatch
        payload = json.loads(_b64url_decode(payload_b64))
        if payload.get("exp", 0) < int(time.time()):
            return None  # Expired
        return payload
    except Exception:
        return None


def qr_payload_expiry_today() -> int:
    """Return Unix timestamp for 23:59:59 in the current local day (IST)."""
    # Using UTC+5:30 offset.  In production, use a proper timezone library.
    now = datetime.now(timezone.utc)
    ist_offset = timedelta(hours=5, minutes=30)
    now_ist = now + ist_offset
    end_of_day_ist = now_ist.replace(hour=23, minute=59, second=59, microsecond=0)
    return int((end_of_day_ist - ist_offset).replace(tzinfo=timezone.utc).timestamp())
