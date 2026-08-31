import type {
  FarmerProfile,
  AuthSession,
  CreateProfileRequest,
} from '@/types/auth'
import { MOCK_FARMERS } from './fixtures/farmers'

/**
 * Standard simulated network delay (ms).
 */
const NETWORK_DELAY = 300

function delay(ms = NETWORK_DELAY): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Clean phone number to E.164 format (+91xxxxxxxxxx).
 */
function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 10) {
    return `+91${digits}`
  }
  if (digits.length === 12 && digits.startsWith('91')) {
    return `+${digits}`
  }
  return phone.trim()
}

/**
 * In-memory state for mock auth service during browser session.
 */
class MockAuthService {
  private farmers: Map<string, FarmerProfile> = new Map()

  constructor() {
    // Populate initial fixture farmers
    for (const farmer of MOCK_FARMERS) {
      this.farmers.set(normalizePhone(farmer.phone), farmer)
    }
  }

  /**
   * Request OTP for a phone number.
   * In demo mode, OTP is always "1234".
   */
  async sendOtp(phone: string): Promise<{ success: boolean; message: string }> {
    await delay(250)
    const normalized = normalizePhone(phone)
    if (!normalized.match(/^\+91[6-9]\d{9}$/)) {
      throw new Error('Please enter a valid 10-digit Indian mobile number')
    }
    return {
      success: true,
      message: 'OTP sent successfully (Demo OTP: 1234)',
    }
  }

  /**
   * Verify OTP.
   * If the phone matches a known farmer, returns an active session with their profile.
   * If new, returns isExisting: false so the UI proceeds to profile details.
   */
  async verifyOtp(
    phone: string,
    otp: string,
  ): Promise<{ isExisting: boolean; session?: AuthSession }> {
    await delay(300)
    const normalized = normalizePhone(phone)

    if (otp !== '1234') {
      throw new Error('Invalid OTP. Please enter 1234 for demo verification.')
    }

    const existing = this.farmers.get(normalized)
    if (existing) {
      const session: AuthSession = {
        token: `kq_jwt_mock_${existing.id}_${Date.now()}`,
        farmer: existing,
        expiresAt: new Date(Date.now() + 86400000 * 30).toISOString(), // 30 days
      }
      return { isExisting: true, session }
    }

    return { isExisting: false }
  }

  /**
   * One-time profile creation for a new farmer.
   */
  async createProfile(payload: CreateProfileRequest): Promise<AuthSession> {
    await delay(350)
    const normalized = normalizePhone(payload.phone)

    const newId = `farmer-${String(this.farmers.size + 1).padStart(3, '0')}`
    const newProfile: FarmerProfile = {
      id: newId,
      name: payload.name.trim(),
      hindiName: payload.name.trim(),
      phone: normalized,
      village: payload.village.trim(),
      district: payload.district.trim(),
      language: payload.language,
      aadhaarLast4: payload.aadhaarLast4?.trim() || undefined,
      primaryCrop: payload.primaryCrop,
      isWhatsAppLinked: payload.isWhatsAppLinked,
      createdAt: new Date().toISOString(),
    }

    this.farmers.set(normalized, newProfile)

    const session: AuthSession = {
      token: `kq_jwt_mock_${newId}_${Date.now()}`,
      farmer: newProfile,
      expiresAt: new Date(Date.now() + 86400000 * 30).toISOString(),
    }

    return session
  }

  /**
   * Look up farmer by normalized phone.
   */
  async getProfile(phone: string): Promise<FarmerProfile | null> {
    await delay(150)
    const normalized = normalizePhone(phone)
    return this.farmers.get(normalized) ?? null
  }
}

export const authService = new MockAuthService()
