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

## Authentication & One-Time Onboarding

### `POST /v1/auth/otp/request`
Request an OTP for farmer phone verification.

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

---

### `POST /v1/auth/otp/verify`
Verify OTP and receive JWT + profile status.

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
  "is_profile_complete": true,
  "user": {
    "id": "uuid",
    "phone": "+919876543210",
    "name": "Ramesh Kumar",
    "role": "FARMER",
    "preferred_language": "hi",
    "district": "Rajgarh",
    "village": "Biaora"
  }
}
```

---

### `POST /v1/farmer/profile`
Complete one-time onboarding profile (only needed once for new farmers).

**Auth**: Farmer JWT

**Request**:
```json
{
  "name": "Ramesh Kumar",
  "village": "Biaora",
  "district": "Rajgarh",
  "state": "Madhya Pradesh",
  "preferred_language": "hi",
  "primary_crop": "Wheat",
  "aadhaar_last4": "4521"
}
```

**Response** `200`:
```json
{
  "message": "Profile saved successfully. You are ready to generate procurement passes.",
  "farmer_id": "uuid",
  "profile": {
    "name": "Ramesh Kumar",
    "village": "Biaora",
    "district": "Rajgarh",
    "state": "Madhya Pradesh",
    "preferred_language": "hi"
  }
}
```

---

### `GET /v1/farmer/profile`
Retrieve persistent profile for returning farmer.

**Auth**: Farmer JWT

**Response** `200`:
```json
{
  "farmer_id": "uuid",
  "name": "Ramesh Kumar",
  "phone": "+919876543210",
  "village": "Biaora",
  "district": "Rajgarh",
  "state": "Madhya Pradesh",
  "preferred_language": "hi",
  "primary_crop": "Wheat"
}
```

---

### `POST /v1/auth/login`
Officer / Admin username + password login.

**Auth**: None

**Request**:
```json
{ "username": "officer_mp_01", "password": "••••••••" }
```

**Response** `200`: Same shape as OTP verify response with `role: "OFFICER"` or `"ADMIN"`.

---

## Centres

### `GET /v1/centres`
List nearby active centres matching the farmer's registered district/crop, with live congestion status & ETAs.

**Auth**: Farmer JWT

**Query params**:
| Param | Type | Description |
|---|---|---|
| `district` | string | Filter by district (defaults to farmer profile district) |
| `crop` | string | Filter by supported crop |

**Response** `200`:
```json
{
  "centres": [
    {
      "id": "uuid-001",
      "name": "Rajgarh Procurement Centre",
      "district": "Rajgarh",
      "state": "Madhya Pradesh",
      "status": "NORMAL",
      "queue_length": 14,
      "estimated_wait_minutes": 45,
      "active_counters": 2,
      "last_updated_at": "2026-10-15T08:32:00Z",
      "data_freshness": "FRESH"
    },
    {
      "id": "uuid-002",
      "name": "Biaora Mandi",
      "district": "Rajgarh",
      "state": "Madhya Pradesh",
      "status": "BUSY",
      "queue_length": 22,
      "estimated_wait_minutes": 80,
      "active_counters": 2,
      "last_updated_at": "2026-10-15T08:25:00Z",
      "data_freshness": "FRESH"
    }
  ]
}
```

---

## Progressive Procurement Pass & Queue

### `POST /v1/passes/generate` (or `/v1/queue/join`)
Generates digital procurement pass for a specific transaction without re-asking identity details.

**Auth**: Farmer JWT

**Request**:
```json
{
  "centre_id": "uuid-001",
  "crop": "Wheat",
  "quantity_quintals": 80.0
}
```

**Response** `201`:
```json
{
  "pass_id": "uuid",
  "token_code": "KQ-1047",
  "token_number": 47,
  "status": "WAITING",
  "position": 14,
  "farmer": {
    "name": "Ramesh Kumar",
    "village": "Biaora",
    "district": "Rajgarh"
  },
  "centre": {
    "id": "uuid-001",
    "name": "Rajgarh Procurement Centre",
    "operational_status": "NORMAL"
  },
  "transaction": {
    "crop": "Wheat",
    "quantity_quintals": 80.0,
    "estimated_arrival_window": "11:00 AM – 11:30 AM"
  },
  "eta": {
    "minutes": 45,
    "confidence": "HIGH",
    "computed_at": "2026-10-15T09:05:00Z"
  },
  "qr_token": {
    "token_id": "uuid",
    "qr_data": "KQ:eyJxZWlkIj...",
    "expires_at": "2026-10-15T23:59:59Z"
  }
}
```

---

### `GET /v1/queue/my-status`
Farmer's active pass & live queue status.

**Auth**: Farmer JWT

**Response** `200`:
```json
{
  "pass_id": "uuid",
  "token_code": "KQ-1047",
  "token_number": 47,
  "status": "WAITING",
  "position": 9,
  "crop": "Wheat",
  "quantity_quintals": 80.0,
  "eta": {
    "minutes": 32,
    "confidence": "HIGH",
    "computed_at": "2026-10-15T09:22:00Z"
  },
  "centre_operational_status": "NORMAL"
}
```

---

## Officer Operations

### `POST /v1/officer/checkin`
Officer checks in arriving farmer by scanning QR pass or entering token `KQ-1047`.

**Auth**: Officer JWT

**Request**:
```json
{ "qr_data": "KQ:eyJxZWlkIj..." }
```
OR manual token fallback:
```json
{ "token_code": "KQ-1047", "centre_id": "uuid" }
```

**Response** `200`:
```json
{
  "pass_id": "uuid",
  "farmer_name": "Ramesh Kumar",
  "token_code": "KQ-1047",
  "crop": "Wheat",
  "quantity_quintals": 80.0,
  "status": "CHECKED_IN",
  "checked_in_at": "2026-10-15T09:45:00Z"
}
```

---

### `POST /v1/officer/capacity`
Officer reports mandi operational status (Normal, Busy, Lifting Delayed, Reduced, Paused).

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
  "centre_id": "uuid",
  "status": "LIFTING_DELAYED",
  "capacity_factor": 0.60,
  "active_counters": 1,
  "effective_from": "2026-10-15T09:50:00Z",
  "eta_recalculated": true
}
```

---

## Procurement & Payment Receipts

### `GET /v1/procurement/{pass_id}`
**Auth**: Farmer JWT / Officer JWT

**Response** `200`:
```json
{
  "pass_id": "uuid",
  "token_code": "KQ-1047",
  "status": "COMPLETED",
  "procurement": {
    "crop": "Wheat",
    "quantity_quintals": 78.5,
    "grade": "A",
    "msp_rate_per_quintal": 2275.00,
    "total_amount": 178587.50,
    "procurement_date": "2026-10-15",
    "is_mock": true
  }
}
```

---

### `GET /v1/payment/{pass_id}`
**Auth**: Farmer JWT

**Response** `200`:
```json
{
  "pass_id": "uuid",
  "payment": {
    "status": "PENDING",
    "amount": 178587.50,
    "utr_number": null,
    "is_mock": true,
    "message": "Payment processing via State DBT portal. Expected within 3-5 working days."
  }
}
```

---

## Webhook: WhatsApp Assistant

### `POST /v1/webhooks/whatsapp`
Receives inbound WhatsApp messages from registered or new farmers.

**Auth**: X-Hub-Signature-256 validation

**Request** (from Meta Cloud API / Twilio):
```json
{
  "from": "+919876543210",
  "body": "I want to sell wheat"
}
```

**Response** `200`: Dispatches conversational assistant response formatted in the farmer's preferred language.
