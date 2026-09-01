/**
 * lib/crop-constants.ts — Canonical crop metadata for KisanQueue.
 *
 * This is the single source of truth for crop IDs and their display metadata.
 * It replaces the previously-missing @/services/mock/fixtures/crops module.
 *
 * NOTE: MSP rates here are for *display/estimation* only.
 * The authoritative rates used for actual payment come from
 * `centre.msp_rates` returned by the backend API.
 */

import type { CropOption } from '@/types/queue'

export const CROP_OPTIONS: readonly CropOption[] = [
  {
    id: 'wheat',
    nameEn: 'Wheat',
    nameHi: 'गेहूं',
    mspPerQuintal: 2275,
    emoji: '🌾',
  },
  {
    id: 'soybean',
    nameEn: 'Soybean',
    nameHi: 'सोयाबीन',
    mspPerQuintal: 4600,
    emoji: '🫘',
  },
  {
    id: 'paddy',
    nameEn: 'Paddy',
    nameHi: 'धान',
    mspPerQuintal: 2300,
    emoji: '🌾',
  },
  {
    id: 'barley',
    nameEn: 'Barley',
    nameHi: 'जौ',
    mspPerQuintal: 1735,
    emoji: '🌿',
  },
] as const

/** Quick lookup by crop ID */
export const CROP_BY_ID = Object.fromEntries(
  CROP_OPTIONS.map((c) => [c.id, c]),
) as Record<string, CropOption>

/** Localized crop name helper */
export function getCropName(id: string, lang: 'en' | 'hi'): string {
  const crop = CROP_BY_ID[id]
  if (!crop) return id
  return lang === 'hi' ? crop.nameHi : crop.nameEn
}
