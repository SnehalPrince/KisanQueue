import { describe, it, expect } from 'vitest'
import { centreService } from '@/services/mock/centre-service'
import { CENTRE_FIXTURES } from '@/services/mock/fixtures/centres'

describe('centreService (mock)', () => {
  it('listPreviews returns all 3 canonical centres', async () => {
    const results = await centreService.listPreviews()
    expect(results).toHaveLength(3)
  })

  it('Rajgarh (centre-001) has status NORMAL and ETA 63', async () => {
    const centres = await centreService.listPreviews()
    const rajgarh = centres.find((c) => c.id === 'centre-001')
    expect(rajgarh).toBeDefined()
    expect(rajgarh?.status).toBe('NORMAL')
    expect(rajgarh?.etaMinutes).toBe(63)
    expect(rajgarh?.activeCounters).toBe(2)
    expect(rajgarh?.capacityFactor).toBe(1.0)
  })

  it('Hisar (centre-002) has status BUSY and ETA 413', async () => {
    const centres = await centreService.listPreviews()
    const hisar = centres.find((c) => c.id === 'centre-002')
    expect(hisar?.status).toBe('BUSY')
    expect(hisar?.etaMinutes).toBe(413)
  })

  it('Patiala (centre-003) is PAUSED with null ETA', async () => {
    const centres = await centreService.listPreviews()
    const patiala = centres.find((c) => c.id === 'centre-003')
    expect(patiala?.status).toBe('PAUSED')
    expect(patiala?.etaMinutes).toBeNull()
    expect(patiala?.activeCounters).toBe(0)
  })

  it('getDetail returns correct centre by id', async () => {
    const centre = await centreService.getDetail('centre-001')
    expect(centre.id).toBe('centre-001')
    expect(centre.name).toBe('Rajgarh Procurement Centre')
  })

  it('getDetail throws for unknown id', async () => {
    await expect(centreService.getDetail('centre-999')).rejects.toThrow()
  })

  it('fixtures match centreService output', async () => {
    const results = await centreService.listPreviews()
    expect(results).toEqual(CENTRE_FIXTURES)
  })
})
