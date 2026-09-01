import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueuePage } from '@/pages/QueuePage'
import { useAppStore } from '@/store/app-store'
import { useQueueLiveStore } from '@/store/queue-live-store'

function renderQueuePage() {
  return render(
    <BrowserRouter>
      <QueuePage />
    </BrowserRouter>,
  )
}

describe('QueuePage', () => {
  beforeEach(() => {
    useAppStore.setState({
      language: 'en',
      farmer: {
        id: 'farmer-001',
        name: 'Ramesh Kumar',
        hindiName: 'रमेश कुमार',
        phone: '+919876543210',
        village: 'Biaora',
        district: 'Rajgarh',
        primaryCrop: 'wheat',
        language: 'en',
        aadhaarLast4: '4521',
        isWhatsAppLinked: true,
        createdAt: new Date().toISOString(),
      },
      isAuthenticated: true,
    })

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

  it('renders verified token header and farmer details', () => {
    renderQueuePage()
    expect(screen.getByText('KQ-1047')).toBeInTheDocument()
    expect(screen.getAllByText(/Ramesh Kumar/).length).toBeGreaterThan(0)
    expect(screen.getByText(/Rajgarh Procurement Centre/)).toBeInTheDocument()
  })

  it('displays initial position #5 and wait estimate', () => {
    renderQueuePage()
    expect(screen.getByText('#5')).toBeInTheDocument()
    expect(screen.getByText(/4.*ahead/i)).toBeInTheDocument()
  })

  it('reactively recalculates ETA when lifting delay simulation is clicked', () => {
    renderQueuePage()
    const delayBtn = screen.getByText(/Simulate Lifting Delay/i)
    fireEvent.click(delayBtn)

    // Status condition updates to LIFTING_DELAYED
    expect(useQueueLiveStore.getState().condition.status).toBe('LIFTING_DELAYED')
    expect(useQueueLiveStore.getState().condition.capacityFactor).toBe(0.6)
  })

  it('advances farmer position when completing entries ahead', () => {
    renderQueuePage()
    const completeBtn = screen.getByText(/Complete 1 Farmer Ahead/i)
    fireEvent.click(completeBtn)

    // Position shifts from #5 to #4
    expect(screen.getByText('#4')).toBeInTheDocument()
  })
})
