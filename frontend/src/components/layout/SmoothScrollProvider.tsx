import { useEffect, useRef, useCallback, type ReactNode } from 'react'
import Lenis from 'lenis'
import { useReducedMotion } from 'motion/react'
import { SmoothScrollContext } from './SmoothScrollContext'

interface SmoothScrollProviderProps {
  readonly children: ReactNode
}

/**
 * Lenis Smooth Scroll Provider.
 *
 * Applied skills:
 * - accessibility-a11y: strictly respects prefers-reduced-motion (destroys/bypasses smooth scroll)
 * - emil-design-eng: natural exponential ease-out curve, interruptible physics, touch-safe
 * - react: clean cleanup on unmount, context provider pattern without render ref leaks
 */
export function SmoothScrollProvider({ children }: SmoothScrollProviderProps) {
  const lenisRef = useRef<Lenis | null>(null)
  const shouldReduceMotion = useReducedMotion()

  useEffect(() => {
    // If user prefers reduced motion, disable smooth scrolling
    if (shouldReduceMotion) {
      if (lenisRef.current) {
        lenisRef.current.destroy()
        lenisRef.current = null
      }
      return
    }

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Exponential ease-out
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1.0,
      touchMultiplier: 1.5,
      infinite: false,
    })

    lenisRef.current = lenis

    let rafId: number

    function raf(time: number) {
      lenis.raf(time)
      rafId = requestAnimationFrame(raf)
    }

    rafId = requestAnimationFrame(raf)

    return () => {
      cancelAnimationFrame(rafId)
      lenis.destroy()
      lenisRef.current = null
    }
  }, [shouldReduceMotion])

  const scrollTo = useCallback(
    (target: string | HTMLElement | number, options?: { offset?: number; duration?: number }) => {
      if (lenisRef.current) {
        lenisRef.current.scrollTo(target, {
          offset: options?.offset ?? 0,
          duration: options?.duration ?? 1.1,
        })
      } else {
        // Fallback for reduced-motion or SSR
        if (typeof target === 'string') {
          const el = document.querySelector(target)
          el?.scrollIntoView({ behavior: 'auto' })
        } else if (target instanceof HTMLElement) {
          target.scrollIntoView({ behavior: 'auto' })
        } else if (typeof target === 'number') {
          window.scrollTo({ top: target, behavior: 'auto' })
        }
      }
    },
    [],
  )

  return (
    <SmoothScrollContext.Provider value={{ scrollTo }}>
      {children}
    </SmoothScrollContext.Provider>
  )
}
