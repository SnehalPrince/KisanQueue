import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { OfficerLoginPage } from '@/pages/OfficerLoginPage'
import { OfficerDashboardPage } from '@/pages/OfficerDashboardPage'
import { useQueueLiveStore } from '@/store/queue-live-store'
import { useAppStore } from '@/store/app-store'

describe('Officer Console & 2-Tap Capacity', () => {
  beforeEach(() => {
    useAppStore.setState({ language: 'en' })
    useQueueLiveStore.getState().resetDemoState()
  })

  it('autofills credentials on Demo Login button in OfficerLoginPage', () => {
    render(
      <BrowserRouter>
        <OfficerLoginPage />
      </BrowserRouter>,
    )

    const fillBtn = screen.getByText(/Fill Demo/i)
    fireEvent.click(fillBtn)

    expect(screen.getByDisplayValue('officer_rajgarh')).toBeInTheDocument()
  })

  it('renders officer dashboard with 2-tap capacity condition buttons', () => {
    useQueueLiveStore.getState().loginOfficer('officer_rajgarh')

    render(
      <BrowserRouter>
        <OfficerDashboardPage />
      </BrowserRouter>,
    )

    expect(screen.getByText('Rajgarh Procurement Centre')).toBeInTheDocument()
    expect(screen.getByText('NORMAL')).toBeInTheDocument()
    expect(screen.getByText('BUSY')).toBeInTheDocument()
    expect(screen.getByText('LIFTING DELAY')).toBeInTheDocument()
    expect(screen.getByText('PAUSED')).toBeInTheDocument()
  })

  it('updates capacity factor to 0.6 and 1 counter on LIFTING DELAY click', () => {
    useQueueLiveStore.getState().loginOfficer('officer_rajgarh')

    render(
      <BrowserRouter>
        <OfficerDashboardPage />
      </BrowserRouter>,
    )

    const delayBtn = screen.getByText('LIFTING DELAY')
    fireEvent.click(delayBtn)

    expect(useQueueLiveStore.getState().condition.status).toBe('LIFTING_DELAYED')
    expect(useQueueLiveStore.getState().condition.capacityFactor).toBe(0.6)
    expect(useQueueLiveStore.getState().condition.activeCounters).toBe(1)
  })

  it('performs gate check-in on token input', () => {
    useQueueLiveStore.getState().loginOfficer('officer_rajgarh')

    render(
      <BrowserRouter>
        <OfficerDashboardPage />
      </BrowserRouter>,
    )

    const tokenInput = screen.getByPlaceholderText(/Token # e.g. 47/i)
    fireEvent.change(tokenInput, { target: { value: '47' } })

    const form = tokenInput.closest('form')
    if (form) {
      fireEvent.submit(form)
    }

    const rameshEntry = useQueueLiveStore.getState().entries.find((e) => e.token === 47)
    expect(rameshEntry?.status).toBe('CHECKED_IN')
  })
})
