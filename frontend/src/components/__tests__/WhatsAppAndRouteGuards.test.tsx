import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WhatsAppSimulatorModal } from '@/components/whatsapp/WhatsAppSimulatorModal'
import { RequireFarmerAuth, RequireOfficerAuth } from '@/components/auth/RouteGuards'
import { useAppStore } from '@/store/app-store'
import { useQueueLiveStore } from '@/store/queue-live-store'

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: Infinity },
    },
  })
}

describe('WhatsAppSimulatorModal (Krishi Mitra)', () => {
  beforeEach(() => {
    useAppStore.setState({
      language: 'en',
      farmer: {
        id: 'farmer-001',
        phone: '9876543210',
        name: 'Ramesh Kumar',
        hindiName: 'रमेश कुमार',
        village: 'Rajgarh',
        district: 'Rajgarh',
        language: 'en',
        primaryCrop: 'Wheat',
        aadhaarLast4: '4321',
        isWhatsAppLinked: true,
        createdAt: new Date().toISOString(),
      },
    })
  })

  it('renders WhatsApp verified bot header and initial welcome message', () => {
    render(
      <MemoryRouter>
        <WhatsAppSimulatorModal isOpen={true} onClose={() => {}} />
      </MemoryRouter>,
    )

    expect(screen.getByText(/KisanQueue कृषि मित्र/i)).toBeInTheDocument()
    expect(screen.getByText(/Hello Ramesh Kumar!/i)).toBeInTheDocument()
    expect(screen.getByText(/End-to-end encrypted/i)).toBeInTheDocument()
  })

  it('responds when clicking quick prompt chips like Mandi ETA', async () => {
    render(
      <MemoryRouter>
        <WhatsAppSimulatorModal isOpen={true} onClose={() => {}} />
      </MemoryRouter>,
    )

    const etaChip = screen.getByRole('button', { name: /Check Mandi ETA/i })
    fireEvent.click(etaChip)

    await waitFor(
      () => {
        expect(screen.getByText(/Rajgarh Procurement Centre - Live Status/i)).toBeInTheDocument()
      },
      { timeout: 1500 },
    )
  })

  it('responds with digital pass details when requesting pass prompt', async () => {
    render(
      <MemoryRouter>
        <WhatsAppSimulatorModal isOpen={true} onClose={() => {}} />
      </MemoryRouter>,
    )

    const passChip = screen.getByRole('button', { name: /My Digital Pass/i })
    fireEvent.click(passChip)

    await waitFor(
      () => {
        expect(screen.getByText(/KQ-PASS-7729/i)).toBeInTheDocument()
      },
      { timeout: 1500 },
    )
  })
})

describe('RouteGuards Authentication Enforcement', () => {
  beforeEach(() => {
    localStorage.clear()
    useAppStore.setState({ isAuthenticated: false, farmer: null })
    useQueueLiveStore.setState({ officerUser: null })
  })

  it('redirects unauthenticated farmer away from /home to /onboarding', () => {
    render(
      <QueryClientProvider client={createQueryClient()}>
        <MemoryRouter initialEntries={['/home']}>
          <Routes>
            <Route
              path="/home"
              element={
                <RequireFarmerAuth>
                  <div>Secret Farmer Home</div>
                </RequireFarmerAuth>
              }
            />
            <Route path="/onboarding" element={<div>Onboarding Landing</div>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    )

    expect(screen.queryByText('Secret Farmer Home')).not.toBeInTheDocument()
    expect(screen.getByText('Onboarding Landing')).toBeInTheDocument()
  })

  it('allows authenticated farmer to view /home', () => {
    useAppStore.setState({
      isAuthenticated: true,
      farmer: {
        id: 'farmer-001',
        phone: '9876543210',
        name: 'Ramesh Kumar',
        hindiName: 'रमेश कुमार',
        village: 'Rajgarh',
        district: 'Rajgarh',
        language: 'hi',
        primaryCrop: 'Wheat',
        aadhaarLast4: '4321',
        isWhatsAppLinked: true,
        createdAt: new Date().toISOString(),
      },
    })

    render(
      <QueryClientProvider client={createQueryClient()}>
        <MemoryRouter initialEntries={['/home']}>
          <Routes>
            <Route
              path="/home"
              element={
                <RequireFarmerAuth>
                  <div>Secret Farmer Home</div>
                </RequireFarmerAuth>
              }
            />
            <Route path="/onboarding" element={<div>Onboarding Landing</div>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    )

    expect(screen.getByText('Secret Farmer Home')).toBeInTheDocument()
  })

  it('redirects unauthenticated officer away from /officer/dashboard to /officer', () => {
    render(
      <QueryClientProvider client={createQueryClient()}>
        <MemoryRouter initialEntries={['/officer/dashboard']}>
          <Routes>
            <Route
              path="/officer/dashboard"
              element={
                <RequireOfficerAuth>
                  <div>Secret Officer Dashboard</div>
                </RequireOfficerAuth>
              }
            />
            <Route path="/officer" element={<div>Officer Login Portal</div>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    )

    expect(screen.queryByText('Secret Officer Dashboard')).not.toBeInTheDocument()
    expect(screen.getByText('Officer Login Portal')).toBeInTheDocument()
  })
})
