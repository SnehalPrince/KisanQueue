export const centreStatuses = ['NORMAL', 'BUSY', 'LIFTING_DELAYED', 'PAUSED'] as const
export type CentreStatus = (typeof centreStatuses)[number]

export interface CentrePreview {
  readonly id: string
  readonly name: string
  readonly hindiName: string
  readonly district: string
  readonly distanceKm: number
  readonly status: CentreStatus
  readonly queueLength: number
  readonly etaMinutes: number | null
  readonly confidence: 'HIGH' | 'MEDIUM' | 'LOW' | 'NA'
  readonly activeCounters: number
  readonly capacityFactor: number
  readonly updatedMinutesAgo: number
  readonly note: string
}
