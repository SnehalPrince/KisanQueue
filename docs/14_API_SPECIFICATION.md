# 14 — API Specification

## Conventions

- **Base URL**: `https://api.kisanqueue.in/v1` (production) / `http://localhost:8000/v1` (local)
- **Auth**: `Authorization: Bearer <JWT>` on all protected endpoints.
- **Format**: all request/response bodies are `application/json`.
- **Timestamps**: ISO 8601 / RFC 3339 UTC strings.
- **IDs**: UUID v4 strings.
- **Errors**: all errors return `{ "error_code": string, "message": string, "detail": object|null }`.
- **Versioning**: `/v1/` prefix; future breaking changes get `/v2/`.

---

## Authentication

### `POST /v1/auth/otp/request`
Request an OTP for farmer login.

**Auth**: None

**Request**:
```json
{ "phone": "+919876543210" }
```

**Response** `200`:
```json
{ "message": "OTP sent", "expires_in_seconds": 300 }
```
> MVP: OTP is `1234` (static dev code, controlled by `OTP_MOCK_ENABLED` env var).

**Errors**: `422` validation, `429` rate limited (5 req/phone/hour).

---

### `POST /v1/auth/otp/verify`
Verify OTP and receive JWT.

**Auth**: None

**Request**:
```json
{ "phone": "+919876543210", "otp": "1234" }
```

**Response** `200`:
```json
{
  "access_token": "eyJhbGci...",
  "token_type": "bearer",
  "expires_in": 86400,
  "user": {
    "id": "uuid",
    "name": "Ramesh Kumar",
    "role": "FARMER",
    "preferred_language": "hi"
  }
}
```

**Errors**: `400 INVALID_OTP`, `400 OTP_EXPIRED`, `401 UNAUTHORIZED`.

---

### `POST /v1/auth/login`
Officer / Admin username + password login.

**Auth**: None

**Request**:
```json
{ "username": "officer_mp_01", "password": "••••••••" }
```

**Response** `200`: Same shape as OTP verify response, `role: "OFFICER"` or `"ADMIN"`.

**Errors**: `401 INVALID_CREDENTIALS`, `403 ACCOUNT_DISABLED`.

---

### `POST /v1/auth/refresh` `[POST-MVP]`
Refresh a near-expired token.

---

## Centres

### `GET /v1/centres`
List all active centres, optionally filtered.

**Auth**: Farmer JWT (or guest in MVP — TBD per `30_OPEN_QUESTIONS.md`)

**Query params**:
| Param | Type | Description |
|---|---|---|
| `state` | string | Filter by state |
| `district` | string | Filter by district |
| `crop` | string | Filter by supported crop |

**Response** `200`:
```json
{
  "centres": [
    {
      "id": "uuid",
      "name": "Rajgarh Procurement Centre",
      "district": "Rajgarh",
      "state": "Madhya Pradesh",
      "status": "NORMAL",
      "queue_length": 14,
      "estimated_wait_minutes": 52,
      "last_updated_at": "2026-10-15T08:32:00Z",
      "data_freshness": "FRESH"
    }
  ]
}
```

`data_freshness` values: `FRESH` (< 15 min), `STALE` (15–30 min), `VERY_STALE` (> 30 min), `UNKNOWN`.

---

### `GET /v1/centres/{centre_id}`
Full centre detail including supported crops, location, counters.

**Auth**: Farmer JWT

**Response** `200`:
```json
{
  "id": "uuid",
  "name": "Rajgarh Procurement Centre",
  "district": "Rajgarh",
  "state": "Madhya Pradesh",
  "village_or_city": "Rajgarh",
  "latitude": 23.7856,
  "longitude": 76.7234,
  "supported_crops": ["Wheat", "Paddy", "Soybean"],
  "avg_processing_minutes": 25,
  "daily_capacity_farmers": 100,
  "active_counters_default": 2,
  "status": {
    "operational_status": "LIFTING_DELAYED",
    "capacity_factor": 0.60,
    "active_counters": 1,
    "notes": "FCI truck not arrived yet",
    "effective_from": "2026-10-15T07:45:00Z"
  },
  "queue_length": 14,
  "last_updated_at": "2026-10-15T08:32:00Z"
}
```

**Errors**: `404 RESOURCE_NOT_FOUND`.

---

### `GET /v1/centres/{centre_id}/status`
Lightweight status-only endpoint for polling fallback.

**Auth**: Farmer JWT

**Response** `200`:
```json
{
  "centre_id": "uuid",
  "operational_status": "NORMAL",
  "capacity_factor": 1.00,
  "active_counters": 2,
  "queue_length": 8,
  "estimated_wait_minutes": 30,
  "confidence": "MEDIUM",
  "last_updated_at": "2026-10-15T09:01:00Z",
  "data_freshness": "FRESH"
}
```

---

## Queue

### `POST /v1/queue/join`
Farmer joins virtual queue at a centre.

**Auth**: Farmer JWT

**Request**:
```json
{
  "centre_id": "uuid",
  "crop": "Wheat",
  "quantity_quintals": 40.5
}
```

**Response** `201`:
```json
{
  "queue_entry_id": "uuid",
  "token_number": 47,
  "status": "WAITING",
  "position": 14,
  "eta": {
    "minutes": 87,
    "confidence": "MEDIUM",
    "factors": ["queue_length", "capacity_factor", "active_counters"],
    "computed_at": "2026-10-15T09:05:00Z"
  },
  "qr_token": {
    "token_id": "uuid",
    "qr_data": "KQ:eyJxZWlkIj...",
    "expires_at": "2026-10-15T23:59:59Z"
  },
  "centre": {
    "id": "uuid",
    "name": "Rajgarh Procurement Centre",
    "operational_status": "NORMAL"
  }
}
```

**Errors**: `409 QUEUE_ALREADY_ACTIVE`, `409 CENTRE_PAUSED`, `409 QUEUE_AT_CAPACITY`, `404 RESOURCE_NOT_FOUND`.

---

### `GET /v1/queue/my-status`
Farmer's current queue status (REST polling fallback).

**Auth**: Farmer JWT

**Query params**: `centre_id` (optional — returns all active entries if omitted)

**Response** `200`:
```json
{
  "queue_entry_id": "uuid",
  "centre_id": "uuid",
  "token_number": 47,
  "status": "WAITING",
  "position": 9,
  "eta": {
    "minutes": 53,
    "confidence": "MEDIUM",
    "computed_at": "2026-10-15T09:22:00Z"
  },
  "centre_operational_status": "NORMAL"
}
```

**Errors**: `404` if farmer has no active entry.

---

### `DELETE /v1/queue/my-entry/{queue_entry_id}`
Farmer cancels their own queue entry.

**Auth**: Farmer JWT

**Response** `200`: `{ "status": "CANCELLED" }`

**Errors**: `403 FORBIDDEN` (not their entry), `409 CANNOT_CANCEL` (already in PROCESSING or COMPLETED).

---

### `GET /v1/queue/{centre_id}/list`
Officer view of their centre's full queue.

**Auth**: Officer JWT (must manage this centre)

**Query params**: `status` (filter: WAITING, CHECKED_IN, PROCESSING, etc.)

**Response** `200`:
```json
{
  "centre_id": "uuid",
  "queue": [
    {
      "queue_entry_id": "uuid",
      "token_number": 44,
      "farmer_name": "Ramesh Kumar",
      "crop": "Wheat",
      "quantity_quintals": 40.5,
      "status": "WAITING",
      "position": 1,
      "joined_at": "2026-10-15T07:30:00Z",
      "checked_in_at": null
    }
  ],
  "summary": {
    "total_waiting": 14,
    "total_checked_in": 2,
    "total_processing": 1,
    "total_completed_today": 28
  }
}
```

**Errors**: `403 FORBIDDEN` (officer doesn't manage this centre).

---

## Officer Operations

### `POST /v1/officer/checkin`
Officer scans/enters QR to check in a farmer.

**Auth**: Officer JWT

**Request**:
```json
{ "qr_data": "KQ:eyJxZWlkIj..." }
```
OR manual entry fallback:
```json
{ "token_number": 47, "centre_id": "uuid" }
```

**Response** `200`:
```json
{
  "queue_entry_id": "uuid",
  "farmer_name": "Ramesh Kumar",
  "token_number": 47,
  "crop": "Wheat",
  "quantity_quintals": 40.5,
  "status": "CHECKED_IN",
  "checked_in_at": "2026-10-15T09:45:00Z"
}
```

**Errors**: `400 INVALID_QR_TOKEN`, `400 QR_EXPIRED`, `409 ALREADY_CHECKED_IN`, `403 CENTRE_MISMATCH`.

---

### `POST /v1/officer/queue/{queue_entry_id}/start`
Officer marks processing started.

**Auth**: Officer JWT

**Response** `200`:
```json
{ "queue_entry_id": "uuid", "status": "PROCESSING", "processing_started_at": "..." }
```

---

### `POST /v1/officer/queue/{queue_entry_id}/complete`
Officer marks processing completed.

**Auth**: Officer JWT

**Request** (optional):
```json
{ "quantity_quintals": 38.0, "grade": "A", "notes": "Minor moisture, accepted" }
```

**Response** `200`:
```json
{
  "queue_entry_id": "uuid",
  "status": "COMPLETED",
  "processing_completed_at": "...",
  "procurement_record_id": "uuid"
}
```

Side effects: triggers `NotificationService.dispatch(PROCESSING_COMPLETED, farmer_id)`, updates ETA for all remaining WAITING entries, broadcasts `QUEUE_POSITION_CHANGED`.

---

### `POST /v1/officer/queue/{queue_entry_id}/skip`
Officer marks a farmer as skipped (not present at check-in call).

**Auth**: Officer JWT

**Response** `200`: `{ "status": "SKIPPED" }`

---

### `POST /v1/officer/capacity`
Officer updates centre operational status.

**Auth**: Officer JWT

**Request**:
```json
{
  "status": "LIFTING_DELAYED",
  "capacity_factor": 0.60,
  "active_counters": 1,
  "notes": "FCI truck delayed by ~2 hours"
}
```

**Response** `200`:
```json
{
  "capacity_update_id": "uuid",
  "centre_id": "uuid",
  "status": "LIFTING_DELAYED",
  "capacity_factor": 0.60,
  "active_counters": 1,
  "effective_from": "2026-10-15T09:50:00Z",
  "eta_recalculated": true,
  "new_eta_sample": {
    "position_14": { "minutes": 145, "confidence": "LOW" }
  }
}
```

Side effects: triggers ETA recalculation for all WAITING entries at this centre, broadcasts `CAPACITY_UPDATED` + `ETA_UPDATED` to all subscribed WebSocket clients.

---

## Procurement & Payment

### `GET /v1/procurement/{queue_entry_id}`
Farmer views their procurement record.

**Auth**: Farmer JWT (own entries only) or Officer JWT

**Response** `200`:
```json
{
  "queue_entry_id": "uuid",
  "status": "COMPLETED",
  "procurement": {
    "id": "uuid",
    "crop": "Wheat",
    "quantity_quintals": 38.0,
    "grade": "A",
    "msp_rate_per_quintal": 2275.00,
    "total_amount": 86450.00,
    "procurement_date": "2026-10-15",
    "is_mock": true
  }
}
```
> `is_mock: true` displayed in UI with "Demo Data" label. See `07_UX_UI_DESIGN.md`.

**Errors**: `404` if not yet completed, `403 FORBIDDEN`.

---

### `GET /v1/payment/{queue_entry_id}`
Farmer views payment status.

**Auth**: Farmer JWT

**Response** `200`:
```json
{
  "queue_entry_id": "uuid",
  "payment": {
    "status": "PENDING",
    "amount": 86450.00,
    "utr_number": null,
    "paid_at": null,
    "is_mock": true,
    "message": "Payment is being processed by the government portal. Expected within 3–7 working days."
  }
}
```

---

## QR Token

### `GET /v1/qr/{queue_entry_id}`
Re-fetch or regenerate QR token (e.g. if farmer lost it).

**Auth**: Farmer JWT (own entry only)

**Response** `200`:
```json
{
  "token_id": "uuid",
  "qr_data": "KQ:eyJxZWlkIj...",
  "expires_at": "2026-10-15T23:59:59Z",
  "is_used": false
}
```

**Errors**: `404`, `410 QR_ALREADY_USED` (token consumed, entry checked in).

---

## Notifications (MVP mock — POST-MVP for real dispatch)

### `GET /v1/notifications/my`
Farmer views their notification history.

**Auth**: Farmer JWT

**Response** `200`:
```json
{
  "notifications": [
    {
      "id": "uuid",
      "event_type": "QUEUE_JOINED",
      "message": "आपका टोकन नंबर 47 है। अनुमानित प्रतीक्षा: 87 मिनट।",
      "channel": "IN_APP",
      "sent_at": "2026-10-15T09:05:00Z"
    }
  ]
}
```

---

## Admin `[P1]`

### `GET /v1/admin/centres`
### `POST /v1/admin/centres`
### `PUT /v1/admin/centres/{id}`
### `GET /v1/admin/officers`
### `POST /v1/admin/officers`
### `PUT /v1/admin/officers/{id}`

All require `ADMIN` role JWT. Standard CRUD — omitted from full spec here as P1.

---

## WebSocket

### `WS /ws/{centre_id}?token=<JWT>`
Real-time event stream for a centre.

**Auth**: JWT in `token` query param (validated on connect).

**On connect**: server sends current centre status + ETA snapshot.

**Server → Client events** (JSON messages):
```json
{ "event": "QUEUE_POSITION_CHANGED", "data": { "queue_entry_id": "uuid", "new_position": 9, "eta_minutes": 53 } }
{ "event": "ETA_UPDATED", "data": { "centre_id": "uuid", "entries": [{ "queue_entry_id": "uuid", "eta_minutes": 145, "confidence": "LOW" }] } }
{ "event": "CENTRE_STATUS_CHANGED", "data": { "centre_id": "uuid", "status": "LIFTING_DELAYED", "capacity_factor": 0.60, "notes": "..." } }
{ "event": "PROCESSING_STARTED", "data": { "queue_entry_id": "uuid" } }
{ "event": "PROCESSING_COMPLETED", "data": { "queue_entry_id": "uuid" } }
{ "event": "QUEUE_JOINED", "data": { "token_number": 47, "position": 14 } }
```

**Client → Server**: heartbeat ping only:
```json
{ "type": "ping" }
```
Server replies:
```json
{ "type": "pong" }
```

Full realtime spec: `15_REALTIME_QUEUE.md`.

---

## WhatsApp Webhook (Production — not implemented in MVP)

### `POST /v1/webhooks/whatsapp`
Receives inbound messages from WhatsApp Cloud API / Twilio. MVP: not active; the in-app simulator calls REST endpoints directly. See `17_WHATSAPP_INTEGRATION.md`.

---

## Error Code Reference

| `error_code` | HTTP | Meaning |
|---|---|---|
| `INVALID_OTP` | 400 | OTP is wrong |
| `OTP_EXPIRED` | 400 | OTP has expired |
| `INVALID_CREDENTIALS` | 401 | Wrong username/password |
| `UNAUTHORIZED` | 401 | No/invalid JWT |
| `FORBIDDEN` | 403 | Valid JWT but wrong role or resource ownership |
| `RESOURCE_NOT_FOUND` | 404 | Entity does not exist |
| `QUEUE_ALREADY_ACTIVE` | 409 | Farmer already in queue at this centre |
| `CENTRE_PAUSED` | 409 | Centre is not accepting new queue entries |
| `QUEUE_AT_CAPACITY` | 409 | Daily capacity limit reached |
| `INVALID_QR_TOKEN` | 400 | QR signature invalid |
| `QR_EXPIRED` | 400 | QR token past expiry |
| `ALREADY_CHECKED_IN` | 409 | Token already scanned |
| `CENTRE_MISMATCH` | 403 | Officer scanned a token for a different centre |
| `CANNOT_CANCEL` | 409 | Entry in non-cancellable state |
| `INTERNAL_ERROR` | 500 | Unhandled server error |
| `RATE_LIMITED` | 429 | Too many requests |
