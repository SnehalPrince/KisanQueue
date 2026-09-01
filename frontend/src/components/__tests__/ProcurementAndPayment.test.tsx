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
    useQueueLiveStore.setState({
      entries: [
        { id: 'e1', token: 43, farmerId: 'f1', farmerName: 'A', crop: 'wheat', quantityQ: 10, status: 'WAITING', position: 1, joinedAt: '2026-09-01' },
        { id: 'e2', token: 44, farmerId: 'f2', farmerName: 'B', crop: 'wheat', quantityQ: 10, status: 'WAITING', position: 2, joinedAt: '2026-09-01' },
        { id: 'e3', token: 45, farmerId: 'f3', farmerName: 'C', crop: 'wheat', quantityQ: 10, status: 'WAITING', position: 3, joinedAt: '2026-09-01' },
        { id: 'e4', token: 46, farmerId: 'f4', farmerName: 'D', crop: 'wheat', quantityQ: 10, status: 'WAITING', position: 4, joinedAt: '2026-09-01' },
        { id: 'e5', token: 47, farmerId: 'farmer-001', farmerName: 'Ramesh Kumar', crop: 'wheat', quantityQ: 10, status: 'WAITING', position: 5, joinedAt: '2026-09-01' },
      ]
    })
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
