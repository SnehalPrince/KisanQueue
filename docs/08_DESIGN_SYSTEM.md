# 08 — Design System

## Design Principles
Trustworthy + modern + government/public-service appropriate + farmer-friendly. Explicitly avoid flashy startup gradients, aggressive animation, or anything that could read as "unofficial" or gimmicky — the product's credibility depends on looking like it belongs next to a government portal, not a consumer app trying to look exciting.

## Typography
- **Latin**: Inter or system sans-serif.
- **Devanagari**: Noto Sans Devanagari, matched x-height/weight to the Latin face.
- Scale: 12 / 14 / 16 / 20 / 24 / 32px. Body text minimum 16px for farmer-facing screens (readability on low-end screens).

## Spacing & Grid
- 8px base spacing unit. Farmer screens use generous spacing (16–24px) between tappable elements to reduce mis-taps.
- Single-column layout on mobile; officer dashboard may use a 2-column layout ≥768px.

## Responsive Breakpoints
- Mobile: <640px (primary farmer target)
- Tablet: 640–1024px (officer centre devices)
- Desktop: >1024px (admin)

## Color System
- **Primary**: deep green (`#166534`-family) — evokes agriculture/government trust without cliché bright-green startup tone.
- **Neutral**: warm greys for backgrounds/text, avoiding pure black/white for reduced glare.
- **Semantic status colors** (always paired with icon + text label):
  - Normal → green
  - Busy → amber/yellow
  - Lifting delayed → orange
  - Reduced capacity → orange-red
  - Paused → red
  - Stale/Unknown → grey

## Components
- **Buttons**: single primary action per screen; large (min 48px height) for farmer UI.
- **Inputs**: large touch targets, clear focus states, numeric keypad for phone/OTP.
- **Cards**: centre cards and queue cards share one card component with status badge slot.
- **Badges**: status badge = icon + short label + color, never color-only.
- **Alerts/Toasts**: used only for transient confirmations (e.g., "Status updated"); persistent conditions (stale data, offline) use inline banners, not toasts that disappear.
- **Status indicators**: consistent 5-state enum styling reused across farmer and officer views (single source of truth component).
- **Queue visualization**: simple numbered position indicator + horizontal progress-style bar is optional polish, not required for MVP.
- **ETA visualization**: large numeral (e.g., "2h 15m") + confidence badge beneath it + one-line plain-language reason when it just changed.
- **QR presentation**: centered, high-contrast QR with token ID printed beneath for manual fallback entry.
- **Navigation**: bottom tab bar (farmer), top bar (officer/admin).
- **Modals**: used sparingly — officer status update is the primary modal in the product.

## Accessibility Requirements
- WCAG AA contrast minimum.
- All interactive elements keyboard-navigable (for officer/admin desktop use).
- Status never conveyed by color alone.
- Text resizable without breaking layout.
