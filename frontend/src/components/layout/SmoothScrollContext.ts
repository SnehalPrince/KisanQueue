import { createContext, useContext } from 'react'

export interface SmoothScrollContextType {
  readonly scrollTo: (target: string | HTMLElement | number, options?: { offset?: number; duration?: number }) => void
}

export const SmoothScrollContext = createContext<SmoothScrollContextType>({
  scrollTo: () => {},
})

export function useSmoothScroll() {
  return useContext(SmoothScrollContext)
}
