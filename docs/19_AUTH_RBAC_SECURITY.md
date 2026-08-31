# 19 — Auth, RBAC & Security

## Roles

| Role | Description | Who |
|---|---|---|
| `FARMER` | End user — can access own queue data, centre status, own QR | Registered farmers |
| `OFFICER` | Centre operator — can check in farmers, update capacity, view centre queue | Government procurement officers |
| `ADMIN` | System manager — centre/officer CRUD, system-wide view | KisanQueue admin / state government supervisor |

---

## Authentication

### Farmer: Phone + OTP
- Farmer enters their phone number (E.164 format).
- Backend generates a 6-digit OTP, valid for 5 minutes (MVP: static code `1234` controlled by `OTP_MOCK_ENABLED=true`).
- MVP mock rationale: WhatsApp Business API or SMS gateway requires production credentials; using a static dev OTP keeps the build on track while the auth flow is fully wired.
- On successful OTP submission, a JWT is issued (access token, 24-hour expiry for MVP).
- If the phone is not in `users`, a `FARMER` account is auto-created (frictionless onboarding for MVP). Production: require explicit registration form.

### Officer/Admin: Username + Password
- Username (`officer_mp_01`) + bcrypt-hashed password stored in `users`.
- On correct credentials, JWT issued with `role: "OFFICER"` or `"ADMIN"`.
- No OTP for officers in MVP (reduces setup complexity; officers are a small, trusted set).

### JWT Structure
```json
{
  "sub": "user-uuid",
  "role": "FARMER",
  "exp": 1760745600,
  "iat": 1760659200,
  "iss": "kisanqueue"
}
```
- Signed with HS256 using `JWT_SECRET_KEY` (minimum 32 bytes, from env vars).
- Verified on every protected route via `Depends(get_current_user)`.
- No refresh tokens in MVP — farmer re-OTPs after 24h. Production adds refresh token rotation.

---

## Authorization (RBAC)

### Route-Level Guards

```python
# core/dependencies.py

async def get_current_user(token: str = Depends(oauth2_scheme), db = Depends(get_db)) -> User:
    payload = decode_token(token)  # raises UnauthorizedError if invalid/expired
    user = await db.get(User, payload["sub"])
    if not user or not user.is_active:
        raise UnauthorizedError()
    return user

def require_role(*roles: str):
    async def guard(user: User = Depends(get_current_user)):
        if user.role not in roles:
            raise ForbiddenError()
        return user
    return guard
```

**Usage**:
```python
# Officer-only route
@router.post("/officer/capacity")
async def update_capacity(
    ...,
    officer: User = Depends(require_role("OFFICER", "ADMIN"))
):
```

### Resource Ownership Checks

Beyond role, ownership is checked at the service layer:

| Resource | Ownership Rule |
|---|---|
| `queue_entries` (farmer view) | `farmer_id = current_user.id` |
| `queue_entries` (officer view) | `centre_id = officer.centre_id` |
| `qr_tokens` (farmer re-fetch) | `queue_entry.farmer_id = current_user.id` |
| `capacity_updates` (write) | `officer.centre_id = requested centre_id` |

---

## Password Security

- `bcrypt` with cost factor 12 (`passlib[bcrypt]`).
- Passwords never logged, never returned in any API response.
- Officers created by Admin — initial password communicated securely out-of-band; officer must change on first login (P1).

---

## JWT Security

- Secret key minimum 32 random bytes, stored in env var `JWT_SECRET_KEY`. See `26_ENVIRONMENT_VARIABLES.md`.
- Algorithm: HS256 (sufficient for a single-backend monolith; RS256 preferred in multi-service production).
- Token expiry checked on every decode — expired tokens return `401 UNAUTHORIZED`.
- WebSocket auth: JWT passed as `?token=` query param (only option for browser WebSocket); validated synchronously on connect before accepting the connection.

---

## PII Protection

| Data | Handling |
|---|---|
| Phone number | Stored; never logged in plaintext beyond auth flows; masked in API responses as `+91 98765 XXXXX` |
| Aadhaar | Only last-4 digits stored; never full number |
| Financial data | Procurement amounts stored (needed for status display); no bank account numbers stored |
| Officer employee ID | Stored for identification; not exposed in farmer-facing APIs |

**Data minimization**: collect only what is required to operate the queue. No tracking pixels, analytics SDKs, or third-party data sharing in MVP.

---

## Input Validation

- All request bodies validated via Pydantic v2 models. Malformed requests rejected with `422 Unprocessable Entity` before reaching service layer.
- Phone numbers validated against E.164 regex.
- Capacity factor validated: `0.05 ≤ capacity_factor ≤ 1.00` (schema `CHECK` constraint + Pydantic validator).
- Active counters validated: `>= 0`.
- Crop and name fields have max-length constraints.
- No raw SQL queries — SQLAlchemy ORM only.

---

## Rate Limiting

| Endpoint | Limit | Library |
|---|---|---|
| `POST /auth/otp/request` | 5 req/phone/hour | `slowapi` |
| `POST /auth/otp/verify` | 10 req/phone/hour | `slowapi` |
| `POST /queue/join` | 3 req/user/hour | `slowapi` |
| All other endpoints | 60 req/user/minute | `slowapi` global |

---

## HTTPS / Transport Security

- **Production**: all traffic over HTTPS. Vercel (frontend) enforces HTTPS. Render/Railway (backend) provides HTTPS termination.
- **WebSockets**: WSS (WebSocket Secure) in production.
- **CORS**: only the deployed frontend origin is allowed in production. Dev: `localhost:5173` added explicitly (not wildcard `*`).

---

## QR Token Security

See `18_QR_TOKEN_SYSTEM.md` for full details. Summary:
- HMAC-SHA256 signed payload — forgery requires the `QR_HMAC_SECRET` key.
- Single-use (`is_used` flag) — prevents sharing/reuse.
- Expiry at end of day — prevents next-day reuse.
- Centre mismatch detection — QR from Centre A cannot be used at Centre B.
- `hmac.compare_digest` for constant-time comparison — prevents timing attacks.

---

## Audit Logging

All security-significant events are written to `audit_logs`:

| Event | Logged Data |
|---|---|
| `AUTH_OTP_REQUESTED` | phone (partial), ip_address |
| `AUTH_SUCCESS` | user_id, role, ip_address |
| `AUTH_FAILURE` | phone (partial), reason, ip_address |
| `QR_TOKEN_ISSUED` | queue_entry_id, farmer_id |
| `QR_TOKEN_VALIDATED` | queue_entry_id, officer_id, centre_id |
| `QR_TOKEN_REJECTED` | reason (INVALID_SIG / EXPIRED / REVOKED / CENTRE_MISMATCH), ip_address |
| `CAPACITY_UPDATED` | centre_id, officer_id, old_status, new_status, capacity_factor |
| `QUEUE_ENTRY_CANCELLED` | queue_entry_id, farmer_id |
| `ADMIN_CENTRE_MODIFIED` | centre_id, admin_id, changes |

Audit logs are append-only (no UPDATE/DELETE on `audit_logs` table). In production, these may be exported to an immutable log store (S3, Cloud Storage). MVP: stored in PostgreSQL.

---

## Common Web Vulnerability Mitigations

| Vulnerability | Mitigation |
|---|---|
| SQL Injection | SQLAlchemy ORM — no raw SQL |
| XSS | React escapes all rendered content by default; Content-Security-Policy header in production |
| CSRF | JWT-based auth (no cookies) — CSRF is not applicable to Authorization header auth |
| Broken Object Level Authorization | Service-layer ownership checks on every resource access |
| Excessive Data Exposure | Response schemas defined per endpoint (Pydantic) — never return raw ORM objects |
| Security Misconfiguration | All secrets in env vars; no default passwords; OTP mock disabled in production via env flag |
| Broken Authentication | bcrypt for passwords; HMAC-SHA256 for QR; JWT with short expiry |

---

## Secrets Management

| Secret | Storage |
|---|---|
| `JWT_SECRET_KEY` | Env var (Render/Railway secret manager) |
| `QR_HMAC_SECRET` | Env var |
| `DATABASE_URL` | Env var |
| `WHATSAPP_API_KEY` | Env var (production only) |
| `SMS_API_KEY` | Env var (production only) |

**Never**: hardcode secrets in source code, commit `.env` files, or log secrets. `.env.example` with placeholders is committed; `.env` is `.gitignored`. Full list: `26_ENVIRONMENT_VARIABLES.md`.

---

## Production Security Additions (Post-MVP)

- RS256 JWT signing (asymmetric — public key shareable with API partners).
- Refresh token rotation with revocation list.
- Short-lived QR tokens (4h TTL, nonce).
- OTP via real SMS gateway (not static mock).
- Web Application Firewall (WAF) in front of API.
- Penetration testing before any real government data is handled.
- Data processing agreement with farmers (privacy policy, consent).
