# 01 — Product Requirements Document (PRD)

## Product Vision
Make procurement-centre operational reality visible to farmers before they travel, without duplicating or replacing existing government procurement infrastructure.

## Problem Statement
PS 26032 (SIH 2026): farmers face long waits, unclear procurement schedules, and uncertainty about procurement status at MSP crop-procurement centres. Existing digitization (e-Uparjan, e-Kharid, Punjab e-pass) solved *registration and admission* but not *live operational visibility* — a farmer can hold a valid slot and still face an unpredictable wait because of backlog, lifting delay, or reduced capacity that the system never surfaces to them in advance.

## Background
See `KisanQueue_Validation_Report.md` (source of truth). Summary of validated facts:
- MP e-Uparjan: registration, slot booking, tokens, SMS alerts, payment status. **[FACT]**
- Haryana e-Kharid: digital gate passes, QR-based entry, procurement workflow. **[FACT]**
- Punjab e-pass: digital passes, congestion/rush-point info, SMS access. **[FACT]**
- None of these expose a farmer-facing, real-time, capacity-aware wait estimate that reacts to officer-reported operational conditions. **[INFERENCE, per validation report]**

## Goals
1. Give farmers an honest, pre-travel view of centre status and expected wait.
2. Let officers report real operating conditions in seconds, not paperwork.
3. Demonstrate that ETA can react live to those conditions in front of judges.
4. Present an architecture that could realistically plug into existing state systems.

## Non-Goals
- Replacing registration, MSP eligibility checks, or DBT payment systems.
- Building AI/ML crop advisory, disease detection, IoT sensing, blockchain, marketplace, lending, insurance, or payment gateway features.
- Building a full government-grade admin/analytics suite for MVP.

## Users
- **Farmer** (primary)
- **Procurement Officer** (secondary, data source for ETA engine)
- **Administrator** (tertiary, MVP-minimal)

## Use Cases
- UC1: Farmer checks whether a centre is worth visiting today.
- UC2: Farmer joins a virtual queue and receives a token/QR.
- UC3: Farmer tracks live queue position and ETA.
- UC4: Officer flags lifting delay / reduced capacity / pause, and ETA recalculates for all queued farmers.
- UC5: Farmer checks procurement and payment status after delivery.
- UC6: Farmer interacts entirely via WhatsApp without opening the app.

## Functional Requirements

| ID | Requirement | Priority |
|---|---|---|
| FR-FARMER-001 | Farmer can register/login (phone + OTP, mocked for MVP) | P0 |
| FR-FARMER-002 | Farmer can browse centres and see live operational status | P0 |
| FR-FARMER-003 | Farmer can view/select a slot and receive a queue token | P0 |
| FR-FARMER-004 | Farmer can view live queue position and ETA | P0 |
| FR-FARMER-005 | Farmer receives realtime ETA/status updates without manual refresh | P0 |
| FR-FARMER-006 | Farmer can view a QR representation of their token | P0 |
| FR-FARMER-007 | Farmer can view procurement status (mocked) | P0 |
| FR-FARMER-008 | Farmer can view payment status (mocked) | P1 |
| FR-FARMER-009 | Farmer can toggle Hindi/English | P0 |
| FR-FARMER-010 | Farmer can query status via simulated WhatsApp flow | P0 |
| FR-OFFICER-001 | Officer can securely log in | P0 |
| FR-OFFICER-002 | Officer sees today's queue/arrivals for their centre | P0 |
| FR-OFFICER-003 | Officer can check in a farmer via QR/token | P0 |
| FR-OFFICER-004 | Officer can mark processing started/completed for a queue entry | P0 |
| FR-OFFICER-005 | Officer can update capacity/operational status (Normal/Busy/Lifting delayed/Reduced capacity/Paused) | P0 |
| FR-OFFICER-006 | Officer capacity update triggers ETA recalculation for all affected farmers | P0 |
| FR-ADMIN-001 | Admin can create/edit centres | P1 |
| FR-ADMIN-002 | Admin can create/edit officer accounts | P1 |
| FR-ADMIN-003 | Admin can view basic analytics (queue length, avg wait) | P2 |
| FR-INTEGRATION-001 | System exposes a `GovernmentProcurementAdapter` interface with a mock implementation | P1 |

## Non-Functional Requirements

| ID | Requirement | Priority |
|---|---|---|
| NFR-PERF-001 | Realtime ETA update should reach the farmer client within ~2s of an officer update (WebSocket push) | P0 |
| NFR-SEC-001 | QR/token payloads must be signed and non-guessable | P0 |
| NFR-SEC-002 | Role-based access control for Farmer/Officer/Admin | P0 |
| NFR-SEC-003 | PII (phone numbers, Aadhaar-adjacent identifiers) minimized and never logged in plaintext | P0 |
| NFR-UX-001 | Core farmer flows usable one-handed on a low-end Android device | P0 |
| NFR-UX-002 | All screens degrade gracefully with no network / stale data, with visible "last updated" timestamps | P0 |
| NFR-I18N-001 | All farmer-facing strings available in Hindi and English | P0 |
| NFR-REL-001 | If realtime channel drops, farmer view falls back to periodic polling | P1 |
| NFR-SCALE-001 | Architecture must not require redesign to add more Indian languages or more states | P1 |

## Success Metrics (demo-context, not production KPIs)
- Judges can see officer capacity change propagate to farmer ETA live, within the demo.
- Farmer flow (centre check → queue join → QR → ETA) completable in under 60 seconds in the demo.
- Zero fabricated integration claims during Q&A.

## Assumptions
- No real government API access is available; all such integrations are mocked (`21_INTEGRATION_STRATEGY.md`).
- A single hackathon team (assume 3–5 members) has ~7 hours for the MVP build.
- Officers are willing/able to make a 2-tap status update; this is the core data-honesty mechanism of the product.

## Dependencies
- PostgreSQL instance (e.g., Supabase free tier) for MVP.
- A deployed backend capable of WebSocket connections (Render/Railway; see `25_DEPLOYMENT.md`).
- Twilio/WhatsApp Cloud API credentials only required for the *production* WhatsApp path — not required for MVP mock.

## Risks
- ETA formula could be perceived as "just a guess" — mitigated by presenting it as an *estimate with a confidence indicator*, never a guarantee.
- Judges conflate KisanQueue with existing systems — mitigated by explicit differentiation messaging throughout demo/pitch docs.
- Officer adoption risk in the real world (extra data-entry burden) — flagged as an open question (`30_OPEN_QUESTIONS.md`), mitigated by keeping the officer update to one tap.

## MVP Definition
See `06_MVP_SCOPE.md` for the authoritative P0/P1/P2/NOT-BUILD breakdown and 7-hour build plan.

## Future Roadmap
See `29_ROADMAP.md`.
