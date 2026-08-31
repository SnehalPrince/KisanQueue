# 28 — SIH Pitch: Technical Story

## Problem Statement Context (PS 26032)

**PS 26032** (Smart India Hackathon 2026): *"Farmers often face long waiting times, lack of information regarding procurement schedules, and uncertainty about procurement status at government MSP procurement centres."*

This problem statement has three distinct components:
1. **Long waiting times** — caused by backlogs, lifting delays, and reduced capacity that the farmer cannot anticipate.
2. **Lack of information regarding procurement schedules** — farmer cannot see actual centre operational status before traveling.
3. **Uncertainty about procurement status** — after completion, payment and procurement records are not always easily accessible.

KisanQueue addresses all three, in order of priority.

---

## What Already Exists (Honest Acknowledgement)

| System | State | What It Provides |
|---|---|---|
| MP e-Uparjan | Madhya Pradesh | Registration, slot booking, tokens, SMS notifications, payment status |
| Haryana e-Kharid | Haryana | Digital gate passes, QR-based entry, procurement workflow |
| Punjab Anaaj Kharid | Punjab | e-Passes, QR entry, congestion info via SMS |
| e-NAM | National | Online commodity trading at APMC mandis (different from MSP procurement) |

**The honest narrative**: These systems digitized the transactional layer of procurement — registration, entry authorization, record-keeping. That is real progress. The problem statement still exists because **operational visibility** was not the design goal of these systems. They tell a farmer they have a slot. They don't tell the farmer what is actually happening at the centre on the day they're scheduled to arrive.

---

## The Remaining Gap

A farmer who has:
- ✅ Registered on e-Uparjan
- ✅ Received their slot
- ✅ Arrived at the correct centre
- ✅ Token in hand

...can still face:
- ❌ A lifting delay (FCI trucks not arrived) causing 4–6 hour unexpected waits.
- ❌ A paused centre (no communication before travel).
- ❌ 30+ farmer backlog not visible until physically present.
- ❌ Processing slowdown with no updated ETA.
- ❌ No WhatsApp/offline-friendly way to check status during travel.

**This is the gap KisanQueue fills.**

---

## KisanQueue's Contribution

### 1. Operational Visibility (Novel in context)
A live, officer-updated status feed that shows:
- Operational status (Normal / Busy / Lifting Delayed / Reduced Capacity / Paused)
- Queue length
- Active counters
- Last updated timestamp with freshness indicator

No existing state procurement portal exposes this to the farmer in real time before travel. **INFERENCE based on publicly available system descriptions; may vary by state — not independently verified through direct system access.**

### 2. Backlog-Aware ETA (Core Technical Innovation)
A deterministic formula that factors in:
- Queue position (N)
- Base processing time (T_base)
- Active counters (C)
- Capacity factor from officer report (F)

Formula: `ETA = ceil(N × T_base / (C × F))`

When officer reports a lifting delay (F drops, C drops), ETA recalculates and propagates to all waiting farmers via WebSocket in ~2 seconds. This causal chain — officer action → ETA change → farmer notification — is demonstrably real-time and testable.

**This is not ML. It is an explainable, deterministic model that reacts correctly to real operational conditions.**

### 3. WhatsApp-First Accessibility
A provider-agnostic notification/query adapter that:
- Accepts inbound WhatsApp messages and returns queue status, ETA, and procurement data.
- Sends proactive notifications on significant events (delay, completion, approaching).
- Works with the same backend logic as the web app — no separate data path.

This extends access to farmers who do not have or use a web app — the lowest-digital-literacy segment.

### 4. Government Integration Architecture
A `GovernmentProcurementAdapter` interface that:
- Decouples core queue logic from any specific government system.
- Allows state-specific adapters (e-Uparjan, e-Kharid, Punjab) to be plugged in as data-sharing agreements are established.
- Means KisanQueue never needs to ask government to rebuild anything — only to share data.

---

## Architecture Highlights for Judges

### Modular Monolith (not microservices)
A single FastAPI process with clearly separated modules. Explainable, deployable in 7 hours, extensible to production. The modules (Queue, ETA, Notification, Integration) are independently testable and can be extracted into services when genuine scale demands it.

### WebSocket Real-Time
Native FastAPI WebSocket routes. Farmer and officer clients subscribe to a centre channel. When the officer submits a capacity update, the ETA engine runs synchronously and broadcasts the result to all subscribed clients before the HTTP response returns. Latency target: < 2 seconds end-to-end.

### PostgreSQL + SQLAlchemy (Async)
Relational model enforces integrity constraints that matter for a queue system: unique tokens per day, single active entry per farmer per centre, HMAC hash stored for each QR token. Not a NoSQL store — the domain is inherently relational.

### Adapter Pattern Throughout
- `GovernmentProcurementAdapter`: mock in MVP, real in production.
- `NotificationAdapter`: mock in MVP, WhatsApp/SMS in production.
These are not theoretical — they are wired in the codebase with the ABC defined and the mock adapter fully functional.

---

## Feasibility

| Dimension | Evidence |
|---|---|
| Technical | Deterministic ETA formula, WebSocket realtime, JWT RBAC, HMAC-signed QR — all use established patterns with mature Python/JS libraries. No unproven technology. |
| Build time | 7-hour plan in `06_MVP_SCOPE.md`. The formula is 3 lines of Python. The WebSocket gateway is a standard FastAPI pattern. The demo-critical path (join queue → ETA → officer update → ETA changes) is < 300 lines of backend code. |
| Deployment | Vercel (frontend) + Render (backend) + Supabase (DB) — all free tiers, deploy from git push, WebSocket-capable. |
| Scalability | MVP: single dyno. Scale path: Redis pub/sub for WebSocket fan-out across multiple backend instances. Documented in `29_ROADMAP.md`. |

---

## Scalability

| Level | Users | Architecture |
|---|---|---|
| MVP | < 100 concurrent (demo) | Single Render dyno, Supabase free tier |
| Pilot (1 state, 50 centres) | ~5,000 daily active farmers | Single Render standard dyno, Supabase pro |
| State-level (1 state, 500+ centres) | ~50,000 daily active | Multiple dynos + Redis pub/sub for WS fan-out, PostgreSQL read replica |
| Multi-state | 500,000+ daily | Kubernetes / Cloud Run, managed PostgreSQL clusters, CDN for static assets |

Scalability is a configuration and infrastructure change — not a rewrite. The modular monolith can be split into services at the Queue and ETA boundaries when needed.

---

## Security (Pitch-Ready Summary)

| Concern | Implementation |
|---|---|
| Authentication | JWT (HS256), phone+OTP for farmers, username+password for officers |
| Authorization | Role-based (FARMER/OFFICER/ADMIN) enforced at route level via FastAPI Depends() |
| QR integrity | HMAC-SHA256 signed payload, single-use, expiry, centre-mismatch detection |
| PII | Only last-4 Aadhaar digits stored; no bank account data; masked phone in logs |
| Audit trail | Append-only `audit_logs` table for security-sensitive actions |
| Transport | HTTPS/WSS in production; CORS locked to specific origin |

---

## Government Integration Narrative

> "We are not asking government to replace e-Uparjan. We are asking permission to read the data it already generates and show it to the farmer in a useful way. Our GovernmentProcurementAdapter is a pluggable interface. Today it returns mock data. Tomorrow, when a state government signs a data-sharing MoU, it returns real data — without changing a single line of core queue logic. This is how new digital layers are supposed to work on top of existing government infrastructure."

---

## Impact Potential

**INFERENCE — not from primary source data. Presented as potential, not measured outcome.**

- India procures approximately 300–400 lakh tonnes of wheat annually at MSP. **[Source: FCI Annual Reports — INFERENCE from publicly known figures; exact SY 2026 figure not verified]**.
- If even 10% of farmers make unnecessary trips due to unannounced delays or congestion, the collective wasted travel time, transport cost, and productivity loss is significant.
- KisanQueue, deployed at scale, could reduce unnecessary mandi trips, improve centre throughput by reducing morning rush congestion, and reduce farmer stress — all without modifying the underlying procurement infrastructure.

---

## One-Paragraph Judge-Ready Summary

> KisanQueue is a visibility and queue management layer for government crop procurement centres. It does not replace existing systems like e-Uparjan or e-Kharid — it adds what they lack: live operational status, a backlog-aware ETA that reacts to lifting delays and capacity changes in real time, and a WhatsApp-accessible interface for farmers who cannot or do not want to navigate a web app. The ETA engine is deterministic and explainable. The architecture is a modular monolith built for a 7-hour build and extensible to production. Government integration is a pluggable adapter — today a mock, tomorrow a real connection to any state system that is willing to share data. The goal is simple: before Ramesh Kumar leaves home with 40 quintals of wheat, he should know whether today is actually a good day to go.
