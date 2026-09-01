/**
 * Queue & Pass domain types for KisanQueue.
 * Matches the demo data in docs/22_MOCK_DATA.md.
 */

export type QueueEntryStatus = 'WAITING' | 'CHECKED_IN' | 'PROCESSING' | 'COMPLETED'

export type PassStatus = 'ACTIVE' | 'USED' | 'EXPIRED' | 'CANCELLED'

export type CropId = 'wheat' | 'soybean' | 'paddy' | 'barley'

export interface CropOption {
  readonly id: CropId
  /** English display name */
  readonly nameEn: string
  /** Hindi display name */
  readonly nameHi: string
  /** MSP per quintal in INR */
  readonly mspPerQuintal: number
  /** Emoji icon */
  readonly emoji: string
}

/**
 * A single entry in a procurement centre's queue.
 * Minimal data — subset needed by the farmer-facing UI.
 */
export interface QueueEntry {
  readonly id: string
  /** Token number (e.g. 47) */
  readonly token: number
  /** Canonical farmer ID (or seed identifier) */
  readonly farmerId: string
  readonly farmerName: string
  readonly crop: CropId
  /** Quantity in quintals */
  readonly quantityQ: number
  readonly status: QueueEntryStatus
  /** 1-based position among non-COMPLETED entries. null for COMPLETED. */
  readonly position: number | null
  readonly joinedAt: string
}

/**
 * A digital procurement pass — the primary artefact farmers carry to the mandi.
 * Token KQ-1047 is the canonical demo pass for Ramesh Kumar.
 */
export interface ProcurementPass {
  readonly id: string
  /** Human-readable token identifier, e.g. "KQ-1047" */
  readonly token: string
  readonly farmerId: string
  readonly farmerName: string
  readonly centreId: string
  readonly centreName: string
  readonly centreHindiName: string
  readonly crop: CropId
  readonly cropNameEn: string
  readonly cropNameHi: string
  readonly quantityQ: number
  /** Current queue position (live-updated) */
  readonly queuePosition: number
  /** ETA in minutes from now */
  readonly etaMinutes: number | null
  readonly status: PassStatus
  readonly queueEntryStatus: QueueEntryStatus
  readonly issuedAt: string
  readonly validUntil: string
  /** Compact QR payload — token:farmerId:centreId */
  readonly qrPayload: string
}

/**
 * Request to generate a pass (from conversational sell flow).
 */
export interface GeneratePassRequest {
  readonly farmerId: string
  readonly centreId: string
  readonly crop: CropId
  readonly quantityQ: number
}

/**
 * Summary shown in Step 4 before farmer confirms.
 */
export interface PassSummary {
  readonly centreId: string
  readonly centreName: string
  readonly centreHindiName: string
  readonly centreStatus: string
  readonly crop: CropId
  readonly cropNameEn: string
  readonly cropNameHi: string
  readonly quantityQ: number
  readonly estimatedQueuePosition: number
  readonly estimatedEtaMinutes: number | null
  /** Approximate MSP earnings */
  readonly estimatedMsp: number
  readonly mspRate: number
}
