# 19 — Auth, RBAC & Security Hardening

> **Referenced Agent Skills**: [`security-and-hardening`](../.agents/skills/security-and-hardening/SKILL.md), [`signed-audit-trails-recipe`](../.agents/skills/signed-audit-trails-recipe/SKILL.md), [`threat-mitigation-mapping`](../.agents/skills/threat-mitigation-mapping/SKILL.md), [`better-auth-security-best-practices`](../.agents/skills/better-auth-security-best-practices/SKILL.md), [`jwt-security`](../.agents/skills/jwt-security/SKILL.md), [`secrets-management`](../.agents/skills/secrets-management/SKILL.md).

---

## 1. Threat Model & Defense-in-Depth (STRIDE Analysis)

| Threat Category | Potential Attack Vector | KisanQueue Security Control |
|---|---|---|
| **Spoofing** | Forging a fake gate pass QR to skip queue | HMAC-SHA256 digital signature signed with secret `QR_HMAC_SECRET`; verified in constant-time |
| **Tampering** | Modifying queue position in client state | Server-authoritative state; client receives read-only position over authenticated WebSocket |
| **Repudiation** | Officer denies changing capacity or checking in a farmer | Append-only `audit_logs` capturing actor ID, timestamp, IP, and cryptographic hash |
| **Information Disclosure** | Scraping farmer phone numbers or land data | PII minimization (last-4 Aadhaar only, masked phones `+91 98765 XXXXX`, strict response DTOs) |
| **Denial of Service** | Flooding OTP or pass generation endpoints | Rate-limiting with `slowapi` (5 req/phone/hr on OTP) + Redis token bucket in production |
| **Elevation of Privilege** | Farmer attempting to access officer check-in routes | Route-level FastAPI `Depends(require_role("OFFICER"))` guards |

---

## 2. Authentication Architecture

### 1. One-Time Farmer Onboarding & Session Auth
* **First Time**: Phone number verification via 6-digit OTP (static `1234` for SIH demo, SMS in production).
* **Token Issuance**: Issues signed JWT with `role: "FARMER"`, 30-day refresh scope for low-friction mobile re-entry.
* **Persistent Linkage**: WhatsApp webhook requests verify the caller's incoming phone number and link directly to their persistent farmer profile.

### 2. Officer & Admin Authentication
* Strict username + bcrypt (cost factor 12) password authentication.
* Role claims (`OFFICER` / `ADMIN`) embedded in JWT and verified on every sensitive route.

---

## 3. Cryptographic QR Token Signing (`QRService`)

Every digital pass (`KQ-1047`) generates a verifiable, tamper-proof QR code:

```python
# core/security.py
import hmac
import hashlib
import json

def sign_qr_payload(queue_entry_id: str, centre_id: str, date_str: str) -> str:
    raw_payload = f"{queue_entry_id}:{centre_id}:{date_str}"
    signature = hmac.new(
        settings.QR_HMAC_SECRET.encode(),
        raw_payload.encode(),
        hashlib.sha256
    ).hexdigest()[:16]  # 16-char hex for compact QR density
    
    return f"KQ:{queue_entry_id}:{signature}"

def verify_qr_payload(qr_string: str, centre_id: str, date_str: str) -> bool:
    parts = qr_string.split(":")
    if len(parts) != 3 or parts[0] != "KQ":
        return False
    
    expected = sign_qr_payload(parts[1], centre_id, date_str)
    return hmac.compare_digest(qr_string, expected)  # Constant-time comparison
```

* **Constant-Time Verification**: `hmac.compare_digest()` prevents timing attacks.
* **Single-Use Guard**: Checked in QR sets `is_used = TRUE` in database transaction; re-scanning throws `409 ALREADY_CHECKED_IN`.
* **Day-Scoped Expiry**: Passes automatically expire at 23:59:59 on the date of issuance.

---

## 4. Immutable & Signed Audit Trails (`signed-audit-trails-recipe`)

All capacity adjustments, check-ins, and override actions are recorded in the append-only `audit_logs` table:

```json
{
  "id": "audit-uuid-8821",
  "actor_id": "usr-officer-suresh",
  "actor_role": "OFFICER",
  "action": "CAPACITY_UPDATED",
  "resource_type": "centre",
  "resource_id": "centre-rajgarh-01",
  "detail": {
    "old_status": "NORMAL",
    "new_status": "LIFTING_DELAYED",
    "capacity_factor": 0.60,
    "active_counters": 1,
    "reason": "FCI truck delayed ~2 hours"
  },
  "ip_address": "103.21.144.12",
  "created_at": "2026-10-15T09:50:00Z"
}
```

---

## 5. Security Checklist for Development & Production

- [x] **Zero Plaintext Secrets**: All API keys, DB credentials, and HMAC secrets loaded via `pydantic-settings` from environment variables.
- [x] **SQL Injection Immunity**: 100% SQLAlchemy 2.0 ORM queries; zero raw SQL concatenation.
- [x] **XSS Sanitization**: React auto-escapes all dynamic content; Strict Content-Security-Policy (CSP) headers in place.
- [x] **PII Protection**: No full Aadhaar numbers stored (last-4 hint only); phone numbers masked in all non-auth API logs.
- [x] **CORS Locking**: Production CORS locked to explicit frontend origin (`https://kisanqueue.in`).
