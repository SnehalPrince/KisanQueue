# 25 — Deployment

## Environments

| Environment | Purpose | URL pattern |
|---|---|---|
| **Local** | Development and testing | `localhost:5173` (frontend), `localhost:8000` (backend) |
| **Staging** | Pre-demo integration testing | `kisanqueue-staging.vercel.app` / `kisanqueue-api-staging.onrender.com` |
| **Production (Demo)** | SIH presentation | `kisanqueue.vercel.app` / `kisanqueue-api.onrender.com` |

---

## Architecture Overview

```
[Farmer / Officer Browser]
        │ HTTPS
        ▼
[Vercel — React/Vite Static Build]
        │ REST + WebSocket (wss://)
        ▼
[Render or Railway — FastAPI Python App]
        │ PostgreSQL connection string
        ▼
[Supabase Free Tier — PostgreSQL]
```

---

## Frontend Deployment (Vercel)

**Why Vercel**: Zero-config deployment for Vite/React; instant global CDN; HTTPS by default; preview deployments on every PR; free tier sufficient.

### Steps

```bash
# 1. Build locally to verify no errors
cd frontend
npm run build

# 2. Deploy (first time — link to Vercel project)
npx vercel --prod

# 3. Subsequent deployments (CI or manual)
git push origin main  # auto-deploys if Vercel GitHub integration is connected
```

### Vercel Configuration (`vercel.json`)

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "env": {
    "VITE_API_BASE_URL": "@vite_api_base_url",
    "VITE_WS_BASE_URL": "@vite_ws_base_url"
  }
}
```

The rewrite rule enables client-side React Router to handle all routes.

### Environment Variables (Vercel Dashboard)
- `VITE_API_BASE_URL` → `https://kisanqueue-api.onrender.com/v1`
- `VITE_WS_BASE_URL` → `wss://kisanqueue-api.onrender.com`

---

## Backend Deployment (Render)

**Why Render**: Supports long-lived WebSocket connections (unlike serverless platforms); deploys from GitHub push; free tier provides a persistent dyno; PostgreSQL add-on available (using Supabase instead for more control).

**Alternative**: Railway — similar capability, slightly different UX. Either works for the demo.

### Render Service Configuration

- **Service type**: Web Service
- **Runtime**: Python 3.11
- **Build command**: `pip install -r requirements.txt && alembic upgrade head`
- **Start command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- **Auto-deploy**: yes (on push to `main`)
- **Health check path**: `/health`

### `render.yaml` (Infrastructure as Code)

```yaml
services:
  - type: web
    name: kisanqueue-api
    runtime: python
    buildCommand: pip install -r requirements.txt && alembic upgrade head
    startCommand: uvicorn main:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: DATABASE_URL
        fromSecret: DATABASE_URL
      - key: JWT_SECRET_KEY
        fromSecret: JWT_SECRET_KEY
      - key: QR_HMAC_SECRET
        fromSecret: QR_HMAC_SECRET
      - key: OTP_MOCK_ENABLED
        value: "true"
      - key: DEBUG
        value: "false"
      - key: CORS_ORIGINS
        value: "https://kisanqueue.vercel.app"
    healthCheckPath: /health
```

### `requirements.txt` (key packages)

```
fastapi==0.111.0
uvicorn[standard]==0.30.0
sqlalchemy[asyncio]==2.0.30
asyncpg==0.29.0
alembic==1.13.1
pydantic==2.7.0
pydantic-settings==2.3.0
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
qrcode[pil]==7.4.2
slowapi==0.1.9
structlog==24.2.0
httpx==0.27.0    # for test client
pytest==8.2.0
pytest-asyncio==0.23.6
```

---

## Database (Supabase Free Tier)

**Why Supabase**: Managed PostgreSQL; free tier includes 500MB storage and 2 pooled connections — more than sufficient for the demo; connection string provided instantly; no ops overhead.

### Setup Steps

1. Create project at [supabase.com](https://supabase.com).
2. Copy the **direct connection string** (not pooled, for Alembic migrations): `postgresql+asyncpg://postgres:[password]@[host]:5432/postgres`.
3. Set as `DATABASE_URL` environment variable on Render.
4. Run migrations: `alembic upgrade head` (handled by Render build command).
5. Run seed: `python seed.py` (run once manually or add as a post-deploy step).

### Migration Files
```
backend/
└── alembic/
    ├── env.py
    ├── alembic.ini
    └── versions/
        ├── 001_create_users.py
        ├── 002_create_centres.py
        ├── 003_create_queue_tables.py
        ├── 004_create_qr_tokens.py
        ├── 005_create_procurement_tables.py
        └── 006_create_audit_logs.py
```

---

## Local Development

### Prerequisites
- Python 3.11+
- Node.js 20+
- Docker (optional, for local PostgreSQL)

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Configure local env
cp .env.example .env
# Edit .env — set DATABASE_URL to local Postgres or Supabase

# Run migrations + seed
alembic upgrade head
python seed.py

# Start dev server (with auto-reload)
uvicorn main:app --reload --port 8000
```

### Frontend Setup

```bash
cd frontend
npm install

# Configure local env
cp .env.example .env.local
# VITE_API_BASE_URL=http://localhost:8000/v1
# VITE_WS_BASE_URL=ws://localhost:8000

npm run dev  # starts Vite dev server on localhost:5173
```

### Local PostgreSQL (Docker — optional)

```bash
docker run -d \
  --name kisanqueue-db \
  -e POSTGRES_PASSWORD=devpassword \
  -e POSTGRES_DB=kisanqueue \
  -p 5432:5432 \
  postgres:16
```

Then set `DATABASE_URL=postgresql+asyncpg://postgres:devpassword@localhost:5432/kisanqueue`.

---

## Health Check Endpoint

```python
# main.py
@app.get("/health")
async def health():
    return {"status": "ok", "service": "kisanqueue-api", "version": "1.0.0"}
```

Render/Railway uses this for uptime monitoring and restart triggering.

---

## WebSocket Considerations

- Render Web Services support WebSocket connections on standard HTTPS/WSS ports.
- Render's free tier spins down after 15 minutes of inactivity — **a potential demo risk**.
- **Mitigation**: use an uptime service (e.g., UptimeRobot pinging `/health` every 5 minutes) to keep the dyno warm before and during the demo. Or upgrade to a paid Render tier for the demo day.
- Railway does not have the spin-down issue on their starter plan.

---

## CI/CD (Minimal for SIH)

```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: '3.11' }
      - run: cd backend && pip install -r requirements.txt
      - run: cd backend && pytest tests/test_eta.py tests/test_qr.py tests/test_queue_state.py -v
```

Runs the P0 tests on every push. Frontend Vitest is added as a second job (P1).

---

## Pre-Demo Checklist

```
□ Render backend is awake (ping /health — check 200 OK)
□ Supabase DB is accessible (query from Render)
□ Seed data is loaded (log in as Ramesh Kumar — token should be in queue)
□ Vercel frontend loads correctly (mobile + desktop)
□ WebSocket connects (open farmer queue screen — confirm "live" indicator)
□ Officer login works (officer_rajgarh / Demo@1234)
□ Hindi toggle works
□ WhatsApp simulator loads
□ Run through demo script once end-to-end — time it
□ Keep browser console open to catch 500s
□ Have a backup: record a video of the demo in case of network failure
```
