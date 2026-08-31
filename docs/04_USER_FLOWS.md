# 04 — User Flows

## Flow 1 — Farmer: Should I Go Today? (Core Value Flow)

```mermaid
flowchart TD
    A[Open KisanQueue app / WhatsApp] --> B[Select or auto-detect nearest centre]
    B --> C{Centre status}
    C -->|Normal| D[Show short ETA, encourage visit]
    C -->|Busy / Delayed / Reduced / Paused| E[Show honest warning + adjusted ETA]
    D --> F[Farmer decides to join queue]
    E --> F
    F --> G[Farmer joins virtual queue]
    G --> H[Receive token + QR + initial ETA]
    H --> I[Realtime updates as position/capacity change]
    I --> J[Farmer travels when ETA is acceptable]
```

## Flow 2 — Farmer: Queue to Payment

```mermaid
flowchart TD
    A[Farmer arrives at centre] --> B[Officer scans QR / checks in]
    B --> C[Queue entry: waiting -> processing]
    C --> D[Officer marks processing completed]
    D --> E[Procurement status: recorded - mocked]
    E --> F[Payment status: pending/processed - mocked]
    F --> G[Farmer notified via app/WhatsApp]
```

## Flow 3 — Officer: Operational Status Update

```mermaid
flowchart TD
    A[Officer opens centre dashboard] --> B[Select operational status]
    B --> C{Status}
    C -->|Normal| D[No capacity change]
    C -->|Busy| E[Flag busy, no numeric change]
    C -->|Lifting delayed| F[Enter capacity reduction %]
    C -->|Reduced capacity| F
    C -->|Paused| G[Queue processing halted]
    F --> H[Backend recalculates ETA for all waiting entries]
    G --> H
    D --> H
    E --> H
    H --> I[CENTRE_STATUS_CHANGED + ETA_UPDATED events broadcast]
    I --> J[Farmer clients update in realtime]
```

## Flow 4 — Farmer via WhatsApp (MVP Simulated)

```mermaid
flowchart TD
    A["Farmer sends 'Hi'"] --> B[Bot shows numbered menu]
    B --> C{Selection}
    C -->|1 Check Queue| D[Return queue position + ETA]
    C -->|2 My Token| E[Return token/QR reference]
    C -->|3 Centre Status| F[Return operational status]
    C -->|4 ETA| G[Return current ETA + confidence]
    C -->|5 Procurement Status| H[Return mocked procurement status]
    C -->|6 Payment Status| I[Return mocked payment status]
```

## Flow 5 — Realtime Fallback (Graceful Degradation)

```mermaid
flowchart TD
    A[Farmer client connects] --> B{WebSocket available?}
    B -->|Yes| C[Subscribe to live events]
    B -->|No| D[Fall back to polling every 15-30s]
    C --> E{Connection drops mid-session?}
    E -->|Yes| D
    D --> F[Show 'last updated Xs ago' indicator]
```

## Flow Notes
- Every flow that displays data must show a last-updated indicator where the data is not instantaneously fresh (Principle: Honest Information, `08_DESIGN_SYSTEM.md`).
- Officer flow (Flow 3) is intentionally the shortest flow in the entire product — this is a deliberate UX priority, not an oversight.
