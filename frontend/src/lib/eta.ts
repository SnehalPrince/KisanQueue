import type { Language } from '@/store/app-store'

/**
 * Compute ETA using the KisanQueue capacity-aware formula.
 *
 * ETA = ceil(N × T_base / (C × F))
 *
 * @param n       - farmers ahead (queue position, including farmer)
 * @param tBase   - average processing time per farmer (minutes)
 * @param counters - active counter count
 * @param factor  - capacity factor (1.0 = normal, 0.6 = 40% delayed)
 * @returns       estimated wait in whole minutes (always ≥ 1)
 *
 * @example
 * // Rajgarh NORMAL: n=5, tBase=25, C=2, F=1.00 → 63
 * computeEta(5, 25, 2, 1.0) // 63
 *
 * @example
 * // Rajgarh LIFTING_DELAYED: n=5, tBase=25, C=1, F=0.60 → 209
 * computeEta(5, 25, 1, 0.6) // 209
 */
export function computeEta(n: number, tBase: number, counters: number, factor: number): number {
  if (counters <= 0 || factor <= 0) return Infinity
  return Math.ceil((n * tBase) / (counters * factor))
}

/**
 * Format an ETA duration into a human-readable string.
 *
 * @param minutes    - raw minutes (null = paused/unavailable)
 * @param language   - 'en' or 'hi'
 * @param pausedText - caller-provided translated fallback for null ETA
 *
 * @example
 * formatEta(63, 'en', 'No ETA')   // '~1h 3m'
 * formatEta(63, 'hi', '—')        // '~1 घं 3 मि'
 * formatEta(45, 'en', 'No ETA')   // '~45 min'
 * formatEta(null, 'en', 'No ETA') // 'No ETA'
 */
export function formatEta(minutes: number | null, language: Language, pausedText: string): string {
  if (minutes === null) return pausedText

  if (minutes < 60) {
    return language === 'hi' ? `~${minutes} मिनट` : `~${minutes} min`
  }

  const hours = Math.floor(minutes / 60)
  const remainder = minutes % 60

  if (language === 'hi') {
    return remainder === 0 ? `~${hours} घं` : `~${hours} घं ${remainder} मि`
  }

  return remainder === 0 ? `~${hours}h` : `~${hours}h ${remainder}m`
}
