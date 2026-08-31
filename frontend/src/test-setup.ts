import '@testing-library/jest-dom'

/**
 * IntersectionObserver mock for jsdom.
 *
 * Motion (motion/react) uses IntersectionObserver internally for whileInView
 * animations. jsdom does not implement it, so we stub it out for tests.
 * The mock fires the callback immediately with isIntersecting: true so
 * animated elements behave as if they are visible.
 */
class IntersectionObserverMock {
  readonly root = null
  readonly rootMargin = '0px'
  readonly thresholds: readonly number[] = []
  private readonly callback: IntersectionObserverCallback

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback
  }

  observe(target: Element) {
    this.callback(
      [{ isIntersecting: true, target } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver,
    )
  }

  unobserve() {}
  disconnect() {}
  takeRecords(): IntersectionObserverEntry[] { return [] }
}

Object.defineProperty(globalThis, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: IntersectionObserverMock,
})

/**
 * matchMedia mock for jsdom.
 * Used by useReducedMotion() (motion/react) and CSS media query hooks.
 */
Object.defineProperty(globalThis, 'matchMedia', {
  writable: true,
  configurable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
})
