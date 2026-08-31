<div align="center">

<img src="https://img.shields.io/badge/SIH%202026-PS%2026032-orange?style=for-the-badge" />
<img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" />
<img src="https://img.shields.io/badge/Stack-FastAPI%20%2B%20React%20%2B%20Motion-blue?style=for-the-badge" />
<img src="https://img.shields.io/badge/Craft-ReactBits%20%2B%20SkiperUI-purple?style=for-the-badge" />
<img src="https://img.shields.io/badge/Status-Blueprint%20Complete-brightgreen?style=for-the-badge" />

# 🌾 KisanQueue

### *Farmer-first visibility, queue & admission layer for government MSP procurement centres*

> **"e-Uparjan tells you *that* you have a slot — KisanQueue tells you *whether today is actually a good day to use it*."**

</div>

---

## 🎯 What is KisanQueue?

KisanQueue is a **real-time operational visibility and admission layer** that sits *on top of* existing government procurement systems (MP e-Uparjan, Haryana e-Kharid, Punjab Anaaj Kharid). It does not replace them — it adds the live operational intelligence they currently lack.

### The Core Problem
A farmer holds a valid government slot, drives 40 km to the mandi, and discovers a **6-hour lifting delay (FCI trucks late)**, a 30-farmer backlog, or a paused centre with zero warning before they made the trip.

### The KisanQueue Solution: Progressive Onboarding & Persistent Assistant
1. **Zero Form Fatigue**: The farmer's identity and village profile are verified **once** during onboarding.
2. **Persistent WhatsApp Assistant**: Returning farmers simply message *"I want to sell wheat"*. The assistant recognizes them by phone, recommends nearby mandis with live congestion/ETAs, asks only for quantity (*quintals*), and generates an instant pass (`KQ-1047`) with a signed QR code.
3. **Backlog-Aware Deterministic ETA**: Reacts in real time when mandi officers report delays or capacity changes.
4. **Offline-Resilient QR Pass**: HMAC-SHA256 signed gate pass that can be screenshotted and scanned at the gate even without mobile network.

---

## 🎨 Official Brand Color Palette

| Swatch | Color Name | HEX Code | Role in KisanQueue |
|---|---|---|---|
| 🌰 | **Almond** | `#D6BD98` | Warm wheat accent, highlight borders, pass badges, active button accents |
| 🍵 | **Matcha Brew** | `#677D6A` | Organic sage green, secondary buttons, status badges, subtle borders & icons |
| 🌲 | **Forest Roast** | `#40534C` | Deep earthy slate green, card headers, secondary surfaces, active tabs, Bklit chart lines |
| 🌑 | **Eclipse** | `#1A3636` | Rich obsidian forest, brand primary anchor, navbar, hero headers, dark mode canvas |

---

## ✨ Key Features & Modern UI Craft

| Feature | Description | UI Library & Craft |
|---|---|---|
| 🤖 **Persistent WhatsApp Assistant** | Identifies returning farmers by phone — never asks for identity details twice | Motion Springs + Krishi Mitra Avatar |
| 🎟️ **1-Tap Digital Pass (`KQ-1047`)** | Instant pass generation: crop + quantity ➔ signed QR gate pass + arrival window | Skiper UI Floating Modal + DecryptedText |
| ⏱️ **Backlog-Aware ETA** | Deterministic formula: `ceil(N × T_base / (C × F))` — reacts live to officer updates | Explainable Math + NumberPopIn |
| 📊 **Mandi Throughput Analytics** | Real-time graphs of hourly grain intake and truck lifting capacity | Bklit UI Analytics Charts |
| 📟 **ASCII Live Queue Matrix** | Terminal-grade live queue ticker and grain flow shaders | `ascii-magic` / `asciinator` |
| ✨ **Ambient Visual Craft** | Grain background overlay, spotlight card glow, and magnetic buttons | React Bits (`reactbits.dev`) |
| 🟢 **Live Centre Status** | Officer-reported operational status: Normal, Busy, Lifting Delayed, Reduced, Paused | Tri-Factor Badging (Icon+Text+Color) |
| ⚡ **Sub-2s Real-Time Sync** | WebSocket event fan-out updates farmer's screen within ~2 seconds of officer action | Native FastAPI WebSockets |
| 🌐 **Bilingual Typography** | English: `Urbanist` + `Rustic Roadway`<br>Hindi: `AMS Shikha` / `Manoja` + `Noto Sans Devanagari` | Curated Multi-Font Stack |

---

## 🏗️ System Architecture

```
[Farmer WhatsApp Assistant]   [Farmer Mobile Web App]   [Officer Mandi Console]
           │                            │                         │
           └────────────────────────────┼─────────────────────────┘
                               REST + WebSocket (wss://)
                                        │
                      ┌─────────────────▼──────────────────┐
                      │     FastAPI Modular Monolith        │
                      │  Auth · Farmer · Assistant · ETA    │
                      │  Queue (KQ-xxxx) · QR · Audit       │
                      │  GovernmentProcurementAdapter       │
                      └─────────────────┬──────────────────┘
                                        │
                                PostgreSQL (Supabase)
```

### Architecture Highlights
* **Modular Monolith**: Single deployable FastAPI process with clean module boundaries (`auth`, `farmer`, `assistant`, `queue`, `eta`, `officer`, `qr`, `integration`).
* **In-Process ETA Engine**: Recalculates waiting queues in < 10ms upon capacity state transitions.
* **Resilience & Circuit Breaker**: Downstream government adapter calls are isolated with timeouts (2.5s) to guarantee zero mandi check-in stalls.

---

## 📐 The Deterministic ETA Formula

The core technical centerpiece is a **deterministic, explainable, capacity-aware mathematical model**:

```
ETA (minutes) = ceil( N × T_base / (C × F) )
```

| Variable | Definition | Source |
|---|---|---|
| `N` | Farmers waiting ahead in queue | Live `queue_entries` count |
| `T_base` | Baseline processing time per farmer (minutes) | Mandi historical average (e.g. 25 min) |
| `C` | Active operational counters | Officer-reported live counter count |
| `F` | Capacity factor | Officer condition (`1.00` = normal, `0.60` = 40% reduction) |

### Live Scenario — FCI Truck Lifting Delay:
```
Normal State:  N = 14, T_base = 25, C = 2, F = 1.00 ➔ ETA = 175 min (~2h 55m, High confidence)
Delayed State: N = 14, T_base = 25, C = 1, F = 0.60 ➔ ETA = 584 min (~9h 44m, Low confidence)
```
*The farmer receives this updated ETA and a delay warning on their phone in ~2 seconds without refreshing.*

---

## 🛠️ Tech Stack & Engineering Standards

### Frontend
- **Framework**: React 18+ with TypeScript & Vite (lightning-fast HMR, lightweight bundle)
- **Component Primitives**: **Skiper UI** + **React Bits (`reactbits.dev`)** + Radix UI Primitives
- **Animation & Physics**: **Motion (`motion/react`)** + `transitions.dev` Motion Tokens
- **Analytics & Graphs**: **Bklit UI** (hourly throughput, capacity factors)
- **ASCII Effects**: **ascii-magic / asciinator** (live queue matrix ticker)
- **Typography**: English (`Urbanist` + `Rustic Roadway`) & Hindi (`AMS Shikha` / `Manoja` + `Noto Sans Devanagari`)
- **State Management**: TanStack Query v5 (server cache & auto-revalidation) + Zustand (`persist`)
- **Micro-Interactions**: Sonner (`ask-sonner` toast notifications), Lucide Icons, NumberPopIn
- **Localization**: `react-i18next` with complete English & Hindi dictionaries

### Backend
- **Framework**: Python 3.11+ + FastAPI (Async, modular monolith, auto-generated OpenAPI 3.1)
- **Database & ORM**: PostgreSQL via SQLAlchemy 2.0 (Async) + `asyncpg` connection pooling
- **Security & Tokens**: `python-jose` (JWT), `passlib[bcrypt]`, constant-time HMAC-SHA256 QR signing
- **Realtime**: Native FastAPI WebSockets with async `ConnectionManager`
- **Observability**: `structlog` structured JSON logging with `X-Request-ID` correlation middleware

---

## 📁 Complete Documentation Package

The complete implementation blueprint lives in [`/docs`](docs/). All 30 files are written and implementation-ready:

| # | Document | Contents |
|---|---|---|
| 00 | [Project Overview](docs/00_PROJECT_OVERVIEW.md) | Problem statement, differentiation, core pitch |
| 01 | [PRD](docs/01_PRD.md) | Product Requirements Document & Progressive Onboarding |
| 02 | [Product Requirements](docs/02_PRODUCT_REQUIREMENTS.md) | Functional & non-functional requirements |
| 03 | [User Personas](docs/03_USER_PERSONAS.md) | Farmer Ramesh, Officer Suresh, Admin Patel |
| 04 | [User Flows](docs/04_USER_FLOWS.md) | One-time onboarding, conversational pass gen, check-in |
| 05 | [Feature Specification](docs/05_FEATURE_SPECIFICATION.md) | Every feature with acceptance criteria & error states |
| 06 | [MVP Scope](docs/06_MVP_SCOPE.md) | P0/P1/P2 breakdown & 7-hour build plan |
| 07 | [UX/UI Design](docs/07_UX_UI_DESIGN.md) | Skiper UI, React Bits, Motion, Bklit UI, ASCII Magic |
| 08 | [Design System & Motion](docs/08_DESIGN_SYSTEM.md) | Almond/Matcha/Forest/Eclipse palette, Typography, Tokens |
| 09 | [Tech Stack & Tooling](docs/09_TECH_STACK.md) | Package manifests, architectural rationale |
| 10 | [System Architecture](docs/10_SYSTEM_ARCHITECTURE.md) | MVP + production architecture diagrams |
| 11 | [Frontend Architecture](docs/11_FRONTEND_ARCHITECTURE.md) | React Bits, Motion springs, Bklit charts, Zustand |
| 12 | [Backend Architecture](docs/12_BACKEND_ARCHITECTURE.md) | FastAPI module breakdown, async patterns, logging |
| 13 | [Database Schema](docs/13_DATABASE_SCHEMA.md) | All tables, constraints, indexes, ER diagram |
| 14 | [API Specification](docs/14_API_SPECIFICATION.md) | REST endpoints + WebSocket event schemas |
| 15 | [Realtime Queue](docs/15_REALTIME_QUEUE.md) | Queue state machine, WebSocket connection manager |
| 16 | [ETA Engine](docs/16_ETA_ENGINE.md) | Formula, worked examples, pseudocode, edge cases |
| 17 | [WhatsApp Integration](docs/17_WHATSAPP_INTEGRATION.md) | Persistent assistant conversational flow (HI/EN) |
| 18 | [QR Token System](docs/18_QR_TOKEN_SYSTEM.md) | HMAC signing, constant-time validation, threat model |
| 19 | [Auth & Security Hardening](docs/19_AUTH_RBAC_SECURITY.md) | JWT, STRIDE threat model, signed audit trails |
| 20 | [Notification System](docs/20_NOTIFICATION_SYSTEM.md) | Outbound alerts, adapter pattern, deduplication |
| 21 | [Integration Strategy](docs/21_INTEGRATION_STRATEGY.md) | `GovernmentProcurementAdapter` interface + state adapters |
| 22 | [Mock Data](docs/22_MOCK_DATA.md) | Full seed dataset + 5 realistic demo scenarios |
| 23 | [Error Handling](docs/23_ERROR_HANDLING.md) | Every error code in EN + plain-language Hindi |
| 24 | [Testing Strategy](docs/24_TESTING_STRATEGY.md) | TDD, Pytest suites, Playwright WCAG a11y tests |
| 25 | [Deployment](docs/25_DEPLOYMENT.md) | Vercel + Render + Supabase setup guide |
| 26 | [Environment Variables](docs/26_ENVIRONMENT_VARIABLES.md) | Environment configuration with `.env.example` |
| 27 | [Demo Script](docs/27_DEMO_SCRIPT.md) | 7-min SIH jury demo script + Q&A recovery |
| 28 | [SIH Pitch Technical Story](docs/28_SIH_PITCH_TECHNICAL_STORY.md) | Technical narrative for hackathon judges |
| 29 | [Roadmap](docs/29_ROADMAP.md) | 4-phase scale roadmap from MVP to national rollout |
| 30 | [Open Questions](docs/30_OPEN_QUESTIONS.md) | 18 unresolved questions with documented assumptions |

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js 18+ & npm
- Python 3.11+

### Backend Setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows (or source venv/bin/activate on Linux/Mac)
pip install -r requirements.txt
cp .env.example .env           # Fill in JWT_SECRET_KEY and QR_HMAC_SECRET
alembic upgrade head
python seed.py
uvicorn main:app --reload --port 8000
```
> API runs at `http://localhost:8000` · Swagger docs at `http://localhost:8000/docs`

### Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env.local     # Set VITE_API_BASE_URL=http://localhost:8000/v1
npm run dev                    # Starts Vite server on localhost:5173
```

> **Demo Farmer Login**: Phone `+919876543210` · OTP `1234` ➔ Ramesh Kumar (Biaora, Rajgarh)  
> **Officer Login**: `officer_rajgarh` / `Demo@1234` (Rajgarh Procurement Centre)

---

## 🎬 3-Step Demo Moment for Judges

1. **Farmer requests pass on WhatsApp**: *"I want to sell wheat"* ➔ Bot recognizes Ramesh, recommends 3 nearby mandis with live congestion/ETAs, asks quantity (*80 quintals*), issues Pass **`KQ-1047`** with signed QR.
2. **Officer reports lifting delay** on web console: Sets capacity to 60%, 1 counter.
3. **Farmer's ETA jumps to ~2h 15m in real time** on Web & WhatsApp in < 2 seconds — without refreshing.

*Full walkthrough & judge Q&A recovery script: [`docs/27_DEMO_SCRIPT.md`](docs/27_DEMO_SCRIPT.md)*

---

## 📄 License

MIT License — Copyright © 2026 **Snehal Prince**

See [LICENSE](LICENSE) for full legal text.

---

<div align="center">

Made with ❤️ for India's farmers · SIH 2026

</div>
