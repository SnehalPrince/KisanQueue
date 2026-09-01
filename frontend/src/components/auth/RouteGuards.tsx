import { Navigate, useLocation } from 'react-router-dom'
import { useAppStore } from '@/store/app-store'
import { useQueueLiveStore } from '@/store/queue-live-store'

interface GuardProps {
  readonly children: React.ReactNode
}

/**
 * Route guard requiring an authenticated farmer profile.
 * Unauthenticated users are safely redirected to /onboarding.
 */
export function RequireFarmerAuth({ children }: GuardProps) {
  const { isAuthenticated, farmer } = useAppStore()
  const location = useLocation()

  if (!isAuthenticated || !farmer) {
    return <Navigate to="/onboarding" state={{ from: location }} replace />
  }

  return <>{children}</>
}

/**
 * Route guard requiring an authenticated APMC Mandi Officer.
 * Unauthenticated visitors are redirected to /officer login portal.
 */
export function RequireOfficerAuth({ children }: GuardProps) {
  const officerUser = useQueueLiveStore((s) => s.officerUser)
  const token = typeof window !== 'undefined' ? (localStorage.getItem('officer_token') || localStorage.getItem('access_token')) : null
  const location = useLocation()

  if (!officerUser && !token) {
    return <Navigate to="/officer" state={{ from: location }} replace />
  }

  return <>{children}</>
}
