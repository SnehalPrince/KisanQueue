import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { CheckCircle2, MessageSquare, ArrowLeft, ArrowRight, Sparkles, Check } from 'lucide-react'
import { useAppStore } from '@/store/app-store'
import type { CopyMap } from '@/lib/copy'
import type { Language } from '@/types/centre'

interface PreferencesStepProps {
  readonly text: CopyMap
  readonly initialLanguage: Language
  readonly isSubmitting: boolean
  readonly isCompleted: boolean
  readonly farmerName: string
  readonly onSubmit: (data: { language: Language; isWhatsAppLinked: boolean }) => void
  readonly onBack: () => void
  readonly onFinish: () => void
}

/**
 * Step 3: Language Choice & WhatsApp Link Confirmation.
 *
 * Applied skills:
 * - framer-motion: spring motion celebration reveal, scale(0.96) entrance (never scale(0))
 * - accessibility-a11y: semantic <fieldset>, <legend>, role="radiogroup", 44x44px touch targets
 * - emil-design-eng: button scale(0.97) on press, crisp spring physics
 */
export function PreferencesStep({
  text,
  initialLanguage,
  isSubmitting,
  isCompleted,
  farmerName,
  onSubmit,
  onBack,
  onFinish,
}: PreferencesStepProps) {
  const { farmer } = useAppStore()
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(initialLanguage)
  const [isWhatsAppLinked, setIsWhatsAppLinked] = useState(true)

  const displayName = farmer?.name || farmerName

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit({ language: selectedLanguage, isWhatsAppLinked })
  }

  return (
    <div className="onboarding-step-card">
      <AnimatePresence mode="wait">
        {!isCompleted ? (
          <motion.div
            key="preferences-form"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <div className="step-header">
              <h2 className="step-title">{text.stepPrefs}</h2>
              <p className="step-subtitle">{text.onboardingSubtitle}</p>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              {/* Language Selector Cards */}
              <fieldset className="form-group">
                <legend className="form-label">{text.preferredLangTitle}</legend>
                <div
                  className="lang-cards-grid"
                  role="radiogroup"
                  aria-label={text.preferredLangTitle}
                >
                  {/* Hindi Card */}
                  <button
                    type="button"
                    role="radio"
                    aria-checked={selectedLanguage === 'hi'}
                    className={`lang-choice-card ${
                      selectedLanguage === 'hi' ? 'is-selected' : ''
                    }`}
                    onClick={() => setSelectedLanguage('hi')}
                  >
                    <div className="lang-card-header">
                      <strong className="lang-title">{text.langHindiName}</strong>
                      <span className="lang-radio-check" aria-hidden="true">
                        {selectedLanguage === 'hi' && <Check size={14} strokeWidth={3} />}
                      </span>
                    </div>
                    <p className="lang-desc">{text.langHindiDesc}</p>
                  </button>

                  {/* English Card */}
                  <button
                    type="button"
                    role="radio"
                    aria-checked={selectedLanguage === 'en'}
                    className={`lang-choice-card ${
                      selectedLanguage === 'en' ? 'is-selected' : ''
                    }`}
                    onClick={() => setSelectedLanguage('en')}
                  >
                    <div className="lang-card-header">
                      <strong className="lang-title">{text.langEngName}</strong>
                      <span className="lang-radio-check" aria-hidden="true">
                        {selectedLanguage === 'en' && <Check size={14} strokeWidth={3} />}
                      </span>
                    </div>
                    <p className="lang-desc">{text.langEngDesc}</p>
                  </button>
                </div>
              </fieldset>

              {/* WhatsApp Linking Toggle Box */}
              <div className="whatsapp-toggle-box">
                <label className="whatsapp-toggle-label">
                  <div className="whatsapp-icon-col">
                    <MessageSquare size={22} aria-hidden="true" />
                  </div>
                  <div className="whatsapp-text-col">
                    <strong>{text.whatsappToggleTitle}</strong>
                    <span>{text.whatsappToggleDesc}</span>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle-checkbox"
                    checked={isWhatsAppLinked}
                    onChange={(e) => setIsWhatsAppLinked(e.target.checked)}
                    aria-label={text.whatsappToggleTitle}
                  />
                </label>
              </div>

              {/* Navigation Buttons */}
              <div className="step-actions button-row">
                <button
                  type="button"
                  className="quiet-button"
                  onClick={onBack}
                  disabled={isSubmitting}
                >
                  <ArrowLeft size={18} aria-hidden="true" />
                  {text.backStep}
                </button>
                <motion.button
                  type="submit"
                  className="primary-button"
                  disabled={isSubmitting}
                  whileTap={{ scale: 0.97 }}
                  transition={{ duration: 0.1, ease: 'easeOut' }}
                >
                  {isSubmitting ? text.savingProfile : text.completeOnboarding}
                  <ArrowRight size={18} aria-hidden="true" />
                </motion.button>
              </div>
            </form>
          </motion.div>
        ) : (
          /* Celebration / Success Card */
          <motion.div
            key="celebration-card"
            className="celebration-card"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
          >
            <div className="celebration-icon-wrapper" aria-hidden="true">
              <CheckCircle2 size={48} className="celebration-icon" />
              <Sparkles size={20} className="sparkle-icon" />
            </div>

            <h2 className="celebration-title">{text.successTitle}</h2>
            <p className="celebration-name" lang={selectedLanguage === 'hi' ? 'hi' : 'en'}>
              {displayName}
            </p>
            <p className="celebration-desc">{text.successDesc}</p>

            <div className="celebration-actions">
              <motion.button
                type="button"
                className="primary-button full-width"
                onClick={onFinish}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.1, ease: 'easeOut' }}
              >
                {text.goToCentres}
                <ArrowRight size={18} aria-hidden="true" />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
