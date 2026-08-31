/**
 * Query key factory for authentication and farmer profiles.
 * Applied per TanStack Query best practices.
 */
export const authKeys = {
  all: () => ['auth'] as const,
  profile: (phone?: string) => [...authKeys.all(), 'profile', phone ?? 'current'] as const,
  session: () => [...authKeys.all(), 'session'] as const,
} as const
