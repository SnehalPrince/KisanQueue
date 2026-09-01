/**
 * services/api/officer-service.ts — Real backend API service for Mandi Officers.
 */
import { apiClient } from './client'
import type { CentreStatus } from '@/types/centre'

export interface OfficerQueueEntry {
  id: string
  token_code: string
  queue_position: number | null
  status: 'WAITING' | 'CHECKED_IN' | 'PROCESSING' | 'COMPLETED' | 'SKIPPED' | 'CANCELLED'
  crop: string
  quantity_q: number
  eta_minutes: number | null
  joined_at: string
}

export interface OfficerQueueResponse {
  centre_id: string | null
  entries: OfficerQueueEntry[]
}

export interface CapacityUpdatePayload {
  status: CentreStatus
  capacity_factor: number
  active_counters: number
  note?: string
}

export interface CompleteProcurementResult {
  status: string
  queue_entry_id: string
  total_amount: number
}

export const officerService = {
  /** Authenticate officer with employee_id and password */
  async login(username: string, password?: string): Promise<{ token: string; user_id: string; role: string }> {
    const payload = {
      username: username.trim(),
      password: password || 'Demo@1234',
    }

    const response = await apiClient.post('/v1/auth/login', { data: payload })
    if (response.access_token) {
      localStorage.setItem('access_token', response.access_token)
      localStorage.setItem('officer_token', response.access_token)
    }
    return {
      token: response.access_token,
      user_id: response.user_id,
      role: response.role,
    }
  },

  /** Fetch active queue for officer's assigned centre */
  async getQueue(): Promise<OfficerQueueResponse> {
    return apiClient.get('/v1/officer/queue')
  },

  /** Check in a farmer via QR string or manual token code */
  async checkIn(params: { qr_data?: string; token_code?: string }): Promise<{ status: string; token_code: string; queue_entry_id: string }> {
    return apiClient.post('/v1/officer/checkin', { data: params })
  },

  /** Update centre capacity status (NORMAL, BUSY, LIFTING_DELAYED, PAUSED) */
  async updateCapacity(data: CapacityUpdatePayload): Promise<{ status: string; new_status: string }> {
    return apiClient.post('/v1/officer/capacity', { data })
  },

  /** Start processing a checked-in farmer */
  async startProcessing(entryId: string): Promise<{ status: string; queue_entry_id: string }> {
    return apiClient.post(`/v1/officer/queue/${entryId}/start`)
  },

  /** Complete procurement, calculate total amount at official MSP, and generate receipt */
  async completeProcessing(entryId: string): Promise<CompleteProcurementResult> {
    return apiClient.post(`/v1/officer/queue/${entryId}/complete`)
  },

  /** Skip an absent farmer in queue */
  async skipEntry(entryId: string): Promise<{ status: string; queue_entry_id: string }> {
    return apiClient.post(`/v1/officer/queue/${entryId}/skip`)
  },

  logout() {
    localStorage.removeItem('officer_token')
  },
}
