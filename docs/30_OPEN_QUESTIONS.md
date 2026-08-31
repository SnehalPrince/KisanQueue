# 30 — Open Questions

These are unresolved questions that carry meaningful impact on product, technical, or business decisions. Each has a current working assumption and an indicated priority for resolution.

---

## Product Questions

### P-01: Should centre status be viewable without login?

**Why it matters**: The most compelling use case is a farmer checking whether a centre is worth visiting *before* leaving home. Requiring login before that check adds friction and may prevent the most casual/low-literacy use case.

**Current assumption**: Require login for MVP (simplifies auth scope). Guest view of centre list + status is in P1.

**How to validate**: User testing. Ask: at what point in the journey does login feel natural to a farmer?

**Impact if wrong**: Friction at the most critical moment of the journey. Farmers may abandon before reaching the queue feature. Low cost to fix — one auth guard removed.

---

### P-02: Should "Join Queue" require a pre-existing government slot (e.g., e-Uparjan token)?

**Why it matters**: If KisanQueue allows anyone to join a queue independently of government slot allocation, it could conflict with the state procurement system's scheduling. If it requires validation of a slot, it introduces a dependency on government API that doesn't yet exist.

**Current assumption**: KisanQueue maintains its own queue independently. No government slot validation in MVP. Documented as an open integration question.

**How to validate**: Discuss with a state procurement department during pilot conversations.

**Impact if wrong**: High. If government requires KisanQueue to validate against their slot system, the GovernmentProcurementAdapter must support a `validate_slot(farmer_id, centre_id, date)` method — not currently in the interface.

---

### P-03: Should queue position be visible to non-joined farmers at the same centre?

**Why it matters**: Showing the full queue to everyone (not just those in it) would help farmers decide whether to join or wait. But it raises privacy concerns (farming neighbours seeing each other's position).

**Current assumption**: Queue length and ETA visible to all authenticated farmers. Individual farmer names visible only to officers and the farmer themselves.

**Impact if wrong**: Minor. UI adjustment only.

---

### P-04: Should the system support a wait-list when daily capacity is reached?

**Why it matters**: What should happen when `queue_length >= daily_capacity_farmers`? Block new joins or allow a wait-list that gets processed the next day?

**Current assumption**: Block new joins with a helpful message. Wait-list is P2.

**Impact if wrong**: A farmer who can't join has no next-step guidance. Needs at minimum a "try these other centres" suggestion.

---

## Government Questions

### G-01: Do any government systems have public-facing APIs for procurement/payment data?

**Why it matters**: If any state has a usable API, the GovernmentProcurementAdapter can be partially implemented before a formal MoU.

**Current assumption**: No public APIs available. **NOT VERIFIED** — requires direct research with state NIC offices or MeitY contacts.

**How to validate**: File RTI, contact state NIC office, check data.gov.in, contact e-Uparjan/e-Kharid teams directly.

**Impact if wrong**: A working real adapter in MVP would dramatically strengthen the SIH pitch.

---

### G-02: Is officer-reported status legally/politically acceptable as a "source of truth" for the farmer?

**Why it matters**: If an officer reports incorrect status (intentionally or not), KisanQueue propagates that information to farmers. If a farmer makes a bad decision based on incorrect KisanQueue data, is there liability?

**Current assumption**: KisanQueue explicitly disclaims that ETA is an estimate, not a guarantee. Officers are accountable for their own reports to their department, not to KisanQueue.

**How to validate**: Legal review for production. Not relevant for MVP prototype.

**Impact if wrong**: Liability clause needed in ToS for production. No impact on SIH demo.

---

### G-03: Will government centres allow officers to use a non-official app on duty?

**Why it matters**: Officers may be restricted to using government-issued software only. KisanQueue's officer dashboard would need government approval or embedding within an existing government app.

**Current assumption**: For SIH, this is a demo with simulated officers. For production pilot, would require approval from the district/state agricultural department.

**Impact if wrong**: The officer-side of the system — the data input layer — becomes blocked. The entire ETA model depends on officer updates.

---

## Technical Questions

### T-01: At what scale does a single backend instance become insufficient for WebSocket connections?

**Why it matters**: Each connected farmer holds an open WebSocket connection. A single Render dyno has memory and connection limits.

**Current assumption**: Single instance handles up to ~1000 concurrent WebSocket connections comfortably (well within hackathon scale). Redis pub/sub added for horizontal scaling in Phase 2.

**How to validate**: Load test with `locust` or `k6` simulating 500–1000 concurrent WebSocket clients.

**Impact if wrong**: WebSocket connections drop under demo load. Mitigation: fall back to polling; upgrade Render tier; add Redis before demo if load testing reveals the issue.

---

### T-02: Does Render's free tier reliably sustain WebSocket connections for the full demo?

**Why it matters**: Render free tier has known behaviour: services spin down after 15 minutes of inactivity. A spun-down service takes 30–60 seconds to restart — catastrophic during a live demo.

**Current assumption**: Use UptimeRobot to ping `/health` every 5 minutes to keep the dyno warm. Upgrade to Render Starter ($7/month) if budget allows.

**How to validate**: Test 24 hours before demo day.

**Impact if wrong**: Demo fails at the most critical moment. Mitigation: record a backup video of the demo; have Railway as an alternative deployment ready.

---

### T-03: Is the async SQLAlchemy + asyncpg setup compatible with Supabase's connection pooling?

**Why it matters**: Supabase uses PgBouncer for connection pooling. SQLAlchemy's async engine may conflict with certain pooling modes (transaction vs session mode).

**Current assumption**: Use "direct" connection (not pooled) for migrations; use session-mode pooled connection for the app. This is the documented Supabase + SQLAlchemy setup.

**How to validate**: Test locally with a Supabase project before the hackathon build begins.

**Impact if wrong**: Database connections fail at startup. Easy fix: switch to direct connection (accepts fewer concurrent connections but fine at MVP scale).

---

### T-04: Should token_number be globally unique or per-centre per-day?

**Why it matters**: If global: token numbers become very large quickly. If per-centre-per-day: much more human-readable (token 47 of today at Rajgarh), but requires a composite uniqueness constraint.

**Current assumption**: Per-centre per-day (token 1–N resets daily per centre). Unique constraint: `UNIQUE(centre_id, token_number, DATE(joined_at))`.

**Impact if wrong**: Minor schema migration. No feature impact.

---

## UX Questions

### U-01: How should the app handle a farmer who has no smartphone?

**Why it matters**: The WhatsApp-first accessibility layer helps feature-phone users, but basic WhatsApp itself requires a smartphone. Completely offline or voice-based access is out of current scope.

**Current assumption**: Feature phone / no-smartphone access is a Phase 4 item (IVR). For now, a friend/family member with a smartphone is the fallback — common in practice.

**Impact if wrong**: A significant portion of the target user base is excluded. For SIH: acknowledged openly; not a weakness if framed as a Phase 4 roadmap item.

---

### U-02: Should ETA be displayed as a time-of-day rather than duration?

**Why it matters**: "87 minutes" requires mental arithmetic. "Ready by ~11:30 AM" is more immediately useful for planning.

**Current assumption**: Show both — duration (87 min) as primary, time-of-day (ready ~11:30 AM) as secondary below. This is noted in `07_UX_UI_DESIGN.md` as a design decision to confirm with users.

**Impact if wrong**: UX improvement only. No backend change needed.

---

### U-03: What happens if the farmer's phone screen is broken or QR is unreadable?

**Why it matters**: Officers need a reliable fallback for check-in.

**Current assumption**: Officer dashboard supports manual token number entry as a fallback. Logged separately in audit logs.

**Impact if wrong**: Already handled. No open question for technical implementation.

---

## Security Questions

### S-01: Is HMAC-SHA256 QR signing sufficient, or should we use JWT signing (RS256)?

**Why it matters**: HMAC requires the same secret on both issuer and verifier. JWT with RS256 would allow offline verification with only the public key (useful for low-connectivity centres).

**Current assumption**: HMAC-SHA256 sufficient for MVP and Phase 1 (server validates on check-in). RS256 deferred to Phase 2 offline validation feature.

**Impact if wrong**: No security regression. RS256 is strictly more flexible, not more secure in the same-server use case.

---

### S-02: Should audit logs be immutable (append-only at database level)?

**Why it matters**: If a database user with UPDATE/DELETE privileges modifies audit logs, the audit trail loses integrity.

**Current assumption**: Application-level append-only (no UPDATE/DELETE exposed in the service layer). True immutability (PostgreSQL row-level security, or an external log store like S3) is Phase 2.

**Impact if wrong**: In a security audit, application-level append-only is acceptable for MVP. Production requires stronger guarantees.

---

## Data Questions

### D-01: What is the real average processing time per farmer at a typical procurement centre?

**Why it matters**: `T_base = 25 minutes` is a working assumption derived from general knowledge of procurement centre operations. The ETA formula's accuracy depends heavily on this number.

**Current assumption**: 25 minutes (ASSUMPTION — not from a primary source). Officers can update this via centre configuration.

**How to validate**: Ask an officer, or analyse historical throughput data from a willing centre.

**Impact if wrong**: ETA systematically over- or under-estimates. Formula is still correct; only the input constant is wrong. Can be calibrated per centre.

---

### D-02: Should crop type affect processing time (different T_base per crop)?

**Why it matters**: Paddy processing (with moisture testing) may take longer than wheat. Using a single T_base underestimates ETA for mixed-crop queues.

**Current assumption**: Single T_base for all crops in MVP. Per-crop T_base is a Phase 2 refinement if officer feedback suggests meaningful variance.

**Impact if wrong**: Minor ETA inaccuracy in mixed-crop queues. Acceptable for MVP.

---

## Integration Questions

### I-01: Does any state government have an internal API that KisanQueue could access without a formal MoU?

**Current assumption**: No. Treat as assumption until outreach confirms.

---

### I-02: Would e-Uparjan/e-Kharid teams view KisanQueue as competition or collaboration?

**Current assumption**: Positioned as a complementary layer. A procurement officer from a state department would need to validate this perception.

**Impact if wrong**: Government partnership path blocked. KisanQueue would need to operate entirely on officer-reported data without any official government data connection.

---

## Business Questions

### B-01: What is the sustainable funding model?

**Why it matters**: KisanQueue is a public good product. It cannot charge farmers. Revenue must come from elsewhere.

**Options considered**:
- Government licensing fee (state pays per centre per year).
- CSR / NGO funding for deployment.
- Central government grant (MeitY Digital India, AgriStack initiative).
- Freemium: basic version free, advanced analytics paid for district officials.

**Current assumption**: Government licensing is the primary revenue model. Validated assumption — not a firm commitment.

**Impact if wrong**: The project operates as a grant-funded non-profit or is not sustainable. Does not affect SIH demo or MVP scope.

---

### B-02: Is SIH 2026 the right platform to launch this, or should the team target a NASSCOM / AgriTech / DoCA-sponsored program?

**Current assumption**: SIH is the right starting point — provides mentorship, visibility with government stakeholders, and validation. Post-SIH outreach to AgriTech programs is the natural next step.

**Impact**: Strategic only. Does not affect implementation.
