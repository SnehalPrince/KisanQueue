import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ProcurementReceiptPage } from '@/pages/ProcurementReceiptPage'
import { PaymentStatusPage } from '@/pages/PaymentStatusPage'
import { useQueueLiveStore } from '@/store/queue-live-store'
import { useAppStore } from '@/store/app-store'

describe('Procurement Receipt & DBT Payment Pages', () => {
  beforeEach(() => {
    useAppStore.setState({ language: 'en' })
    useQueueLiveStore.getState().resetDemoState()
  })

  it('renders official Mandi receipt with itemized weight and MSP payout', () => {
    render(
      <MemoryRouter initialEntries={['/procurement/rec-39']}>
        <Routes>
          <Route path="/procurement/:id" element={<ProcurementReceiptPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('Rajgarh Procurement Centre')).toBeInTheDocument()
    expect(screen.getByText('Priya Bai')).toBeInTheDocument()
    expect(screen.getAllByText('₹50,050').length).toBeGreaterThan(0)
    expect(screen.getByText('Grade A (Passed)')).toBeInTheDocument()
    expect(screen.getByText('KQ-REC-2026-0039')).toBeInTheDocument()
  })

  it('renders DBT Payment tracker with 5 milestones and UTR reference', () => {
    render(
      <MemoryRouter initialEntries={['/payment/rec-39']}>
        <Routes>
          <Route path="/payment/:id" element={<PaymentStatusPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getAllByText('₹50,050').length).toBeGreaterThan(0)
    expect(screen.getByText('CREDITED (PAID)')).toBeInTheDocument()
    expect(screen.getAllByText(/IMPS202609150001/).length).toBeGreaterThan(0)
    expect(screen.getByText(/1\. Procurement/i)).toBeInTheDocument()
    expect(screen.getByText(/5\. Credited to Farmer/i)).toBeInTheDocument()
  })
})
