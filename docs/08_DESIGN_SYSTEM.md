# 08 — Design System & Motion Engineering

> **Referenced Agent Skills**: [`emil-design-eng`](../.agents/skills/emil-design-eng/SKILL.md), [`transitions-dev`](../.agents/skills/transitions-dev/SKILL.md), [`impeccable`](../.agents/skills/impeccable/SKILL.md), [`visual-design-foundations`](../.agents/skills/visual-design-foundations/SKILL.md), [`wcag-audit-patterns`](../.agents/skills/wcag-audit-patterns/SKILL.md).

---

## 1. Design Principles & Taste
* **Public Service Authority + Modern Craft**: Clean, trustworthy, accessible, and high-performance. Avoid cliché flashy neon startup aesthetics; aim for the understated polish of a world-class public utility.
* **Unseen Details Compound** (*Emil Kowalski*): Micro-interactions, physical press feedback, and fluid transitions create software that feels instantly intuitive.
* **Honest Information** (*Impeccable*): Never show fabricated defaults or false precision. Always pair numbers with confidence indicators and timestamps.
* **Progressive Clarity**: High visual contrast, large touch targets (≥48px), and zero clutter on farmer mobile screens.

---

## 2. Color System & Contrast Tokens

We utilize curated, high-contrast semantic palettes that exceed WCAG AA (4.5:1 for normal text, 3:1 for large text):

```css
:root {
  /* Brand / Agricultural Trust */
  --color-primary-900: #064e3b; /* Deep Forest Green */
  --color-primary-800: #065f46;
  --color-primary-700: #047857;
  --color-primary-600: #059669;
  --color-primary-100: #d1fae5;
  --color-primary-50:  #ecfdf5;

  /* Surfaces & Neutrals */
  --color-bg-base:     #f8fafc; /* Crisp, anti-glare canvas */
  --color-surface-card:#ffffff;
  --color-text-main:   #0f172a; /* Slate 900 */
  --color-text-muted:  #475569; /* Slate 600 */
  --color-border:      #e2e8f0;

  /* Semantic Mandi Status (Icon + Text + Color) */
  --status-normal:     #16a34a; /* Green */
  --status-normal-bg:  #dcfce7;
  --status-busy:       #d97706; /* Amber */
  --status-busy-bg:    #fef3c7;
  --status-delayed:    #ea580c; /* Orange */
  --status-delayed-bg: #ffedd5;
  --status-paused:     #dc2626; /* Crimson Red */
  --status-paused-bg:  #fee2e2;
  --status-stale:      #64748b; /* Slate Grey */
  --status-stale-bg:   #f1f5f9;
}
```

---

## 3. Typography & Hierarchy
* **Latin Font**: `Inter` / `Outfit` / System sans-serif.
* **Devanagari Font**: `Noto Sans Devanagari` (matches Latin x-height and optical weight).
* **Type Scale**:
  - `Display / Token #`: 36px / Line-height: 40px (Bold)
  - `Hero / Heading 1`: 24px / Line-height: 32px (Semi-bold)
  - `Heading 2`: 20px / Line-height: 28px (Medium)
  - `Body Main`: 16px / Line-height: 24px (Regular) — *Minimum 16px for farmer mobile accessibility*
  - `Caption / Stale Tag`: 13px / Line-height: 18px (Medium)

---

## 4. Motion Engineering Tokens (`transitions.dev` & `emil-design-eng`)

Never use ad-hoc `transition: all 300ms`. Motion in KisanQueue is strictly tokenized:

```css
:root {
  /* Durations */
  --duration-micro:      80ms;   /* Shake segment, path draw delay */
  --duration-quick:      150ms;  /* Dropdown/modal close, text swap */
  --duration-fast:       250ms;  /* Dropdown/modal open, tabs sliding, page slide */
  --duration-medium:     350ms;  /* Card resize, toast dismiss */
  --duration-slow:       400ms;  /* Skeleton content reveal, panel open */

  /* Easing Curves */
  --ease-smooth-out:     cubic-bezier(0.22, 1, 0.36, 1); /* Natural deceleration */
  --ease-in-out:         cubic-bezier(0.77, 0, 0.175, 1); /* Movement across screen */
  --ease-bounce:         cubic-bezier(0.34, 1.36, 0.64, 1); /* Badge pop */
  --ease-drawer:         cubic-bezier(0.32, 0.72, 0, 1);  /* Mobile sheet slide */

  /* Scale & Blur Tokens */
  --scale-press:         0.97;   /* Instant responsive feedback on press */
  --scale-enter:         0.95;   /* Elements enter from scale 0.95 (NEVER scale 0) */
  --blur-crossfade:      2px;    /* Subtle blur to blend state swaps */
}
```

### Motion Decision Rules
1. **Never animate from `scale(0)`**: Start from `scale(0.95)` with `opacity: 0` so elements feel anchored.
2. **Press Feedback**: All interactive buttons & pass cards use `:active { transform: scale(0.97); transition: transform 160ms ease-out; }`.
3. **Number Pop-in for Live ETA & Queue Position**: When queue position changes from `#14 ➔ #13` or ETA shifts from `45m ➔ 135m`, digits transition vertically with `--blur-crossfade` and `--ease-smooth-out`.
4. **Origin-Aware Popovers**: Dropdowns expand from their trigger anchor point via `transform-origin: var(--transform-origin)`.
5. **Reduced Motion Guard**:
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 5. UI Component Specifications

### 1. The Interactive Pass Card (`KQ-1047`)
- **Large Token Callout**: `KQ-1047` centered in bold display type.
- **Dynamic Status Chip**: Animated live status with pulsating green or amber beacon.
- **Signed QR Code**: Rendered in SVG with 4px rounded quiet zone and high-contrast black on pure white.

### 2. The 2-Tap Officer Capacity Switcher
- Fixed persistent bar across the top of the officer screen.
- 5 large tap-targets (`Normal`, `Busy`, `Lifting Delay`, `Reduced`, `Paused`).
- Selecting "Lifting Delay" reveals an inline capacity slider (e.g., 60%) and auto-populates pre-set reasons (*"FCI truck late"*, *"Rain stoppage"*).
- Instant confirmation feedback via Sonner toast notification.

### 3. Skeleton Loading & Staggered Reveal
- Placeholders pulse subtly with `--ease-linear` shimmer.
- Real content reveals via staggered cards (40ms offset per item) to eliminate perceived load times.

---

## 6. Accessibility & Low-Literacy Usability (WCAG 2.1 AA)
* **Tri-Factor Status**: Status is NEVER conveyed by color alone. Every badge pairs **Color + Standard Icon + Localized Text** (e.g. `🟢 सामान्य / Normal`, `⚠️ उठान में देरी / Lifting Delayed`).
* **One-Handed Mobile Ergonomics**: All critical primary buttons (Pass Generation, QR expansion, Language toggle) reside in the bottom 40% of the screen.
* **Offline Stale Watermark**: Any cached data displays an unmistakable timestamp chip (*"Showing offline data from 10:15 AM"*).
