import type { CentrePreview } from '../../../types/centre'

/**
 * Canonical demo fixtures derived from docs/22_MOCK_DATA.md.
 *
 * centre-001 Rajgarh — Scenario A/C
 *   Ramesh (farmer-001) is at position 5 in a 9-farmer active queue.
 *   ETA = ceil(5 × 25 / (2 × 1.00)) = 63 min   [NORMAL]
 *   ETA = ceil(5 × 25 / (1 × 0.60)) = 209 min  [after LIFTING_DELAYED]
 *
 * centre-002 Hisar — Scenario B
 *   ETA = ceil(22 × 30 / (2 × 0.80)) = 413 min
 *
 * centre-003 Patiala — Scenario D
 *   PAUSED — no ETA, joining blocked.
 */
export const CENTRE_FIXTURES: readonly CentrePreview[] = [
  {
    id: 'centre-001',
    name: 'Rajgarh Procurement Centre',
    hindiName: 'राजगढ़ उपार्जन केंद्र',
    district: 'Rajgarh, MP',
    distanceKm: 12,
    status: 'NORMAL',
    queueLength: 9,
    etaMinutes: 63,
    confidence: 'HIGH',
    activeCounters: 2,
    capacityFactor: 1.0,
    updatedMinutesAgo: 2,
    note: 'Centre is operating normally with 2 active counters. Wheat and Soybean procurement in progress.',
  },
  {
    id: 'centre-002',
    name: 'Hisar HAFED Centre',
    hindiName: 'हिसार हैफेड केंद्र',
    district: 'Hisar, Haryana',
    distanceKm: 28,
    status: 'BUSY',
    queueLength: 22,
    etaMinutes: 413,
    confidence: 'MEDIUM',
    activeCounters: 2,
    capacityFactor: 0.8,
    updatedMinutesAgo: 6,
    note: 'High congestion today. The estimated wait is long. Consider visiting only if this is your nearest eligible centre.',
  },
  {
    id: 'centre-003',
    name: 'Patiala Anaaj Kharid Centre',
    hindiName: 'पटियाला अनाज खरीद केंद्र',
    district: 'Patiala, Punjab',
    distanceKm: 41,
    status: 'PAUSED',
    queueLength: 0,
    etaMinutes: null,
    confidence: 'NA',
    activeCounters: 0,
    capacityFactor: 0,
    updatedMinutesAgo: 4,
    note: 'Operations are paused today. New queue requests are not being accepted. Check again later or contact the centre.',
  },
]
