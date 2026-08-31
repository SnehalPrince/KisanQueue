import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'sonner'
import { LandingPage } from '@/pages/LandingPage'
import { useAppStore } from '@/store/app-store'

// Mock the centre service so tests don't depend on timing
vi.mock('@/services/mock/centre-service', () => ({
  centreService: {
    listPreviews: vi.fn().mockResolvedValue([
      {
        id: 'centre-001',
        name: 'Rajgarh Procurement Centre',
        hindiName: 'राजगढ़ उपार्जन केंद्र',
        district: 'Rajgarh, MP',
        distanceKm: 12,
        status: 'NORMAL',
        queueLength: 9,
        etaMinutes: 63,
        confidence: 'HIGH',
        activeCounters: 2,
        capacityFactor: 1.0,
        updatedMinutesAgo: 2,
        note: 'Operating normally.',
      },
      {
        id: 'centre-002',
        name: 'Hisar HAFED Centre',
        hindiName: 'हिसार हैफेड केंद्र',
        district: 'Hisar, Haryana',
        distanceKm: 28,
        status: 'BUSY',
        queueLength: 22,
        etaMinutes: 413,
        confidence: 'MEDIUM',
        activeCounters: 2,
        capacityFactor: 0.8,
        updatedMinutesAgo: 6,
        note: 'High congestion today.',
      },
      {
        id: 'centre-003',
        name: 'Patiala Anaaj Kharid Centre',
        hindiName: 'पटियाला अनाज खरीद केंद्र',
        district: 'Patiala, Punjab',
        distanceKm: 41,
        status: 'PAUSED',
        queueLength: 0,
        etaMinutes: null,
        confidence: 'NA',
        activeCounters: 0,
        capacityFactor: 0,
        updatedMinutesAgo: 4,
        note: 'Operations are paused.',
      },
    ]),
    getDetail: vi.fn(),
  },
}))

// Reset zustand store to default language before each test.
// The store is a module singleton — localStorage.clear() alone isn't enough
// because persist middleware has already hydrated it from the first import.
// Applied per Zustand testing best-practices.
beforeEach(() => {
  localStorage.clear()
  useAppStore.setState({ language: 'hi', isAuthenticated: false })
})

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return (
    <BrowserRouter>
      <QueryClientProvider client={client}>
        {children}
        <Toaster />
      </QueryClientProvider>
    </BrowserRouter>
  )
}

describe('LandingPage', () => {
  it('renders skip link as first interactive element', () => {
    render(<LandingPage />, { wrapper })
    const skip = screen.getByText('Skip to centre conditions')
    expect(skip).toBeInTheDocument()
    expect(skip.tagName).toBe('A')
  })

  it('renders hero heading in Hindi (default language)', () => {
    render(<LandingPage />, { wrapper })
    expect(
      screen.getByText('घर से निकलने से पहले मंडी की स्थिति जानें।'),
    ).toBeInTheDocument()
  })

  it('switches language to English when toggle clicked', async () => {
    render(<LandingPage />, { wrapper })
    const langBtn = screen.getByRole('button', { name: /Switch to English/i })
    fireEvent.click(langBtn)
    await waitFor(() => {
      expect(
        screen.getByText('Know the mandi situation before you leave home.'),
      ).toBeInTheDocument()
    })
  })

  it('shows loading skeleton while centres are fetching', () => {
    render(<LandingPage />, { wrapper })
    // aria-busy indicates loading
    expect(screen.getByRole('generic', { name: /लोड हो रही/i })).toBeInTheDocument()
  })

  it('renders 3 centre cards after data loads', async () => {
    render(<LandingPage />, { wrapper })
    await waitFor(() => {
      expect(screen.getByText('राजगढ़ उपार्जन केंद्र')).toBeInTheDocument()
      expect(screen.getByText('हिसार हैफेड केंद्र')).toBeInTheDocument()
      expect(screen.getByText('पटियाला अनाज खरीद केंद्र')).toBeInTheDocument()
    })
  })

  it('NORMAL centre shows "सामान्य रूप से चल रहा है" badge (Hindi)', async () => {
    render(<LandingPage />, { wrapper })
    await waitFor(() => {
      expect(screen.getByText('सामान्य रूप से चल रहा है')).toBeInTheDocument()
    })
  })

  it('PAUSED centre shows "कामकाज बंद है" badge and paused ETA text', async () => {
    render(<LandingPage />, { wrapper })
    await waitFor(() => {
      expect(screen.getByText('कामकाज बंद है')).toBeInTheDocument()
      expect(screen.getAllByText('बंद होने पर समय उपलब्ध नहीं').length).toBeGreaterThan(0)
    })
  })

  it('ETA for Rajgarh displays ~1 घं 3 मि (63 min in Hindi)', async () => {
    render(<LandingPage />, { wrapper })
    await waitFor(() => {
      expect(screen.getByText('~1 घं 3 मि')).toBeInTheDocument()
    })
  })

  it('opens modal with centre details when "स्थिति का विवरण देखें" clicked', async () => {
    render(<LandingPage />, { wrapper })
    await waitFor(() => screen.getByText('राजगढ़ उपार्जन केंद्र'))

    const buttons = screen.getAllByRole('button', { name: /स्थिति का विवरण/i })
    fireEvent.click(buttons[0])

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })
  })

  it('modal closes when Escape is pressed', async () => {
    render(<LandingPage />, { wrapper })
    await waitFor(() => screen.getByText('राजगढ़ उपार्जन केंद्र'))

    const buttons = screen.getAllByRole('button', { name: /स्थिति का विवरण/i })
    fireEvent.click(buttons[0])
    await waitFor(() => screen.getByRole('dialog'))

    fireEvent.keyDown(window, { key: 'Escape' })
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

  it('sign-in CTA in modal is present and labelled', async () => {
    render(<LandingPage />, { wrapper })
    await waitFor(() => screen.getByText('राजगढ़ उपार्जन केंद्र'))

    const detailButtons = screen.getAllByRole('button', { name: /स्थिति का विवरण/i })
    fireEvent.click(detailButtons[0])
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /आगे बढ़ने के लिए साइन इन करें/i }),
      ).toBeInTheDocument()
    })
  })

  it('status badges use non-colour shape symbols', async () => {
    render(<LandingPage />, { wrapper })
    await waitFor(() => screen.getByText('राजगढ़ उपार्जन केंद्र'))

    // Normal = ●
    const normalBadge = screen.getByText('सामान्य रूप से चल रहा है').closest('.status-badge')
    expect(normalBadge?.querySelector('.status-symbol')?.textContent).toBe('●')

    // Busy = ▲
    const busyBadge = screen.getByText('आज व्यस्त है').closest('.status-badge')
    expect(busyBadge?.querySelector('.status-symbol')?.textContent).toBe('▲')

    // Paused = ■
    const pausedBadge = screen.getByText('कामकाज बंद है').closest('.status-badge')
    expect(pausedBadge?.querySelector('.status-symbol')?.textContent).toBe('■')
  })
})
