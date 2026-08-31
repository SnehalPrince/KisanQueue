# 18 — QR Token System

## Purpose
The QR token serves as the **physical proof-of-queue** that a farmer presents at the procurement centre to be checked in by an officer. It must:
- Be unique per queue entry.
- Be verifiable by the officer without a round-trip to the server (MVP: server validates).
- Expire at end of day to prevent next-day reuse.
- Be resistant to simple forgery (just changing a number in the URL/string).
- Be revokable if the farmer cancels.

**Honest disclaimer**: The MVP implementation achieves a reasonable security level for a hackathon prototype. The production implementation adds short-lived tokens, replay prevention, and offline validation. Neither implementation claims bank-grade security — it is appropriate for a government queue management system where the primary threat model is casual abuse, not sophisticated attacks.

---

## Threat Model (MVP)

| Threat | MVP Mitigation | Production Mitigation |
|---|---|---|
| Farmer shares QR with another person | `is_used` flag — QR is single-use; officer sees mismatch on name display | Same + biometric/OTP re-confirm at counter |
| Farmer generates a fake token (guessing UUID) | HMAC signature — invalid UUIDs fail signature check | Same |
| Farmer reuses QR next day | `expires_at` is end of same calendar day | Short-lived token (4h TTL) + rolling refresh |
| Farmer cancels but presents old QR | `is_revoked` flag checked on validate | Same |
| Replay attack (man-in-the-middle captures QR) | Single-use `is_used` flag | Nonce + short TTL make window < 5 minutes |

---

## Token Structure

### QR Payload (what is encoded in the QR code image)

```
KQ:<base64url(JSON payload)>.<HMAC-SHA256 signature>
```

**JSON payload** (before base64url encoding):
```json
{
  "qeid": "queue_entry_id (UUID)",
  "cid": "centre_id (UUID)",
  "fid": "farmer_id (UUID)",
  "tn": 47,
  "exp": 1760659199,
  "iss": "kisanqueue"
}
```

Fields:
- `qeid` — queue entry ID
- `cid` — centre ID (for centre-mismatch detection)
- `fid` — farmer user ID
- `tn` — token number (for human display backup)
- `exp` — Unix timestamp expiry (end of day, 23:59:59 local time)
- `iss` — issuer constant (basic forgery filter)

### HMAC Signing (MVP)

```python
# modules/qr/service.py

import hmac, hashlib, base64, json

QR_SECRET_KEY = settings.QR_HMAC_SECRET  # 32+ byte random secret from env vars

def _sign(payload_dict: dict) -> str:
    payload_bytes = json.dumps(payload_dict, separators=(',', ':')).encode()
    payload_b64 = base64.urlsafe_b64encode(payload_bytes).decode().rstrip('=')
    sig = hmac.new(QR_SECRET_KEY.encode(), payload_b64.encode(), hashlib.sha256).hexdigest()
    return f"KQ:{payload_b64}.{sig}"

def _verify(qr_data: str) -> dict | None:
    """Returns payload dict if valid, None if invalid."""
    if not qr_data.startswith("KQ:"):
        return None
    try:
        _, rest = qr_data.split("KQ:", 1)
        payload_b64, received_sig = rest.rsplit(".", 1)
        expected_sig = hmac.new(QR_SECRET_KEY.encode(), payload_b64.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(expected_sig, received_sig):
            return None  # Signature mismatch
        payload = json.loads(base64.urlsafe_b64decode(payload_b64 + "=="))
        if payload["exp"] < utcnow_unix():
            return None  # Expired
        return payload
    except Exception:
        return None
```

**Security note**: `hmac.compare_digest` is used (not `==`) to prevent timing attacks on the signature comparison.

---

## QRService API

```python
class QRService:
    async def issue(self, queue_entry_id: UUID, db: AsyncSession) -> QRTokenResponse:
        """
        Called immediately after queue_entries row is created.
        1. Build payload dict from queue_entry data.
        2. Sign payload → qr_data string.
        3. Store HMAC hex in qr_tokens.token_payload_hash.
        4. Return QRTokenResponse with qr_data (for frontend to render as QR image).
        """

    async def validate(self, qr_data: str, scanning_officer_centre_id: UUID, db: AsyncSession) -> QueueEntry:
        """
        Called by OfficerService.check_in().
        1. _verify(qr_data) → payload or None.
        2. If None: raise InvalidTokenError.
        3. Look up qr_tokens row by queue_entry_id.
        4. If is_used: raise AlreadyCheckedInError.
        5. If is_revoked: raise TokenRevokedError.
        6. If payload['cid'] != scanning_officer_centre_id: raise CentreMismatchError.
        7. Mark qr_tokens.is_used = True.
        8. Write audit_log: QR_TOKEN_VALIDATED.
        9. Return queue_entry.
        """

    async def revoke(self, queue_entry_id: UUID, db: AsyncSession) -> None:
        """Called when farmer cancels. Sets qr_tokens.is_revoked = True."""
```

---

## QR Code Image Generation

The `qr_data` string is rendered as a QR code image on the frontend using a JavaScript QR library (e.g. `qrcode.react`).

**Why client-side**: avoids sending image bytes over the API (just send the string data); QR rendering is cheap and instant in the browser.

**Display on farmer screen**:
- Large QR image (min 200×200px, recommended 250×250px).
- Token number displayed in large text below QR.
- Expiry time shown: "Valid until: 11:59 PM today".
- "Save screenshot" hint (for offline use before arriving at centre).

---

## Token Number (Human Fallback)

`token_number` is a sequential integer per centre per day (e.g. 47). This exists as a **manual fallback** for officer check-in when:
- QR cannot be scanned (screen glare, damaged phone, no scanner).
- Officer uses the manual entry form in the dashboard.

Manual entry is authenticated by matching `token_number + centre_id + date` → officer selects the matching row from the queue table. Less secure (no cryptographic proof), but acceptable as a fallback. Logged separately in `audit_logs`.

---

## Database: `qr_tokens` Table

See `13_DATABASE_SCHEMA.md` for full column spec.

Key constraint: `UNIQUE(queue_entry_id)` — exactly one token per queue entry. Reissuing (if farmer loses QR) updates the existing row's `token_payload_hash` and resets `is_used = FALSE`, `is_revoked = FALSE`.

---

## Production Improvements (Post-MVP)

| Improvement | Reason |
|---|---|
| Short-lived tokens (4-hour TTL) with a refresh endpoint | Reduces replay window; farmer refreshes QR on demand |
| Nonce stored in database | Prevents any replay even within TTL window |
| Offline officer validation (local HMAC check without server round-trip) | Handles connectivity-poor centres |
| QR rotation (new QR every hour, old ones accepted for 30 min grace) | Reduces window for shared/screenshot abuse |
| Biometric or OTP re-confirm at counter | Highest-security option; requires hardware scanner |

---

## MVP vs Production Summary

| Aspect | MVP | Production |
|---|---|---|
| Signing | HMAC-SHA256 | HMAC-SHA256 (same, stronger key management) |
| Expiry | End of day (23:59:59) | 4-hour TTL + refresh endpoint |
| Replay prevention | Single-use `is_used` flag | Nonce + short TTL |
| Offline validation | No (requires server round-trip) | Yes (HMAC checked locally on officer device) |
| Revocation | `is_revoked` flag in DB | Same + push invalidation cache |
| Fraud transparency | Officer sees farmer name after scan — name mismatch is visible | Same |
