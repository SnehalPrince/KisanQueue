# 09 — Tech Stack & Tooling

> **Referenced Agent Skills**: [`fastapi-templates`](../.agents/skills/fastapi-templates/SKILL.md), [`transitions-dev`](../.agents/skills/transitions-dev/SKILL.md), [`emil-design-eng`](../.agents/skills/emil-design-eng/SKILL.md), [`react-state-management`](../.agents/skills/react-state-management/SKILL.md), [`security-and-hardening`](../.agents/skills/security-and-hardening/SKILL.md).

---

## Decision Summary

| Layer | Choice | Alternatives Considered | Why Chosen |
|---|---|---|---|
| **Frontend Framework** | React 18+ + Vite + TypeScript | Next.js, Vue 3, Svelte | Instant local HMR, lightweight bundle, zero SSR hydration overhead. Perfect for low-latency client rendering over REST/WS. |
| **Design & UI Motion** | Tailwind CSS + `transitions.dev` Tokens + `framer-motion` | Material UI, AntD, Chakra | Tailored, non-generic craft aesthetics. Tokenized motion scale (`--duration-*`, `--ease-smooth-out`) ensures 60 FPS hardware acceleration on budget mobile devices. |
| **Frontend State & Cache** | TanStack Query v5 + Zustand (Persist) | Redux Toolkit, MobX | TanStack Query handles server state & automatic revalidation; Zustand provides lightweight, persistent storage for one-time farmer profile data. |
| **Notifications & Toasts** | Sonner (`ask-sonner`) + Lucide Icons | React-Toastify, Radix Toast | Frictionless imperative API, origin-aware stacking, elegant swipe-to-dismiss. |
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
    "framer-motion": "^11.0.0",
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

---

## Backend Package Manifest (`requirements.txt`)

```text
fastapi>=0.110.0
uvicorn[standard]>=0.28.0
pydantic>=2.6.0
pydantic-settings>=2.2.0
sqlalchemy[asyncio]>=2.0.28
asyncpg>=0.29.0
alembic>=1.13.0
python-jose[cryptography]>=3.3.0
passlib[bcrypt]>=1.7.4
qrcode[pil]>=7.4.2
structlog>=24.1.0
slowapi>=0.1.9
websockets>=12.0
pytest>=8.1.0
pytest-asyncio>=0.23.0
httpx>=0.27.0
```
