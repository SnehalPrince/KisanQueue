import type { CentrePreview } from '../../types/centre'

const centrePreviews: readonly CentrePreview[] = [
  { id: 'centre-001', name: 'Rajgarh Procurement Centre', hindiName: 'राजगढ़ उपार्जन केंद्र', district: 'Rajgarh, MP', distanceKm: 12, status: 'NORMAL', queueLength: 9, etaMinutes: 63, confidence: 'HIGH', activeCounters: 2, capacityFactor: 1, updatedMinutesAgo: 2, note: 'Operating normally. Farmer Ramesh is currently at position 5 in the seeded demo queue.' },
  { id: 'centre-002', name: 'Hisar HAFED Centre', hindiName: 'हिसार हैफेड केंद्र', district: 'Hisar, Haryana', distanceKm: 28, status: 'BUSY', queueLength: 22, etaMinutes: 413, confidence: 'MEDIUM', activeCounters: 2, capacityFactor: 0.8, updatedMinutesAgo: 6, note: 'High congestion today. Consider visiting only if this centre is your most suitable option.' },
  { id: 'centre-003', name: 'Patiala Anaaj Kharid Centre', hindiName: 'पटियाला अनाज खरीद केंद्र', district: 'Patiala, Punjab', distanceKm: 41, status: 'PAUSED', queueLength: 0, etaMinutes: null, confidence: 'NA', activeCounters: 0, capacityFactor: 0, updatedMinutesAgo: 4, note: 'Operations are paused today. New queue requests are not being accepted.' },
]

const wait = (milliseconds: number) => new Promise((resolve) => window.setTimeout(resolve, milliseconds))

export const centreService = {
  async listPreviews(): Promise<readonly CentrePreview[]> {
    await wait(550)
    return centrePreviews
  },
}
