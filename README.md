<div align="center">

<img src="https://img.shields.io/badge/SIH%202026-PS%2026032-orange?style=for-the-badge" />
<img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" />
<img src="https://img.shields.io/badge/Stack-FastAPI%20%2B%20React-blue?style=for-the-badge" />
<img src="https://img.shields.io/badge/Status-Documentation%20Complete-brightgreen?style=for-the-badge" />

# 🌾 KisanQueue

### *Farmer-first visibility, queue & admission layer for government MSP procurement centres*

> **"e-Uparjan tells you *that* you have a slot — KisanQueue tells you *whether today is actually a good day to use it*."**

</div>

---

## 🎯 What is KisanQueue?

KisanQueue is a **real-time visibility and queue management layer** that sits *on top of* existing government procurement systems (MP e-Uparjan, Haryana e-Kharid, Punjab Anaaj Kharid). It does not replace them — it adds what they lack.

**The core problem it solves:**
A farmer may have a valid e-Uparjan slot and still arrive at the mandi to discover a 6-hour lifting delay, a paused centre, or a 30-farmer backlog — with no warning before they made the trip.

**KisanQueue answers one question honestly:**
> *"If I leave for the mandi now, what is likely to happen?"*

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 🟢 **Live Centre Status** | Officer-reported operational status — Normal, Busy, Lifting Delayed, Reduced Capacity, Paused |
| ⏱️ **Backlog-Aware ETA** | Deterministic formula: `ceil(N × T_base / (C × F))` — reacts in real-time to officer capacity updates |
| 📲 **Virtual Queue + Token** | Join queue from home, receive HMAC-signed QR token, track live position |
| ⚡ **Real-Time Updates** | WebSocket push — ETA updates on farmer's screen within ~2 seconds of officer action |
| 💬 **WhatsApp Accessible** | Check token, ETA, and procurement status via WhatsApp — no app required |
| 🌐 **Hindi / English** | Full bilingual UI — farmer-first, low-literacy design |
| 📋 **Officer Dashboard** | One-tap capacity controls, check-in scanner, processing queue management |
| 🏛️ **Government Integration Layer** | `GovernmentProcurementAdapter` interface — plugs into e-Uparjan / e-Kharid without replacing them |

---

## 🏗️ Architecture

```
[Farmer Mobile Web App]  [Officer Dashboard]  [WhatsApp Bot]
         │                      │                    │
         └──────────────────────┼────────────────────┘
                    REST + WebSocket (wss://)
                                │
              ┌─────────────────▼──────────────────┐
              │     FastAPI Modular Monolith        │
              │  Auth · Centres · Queue · ETA       │
              │  QR/Token · Notifications · Admin   │
              │  GovernmentProcurementAdapter       │
              └─────────────────┬──────────────────┘
                                │
                        PostgreSQL (Supabase)
```

**Tech Stack:**
- **Frontend**: React + Vite + TypeScript + Tailwind CSS + React Query + `react-i18next`
- **Backend**: Python 3.11 + FastAPI (async modular monolith)
- **Database**: PostgreSQL via Supabase
- **Realtime**: Native FastAPI WebSockets
- **Auth**: JWT (HS256) — Phone+OTP for farmers, username+password for officers
- **QR Security**: HMAC-SHA256 signed tokens, single-use, day-scoped expiry
- **Deployment**: Vercel (frontend) + Render/Railway (backend)

---

## 📐 The ETA Formula

The core technical innovation — a **deterministic, explainable, capacity-aware ETA model**:

```
ETA (minutes) = ceil( N × T_base / (C × F) )
```

| Variable | Meaning |
|---|---|
| `N` | Farmers waiting ahead in queue |
| `T_base` | Base processing time per farmer (minutes) |
| `C` | Active counters (officer-reported) |
| `F` | Capacity factor — 1.00 = normal, 0.60 = 40% reduction |

**Example — Lifting Delay:**
```
Normal:  N=14, T_base=25, C=2, F=1.00 → ETA = 175 min
Delayed: N=14, T_base=25, C=1, F=0.60 → ETA = 584 min  ← farmer sees this instantly
```

No ML. No black box. Fully explainable. See [`docs/16_ETA_ENGINE.md`](docs/16_ETA_ENGINE.md).

---

## 📁 Documentation

The complete implementation blueprint lives in [`/docs`](docs/). All 30 documents are written and implementation-ready.

| # | Document | Contents |
|---|---|---|
| 00 | [Project Overview](docs/00_PROJECT_OVERVIEW.md) | Summary, differentiation, one-line pitches |
| 01 | [PRD](docs/01_PRD.md) | Full Product Requirements Document |
| 02 | [Product Requirements](docs/02_PRODUCT_REQUIREMENTS.md) | Functional & non-functional requirements |
| 03 | [User Personas](docs/03_USER_PERSONAS.md) | Farmer, Officer, Admin personas |
| 04 | [User Flows](docs/04_USER_FLOWS.md) | End-to-end journey maps |
| 05 | [Feature Specification](docs/05_FEATURE_SPECIFICATION.md) | Every feature with acceptance criteria |
| 06 | [MVP Scope](docs/06_MVP_SCOPE.md) | P0/P1/P2 + 7-hour build plan |
| 07 | [UX/UI Design](docs/07_UX_UI_DESIGN.md) | Screen inventory, states, mobile-first spec |
| 08 | [Design System](docs/08_DESIGN_SYSTEM.md) | Typography, color, components, tokens |
| 09 | [Tech Stack](docs/09_TECH_STACK.md) | Stack decisions with rationale |
| 10 | [System Architecture](docs/10_SYSTEM_ARCHITECTURE.md) | MVP + production architecture diagrams |
| 11 | [Frontend Architecture](docs/11_FRONTEND_ARCHITECTURE.md) | Folder structure, routes, state, i18n |
| 12 | [Backend Architecture](docs/12_BACKEND_ARCHITECTURE.md) | FastAPI module breakdown, middleware |
| 13 | [Database Schema](docs/13_DATABASE_SCHEMA.md) | All tables, constraints, indexes, ER diagram |
| 14 | [API Specification](docs/14_API_SPECIFICATION.md) | Every REST + WebSocket endpoint |
| 15 | [Realtime Queue](docs/15_REALTIME_QUEUE.md) | Queue state machine, all WS events |
| 16 | [ETA Engine](docs/16_ETA_ENGINE.md) | Formula, examples, pseudocode, edge cases |
| 17 | [WhatsApp Integration](docs/17_WHATSAPP_INTEGRATION.md) | Conversation flow, adapter pattern |
| 18 | [QR Token System](docs/18_QR_TOKEN_SYSTEM.md) | HMAC signing, threat model, validation |
| 19 | [Auth & RBAC & Security](docs/19_AUTH_RBAC_SECURITY.md) | JWT, OTP, roles, PII, audit logs |
| 20 | [Notification System](docs/20_NOTIFICATION_SYSTEM.md) | Events, channels, adapter, deduplication |
| 21 | [Integration Strategy](docs/21_INTEGRATION_STRATEGY.md) | GovernmentProcurementAdapter + state adapters |
| 22 | [Mock Data](docs/22_MOCK_DATA.md) | Full seed dataset + 5 demo scenarios |
| 23 | [Error Handling](docs/23_ERROR_HANDLING.md) | Every error in EN + HI farmer language |
| 24 | [Testing Strategy](docs/24_TESTING_STRATEGY.md) | pytest + Vitest test code for all P0 paths |
| 25 | [Deployment](docs/25_DEPLOYMENT.md) | Vercel + Render + Supabase setup guide |
| 26 | [Environment Variables](docs/26_ENVIRONMENT_VARIABLES.md) | Every env var with `.env.example` |
| 27 | [Demo Script](docs/27_DEMO_SCRIPT.md) | 7-min SIH demo + judge Q&A recovery |
| 28 | [SIH Pitch Story](docs/28_SIH_PITCH_TECHNICAL_STORY.md) | Technical narrative for judges |
| 29 | [Roadmap](docs/29_ROADMAP.md) | 4-phase roadmap from MVP to multi-state |
| 30 | [Open Questions](docs/30_OPEN_QUESTIONS.md) | 18 unresolved questions with assumptions |

---

## 🚀 Quick Start (Local Development)

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt
cp .env.example .env           # Fill in your values
alembic upgrade head
python seed.py
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env.local     # Set VITE_API_BASE_URL=http://localhost:8000/v1
npm run dev                    # Starts on localhost:5173
```

> **Demo login**: Phone `+919876543210` · OTP `1234` → Farmer (Ramesh Kumar)
> **Officer login**: `officer_rajgarh` / `Demo@1234`

---

## 🎬 Demo Scenario

The key demo moment in 3 steps:

1. **Farmer joins queue** at Rajgarh Centre → gets Token #47, Position #14, ETA ~87 min
2. **Officer reports lifting delay** (FCI truck late) — sets capacity 60%, 1 counter
3. **Farmer's ETA jumps to ~209 min in real time** — without refreshing

That causal chain — officer action → ETA recalculates → farmer notified via WebSocket in ~2 sec — is the product's core value proposition, live.

Full script: [`docs/27_DEMO_SCRIPT.md`](docs/27_DEMO_SCRIPT.md)

---

## 🤝 Differentiation from Existing Systems

| System | What it does | What KisanQueue adds |
|---|---|---|
| MP e-Uparjan | Registration, slot booking, payment status | Live backlog visibility + ETA before travel |
| Haryana e-Kharid | Digital gate pass, QR entry | Real-time queue position + capacity-aware ETA |
| Punjab Anaaj Kharid | e-Pass, congestion SMS | Interactive farmer-queryable interface + WhatsApp |

KisanQueue is not a replacement. It is the operational visibility layer these systems are missing.

---

## 🏆 SIH 2026

- **Hackathon**: Smart India Hackathon 2026
- **Problem Statement**: PS 26032
- **Category**: Agriculture / Farmer Services

---

## 📄 License

MIT License — Copyright © 2026 **Snehal Prince**

See [LICENSE](LICENSE) for full text.

---

<div align="center">

Made with ❤️ for India's farmers · SIH 2026

</div>
