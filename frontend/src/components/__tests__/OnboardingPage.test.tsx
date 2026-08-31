import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { OnboardingPage } from '@/pages/OnboardingPage'
import { useAppStore } from '@/store/app-store'

function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/onboarding']}>
        <Routes>
          <Route path="/onboarding" element={children} />
          <Route path="/" element={<div data-testid="landing-page">Landing Page</div>} />
        </Routes>
      </MemoryRouter>
      <Toaster />
    </QueryClientProvider>
  )
}

describe('OnboardingPage', () => {
  beforeEach(() => {
    localStorage.clear()
    useAppStore.setState({
      language: 'hi',
      farmer: null,
      token: null,
      isAuthenticated: false,
    })
  })

  it('renders Step 1 with phone input and demo autofill chip', () => {
    render(<OnboardingPage />, { wrapper })

    expect(screen.getByRole('heading', { name: 'मोबाइल और ओटीपी' })).toBeInTheDocument()
    expect(screen.getByText('डेमो लॉगिन (रमेश कुमार)')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('10 अंकों का मोबाइल नंबर दर्ज करें')).toBeInTheDocument()
  })

  it('quick demo autofill chip populates phone number', () => {
    render(<OnboardingPage />, { wrapper })

    const chip = screen.getByText('डेमो लॉगिन (रमेश कुमार)')
    fireEvent.click(chip)

    const input = screen.getByPlaceholderText('10 अंकों का मोबाइल नंबर दर्ज करें') as HTMLInputElement
    expect(input.value).toBe('9876543210')
  })

  it('switches language between Hindi and English', () => {
    render(<OnboardingPage />, { wrapper })

    const langBtn = screen.getByRole('button', { name: /switch to english/i })
    fireEvent.click(langBtn)

    expect(screen.getByRole('heading', { name: 'Mobile & OTP' })).toBeInTheDocument()
    expect(screen.getByText('Demo Login (Ramesh Kumar)')).toBeInTheDocument()
  })

  it('sends OTP and reveals 4-digit OTP inputs', async () => {
    render(<OnboardingPage />, { wrapper })

    const chip = screen.getByText('डेमो लॉगिन (रमेश कुमार)')
    fireEvent.click(chip)

    const sendBtn = screen.getByRole('button', { name: 'ओटीपी भेजें' })
    fireEvent.click(sendBtn)

    await waitFor(() => {
      expect(screen.getByText('4 अंकों का सत्यापन कोड दर्ज करें')).toBeInTheDocument()
      expect(screen.getByText('सत्यापित करें और आगे बढ़ें')).toBeInTheDocument()
    })
  })

  it('recognizes existing demo farmer and logs in directly', async () => {
    render(<OnboardingPage />, { wrapper })

    // Quick fill demo phone
    fireEvent.click(screen.getByText('डेमो लॉगिन (रमेश कुमार)'))
    fireEvent.click(screen.getByRole('button', { name: 'ओटीपी भेजें' }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'सत्यापित करें और आगे बढ़ें' })).toBeInTheDocument()
    })

    // Click verify
    fireEvent.click(screen.getByRole('button', { name: 'सत्यापित करें और आगे बढ़ें' }))

    await waitFor(() => {
      expect(screen.getByTestId('landing-page')).toBeInTheDocument()
    })

    const state = useAppStore.getState()
    expect(state.isAuthenticated).toBe(true)
    expect(state.farmer?.name).toBe('Ramesh Kumar')
  })

  it('walks new unregistered farmer through all 3 steps to celebration', async () => {
    render(<OnboardingPage />, { wrapper })

    // Step 1: Enter new phone
    const phoneInput = screen.getByPlaceholderText('10 अंकों का मोबाइल नंबर दर्ज करें')
    fireEvent.change(phoneInput, { target: { value: '9888777666' } })

    fireEvent.click(screen.getByRole('button', { name: 'ओटीपी भेजें' }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'सत्यापित करें और आगे बढ़ें' })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: 'सत्यापित करें और आगे बढ़ें' }))

    // Step 2: Farmer Details
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'किसान विवरण' })).toBeInTheDocument()
    })

    const nameInput = screen.getByPlaceholderText('उदा. रमेश कुमार')
    const villageInput = screen.getByPlaceholderText('उदा. ब्यावरा')

    fireEvent.change(nameInput, { target: { value: 'सुरेश यादव' } })
    fireEvent.change(villageInput, { target: { value: 'नरसिंहगढ़' } })

    fireEvent.click(screen.getByRole('button', { name: 'अगला चरण' }))

    // Step 3: Preferences
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'भाषा और व्हाट्सएप' })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: 'प्रोफ़ाइल पूरी करें' }))

    // Success Celebration Card
    await waitFor(
      () => {
        expect(screen.getByRole('heading', { name: 'प्रोफ़ाइल सफलतापूर्वक जुड़ गई!' })).toBeInTheDocument()
        expect(screen.getByText('सुरेश यादव')).toBeInTheDocument()
      },
      { timeout: 3000 },
    )

    const state = useAppStore.getState()
    expect(state.isAuthenticated).toBe(true)
    expect(state.farmer?.name).toBe('सुरेश यादव')
  })
})
