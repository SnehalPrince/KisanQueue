import type { Language } from './centre'

/**
 * Farmer profile interface.
 * Represents a registered farmer in KisanQueue.
 * Applied per TypeScript skill: prefer interfaces over types.
 */
export interface FarmerProfile {
  readonly id: string
  readonly name: string
  readonly hindiName: string
  readonly phone: string
  readonly village: string
  readonly district: string
  readonly language: Language
  readonly aadhaarLast4?: string
  readonly primaryCrop: string
  readonly isWhatsAppLinked: boolean
  readonly createdAt: string
}

/**
 * Authentication session payload returned upon successful OTP verification.
 */
export interface AuthSession {
  readonly token: string
  readonly farmer: FarmerProfile
  readonly expiresAt: string
}

/**
 * OTP Request payload
 */
export interface SendOtpRequest {
  readonly phone: string
}

/**
 * OTP Verification payload
 */
export interface VerifyOtpRequest {
  readonly phone: string
  readonly otp: string
}

/**
 * One-time profile creation payload
 */
export interface CreateProfileRequest {
  readonly phone: string
  readonly name: string
  readonly village: string
  readonly district: string
  readonly language: Language
  readonly aadhaarLast4?: string
  readonly primaryCrop: string
  readonly isWhatsAppLinked: boolean
}
