import { Routes, Route, Navigate } from 'react-router-dom'
import { LandingPage } from '@/pages/LandingPage'
import { OnboardingPage } from '@/pages/OnboardingPage'
import { FarmerHomePage } from '@/pages/FarmerHomePage'
import { PassPage } from '@/pages/PassPage'

/**
 * Application route table.
 *
 * Routes marked [DONE] are fully implemented.
 * Routes marked [RESERVED] are placeholders for upcoming slices.
 */
function ReservedPage({ name }: { readonly name: string }) {
  return (
    <main style={{ padding: '64px 24px', textAlign: 'center', color: '#40534C' }}>
      <p style={{ fontWeight: 700, fontSize: '18px' }}>{name}</p>
      <p style={{ marginTop: '8px', fontSize: '14px', color: '#677D6A' }}>
        This page is coming in the next implementation slice.
      </p>
    </main>
  )
}

export function AppRoutes() {
  return (
    <Routes>
      {/* [DONE] Slice 1 — Landing */}
      <Route path="/" element={<LandingPage />} />

      {/* [DONE] Slice 2 — Farmer Onboarding */}
      <Route path="/onboarding" element={<OnboardingPage />} />

      {/* [DONE] Slice 3 — Farmer Home + Pass */}
      <Route path="/home" element={<FarmerHomePage />} />
      <Route path="/pass/:id" element={<PassPage />} />

      {/* [RESERVED] Slice 4 — Centre Discovery */}
      <Route path="/centres" element={<ReservedPage name="Centre Discovery" />} />
      <Route path="/centres/:id" element={<ReservedPage name="Centre Details" />} />

      {/* [RESERVED] Slice 5 — Live Queue */}
      <Route path="/queue" element={<ReservedPage name="Live Queue" />} />

      {/* [RESERVED] Slice 6 — Officer Console */}
      <Route path="/officer" element={<ReservedPage name="Officer Login" />} />
      <Route path="/officer/dashboard" element={<ReservedPage name="Officer Dashboard" />} />

      {/* [RESERVED] Slice 7 — Procurement & Payment */}
      <Route path="/procurement/:id" element={<ReservedPage name="Procurement Status" />} />
      <Route path="/payment/:id" element={<ReservedPage name="Payment Status" />} />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
