# 05 — Feature Specification

Each feature lists: ID, Name, User, Problem, Description, Preconditions, Main flow, Alternate flows, Error states, UI/Backend/DB/API requirements, Acceptance criteria, Priority, MVP/Post-MVP status.

---

## F-AUTH — Farmer & Officer Login

- **User**: Farmer, Officer
- **Problem**: Need a lightweight, trustworthy identity without full KYC.
- **Description**: Farmer logs in via phone number + OTP (mocked as a static/dev OTP for MVP). Officer/Admin log in via username + password (JWT session).
- **Preconditions**: none.
- **Main flow**: enter phone → receive OTP (simulated) → enter OTP → session created.
- **Alternate flows**: officer login uses password instead of OTP.
- **Error states**: invalid OTP, expired OTP, unregistered phone (auto-register for MVP simplicity).
- **UI**: single-field phone input → OTP input → redirect to home.
- **Backend**: `AuthService` issues JWT with role claim (`FARMER`/`OFFICER`/`ADMIN`).
- **DB**: `users` table.
- **API**: `POST /auth/otp/request`, `POST /auth/otp/verify`, `POST /auth/login` (officer/admin).
- **Acceptance criteria**: Given a valid phone number, when OTP is verified, then a JWT is issued and the farmer lands on the centre-discovery screen.
- **Priority**: P0 — MVP.

---

## F-CENTRE-STATUS — Centre Discovery & Live Status

- **User**: Farmer
- **Problem**: Farmer cannot see operational reality of a centre before traveling.
- **Description**: List/map of centres near the farmer showing operational status, queue length, and last-updated time.
- **Preconditions**: Farmer authenticated (or guest-view for MVP demo speed, TBD — see `30_OPEN_QUESTIONS.md`).
- **Main flow**: farmer opens app → sees list of centres sorted by distance → taps a centre → sees status detail.
- **Alternate flows**: no centres nearby → show statewide list.
- **Error states**: stale data (>30 min) flagged; centre data unavailable → explicit "status unknown" state, never a fabricated default.
- **UI**: centre card with status badge (color-coded), queue length, "last updated Xm ago".
- **Backend**: `CentreService.getStatus(centreId)`.
- **DB**: `centres`, `capacity_updates`.
- **API**: `GET /centres`, `GET /centres/{id}/status`.
- **Acceptance criteria**: Given a centre whose last capacity update was >30 minutes ago, when the farmer views it, then the UI shows a "data may be outdated" indicator.
- **Priority**: P0 — MVP.

---

## F-QUEUE-JOIN — Join Virtual Queue & Receive Token

- **User**: Farmer
- **Description**: Farmer joins the queue for a chosen centre/slot and receives a queue token with an initial ETA.
- **Preconditions**: centre not Paused; farmer has no other active queue entry at that centre.
- **Main flow**: farmer selects centre → taps "Join Queue" → system creates `queue_entries` row + `qr_tokens` row → returns position + ETA.
- **Alternate flows**: centre Paused → block join, show reason and suggested wait.
- **Error states**: duplicate join attempt blocked; centre at declared daily capacity → wait-list state.
- **UI**: confirmation screen with token, QR, queue position, ETA + confidence indicator.
- **Backend**: `QueueService.join()`, `ETAService.compute()`, `QRService.issue()`.
- **DB**: `queue_entries`, `qr_tokens`.
- **API**: `POST /queue/join`.
- **Acceptance criteria**: Given a Normal-status centre, when a farmer joins, then a unique signed token and an ETA with confidence level are returned within the same response.
- **Priority**: P0 — MVP.

---

## F-QUEUE-LIVE — Live Queue Position & ETA Tracking

- **User**: Farmer
- **Description**: Farmer sees live position-in-queue and ETA, updated via WebSocket.
- **Main flow**: farmer opens "My Queue" screen → subscribes to `queue:{centreId}` channel → receives `QUEUE_POSITION_CHANGED`/`ETA_UPDATED` events.
- **Alternate flows**: WebSocket unavailable → poll `GET /queue/my-status` every 15–30s.
- **Error states**: connection lost → show "reconnecting" + last known state with timestamp.
- **UI**: position number, ETA with confidence badge, status banner if centre condition changed.
- **Backend**: WebSocket gateway + `ETAService`.
- **DB**: `queue_entries`.
- **API**: `GET /queue/my-status`, WS channel `queue:{centreId}`.
- **Acceptance criteria**: Given an officer changes centre capacity, when the backend recalculates, then all subscribed farmer clients reflect the new ETA within ~2 seconds.
- **Priority**: P0 — MVP.

---

## F-OFFICER-DASHBOARD — Officer Queue & Capacity Console

- **User**: Officer
- **Description**: Single-screen dashboard: today's queue, check-in action, processing controls, and a one-tap operational-status selector.
- **Main flow**: officer logs in → sees active queue list → scans/enters token to check in → marks processing started/completed → updates operational status when conditions change.
- **Alternate flows**: manual token entry if QR scan unavailable.
- **Error states**: invalid/expired/already-used token on check-in → explicit rejection reason.
- **UI**: queue table + big, obvious status selector (Normal/Busy/Lifting delayed/Reduced capacity/Paused) with optional % field.
- **Backend**: `QueueService`, `CapacityService`.
- **DB**: `queue_entries`, `capacity_updates`, `processing_events`.
- **API**: `POST /officer/checkin`, `POST /officer/queue/{id}/start`, `POST /officer/queue/{id}/complete`, `POST /officer/capacity`.
- **Acceptance criteria**: Given an officer submits a capacity update, when the request completes, then a `capacity_updates` row is written and ETA recalculation is triggered for every active queue entry at that centre.
- **Priority**: P0 — MVP.

---

## F-QR-TOKEN — QR/Token Issuance & Validation

- See `18_QR_TOKEN_SYSTEM.md` for full design. MVP: signed JSON payload (HMAC) encoded as QR; production: short-lived signed tokens with replay protection.
- **Priority**: P0 — MVP (mock-secure), production hardening P1.

---

## F-PROCUREMENT-STATUS / F-PAYMENT-STATUS — Mocked Post-Delivery Status

- **User**: Farmer
- **Description**: After check-in/completion, farmer can view a mocked procurement record (quantity, crop, grade) and a mocked payment status (Pending/Processed).
- **Error states**: status not yet available → explicit "not yet updated by centre" message, not a fake default.
- **API**: `GET /procurement/{queueEntryId}`, `GET /payment/{queueEntryId}`.
- **Priority**: Procurement status P0 — MVP; Payment status P1 — MVP (may be stretch).

---

## F-I18N — Hindi/English Toggle

- **User**: Farmer, Officer
- **Description**: All farmer/officer-facing strings resolved from a translation resource keyed by locale (`en`, `hi`).
- **Acceptance criteria**: Given the farmer switches to Hindi, when any screen renders, then no English string leaks into farmer-facing UI text (data values like centre names may remain as-entered).
- **Priority**: P0 — MVP.

---

## F-WHATSAPP-SIM — WhatsApp Interaction (Simulated)

- See `17_WHATSAPP_INTEGRATION.md`. MVP renders the WhatsApp conversation inside the app UI via a mock adapter — explicitly not a live WhatsApp Business API integration during the demo.
- **Priority**: P0 — MVP (as simulator), production integration P2/roadmap.

---

## F-ADMIN-BASIC — Centre & Officer Management

- **User**: Admin
- **Description**: CRUD for centres and officer accounts.
- **Priority**: P1 — Post-MVP (stub UI acceptable if time allows in MVP).

---

## F-GOV-ADAPTER — Government Procurement Adapter (Mock)

- See `21_INTEGRATION_STRATEGY.md`. Interface with a `MockGovernmentProcurementAdapter` implementation returning simulated procurement/payment data.
- **Priority**: P1 — MVP demonstrates the interface pattern, not a real integration.
