# 01 — Product Requirements Document (PRD)

## Product Vision
Make procurement-centre operational reality visible to farmers before they travel, through a persistent farmer assistant on WhatsApp and Web, without duplicating or replacing existing government procurement infrastructure.

## Problem Statement
PS 26032 (SIH 2026): farmers face long waits, unclear procurement schedules, and uncertainty about procurement status at MSP crop-procurement centres. Existing digitization (e-Uparjan, e-Kharid, Punjab e-pass) solved *registration and admission* but not *live operational visibility* — a farmer can hold a valid slot and still face an unpredictable wait because of backlog, lifting delay, or reduced capacity that the system never surfaces to them in advance. Furthermore, existing government portals force farmers through repetitive, cumbersome form-filling for every single visit.

## Core UX Principle: Progressive Onboarding, Not Repeated Registration
> **Collect identity & profile information once.** For every future procurement journey, recognise the farmer from their linked WhatsApp account / profile and ask **only** for information that is genuinely specific to that particular transaction (e.g. crop type, quantity, selected centre).

## Background
See `KisanQueue_Validation_Report.md` (source of truth). Summary of validated facts:
- MP e-Uparjan: registration, slot booking, tokens, SMS alerts, payment status. **[FACT]**
- Haryana e-Kharid: digital gate passes, QR-based entry, procurement workflow. **[FACT]**
- Punjab e-pass: digital passes, congestion/rush-point info, SMS access. **[FACT]**
- None of these expose a farmer-facing, real-time, capacity-aware wait estimate that reacts to officer-reported operational conditions or provides a persistent WhatsApp assistant that remembers the farmer. **[INFERENCE, per validation report]**

## Goals
1. **One-Time Onboarding**: Link WhatsApp number and store persistent profile (name, village, district, language, identity hint).
2. **Persistent WhatsApp Assistant**: Recognise returning farmers automatically; recommend nearby centres based on live congestion/ETA; ask only transaction-specific details.
3. **Capacity-Aware ETA**: Give farmers an honest, pre-travel view of centre status and expected wait before generating a pass.
4. **Digital Pass & QR Gate Check-In**: Issue a digital procurement pass with a cryptographically signed QR code for gate admission.
5. **Officer Capacity Control**: Let officers report real operating conditions in 2 taps, triggering live ETA recalculations.
6. **Interoperable Architecture**: Present a `GovernmentProcurementAdapter` that can plug into existing state systems without replacing them.

## Non-Goals
- Replacing government MSP registration databases, land records, or DBT payment systems.
- Requiring farmers to re-enter personal/identity documents on every procurement trip.
- Building AI/ML crop advisory, disease detection, IoT sensing, blockchain, marketplace, lending, or insurance.
- Building a full enterprise admin suite for MVP.

## Users
- **Farmer** (primary — uses WhatsApp as a persistent assistant or Mobile Web)
- **Procurement Officer** (secondary — uses Web Console for queue & capacity management)
- **Administrator** (tertiary — MVP-minimal)

## Use Cases
- **UC1: One-Time Farmer Onboarding**: Farmer links phone/WhatsApp number, provides basic profile (village, district, preferred language), creating a persistent identity.
- **UC2: Returning Farmer Procurement Request**: Returning farmer messages *"I want to sell wheat"*. System recognises farmer, presents nearby centres with live ETAs/status, asks only for quantity, and generates a digital pass (`KQ-xxxx`) upon confirmation.
- **UC3: Real-Time Queue & ETA Tracking**: Farmer tracks live queue position and ETA via WhatsApp or live web tracker.
- **UC4: Officer Capacity Update**: Officer flags lifting delay / reduced capacity / pause; ETA recalculates for all queued farmers in real-time.
- **UC5: Gate Check-in via QR**: Officer scans farmer's digital pass QR code at centre gate to check in.
- **UC6: Post-Procurement Status**: Farmer checks procurement weight, grade, and payment status.

## Functional Requirements

| ID | Requirement | Priority |
|---|---|---|
| FR-FARMER-001 | Farmer completes **one-time onboarding** (phone + OTP, name, village/district, preferred language) creating a persistent profile | P0 |
| FR-FARMER-002 | System automatically identifies returning farmers from their linked WhatsApp account / session | P0 |
| FR-FARMER-003 | System presents nearby centres with live operational status & capacity-aware ETAs based on farmer's registered location | P0 |
| FR-FARMER-004 | System asks **only transaction-specific questions** (crop, quantity quintals, centre choice) without re-asking identity data | P0 |
| FR-FARMER-005 | Farmer confirms transaction and receives a digital procurement pass with unique token (`KQ-xxxx`) and signed QR | P0 |
| FR-FARMER-006 | Farmer receives realtime ETA/status updates without manual refresh via WebSocket / WhatsApp notifications | P0 |
| FR-FARMER-007 | Farmer can view procurement status & payment status after delivery (mocked in MVP) | P0 |
| FR-FARMER-008 | Full bilingual support (Hindi & English) across Web and WhatsApp | P0 |
| FR-OFFICER-001 | Officer can securely log in to web console | P0 |
| FR-OFFICER-002 | Officer sees today's queue/arrivals and active counters | P0 |
| FR-OFFICER-003 | Officer can scan/validate farmer's digital pass QR code for check-in | P0 |
| FR-OFFICER-004 | Officer can mark processing started and completed for a queue entry | P0 |
| FR-OFFICER-005 | Officer can update capacity/status (Normal/Busy/Lifting delayed/Reduced capacity/Paused) in 1 tap | P0 |
| FR-OFFICER-006 | Capacity update triggers instant ETA recalculation and broadcast to affected farmers | P0 |
| FR-INTEGRATION-001 | System exposes a `GovernmentProcurementAdapter` interface with mock implementation | P1 |

## Non-Functional Requirements

| ID | Requirement | Priority |
|---|---|---|
| NFR-PERF-001 | Realtime ETA update reaches farmer client within ~2s of an officer status change | P0 |
| NFR-SEC-001 | Digital pass QR payloads must be HMAC-SHA256 signed, single-use, and day-scoped | P0 |
| NFR-SEC-002 | Role-based access control (FARMER, OFFICER, ADMIN) | P0 |
| NFR-SEC-003 | PII protection: Aadhaar last-4 only, phone numbers masked in logs, no financial credentials stored | P0 |
| NFR-UX-001 | Conversational WhatsApp flow must feel like a persistent assistant, never a rigid form questionnaire | P0 |
| NFR-UX-002 | Mobile-first UI usable on low-end Android smartphones and 2G/3G networks | P0 |
| NFR-I18N-001 | All farmer-facing copy available in Hindi and English | P0 |
| NFR-REL-001 | Graceful degradation: offline QR screenshot validity, fallback polling if WebSocket drops | P0 |

## Assumptions & Risks
- Farmer identity verification is done once at onboarding (simulated/mock for SIH MVP where government KYC APIs are inaccessible).
- Transaction eligibility and physical verification happen at the centre gate via QR scan.
- ETA is an honest operational estimate, not a contractually guaranteed arrival slot.
