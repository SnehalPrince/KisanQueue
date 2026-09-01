"""
modules/qr/service.py — QR token issuing, validation, and revocation.

Implements docs/18_QR_TOKEN_SYSTEM.md exactly.
QR data format: KQ:<base64url(JSON payload)>.<HMAC-SHA256 hex>

Payload fields: qeid, cid, fid, tn, exp, iss
"""
from __future__ import annotations

import time
import uuid

import structlog
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.exceptions import (
    AlreadyCheckedInError,
    CentreMismatchError,
    InvalidQRTokenError,
    QRTokenExpiredError,
    TokenRevokedError,
)
from core.security import qr_payload_expiry_today, sign_qr_payload, verify_qr_payload
from models.qr_token import QRToken
from models.queue_entry import QueueEntry

log = structlog.get_logger(__name__)


class QRService:
    """Handles QR token lifecycle per docs/18_QR_TOKEN_SYSTEM.md."""

    @staticmethod
    async def issue(queue_entry: QueueEntry, db: AsyncSession) -> str:
        """
        Generate and sign a QR token for *queue_entry*.

        Stores the HMAC hash in qr_tokens. Returns the full QR data string.
        """
        exp = qr_payload_expiry_today()
        payload = {
            "qeid": queue_entry.id,
            "cid": queue_entry.centre_id,
            "fid": queue_entry.farmer_user_id,
            "tn": queue_entry.token_code,
            "exp": exp,
            "iss": "kisanqueue",
        }
        qr_data = sign_qr_payload(payload)

        # Extract and store the HMAC component
        _, body = qr_data.split(":", 1)  # strip "KQ:"
        _, hmac_hex = body.rsplit(".", 1)

        from datetime import datetime, timezone
        expires_at = datetime.fromtimestamp(exp, tz=timezone.utc)

        qr_token = QRToken(
            id=str(uuid.uuid4()),
            queue_entry_id=queue_entry.id,
            hmac_hash=hmac_hex,
            expires_at=expires_at,
        )
        db.add(qr_token)
        log.info("qr.issued", queue_entry_id=queue_entry.id, token_code=queue_entry.token_code)
        return qr_data

    @staticmethod
    async def validate(
        qr_data: str,
        officer_centre_id: str,
        db: AsyncSession,
    ) -> QueueEntry:
        """
        Validate a QR code scanned by an officer.

        Verification chain:
        1. Signature verification (HMAC-SHA256)
        2. Expiry check
        3. Centre match
        4. is_revoked check
        5. is_used check

        Returns the associated QueueEntry on success.
        Raises specific exceptions on failure — each maps to a distinct error_code.
        """
        payload = verify_qr_payload(qr_data)
        if payload is None:
            raise InvalidQRTokenError()

        # Expiry
        if payload.get("exp", 0) < int(time.time()):
            raise QRTokenExpiredError()

        # Centre match
        if payload.get("cid") != officer_centre_id:
            raise CentreMismatchError()

        queue_entry_id = payload.get("qeid")
        if not queue_entry_id:
            raise InvalidQRTokenError()

        # Fetch QR token record
        qr_result = await db.execute(
            select(QRToken).where(QRToken.queue_entry_id == queue_entry_id)
        )
        qr_token = qr_result.scalar_one_or_none()
        if qr_token is None:
            raise InvalidQRTokenError()

        if qr_token.is_revoked:
            raise TokenRevokedError()

        if qr_token.is_used:
            raise AlreadyCheckedInError()

        # Fetch queue entry
        qe_result = await db.execute(
            select(QueueEntry).where(QueueEntry.id == queue_entry_id)
        )
        queue_entry = qe_result.scalar_one_or_none()
        if queue_entry is None:
            raise InvalidQRTokenError()

        # Mark as used
        qr_token.is_used = True
        log.info("qr.validated", queue_entry_id=queue_entry_id, centre=officer_centre_id)
        return queue_entry

    @staticmethod
    async def revoke(queue_entry_id: str, db: AsyncSession) -> None:
        """Revoke the QR token for a queue entry."""
        result = await db.execute(
            select(QRToken).where(QRToken.queue_entry_id == queue_entry_id)
        )
        qr_token = result.scalar_one_or_none()
        if qr_token:
            qr_token.is_revoked = True
            log.info("qr.revoked", queue_entry_id=queue_entry_id)
