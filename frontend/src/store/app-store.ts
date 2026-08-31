import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Language } from '@/types/centre'
import type { FarmerProfile, AuthSession } from '@/types/auth'

export type { Language }

interface AppState {
  /** UI language — persisted across sessions. */
  readonly language: Language
  setLanguage: (lang: Language) => void

  /** Authenticated farmer profile */
  readonly farmer: FarmerProfile | null

  /** Session JWT token (mock) */
  readonly token: string | null

  /** Whether the current session has an authenticated farmer */
  readonly isAuthenticated: boolean

  /** Log in with session payload */
  login: (session: AuthSession) => void

  /** Log out and clear session */
  logout: () => void

  /** Update active farmer profile */
  updateFarmerProfile: (profile: Partial<FarmerProfile>) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      language: 'hi',
      farmer: null,
      token: null,
      isAuthenticated: false,

      setLanguage: (lang) => set({ language: lang }),

      login: (session) =>
        set({
          farmer: session.farmer,
          token: session.token,
          isAuthenticated: true,
          language: session.farmer.language ?? 'hi',
        }),

      logout: () =>
        set({
          farmer: null,
          token: null,
          isAuthenticated: false,
        }),

      updateFarmerProfile: (partial) =>
        set((state) => ({
          farmer: state.farmer ? { ...state.farmer, ...partial } : null,
        })),
    }),
    {
      name: 'kq-app',
      // Persist language, farmer profile, token, and auth flag
      partialize: (state) => ({
        language: state.language,
        farmer: state.farmer,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
)
