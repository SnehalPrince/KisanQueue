import type { FarmerProfile, AuthSession, CreateProfileRequest } from '@/types/auth'
import { apiClient } from './client'

export const authService = {
  async sendOtp(phone: string): Promise<void> {
    await apiClient.post('/v1/auth/otp/request', { data: { phone } })
  },

  async verifyOtp(phone: string, otp: string): Promise<AuthSession | null> {
    const response = await apiClient.post('/v1/auth/otp/verify', {
      data: { phone, otp },
    })
    
    const { access_token, is_profile_complete } = response
    
    if (!access_token) {
      throw new Error('No access token returned')
    }
    
    // Store token temporarily or permanently
    localStorage.setItem('access_token', access_token)
    
    if (!is_profile_complete) {
      return null
    }

    // Fetch the profile
    const profileData = await apiClient.get('/v1/farmer/profile')
    
    const farmer: FarmerProfile = {
      id: profileData.id,
      name: profileData.name,
      hindiName: profileData.name, // The backend doesn't seem to return hindiName yet
      phone: profileData.phone,
      village: profileData.village || '',
      district: profileData.district || '',
      language: profileData.language || 'en',
      aadhaarLast4: profileData.aadhaar_last4,
      primaryCrop: profileData.primary_crop || '',
      isWhatsAppLinked: profileData.is_whatsapp_linked,
      createdAt: profileData.created_at,
    }

    return {
      token: access_token,
      farmer,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    }
  },

  async createProfile(data: CreateProfileRequest): Promise<AuthSession> {
    // Requires token to already be in localStorage (from verifyOtp)
    const profileData = await apiClient.post('/v1/farmer/profile', { data })
    
    const token = localStorage.getItem('access_token') || ''
    
    const farmer: FarmerProfile = {
      id: profileData.id,
      name: profileData.name,
      hindiName: profileData.name,
      phone: profileData.phone,
      village: profileData.village || '',
      district: profileData.district || '',
      language: profileData.language || 'en',
      aadhaarLast4: profileData.aadhaar_last4,
      primaryCrop: profileData.primary_crop || '',
      isWhatsAppLinked: profileData.is_whatsapp_linked,
      createdAt: profileData.created_at,
    }

    return {
      token,
      farmer,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    }
  },

  logout(): void {
    localStorage.removeItem('access_token')
    localStorage.removeItem('auth_session')
    window.location.href = '/'
  },
}
