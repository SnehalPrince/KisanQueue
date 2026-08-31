# 06 — MVP Scope (7-Hour Build)

## P0 — Must Have (demo fails without these)
- Farmer login (phone + mock OTP)
- Centre list with live operational status + last-updated timestamp
- Join queue → token + QR + initial ETA
- Live queue position + ETA via WebSocket, with polling fallback
- Officer login
- Officer dashboard: today's queue, check-in, start/complete processing
- Officer one-tap capacity/operational-status update
- ETA recalculation triggered by officer update, propagated in realtime
- Mocked procurement status after processing completes
- Hindi/English toggle
- Simulated WhatsApp interaction (in-app mock)
- Realistic seeded demo data (`22_MOCK_DATA.md`)
- Polished, trustworthy-looking UI on farmer + officer screens

## P1 — Should Have (build if time allows)
- Mocked payment status
- Admin: centre & officer CRUD (basic)
- `GovernmentProcurementAdapter` interface with mock implementation, visibly wired into architecture diagram for the pitch
- Basic officer analytics (queue length over the day)
- QR real signing (HMAC) rather than a plain ID

## P2 — Nice to Have
- SMS fallback notification (even as a logged mock)
- Multi-centre map view
- Confidence-indicator tooltip UI polish
- Additional language beyond Hindi/English (structure only, not full translation)

## NOT BUILD (explicitly out of scope for MVP and beyond current roadmap)
- Any AI/ML prediction model for ETA
- Real government API integration
- Real WhatsApp Business API webhook
- Payment gateway / actual money movement
- Blockchain, IoT sensors, facial recognition
- Crop advisory, disease detection, marketplace, lending, insurance

## 7-Hour Implementation Plan

| Time | Block | Work |
|---|---|---|
| 0:00–0:30 | Setup | Repo scaffold, DB provisioning (Supabase/Postgres), env vars, base FastAPI + React projects |
| 0:30–1:15 | Database | Create schema (`13_DATABASE_SCHEMA.md`), seed script skeleton |
| 1:15–2:15 | Backend core | Auth, centres, queue join/status endpoints |
| 2:15–3:00 | ETA engine | Implement deterministic formula (`16_ETA_ENGINE.md`) + unit tests for recalculation |
| 3:00–3:45 | Realtime layer | WebSocket gateway, event broadcast on capacity/queue change |
| 3:45–4:45 | Farmer UI | Centre list, centre detail, join queue, live queue/ETA screen, QR display |
| 4:45–5:30 | Officer UI | Dashboard, check-in, capacity update control |
| 5:30–6:00 | QR + mocked statuses | QR generation/scan (or manual entry fallback), procurement/payment mock endpoints |
| 6:00–6:30 | WhatsApp simulator + i18n | In-app WhatsApp mock screen, Hindi/English toggle wiring |
| 6:30–7:00 | Mock data, integration pass, demo polish | Seed realistic data, run through `27_DEMO_SCRIPT.md` end-to-end, fix breakages |

### Explicit trade-offs under time pressure (in order of what gets cut first)
1. Admin CRUD → hardcode via seed data instead of building UI.
2. Payment status → static mock text if time runs out.
3. QR cryptographic signing → fall back to a UUID token if HMAC signing isn't finished in time (documented as an MVP shortcut, not hidden).
4. SMS fallback → skip entirely, mention only as roadmap.

## Success Definition for the Demo
The 7-hour build is "done" when: a farmer can join a queue and see an ETA, an officer can report a lifting delay, and the farmer's ETA visibly increases in real time — all without a page refresh.
