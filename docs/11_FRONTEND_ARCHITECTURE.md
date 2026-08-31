# 11 — Frontend Architecture

## Stack
React + Vite + TypeScript + Tailwind CSS + React Router + React Query (server state) + `react-i18next` (Hindi/English).

## Recommended Folder Structure

```text
src/
├── app/                # App shell, router setup, providers
│   ├── App.tsx
│   ├── router.tsx
│   └── providers.tsx   # QueryClientProvider, I18nProvider, AuthProvider
├── components/         # Shared, dumb UI components (Button, Card, Badge, StatusIndicator)
├── features/
│   ├── auth/           # login, OTP screens, auth hooks
│   ├── centres/        # centre list/detail
│   ├── queue/          # join queue, live queue/ETA screen, QR display
│   ├── officer/        # officer dashboard, check-in, capacity update
│   ├── status/         # procurement/payment status screens
│   └── whatsapp-sim/   # simulated WhatsApp chat UI
├── lib/
│   ├── apiClient.ts    # fetch wrapper with auth header injection
│   ├── ws.ts           # WebSocket client + reconnect/backoff logic
│   └── i18n/           # translation resource files (en.json, hi.json)
├── hooks/               # useAuth, useQueueEvents, useCentreStatus
├── services/            # thin wrappers per API resource (centresApi, queueApi, officerApi)
├── types/               # shared TypeScript types mirroring backend schemas
└── styles/              # Tailwind config, design tokens
```

### Why this structure
- **`features/` over one flat `components/`**: each feature (queue, officer, etc.) owns its own screens/hooks, matching how the product is actually organized around user roles/flows rather than generic UI atoms.
- **`services/` separate from `lib/apiClient.ts`**: keeps HTTP wiring centralized while each resource's calls stay typed and discoverable.
- **`hooks/` for cross-cutting realtime/auth concerns**: `useQueueEvents` wraps the WebSocket subscription so any screen can consume live updates without re-implementing reconnect logic.

## Routes
```text
/                      → language select / redirect
/login                 → farmer OTP or officer login (role-aware)
/centres               → farmer home
/centres/:id           → centre detail
/queue/me              → live queue/ETA/QR
/status/:queueEntryId  → procurement/payment status
/whatsapp              → WhatsApp simulator
/officer               → officer dashboard (protected, OFFICER role)
/admin/*               → admin CRUD (protected, ADMIN role, P1)
```

## State Management
- **Server state**: React Query for all API-backed data (centres, queue status, officer queue list) — handles caching, retry, and stale-time semantics that map directly onto the product's "honest staleness" requirement.
- **Realtime state**: a thin `useQueueEvents(centreId)` hook opens a WebSocket, and on each event invalidates/patches the relevant React Query cache entry — avoids a second parallel state system.
- **Local/UI state**: component-local `useState` only; no global state library needed at this scope.

## API Client & Auth
- `apiClient.ts` attaches the JWT from an `AuthContext` to every request; 401 responses trigger a redirect to login.
- WebSocket connection includes the JWT as a query param or initial auth message for the gateway to validate the role/centre subscription.

## Realtime Subscriptions
- Farmer client subscribes to `queue:{centreId}` (or a personal channel `farmer:{userId}`) on entering the "My Queue" screen; unsubscribes on unmount.
- Officer client subscribes to `officer:{centreId}` for their own centre's queue table.
- Reconnect strategy: exponential backoff, falling back to REST polling after repeated failures (`15_REALTIME_QUEUE.md`).

## Localization
- All user-facing strings in `lib/i18n/en.json` / `hi.json`; components use `useTranslation()` — never hardcoded strings in JSX.
- Language choice persisted in `localStorage`-equivalent app state (or account preference once authenticated) — note: per artifact constraints, browser storage is not used inside interactive *artifacts*, but this is a full deployed app, not a claude.ai artifact, so standard browser storage is fine here.

## Form Validation
- Lightweight schema validation (e.g., Zod) for phone number, OTP, and officer capacity-percentage inputs, with farmer-facing error copy kept short and non-technical (`23_ERROR_HANDLING.md`).

## Error/Loading Handling
- Shared `<AsyncBoundary>` component wraps feature screens, rendering the Loading/Error/Empty states defined in `07_UX_UI_DESIGN.md` consistently.

## Caching & Responsive Behavior
- React Query `staleTime` tuned per resource: centre status short (near-realtime expectation), officer's own profile long.
- Tailwind responsive utilities drive the mobile-first → tablet (officer) → desktop (admin) layout shifts described in `08_DESIGN_SYSTEM.md`.
