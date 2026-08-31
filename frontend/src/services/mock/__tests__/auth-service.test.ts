import { describe, it, expect } from 'vitest'
import { authService } from '../auth-service'

describe('authService (mock)', () => {
  it('sendOtp rejects invalid phone numbers', async () => {
    await expect(authService.sendOtp('12345')).rejects.toThrow(
      'Please enter a valid 10-digit Indian mobile number',
    )
  })

  it('sendOtp accepts valid 10-digit Indian mobile number', async () => {
    const res = await authService.sendOtp('9876543210')
    expect(res.success).toBe(true)
    expect(res.message).toContain('Demo OTP: 1234')
  })

  it('verifyOtp returns existing session for seeded demo farmer (Ramesh Kumar)', async () => {
    const result = await authService.verifyOtp('+919876543210', '1234')
    expect(result.isExisting).toBe(true)
    expect(result.session).toBeDefined()
    expect(result.session?.farmer.name).toBe('Ramesh Kumar')
    expect(result.session?.farmer.district).toBe('Rajgarh')
    expect(result.session?.farmer.village).toBe('Biaora')
  })

  it('verifyOtp returns isExisting: false for new unregistered phone number', async () => {
    const result = await authService.verifyOtp('9998887776', '1234')
    expect(result.isExisting).toBe(false)
    expect(result.session).toBeUndefined()
  })

  it('verifyOtp throws error on wrong OTP', async () => {
    await expect(authService.verifyOtp('9876543210', '9999')).rejects.toThrow(
      'Invalid OTP. Please enter 1234 for demo verification.',
    )
  })

  it('createProfile registers a new farmer and returns session', async () => {
    const session = await authService.createProfile({
      phone: '9123456780',
      name: 'Vikas Sharma',
      village: 'Sarangpur',
      district: 'Rajgarh',
      language: 'hi',
      primaryCrop: 'Wheat',
      aadhaarLast4: '1234',
      isWhatsAppLinked: true,
    })

    expect(session.token).toContain('kq_jwt_mock_')
    expect(session.farmer.name).toBe('Vikas Sharma')
    expect(session.farmer.phone).toBe('+919123456780')

    // Subsequent lookup returns the new profile
    const lookedUp = await authService.getProfile('9123456780')
    expect(lookedUp?.name).toBe('Vikas Sharma')
  })
})
