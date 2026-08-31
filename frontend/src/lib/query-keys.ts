/**
 * Query key factory for the centre domain.
 * Use hierarchical keys for efficient cache invalidation.
 *
 * Based on TanStack Query best-practices skill:
 * - Factory pattern ensures type-safe, consistent keys
 * - Hierarchical: invalidating centreKeys.all() clears all centre queries
 */
export const centreKeys = {
  all: () => ['centres'] as const,
  lists: () => [...centreKeys.all(), 'list'] as const,
  list: () => [...centreKeys.lists()] as const,
  details: () => [...centreKeys.all(), 'detail'] as const,
  detail: (id: string) => [...centreKeys.details(), id] as const,
} as const
