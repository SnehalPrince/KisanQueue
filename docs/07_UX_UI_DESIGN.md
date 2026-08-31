# 07 — UX/UI Design

## Information Architecture

```text
Farmer App
├── Onboarding (language select → phone/OTP)
├── Home (nearby centres, status badges)
├── Centre Detail (status, queue length, join button)
├── My Queue (position, ETA, QR)
├── Procurement Status
├── Payment Status
└── WhatsApp Simulator (accessible from Home)

Officer App
├── Login
├── Dashboard (today's queue)
├── Check-in (QR scan / manual token entry)
├── Processing controls (start/complete)
└── Capacity/Status Update

Admin App (minimal, P1)
├── Centres
├── Officers
└── Basic Analytics
```

## Navigation
- Farmer: bottom tab bar (Home, My Queue, Status, WhatsApp) — max 4 tabs, large touch targets.
- Officer: single-page dashboard with a persistent status selector at the top (always visible, never buried in a menu).

## Farmer Journey (screen-by-screen)
1. **Language select** — first screen ever seen, no login required. Sets locale before anything else loads.
2. **Phone/OTP** — one field per screen, large numeric keypad.
3. **Home** — list of centres sorted by distance, each card shows: name, status badge (color + text, not color alone), queue length, "updated Xm ago."
4. **Centre Detail** — expanded status, capacity note if degraded (e.g., "Lifting delayed — capacity reduced 40%"), Join Queue button.
5. **My Queue** — large ETA number, confidence badge (High/Medium/Low), position, QR code, plain-language explanation if ETA just changed ("Wait increased because of a lifting delay").
6. **Procurement/Payment Status** — simple status chips (Pending/In Progress/Completed), never blank without explanation.
7. **WhatsApp Simulator** — chat-style UI replicating the intended production flow.

## Officer Journey
1. **Login** — username/password.
2. **Dashboard** — queue table (name/token/position/status), big status selector fixed at top, check-in field.
3. **Status update modal** — pick one of 5 states; if Lifting Delayed/Reduced Capacity, a single percentage slider appears. Submission is one tap.

## Screen States (every data-bearing screen must define these)
- **Empty**: no centres nearby / no one in queue — explicit friendly message, not a blank screen.
- **Loading**: skeleton cards, not spinners alone, to reduce perceived wait on slow networks.
- **Error**: network/API failure — plain-language message + retry button (see `23_ERROR_HANDLING.md`).
- **Offline**: cached last-known state clearly labeled "Offline — showing data from [time]."
- **Stale**: data older than threshold — visible badge, does not block viewing.

## Accessibility
- Minimum 4.5:1 contrast for all status text.
- Status conveyed by icon + text + color together (never color alone) — colorblind-safe.
- Touch targets ≥44px.
- Hindi font rendering tested (Noto Sans Devanagari or equivalent) at same visual weight as English.

## Hindi/English Behavior
- Toggle available on every screen header.
- Switching language never navigates away from current screen.
- Numerals and dates use a consistent, locale-appropriate format (Indian numbering conventions where relevant, e.g., "1.5 lakh" style avoided in favor of plain minutes/hours for ETA to reduce ambiguity).

## Mobile-First Considerations
- Design at 360×800 baseline; officer dashboard may assume a slightly larger viewport (tablet/desktop at centre) but must remain usable on mobile.
- All primary actions reachable within thumb-reach zone on a single-hand grip.
- Avoid heavy imagery; prioritize text + iconography for low-bandwidth rendering.
