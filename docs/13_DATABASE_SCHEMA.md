# 13 — Database Schema

## Design Principles
- **Normalized** — no redundant denormalization until a genuine performance need is proven.
- **Audit-ready** — every significant state change is either tracked via a status column + timestamp or via a separate events/log table.
- **Minimal** — only tables that are directly required for MVP functionality or that enforce data integrity. Tables not needed at MVP are marked `[POST-MVP]`.
- **PostgreSQL-specific features** used: ENUM types, UUID primary keys (`gen_random_uuid()`), `CHECK` constraints, `TIMESTAMPTZ` for all timestamps.

---

## Tables

### `users`
Central identity record for all actors. Role determines which companion table exists.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | UUID | PK, default gen_random_uuid() | |
| `phone` | VARCHAR(15) | UNIQUE, NOT NULL | E.164 format, e.g. +919876543210 |
| `name` | VARCHAR(100) | NOT NULL | |
| `role` | ENUM('FARMER','OFFICER','ADMIN') | NOT NULL | |
| `preferred_language` | ENUM('en','hi') | NOT NULL, default 'hi' | |
| `is_active` | BOOLEAN | NOT NULL, default TRUE | |
| `created_at` | TIMESTAMPTZ | NOT NULL, default now() | |
| `updated_at` | TIMESTAMPTZ | NOT NULL, default now() | |

**Indexes**: `phone` (unique index implicit from UNIQUE constraint), `role`.

---

### `farmers`
Extended profile for farmer users. 1:1 with `users` where `role = FARMER`.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | UUID | PK, FK → users.id ON DELETE CASCADE | |
| `aadhaar_last4` | CHAR(4) | NULLABLE | For display/verification hint only — never store full Aadhaar |
| `village` | VARCHAR(100) | NULLABLE | |
| `district` | VARCHAR(100) | NULLABLE | |
| `state` | VARCHAR(50) | NULLABLE | |
| `primary_crop` | VARCHAR(50) | NULLABLE | |
| `created_at` | TIMESTAMPTZ | NOT NULL, default now() | |

> **PII Note**: No full Aadhaar, no biometrics, no financial account numbers stored. Only last-4 for reference display. See `19_AUTH_RBAC_SECURITY.md`.

---

### `officers`
Extended profile for procurement officer users. 1:1 with `users` where `role = OFFICER`.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | UUID | PK, FK → users.id ON DELETE CASCADE | |
| `employee_id` | VARCHAR(50) | UNIQUE, NOT NULL | Government employee ID |
| `centre_id` | UUID | FK → centres.id, NOT NULL | The centre this officer manages |
| `created_at` | TIMESTAMPTZ | NOT NULL, default now() | |

**Indexes**: `centre_id`.

---

### `centres`
Procurement centre (mandi) master data.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | UUID | PK, default gen_random_uuid() | |
| `name` | VARCHAR(150) | NOT NULL | |
| `state` | VARCHAR(50) | NOT NULL | e.g. 'Madhya Pradesh' |
| `district` | VARCHAR(100) | NOT NULL | |
| `village_or_city` | VARCHAR(100) | NOT NULL | |
| `latitude` | DECIMAL(9,6) | NULLABLE | For map view (P2) |
| `longitude` | DECIMAL(9,6) | NULLABLE | |
| `avg_processing_minutes` | INTEGER | NOT NULL, default 25 | Baseline minutes per farmer, used in ETA formula |
| `daily_capacity_farmers` | INTEGER | NOT NULL, default 100 | Maximum farmers processable per day |
| `active_counters_default` | INTEGER | NOT NULL, default 2 | Default number of processing counters |
| `supported_crops` | TEXT[] | NOT NULL, default '{}' | Array of crop names accepted |
| `is_active` | BOOLEAN | NOT NULL, default TRUE | |
| `created_at` | TIMESTAMPTZ | NOT NULL, default now() | |
| `updated_at` | TIMESTAMPTZ | NOT NULL, default now() | |

**Indexes**: `state`, `district`, `is_active`.

---

### `capacity_updates`
Time-series of officer-reported operational status changes. The latest row per centre is the current status. Never update in place — always insert a new row (preserves audit history).

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | UUID | PK, default gen_random_uuid() | |
| `centre_id` | UUID | FK → centres.id, NOT NULL | |
| `officer_id` | UUID | FK → users.id, NOT NULL | Who reported this |
| `status` | ENUM('NORMAL','BUSY','LIFTING_DELAYED','REDUCED_CAPACITY','PAUSED') | NOT NULL | |
| `capacity_factor` | DECIMAL(3,2) | NOT NULL, default 1.00, CHECK (0.05 <= capacity_factor <= 1.00) | 1.00 = full, 0.60 = 40% reduction |
| `active_counters` | INTEGER | NOT NULL, CHECK (active_counters >= 0) | Officer-reported live counter count |
| `notes` | TEXT | NULLABLE | Optional officer note |
| `effective_from` | TIMESTAMPTZ | NOT NULL, default now() | |
| `created_at` | TIMESTAMPTZ | NOT NULL, default now() | |

**Indexes**: `centre_id + effective_from DESC` (for fast "latest status" query).

> **Query pattern**: `SELECT * FROM capacity_updates WHERE centre_id = $1 ORDER BY effective_from DESC LIMIT 1`

---

### `queue_entries`
One row per farmer per centre per day attempt. The core queue lifecycle table.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | UUID | PK, default gen_random_uuid() | |
| `centre_id` | UUID | FK → centres.id, NOT NULL | |
| `farmer_id` | UUID | FK → users.id, NOT NULL | |
| `token_number` | INTEGER | NOT NULL | Display token (human-readable, e.g. 47) |
| `status` | ENUM('WAITING','CHECKED_IN','PROCESSING','COMPLETED','SKIPPED','CANCELLED','NO_SHOW') | NOT NULL, default 'WAITING' | |
| `crop` | VARCHAR(50) | NOT NULL | Crop being sold |
| `quantity_quintals` | DECIMAL(8,2) | NULLABLE | Self-declared, for planning |
| `joined_at` | TIMESTAMPTZ | NOT NULL, default now() | |
| `checked_in_at` | TIMESTAMPTZ | NULLABLE | Set by officer check-in action |
| `processing_started_at` | TIMESTAMPTZ | NULLABLE | |
| `processing_completed_at` | TIMESTAMPTZ | NULLABLE | |
| `initial_eta_minutes` | INTEGER | NULLABLE | ETA given at join time |
| `last_eta_minutes` | INTEGER | NULLABLE | Most recently computed ETA |
| `eta_computed_at` | TIMESTAMPTZ | NULLABLE | |
| `notes` | TEXT | NULLABLE | Officer notes |
| `created_at` | TIMESTAMPTZ | NOT NULL, default now() | |
| `updated_at` | TIMESTAMPTZ | NOT NULL, default now() | |

**Constraints**:
- `UNIQUE (centre_id, token_number, DATE(joined_at))` — token numbers unique per centre per day.
- `UNIQUE (centre_id, farmer_id)` WHERE `status IN ('WAITING','CHECKED_IN','PROCESSING')` — enforced via partial unique index to prevent duplicate active entries.

**Indexes**: `centre_id + status`, `farmer_id`, `centre_id + joined_at DESC`.

---

### `qr_tokens`
One row per issued QR token. Stores the HMAC signature for validation.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | UUID | PK, default gen_random_uuid() | |
| `queue_entry_id` | UUID | FK → queue_entries.id, UNIQUE, NOT NULL | 1:1 relationship |
| `token_payload_hash` | VARCHAR(64) | NOT NULL | HMAC-SHA256 hex of the signed payload |
| `expires_at` | TIMESTAMPTZ | NOT NULL | Default: end of same calendar day |
| `is_used` | BOOLEAN | NOT NULL, default FALSE | Set TRUE on first successful check-in scan |
| `is_revoked` | BOOLEAN | NOT NULL, default FALSE | Set TRUE if entry cancelled |
| `created_at` | TIMESTAMPTZ | NOT NULL, default now() | |

**Indexes**: `queue_entry_id` (unique), `expires_at` (for expiry sweep).

---

### `processing_events`
Append-only log of every state transition for a queue entry. Supports debugging and audit.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | UUID | PK, default gen_random_uuid() | |
| `queue_entry_id` | UUID | FK → queue_entries.id, NOT NULL | |
| `officer_id` | UUID | FK → users.id, NULLABLE | NULL for system-generated events |
| `event_type` | ENUM('JOINED','CHECKED_IN','PROCESSING_STARTED','PROCESSING_COMPLETED','SKIPPED','CANCELLED','NO_SHOW','ETA_UPDATED') | NOT NULL | |
| `from_status` | VARCHAR(20) | NULLABLE | |
| `to_status` | VARCHAR(20) | NULLABLE | |
| `eta_minutes_snapshot` | INTEGER | NULLABLE | ETA at the time of event |
| `notes` | TEXT | NULLABLE | |
| `created_at` | TIMESTAMPTZ | NOT NULL, default now() | |

**Indexes**: `queue_entry_id + created_at`.

---

### `procurement_records`
Mocked procurement outcome. In production, populated via `GovernmentProcurementAdapter`.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | UUID | PK, default gen_random_uuid() | |
| `queue_entry_id` | UUID | FK → queue_entries.id, UNIQUE, NOT NULL | |
| `farmer_id` | UUID | FK → users.id, NOT NULL | |
| `centre_id` | UUID | FK → centres.id, NOT NULL | |
| `crop` | VARCHAR(50) | NOT NULL | |
| `quantity_quintals` | DECIMAL(8,2) | NOT NULL | |
| `grade` | VARCHAR(10) | NULLABLE | e.g. 'A', 'B', 'FAQ' |
| `msp_rate_per_quintal` | DECIMAL(10,2) | NULLABLE | |
| `total_amount` | DECIMAL(12,2) | NULLABLE | |
| `procurement_date` | DATE | NOT NULL | |
| `is_mock` | BOOLEAN | NOT NULL, default TRUE | FALSE when populated from real government API |
| `created_at` | TIMESTAMPTZ | NOT NULL, default now() | |

---

### `payment_status`
Mocked payment outcome. In production, from DBT/government payment system.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | UUID | PK, default gen_random_uuid() | |
| `procurement_record_id` | UUID | FK → procurement_records.id, UNIQUE, NOT NULL | |
| `farmer_id` | UUID | FK → users.id, NOT NULL | |
| `status` | ENUM('PENDING','PROCESSING','PAID','FAILED') | NOT NULL, default 'PENDING' | |
| `amount` | DECIMAL(12,2) | NULLABLE | |
| `utr_number` | VARCHAR(50) | NULLABLE | Bank transaction reference |
| `paid_at` | TIMESTAMPTZ | NULLABLE | |
| `is_mock` | BOOLEAN | NOT NULL, default TRUE | |
| `created_at` | TIMESTAMPTZ | NOT NULL, default now() | |
| `updated_at` | TIMESTAMPTZ | NOT NULL, default now() | |

---

### `audit_logs`
Append-only audit trail for security-sensitive actions.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | UUID | PK, default gen_random_uuid() | |
| `actor_id` | UUID | NULLABLE | NULL for unauthenticated/system actions |
| `actor_role` | VARCHAR(10) | NULLABLE | |
| `action` | VARCHAR(100) | NOT NULL | e.g. 'QR_TOKEN_VALIDATED', 'CAPACITY_UPDATED' |
| `resource_type` | VARCHAR(50) | NULLABLE | e.g. 'queue_entry', 'centre' |
| `resource_id` | UUID | NULLABLE | |
| `result` | ENUM('SUCCESS','FAILURE') | NOT NULL | |
| `ip_address` | INET | NULLABLE | |
| `detail` | JSONB | NULLABLE | Extra context |
| `created_at` | TIMESTAMPTZ | NOT NULL, default now() | |

**Indexes**: `actor_id`, `action`, `created_at DESC`.

---

### `notifications` `[POST-MVP]`
Log of dispatched notifications for deduplication and delivery tracking.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | UUID | PK | |
| `farmer_id` | UUID | FK → users.id | |
| `channel` | ENUM('WHATSAPP','SMS','IN_APP') | NOT NULL | |
| `event_type` | VARCHAR(50) | NOT NULL | |
| `message` | TEXT | NOT NULL | |
| `status` | ENUM('QUEUED','SENT','FAILED') | NOT NULL | |
| `sent_at` | TIMESTAMPTZ | NULLABLE | |
| `created_at` | TIMESTAMPTZ | NOT NULL | |

---

## ER Diagram

```mermaid
erDiagram
    users {
        UUID id PK
        string phone
        string name
        string role
        string preferred_language
    }
    farmers {
        UUID id PK_FK
        string aadhaar_last4
        string district
        string state
    }
    officers {
        UUID id PK_FK
        string employee_id
        UUID centre_id FK
    }
    centres {
        UUID id PK
        string name
        string state
        string district
        int avg_processing_minutes
        int daily_capacity_farmers
        int active_counters_default
    }
    capacity_updates {
        UUID id PK
        UUID centre_id FK
        UUID officer_id FK
        string status
        decimal capacity_factor
        int active_counters
        timestamptz effective_from
    }
    queue_entries {
        UUID id PK
        UUID centre_id FK
        UUID farmer_id FK
        int token_number
        string status
        string crop
        decimal quantity_quintals
        int last_eta_minutes
    }
    qr_tokens {
        UUID id PK
        UUID queue_entry_id FK
        string token_payload_hash
        timestamptz expires_at
        bool is_used
    }
    processing_events {
        UUID id PK
        UUID queue_entry_id FK
        UUID officer_id FK
        string event_type
    }
    procurement_records {
        UUID id PK
        UUID queue_entry_id FK
        UUID farmer_id FK
        string crop
        decimal quantity_quintals
        decimal total_amount
    }
    payment_status {
        UUID id PK
        UUID procurement_record_id FK
        UUID farmer_id FK
        string status
        string utr_number
    }
    audit_logs {
        UUID id PK
        UUID actor_id
        string action
        string result
    }

    users ||--o| farmers : "extends (FARMER)"
    users ||--o| officers : "extends (OFFICER)"
    officers }o--|| centres : "manages"
    centres ||--o{ capacity_updates : "has"
    centres ||--o{ queue_entries : "has"
    users ||--o{ queue_entries : "farmer joins"
    queue_entries ||--o| qr_tokens : "has"
    queue_entries ||--o{ processing_events : "logs"
    queue_entries ||--o| procurement_records : "results in"
    procurement_records ||--o| payment_status : "has"
```

---

## Migration Strategy

- **Tool**: Alembic (integrates with SQLAlchemy).
- **MVP**: `alembic upgrade head` run once against the Supabase/PostgreSQL instance.
- **Seed**: a `seed.py` script inserts data from `22_MOCK_DATA.md`.
- **Production**: migrations are applied before each deployment as a pre-start step (Railway/Render startup command).
