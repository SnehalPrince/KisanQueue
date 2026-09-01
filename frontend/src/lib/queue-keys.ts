/**
 * TanStack Query key factory for queue & pass queries.
 * Applied per tanstack-query skill: use array key factories for
 * deterministic invalidation and cache sharing.
 */
export const queueKeys = {
  all: ['queue'] as const,

  /** Active pass for a specific farmer */
  activePass: (farmerId: string) => ['queue', 'pass', 'active', farmerId] as const,

  /** Pass by its own ID (for pass detail page) */
  passById: (passId: string) => ['queue', 'pass', passId] as const,

  /** Full queue entry list for a centre */
  centreQueue: (centreId: string) => ['queue', 'entries', centreId] as const,

  /** Pass summary (preview before confirmation) */
  passSummary: (farmerId: string, centreId: string, crop: string, qty: number) =>
    ['queue', 'summary', farmerId, centreId, crop, qty] as const,
} as const
