import type { CropOption } from '../../../types/queue'

/**
 * All supported crops with MSP rates (2024–25 season).
 * Source: docs/22_MOCK_DATA.md and docs/05_FEATURE_SPECIFICATION.md
 */
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
    emoji: '🌿',
  },
  {
    id: 'barley',
    nameEn: 'Barley',
    nameHi: 'जौ',
    mspPerQuintal: 1735,
    emoji: '🌱',
  },
]

export const CROP_MAP: Record<string, CropOption> = Object.fromEntries(
  CROP_OPTIONS.map((c) => [c.id, c]),
)
