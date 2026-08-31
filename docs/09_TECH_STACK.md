# 09 — Tech Stack, Modern UI Tooling & Visual Assets

> **Referenced Modern Libraries**: [`reactbits.dev`](https://reactbits.dev), [`skiperui`](https://skiper-ui.com), [`motion`](https://motion.dev) (formerly Framer Motion), [`bklit-ui`](https://bklit.dev), [`ascii-magic`](https://ascii-magic.com) / [`asciinator`](https://asciinator.app).  
> **Brand Color Palette**: **Almond** (`#D6BD98`) · **Matcha Brew** (`#677D6A`) · **Forest Roast** (`#40534C`) · **Eclipse** (`#1A3636`).  
> **Typography System**: English (`Urbanist` + `Rustic Roadway`) · Hindi (`AMS Shikha` / `Manoja` + `Noto Sans Devanagari`).  
> **Curated Visual Assets**: `assets/images/hero_mandi.jpg`, `assets/images/assistant_avatar.jpg`.

---

## Decision Summary

| Layer | Choice | Alternatives Considered | Why Chosen |
|---|---|---|---|
| **Frontend Framework** | React 18+ + Vite + TypeScript | Next.js, Vue 3, Svelte | Instant local HMR, lightweight bundle, zero SSR hydration overhead. Perfect for low-latency client rendering over REST/WS. |
| **Component Primitives** | **Skiper UI** + **React Bits (`reactbits.dev`)** | Material UI, AntD, Chakra | Tailored, high-craft UI components (floating cards, spotlight borders, grain canvas, text decoding). |
| **Animation & Physics** | **Motion (`motion/react`)** + `transitions.dev` Tokens | Vanilla CSS, Anime.js | Hardware-accelerated GPU spring physics, layout animations, exit transitions. |
| **Data Visualization** | **Bklit UI** Charts | Recharts, Chart.js, D3 | Clean, modern analytics graphs for Mandi hourly throughput and capacity factors. |
| **ASCII Effects & Motion** | **ascii-magic / asciinator** | Canvas2D raw text | Retro-modern live queue matrix ticker and animated ASCII grain flow shaders. |
| **Typography System** | English: `Urbanist` + `Rustic Roadway`<br>Hindi: `AMS Shikha` / `Manoja` | Generic system fonts | High-contrast bilingual pairing balancing modern precision with authentic rural grounding. |
| **State & Cache** | TanStack Query v5 + Zustand (`persist`) | Redux Toolkit, MobX | TanStack Query handles server sync; Zustand provides persistent storage for one-time farmer profile. |
| **Notifications & Toasts** | Sonner (`ask-sonner`) + Lucide Icons | React-Toastify | Frictionless imperative API, origin-aware stacking, elegant swipe-to-dismiss. |
| **Backend Runtime** | Python 3.11+ + FastAPI (Modular Monolith) | Node/Express, Go, Django | Native async event loop, automatic OpenAPI 3.1 schema generation, sub-millisecond in-process ETA computation. |
| **ORM & Database Driver** | SQLAlchemy 2.0 (Async) + `asyncpg` | Tortoise ORM, Prisma | Industry-standard async DB access, robust connection pooling, full relational integrity enforcement. |
| **Database** | PostgreSQL (Supabase / Render Managed) | MongoDB, SQLite | Relational model guarantees foreign key constraints, partial unique indexes for active queues, and JSONB audit trails. |
| **Realtime Engine** | Native FastAPI WebSockets | Socket.io, SSE, Supabase Realtime | Lightweight bidirectional communication with sub-2s latency, custom connection manager, and zero external service cost. |
| **Cryptographic Tokens** | HMAC-SHA256 (`hashlib` / `hmac`) | RSA, Asymmetric PKI | Fast, tamper-proof, day-scoped QR tokens with constant-time verification (`hmac.compare_digest`). |
| **Testing Suite** | Pytest-Asyncio (Backend) + Vitest & Playwright (Frontend) | Jest, Cypress | Fast parallel execution, automated WCAG 2.1 AA accessibility auditing with `@axe-core/playwright`. |

---

## Front-End Package Manifest (`package.json`)

```json
{
  "dependencies": {
    "@tanstack/react-query": "^5.28.0",
    "clsx": "^2.1.0",
    "motion": "^11.11.0",
    "i18next": "^23.10.0",
    "lucide-react": "^0.359.0",
    "qrcode.react": "^3.1.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-hook-form": "^7.51.0",
    "react-i18next": "^14.1.0",
    "react-router-dom": "^6.22.0",
    "sonner": "^1.4.0",
    "tailwind-merge": "^2.2.0",
    "zod": "^3.22.0",
    "zustand": "^4.5.0"
  },
  "devDependencies": {
    "@axe-core/playwright": "^4.8.0",
    "@playwright/test": "^1.42.0",
    "@testing-library/react": "^14.2.0",
    "@types/react": "^18.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.4.0",
    "vite": "^5.1.0",
    "vitest": "^1.4.0"
  }
}
```
