import type {
  ProcurementPass,
  QueueEntry,
  GeneratePassRequest,
  PassSummary,
  CropId,
} from '../../types/queue'
import { ACTIVE_PASSES, RAMESH_PASS, RAJGARH_QUEUE } from './fixtures/queue'
import { CROP_MAP } from './fixtures/crops'
import { CENTRE_FIXTURES } from './fixtures/centres'

/** Simulated network delay (ms). Set to 0 in tests via VITE_MOCK_DELAY=0. */
const MOCK_DELAY_MS =
  import.meta.env['VITE_MOCK_DELAY'] !== undefined
    ? Number(import.meta.env['VITE_MOCK_DELAY'])
    : 600

const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms))

/** In-memory pass store — allows tests and demo flows to mutate. */
const passByFarmerId: Record<string, ProcurementPass> = { ...ACTIVE_PASSES }
const passById: Record<string, ProcurementPass> = {
  [RAMESH_PASS.id]: RAMESH_PASS,
}
let nextTokenNumber = 1048

/**
 * ETA calculation per docs/22_MOCK_DATA.md formula:
 * ETA = ceil(N × T_base / (C × F))
 */
function calcEta(position: number, tBase = 25, counters = 2, factor = 1.0): number {
  return Math.ceil((position * tBase) / (counters * factor))
}

/**
 * Mock Queue Service.
 *
 * All mutations are in-memory only — no persistence beyond the page session.
 * The real WebSocket/REST service will replace this without UI changes.
 */
export const queueService = {
  /**
   * Fetch the active pass for a farmer (if one exists).
   * Returns null if no active pass.
   */
  async getActivePass(farmerId: string): Promise<ProcurementPass | null> {
    await wait(MOCK_DELAY_MS)
    return passByFarmerId[farmerId] ?? null
  },

  /**
   * Fetch a pass by its ID.
   */
  async getPassById(passId: string): Promise<ProcurementPass | null> {
    await wait(MOCK_DELAY_MS)
    return passById[passId] ?? null
  },

  /**
   * Fetch the current queue for a centre.
   * Only Rajgarh (centre-001) has seeded data.
   */
  async getQueueEntries(centreId: string): Promise<readonly QueueEntry[]> {
    await wait(MOCK_DELAY_MS)
    if (centreId === 'centre-001') {
      return RAJGARH_QUEUE
    }
    return []
  },

  /**
   * Pre-generate a pass summary for the confirmation step.
   * Does NOT create the pass yet — that's generatePass().
   */
  async previewPass(request: GeneratePassRequest): Promise<PassSummary> {
    await wait(MOCK_DELAY_MS / 2)

    const centre = CENTRE_FIXTURES.find((c) => c.id === request.centreId)
    if (!centre) throw new Error(`Centre "${request.centreId}" not found`)

    const crop = CROP_MAP[request.crop]
    if (!crop) throw new Error(`Crop "${request.crop}" not found`)

    // How many are waiting ahead? Add 1 for new entry.
    const existingWaiting = RAJGARH_QUEUE.filter(
      (e) => e.status === 'WAITING' || e.status === 'CHECKED_IN' || e.status === 'PROCESSING',
    ).length

    const estimatedPosition = existingWaiting + 1
    const estimatedEta = calcEta(estimatedPosition)

    return {
      centreId: centre.id,
      centreName: centre.name,
      centreHindiName: centre.hindiName,
      centreStatus: centre.status,
      crop: request.crop,
      cropNameEn: crop.nameEn,
      cropNameHi: crop.nameHi,
      quantityQ: request.quantityQ,
      estimatedQueuePosition: estimatedPosition,
      estimatedEtaMinutes: estimatedEta,
      estimatedMsp: Math.round(crop.mspPerQuintal * request.quantityQ),
      mspRate: crop.mspPerQuintal,
    }
  },

  /**
   * Generate and persist a procurement pass.
   * Returns the newly created ProcurementPass.
   */
  async generatePass(request: GeneratePassRequest): Promise<ProcurementPass> {
    // Slightly longer delay to simulate server-side QR generation
    await wait(MOCK_DELAY_MS * 2)

    const centre = CENTRE_FIXTURES.find((c) => c.id === request.centreId)
    if (!centre) throw new Error(`Centre "${request.centreId}" not found`)

    const crop = CROP_MAP[request.crop]
    if (!crop) throw new Error(`Crop "${request.crop}" not found`)

    const tokenNum = nextTokenNumber++
    const token = `KQ-${tokenNum}`
    const passId = `pass-${token.toLowerCase()}`

    const existingWaiting = RAJGARH_QUEUE.filter(
      (e) => e.status === 'WAITING' || e.status === 'CHECKED_IN' || e.status === 'PROCESSING',
    ).length
    const queuePosition = existingWaiting + 1
    const etaMinutes = calcEta(queuePosition)

    const pass: ProcurementPass = {
      id: passId,
      token,
      farmerId: request.farmerId,
      farmerName: 'Demo Farmer',
      centreId: centre.id,
      centreName: centre.name,
      centreHindiName: centre.hindiName,
      crop: request.crop as CropId,
      cropNameEn: crop.nameEn,
      cropNameHi: crop.nameHi,
      quantityQ: request.quantityQ,
      queuePosition,
      etaMinutes,
      status: 'ACTIVE',
      queueEntryStatus: 'WAITING',
      issuedAt: new Date().toISOString(),
      validUntil: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
      qrPayload: `${token}:${request.farmerId}:${centre.id}`,
    }

    passByFarmerId[request.farmerId] = pass
    passById[passId] = pass

    return pass
  },

  /**
   * Reset mock state (used in tests).
   */
  _resetForTests(): void {
    Object.keys(passByFarmerId).forEach((k) => delete passByFarmerId[k])
    Object.assign(passByFarmerId, ACTIVE_PASSES)
    Object.keys(passById).forEach((k) => delete passById[k])
    passById[RAMESH_PASS.id] = RAMESH_PASS
    nextTokenNumber = 1048
  },
}
