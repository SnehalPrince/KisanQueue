import type { CentrePreview, CentreStatus, EtaConfidence } from '@/types/centre'
import { apiClient } from './client'

function mapCentre(c: Record<string, unknown>): CentrePreview {
  return {
    id: c['id'] as string,
    name: c['name'] as string,
    hindiName: (c['hindi_name'] as string | undefined) ?? (c['name'] as string),
    district: c['district'] as string,
    distanceKm: Math.round((Math.random() * 20 + 5) * 10) / 10, // Mocked — backend doesn't have GPS-distance logic yet
    status: c['status'] as CentreStatus,
    queueLength: (c['queue_length'] as number | undefined) ?? 0,
    etaMinutes: c['eta_minutes'] as number | null,
    confidence: ((c['eta_confidence'] as string | undefined) ?? 'NA') as EtaConfidence,
    activeCounters: (c['active_counters'] as number | undefined) ?? 0,
    capacityFactor: (c['capacity_factor'] as number | undefined) ?? 1.0,
    updatedMinutesAgo: (c['updated_minutes_ago'] as number | undefined) ?? 0,
    note: (c['note'] as string | undefined) ?? '',
  }
}

export const centreService = {
  /** GET /v1/centres — list all active centres with live ETA */
  async getCentres(): Promise<CentrePreview[]> {
    const response = await apiClient.get('/v1/centres') as { centres: Record<string, unknown>[] }
    return response.centres.map(mapCentre)
  },

  /** Alias for getCentres — used by CentresPage, LandingPage, FarmerHomePage */
  async listPreviews(): Promise<CentrePreview[]> {
    return centreService.getCentres()
  },

  /** Get a single centre by ID — lists all then filters */
  async getCentreById(id: string): Promise<CentrePreview | null> {
    const centres = await centreService.getCentres()
    return centres.find(c => c.id === id) ?? null
  },

  /** Alias for getCentreById — used by CentreDetailPage */
  async getDetail(id: string): Promise<CentrePreview | null> {
    return centreService.getCentreById(id)
  },
}
