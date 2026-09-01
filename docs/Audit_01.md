# KisanQueue — Repository Audit

**Audited commit:** `c77b1f1` (HEAD, "feat: implement responsive SiteHeader component...")
**Method:** Full clone + `npm install`, `tsc -b`, `oxlint`, `vitest run`, `vite build`, plus manual code read of stores, services, routing, and CI config.
**Scope:** This audits the code as it exists today against the docs in `/docs` and the README. It does not re-litigate product/market strategy — see `docs/KisanQueue_Validation_Report.md` for that.

---

## 1. Executive Summary

The README's own badge ("Blueprint Complete") is accurate and honest — this repo is currently a **fully-designed, partially-built frontend-only prototype**, not the full-stack system the `/docs` folder specifies. Concretely:

- **Frontend**: substantial, builds clean, all 66 tests pass, no lint errors. This is real, usable progress.
- **Backend**: **does not exist.** No FastAPI app, no database, no WebSocket server, no auth server — despite 30 docs describing one in detail (SQLAlchemy, Supabase, Render deployment, Alembic migrations, etc.).
- **"Live" queue / real-time**: currently a **single-browser Zustand store with localStorage persistence**, not a real-time multi-device system. It will look "live" in a demo only if farmer and officer views are driven from the same browser/tab session.
- **WhatsApp bot**: **0% implemented.** It's a button that shows a toast saying "will be available in the next update."
- **Auth**: both farmer OTP and officer login are unguarded demo stubs (static OTP `1234`; officer login ignores the password field entirely).
- **Repo hygiene**: 47MB of the 78MB repo is an unrelated AI-agent skills library (`.agents/skills/`, 2,524 files covering everything from WooCommerce to DeFi to Kotlin) that appears to have been committed by accident and has nothing to do with KisanQueue.

None of this means the project is in bad shape for where it says it is — Phase 0 per `docs/29_ROADMAP.md` explicitly targets "7 hours build + demo," and a polished, well-tested frontend prototype with mocked data is a completely reasonable Phase 0 deliverable. The risk is **narrative drift**: several docs describe Phase-0 features in the past tense ("Delivered") that are actually still Phase-1/Phase-2 work. Before a pitch or demo, that gap needs to be either closed in code or corrected in the docs so nobody promises something on stage that isn't in the repo.

---

## 2. What's Actually Done

### Frontend application (`frontend/src`)
- Vite + React 18 + TypeScript, builds cleanly (`tsc -b && vite build` succeeds, 1913 modules, 1.7s build).
- Full route set implemented and wired: Landing → Onboarding → Farmer Home → Centre Discovery → Centre Detail → Sell Crop flow → Digital Pass (QR) → Live Queue → Procurement Receipt → Payment Status, plus a separate Officer Login → Officer Dashboard flow. That's essentially the entire farmer + officer journey from the original pitch, as real, navigable UI.
- State management: Zustand (`app-store.ts` for auth/language, `queue-live-store.ts` for queue/procurement/officer state), both with `persist` middleware.
- Mock service layer (`services/mock/`) cleanly separated behind interfaces that are explicitly commented as swappable for a real REST/WebSocket backend later (`auth-service.ts`, `centre-service.ts`, `queue-service.ts` + fixtures) — this is good forward design even though the real backend doesn't exist yet.
- Bilingual support via `i18next`/`react-i18next` plus a large hand-written copy dictionary (`lib/copy.ts`, 325 lines) — Hindi is the default language (`language: 'hi'` in the store), matching the accessibility-first framing from the product research.
- ETA calculation logic (`lib/eta.ts`) implements the backlog-aware formula discussed earlier (`ceil(N × T_base / (C × F))`), with a capacity factor the officer can change — this closes the loop on the "honest ETA under backlog" recommendation from the validation report.
- QR generation via `qrcode.react` on the Pass page.
- Officer "2-Tap Capacity" condition update (Normal / Busy / Lifting Delayed / Paused), which drives the ETA multiplier live.
- Accessibility-conscious touches: skip-link tested explicitly (`LandingPage.test.tsx`), `@axe-core/playwright` installed for a11y testing, focus-trap logic in `SellCropModal`.
- **Test coverage**: 9 test files, 66 tests, all passing — covering Landing, Onboarding, Officer Console, Queue Page, procurement/payment pages, and the mock auth/centre/queue services directly. This is a real, non-trivial safety net for a hackathon-stage project.
- **Lint**: 0 errors, 5 warnings (all React-hooks-adjacent, see §4).

### Documentation (`docs/`, 30 files, ~300KB)
- Genuinely thorough: PRD, personas, user flows, feature spec, MVP scope, UX/design system, tech stack, system/frontend/backend architecture, DB schema, API spec, real-time queue design, ETA engine, WhatsApp integration spec, QR token design, auth/RBAC/security, notifications, integration strategy, mock data plan, error handling, testing strategy, deployment, env vars, demo script, pitch narrative, roadmap, and a 34-question open-questions log with stated assumptions and validation plans per question.
- This is unusually good documentation discipline for a student hackathon repo — better than most production side-projects. It reads as a complete spec for the system in `/docs`, which is currently ahead of the code.

---

## 3. What Remains (Backend Reality Check)

This is the single biggest gap. `docs/09_TECH_STACK.md`, `10_SYSTEM_ARCHITECTURE.md`, `12_BACKEND_ARCHITECTURE.md`, `13_DATABASE_SCHEMA.md`, `14_API_SPECIFICATION.md`, `15_REALTIME_QUEUE.md`, and `25_DEPLOYMENT.md` all describe a FastAPI + SQLAlchemy (async) + PostgreSQL/Supabase + WebSocket backend, deployed on Render. **None of this exists in the repository.**

Confirmed by:
```
find . -iname "*backend*" -not -path "./docs/*" -not -path "*/node_modules/*"
→ only .agents/skills/*-backend-* (generic skill docs, not project code)
```
- No `backend/` directory, no `requirements.txt`, no `main.py`, no models, no migrations.
- The GitHub Actions CI (`.github/workflows/ci.yml`) already has a `backend` job wired up (`pytest backend/tests`, `pip install -r backend/requirements.txt`) — but it's guarded by `if [ -f ... ]` / `if [ -d ... ]` checks, so it currently runs as a silent no-op rather than failing. That's a ticking time bomb: it *looks* like backend CI is green because there's a passing job, but it isn't testing anything.

**Concretely still to build**, in the order the docs imply:
1. FastAPI app skeleton + DB models matching `13_DATABASE_SCHEMA.md`.
2. Real auth (JWT issuance/verification) replacing the mock OTP=`1234` flow.
3. Real WebSocket (or polling) channel for queue/ETA updates, replacing the shared-localStorage simulation.
4. QR token signing/verification service (`18_QR_TOKEN_SYSTEM.md` specifies HMAC-SHA256 — not implemented anywhere in code yet).
5. WhatsApp adapter — even the "simulated/in-app mock" version described in the original pitch doc doesn't exist yet; today it's a disabled button, not a mock conversation.
6. Officer dashboard talking to a real API instead of a client-only Zustand store.
7. Deployment config (Render/Supabase env wiring per `25_DEPLOYMENT.md`, `26_ENVIRONMENT_VARIABLES.md`) — none of this is present; there's no `Dockerfile`, `render.yaml`, or backend `.env.example`.

Until at least a thin version of 1–3 exists, "real-time queue management" and "SMS/app notifications" — two of the five capabilities literally named in PS 26032 — are simulated, not built.

---

## 4. Current Code Issues (Functional / Architectural)

These are things that will misbehave or mislead in a live demo or code review, ranked roughly by how likely they are to bite you.

1. **"Live" queue is not actually live across devices.** `queue-live-store.ts` is a Zustand store persisted to `localStorage`. There is no `BroadcastChannel`, no `storage` event listener, and no server — confirmed by grep (`grep -rn "WebSocket|BroadcastChannel|storage event" src/` returns nothing outside comments). If you demo farmer view and officer view in **two separate browser tabs of the same browser**, they will *not* sync live unless you manually refresh, because Zustand's `persist` middleware doesn't push cross-tab updates by default. If you demo them in **two different devices** (e.g., judge's phone as "farmer," your laptop as "officer"), there is currently no mechanism at all connecting them. **This is the single highest-risk item for your demo** — verify exactly how you plan to show "farmer sees officer's update live" before presenting, because the current code doesn't support the two-device version of that story.

2. **Officer login doesn't check the password.** `queue-live-store.ts::loginOfficer(username)` takes only a username and matches on `username === 'officer_rajgarh' || username.includes('rajgarh') || username === 'Demo@1234'`. The password field in `OfficerLoginPage.tsx` is captured in state and never passed to or checked by `loginOfficer` at all. Functionally this means **any username containing "rajgarh" logs in**, and the password box is decorative. Fine for a demo stub, but should be labeled as such (or fixed) rather than left silently broken.

3. **No route guards anywhere.** `routes/index.tsx` has zero auth-protected routes. `/officer/dashboard` and `/home` are reachable by typing the URL directly, with no redirect to login. `OfficerDashboardPage` even has a **hardcoded fallback name** (`officerUser?.name || 'Officer Suresh Patel'`) that quietly displays demo data instead of bouncing an unauthenticated visitor to `/officer`. Same risk on the farmer side. Not a security issue at this stage (everything is mock data), but it means the "auth-gated" story in the pitch isn't actually enforced in the UI.

4. **Auth/session desync risk on refresh.** `app-store.ts` (persisted) can hold a logged-in farmer/token from a previous session, while `MockAuthService.farmers` (in `auth-service.ts`) is an **in-memory `Map` that resets on every page load** and is only seeded with the fixture farmers. A newly-registered farmer who refreshes the page will appear "logged in" (per the persisted store) but won't exist if anything calls `authService.getProfile()` again. Currently nothing in the visible flow seems to trigger that call post-login, so it may not surface as a visible bug today — but it's a latent inconsistency between the two state layers that will bite the moment someone wires a "refresh profile" call.

5. **`aadhaarLast4` is collected and persisted to `localStorage`** via `CreateProfileRequest`/`FarmerProfile` and the persisted `app-store`. This directly contradicts the "No unnecessary Aadhaar storage" ethical-design principle from the original product doc. It's a demo field with fake data today, but if real Aadhaar digits are ever typed into this form during a live pilot, they'd sit in browser localStorage in plaintext with no expiry — worth deciding now whether this field survives past the mock stage.

6. **CI doesn't run lint or tests.** `.github/workflows/ci.yml`'s `frontend` job only runs `npm run build`. It does not run `oxlint` or `vitest run`, so a PR that breaks 20 tests or introduces new lint errors will still show a green check. Given you already have 66 passing tests, this is a quick, high-value fix.

---

## 5. Code Quality Issues (Non-blocking but worth fixing)

- **5 lint warnings**, all React-hooks-adjacent (`oxlint` React plugin):
  - `OnboardingPage.tsx:248` — reading `profileDataRef.current.name` during render (ref access during render, not just in effects/handlers).
  - `SellCropModal.tsx:373` — `setState` called synchronously inside a `useEffect`, which can trigger a cascading re-render; the linter suggests deriving the value during render or updating from the triggering event instead.
  - `SmoothScrollProvider.tsx` — two instances of reading `lenisRef.current` during render, plus one `only-export-components` warning (a non-component hook, `useSmoothScroll`, is exported from a component file, which breaks Fast Refresh for that file).
  - None of these are errors and none currently break functionality, but they're the kind of thing that causes intermittent, hard-to-reproduce UI glitches later — worth a cleanup pass.

- **npm audit: 6 vulnerabilities (1 critical, 1 high, 4 moderate)**, all coming from two chains:
  - `esbuild ≤0.24.2` (via `vite`/`vitest`'s dev-server) — moderate: allows any website to send requests to the dev server and read the response. Dev-only risk, not present in production build, but still worth upgrading (`vitest@4` pulls a fixed version, though it's a breaking change).
  - `react-router 6.0.0–7.17.0` — moderate: an open-redirect bypass and an arbitrary-constructor-injection issue in SSR hydration (not currently using SSR, so the second one is likely inert here, but the open-redirect one is relevant to any `<Link>`/`useNavigate` usage).
  - Fix available via `npm audit fix --force`, but it's a breaking major-version bump for both `vitest` and `react-router-dom` — budget real regression-testing time before taking it, not something to run blind right before a demo.

- **Build output is a single 589KB JS chunk** (171KB gzipped), and Vite's own build output flags it: "Some chunks are larger than 500 kB after minification." No route-based code splitting (`React.lazy`) is used anywhere despite there being 11 distinct pages — an easy win once the app stabilizes, low priority before the hackathon deadline.

- **Vite config uses a deprecated pattern** (`__dirname` in `vite.config.ts`) that Vite's own build already warns will stop being supported by default in a future major version. One-line fix (`import.meta.dirname`), not urgent.

- **`index.css` is 96KB** — unusually large for a Tailwind-based project (Tailwind projects are normally small hand-written CSS plus generated utility classes at build time, not a large hand-authored file). Worth a quick check on whether this is expected (e.g. custom design tokens/animations) or accidental duplication/unused legacy CSS carried over between UI-library experiments (the git log shows multiple UI-library integration commits — "React Bits," "Skiper UI," "Bklit UI" — which is a plausible source of leftover unused CSS).

---

## 6. Repository Hygiene

- **`.agents/skills/` is 47MB and 2,524 files — 60% of the entire repo size — and is unrelated to KisanQueue.** It contains generic AI coding-agent skill packs for dozens of unrelated stacks: `defi-protocol-templates`, `woocommerce`, `kotlin-development`, `transformers-huggingface`, `spark-memory-thermal-ops`, `ionic`, `chrome-extension-development`, and many more. This looks like an AI coding assistant's local skills/tooling directory that got committed by accident rather than gitignored. **Recommend removing this from git history** (or at minimum from HEAD + adding to `.gitignore`) before sharing the repo publicly or with judges — right now, over half of what someone clones is irrelevant tooling, which both bloats clone time and looks unpolished if anyone browses the repo tree.
- `frontend/artifacts/` (3.4MB of PNG screenshots) and `assets/images/` (3.6MB) are committed binary assets. Reasonable for a small number of hero/demo images, but worth keeping an eye on repo size growth if more screenshots get added per feature commit — consider a `docs/screenshots` convention with compressed images, or Git LFS if this grows.
- `.gitignore` already correctly excludes `.env`, `__pycache__/`, `*.db`, `*.sqlite3`, `.venv/` — sensible and forward-looking for when the backend actually gets added. No secrets or `.env` files were found tracked in git (only a `.env.example` inside the unrelated `.agents/skills/gstack` folder, which itself shouldn't be there — see above).
- No `LICENSE` conflicts noticed; `CODE_OF_CONDUCT.md`, `CONTRIBUTING.md`, `SECURITY.md`, and issue templates are all present and reasonably standard — good practice for an open-source-facing hackathon repo, and ahead of what most teams bother with.

---

## 7. Docs-vs-Code Drift (things stated as done that aren't)

- `docs/29_ROADMAP.md` → Phase 0 "Delivered" list includes **"Live queue position + ETA via WebSocket"**, **"Officer dashboard: check-in, start/complete, capacity update,"** and **"Simulated WhatsApp interaction (in-app mock)."** In the actual repo: there is no WebSocket (client-only store), the officer dashboard exists and does drive check-in/start/complete/capacity in the UI (this part is real), but the WhatsApp interaction is not simulated in-app at all — it's a disabled button with a toast. Recommend either building the in-app WhatsApp mock (a simple scripted chat modal would satisfy the "simulated" claim cheaply) or editing the roadmap doc so it doesn't overstate current state before a judge reads it.
- `docs/30_OPEN_QUESTIONS.md` (T-01–T-03) discusses Render/Supabase/SQLAlchemy specifics as if a backend implementation is imminent or partially underway; right now these questions are still 100% theoretical since there's no backend to test them against.
- README badge ("Blueprint Complete") is the one place in the repo that's fully honest about this gap — worth keeping that framing consistent everywhere else too (roadmap doc especially) so there's no risk of over-promising live, on-stage.

---

## 8. Priority List for the Next Work Session

If time is limited before a demo, in order of "most likely to save you from an on-stage surprise":

1. **Decide and test how live sync will actually be shown in the demo.** Either (a) accept it's single-tab/single-browser only and script the demo that way, (b) add a minimal `BroadcastChannel`/`storage`-event listener so it works across tabs on one laptop, or (c) stand up a thin real backend (even an in-memory FastAPI + WebSocket, no DB) if you want true two-device demoing. Pick one deliberately — don't find out live.
2. **Turn on lint + tests in CI** (`oxlint` and `vitest run` as required checks) — you already have the coverage, just enforce it.
3. **Build the WhatsApp "simulated" mock properly** (even a scripted fake-chat modal) so the roadmap doc's claim is true, since this is one of PS 26032's five explicitly named capabilities.
4. **Remove `.agents/skills/` from the repo** — quick win for repo credibility if anyone (a judge, a recruiter) browses the tree.
5. **Add basic route guards** for `/officer/dashboard` and `/home` so direct-URL access doesn't silently show fake officer/farmer data.
6. **Fix the officer login password check** (or clearly comment that it's intentionally a demo stub) so it doesn't read as an oversight in a code review.
7. Everything in §3 (real backend) — correctly scoped as Phase 1 per your own roadmap, not urgent before a hackathon demo, but worth explicitly confirming with the team that Phase 0 messaging in the pitch deck matches what's in the repo today.

---

*This audit reflects the code and docs at commit `c77b1f1`. Re-run the checks in §1 (`npm install && npx tsc -b && npx oxlint && npx vitest run && npx vite build`, plus `npm audit`) after future changes to keep this file current.*