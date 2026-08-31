import { useEffect, useRef } from 'react'
import { motion } from 'motion/react'
import { X, Clock3, ArrowUpRight } from 'lucide-react'
import { toast } from 'sonner'
import type { CentrePreview } from '@/types/centre'
import type { Language } from '@/store/app-store'
import type { CopyMap } from '@/lib/copy'
import { statusKey } from '@/lib/copy'
import { formatEta } from '@/lib/eta'

/**
 * Modal variants — defined outside component.
 *
 * Applied from framer-motion skill: variants outside render to prevent re-creation.
 * Applied from emil-design-eng skill:
 * - Never animate from scale(0) — start at scale(0.96)
 * - Enter with spring for natural motion
 * - Exit faster than enter (200ms vs spring settle ~280ms)
 * - Modal stays transform-origin: center (not popover — see emil skill: modals are exempt)
 */
const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.18, ease: 'easeOut' } },
  exit: { opacity: 0, transition: { duration: 0.14, ease: 'easeIn' } },
} as const

const sheetVariants = {
  hidden: { opacity: 0, scale: 0.96, y: 12 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 380, damping: 30 },
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    y: 6,
    transition: { duration: 0.16, ease: [0.22, 1, 0.36, 1] },
  },
} as const

interface CentreModalProps {
  readonly centre: CentrePreview
  readonly language: Language
  readonly text: CopyMap
  readonly onClose: () => void
}

/**
 * Centre detail modal.
 *
 * Accessibility (a11y skill):
 * - role="dialog", aria-modal="true", aria-labelledby
 * - Focus moves to close button on mount
 * - Escape key closes
 * - Backdrop click closes (role="presentation")
 * - min 44×44px touch targets on all buttons
 *
 * Sign-in gate is toast-gated in this slice — no auth yet.
 */
export function CentreModal({ centre, language, text, onClose }: CentreModalProps) {
  const status = statusKey[centre.status]
  const closeBtnRef = useRef<HTMLButtonElement>(null)
  const centreName = language === 'hi' ? centre.hindiName : centre.name
  const etaText = formatEta(centre.etaMinutes, language, text.pausedEta)

  // Move focus to close button on mount (a11y skill: focus management)
  useEffect(() => {
    closeBtnRef.current?.focus()
  }, [])

  // Escape key handler (a11y skill: keyboard navigation)
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  function handleSignIn() {
    toast.info(text.toastTitle, { description: text.toastDescription })
  }

  return (
    <motion.div
      className="modal-backdrop"
      variants={backdropVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      onMouseDown={onClose}
      role="presentation"
    >
      <motion.section
        className="centre-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-centre-title"
        variants={sheetVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Close button — receives focus on mount, 44×44 touch target */}
        <motion.button
          ref={closeBtnRef}
          type="button"
          className="close-button"
          onClick={onClose}
          aria-label={text.close}
          whileTap={{ scale: 0.93 }}
          transition={{ duration: 0.1 }}
        >
          <X size={20} aria-hidden="true" />
        </motion.button>

        {/* Header */}
        <p className="section-kicker">{text.modalTitle}</p>
        <h2 id="modal-centre-title" lang={language === 'hi' ? 'hi' : 'en'}>
          {centreName}
        </h2>
        <span
          className={`status-badge status-badge--${status}`}
          aria-label={`Status: ${text[status]}`}
        >
          {text[status]}
        </span>

        {/* Officer operational note */}
        <p className="modal-note">{centre.note}</p>

        {/* ETA highlight */}
        <div className="modal-eta" aria-label={`${text.estimatedWait}: ${etaText}`}>
          <Clock3 size={22} aria-hidden="true" />
          <div>
            <span>{text.estimatedWait}</span>
            <strong>{etaText}</strong>
          </div>
        </div>

        {/* Sign-in gate CTA */}
        <motion.button
          type="button"
          className="primary-button modal-action"
          onClick={handleSignIn}
          aria-label={text.joinSignIn}
          whileTap={{ scale: 0.97 }}
          transition={{ duration: 0.1, ease: 'easeOut' }}
        >
          {text.joinSignIn}
          <ArrowUpRight size={17} aria-hidden="true" />
        </motion.button>

        {/* Public preview disclaimer */}
        <p className="modal-disclaimer" aria-live="polite">
          {language === 'hi'
            ? 'यह सार्वजनिक पूर्वावलोकन है। कतार में शामिल होने के लिए साइन इन करें।'
            : 'This is a public preview. Sign in to join the queue or view personalized details.'}
        </p>
      </motion.section>
    </motion.div>
  )
}
