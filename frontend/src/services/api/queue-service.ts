import type { GeneratePassRequest, ProcurementPass } from '@/types/queue'
import { apiClient } from './client'

/** Minimal queue entry shape used by CentreDetailPage's public queue list. */
export interface QueueEntryPreview {
  id: string
  position: number
  token: string
  crop: string
  quantityQ: number
  status: 'WAITING' | 'CHECKED_IN' | 'PROCESSING' | 'COMPLETED' | 'SKIPPED' | 'CANCELLED'
}

export const queueService = {
  /** POST /v1/passes/generate — Join queue and get signed QR pass */
  async generatePass(request: GeneratePassRequest): Promise<ProcurementPass> {
    const payload = {
      centre_id: request.centreId,
      crop: request.crop,
      quantity_quintals: request.quantityQ,
    }

    const response = await apiClient.post('/v1/passes/generate', { data: payload }) as Record<string, unknown>
    return mapBackendPassToFrontend(response)
  },

  /** GET /v1/queue/my-status — Get authenticated farmer's active pass status */
  async getMyActivePass(): Promise<ProcurementPass | null> {
    try {
      const response = await apiClient.get('/v1/queue/my-status') as Record<string, unknown>

      if (!response['has_active_pass']) {
        return null
      }

      return mapBackendPassToFrontend(response)
    } catch (e: unknown) {
      if (e instanceof Error && 'status' in e && (e as { status: number }).status === 404) {
        return null
      }
      throw e
    }
  },

  /**
   * Alias for getMyActivePass — used by FarmerHomePage.
   * The `farmerId` param is ignored — auth is JWT-based server-side.
   */
  async getActivePass(_farmerId: string): Promise<ProcurementPass | null> {
    return queueService.getMyActivePass()
  },

  /**
   * GET /v1/queue/my-status — Get pass by ID.
   * Backend exposes farmer's active pass; we return it if the ID matches.
   */
  async getPassById(_id: string): Promise<ProcurementPass | null> {
    return queueService.getMyActivePass()
  },

  /**
   * Returns a preview/summary of what a pass would look like without committing.
   * For now delegates to getMyActivePass — used by SellCropModal summary step.
   */
  async previewPass(_request: GeneratePassRequest): Promise<ProcurementPass | null> {
    return queueService.getMyActivePass()
  },

  /**
   * GET queue entries for a centre — used by CentreDetailPage.
   * Returns an empty array if the backend doesn't expose this for unauthenticated users.
   */
  async getQueueEntries(_centreId: string): Promise<QueueEntryPreview[]> {
    try {
      const response = await apiClient.get('/v1/officer/queue') as { entries: Record<string, unknown>[] }
      return (response.entries ?? []).map((e, idx) => ({
        id: e['id'] as string,
        position: (e['queue_position'] as number | undefined) ?? (idx + 1),
        token: (e['token_code'] as string | undefined) ?? String(e['token_number']),
        crop: e['crop'] as string,
        quantityQ: e['quantity_quintals'] as number,
        status: e['status'] as QueueEntryPreview['status'],
      }))
    } catch {
      return []
    }
  },

  /** POST /v1/queue/{entryId}/cancel — Cancel an active pass */
  async cancelPass(passId: string): Promise<void> {
    await apiClient.post(`/v1/queue/${passId}/cancel`)
  },
}

function mapBackendPassToFrontend(response: Record<string, unknown>): ProcurementPass {
  return {
    id: response['pass_id'] as string,
    token: response['token'] as string,
    farmerId: (response['farmer_id'] as string | undefined) ?? '',
    farmerName: (response['farmer_name'] as string | undefined) ?? '',
    centreId: response['centre_id'] as string,
    centreName: response['centre_name'] as string,
    centreHindiName: (response['centre_hindi_name'] as string | undefined) ?? (response['centre_name'] as string),
    crop: response['crop'] as ProcurementPass['crop'],
    cropNameEn: response['crop'] as string,
    cropNameHi: response['crop'] as string, // TODO: localize from crop-constants
    quantityQ: response['quantity_quintals'] as number,
    queuePosition: (response['queue_position'] as number | undefined) ?? 0,
    etaMinutes: response['eta_minutes'] as number | null,
    status: response['status'] as ProcurementPass['status'],
    queueEntryStatus: response['queue_entry_status'] as ProcurementPass['queueEntryStatus'],
    issuedAt: response['issued_at'] as string,
    validUntil: (response['valid_until'] as string | undefined) ?? '',
    qrPayload: response['qr_payload'] as string,
  }
}
