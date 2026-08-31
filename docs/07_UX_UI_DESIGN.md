# 07 — UX/UI Design & Modern Visual Architecture

> **Modern UI Stack**: [`skiperui`](https://skiper-ui.com), [`motion`](https://motion.dev) (formerly Framer Motion), [`bklit-ui`](https://bklit.dev), [`ascii-magic`](https://ascii-magic.com) / [`asciinator`](https://asciinator.app).  
> **Typography**: English (`Urbanist` + `Rustic Roadway`) · Hindi (`AMS Shikha` / `Manoja` + `Rozha One` / `Noto Sans Devanagari`).  
> **Curated Visual Assets**: `assets/images/hero_mandi.jpg`, `assets/images/assistant_avatar.jpg` (Zero generic template placeholders).

---

## 1. Information Architecture & Modern Component Topology

```text
Farmer Web & WhatsApp Assistant (Powered by Skiper UI + Motion)
├── Hero & Discovery (Cinematic Mandi Banner + ASCII Live Queue Matrix Ticker)
├── One-Time Onboarding (Language Select ➔ Phone/OTP ➔ Permanent Profile)
├── Conversational 1-Tap Pass Generator (Skiper UI Floating Modal + Motion Springs)
├── Live Digital Pass Screen (Token KQ-1047, HMAC QR Code, Vertical NumberPopIn ETA)
├── Post-Procurement Receipt & Payment (Bklit UI Transaction Summary)
└── Interactive WhatsApp Simulator (Krishi Mitra Avatar + Motion Bubble Physics)

Officer Mandi Console (Powered by Bklit UI + Skiper UI)
├── Mandi Real-Time Dashboard (Bklit UI Queue Throughput Graph & Live Arrivals)
├── Check-in Scanner (Camera QR Scanner + Constant-time HMAC Validator)
└── 2-Tap Capacity & Delay Controller (Persistent Top Strip with Instant WS Push)
```

---

## 2. Screen-by-Screen Specifications & Component Craft

### 1. Hero & Centre Discovery (`/`)
* **Visual Anchor**: Curated real photographic banner [`assets/images/hero_mandi.jpg`](file:///c:/Users/sneha/Music/KisanQueue/assets/images/hero_mandi.jpg) overlaid with subtle grain and golden morning gradient.
* **ASCII Live Queue Matrix**: Generated using `ascii-magic` / `asciinator` styling:
  ```text
  [/// LIVE MANDI FEED ///]  RAJGARH: 14 WAITING (45 MIN) | BIAORA: 6 WAITING (20 MIN)
  ```
* **Mandi Status Cards (Skiper UI)**:
  * Rendered in **Urbanist** bold for live numbers and **AMS Shikha / Manoja** for Hindi titles.
  * Interactive hover card lift (`--scale-press: 0.97`, `--ease-smooth-out`).
  * Live status beacon: `🟢 सामान्य / Normal`, `⚠️ उठान में देरी / Lifting Delayed`.

### 2. Progressive Pass Creation Dialog (Skiper UI Modal)
* **Trigger**: *"1-Tap Pass Generate"* button with rustic highway styling (`font-rustic-accent`).
* **Motion Physics**: Expands smoothly from button anchor using `Motion` spring physics (`stiffness: 300, damping: 25`).
* **Minimal Input**: Auto-fills registered farmer info; requests only Crop and Quantity (*quintals*).
* **Live Cost & ETA Preview**: Instant preview calculating arrival window before pass generation.

### 3. Digital Gate Pass & Live Queue Tracker (`/pass/KQ-1047`)
* **Token Identifier**: Bold `KQ-1047` in `Urbanist` (36px, `font-weight: 800`).
* **Cryptographic QR Code**: High-contrast black on pure white SVG, framed with wheat watermark pattern.
* **Vertical NumberPopIn**: When queue position shifts (`#14 ➔ #13`), digits animate vertically with a subtle 2px blur crossfade (`--blur-crossfade`).
* **Delay Alert Banner**: Expandable accordion explaining delay causes with full officer notes.

### 4. Officer Mandi Console (`/officer`)
* **Throughput & Capacity Graphs (Bklit UI)**: Real-time visual graphs displaying hourly farmer processing rates, truck lifting capacity, and queue backlog trends.
* **2-Tap Delay Controller**: Persistent header controls to update capacity factor ($F = 0.60$) in 2 taps, immediately firing WebSocket events to all connected farmers.

### 5. In-App WhatsApp Assistant Simulator (`/whatsapp-demo`)
* Features the **Krishi Mitra** visual avatar [`assets/images/assistant_avatar.jpg`](file:///c:/Users/sneha/Music/KisanQueue/assets/images/assistant_avatar.jpg).
* Fluid chat bubbles rendered with **Motion** stagger animation and typing indicators.

---

## 3. Bilingual Typographic Guide

```html
<!-- English Display & Body -->
<h1 class="font-['Urbanist'] font-bold text-3xl text-slate-900">Rajgarh Procurement Centre</h1>
<span class="font-rustic-accent uppercase text-amber-700 text-sm">Govt. MSP Admission Gate</span>

<!-- Hindi Display & Body -->
<h1 class="font-hindi-hero font-bold text-3xl text-emerald-950">राजगढ़ उपार्जन केंद्र</h1>
<p class="font-['Noto_Sans_Devanagari'] text-base text-slate-700">वर्तमान प्रतीक्षा समय: ~45 मिनट</p>
```

---

## 4. Visual Asset Management

All UI screens consume local, pre-rendered assets located in [`assets/images/`](file:///c:/Users/sneha/Music/KisanQueue/assets/images/):
1. `hero_mandi.jpg`: High-resolution photograph for landing banner & centre headers.
2. `assistant_avatar.jpg`: High-resolution Krishi Mitra avatar for assistant headers.
3. SVG Icons: Strict use of `lucide-react` with 2px stroke width.
