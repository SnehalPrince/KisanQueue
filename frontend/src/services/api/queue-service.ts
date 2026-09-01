import type { GeneratePassRequest, ProcurementPass } from '@/types/queue'
import { apiClient } from './client'

export const queueService = {
  async generatePass(request: GeneratePassRequest): Promise<ProcurementPass> {
    const payload = {
      centre_id: request.centreId,
      crop: request.crop,
      quantity_quintals: request.quantityQ,
    }

    const response = await apiClient.post('/v1/passes/generate', { data: payload })
    return mapBackendPassToFrontend(response)
  },

  async getMyActivePass(): Promise<ProcurementPass | null> {
    try {
      const response = await apiClient.get('/v1/queue/my-status')
      
      if (!response.has_active_pass) {
        return null
      }
      
      return mapBackendPassToFrontend(response)
    } catch (e: any) {
      if (e.status === 404) {
        return null
      }
      throw e
    }
  },

  async cancelPass(passId: string): Promise<void> {
    // Implement if backend supports it. For now, throw.
    throw new Error('Cancel pass not implemented in backend')
  }
}

function mapBackendPassToFrontend(response: any): ProcurementPass {
  return {
    id: response.pass_id,
    token: response.token,
    farmerId: response.farmer_id || '',
    farmerName: response.farmer_name || '',
    centreId: response.centre_id,
    centreName: response.centre_name,
    centreHindiName: response.centre_hindi_name || response.centre_name,
    crop: response.crop as any,
    cropNameEn: response.crop,
    cropNameHi: response.crop, // TODO: localize
    quantityQ: response.quantity_quintals,
    queuePosition: response.queue_position,
    etaMinutes: response.eta_minutes,
    status: response.status as any,
    queueEntryStatus: response.queue_entry_status as any,
    issuedAt: response.issued_at,
    validUntil: response.valid_until || '',
    qrPayload: response.qr_payload,
  }
}
