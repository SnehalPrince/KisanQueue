import { useState, useEffect, useRef } from 'react'
import { motion } from 'motion/react'
import { Phone, KeyRound, Sparkles, ArrowRight, RotateCw, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import type { CopyMap } from '@/lib/copy'
import { authService } from '@/services/api/auth-service'
import type { AuthSession } from '@/types/auth'

interface PhoneOtpStepProps {
  readonly text: CopyMap
  readonly onOtpVerified: (phone: string, existingSession?: AuthSession) => void
}

/**
 * Step 1: Mobile Number & OTP Verification.
 *
 * Applied skills:
 * - framer-motion: motion.button whileTap, GPU transform animations
 * - emil-design-eng: button press feedback, <300ms transitions, smooth focus outline
 * - accessibility-a11y: semantic <fieldset>, <label>, aria-invalid, role="alert", min 44x44px touch targets
 * - react: function keyword, named event handlers, handle prefix
 */
export function PhoneOtpStep({ text, onOtpVerified }: PhoneOtpStepProps) {
  const [phone, setPhone] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [otpValues, setOtpValues] = useState(['', '', '', ''])
  const [isSending, setIsSending] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(30)

  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([])

  // Countdown timer for OTP resend
  useEffect(() => {
    let timer: NodeJS.Timeout | undefined
    if (otpSent && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1)
      }, 1000)
    }
    return () => {
      if (timer) clearInterval(timer)
    }
  }, [otpSent, countdown])

  function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, '')
    if (raw.length <= 10) {
      setPhone(raw)
      setErrorMessage(null)
    }
  }

  function handleQuickDemoFill() {
    setPhone('9876543210')
    setErrorMessage(null)
    toast.success('Filled Demo Phone: +91 9876543210 (Ramesh Kumar)')
  }

  async function handleSendOtp(e?: React.FormEvent) {
    if (e) e.preventDefault()
    if (phone.length < 10) {
      setErrorMessage(text.errPhoneRequired)
      return
    }

    setIsSending(true)
    setErrorMessage(null)
    try {
      await authService.sendOtp(phone)
      setOtpSent(true)
      setCountdown(30)
      setOtpValues(['1', '2', '3', '4']) // Pre-fill 1234 for demo convenience
      toast.success(text.demoOtpHint)
      setTimeout(() => {
        otpInputsRef.current[3]?.focus()
      }, 100)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send OTP'
      setErrorMessage(msg)
      toast.error(msg)
    } finally {
      setIsSending(false)
    }
  }

  function handleOtpChange(index: number, value: string) {
    const clean = value.replace(/\D/g, '')
    const newOtp = [...otpValues]

    if (clean.length > 1) {
      // Handle paste of 4-digit code
      const pasted = clean.slice(0, 4).split('')
      for (let i = 0; i < 4; i++) {
        newOtp[i] = pasted[i] || ''
      }
      setOtpValues(newOtp)
      otpInputsRef.current[Math.min(clean.length - 1, 3)]?.focus()
    } else {
      newOtp[index] = clean
      setOtpValues(newOtp)
      if (clean && index < 3) {
        otpInputsRef.current[index + 1]?.focus()
      }
    }
    setErrorMessage(null)
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus()
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault()
    const fullOtp = otpValues.join('')
    if (fullOtp.length < 4) {
      setErrorMessage(text.errOtpRequired)
      return
    }

    setIsVerifying(true)
    setErrorMessage(null)
    try {
      const session = await authService.verifyOtp(phone, fullOtp)
      if (session) {
        toast.success(`Welcome back, ${session.farmer.name}!`)
        onOtpVerified(phone, session)
      } else {
        toast.success('Mobile verified! Please complete your farmer details.')
        onOtpVerified(phone)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid OTP'
      setErrorMessage(msg)
      toast.error(msg)
    } finally {
      setIsVerifying(false)
    }
  }

  return (
    <div className="onboarding-step-card">
      <div className="step-header">
        <h2 className="step-title">{text.stepPhone}</h2>
        <p className="step-subtitle">{text.onboardingSubtitle}</p>
      </div>

      {/* Quick Demo Autofill chip */}
      <div className="demo-chip-wrapper">
        <button
          type="button"
          className="demo-chip"
          onClick={handleQuickDemoFill}
          aria-label={text.demoAutofill}
        >
          <Sparkles size={14} aria-hidden="true" />
          <span>{text.demoAutofill}</span>
        </button>
      </div>

      <form onSubmit={otpSent ? handleVerifyOtp : handleSendOtp} noValidate>
        {/* Phone Input Fieldset */}
        <fieldset className="form-group" disabled={otpSent}>
          <label htmlFor="phone-input" className="form-label">
            {text.phoneLabel}
          </label>
          <div className="input-prefix-wrapper">
            <span className="input-prefix" aria-hidden="true">
              +91
            </span>
            <input
              id="phone-input"
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              className="form-input with-prefix"
              placeholder={text.phonePlaceholder}
              value={phone}
              onChange={handlePhoneChange}
              aria-invalid={errorMessage ? 'true' : 'false'}
              aria-describedby={errorMessage ? 'phone-error' : undefined}
              maxLength={10}
              required
            />
            <Phone className="input-icon" size={18} aria-hidden="true" />
          </div>
        </fieldset>

        {/* OTP Input Section (shown when OTP is sent) */}
        {otpSent && (
          <fieldset className="form-group otp-fieldset">
            <legend className="form-label">{text.otpLabel}</legend>
            <div className="otp-inputs-grid">
              {otpValues.map((val, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    otpInputsRef.current[i] = el
                  }}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  className="otp-digit-input"
                  value={val}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  aria-label={`Digit ${i + 1}`}
                  autoFocus={i === 0}
                />
              ))}
            </div>
            <div className="otp-helper-row">
              <span className="demo-hint-text">
                <KeyRound size={13} aria-hidden="true" />
                {text.demoOtpHint}
              </span>
              {countdown > 0 ? (
                <span className="resend-countdown" aria-live="polite">
                  {text.resendIn} {countdown}s
                </span>
              ) : (
                <button
                  type="button"
                  className="resend-button"
                  onClick={() => handleSendOtp()}
                  disabled={isSending}
                >
                  <RotateCw size={13} aria-hidden="true" />
                  {text.resendOtp}
                </button>
              )}
            </div>
          </fieldset>
        )}

        {/* Error message */}
        {errorMessage && (
          <div id="phone-error" className="form-error-banner" role="alert">
            <AlertCircle size={16} aria-hidden="true" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Action Button */}
        <div className="step-actions">
          {!otpSent ? (
            <motion.button
              type="submit"
              className="primary-button full-width"
              disabled={isSending || phone.length < 10}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.1, ease: 'easeOut' }}
            >
              {isSending ? text.sendingOtp : text.sendOtp}
              <ArrowRight size={18} aria-hidden="true" />
            </motion.button>
          ) : (
            <div className="button-row">
              <button
                type="button"
                className="quiet-button"
                onClick={() => setOtpSent(false)}
              >
                {text.backStep}
              </button>
              <motion.button
                type="submit"
                className="primary-button"
                disabled={isVerifying || otpValues.join('').length < 4}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.1, ease: 'easeOut' }}
              >
                {isVerifying ? text.verifyingOtp : text.verifyOtp}
                <ArrowRight size={18} aria-hidden="true" />
              </motion.button>
            </div>
          )}
        </div>
      </form>
    </div>
  )
}
