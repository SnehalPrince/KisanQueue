# 07 — UX/UI Design & Brand Aesthetics

> **Official Brand Palette**: **Almond** (`#D6BD98`) · **Matcha Brew** (`#677D6A`) · **Forest Roast** (`#40534C`) · **Eclipse** (`#1A3636`).  
> **Component Libraries**: [`reactbits.dev`](https://reactbits.dev), [`skiperui`](https://skiper-ui.com), [`motion`](https://motion.dev), [`bklit-ui`](https://bklit.dev), [`ascii-magic`](https://ascii-magic.com) / [`asciinator`](https://asciinator.app).  
> **Typography**: English (`Urbanist` + `Rustic Roadway`) · Hindi (`AMS Shikha` / `Manoja` + `Noto Sans Devanagari`).  
> **Curated Visual Assets**: `assets/images/hero_mandi.jpg`, `assets/images/assistant_avatar.jpg`.

---

## 1. Information Architecture & Modern Component Topology

```text
Farmer Web & WhatsApp Assistant (Powered by Skiper UI + React Bits + Motion)
├── Hero & Discovery (Cinematic Mandi Banner + GrainOverlay + ASCII Live Matrix)
├── One-Time Onboarding (Language Select ➔ Phone/OTP ➔ Permanent Profile)
├── Conversational 1-Tap Pass Generator (Skiper UI Floating Modal + Motion Springs)
├── Live Digital Pass Screen (React Bits DecryptedText Token KQ-1047, HMAC QR Code, SpotlightCard)
├── Post-Procurement Receipt & Payment (Bklit UI Transaction Summary)
└── Interactive WhatsApp Simulator (Krishi Mitra Avatar + Motion Bubble Physics)

Officer Mandi Console (Powered by Bklit UI + Skiper UI + React Bits)
├── Mandi Real-Time Dashboard (Bklit UI Forest Roast/Matcha Queue Throughput Graph)
├── Check-in Scanner (Camera QR Scanner + Constant-time HMAC Validator)
└── 2-Tap Capacity & Delay Controller (Persistent Top Strip with Instant WS Push)
```

---

## 2. Screen-by-Screen Specifications & Component Craft

### 1. Hero & Centre Discovery (`/`)
* **Visual Anchor**: Curated photographic banner [`assets/images/hero_mandi.jpg`](file:///c:/Users/sneha/Music/KisanQueue/assets/images/hero_mandi.jpg) enhanced with **React Bits `GrainOverlay`** and an Almond (`#D6BD98`) to Eclipse (`#1A3636`) atmospheric overlay.
* **ASCII Live Queue Matrix (`ascii-magic` / `asciinator`)**:
  ```text
  [/// LIVE MANDI FEED ///]  RAJGARH: 14 WAITING (45 MIN) | BIAORA: 6 WAITING (20 MIN)
  ```
* **Mandi Status Cards (React Bits `SpotlightCard` + Skiper UI)**:
  * Styled with warm neutral card surfaces (`#FFFFFF`), subtle Matcha Brew (`#677D6A`) borders, and Eclipse (`#1A3636`) headings.
  * Interactive hover card lift and soft cursor spotlight (`--scale-press: 0.97`, `--ease-smooth-out`).
  * Live status beacon: `🟢 सामान्य / Normal` (Forest Roast/Matcha), `⚠️ उठान में देरी / Lifting Delayed` (Almond/Terracotta).

### 2. Progressive Pass Creation Dialog (Skiper UI Modal)
* **Trigger**: *"1-Tap Pass Generate"* button styled with rustic highway accents (`font-rustic-accent`, Eclipse background with Almond border).
* **Motion Physics**: Expands smoothly from button anchor using `Motion` spring physics (`stiffness: 300, damping: 25`).
* **Minimal Input**: Auto-fills registered farmer info; requests only Crop and Quantity (*quintals*).
* **Live Cost & ETA Preview**: Instant preview calculating arrival window before pass generation.

### 3. Digital Gate Pass & Live Queue Tracker (`/pass/KQ-1047`)
* **Token Identifier**: Animated decode with **React Bits `DecryptedText`** revealing `KQ-1047` in `Urbanist` 800.
* **Spotlight Pass Container**: Encased in **React Bits `SpotlightCard`** with warm Almond glow borders.
* **Cryptographic QR Code**: High-contrast black on pure white SVG, framed with an Almond (`#D6BD98`) wheat watermark pattern.
* **Vertical NumberPopIn**: When queue position shifts (`#14 ➔ #13`), digits animate vertically with a subtle 2px blur crossfade (`--blur-crossfade`).
* **Delay Alert Banner**: Expandable accordion explaining delay causes with full officer notes.

### 4. Officer Mandi Console (`/officer`)
* **Throughput & Capacity Graphs (Bklit UI)**: Real-time visual graphs in Matcha Brew (`#677D6A`) and Forest Roast (`#40534C`) displaying hourly farmer processing rates and truck lifting capacity.
* **2-Tap Delay Controller**: Segmented bar in Eclipse (`#1A3636`) with active Almond (`#D6BD98`) indicators to update capacity factor ($F = 0.60$) in 2 taps, immediately firing WebSocket events to all connected farmers.

### 5. In-App WhatsApp Assistant Simulator (`/whatsapp-demo`)
* Features the **Krishi Mitra** visual avatar [`assets/images/assistant_avatar.jpg`](file:///c:/Users/sneha/Music/KisanQueue/assets/images/assistant_avatar.jpg).
* Fluid chat bubbles in Almond (`#D6BD98`) for user messages and Matcha Brew (`#677D6A`) for assistant responses, powered by **Motion** stagger animations.

---

## 3. Bilingual Typographic Guide

```html
<!-- English Display & Body -->
<h1 class="font-['Urbanist'] font-bold text-3xl text-[#1A3636]">Rajgarh Procurement Centre</h1>
<span class="font-rustic-accent uppercase text-[#D6BD98] text-sm">Govt. MSP Admission Gate</span>

<!-- Hindi Display & Body -->
<h1 class="font-hindi-hero font-bold text-3xl text-[#1A3636]">राजगढ़ उपार्जन केंद्र</h1>
<p class="font-['Noto_Sans_Devanagari'] text-base text-[#40534C]">वर्तमान प्रतीक्षा समय: ~45 मिनट</p>
```
