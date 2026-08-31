# 27 — Demo Script

## Overview
**Target duration**: 5–7 minutes  
**Format**: Two screens recommended — Mobile View (Farmer WhatsApp / Web Companion) on left, Tablet/Laptop View (Officer Console) on right.  
**Demo credentials**:
- Farmer: Ramesh Kumar (`+919876543210`, OTP `1234` — persistent profile already onboarded from Biaora, Rajgarh)
- Officer: Suresh Patel (`officer_rajgarh` / `Demo@1234` — Rajgarh Procurement Centre)

---

## The Story

> *Ramesh Kumar is a wheat farmer from Biaora, Rajgarh (MP). He completed a quick one-time profile setup last month. Today he has 80 quintals of wheat ready. Rather than opening a complex government portal or driving blindly to the mandi, he opens WhatsApp and chats with his KisanQueue Assistant.*

---

## Demo Flow (Step by Step)

### Step 1 — Conversational Pass Request on WhatsApp (60 sec)

**Action**: Open the WhatsApp simulator / Mobile App on the farmer screen.

**Farmer types**: `I want to sell wheat.`

**What judges see** (Instant Assistant response):
```text
Bot: Sure Ramesh! Based on your registered location (Biaora, Rajgarh), I found 3 nearby procurement centres:

1️⃣ Rajgarh Centre — Estimated wait: ~45 min (Normal ✅)
2️⃣ Biaora Mandi — Estimated wait: ~1h 20m (Busy ⚠️)
3️⃣ Khilchipur Centre — Lifting delayed (Wait: ~3h 45m 🛑)

Which centre would you prefer? (Reply 1, 2, or 3)
```

**Farmer types**: `1`

**Bot asks**: `Great choice. How much wheat (in quintals) are you bringing?`

**Farmer types**: `80 quintals.`

**Bot replies**:
```text
📋 Procurement Pass Summary:
• Farmer: Ramesh Kumar
• Centre: Rajgarh Procurement Centre
• Crop: Wheat (80 quintals)
• Est. Arrival Window: 11:00 AM – 11:30 AM
• Est. Processing Wait: ~45 min (High confidence)

Would you like me to generate your digital procurement pass?
```

**Farmer types**: `Yes`

**Bot delivers**:
```text
✅ Pass Generated Successfully!
🎟️ Token: KQ-1047
🏢 Centre: Rajgarh Procurement Centre
⏰ Est. Arrival: 11:30 AM
⏱️ Est. Wait Time: ~45 min
📱 Digital QR Pass: [High-Contrast QR Code attached]
```

**Say to Judges**:
> *"Notice what just happened. The system didn't ask Ramesh for his Aadhaar, address, or bank details. It collected that once during onboarding. For today's trip, it asked only what matters: crop and quantity, showed live congestion, and issued pass KQ-1047 with a signed QR."*

---

### Step 2 — Live Queue Tracking (30 sec)

**Action**: Switch to the Farmer Web Live Queue tracker (or tap the link in WhatsApp).

**What judges see**:
- Pass Token: **KQ-1047**
- Live Position: **#14 in queue**
- Estimated Wait: **~45 min** (High confidence)
- Status: **Normal ✅**
- Live WebSocket indicator pulsing green

**Say**: *"Ramesh can see he's 14th in queue with a 45-minute wait. He knows he can leave home at 10:45 AM and arrive right on time."*

---

### Step 3 — Officer Console & Gate Check-In (45 sec)

**Action**: Switch to Officer screen (`officer_rajgarh`).

**What judges see**:
- Live table with today's arrivals (Tokens 39 through 47).
- Active counters: 2.
- Officer scans or enters token `KQ-1047` ➔ Ramesh's pass immediately moves to `CHECKED_IN`.
- Officer marks Token 43 (Mahesh Yadav) as `COMPLETED`.

**On Farmer screen**: Position automatically shifts from `#14 ➔ #13`.

---

### Step 4 — THE CORE MOMENT: Officer Reports Lifting Delay (90 sec)

**Action**: On the Officer dashboard, click the status selector:
- Choose **"Lifting Delayed"**
- Set capacity to **60%** (1 counter active)
- Add note: *"FCI truck delayed by ~2 hours"*
- Click **Update Status**.

**Watch in Real Time on Farmer's Screen (both Web & WhatsApp)**:
- Status banner turns Amber: ⚠️ **Lifting Delayed**
- ETA jumps live from **~45 min ➔ ~2h 15m**
- Confidence badge updates to **Low**
- Instant WhatsApp alert pops up:  
  *`"⚠️ Delay at Rajgarh Centre. FCI truck delayed. New est. wait: ~2h 15m."`*

**Say to Judges**:
> *"Look at Ramesh's phone. Without a page refresh, his ETA jumped to 2 hours 15 minutes because Suresh reported a lifting delay. Before KisanQueue, Ramesh would have driven to the mandi and sat in the dust for 4 hours. Now, he sees the delay from his kitchen and leaves later. That is the entire problem statement solved in real time."*

---

### Step 5 — Post-Delivery Weighing & Payment Receipt (45 sec)

**Action**: Officer marks Token 47 as `COMPLETED` (Quantity: 78.5 quintals, Grade A).

**On Farmer screen / WhatsApp**:
- Instant receipt delivered:
  - Crop: Wheat | Accepted: 78.5 q | Grade: A
  - Total MSP Payout: **₹1,78,587.50**
  - DBT Status: **PENDING (Expected 3-5 working days)**
  - Source: `GovernmentProcurementAdapter (Mocked for SIH)`

**Say**: *"Once weighed, Ramesh gets his digital procurement slip and DBT payment tracker immediately."*

---

### Step 6 — Closing Technical Summary & Differentiation (30 sec)

**Say**:
> *"KisanQueue doesn't replace state portals like e-Uparjan or e-Kharid. We sit on top as a visibility, queue, and persistent WhatsApp layer. One-time onboarding, zero form-fatigue, capacity-aware ETAs, and real-time alerts. That is KisanQueue."*

---

## Judge Interruption Recovery Q&A

### "Why not just use e-Uparjan or e-Kharid?"
> *"e-Uparjan tells you that you have a slot on a given date. It has no idea if an FCI truck broke down at 9:00 AM today, reducing counter capacity by 40%. KisanQueue captures live operational reality from the mandi officer and delivers it to the farmer's WhatsApp in 2 seconds."*

### "Why one-time onboarding?"
> *"Farmers despise filling multi-page forms every time they harvest. Progressive onboarding means identity is verified once. Every subsequent visit is as simple as saying 'I want to sell wheat' — the bot handles the rest."*

### "Where does the live ETA come from?"
> *"It's a deterministic, explainable formula: `ETA = ceil(N × T_base / (C × F))`. When the officer reports a delay, `F` drops to 0.60 and `C` drops to 1, causing the ETA to recalculate instantly. No black-box ML."*

### "What if the internet fails?"
> *"The digital pass QR is cryptographically signed (HMAC-SHA256) and day-scoped. The farmer can screenshot it offline at home and present it at the gate. The officer can validate it offline or via manual token entry."*

### "How will government integrate this?"
> *"Via our `GovernmentProcurementAdapter` interface. In this MVP it runs on mock data. In production, it connects directly to state APIs or database replicas without modifying their core MSP workflows."*
