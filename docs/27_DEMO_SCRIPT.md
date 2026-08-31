# 27 — Demo Script

## Overview
**Target duration**: 5–7 minutes
**Format**: Two screens recommended — a mobile view for the farmer experience, and a tablet/laptop view for the officer dashboard. Split-screen or side-by-side if presenting on one machine.
**Demo login credentials**:
- Farmer: phone `+919876543210`, OTP `1234` → Ramesh Kumar
- Officer: username `officer_rajgarh`, password `Demo@1234`

---

## The Story

> *Ramesh Kumar is a wheat farmer in Rajgarh, Madhya Pradesh. He has 40 quintals of wheat ready to sell at MSP. He registered on e-Uparjan and got his slot — but last time he traveled to the mandi, there was a lifting delay and he waited 6 hours. Today, before leaving home, he opens KisanQueue.*

---

## Demo Flow (Step by Step)

### Step 1 — Open App, See Centre Status (45 sec)

**Action**: Open the app on the farmer device. The home screen shows a list of procurement centres.

**What judges see**:
- Rajgarh Procurement Centre: green "Normal" badge, 14 farmers in queue, ~87 min estimated wait.
- Hisar HAFED Centre: amber "Busy" badge, 22 farmers, ~413 min.
- Patiala Centre: red "Paused" badge.

**Say**: *"The first thing Ramesh sees is the actual operational status of each centre — not just whether he has a slot, but whether going today makes sense. Right now Rajgarh is Normal, so he taps it."*

---

### Step 2 — View Centre Detail (30 sec)

**Action**: Tap "Rajgarh Procurement Centre" → centre detail screen.

**What judges see**:
- Operational status: Normal ✅
- Active counters: 2
- Estimated wait: ~87 min (Medium confidence)
- Last updated: 8 min ago
- Crops accepted: Wheat, Soybean

**Say**: *"He can see 2 counters are active, last updated 8 minutes ago. This is officer-reported — Suresh at the centre marked this status this morning."*

---

### Step 3 — Join Queue, Receive Token (45 sec)

**Action**: Tap "Join Queue" → select crop (Wheat), quantity (40.5 q) → Submit.

**What judges see** (confirmation screen):
- Token number: **#47** (large, prominent)
- Position: **#14 in queue**
- Estimated wait: **~87 min** (Medium confidence)
- QR code displayed
- "Valid until end of day today"

**Say**: *"Ramesh gets token 47. He's 14th in queue. Estimated wait: 87 minutes. He now knows he can leave in about an hour and arrive on time. He screenshots the QR for offline access."*

---

### Step 4 — Show Live Queue Position Screen (30 sec)

**Action**: Navigate to "My Queue" screen.

**What judges see**:
- Position 14 / 14 (visually as a progress indicator)
- Live ETA: ~87 min
- Confidence badge: Medium
- "Computed at 9:05 AM"
- WebSocket "live" indicator (green dot)
- Centre status banner: Normal

**Say**: *"This screen updates live via WebSocket. As farmers ahead are processed, his position drops automatically — no refresh needed."*

---

### Step 5 — Officer Dashboard (60 sec)

**Action**: Switch to the officer device (or split screen). Log in as `officer_rajgarh`.

**What judges see**:
- Today's queue: list of 14 tokens, Ramesh at position 14.
- Token 43 (Mahesh Yadav): PROCESSING at counter.
- Bulk status at a glance.
- Operational status selector at the top: "Normal" currently selected.

**Action**: Officer clicks "Complete" on Token 43 (Mahesh).

**On farmer screen**: Position updates from 14 → 13. ETA ticks down slightly.

**Say**: *"Suresh, the officer at the centre, sees the same queue. He just completed Mahesh's processing. Ramesh's position just moved."*

---

### Step 6 — CORE MOMENT: Lifting Delay Reported (90 sec)

**Action**: On the officer dashboard, click the status selector → choose **"Lifting Delayed"** → set capacity factor 60% → active counters 1 → add note "FCI truck delayed by ~2 hours" → Submit.

**On farmer screen** (watch in real time):
- Status banner changes to: ⚠️ "Lifting Delayed"
- ETA jumps from **~82 min** → **~209 min** (~3h 30m)
- Confidence badge changes to: **Low** (red)
- A notification appears: "⚠️ Delay at Rajgarh Centre. New estimated wait: ~209 min."

**Say**: *"Suresh just reported a lifting delay — the FCI truck hasn't arrived. Watch what happens on Ramesh's phone: the ETA more than doubles, the confidence changes to Low, and a notification appears. This happened without Ramesh refreshing. He can now decide: do I leave now and wait, or come back in 2 hours? That decision was impossible before KisanQueue."*

**Pause for effect here. This is the money moment.**

---

### Step 7 — Show ETA Math to Judges (30 sec, optional/on request)

**Say** (or show a slide/overlay if prepared):

> *"Our ETA formula is: wait = ceiling(N × T_base / (C × F)). Before: N=13, T_base=25, C=2, F=1.0 → 163 min. After: N=13, T_base=25, C=1, F=0.6 → 542 min. Simple, explainable, and it reacts to real conditions. No black-box ML."*

> *(Show `16_ETA_ENGINE.md` if a judge asks for the formula.)*

---

### Step 8 — Procurement & Payment Status (45 sec)

**Action**: Farmer side. Show Token 39 (Priya Bai — already completed). Navigate to "Status" tab.

**What judges see**:
- Crop: Wheat | Quantity: 22 q | Grade: A
- MSP Rate: ₹2,275/q | Total: ₹50,050
- Payment status: PAID ✅ | UTR: IMPS202609150001
- Label: "Demo Data — from GovernmentProcurementAdapter (mock)"

**Say**: *"Once processing is complete, the farmer sees the procurement record and payment status. In the MVP this is mock data. In production, this comes from the state's system via our GovernmentProcurementAdapter interface — which plugs into e-Uparjan or e-Kharid without replacing them."*

---

### Step 9 — WhatsApp Simulator (45 sec)

**Action**: Open the "WhatsApp" tab in the app.

**Type**: `Hi`
**Bot response**: Menu in Hindi.

**Type**: `1`
**Bot response**: Token #47, Position #13, ETA ~209 min (Lifting delayed).

**Type**: `3`
**Bot response**: Detailed ETA with confidence and reason.

**Say**: *"For farmers who don't want to navigate an app, WhatsApp works too. Same data, same live ETA. In the MVP this is a simulator calling our own API — the production architecture routes real WhatsApp messages through the same service layer via an adapter. No code change needed to switch."*

---

### Step 10 — Hindi Toggle (20 sec)

**Action**: On the farmer screen, tap the language toggle → switch to Hindi.

**What judges see**: All farmer-facing UI text renders in Hindi immediately. ETA, status labels, button text, error messages — all Hindi.

**Say**: *"Bilingual by design. Ramesh's phone shows Hindi by default. The officer dashboard stays in English. The architecture supports adding more Indian languages with just a translation file."*

---

### Step 11 — Close with Integration Story (30 sec)

**Say**: *"To summarise what you just saw: KisanQueue doesn't replace e-Uparjan or e-Kharid. Those systems handle registration and MSP workflow. KisanQueue adds what's missing — live operational visibility, a queue with real ETA, and a WhatsApp-accessible interface. A farmer can now answer the question 'is today a good day to go to the mandi?' before leaving home. That's the gap we fill."*

---

## Judge Interruption Recovery

### "Doesn't e-Uparjan already do this?"

> *"e-Uparjan gives you a slot — a place in the schedule. It doesn't tell you that today there's a lifting delay, or that the centre is processing at 40% capacity, or how long you'll actually wait when you arrive. That's the gap. KisanQueue is the operational visibility layer that sits on top — we're not competing with e-Uparjan, we're complementing it."*

---

### "Doesn't e-Kharid already have QR?"

> *"Yes — e-Kharid uses QR for digital gate passes, and that's great. But the QR is for entry authorisation, not queue management. There's no real-time queue position, no ETA that reacts to lifting delays, no farmer-facing view of 'how long will I wait today'. Those are different problems."*

---

### "Where does the live data actually come from?"

> *"In the MVP, the live operational status comes from the procurement officer — Suresh clicks one button to report a lifting delay, and it propagates to all waiting farmers in ~2 seconds via WebSocket. No sensors, no IoT. The officer is the data source, which is both simple and honest — they're the only person who actually knows what's happening at the centre."*

---

### "How can you guarantee the ETA is accurate?"

> *"We don't. And that's intentional. We label it 'Estimated Wait' with a confidence level — High, Medium, or Low. The formula is transparent: number of farmers ahead, base processing time, number of active counters, and capacity factor. When those inputs are accurate, the estimate is useful. When they're stale, we say so. Honest uncertainty is better than false precision."*

---

### "What happens if the internet fails?"

> *"Three layers of graceful degradation. First, the WebSocket falls back to polling the REST API every 15 seconds automatically. Second, the farmer can screenshot their QR and token number for offline use at the counter. Third, the officer can accept manual token number entry when QR scanning fails. The system fails gracefully, not silently."*

---

### "Why would farmers trust you?"

> *"Because we tell them the truth, including when things are bad. If the centre is paused, we say 'don't come.' If the ETA is uncertain, we show a Low confidence badge. If data is stale, we flag it. The alternative — showing a reassuring number that's wrong — is what erodes trust. We're building for long-term use, not a one-time impression."*

---

### "Why would government integrate you?"

> *"We're not asking government to replace anything. We're asking permission to read data that they already generate — processing records, slot status, centre operations — and show it to the farmer in a useful way. Our GovernmentProcurementAdapter is a pluggable interface that can connect to e-Uparjan or e-Kharid without modifying those systems. The integration conversation is 'can we read your data?' — not 'please rebuild your system.'"*

---

### "What happens when lifting is delayed?"

> *"You just saw it. Officer reports the delay in one click. Our ETA formula recalculates: the capacity factor drops, the processing time per farmer increases, the ETA for every waiting farmer is updated, and a notification is pushed to their phone within 2 seconds. No manual broadcast, no call centre. Automatic."*

---

### "How do you prevent QR fraud?"

> *"Each QR is HMAC-SHA256 signed with a server secret — you can't forge a valid QR without that key. It's single-use: once scanned, the flag is set and the same QR is rejected if presented again. It expires at end of day. And the officer sees the farmer's name when they scan — a name mismatch is immediately visible. This is appropriate security for a queue management system, and we're transparent about where production hardening would add more."*

---

### "Why WhatsApp?"

> *"Because 500 million Indians use WhatsApp daily, including farmers who don't want to install another app or navigate a web interface. The interaction is familiar: send a message, get a reply. No login UI, no navigation. For a farmer checking their position while driving to the mandi, WhatsApp is faster and safer than opening a browser. It's an accessibility decision."*

---

### "Why not just improve the government portal?"

> *"Two reasons. First, improving a government portal requires navigating government procurement cycles — that could take 3–5 years. KisanQueue can be deployed and useful today. Second, no single government portal covers all states — e-Uparjan is MP, e-Kharid is Haryana, Punjab has its own system. KisanQueue works as a cross-state layer precisely because it doesn't depend on or replace any of them."*

---

## Timing Reference

| Segment | Time |
|---|---|
| Story intro + centre list | 0:00 – 0:45 |
| Centre detail | 0:45 – 1:15 |
| Join queue + token | 1:15 – 2:00 |
| Live queue screen | 2:00 – 2:30 |
| Officer dashboard + complete token | 2:30 – 3:30 |
| **Lifting delay moment** | 3:30 – 5:00 |
| Procurement/payment status | 5:00 – 5:45 |
| WhatsApp simulator | 5:45 – 6:30 |
| Hindi toggle | 6:30 – 6:50 |
| Closing integration story | 6:50 – 7:00 |

**Total: ~7 min.** Cut WhatsApp simulator if running over; it's P1 in the demo.
