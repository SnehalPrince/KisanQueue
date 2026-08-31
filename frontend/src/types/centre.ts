export const centreStatuses = ['NORMAL', 'BUSY', 'LIFTING_DELAYED', 'PAUSED'] as const
export type CentreStatus = (typeof centreStatuses)[number]

export type EtaConfidence = 'HIGH' | 'MEDIUM' | 'LOW' | 'NA'

export type DataFreshness =
  | { readonly stale: false }
  | { readonly stale: true; readonly staleSinceMinutes: number }

export interface CentrePreview {
  readonly id: string
  readonly name: string
  readonly hindiName: string
  readonly district: string
  readonly distanceKm: number
  readonly status: CentreStatus
  readonly queueLength: number
  /** null when centre is PAUSED */
  readonly etaMinutes: number | null
  readonly confidence: EtaConfidence
  readonly activeCounters: number
  readonly capacityFactor: number
  readonly updatedMinutesAgo: number
  readonly note: string
}

/** Minimal farmer preview used across public route previews. */
export interface FarmerPreview {
  readonly id: string
  readonly name: string
  readonly hindiName: string
  readonly phone: string
  readonly queuePosition: number | null
  readonly centreId: string | null
}
