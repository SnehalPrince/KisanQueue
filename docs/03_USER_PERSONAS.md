# 03 — User Personas

All personas are **ASSUMPTION**-level composites built from the validation report's characterization of rural procurement users, not from primary user research. Treat demographic specifics as illustrative, not verified.

## Persona 1 — Ramesh, the Farmer (Primary)
- **Age**: 45. **Location**: village 12 km from the nearest procurement centre.
- **Device**: entry-level Android smartphone, intermittent 3G/4G.
- **Literacy**: functional Hindi reading, limited comfort with complex apps or English UI.
- **Goals**: sell wheat at MSP without wasting a full day standing in a queue; know before leaving home if today is a bad day to go.
- **Pain points**: has a valid e-Uparjan slot but has previously arrived to find a 4-hour backlog with no warning; distrusts "the app says so" without a WhatsApp fallback his son can check for him.
- **Needs from KisanQueue**: centre status, queue position, ETA, QR/token, procurement/payment status, Hindi UI, WhatsApp access.
- **Success looks like**: opens WhatsApp, sends "2" (My Token), and immediately knows whether to leave now or in two hours.

## Persona 2 — Officer Suman, the Procurement Officer
- **Age**: 34. **Role**: manages daily arrivals and processing at one centre during procurement season.
- **Context**: handles high call/foot-traffic volume from anxious farmers asking "how long is the wait"; currently has no fast way to broadcast a lifting delay.
- **Goals**: reduce time spent explaining delays verbally; keep the physical queue orderly; avoid overpromising wait times.
- **Pain points**: paperwork-heavy status reporting tools reduce willingness to update systems in real time.
- **Needs from KisanQueue**: one-tap capacity/status update, simple today's-queue dashboard, QR check-in.
- **Success looks like**: taps "Lifting delayed → 40% capacity" once, and every waiting farmer's ETA updates without a single phone call.

## Persona 3 — Administrator Priya, the State/District Coordinator
- **Age**: 38. **Role**: oversees multiple centres and officers within a district.
- **Goals**: configure centres/officers correctly; get a high-level sense of where congestion or delay is happening.
- **Pain points**: no unified visibility across centres today beyond fragmented officer reports.
- **Needs from KisanQueue (MVP-minimal)**: centre/officer management, basic analytics.
- **Note**: Administrator scope is deliberately minimized for the MVP (see `06_MVP_SCOPE.md`) — most Admin capability is P1/P2/future.

## Design Implication Summary
| Persona | Primary device | Primary language need | Primary constraint |
|---|---|---|---|
| Farmer | Low-end mobile / WhatsApp | Hindi (+ English) | Low bandwidth, low digital literacy |
| Officer | Mobile or centre desktop | Hindi/English | Speed of data entry (must be near-zero friction) |
| Admin | Desktop | English (assumption) | Breadth of oversight, not speed |
