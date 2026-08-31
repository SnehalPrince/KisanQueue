import { describe, it, expect } from 'vitest'
import { computeEta, formatEta } from '@/lib/eta'

describe('computeEta', () => {
  it('Rajgarh NORMAL — n=5, tBase=25, C=2, F=1.00 → 63 min', () => {
    expect(computeEta(5, 25, 2, 1.0)).toBe(63)
  })

  it('Rajgarh LIFTING_DELAYED — n=5, tBase=25, C=1, F=0.60 → 209 min', () => {
    expect(computeEta(5, 25, 1, 0.6)).toBe(209)
  })

  it('Hisar BUSY — n=22, tBase=30, C=2, F=0.80 → 413 min', () => {
    expect(computeEta(22, 30, 2, 0.8)).toBe(413)
  })

  it('returns Infinity when counters=0 (PAUSED)', () => {
    expect(computeEta(10, 25, 0, 0)).toBe(Infinity)
  })

  it('returns Infinity when factor=0', () => {
    expect(computeEta(5, 25, 2, 0)).toBe(Infinity)
  })

  it('ceil rounds up fractional minutes', () => {
    // ceil(5 × 25 / (1 × 0.6)) = ceil(208.33) = 209
    expect(computeEta(5, 25, 1, 0.6)).toBe(209)
  })
})

describe('formatEta', () => {
  it('returns pausedText for null ETA (PAUSED)', () => {
    expect(formatEta(null, 'en', 'No ETA')).toBe('No ETA')
    expect(formatEta(null, 'hi', 'बंद')).toBe('बंद')
  })

  it('formats sub-60 minutes in English', () => {
    expect(formatEta(45, 'en', 'No ETA')).toBe('~45 min')
    expect(formatEta(1, 'en', 'No ETA')).toBe('~1 min')
  })

  it('formats sub-60 minutes in Hindi', () => {
    expect(formatEta(45, 'hi', 'बंद')).toBe('~45 मिनट')
  })

  it('formats exactly 60 minutes in English', () => {
    expect(formatEta(60, 'en', 'No ETA')).toBe('~1h')
  })

  it('formats exactly 60 minutes in Hindi', () => {
    expect(formatEta(60, 'hi', 'बंद')).toBe('~1 घं')
  })

  it('formats hours + remaining minutes in English', () => {
    expect(formatEta(63, 'en', 'No ETA')).toBe('~1h 3m')
    expect(formatEta(209, 'en', 'No ETA')).toBe('~3h 29m')
    expect(formatEta(413, 'en', 'No ETA')).toBe('~6h 53m')
  })

  it('formats hours + remaining minutes in Hindi', () => {
    expect(formatEta(63, 'hi', 'बंद')).toBe('~1 घं 3 मि')
    expect(formatEta(209, 'hi', 'बंद')).toBe('~3 घं 29 मि')
  })
})
