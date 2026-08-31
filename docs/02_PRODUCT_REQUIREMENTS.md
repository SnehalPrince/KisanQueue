# 02 — Product Requirements (Detailed)

This document expands `01_PRD.md` functional requirements into concrete, testable behavior. It complements — not duplicates — `05_FEATURE_SPECIFICATION.md`, which specifies each feature's UI/backend/DB/API contract.

## 1. Requirement Traceability Convention
Every requirement ID in `01_PRD.md` maps to one or more entries in `05_FEATURE_SPECIFICATION.md`. Example: `FR-FARMER-002` → Feature `F-CENTRE-STATUS`.

## 2. Detailed Behavioral Requirements

### 2.1 Centre Status Visibility (FR-FARMER-002)
- Every centre shows: current operational status (Normal/Busy/Lifting delayed/Reduced capacity/Paused), current queue length, last-updated timestamp.
- If `last-updated` is older than a configurable staleness threshold (default 30 min), the UI **must** visibly flag the data as stale — never silently show old data as current.

### 2.2 Queue Join & Token (FR-FARMER-003)
- A farmer can only join one active queue entry per centre at a time.
- On join, farmer immediately receives: queue position, a signed token, and an initial ETA.

### 2.3 ETA Behavior (FR-FARMER-004, FR-OFFICER-006)
- ETA must recompute whenever: queue position changes, an officer changes operational status/capacity, or a configurable time interval elapses.
- ETA must always be shown with a qualitative confidence indicator (High/Medium/Low) — see `16_ETA_ENGINE.md`.
- ETA must never be presented as an exact promise (UI copy: "Estimated wait," never "You will be served at").

### 2.4 Officer Status Update (FR-OFFICER-005)
- Officer chooses one operational status from a fixed enum plus an optional capacity-reduction percentage.
- Update must be a single form/tap sequence completable in under 10 seconds — this is a hard UX constraint, not a suggestion, because real-world officer adoption depends on it.

### 2.5 Realtime Propagation (NFR-PERF-001)
- Officer status update → backend recalculates affected queue entries → pushes `ETA_UPDATED` / `CENTRE_STATUS_CHANGED` events over WebSocket → farmer UI updates without refresh.
- Fallback: if WebSocket unavailable, client polls every 15–30s.

### 2.6 Bilingual Behavior (NFR-I18N-001)
- Language toggle persists per session/account.
- All farmer- and officer-facing strings are pulled from a translation resource file, not hardcoded — enables adding more languages later without code changes.

### 2.7 WhatsApp Behavior (FR-FARMER-010)
- MVP: a simulated conversation UI within the app (mocked webhook), demonstrating the same command set intended for production (`17_WHATSAPP_INTEGRATION.md`).
- Production: real webhook via provider adapter — explicitly not claimed as live in the MVP demo.

## 3. Acceptance Criteria Style
Every feature in `05_FEATURE_SPECIFICATION.md` must include acceptance criteria in Given/When/Then form, e.g.:

```
Given a farmer is in queue position 5 at a Normal-status centre
When the officer marks "Lifting delayed — capacity reduced by 40%"
Then the farmer's ETA increases according to the ETA engine formula
And the farmer's app reflects the new ETA within ~2 seconds without manual refresh
```

## 4. Out-of-Scope Clarifications
- No requirement in this document implies a real integration with e-Uparjan/e-Kharid/Punjab systems. All such behavior is mocked per `21_INTEGRATION_STRATEGY.md` unless explicitly marked production-only.
- No requirement implies ML-based prediction. The ETA engine is deterministic (`16_ETA_ENGINE.md`).
