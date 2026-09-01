import type { CentrePreview } from '@/types/centre'
import { apiClient } from './client'

export const centreService = {
  async getCentres(): Promise<CentrePreview[]> {
    const response = await apiClient.get('/v1/centres')
    // response shape: { count: number, centres: CentreSummary[] }
    
    return response.centres.map((c: any) => ({
      id: c.id,
      name: c.name,
      hindiName: c.hindi_name || c.name,
      district: c.district,
      distanceKm: Math.round((Math.random() * 20 + 5) * 10) / 10, // Mocked for now, backend doesn't have coords distance logic yet
      status: c.status,
      queueLength: c.queue_length,
      etaMinutes: c.eta_minutes,
      confidence: c.eta_confidence,
      activeCounters: c.active_counters,
      capacityFactor: c.capacity_factor,
      updatedMinutesAgo: c.updated_minutes_ago || 0,
      note: c.note || '',
    }))
  },

  async getCentreById(id: string): Promise<CentrePreview | null> {
    const centres = await this.getCentres()
    return centres.find(c => c.id === id) || null
  },
}
