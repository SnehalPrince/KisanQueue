import { Routes, Route, Navigate } from 'react-router-dom'
import { LandingPage } from '@/pages/LandingPage'
import { OnboardingPage } from '@/pages/OnboardingPage'
import { FarmerHomePage } from '@/pages/FarmerHomePage'
import { PassPage } from '@/pages/PassPage'
import { CentresPage } from '@/pages/CentresPage'
import { CentreDetailPage } from '@/pages/CentreDetailPage'
import { QueuePage } from '@/pages/QueuePage'
import { OfficerLoginPage } from '@/pages/OfficerLoginPage'
import { OfficerDashboardPage } from '@/pages/OfficerDashboardPage'
import { ProcurementReceiptPage } from '@/pages/ProcurementReceiptPage'
import { PaymentStatusPage } from '@/pages/PaymentStatusPage'
import { RequireFarmerAuth, RequireOfficerAuth } from '@/components/auth/RouteGuards'

export function AppRoutes() {
  return (
    <Routes>
      {/* Slice 1 — Landing */}
      <Route path="/" element={<LandingPage />} />

      {/* Slice 2 — Farmer Onboarding */}
      <Route path="/onboarding" element={<OnboardingPage />} />

      {/* Slice 3 — Farmer Home + Pass (Guarded) */}
      <Route
        path="/home"
        element={
          <RequireFarmerAuth>
            <FarmerHomePage />
          </RequireFarmerAuth>
        }
      />
      <Route
        path="/pass/:id"
        element={
          <RequireFarmerAuth>
            <PassPage />
          </RequireFarmerAuth>
        }
      />

      {/* Slice 4 — Centre Discovery */}
      <Route path="/centres" element={<CentresPage />} />
      <Route path="/centres/:id" element={<CentreDetailPage />} />

      {/* Slice 5 — Live Queue & Tracking */}
      <Route path="/queue" element={<QueuePage />} />

      {/* Slice 6 — Officer Console (Guarded) */}
      <Route path="/officer" element={<OfficerLoginPage />} />
      <Route
        path="/officer/dashboard"
        element={
          <RequireOfficerAuth>
            <OfficerDashboardPage />
          </RequireOfficerAuth>
        }
      />

      {/* Slice 7 — Procurement Receipt & DBT Payment Tracker */}
      <Route path="/procurement/:id" element={<ProcurementReceiptPage />} />
      <Route path="/payment/:id" element={<PaymentStatusPage />} />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
