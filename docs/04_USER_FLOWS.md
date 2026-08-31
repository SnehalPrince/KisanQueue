# 04 — User Flows

## Flow 0 — Farmer: One-Time Onboarding (Profile & WhatsApp Link)

```mermaid
flowchart TD
    A[First-time Farmer visits Web or sends message to WhatsApp] --> B[Enter Phone Number & verify OTP]
    B --> C[Provide Basic Profile: Name, Village, District, Preferred Language]
    C --> D[Profile verified & linked to WhatsApp account]
    D --> E[Persistent Farmer Profile Stored in KisanQueue]
    E --> F[Farmer never asked for identity details again]
```

---

## Flow 1 — Returning Farmer: Conversational Procurement & Pass Generation

```mermaid
flowchart TD
    A["Returning Farmer messages: 'I want to sell wheat'"] --> B[KisanQueue identifies farmer from linked WhatsApp / Phone]
    B --> C[Retrieve Farmer's registered location: Village/District]
    C --> D[Fetch nearby procurement centres + Live Operational Status & ETAs]
    D --> E[Bot displays Centre options with live ETAs & delays]
    E --> F["Bot asks transaction-specific info: 'How much wheat are you bringing?'"]
    F --> G[Farmer provides quantity: e.g. '80 quintals']
    G --> H[Bot shows transaction summary & Centre requirements]
    H --> I[Farmer confirms: 'Yes' / One-tap button]
    I --> J["Generate Digital Procurement Pass (Token: KQ-1047) + signed QR code"]
    J --> K[Pass delivered in WhatsApp chat + added to live queue tracking]
```

---

## Flow 2 — Farmer & Officer: Gate Check-in to Procurement & Payment

```mermaid
flowchart TD
    A[Farmer arrives at centre with Digital Pass / QR code] --> B[Officer scans QR code or enters token KQ-1047]
    B --> C{Validation}
    C -->|Valid & not used| D[Status updated: WAITING ➔ CHECKED_IN]
    C -->|Invalid / Mismatch / Used| E[Display specific rejection reason]
    D --> F[Officer marks: PROCESSING at counter]
    F --> G[Weighing & Quality Grading completed]
    G --> H[Officer clicks: COMPLETE ➔ Procurement record logged]
    H --> I[Mocked Payment Status: PENDING / PROCESSED]
    I --> J[WhatsApp notification sent to farmer with delivery & payment receipt]
```

---

## Flow 3 — Officer: 2-Tap Capacity & Delay Update

```mermaid
flowchart TD
    A[Officer opens centre dashboard] --> B[Select operational condition]
    B --> C{Condition}
    C -->|Normal| D[Capacity factor = 1.00, 2 counters]
    C -->|Busy| E[Capacity factor = 0.80]
    C -->|Lifting delayed| F[Capacity factor = 0.60, adjust counters, add note]
    C -->|Paused| G[Mark PAUSED — stop queue admissions]
    D --> H[FastAPI Backend recalculates ETA for all waiting farmers]
    E --> H
    F --> H
    G --> H
    H --> I[Broadcast CENTRE_STATUS_CHANGED & ETA_UPDATED via WebSocket]
    I --> J[Farmer Web UI & WhatsApp notifications update in < 2 seconds]
```

---

## Flow 4 — WhatsApp Persistent Assistant Interactions

```mermaid
flowchart TD
    A[Farmer messages KisanQueue Assistant] --> B{Intent Detection}
    B -->|'Sell Crop'| C[Flow 1: Recommend centres ➔ ask quantity ➔ generate pass]
    B -->|'Check Token / Status'| D[Retrieve active pass, current queue position & ETA]
    B -->|'Centre Status'| E[List nearby mandis with live congestion badges & delay notes]
    B -->|'Payment Status'| F[Display latest procurement & DBT payment status]
```

---

## Flow 5 — Realtime Graceful Degradation

```mermaid
flowchart TD
    A[Farmer client connects] --> B{WebSocket available?}
    B -->|Yes| C[Subscribe to live centre & personal queue channel]
    B -->|No / Drops| D[Fall back to REST polling every 15-30 seconds]
    C --> E{Connection dropped?}
    E -->|Yes| D
    D --> F[Show clear 'Last updated Xm ago' indicator]
    D --> G{Network fully offline?}
    G -->|Yes| H[Display saved offline QR Pass & Token for gate admission]
```
