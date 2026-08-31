# 07 — UX/UI Design

## Information Architecture

```text
Farmer Web & WhatsApp Assistant
├── One-Time Onboarding (language select ➔ phone/OTP ➔ Name, Village, District)
├── Home / Centre Discovery (nearby mandis, color-coded live status, wait times)
├── 1-Tap Pass Generator (Select crop, enter quintals, confirm ➔ Instant Digital Pass)
├── Live Queue Tracker (live queue position, ETA clock, signed QR gate pass)
├── Post-Procurement Receipt (weight, grade, MSP total)
├── Payment Status (DBT status chip & UTR info)
└── WhatsApp Simulator (interactive chat UI replicating persistent assistant)

Officer Console
├── Login (officer credentials)
├── Mandi Dashboard (today's arrivals, active counters, queue throughput)
├── Check-in Scanner (camera QR scan / manual token entry)
├── Counter Processing (start / complete processing)
└── 2-Tap Capacity & Delay Controller (Normal / Busy / Lifting delayed / Paused)

Admin Console (minimal, P1)
├── Mandi & Counter Configuration
├── Officer Management
└── State/District Congestion Overview
```

---

## Farmer Journey (Screen-by-Screen)

### 1. One-Time Onboarding (First-Time User Only)
- **Step 1: Language selection** — Large Hindi/English cards.
- **Step 2: Phone & OTP** — Single numeric field with auto-focus.
- **Step 3: Location Profile** — Farmer provides Name, Village, and District. This profile is permanently saved.
- *Outcome*: Returning visits completely skip this step and land directly on the Home dashboard or WhatsApp conversation.

### 2. Conversational Pass Creation (WhatsApp & Web)
- Farmer says: *"I want to sell wheat"* (or taps *"Generate Pass"* on Web).
- System recognizes farmer's registered district and immediately displays the 3 nearest mandis with their **live congestion status** and **capacity-aware ETAs**.
- System asks only: *"How much wheat are you bringing?"*
- Farmer enters quantity (e.g. `80 quintals`).
- System previews the pass with estimated arrival window and wait time.
- Farmer taps **"Confirm & Get Pass"**.

### 3. Digital Procurement Pass & Live Tracker (`My Queue`)
- **Digital Pass Header**: Prominent Token ID (e.g. `KQ-1047`) and centre name.
- **High-Contrast QR Code**: Encodes HMAC-signed pass payload for gate admission (with screenshot recommendation).
- **Live Progress Counter**: Live position indicator (e.g. `#14 in queue`) updating via WebSocket.
- **ETA Clock & Confidence Badge**: e.g., `~45 min` (High) or `~2h 15m` (Low — Lifting delay).
- **Delay Alert Banner**: If the officer reports a delay, a clear amber/red alert appears explaining *why* the wait changed (e.g. *"Delay reported: FCI truck delayed by 2 hours"*).

### 4. Post-Delivery Receipt & Payment Tracker
- Shows completed weighing summary (Quantity accepted, Grade A/B, MSP rate, Total amount).
- Payment status chips (`Pending` / `In Progress` / `Paid`) with estimated DBT payout timeline.

### 5. In-App WhatsApp Simulator
- WhatsApp-styled chat window allowing full testing and demonstration of the persistent assistant.

---

## Officer Journey

1. **Login** — Officer ID & password.
2. **Dashboard Overview** — Live queue table (Token, Farmer Name, Crop, Quintals, Status), active counters, daily count.
3. **Gate Check-In** — 1-click QR camera scan or quick manual token entry.
4. **2-Tap Capacity & Condition Selector**:
   - Fixed at the top of the dashboard.
   - States: `Normal` (100%), `Busy` (80%), `Lifting Delayed` (custom %, default 60%), `Reduced Capacity`, `Paused`.
   - Updating status takes < 5 seconds and instantly recalculates all farmer ETAs.

---

## Screen States & Graceful Degradation

- **Empty State**: Friendly illustration and message when no queue is active.
- **Loading State**: Subtle skeleton placeholders to prevent layout jump.
- **Offline / Stale State**: If network drops, the pass QR and last known queue position remain visible with a clear label: *"Offline — showing status from 9:45 AM"*.
- **Stale Data Warning**: Yellow chip if centre status hasn't been updated in >30 minutes.

---

## Accessibility & Localization

- **High Contrast**: Minimum 4.5:1 text-to-background contrast.
- **Colorblind-Safe Badges**: Status is always indicated by **Icon + Text + Color** together (e.g., `✅ Normal`, `⚠️ Delayed`, `⏸️ Paused`).
- **Large Touch Targets**: Minimum 48×48px buttons for one-handed operation.
- **Devanagari Font Optimization**: Crisp rendering with Noto Sans Devanagari across all Android viewports.
