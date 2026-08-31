# 09 — Tech Stack

## Decision Summary

| Layer | Choice | Alternatives considered | Why chosen |
|---|---|---|---|
| Frontend | React + Vite + TypeScript + Tailwind CSS | Next.js, Vue | Vite gives the fastest local dev loop for a 7-hour build; no SSR/routing complexity is needed since this is a client-rendered app hitting a REST/WebSocket API. Next.js's extra conventions (server components, routing) cost setup time without a corresponding MVP benefit. |
| Backend | Python + FastAPI (modular monolith) | Node/Express, Django | FastAPI gives async support (needed for WebSockets), automatic OpenAPI docs (useful for a fast-iterating hackathon team), and Python is comfortable for most SIH teams. A modular monolith avoids the operational overhead of microservices for a 7-hour build. |
| Database | PostgreSQL (via Supabase free tier for MVP) | MongoDB, SQLite | The domain (queues, tokens, capacity events, relationships between farmers/centres/officers) is inherently relational; PostgreSQL enforces the integrity constraints (foreign keys, unique tokens) that matter for a queue system. Supabase gives a managed Postgres instance with zero ops time. |
| Realtime | Native WebSockets (FastAPI `WebSocket` routes) | Socket.IO, Supabase Realtime, SSE | Plain WebSockets are sufficient for our small, well-defined event set (`15_REALTIME_QUEUE.md`) and avoid adding a second protocol/library. SSE was considered but WebSockets better support the bidirectional check-in/officer-action pattern in the same connection model used elsewhere in the app. |
| Cache/Queue (optional) | None for MVP; Redis flagged as post-MVP | Redis pub/sub for scaling WebSocket fan-out | Not needed at hackathon scale (single backend instance, few concurrent centres). Redis becomes relevant when horizontally scaling the realtime layer — documented in `29_ROADMAP.md`, not built now. |
| WhatsApp | Provider-agnostic adapter interface; `MockWhatsAppProvider` for MVP, Twilio WhatsApp API or Meta Cloud API as the production provider | Direct Meta Cloud API only | A mock-first adapter lets the MVP demo the *interaction design* without needing WhatsApp Business API approval/setup during the hackathon, while keeping the production path a drop-in swap (`17_WHATSAPP_INTEGRATION.md`). |
| Auth | JWT sessions; phone+OTP for farmers (mocked), username+password for officer/admin | Firebase Auth, Auth0 | Rolling a minimal JWT auth path keeps full control over the Farmer/Officer/Admin role model without pulling in a third-party auth SaaS mid-hackathon. |
| Deployment | Frontend: Vercel. Backend + DB: Render or Railway (WebSocket-capable). | Netlify, Heroku, self-hosted | Vercel is fastest for a static/Vite frontend deploy; Render/Railway support long-lived WebSocket connections (unlike some serverless platforms) and deploy from a Git push with minimal config — both matter for demo-day reliability. |

## Rationale for a Modular Monolith (not microservices)
See `41`/`42` sections in the master prompt and `10_SYSTEM_ARCHITECTURE.md` for the explicit evaluation. Short version: a 7-hour build cannot absorb the operational cost of multiple deployable services, service discovery, or distributed transactions. A single FastAPI app with clearly separated modules (queue, ETA, auth, notifications, integration adapters) gives the same conceptual separation without the infrastructure tax, and can be split into services later if genuinely needed.

## Package-Level Notes
- Backend: FastAPI, SQLAlchemy (or SQLModel), Pydantic, `python-jose` (JWT), `qrcode` (QR generation), `hmac`/`hashlib` (token signing).
- Frontend: React Router, Tailwind, a small state layer (React Query for server state + minimal local state — no heavy global state library needed at this scope), `react-i18next` for Hindi/English.
- WhatsApp production candidates: Twilio's Python SDK for WhatsApp, or a Meta WhatsApp Cloud API client — both fit behind the same adapter interface.

## What We Deliberately Did Not Choose
- Kubernetes, Kafka, event sourcing, multiple databases, ML pipelines — all rejected per the explicit "don't overengineer" constraint (`41_ARCHITECTURAL_QUALITY_BAR` guidance in the master prompt).
