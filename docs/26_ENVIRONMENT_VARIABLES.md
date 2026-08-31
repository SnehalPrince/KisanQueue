# 26 — Environment Variables

## Rules
- **Never commit real secrets** to version control.
- Commit `.env.example` with placeholder values only.
- `.env` and `.env.local` are `.gitignore`d.
- Secrets in production are set via Render/Railway's secret manager (not pasted into YAML).
- Any env var without a value in production causes a startup failure — fail loudly, never silently use a default secret.

---

## Backend Environment Variables

### `.env.example` (Backend)

```env
# ─── Application ───────────────────────────────────────────────
APP_ENV=development                        # development | staging | production
DEBUG=true                                 # true in dev; MUST be false in production
APP_VERSION=1.0.0

# ─── Database ──────────────────────────────────────────────────
DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5432/kisanqueue
# For Supabase: postgresql+asyncpg://postgres.[project-ref]:[password]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres

# ─── Authentication ────────────────────────────────────────────
JWT_SECRET_KEY=REPLACE_WITH_32_PLUS_RANDOM_BYTES_HEX
# Generate: python -c "import secrets; print(secrets.token_hex(32))"
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=1440      # 24 hours for MVP

# ─── QR Token ──────────────────────────────────────────────────
QR_HMAC_SECRET=REPLACE_WITH_DIFFERENT_32_PLUS_RANDOM_BYTES_HEX
# Must be different from JWT_SECRET_KEY

# ─── OTP (Mock) ────────────────────────────────────────────────
OTP_MOCK_ENABLED=true                      # true = static OTP "1234"; false = real SMS
OTP_MOCK_CODE=1234                         # Only used when OTP_MOCK_ENABLED=true
OTP_EXPIRY_SECONDS=300

# ─── CORS ──────────────────────────────────────────────────────
CORS_ORIGINS=http://localhost:5173,https://kisanqueue.vercel.app
# Comma-separated list; no trailing slashes

# ─── Rate Limiting ─────────────────────────────────────────────
RATE_LIMIT_OTP_PER_PHONE_PER_HOUR=5
RATE_LIMIT_GLOBAL_PER_USER_PER_MINUTE=60

# ─── Notifications ─────────────────────────────────────────────
NOTIFICATION_ADAPTER=mock                  # mock | whatsapp | sms

# ─── WhatsApp (Production only — leave blank for MVP) ──────────
WHATSAPP_PROVIDER=                         # twilio | meta_cloud
WHATSAPP_ACCOUNT_SID=                      # Twilio: Account SID
WHATSAPP_AUTH_TOKEN=                       # Twilio: Auth Token
WHATSAPP_FROM_NUMBER=                      # e.g. whatsapp:+14155238886
WHATSAPP_META_ACCESS_TOKEN=                # Meta Cloud API: permanent access token
WHATSAPP_META_PHONE_NUMBER_ID=             # Meta Cloud API: phone number ID
WHATSAPP_WEBHOOK_VERIFY_TOKEN=             # Random string for webhook verification
WHATSAPP_APP_SECRET=                       # For X-Hub-Signature-256 webhook validation

# ─── SMS (Production only — leave blank for MVP) ───────────────
SMS_PROVIDER=                              # exotel | msg91 | twilio_sms
SMS_API_KEY=
SMS_SENDER_ID=

# ─── Government Integration ────────────────────────────────────
GOV_ADAPTER=mock                           # mock | euparjan | ekharid | anaaj_kharid
# State-specific adapter credentials (set only when adapter != mock):
EUPARJAN_API_BASE_URL=
EUPARJAN_API_KEY=
EKHARID_API_BASE_URL=
EKHARID_API_KEY=

# ─── Logging ───────────────────────────────────────────────────
LOG_LEVEL=INFO                             # DEBUG | INFO | WARNING | ERROR
LOG_FORMAT=json                            # json | text

# ─── Seed ──────────────────────────────────────────────────────
SEED_ADMIN_PASSWORD=REPLACE_WITH_STRONG_PASSWORD
# Used by seed.py to create the admin account
```

---

## Frontend Environment Variables

### `.env.example` (Frontend — Vite)

```env
# ─── API ───────────────────────────────────────────────────────
VITE_API_BASE_URL=http://localhost:8000/v1
# Production: https://kisanqueue-api.onrender.com/v1

VITE_WS_BASE_URL=ws://localhost:8000
# Production: wss://kisanqueue-api.onrender.com

# ─── Feature Flags ─────────────────────────────────────────────
VITE_WHATSAPP_SIMULATOR_ENABLED=true       # Show simulator tab in MVP
VITE_SHOW_MOCK_DATA_BADGE=true             # Show "Demo Data" label on mock records

# ─── App ───────────────────────────────────────────────────────
VITE_APP_NAME=KisanQueue
VITE_APP_VERSION=1.0.0
VITE_DEFAULT_LANGUAGE=hi                   # Default UI language: hi | en
```

---

## Variable Usage Map

| Variable | Used In | Critical? |
|---|---|---|
| `DATABASE_URL` | `core/database.py` | ✅ Yes — app won't start without valid DB |
| `JWT_SECRET_KEY` | `core/security.py` | ✅ Yes — all auth fails without it |
| `QR_HMAC_SECRET` | `modules/qr/service.py` | ✅ Yes — QR issuance/validation fails |
| `OTP_MOCK_ENABLED` | `modules/auth/service.py` | ✅ Yes — must be `true` for MVP demo |
| `CORS_ORIGINS` | `main.py` CORSMiddleware | ✅ Yes — frontend blocked without it |
| `NOTIFICATION_ADAPTER` | `core/config.py` DI | ✅ Yes — defaults to `mock` if missing |
| `WHATSAPP_*` | `notifications/adapters/whatsapp.py` | ❌ Not for MVP |
| `GOV_ADAPTER` | `modules/integration/` | ✅ Yes — defaults to `mock` if missing |
| `VITE_API_BASE_URL` | `lib/apiClient.ts` | ✅ Yes — all API calls fail |
| `VITE_WS_BASE_URL` | `lib/ws.ts` | ✅ Yes — WebSocket fails |

---

## Secret Generation Reference

```bash
# JWT_SECRET_KEY
python -c "import secrets; print(secrets.token_hex(32))"

# QR_HMAC_SECRET (generate separately — different value from JWT)
python -c "import secrets; print(secrets.token_hex(32))"

# WHATSAPP_WEBHOOK_VERIFY_TOKEN (any random string)
python -c "import secrets; print(secrets.token_urlsafe(24))"

# SEED_ADMIN_PASSWORD (choose a memorable but strong password for demo)
python -c "import secrets; print(secrets.token_urlsafe(16))"
```

---

## Production Checklist

```
□ JWT_SECRET_KEY set to real 32-byte random value (not the example placeholder)
□ QR_HMAC_SECRET set to different real 32-byte random value
□ DEBUG=false
□ OTP_MOCK_ENABLED=false (only if real SMS is wired; keep true if demo)
□ CORS_ORIGINS includes only the production Vercel domain
□ DATABASE_URL points to production Supabase project (not dev)
□ LOG_LEVEL=INFO (not DEBUG — avoids leaking request bodies to logs)
□ No .env file committed to git (verify with: git ls-files .env)
```
