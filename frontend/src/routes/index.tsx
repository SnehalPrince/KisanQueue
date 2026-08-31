import { Routes, Route, Navigate } from 'react-router-dom'
import { LandingPage } from '@/pages/LandingPage'

/**
 * Application route table.
 *
 * Reserved routes are declared here so links compile, but they render
 * a placeholder that does NOT expose broken UI to users.
 * Subsequent slices will replace placeholders with real pages.
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
      <Route path="/" element={<LandingPage />} />

      {/* Reserved — not linked in navigation until implemented */}
      <Route path="/onboarding" element={<ReservedPage name="Farmer Onboarding" />} />
      <Route path="/home" element={<ReservedPage name="Farmer Home" />} />
      <Route path="/centres" element={<ReservedPage name="Centre Discovery" />} />
      <Route path="/centres/:id" element={<ReservedPage name="Centre Details" />} />
      <Route path="/sell" element={<ReservedPage name="Sell Crop" />} />
      <Route path="/pass/:id" element={<ReservedPage name="Procurement Pass" />} />
      <Route path="/queue" element={<ReservedPage name="Live Queue" />} />
      <Route path="/procurement/:id" element={<ReservedPage name="Procurement Status" />} />
      <Route path="/payment/:id" element={<ReservedPage name="Payment Status" />} />
      <Route path="/officer" element={<ReservedPage name="Officer Login" />} />
      <Route path="/officer/dashboard" element={<ReservedPage name="Officer Dashboard" />} />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
