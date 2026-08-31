# 29 — Roadmap

## Philosophy
Each phase must be genuinely useful before moving to the next. Do not add features because they sound impressive — add them because the previous phase's users are asking for them.

---

## Phase 0 — Hackathon MVP (SIH Demo Day)

**Timeline**: 7 hours build + demo.

**Goal**: A working, polished prototype that demonstrates the core value proposition to SIH judges.

**Delivered**:
- Farmer login (phone + static OTP)
- Centre list + live status (officer-reported)
- Join queue → token + QR + initial ETA
- Live queue position + ETA via WebSocket
- Officer dashboard: check-in, start/complete, capacity update
- Backlog-aware ETA recalculation (formula: `ceil(N×T_base/(C×F))`)
- Mocked procurement + payment status
- Hindi/English toggle
- Simulated WhatsApp interaction (in-app mock)
- Polished, trustworthy mobile-first UI
- Realistic seeded demo data (3 centres, 10 farmers)

**Success criterion**: A judge can see Ramesh Kumar's ETA increase in real time when Suresh reports a lifting delay.

---

## Phase 1 — Pilot-Ready (Post-Hackathon, 4–8 weeks)

**Goal**: Deploy with real users at one procurement centre, one willing state.

### Product
- Real OTP via SMS gateway (Exotel / MSG91).
- Real WhatsApp notifications (Meta Cloud API or Twilio — swap the adapter, no core change).
- Farmer registration form (name, Aadhaar last-4, village, district, primary crop).
- Admin CRUD: centre + officer management UI.
- QR hardening: 4-hour TTL tokens, nonce for replay prevention.
- Basic officer analytics: queue throughput over the day, average processing time.
- Payment status auto-link once procurement record exists (still mocked from government side).

### Technical
- `slowapi` rate limiting tuned for real traffic.
- Structured logging (structlog) shipping to a log aggregator.
- Alembic migration discipline (version every schema change).
- GitHub Actions CI running all P0 tests on every PR.
- Render standard tier (no spin-down) for backend.
- Uptime monitoring (Better Uptime or UptimeRobot).

### Government Integration
- Initiate data-sharing conversation with pilot state's procurement department.
- No production API integration yet — officers still manually report status.
- Document what data KisanQueue would need from the government system (procurement records, payment status events).

---

## Phase 2 — State-Level Deployment (3–6 months)

**Goal**: 50+ centres in one state, 10,000+ farmers, measurable impact.

### Product
- Multi-centre map view for farmers (lat/lng from centres table — already in schema).
- Farmer preference: saved home centre, preferred crop, notification opt-in per channel.
- Officer shift management: morning/evening shift handover with capacity state carried forward.
- Daily centre summary report for district-level agricultural officers.
- Multilingual expansion: add Punjabi / Marathi translation files (architecture already supports this — only i18n JSON files needed).
- Offline QR: officer device caches expected HMAC keys for offline validation in low-connectivity centres.

### Technical
- Redis pub/sub for WebSocket fan-out across multiple backend instances (horizontal scaling).
- PostgreSQL read replica for analytics queries (avoid blocking queue-critical writes).
- Background task queue (e.g., Celery or FastAPI background tasks) for notification dispatch (decouples send latency from request path).
- Automated DB backups (Supabase Pro includes this; or `pg_dump` scheduled job).
- Penetration test before handling real PII at scale.

### Government Integration
- First real adapter: connect to one state system (e.g., e-Uparjan) for procurement record and payment status read.
- Integration type: periodic sync (poll every 15 min) or webhook push (preferred if the government system supports it).
- Data governance: formal MoU, data processing agreement, privacy policy for farmers.

---

## Phase 3 — Multi-State Expansion (6–18 months)

**Goal**: Coverage across 3+ major procurement states.

### Product
- Cross-state farmer profile: farmer can see their queue status regardless of which state's centre they use.
- Predictive capacity suggestions: use 90-day historical throughput data to suggest optimal time-of-day to arrive (not ETA — a separate "when should I arrive?" feature).
- Centre performance dashboard for state agricultural departments.
- Grievance channel: farmer can flag an issue (wrong grade, delayed payment) from the app; routed to the correct officer.

### Technical
- State-specific adapter implementations for: MP e-Uparjan, Haryana e-Kharid, Punjab Anaaj Kharid.
- Consider split services for Queue and ETA if centre count > 1000 and single-service throughput is measurable bottleneck.
- Firebase Cloud Messaging for mobile push notifications (if a mobile app is built).
- Data warehouse (BigQuery or similar) for cross-state analytics without impacting production DB.

### Government Integration
- Multiple state adapters live.
- DBT payment status integration — real payment confirmation from government DBT system (requires separate MoU).
- Potential: Central government / DoCA-level integration if a national API layer is ever created.

---

## Phase 4 — Production Architecture (18+ months)

### Infrastructure
- Containerized services (Docker → Kubernetes or Cloud Run) for independent scaling of Queue, ETA, and Notification services.
- Redis cluster for WebSocket pub/sub at scale.
- Read replicas + connection pooling (PgBouncer) for PostgreSQL.
- CDN for frontend assets (already handled by Vercel; evaluate regional CDN for rural network performance).
- Observability stack: OpenTelemetry traces, Grafana dashboards, PagerDuty alerts.

### Security
- RS256 JWT signing (asymmetric — public key shareable with partners).
- HSM or cloud KMS for signing key storage (instead of env var).
- Formal SOC 2 or CERT-In audit if handling large volumes of farmer PII.

### Accessibility
- Progressive Web App (PWA) manifest + service worker: allow farmer to "install" KisanQueue on their home screen without an app store.
- Offline mode: cache last known queue status, QR, and centre info for offline viewing.
- Voice interface: IVR-based status check for feature phones (entirely separate channel, long-term).

---

## Features Explicitly NOT in Roadmap

These are out of scope permanently unless the problem statement expands beyond PS 26032:
- AI crop disease detection
- Crop price prediction / market recommendations
- Lending, insurance, or financial services
- Blockchain-based record-keeping
- IoT sensor integration (requires physical hardware at centres — different project)
- Marketplace / e-commerce features
- Generic farmer advisory chatbot

The focus remains: **visibility and queue management for MSP procurement centres**.

---

## Roadmap Summary Table

| Feature | Phase 0 | Phase 1 | Phase 2 | Phase 3 |
|---|---|---|---|---|
| Centre live status | ✅ | ✅ | ✅ | ✅ |
| Backlog-aware ETA | ✅ | ✅ | ✅ | ✅ |
| Queue + token | ✅ | ✅ | ✅ | ✅ |
| QR (signed) | ✅ (MVP) | ✅ (hardened) | ✅ | ✅ |
| Real OTP | ❌ (mock) | ✅ | ✅ | ✅ |
| Real WhatsApp | ❌ (sim) | ✅ | ✅ | ✅ |
| Hindi/English | ✅ | ✅ | + more | + more |
| Government data | ❌ (mock) | ❌ (MoU talks) | ✅ (1 state) | ✅ (3+ states) |
| Admin CRUD | ❌ (seed) | ✅ | ✅ | ✅ |
| Redis WS scaling | ❌ | ❌ | ✅ | ✅ |
| Map view | ❌ | ❌ | ✅ | ✅ |
| Offline mode | ❌ | ❌ | ❌ | ✅ |
| Predictive capacity | ❌ | ❌ | ❌ | ✅ |
