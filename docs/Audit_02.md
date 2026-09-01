# KisanQueue — Repository Audit 02

**Audited commit:** `79c1306` ("feat: initialize backend project structure with core modules, database models, and CI workflow")
**Previous audit:** `AUDIT.md` @ `c77b1f1` (frontend-only stage)
**Method:** This pass goes further than a code read — the backend was actually installed, migrated against a real local PostgreSQL 16 instance, seeded, booted, and exercised live over HTTP with curl (OTP flow, officer login, centre listing, pass generation, queue status). Frontend was rebuilt, relinted, and retested. Findings below are reproducible; commands are included so they can be re-run.

---

## 1. Executive Summary

Real, substantial progress since `AUDIT.md`. The single biggest gap flagged last time — "no backend exists at all" — is closed: there is now a working FastAPI app with 19 real routes, JWT auth, a database schema matching the docs, Alembic migrations, and a QR/ETA/WebSocket module structure. Several specific items from the previous audit and the follow-up decisions (T-03, P-01, notifications table) were implemented correctly and verifiably.

However, **the backend has evidently never been run against a real PostgreSQL database before this commit was pushed.** Every bug found in this pass is the kind that only surfaces when you actually connect to Postgres and run the seed script — not when reading the code, not when running unit tests (which don't touch the database), and not when testing against SQLite. As committed today:
- `seed.py` fails immediately and silently rolls back to an **empty database** against real Postgres.
- Fresh `pip install -r requirements.txt` produces a **broken password-hashing library combination**, breaking all officer login.
- Copying `.env.example` → `.env` (the documented first step) **silently sets a placeholder string as the real officer password**, with no warning.
- One API payload field name has **drifted from the documented spec**, and the error handler leaks a raw internal traceback instead of returning a clean validation error.

None of these are hard to fix — all four are pinpointed below with exact locations — but together they mean nobody has yet successfully logged in as an officer or seeded demo data against a real database on this branch. That needs to happen before this is demo-ready, and it's a fast fix, not a redesign.

---

## 2. What's Now Done (New Since AUDIT.md)

### Backend (`backend/`, new)
- FastAPI app (`main.py`) with structured startup/shutdown, health checks (`/health`, `/health/db`), CORS, and structured logging (`structlog`) — boots cleanly, verified live.
- SQLAlchemy async models for all 13 tables matching `13_DATABASE_SCHEMA.md` (users, farmers, officers, centres, capacity_updates, queue_entries, procurement_records, payment_status, qr_tokens, audit_log, notifications, processing_events, plus the alembic version table).
- Alembic migration (`0001_initial_schema.py`) — **verified**: runs clean against a real Postgres 16 instance with no errors.
- Real JWT auth (`core/security.py`) — HS256 via `python-jose`, config-driven expiry. **Verified live**: farmer OTP → JWT → authenticated request all work correctly.
- Officer password auth now actually checks the password (`modules/auth/router.py::officer_login`), explicitly noted in-code as fixing the previous audit's §4.2 finding. **Verified live**: wrong password correctly returns 401; correct password returns a valid token.
- OTP service (`modules/auth/service.py`) is a clean, well-scoped in-memory implementation: rate-limited (5/hour), expiring, max-3-attempts, single-use, with `OTP_MOCK_ENABLED` config flag distinguishing mock mode from real-SMS mode — matches what was asked for.
- `core/config.py` fails loudly on missing/invalid config (no silent defaults for secrets), and has explicit production guardrails (`DEBUG` must be `False` and `OTP_MOCK_ENABLED` must be `False` when `APP_ENV=production`, `JWT_SECRET_KEY` and `QR_HMAC_SECRET` must differ). This is good defensive design.
- **T-03 (Supabase pooling) implemented as instructed**: `DATABASE_URL` (session-mode pooler) and `ALEMBIC_DATABASE_URL` (direct) are separate settings, with `.env.example` correctly annotated with real Supabase URL examples for both. Not yet tested against an actual Supabase project (see §4.1).
- **P-01 (guest centre view) implemented as instructed**: `/v1/centres` requires auth — verified live, returns `401 TOKEN_MISSING` with no token.
- **Notifications table implemented as instructed**: table exists (verified via `\dt` on the migrated DB), and `models/notification.py` carries the exact "provisioned early, POST-MVP" comment that was requested.
- QR signing module (`modules/qr/service.py`) present, matching the HMAC-SHA256 approach from `18_QR_TOKEN_SYSTEM.md` (not live-tested end-to-end in this pass — see §4.2).
- WebSocket gateway scaffolding (`realtime/gateway.py`, `realtime/manager.py`, `realtime/events.py`) exists with the right shape for the live-queue design in `15_REALTIME_QUEUE.md` (not live-tested in this pass — see §4.2).
- `seed.py` — comprehensive, covers all fixture data matching the frontend's mock fixtures (3 centres, 10 farmers, 3 officers, queue entries, procurement + payment records) — but see §3.1, it does not currently run successfully.
- Backend CI job now installs real dependencies and runs `pytest tests/` (previously a silent no-op per the last audit) — but see §3.4, it still isn't fully wired to pass reliably.

### Frontend — improvements since last audit
- The 5 lint warnings from `AUDIT.md` §5 are **fully resolved** — `oxlint` now reports 0 warnings, 0 errors. Traced to the `SmoothScrollProvider`/`SmoothScrollContext` refactor and the `SellCropModal` effect fix.
- Test count grew from 66 → **72, all passing** — 6 new tests cover `WhatsAppSimulatorModal` and the new route guards.
- `RequireFarmerAuth` / `RequireOfficerAuth` (`src/components/auth/RouteGuards.tsx`) now exist and correctly redirect unauthenticated visitors — closes the "no route guards" gap from `AUDIT.md` §4.3.
- `WhatsAppSimulatorModal.tsx` (333 lines) replaces the disabled "coming soon" button from last audit with an actual scripted mock conversation — closes the gap flagged in `AUDIT.md` §7.
- TypeScript build, production build (`vite build`), and full test suite all still pass clean at this commit.

---

## 3. Bugs Found by Actually Running the Backend

These were found by installing Postgres locally, running the real migration, seeding, booting the app, and hitting it with curl — not by reading the code. Reproduction steps are included so they can be re-verified after a fix.

### 3.1 `seed.py` fails completely against real PostgreSQL (data loss, not partial)

**Symptom:** Running `python seed.py` against a real Postgres database throws and the entire script exits with a traceback. Because the whole script runs inside a single session with one `db.commit()` at the very end, the failure **rolls back everything inserted before it**, including centres, farmers, and officers that had already succeeded — you're left with a completely empty database, not a partially-seeded one.

**Two distinct causes, both present:**

a) **Boolean literals passed as raw integers in raw SQL `INSERT` statements.** PostgreSQL (via `asyncpg`) does not implicitly cast integer literals to `boolean` the way SQLite does. Five occurrences:
   - `seed.py:204` — `VALUES (:id, :phone, :name, 'FARMER', :lang, 1)` (should be `TRUE`)
   - `seed.py:231` — `VALUES (:id, NULL, :name, 'OFFICER', 'hi', 1)` (should be `TRUE`)
   - `seed.py:312` — `..., 0, 1, 'MOCK')` for `is_verified, is_mock` (should be `FALSE, TRUE`)
   - `seed.py:328` — `..., :utr, 1)` for `is_mock` (should be `TRUE`)

   Error reproduced: `asyncpg.exceptions.DatatypeMismatchError: column "is_active" is of type boolean but expression is of type integer`

b) **ISO-format datetime strings passed to `DateTime` columns in raw SQL.** `asyncpg` requires actual `datetime` objects for parameterized queries against `DateTime` columns — a string, even a valid ISO 8601 one, is rejected. Occurrences at `seed.py:256, 265, 274, 297, 298` — all calls of the form `today_at(h, m).isoformat()` passed as a query parameter.

   Error reproduced: `asyncpg.exceptions.DataError: invalid input for query argument $2: '2026-09-01T07:00:00+00:00' (expected a datetime.date or datetime.datetime instance, got 'str')`

**Fix verified in this audit**: removing the 5 `.isoformat()` calls and replacing the 4 integer boolean literals with `TRUE`/`FALSE` makes the seed script complete successfully end-to-end against real Postgres (all 3 centres, 10 farmers, 3 officers, queue entries, and procurement/payment records inserted correctly). This is a small, mechanical fix.

**Why this matters beyond the immediate bug**: this class of error is exactly why T-03 said to test against a real Supabase/Postgres project before the hackathon — SQLite (and any manual code read) would not have caught either of these, since SQLite silently accepts both integer booleans and ISO date strings.

### 3.2 `passlib==1.7.4` is incompatible with current `bcrypt`, breaking all password hashing

**Symptom:** A fresh `pip install -r requirements-dev.txt` (as anyone cloning the repo today would run) pulls `bcrypt==5.0.0` as the latest release, since `bcrypt` is unpinned in `requirements.txt` (`passlib[bcrypt]==1.7.4` only pins passlib, not bcrypt). This combination is broken: `passlib` 1.7.4 (unmaintained since ~2020) reads `bcrypt.__about__.__version__` to detect the backend version, and this attribute was removed in `bcrypt` 4.0+.

**Error reproduced:**
```
AttributeError: module 'bcrypt' has no attribute '__about__'
...
ValueError: password cannot be longer than 72 bytes, truncate manually if necessary
```
(the second error is a red herring further down the same broken code path — the real cause is the missing `__about__` attribute)

**Impact:** `core/security.py::hash_password()` and `verify_password()` — used by officer seeding and officer login — fail on any environment that installs the current `bcrypt` release, which is what `pip install` does by default today.

**Fix verified in this audit**: pinning `bcrypt==4.0.1` (or any `<4.1`) in `requirements.txt` resolves it immediately — confirmed both via a standalone `hash_password`/`verify_password` round-trip and via the full seed + live officer-login flow afterward.

### 3.3 `.env.example` placeholder text silently becomes the real seeded password

**Symptom:** `backend/.env.example` line 66 reads:
```
SEED_ADMIN_PASSWORD=REPLACE_WITH_STRONG_PASSWORD
```
`seed.py` reads this via `os.environ.get("SEED_ADMIN_PASSWORD", "Demo@1234")`. Because the variable is *present* (with the literal placeholder text as its value) rather than *absent*, `os.environ.get`'s fallback is never used — the seed script hashes and stores `"REPLACE_WITH_STRONG_PASSWORD"` as the real officer password instead of the documented `Demo@1234`.

**Reproduced:** after copying `.env.example` → `.env` (the documented setup step) without editing this line, logging in as `officer_rajgarh` with the documented demo password `Demo@1234` fails with `401 INVALID_CREDENTIALS`. Logging in with `REPLACE_WITH_STRONG_PASSWORD` (the placeholder text itself) succeeds and returns a valid token.

**Why this is worth fixing even though it's "just" a config mistake**: it's silent — no warning, no error, nothing in the seed output hints that the demo password differs from what the docs say. This is the exact kind of thing that costs 10 minutes of confused debugging right before a demo. Two reasonable fixes: (a) leave `SEED_ADMIN_PASSWORD` commented out in `.env.example` so the fallback actually applies, or (b) have `seed.py` print the effective officer password it used at the end of the run.

### 3.4 API payload field name has drifted from the documented spec, and validation errors leak as 500s

**Symptom:** `docs/14_API_SPECIFICATION.md` (lines 195, 219, 251, 286, 336) specifies `quantity_quintals` as the field name for crop quantity in pass-generation and related payloads. The actual implemented schema (`modules/farmer/schemas.py::GeneratePassRequest`, presumably feeding `/v1/passes/generate`) requires `quantity_q` instead — confirmed by sending a request with `quantity_quintals` (per the docs) and getting a Pydantic "field required" error for `quantity_q`.

**Compounding issue:** that validation failure surfaces as a raw `HTTP 500 INTERNAL_ERROR` with the full Pydantic error trace exposed in the response `detail` field, rather than a clean `422` validation error. This means the global exception handler (`core/exceptions.py`) isn't distinguishing "client sent a bad payload" from "something actually broke server-side" — worth checking whether `RequestValidationError` is being caught before it falls through to the generic handler.

**Also worth checking:** the frontend's existing type naming (`quantityQ` in `frontend/src/types/queue.ts`) suggests whoever eventually wires the frontend to this endpoint will need to know which of `quantity_quintals` (docs) or `quantity_q` (code) is actually correct — pick one and update the other, don't leave both in the repo disagreeing.

---

## 4. Not Yet Verified (Scope of This Audit Pass)

To be transparent about what this pass did *not* confirm:

### 4.1 Real Supabase connection — still untested
T-03's resolution (session-mode pooler for the app, direct URL for Alembic) is implemented in config and `.env.example`, and the *shape* of it is correct, but this audit only tested against a local Postgres instance, not an actual Supabase project. The original decision explicitly said to "test against your Supabase project before the hackathon" — that step is still outstanding.

### 4.2 QR signing/verification and WebSocket live-queue flow — not live-tested
`modules/qr/service.py` and the `realtime/` module exist and read as reasonable implementations of their respective docs, but this audit did not generate a real QR token, verify it through officer check-in, or open a WebSocket connection to confirm live ETA push updates actually work end-to-end. Given §3.1–3.4 turned up real bugs in modules that looked correct on read, treat QR/WebSocket as **unverified, not confirmed-working**, until someone runs them live.

### 4.3 Backend CI job — will it actually pass now?
The CI job now installs real dependencies and runs `pytest tests/`, but:
- There's no Postgres service container defined in `.github/workflows/ci.yml`, and no `DATABASE_URL`/`JWT_SECRET_KEY`/`QR_HMAC_SECRET` environment variables provided at the job level. Given `core/config.py` fails loudly (by design) on missing required settings, **the backend CI job will fail at import time before any test runs**, unless these are supplied via GitHub Actions secrets/env that aren't visible in the committed workflow file.
- Only `tests/test_eta.py` exists (7 tests, all pure-function tests of the ETA formula — no database, no HTTP client involved). The `async_client` fixture in `conftest.py` is defined but currently unused by any test, meaning **none of the 19 real API routes have automated test coverage yet** — everything in §3 was only caught because this audit manually exercised the live server.

### 4.4 Frontend↔backend wiring
Confirmed via grep that the frontend still has no `fetch`/`axios` calls to a real backend anywhere outside test files — it's still running entirely on the mock service layer. This is expected at this stage, just noting the two halves aren't connected yet, so none of the backend fixes in §3 are currently visible to a frontend user.

---

## 5. Repo Hygiene — One New Item

- `frontend/vite.config.ts.timestamp-1788247190372-617cea4d27ec18.mjs` was committed — this is a Vite-generated temp file (created when Vite loads a `.ts` config under certain Node/ESM conditions) that should be gitignored, not tracked. Harmless but adds noise; add `*.timestamp-*.mjs` (or similar) to `.gitignore`.
- The `.agents/skills/` (47MB, 2,524 unrelated files) flagged in `AUDIT.md` §6 is still present at this commit — not yet removed.

---

## 6. Priority List for the Next Work Session

In order of "blocks the next person who clones this repo":

1. **Fix `seed.py`** — 4 boolean literals (`1`/`0` → `TRUE`/`FALSE`) and 5 `.isoformat()` calls (remove them, pass `datetime` objects directly). Verified fix in §3.1; this alone currently blocks anyone from getting demo data into a real database.
2. **Pin `bcrypt<4.1` in `requirements.txt`.** One-line fix; currently breaks all password hashing on a fresh install.
3. **Fix or comment out `SEED_ADMIN_PASSWORD` in `.env.example`**, and consider having `seed.py` print the officer password it actually used, so this class of silent mismatch can't happen again for any other env var.
4. **Reconcile `quantity_quintals` (docs) vs `quantity_q` (code)** — pick one, update the other. Separately, check `core/exceptions.py` handles `RequestValidationError` before the generic 500 handler, so bad payloads return clean 422s instead of leaking tracebacks.
5. **Add a Postgres service container + required env vars to the backend CI job**, or it will keep failing (or worse, silently not running the intended checks) on every push.
6. **Write integration tests using the existing (currently unused) `async_client` fixture** for at least: OTP flow, officer login, centre listing, pass generation, officer check-in. Right now the only backend tests are pure-function ETA tests — the 19 real HTTP routes have zero automated coverage, which is how §3.1–3.4 went unnoticed until this audit ran them by hand.
7. Once 1–3 are fixed, **test T-03 against a real Supabase project** (not just local Postgres) and **live-test the QR + WebSocket flow end-to-end** (§4.1, §4.2) — both still unverified.
8. Remove `.agents/skills/` and the stray Vite timestamp file (quick repo hygiene, still outstanding from last audit).

---

*This audit reflects the code at commit `79c1306`, tested against a real local PostgreSQL 16 instance. To reproduce: `cd backend && python -m venv .venv && source .venv/bin/activate && pip install -r requirements-dev.txt && pip install "bcrypt==4.0.1"` (workaround for §3.2), point `DATABASE_URL` at a real Postgres instance, `alembic upgrade head`, apply the §3.1 fixes to `seed.py` locally, `python seed.py`, then `uvicorn main:app` and exercise the routes listed in §3 with curl.*