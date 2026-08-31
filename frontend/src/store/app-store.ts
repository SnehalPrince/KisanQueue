import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Language = 'en' | 'hi'

interface AppState {
  /** UI language — persisted across sessions. */
  language: Language
  setLanguage: (lang: Language) => void

  /**
   * Whether the current session has an authenticated farmer.
   * false for this slice — authentication comes in the onboarding slice.
   * Retained here so components can safely gate on isAuthenticated
   * without needing to change once auth is wired.
   */
  isAuthenticated: boolean
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      language: 'hi',
      setLanguage: (lang) => set({ language: lang }),
      isAuthenticated: false,
    }),
    {
      name: 'kq-app',
      // Only persist language; isAuthenticated comes from real session tokens later.
      partialize: (state) => ({ language: state.language }),
    },
  ),
)
