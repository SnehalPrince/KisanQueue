import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { ArrowLeft, Globe2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAppStore } from '@/store/app-store'
import { copy } from '@/lib/copy'
import { authService } from '@/services/mock/auth-service'
import type { AuthSession } from '@/types/auth'
import type { Language } from '@/types/centre'
import { StepIndicator } from '@/components/onboarding/StepIndicator'
import { PhoneOtpStep } from '@/components/onboarding/PhoneOtpStep'
import { ProfileStep, type ProfileFormData } from '@/components/onboarding/ProfileStep'
import { PreferencesStep } from '@/components/onboarding/PreferencesStep'

/**
 * Step transition variants.
 * Applied per framer-motion & emil-design-eng skills:
 * - Variants defined outside render
 * - GPU transforms only (opacity + y)
 * - Duration < 300ms
 */
const stepVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.24, ease: [0.22, 1, 0.36, 1] },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: 0.16, ease: 'easeIn' },
  },
} as const

/**
 * One-Time Farmer Onboarding Page (`/onboarding`).
 *
 * Implements Flow 0 from docs/04_USER_FLOWS.md.
 */
export function OnboardingPage() {
  const navigate = useNavigate()
  const { language, setLanguage, login, logout, farmer, isAuthenticated } = useAppStore()
  const text = copy[language]

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1)
  const [verifiedPhone, setVerifiedPhone] = useState('')
  const [profileData, setProfileData] = useState<ProfileFormData>({
    name: '',
    village: '',
    district: 'Rajgarh',
    primaryCrop: 'Wheat',
    aadhaarLast4: '',
  })
  const profileDataRef = useRef<ProfileFormData>(profileData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)

  function handleToggleLanguage() {
    setLanguage(language === 'hi' ? 'en' : 'hi')
  }

  function handleOtpVerified(phone: string, existingSession?: AuthSession) {
    setVerifiedPhone(phone)
    if (existingSession) {
      // Existing farmer recognized directly
      login(existingSession)
      toast.success(`Welcome back, ${existingSession.farmer.name}!`)
      navigate('/home')
    } else {
      // New farmer -> proceed to Profile details
      setCurrentStep(2)
    }
  }

  function handleProfileNext(data: ProfileFormData) {
    profileDataRef.current = data
    setProfileData(data)
    setCurrentStep(3)
  }

  async function handleCompleteRegistration(prefs: {
    language: Language
    isWhatsAppLinked: boolean
  }) {
    setIsSubmitting(true)
    const currentProfile = profileDataRef.current
    try {
      const session = await authService.createProfile({
        phone: verifiedPhone,
        name: currentProfile.name,
        village: currentProfile.village,
        district: currentProfile.district,
        language: prefs.language,
        primaryCrop: currentProfile.primaryCrop,
        aadhaarLast4: currentProfile.aadhaarLast4,
        isWhatsAppLinked: prefs.isWhatsAppLinked,
      })

      login(session)
      setIsCompleted(true)
      toast.success(text.successTitle)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed'
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleFinish() {
    navigate('/home')
  }

  return (
    <div className="onboarding-page-layout">
      {/* Skip to form link */}
      <a href="#onboarding-form" className="skip-link">
        Skip to registration form
      </a>

      {/* Top Header */}
      <header className="onboarding-header">
        <button
          type="button"
          className="back-nav-button"
          onClick={() => navigate('/')}
          aria-label="Back to home"
        >
          <ArrowLeft size={18} aria-hidden="true" />
          <span>{copy[language].brand}</span>
        </button>

        <button
          type="button"
          className="language-button"
          onClick={handleToggleLanguage}
          aria-label={`Switch to ${language === 'hi' ? 'English' : 'Hindi'}`}
        >
          <Globe2 size={16} aria-hidden="true" />
          <span>{language === 'hi' ? 'English' : 'हिंदी'}</span>
        </button>
      </header>

      {/* Main Form Container */}
      <main id="onboarding-form" className="onboarding-main-container">
        <div className="onboarding-container-inner">
          {/* 3-Step Progress Indicator */}
          {!isCompleted && (!isAuthenticated || !farmer || verifiedPhone !== '') && (
            <StepIndicator currentStep={currentStep} text={text} />
          )}

          {/* If already authenticated and not actively filling a new number */}
          {isAuthenticated && farmer && !verifiedPhone && !isCompleted ? (
            <div className="onboarding-step-card already-logged-card">
              <div className="step-header">
                <h2 className="step-title">
                  {language === 'hi' ? 'सक्रिय किसान सत्र' : 'Active Farmer Session'}
                </h2>
                <p className="step-subtitle">
                  {language === 'hi'
                    ? `आप ${farmer.name} (+91 ${farmer.phone}) के रूप में पहले से लॉग इन हैं।`
                    : `You are currently logged in as ${farmer.name} (+91 ${farmer.phone}).`}
                </p>
              </div>

              <div className="logged-farmer-info-box">
                <div className="logged-avatar">{farmer.name.slice(0, 1).toUpperCase()}</div>
                <div>
                  <strong className="logged-name">{farmer.name}</strong>
                  <p className="logged-sub">
                    {farmer.village}, {farmer.district} · {farmer.primaryCrop}
                  </p>
                </div>
              </div>

              <div className="step-actions vertical-actions">
                <button
                  type="button"
                  className="submit-step-btn"
                  onClick={() => navigate('/home')}
                >
                  {language === 'hi' ? 'किसान डैशबोर्ड पर जाएं →' : 'Go to Farmer Dashboard →'}
                </button>
                <button
                  type="button"
                  className="back-step-btn"
                  onClick={() => {
                    logout()
                    toast.info(language === 'hi' ? 'सत्र समाप्त किया गया' : 'Logged out')
                  }}
                >
                  {language === 'hi'
                    ? 'दूसरे नंबर से लॉग इन करें (लॉग आउट)'
                    : 'Log in with another number (Log out)'}
                </button>
              </div>
            </div>
          ) : (
            /* Animated Step Cards */
            <AnimatePresence mode="wait">
              {currentStep === 1 && (
                <motion.div
                  key="step-1"
                  variants={stepVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <PhoneOtpStep
                    text={text}
                    onOtpVerified={handleOtpVerified}
                  />
                </motion.div>
              )}

              {currentStep === 2 && (
                <motion.div
                  key="step-2"
                  variants={stepVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <ProfileStep
                    text={text}
                    initialData={profileData}
                    onNext={handleProfileNext}
                    onBack={() => setCurrentStep(1)}
                  />
                </motion.div>
              )}

              {currentStep === 3 && (
                <motion.div
                  key="step-3"
                  variants={stepVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <PreferencesStep
                    text={text}
                    initialLanguage={language}
                    isSubmitting={isSubmitting}
                    isCompleted={isCompleted}
                    farmerName={farmer?.name || profileData.name || profileDataRef.current.name}
                    onSubmit={handleCompleteRegistration}
                    onBack={() => setCurrentStep(2)}
                    onFinish={handleFinish}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </main>
    </div>
  )
}
