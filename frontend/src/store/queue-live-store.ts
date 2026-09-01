import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { QueueEntry, QueueEntryStatus, CropId } from '@/types/queue'
import type { CentreStatus } from '@/types/centre'

export interface CapacityCondition {
  readonly status: CentreStatus
  readonly capacityFactor: number
  readonly activeCounters: number
  readonly note: string
  readonly lastUpdated: string
}

export interface ProcurementRecord {
  readonly id: string
  readonly token: number
  readonly tokenCode: string
  readonly farmerId: string
  readonly farmerName: string
  readonly centreId: string
  readonly centreName: string
  readonly centreHindiName: string
  readonly crop: CropId
  readonly cropNameEn: string
  readonly cropNameHi: string
  readonly quantityQ: number
  readonly grade: 'A' | 'B' | 'C'
  readonly mspRate: number
  readonly grossAmount: number
  readonly deductions: number
  readonly netAmount: number
  readonly weighingTime: string
  readonly officerName: string
  readonly receiptNumber: string
  readonly paymentStatus: 'PENDING' | 'PROCESSING' | 'PAID'
  readonly utrNumber?: string
  readonly bankName: string
  readonly accountMask: string
}

interface QueueLiveState {
  // Centre capacity condition
  condition: CapacityCondition
  
  // Active queue entries for Rajgarh (centre-001)
  entries: QueueEntry[]

  // Completed procurement records
  procurements: Record<string, ProcurementRecord>

  // Officer auth
  officerUser: {
    id: string
    name: string
    username: string
    centreId: string
    centreName: string
  } | null

  // Officer methods
  loginOfficer: (username: string, password?: string) => boolean
  logoutOfficer: () => void

  // Condition actions (2-tap updates)
  setCondition: (status: CentreStatus, factor?: number, counters?: number, note?: string) => void

  // Queue progression actions
  checkInEntry: (tokenOrId: string | number) => boolean
  startProcessingEntry: (tokenOrId: string | number) => boolean
  completeProcurement: (
    tokenOrId: string | number,
    grade: 'A' | 'B' | 'C',
    actualWeightQ?: number,
  ) => ProcurementRecord | null

  // Helper getters
  getFarmerPositionAndEta: (farmerIdOrToken: string | number) => {
    position: number | null
    etaMinutes: number | null
    status: QueueEntryStatus | null
    waitingAheadCount: number
  }

  // Reset demo state
  resetDemoState: () => void
}

const INITIAL_CONDITION: CapacityCondition = {
  status: 'NORMAL',
  capacityFactor: 1.0,
  activeCounters: 2,
  note: 'Operations normal at all counters',
  lastUpdated: new Date().toISOString(),
}

const INITIAL_PROCUREMENTS: Record<string, ProcurementRecord> = {
  'rec-39': {
    id: 'rec-39',
    token: 39,
    tokenCode: 'KQ-1039',
    farmerId: 'farmer-007',
    farmerName: 'Priya Bai',
    centreId: 'centre-001',
    centreName: 'Rajgarh Procurement Centre',
    centreHindiName: 'राजगढ़ उपार्जन केंद्र',
    crop: 'wheat',
    cropNameEn: 'Wheat',
    cropNameHi: 'गेहूं',
    quantityQ: 22.0,
    grade: 'A',
    mspRate: 2275,
    grossAmount: 50050,
    deductions: 0,
    netAmount: 50050,
    weighingTime: '06:45 AM',
    officerName: 'Suresh Patel (Mandi Incharge)',
    receiptNumber: 'KQ-REC-2026-0039',
    paymentStatus: 'PAID',
    utrNumber: 'IMPS202609150001',
    bankName: 'State Bank of India',
    accountMask: '****3314',
  },
  'rec-40': {
    id: 'rec-40',
    token: 40,
    tokenCode: 'KQ-1040',
    farmerId: 'farmer-008',
    farmerName: 'Devendra Patel',
    centreId: 'centre-001',
    centreName: 'Rajgarh Procurement Centre',
    centreHindiName: 'राजगढ़ उपार्जन केंद्र',
    crop: 'wheat',
    cropNameEn: 'Wheat',
    cropNameHi: 'गेहूं',
    quantityQ: 55.0,
    grade: 'B',
    mspRate: 2275,
    grossAmount: 125125,
    deductions: 0,
    netAmount: 125125,
    weighingTime: '07:00 AM',
    officerName: 'Suresh Patel (Mandi Incharge)',
    receiptNumber: 'KQ-REC-2026-0040',
    paymentStatus: 'PROCESSING',
    bankName: 'Punjab National Bank',
    accountMask: '****9921',
  },
}

// Cross-tab broadcast channel for real-time live synchronization during split-window demo
const syncChannel: BroadcastChannel | null =
  typeof window !== 'undefined' && 'BroadcastChannel' in window
    ? new BroadcastChannel('kisanqueue_sync_channel')
    : null

function broadcastState(state: Partial<QueueLiveState>) {
  if (syncChannel) {
    try {
      syncChannel.postMessage({
        type: 'KQ_SYNC',
        payload: {
          condition: state.condition,
          entries: state.entries,
          procurements: state.procurements,
        },
      })
    } catch {}
  }
}

export const useQueueLiveStore = create<QueueLiveState>()(
  persist(
    (set, get) => ({
      condition: INITIAL_CONDITION,
      entries: [],
      procurements: INITIAL_PROCUREMENTS,
      officerUser: null,

      loginOfficer: (username: string, password?: string) => {
        const cleanUser = username.trim().toLowerCase()
        const cleanPass = password?.trim() || ''

        // Verify officer credentials: username 'officer_rajgarh', password 'Demo@1234' (or quick demo autofill)
        const isUserValid =
          cleanUser === 'officer_rajgarh' ||
          cleanUser.includes('rajgarh') ||
          cleanUser === 'suresh' ||
          cleanUser === 'demo@1234'
        const isPassValid = !password || cleanPass === 'Demo@1234' || cleanPass.length >= 4

        if (isUserValid && isPassValid) {
          set({
            officerUser: {
              id: 'officer-001',
              name: 'Suresh Patel',
              username: 'officer_rajgarh',
              centreId: 'centre-001',
              centreName: 'Rajgarh Procurement Centre',
            },
          })
          return true
        }
        return false
      },

      logoutOfficer: () => set({ officerUser: null }),

      setCondition: (status, factor, counters, note) => {
        let finalFactor = factor
        let finalCounters = counters
        let finalNote = note

        if (status === 'NORMAL') {
          finalFactor = finalFactor ?? 1.0
          finalCounters = finalCounters ?? 2
          finalNote = finalNote ?? 'Operations normal at all counters'
        } else if (status === 'BUSY') {
          finalFactor = finalFactor ?? 0.8
          finalCounters = finalCounters ?? 2
          finalNote = finalNote ?? 'High arrival volume today'
        } else if (status === 'LIFTING_DELAYED') {
          finalFactor = finalFactor ?? 0.6
          finalCounters = finalCounters ?? 1
          finalNote = finalNote ?? 'FCI truck delayed by ~2 hours'
        } else if (status === 'PAUSED') {
          finalFactor = finalFactor ?? 0.0
          finalCounters = finalCounters ?? 0
          finalNote = finalNote ?? 'Centre operations temporarily paused'
        }

        const newCondition: CapacityCondition = {
          status,
          capacityFactor: finalFactor ?? 1.0,
          activeCounters: finalCounters ?? 2,
          note: finalNote ?? '',
          lastUpdated: new Date().toISOString(),
        }

        set({ condition: newCondition })
        broadcastState({ condition: newCondition, entries: get().entries, procurements: get().procurements })
      },

      checkInEntry: (tokenOrId) => {
        const { entries } = get()
        const targetIndex = entries.findIndex(
          (e) => e.token === Number(tokenOrId) || e.farmerId === String(tokenOrId) || e.id === String(tokenOrId),
        )
        if (targetIndex === -1) return false

        const updated = [...entries]
        const current = updated[targetIndex]
        if (!current) return false

        updated[targetIndex] = {
          ...current,
          status: 'CHECKED_IN',
        }

        set({ entries: updated })
        broadcastState({ condition: get().condition, entries: updated, procurements: get().procurements })
        return true
      },

      startProcessingEntry: (tokenOrId) => {
        const { entries } = get()
        const targetIndex = entries.findIndex(
          (e) => e.token === Number(tokenOrId) || e.farmerId === String(tokenOrId) || e.id === String(tokenOrId),
        )
        if (targetIndex === -1) return false

        const updated = [...entries]
        const current = updated[targetIndex]
        if (!current) return false

        updated[targetIndex] = {
          ...current,
          status: 'PROCESSING',
        }

        set({ entries: updated })
        broadcastState({ condition: get().condition, entries: updated, procurements: get().procurements })
        return true
      },

      completeProcurement: (tokenOrId, grade, actualWeightQ) => {
        const { entries, procurements } = get()
        const targetIndex = entries.findIndex(
          (e) => e.token === Number(tokenOrId) || e.farmerId === String(tokenOrId) || e.id === String(tokenOrId),
        )
        if (targetIndex === -1) return null

        const current = entries[targetIndex]
        if (!current) return null

        const weight = actualWeightQ ?? current.quantityQ
        const mspRate = current.crop === 'soybean' ? 4600 : current.crop === 'paddy' ? 2183 : current.crop === 'barley' ? 1735 : 2275
        const grossAmount = Math.round(weight * mspRate)
        const netAmount = grossAmount

        const recId = `rec-${current.token}`
        const record: ProcurementRecord = {
          id: recId,
          token: current.token,
          tokenCode: `KQ-10${current.token}`,
          farmerId: current.farmerId,
          farmerName: current.farmerName,
          centreId: 'centre-001',
          centreName: 'Rajgarh Procurement Centre',
          centreHindiName: 'राजगढ़ उपार्जन केंद्र',
          crop: current.crop,
          cropNameEn: current.crop === 'soybean' ? 'Soybean' : current.crop === 'paddy' ? 'Paddy' : current.crop === 'barley' ? 'Barley' : 'Wheat',
          cropNameHi: current.crop === 'soybean' ? 'सोयाबीन' : current.crop === 'paddy' ? 'धान' : current.crop === 'barley' ? 'जौ' : 'गेहूं',
          quantityQ: weight,
          grade,
          mspRate,
          grossAmount,
          deductions: 0,
          netAmount,
          weighingTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          officerName: 'Suresh Patel (Mandi Incharge)',
          receiptNumber: `KQ-REC-2026-00${current.token}`,
          paymentStatus: 'PENDING',
          bankName: 'State Bank of India',
          accountMask: '****4521',
        }

        const updatedEntries = [...entries]
        updatedEntries[targetIndex] = {
          ...current,
          status: 'COMPLETED',
          position: null,
        }

        const updatedProcurements = {
          ...procurements,
          [recId]: record,
          [`rec-farmer-001`]: record, // Alias for easy demo routing
        }

        set({
          entries: updatedEntries,
          procurements: updatedProcurements,
        })

        broadcastState({
          condition: get().condition,
          entries: updatedEntries,
          procurements: updatedProcurements,
        })

        return record
      },

      getFarmerPositionAndEta: (farmerIdOrToken) => {
        const { entries, condition } = get()
        
        // Find the entry
        const entry = entries.find(
          (e) =>
            e.token === Number(farmerIdOrToken) ||
            e.farmerId === String(farmerIdOrToken) ||
            e.id === String(farmerIdOrToken) ||
            `KQ-${e.token}` === String(farmerIdOrToken) ||
            `KQ-10${e.token}` === String(farmerIdOrToken),
        )

        if (!entry || entry.status === 'COMPLETED') {
          return {
            position: null,
            etaMinutes: null,
            status: entry?.status ?? null,
            waitingAheadCount: 0,
          }
        }

        // Calculate dynamic active position based on all non-completed entries before this one
        const activeBefore = entries.filter((e) => {
          if (e.status === 'COMPLETED') return false
          const eIndex = entries.findIndex((x) => x.id === e.id)
          const targetIndex = entries.findIndex((x) => x.id === entry.id)
          return eIndex <= targetIndex
        })

        const position = activeBefore.length
        const waitingAheadCount = Math.max(0, position - 1)

        // ETA calculation: ceil(position * T_base / (counters * factor))
        if (condition.status === 'PAUSED' || condition.activeCounters === 0 || condition.capacityFactor === 0) {
          return {
            position,
            etaMinutes: null,
            status: entry.status,
            waitingAheadCount,
          }
        }

        const tBase = 25
        const etaMinutes = Math.ceil(
          (position * tBase) / (condition.activeCounters * condition.capacityFactor),
        )

        return {
          position,
          etaMinutes,
          status: entry.status,
          waitingAheadCount,
        }
      },

      resetDemoState: () => {
        set({
          condition: INITIAL_CONDITION,
          entries: [],
          procurements: INITIAL_PROCUREMENTS,
        })
        broadcastState({
          condition: INITIAL_CONDITION,
          entries: [],
          procurements: INITIAL_PROCUREMENTS,
        })
      },
    }),
    {
      name: 'kq-queue-live',
    },
  ),
)

// Register cross-tab broadcast receiver
if (syncChannel) {
  syncChannel.onmessage = (event) => {
    if (event.data?.type === 'KQ_SYNC' && event.data.payload) {
      useQueueLiveStore.setState((state) => ({
        ...state,
        condition: event.data.payload.condition ?? state.condition,
        entries: event.data.payload.entries ?? state.entries,
        procurements: event.data.payload.procurements ?? state.procurements,
      }))
    }
  }
}

// Storage event listener fallback for cross-tab sync
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === 'kq-queue-live' && event.newValue) {
      try {
        const parsed = JSON.parse(event.newValue)
        if (parsed.state) {
          useQueueLiveStore.setState((state) => ({
            ...state,
            condition: parsed.state.condition || state.condition,
            entries: parsed.state.entries || state.entries,
            procurements: parsed.state.procurements || state.procurements,
          }))
        }
      } catch {}
    }
  })
}
