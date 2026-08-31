# 12 — Backend Architecture

## Stack
**Python 3.11+ + FastAPI** (async, modular monolith) + **SQLAlchemy 2.x** (async ORM) + **Pydantic v2** (schema/validation) + **python-jose** (JWT) + **qrcode + hmac/hashlib** (QR/token signing).

---

## Design Principle: Modular Monolith

All modules live in a single deployable process. Each module is a Python package with its own router, service, and repository layer. Modules communicate in-process (function calls), not over the network. This eliminates distributed-transaction complexity for a 7-hour build while keeping the code separable later (see `29_ROADMAP.md`).

---

## Recommended Folder Structure

```text
backend/
├── main.py                    # FastAPI app factory, lifespan, router registration
├── core/
│   ├── config.py              # Settings from env vars (pydantic-settings)
│   ├── database.py            # Async SQLAlchemy engine + session factory
│   ├── security.py            # JWT encode/decode, password hashing
│   ├── dependencies.py        # FastAPI Depends() helpers (get_db, get_current_user)
│   └── exceptions.py          # Custom HTTPException subclasses + global handler
├── modules/
│   ├── auth/
│   │   ├── router.py          # POST /auth/otp/request, /auth/otp/verify, /auth/login
│   │   ├── service.py         # OTP generation (mocked), JWT issuance, user lookup
│   │   └── schemas.py         # OTPRequest, OTPVerify, LoginRequest, TokenResponse
│   ├── centres/
│   │   ├── router.py          # GET /centres, GET /centres/{id}, GET /centres/{id}/status
│   │   ├── service.py         # CentreService: list, get, get_status
│   │   ├── repository.py      # DB queries for centres + latest capacity_update
│   │   └── schemas.py         # CentreListItem, CentreDetail, CentreStatus
│   ├── queue/
│   │   ├── router.py          # POST /queue/join, GET /queue/my-status, GET /queue/{centreId}/list
│   │   ├── service.py         # QueueService: join, position, skip, cancel, complete
│   │   ├── repository.py      # CRUD for queue_entries, processing_events
│   │   └── schemas.py         # QueueJoinRequest, QueueStatusResponse, QueueEntry
│   ├── eta/
│   │   ├── engine.py          # ETAEngine.compute(centre_id) → ETAResult
│   │   └── schemas.py         # ETAResult (eta_minutes, confidence, factors_used)
│   ├── officer/
│   │   ├── router.py          # POST /officer/checkin, /officer/queue/{id}/start|complete, /officer/capacity
│   │   ├── service.py         # OfficerService: check_in, start_processing, complete, update_capacity
│   │   ├── repository.py      # capacity_updates CRUD
│   │   └── schemas.py         # CheckInRequest, CapacityUpdateRequest, OfficerQueueResponse
│   ├── qr/
│   │   ├── service.py         # QRService: issue(queue_entry_id) → QRToken; validate(token)
│   │   └── schemas.py         # QRTokenResponse, QRValidateRequest
│   ├── notifications/
│   │   ├── service.py         # NotificationService: dispatch(event, farmer_id)
│   │   └── adapters/
│   │       ├── base.py        # NotificationAdapter ABC
│   │       ├── mock.py        # MockNotificationAdapter (logs to stdout for MVP)
│   │       └── whatsapp.py    # WhatsAppAdapter (production stub — not wired for MVP)
│   ├── procurement/
│   │   ├── router.py          # GET /procurement/{queue_entry_id}, GET /payment/{queue_entry_id}
│   │   ├── service.py         # returns mocked or adapter-sourced procurement/payment data
│   │   └── schemas.py         # ProcurementRecord, PaymentStatus
│   ├── integration/
│   │   ├── base.py            # GovernmentProcurementAdapter ABC
│   │   ├── mock_adapter.py    # MockGovernmentProcurementAdapter — returns seeded mock data
│   │   ├── euparjan.py        # STUB: eUparjan adapter (documents integration point only)
│   │   └── ekharid.py         # STUB: eKharid adapter (documents integration point only)
│   └── admin/
│       ├── router.py          # GET/POST/PUT/DELETE /admin/centres, /admin/officers (P1)
│       └── service.py         # AdminService (centre + officer CRUD)
└── realtime/
    ├── gateway.py             # WebSocket endpoint /ws/{centre_id}, connection manager
    ├── manager.py             # ConnectionManager: register, broadcast, disconnect
    └── events.py              # Event type constants + serialization helpers
```

---

## Module Descriptions

### `core/`
- **config.py**: Reads all secrets/settings from env vars via `pydantic-settings`. Never hardcoded. See `26_ENVIRONMENT_VARIABLES.md`.
- **database.py**: `create_async_engine` + `async_sessionmaker`. All DB I/O is async.
- **security.py**: `create_access_token(sub, role, exp)`, `decode_token(token)`, `hash_password`, `verify_password`.
- **dependencies.py**: `get_db` yields an `AsyncSession`; `get_current_user` decodes JWT from `Authorization: Bearer ...`; `require_role("OFFICER")` / `require_role("ADMIN")` are RBAC gatekeepers.

### `modules/auth/`
- **MVP OTP mock**: `OTP_BYPASS_CODE = "1234"` (dev only, controlled via env var `OTP_MOCK_ENABLED`). In production, `service.py` calls an SMS gateway.
- JWT payload: `{ "sub": user_id, "role": "FARMER"|"OFFICER"|"ADMIN", "exp": unix_timestamp }`.

### `modules/queue/`
`QueueService.join()` is the most complex write path:
  1. Check centre status (not Paused).
  2. Verify no duplicate active entry for this farmer at this centre.
  3. `INSERT queue_entries` with `status = WAITING`.
  4. Call `ETAEngine.compute(centre_id)` for the initial ETA.
  5. Call `QRService.issue(queue_entry_id)`.
  6. Broadcast `QUEUE_JOINED` via `ConnectionManager`.
  7. Return combined response in one HTTP response.

All steps within a single DB transaction; rollback on any error.

### `modules/eta/`
- Pure function: `ETAEngine.compute(centre_id, db) → ETAResult`.
- Reads `queue_entries` (count of WAITING/CHECKED_IN), latest `capacity_updates` row, and static `centres.avg_processing_minutes`.
- Formula and full specification: `16_ETA_ENGINE.md`.
- Called: on queue join, on capacity update, on processing start/complete (each shifts positions upstream).

### `modules/officer/`
- **update_capacity()**: writes `capacity_updates`, calls `ETAEngine.compute()`, then broadcasts `CAPACITY_UPDATED` + `ETA_UPDATED` to all subscribed farmer WebSocket clients via `ConnectionManager.broadcast(centre_id, event)`.
- **check_in()**: validates QR token via `QRService.validate()`, marks `queue_entries.status = CHECKED_IN`, broadcasts `QUEUE_POSITION_CHANGED`.

### `modules/qr/`
Full signing/validation specification: `18_QR_TOKEN_SYSTEM.md`.
- MVP: HMAC-SHA256 signed JSON payload, stored hash in `qr_tokens` table.

### `modules/notifications/`
Adapter pattern: `NotificationService` holds a reference to the active `NotificationAdapter` (injected via config). MVP wires `MockNotificationAdapter` (logs "would send WhatsApp to +91XXXXXXXXXX: [message]"). Production wires `WhatsAppAdapter`.

Events triggering notifications: `QUEUE_JOINED`, `ETA_UPDATED` (> 30 min delta), `PROCESSING_STARTED`, `PROCESSING_COMPLETED`.

### `modules/integration/`
- `GovernmentProcurementAdapter` ABC defines: `get_procurement_record(farmer_id, crop, date)`, `get_payment_status(record_id)`.
- `MockGovernmentProcurementAdapter` returns seeded data from `22_MOCK_DATA.md`.
- `euparjan.py` and `ekharid.py` are stubs with docstrings documenting what real integration requires (data-sharing MoU, OAuth scopes, official API docs — none publicly available). **ASSUMPTION — NOT VERIFIED.**

### `realtime/`
- **ConnectionManager**: `dict[centre_id → set[WebSocket]]` and `dict[user_id → WebSocket]`.
- **gateway.py**: `@app.websocket("/ws/{centre_id}")` — validates JWT from `token` query param, registers connection, loops on receive for ping/keepalive.
- **events.py**: canonical event names (`QUEUE_JOINED`, `QUEUE_POSITION_CHANGED`, `ETA_UPDATED`, `CENTRE_STATUS_CHANGED`, `PROCESSING_STARTED`, `PROCESSING_COMPLETED`, `CAPACITY_UPDATED`). Full list: `15_REALTIME_QUEUE.md`.
- **Graceful fallback**: if WebSocket drops, farmer clients fall back to REST polling every 15s. Handled client-side (`11_FRONTEND_ARCHITECTURE.md`).

---

## Middleware Stack

```
Request
  → CORSMiddleware        (allow Vite dev origin + deployed Vercel domain)
  → RequestLoggingMiddleware (structured: method, path, status, duration_ms, user_id)
  → [per-route] Depends(get_current_user) + Depends(require_role(...))
Response
```

---

## Error Handling

`core/exceptions.py` defines:

| Exception Class | HTTP Status | Error Code |
|---|---|---|
| `NotFoundError` | 404 | `RESOURCE_NOT_FOUND` |
| `UnauthorizedError` | 401 | `UNAUTHORIZED` |
| `ForbiddenError` | 403 | `FORBIDDEN` |
| `ConflictError` | 409 | `CONFLICT` |
| `QueueFullError` | 409 | `QUEUE_AT_CAPACITY` |
| `CentrePausedError` | 409 | `CENTRE_PAUSED` |
| `InvalidTokenError` | 400 | `INVALID_QR_TOKEN` |

Global exception handler returns:
```json
{
  "error_code": "QUEUE_ALREADY_ACTIVE",
  "message": "You are already in the queue for this centre.",
  "detail": null
}
```
Farmer-facing `message` is in plain language; `detail` carries developer info (null in production). See `23_ERROR_HANDLING.md`.

---

## Logging

- **MVP**: `structlog` to stdout (captured by Render/Railway log collector).
- Every action logs: `user_id`, `centre_id`, `action`, `outcome`, `duration_ms`, `timestamp`.
- Audit-sensitive actions (check-in, capacity update, token issue/validate) also write to `audit_logs` table in PostgreSQL.

---

## Security Boundaries

- No raw SQL — SQLAlchemy ORM only (prevents SQL injection).
- JWT verified on every protected route via `Depends(get_current_user)`.
- Role assertions via `Depends(require_role(...))`.
- Secrets injected via env vars only. See `26_ENVIRONMENT_VARIABLES.md`.
- Rate limiting: `slowapi` on OTP request endpoint (5 requests/phone/hour).
- Full spec: `19_AUTH_RBAC_SECURITY.md`.

---

## Key Design Decisions

| Decision | Choice | Reason |
|---|---|---|
| Async ORM | SQLAlchemy 2.x async | Compatible with FastAPI's async event loop; avoids thread-pool overhead when mixing DB + WebSocket I/O |
| Repository pattern | Thin repos (~5 lines each) | Keeps service layer testable without a real DB; repos are simple query wrappers |
| In-process ETA call | Yes | Fast, consistent within transaction; network call would add latency + failure surface |
| Government adapter as ABC | Yes | Core logic never imports a concrete adapter; swap mock → real is a config change, not a code change |
| Single modular monolith | Yes | 7-hour build cannot absorb microservice operational overhead; modules are logically separable for future extraction |
