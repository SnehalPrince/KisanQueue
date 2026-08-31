# 08 — Design System, Palette & Motion Engineering

> **Referenced UI Libraries**: [`reactbits.dev`](https://reactbits.dev), [`skiperui`](https://skiper-ui.com), [`motion`](https://motion.dev) (formerly Framer Motion), [`bklit-ui`](https://bklit.dev), [`ascii-magic`](https://ascii-magic.com) / [`asciinator`](https://asciinator.app).  
> **Referenced Agent Skills**: [`emil-design-eng`](../.agents/skills/emil-design-eng/SKILL.md), [`transitions-dev`](../.agents/skills/transitions-dev/SKILL.md), [`impeccable`](../.agents/skills/impeccable/SKILL.md), [`visual-design-foundations`](../.agents/skills/visual-design-foundations/SKILL.md), [`wcag-audit-patterns`](../.agents/skills/wcag-audit-patterns/SKILL.md).

---

## 1. Official Brand Color Palette

KisanQueue uses a curated, earthy agricultural palette blending natural grain tones with deep organic forest hues:

<div align="center">

| Color Name | HEX Code | RGB | Semantic Role |
|---|---|---|---|
| 🌰 **Almond** | `#D6BD98` | `rgb(214, 189, 152)` | Warm wheat accent, highlight borders, pass badges, golden harvest accents |
| 🍵 **Matcha Brew** | `#677D6A` | `rgb(103, 125, 106)` | Organic sage green, secondary buttons, success chips, subtle card borders |
| 🌲 **Forest Roast** | `#40534C` | `rgb(64, 83, 76)` | Deep earthy slate green, card headers, secondary surfaces, active tabs |
| 🌑 **Eclipse** | `#1A3636` | `rgb(26, 54, 54)` | Deep obsidian forest, primary brand anchor, navbar, hero headers, dark mode canvas |

</div>

```css
:root {
  /* Core Brand Tokens */
  --palette-almond:       #D6BD98;
  --palette-matcha:       #677D6A;
  --palette-forest:       #40534C;
  --palette-eclipse:      #1A3636;

  /* Extended Surface & Background Tones */
  --color-bg-base:        #F9F8F5; /* Warm almond-tinted anti-glare canvas */
  --color-bg-surface:     #FFFFFF; /* Pure card canvas */
  --color-bg-muted:       #EFECE6; /* Subtle almond warm grey */
  --color-border:         #D8D3C8; /* Organic border */

  /* Text Contrast Hierarchy */
  --color-text-primary:   #1A3636; /* Eclipse - deep, crisp reading contrast */
  --color-text-secondary: #40534C; /* Forest Roast - secondary descriptions */
  --color-text-muted:     #677D6A; /* Matcha Brew - subtle timestamps & metadata */
  --color-text-accent:    #9A7B4F; /* Darker Almond for legible text on light cards */

  /* Semantic Mandi Status (Earthy Tone Harmonized) */
  --status-normal:        #40534C; /* Forest Roast / Sage */
  --status-normal-bg:     #E8EFE9;
  --status-busy:          #B8860B; /* Harvest Dark Gold */
  --status-busy-bg:       #FAF3E0;
  --status-delayed:       #C86D3B; /* Terracotta Orange */
  --status-delayed-bg:    #FBEDE4;
  --status-paused:        #A33B3B; /* Deep Brick Crimson */
  --status-paused-bg:     #FCE8E8;
  --status-stale:         #677D6A; /* Matcha Grey */
  --status-stale-bg:      #F0F3F1;
}

/* Dark Mode Tokens */
.dark {
  --color-bg-base:        #122222; /* Deepest Forest */
  --color-bg-surface:     #1A3636; /* Eclipse surface */
  --color-bg-muted:       #244444; /* Elevated container */
  --color-border:         #40534C; /* Forest Roast borders */

  --color-text-primary:   #F9F8F5; /* Warm cream */
  --color-text-secondary: #D6BD98; /* Almond */
  --color-text-muted:     #9FB2A2; /* Soft Matcha */
}
```

---

## 2. Modern UI & Visual Craft Libraries

* **React Bits (`reactbits.dev`)**:
  * **Interactive Backgrounds**: `GridDistortion` and `Particles` for subtle agricultural ambient canvas; `GrainOverlay` for tactile paper realism.
  * **Text Animations**: `SplitText`, `BlurText`, and `DecryptedText` for live token code decoding (`KQ-1047`) and dynamic status reveal.
  * **Micro-Components**: `MagneticButton`, `ShinyText`, `GlowBorder` cards, and `SpotlightCard` for elevated mandi cards.
* **Skiper UI**: Creative floating modals, action drawers, and responsive sheet primitives.
* **Motion (`motion/react`)**: Spring layout animations, number pop-in transitions, and gesture drag physics.
* **Bklit UI**: High-polish analytics charts for hourly grain throughput and mandi capacity factors.
* **ASCII Magic / Asciinator**: Terminal-grade live queue matrix status ticker and grain flow shaders.

---

## 3. Bilingual Typography & Font Pairings

* **English Primary & Numerical Display**: `Urbanist` (Modern geometric sans-serif for numbers, display & body)
* **English Rustic Display Accent**: `Rustic Roadway` (with fallbacks `Rye`, `Rubik Dirt`, `Cinzel Decorative` for mandi gate badges & highway logistics)
* **Hindi Display & Headers**: `AMS Shikha` / `Manoja` (with web-safe fallbacks: `Rozha One`, `Yatra One`, `Tiro Devanagari Hindi`, `Noto Sans Devanagari`)

```css
@import url('https://fonts.googleapis.com/css2?family=Urbanist:ital,wght@0,300..900;1,300..900&family=Rozha+One&family=Yatra+One&family=Noto+Sans+Devanagari:wght@400;500;600;700;800&display=swap');

:root {
  --font-en-sans: 'Urbanist', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-en-rustic: 'Rustic Roadway', 'Rye', 'Rubik Dirt', serif;
  --font-hi-display: 'AMS Shikha', 'Manoja', 'Rozha One', 'Yatra One', serif;
  --font-hi-sans: 'Noto Sans Devanagari', 'Urbanist', sans-serif;
}

.font-rustic-accent {
  font-family: var(--font-en-rustic);
  letter-spacing: 0.04em;
}

.font-hindi-hero {
  font-family: var(--font-hi-display);
  letter-spacing: 0.01em;
}
```

---

## 4. Motion Engineering & Micro-Interactions

### 1. Motion Tokens (`transitions.dev` & `Motion`)
```css
:root {
  --duration-micro:      80ms;   /* Tap feedback, button press */
  --duration-quick:      150ms;  /* Dropdown/modal close, text swap */
  --duration-fast:       250ms;  /* Tabs sliding, card expansion */
  --duration-medium:     350ms;  /* Toast dismiss, modal morph */
  --duration-slow:       400ms;  /* ASCII stream, panel slide */

  --ease-smooth-out:     cubic-bezier(0.22, 1, 0.36, 1);
  --ease-in-out:         cubic-bezier(0.77, 0, 0.175, 1);
  --ease-bounce:         cubic-bezier(0.34, 1.36, 0.64, 1);

  --scale-press:         0.97;
  --scale-enter:         0.95;
  --blur-crossfade:      2px;
}
```

### 2. React Bits Component Integrations
```tsx
// Example: React Bits DecryptedText for live Pass token generation
import { DecryptedText } from '@/components/reactbits/DecryptedText';
import { SpotlightCard } from '@/components/reactbits/SpotlightCard';

export function DigitalPassToken({ tokenCode }: { tokenCode: string }) {
  return (
    <SpotlightCard spotlightColor="rgba(214, 189, 152, 0.25)" className="rounded-3xl border border-[#D6BD98] p-6 bg-white">
      <div className="font-mono text-xs uppercase tracking-widest text-[#677D6A]">Verified Gate Pass</div>
      <div className="font-['Urbanist'] text-4xl font-extrabold text-[#1A3636] mt-1">
        <DecryptedText text={tokenCode} speed={40} maxIterations={12} animateOn="view" revealDirection="start" />
      </div>
    </SpotlightCard>
  );
}
```

---

## 5. Curated Visual Assets

* `assets/images/hero_mandi.jpg`: High-detail photograph of modern Indian procurement mandi at sunrise.
* `assets/images/assistant_avatar.jpg`: Krishi Mitra Assistant Avatar in organic green and almond kurta.
