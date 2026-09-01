import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { queueService } from '../queue-service'
import { RAMESH_PASS } from '../fixtures/queue'

// Zero network delay in tests
vi.stubEnv('VITE_MOCK_DELAY', '0')

// Patch window.setTimeout to be synchronous in tests
beforeEach(() => {
  queueService._resetForTests()
  vi.spyOn(window, 'setTimeout').mockImplementation((fn: TimerHandler) => {
    if (typeof fn === 'function') fn()
    return 0 as unknown as ReturnType<typeof setTimeout>
  })
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('queueService.getActivePass', () => {
  it('returns the pre-seeded pass for farmer-001', async () => {
    const pass = await queueService.getActivePass('farmer-001')
    expect(pass).not.toBeNull()
    expect(pass?.token).toBe('KQ-1047')
    expect(pass?.farmerId).toBe('farmer-001')
    expect(pass?.queuePosition).toBe(5)
    expect(pass?.etaMinutes).toBe(63)
  })

  it('returns null for a farmer without an active pass', async () => {
    const pass = await queueService.getActivePass('farmer-999')
    expect(pass).toBeNull()
  })
})

describe('queueService.getPassById', () => {
  it('returns the demo pass by ID', async () => {
    const pass = await queueService.getPassById(RAMESH_PASS.id)
    expect(pass?.token).toBe('KQ-1047')
  })

  it('returns null for unknown pass ID', async () => {
    const pass = await queueService.getPassById('pass-does-not-exist')
    expect(pass).toBeNull()
  })
})

describe('queueService.getQueueEntries', () => {
  it('returns 14 entries for centre-001 (Rajgarh)', async () => {
    const entries = await queueService.getQueueEntries('centre-001')
    expect(entries).toHaveLength(14)
  })

  it('returns empty array for unknown centre', async () => {
    const entries = await queueService.getQueueEntries('centre-unknown')
    expect(entries).toHaveLength(0)
  })

  it('includes Ramesh Kumar at token 47, position 5', async () => {
    const entries = await queueService.getQueueEntries('centre-001')
    const ramesh = entries.find((e) => e.farmerId === 'farmer-001')
    expect(ramesh).toBeDefined()
    expect(ramesh?.token).toBe(47)
    expect(ramesh?.position).toBe(5)
    expect(ramesh?.status).toBe('WAITING')
  })
})

describe('queueService.previewPass', () => {
  it('calculates estimated position and ETA', async () => {
    const summary = await queueService.previewPass({
      farmerId: 'farmer-002',
      centreId: 'centre-001',
      crop: 'wheat',
      quantityQ: 30,
    })
    expect(summary.estimatedQueuePosition).toBeGreaterThan(0)
    expect(summary.estimatedEtaMinutes).toBeGreaterThan(0)
    expect(summary.cropNameEn).toBe('Wheat')
    expect(summary.estimatedMsp).toBe(2275 * 30)
  })

  it('throws for unknown centre', async () => {
    await expect(
      queueService.previewPass({
        farmerId: 'farmer-001',
        centreId: 'centre-bad',
        crop: 'wheat',
        quantityQ: 10,
      }),
    ).rejects.toThrow('centre-bad')
  })
})

describe('queueService.generatePass', () => {
  it('creates a new pass with a unique token', async () => {
    const pass = await queueService.generatePass({
      farmerId: 'farmer-002',
      centreId: 'centre-001',
      crop: 'soybean',
      quantityQ: 15,
    })
    expect(pass.token).toMatch(/^KQ-\d+$/)
    expect(pass.farmerId).toBe('farmer-002')
    expect(pass.crop).toBe('soybean')
    expect(pass.status).toBe('ACTIVE')
    expect(pass.qrPayload).toContain('farmer-002')
    expect(pass.qrPayload).toContain('centre-001')
  })

  it('makes the new pass retrievable by ID', async () => {
    const pass = await queueService.generatePass({
      farmerId: 'farmer-003',
      centreId: 'centre-001',
      crop: 'wheat',
      quantityQ: 40,
    })
    const retrieved = await queueService.getPassById(pass.id)
    expect(retrieved?.token).toBe(pass.token)
  })

  it('makes the new pass retrievable as active pass for the farmer', async () => {
    const pass = await queueService.generatePass({
      farmerId: 'farmer-003',
      centreId: 'centre-001',
      crop: 'wheat',
      quantityQ: 40,
    })
    const activePass = await queueService.getActivePass('farmer-003')
    expect(activePass?.id).toBe(pass.id)
  })
})
