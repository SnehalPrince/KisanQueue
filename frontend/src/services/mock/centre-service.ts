import type { CentrePreview } from '../../types/centre'
import type { CentreService } from '../../types/service'
import { CENTRE_FIXTURES } from './fixtures/centres'

/** Simulated network delay (ms). Set to 0 in tests via VITE_MOCK_DELAY=0. */
const MOCK_DELAY_MS =
  import.meta.env['VITE_MOCK_DELAY'] !== undefined
    ? Number(import.meta.env['VITE_MOCK_DELAY'])
    : 600

const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms))

/**
 * Mock implementation of CentreService.
 *
 * Satisfies the CentreService interface — the real REST/WebSocket
 * implementation will replace this without any UI changes.
 *
 * Set VITE_MOCK_ERROR=true to force listPreviews() to reject,
 * enabling error-state testing without modifying component code.
 */
export const centreService: CentreService = {
  async listPreviews(): Promise<readonly CentrePreview[]> {
    await wait(MOCK_DELAY_MS)
    if (import.meta.env['VITE_MOCK_ERROR'] === 'true') {
      throw new Error('Mock: simulated network failure')
    }
    return CENTRE_FIXTURES
  },

  async getDetail(id: string): Promise<CentrePreview> {
    await wait(MOCK_DELAY_MS)
    const centre = CENTRE_FIXTURES.find((c) => c.id === id)
    if (!centre) throw new Error(`Mock: centre "${id}" not found`)
    return centre
  },
}
