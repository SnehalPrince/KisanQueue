import { useState, useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { X } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAppStore } from '@/store/app-store'
import { queueService } from '@/services/mock/queue-service'
import { queueKeys } from '@/lib/queue-keys'
import { CROP_OPTIONS } from '@/services/mock/fixtures/crops'
import { CENTRE_FIXTURES } from '@/services/mock/fixtures/centres'
import type { CropId, GeneratePassRequest, PassSummary } from '@/types/queue'
import type { CentrePreview } from '@/types/centre'

// ─── Step sub-components ────────────────────────────────────────────────────

function StepCropSelect({
  language,
  selectedCrop,
  onSelect,
}: {
  language: 'en' | 'hi'
  selectedCrop: CropId | null
  onSelect: (id: CropId) => void
}) {
  const isHi = language === 'hi'
  return (
    <div className="sell-step">
      <h3 className="sell-step__heading">
        {isHi ? 'कौन सी फसल बेचनी है?' : 'Which crop are you selling?'}
      </h3>
      <p className="sell-step__hint">
        {isHi ? 'एक फसल चुनें' : 'Select one crop for this visit'}
      </p>
      <div className="sell-step__crops" role="listbox" aria-label={isHi ? 'फसल चुनें' : 'Select crop'}>
        {CROP_OPTIONS.map((crop) => (
          <motion.button
            key={crop.id}
            role="option"
            aria-selected={selectedCrop === crop.id}
            whileTap={{ scale: 0.97 }}
            className={`crop-chip ${selectedCrop === crop.id ? 'crop-chip--selected' : ''}`}
            onClick={() => onSelect(crop.id)}
          >
            <span className="crop-chip__emoji" aria-hidden="true">{crop.emoji}</span>
            <span className="crop-chip__name">{isHi ? crop.nameHi : crop.nameEn}</span>
            <span className="crop-chip__msp">
              ₹{crop.mspPerQuintal.toLocaleString('en-IN')}/{isHi ? 'क्विंटल' : 'q'}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  )
}

function StepCentreSelect({
  language,
  selectedCentreId,
  onSelect,
  cropId: _cropId,
}: {
  language: 'en' | 'hi'
  selectedCentreId: string | null
  onSelect: (id: string) => void
  cropId: CropId
}) {
  const isHi = language === 'hi'

  // Filter to only centres accepting this crop (simplified: all for wheat/soybean, some for paddy/barley)
  const eligibleCentres: CentrePreview[] = CENTRE_FIXTURES.filter((c) => c.status !== 'PAUSED')

  const statusLabel: Record<string, { en: string; hi: string; dot: string }> = {
    NORMAL: { en: 'Normal', hi: 'सामान्य', dot: 'green' },
    BUSY: { en: 'Busy', hi: 'व्यस्त', dot: 'amber' },
    LIFTING_DELAYED: { en: 'Delayed', hi: 'देरी', dot: 'orange' },
    PAUSED: { en: 'Paused', hi: 'बंद', dot: 'red' },
  }

  return (
    <div className="sell-step">
      <h3 className="sell-step__heading">
        {isHi ? 'कौन से केंद्र में जाना है?' : 'Which procurement centre?'}
      </h3>
      <p className="sell-step__hint">
        {isHi ? 'नज़दीकी सक्रिय केंद्र' : 'Nearby active centres'}
      </p>
      <div className="sell-step__centres" role="listbox" aria-label={isHi ? 'केंद्र चुनें' : 'Select centre'}>
        {eligibleCentres.map((centre) => {
          const s = statusLabel[centre.status] ?? statusLabel['NORMAL']!
          return (
            <motion.button
              key={centre.id}
              role="option"
              aria-selected={selectedCentreId === centre.id}
              whileTap={{ scale: 0.97 }}
              className={`centre-chip ${selectedCentreId === centre.id ? 'centre-chip--selected' : ''}`}
              onClick={() => onSelect(centre.id)}
            >
              <div className="centre-chip__header">
                <span className={`centre-chip__dot centre-chip__dot--${s.dot}`} aria-hidden="true" />
                <span className="centre-chip__name">{isHi ? centre.hindiName : centre.name}</span>
                <span className="centre-chip__status">{isHi ? s.hi : s.en}</span>
              </div>
              <div className="centre-chip__meta">
                <span>{centre.district}</span>
                {centre.etaMinutes !== null && (
                  <span>~{centre.etaMinutes} {isHi ? 'मिनट प्रतीक्षा' : 'min wait'}</span>
                )}
                <span>{centre.queueLength} {isHi ? 'प्रतीक्षारत' : 'waiting'}</span>
              </div>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}

function StepQuantity({
  language,
  quantity,
  onChange,
  cropId,
}: {
  language: 'en' | 'hi'
  quantity: number
  onChange: (q: number) => void
  cropId: CropId
}) {
  const isHi = language === 'hi'
  const CROP_OPTS = CROP_OPTIONS.find((c) => c.id === cropId)
  const estimatedValue = CROP_OPTS ? Math.round(CROP_OPTS.mspPerQuintal * quantity) : 0

  return (
    <div className="sell-step">
      <h3 className="sell-step__heading">
        {isHi ? 'कितनी मात्रा ला रहे हैं?' : 'How much are you bringing?'}
      </h3>
      <p className="sell-step__hint">
        {isHi ? 'क्विंटल में मात्रा दर्ज करें' : 'Enter quantity in quintals'}
      </p>

      <div className="qty-input-group">
        <input
          id="sell-quantity"
          type="number"
          min="0.5"
          max="500"
          step="0.5"
          value={quantity}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0.5)}
          className="qty-input"
          aria-label={isHi ? 'मात्रा क्विंटल में' : 'Quantity in quintals'}
        />
        <span className="qty-unit" aria-label={isHi ? 'क्विंटल' : 'quintals'}>
          {isHi ? 'क्विंटल' : 'Qtl'}
        </span>
      </div>

      <input
        type="range"
        min="0.5"
        max="100"
        step="0.5"
        value={Math.min(quantity, 100)}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="qty-slider"
        aria-label={isHi ? 'मात्रा स्लाइडर' : 'Quantity slider'}
      />

      <div className="qty-quick-btns" role="group" aria-label={isHi ? 'त्वरित मात्रा' : 'Quick quantities'}>
        {[10, 20, 40, 60, 80].map((q) => (
          <motion.button
            key={q}
            whileTap={{ scale: 0.95 }}
            className={`qty-quick-btn ${quantity === q ? 'qty-quick-btn--active' : ''}`}
            onClick={() => onChange(q)}
            aria-pressed={quantity === q}
          >
            {q}q
          </motion.button>
        ))}
      </div>

      {CROP_OPTS && quantity > 0 && (
        <motion.div
          className="qty-estimate"
          key={estimatedValue}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          aria-live="polite"
          aria-label={`${isHi ? 'अनुमानित एमएसपी' : 'Estimated MSP'}: ₹${estimatedValue.toLocaleString('en-IN')}`}
        >
          <span className="qty-estimate__label">
            {isHi ? 'अनुमानित एमएसपी' : 'Estimated MSP earnings'}
          </span>
          <span className="qty-estimate__value">
            ₹{estimatedValue.toLocaleString('en-IN')}
          </span>
          <span className="qty-estimate__rate">
            @ ₹{CROP_OPTS.mspPerQuintal.toLocaleString('en-IN')}/{isHi ? 'क्विंटल' : 'quintal'}
          </span>
        </motion.div>
      )}
    </div>
  )
}

function StepSummary({
  language,
  summary,
  isGenerating,
  onConfirm,
}: {
  language: 'en' | 'hi'
  summary: PassSummary
  isGenerating: boolean
  onConfirm: () => void
}) {
  const isHi = language === 'hi'

  return (
    <div className="sell-step">
      <h3 className="sell-step__heading">
        {isHi ? 'कृपया जानकारी की पुष्टि करें' : 'Confirm your details'}
      </h3>
      <p className="sell-step__hint">
        {isHi
          ? 'एक बार पुष्टि करने के बाद पास बन जाएगा'
          : 'Your digital pass will be generated after confirmation'}
      </p>

      <div className="summary-card" role="region" aria-label={isHi ? 'पास सारांश' : 'Pass summary'}>
        <div className="summary-row">
          <span className="summary-label">{isHi ? 'केंद्र' : 'Centre'}</span>
          <span className="summary-value">{isHi ? summary.centreHindiName : summary.centreName}</span>
        </div>
        <div className="summary-row">
          <span className="summary-label">{isHi ? 'फसल' : 'Crop'}</span>
          <span className="summary-value">{isHi ? summary.cropNameHi : summary.cropNameEn}</span>
        </div>
        <div className="summary-row">
          <span className="summary-label">{isHi ? 'मात्रा' : 'Quantity'}</span>
          <span className="summary-value">{summary.quantityQ} {isHi ? 'क्विंटल' : 'Quintals'}</span>
        </div>
        <div className="summary-row">
          <span className="summary-label">{isHi ? 'अनुमानित स्थान' : 'Est. queue position'}</span>
          <span className="summary-value">#{summary.estimatedQueuePosition}</span>
        </div>
        {summary.estimatedEtaMinutes !== null && (
          <div className="summary-row">
            <span className="summary-label">{isHi ? 'अनुमानित प्रतीक्षा' : 'Est. wait'}</span>
            <span className="summary-value">{summary.estimatedEtaMinutes} {isHi ? 'मिनट' : 'min'}</span>
          </div>
        )}
        <div className="summary-row summary-row--highlight">
          <span className="summary-label">{isHi ? 'एमएसपी अनुमान' : 'MSP estimate'}</span>
          <span className="summary-value summary-value--msp">
            ₹{summary.estimatedMsp.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      <motion.button
        whileTap={{ scale: 0.97 }}
        transition={{ duration: 0.16 }}
        className="confirm-pass-btn"
        onClick={onConfirm}
        disabled={isGenerating}
        aria-label={isHi ? 'पास की पुष्टि करें' : 'Confirm and generate pass'}
        aria-busy={isGenerating}
      >
        {isGenerating ? (
          <>
            <motion.span
              className="confirm-pass-btn__spinner"
              animate={{ rotate: 360 }}
              transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
              aria-hidden="true"
            />
            {isHi ? 'पास बन रहा है...' : 'Generating pass...'}
          </>
        ) : (
          isHi ? '✓ पास बनाएं' : '✓ Generate Pass'
        )}
      </motion.button>
    </div>
  )
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

type Step = 'crop' | 'centre' | 'quantity' | 'summary'
const STEPS: Step[] = ['crop', 'centre', 'quantity', 'summary']

interface SellCropModalProps {
  readonly isOpen: boolean
  readonly onClose: () => void
  readonly language: 'en' | 'hi'
}

const STEP_LABELS: Record<Step, { en: string; hi: string }> = {
  crop: { en: 'Choose Crop', hi: 'फसल चुनें' },
  centre: { en: 'Choose Centre', hi: 'केंद्र चुनें' },
  quantity: { en: 'Quantity', hi: 'मात्रा' },
  summary: { en: 'Confirm', hi: 'पुष्टि करें' },
}

export function SellCropModal({ isOpen, onClose, language }: SellCropModalProps) {
  const isHi = language === 'hi'
  const farmer = useAppStore((s) => s.farmer)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [step, setStep] = useState<Step>('crop')
  const [selectedCrop, setSelectedCrop] = useState<CropId | null>(null)
  const [selectedCentreId, setSelectedCentreId] = useState<string | null>('centre-001')
  const [quantity, setQuantity] = useState<number>(40.5)
  const [direction, setDirection] = useState<1 | -1>(1)

  const overlayRef = useRef<HTMLDivElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeBtnRef = useRef<HTMLButtonElement>(null)

  const stepIndex = STEPS.indexOf(step)

  // Pre-fetch summary when on quantity step to make confirmation instant
  const { data: summary } = useQuery({
    queryKey: queueKeys.passSummary(
      farmer?.id ?? '',
      selectedCentreId ?? '',
      selectedCrop ?? '',
      quantity,
    ),
    queryFn: () =>
      queueService.previewPass({
        farmerId: farmer!.id,
        centreId: selectedCentreId!,
        crop: selectedCrop!,
        quantityQ: quantity,
      }),
    enabled: !!farmer && !!selectedCrop && !!selectedCentreId && quantity > 0 && step === 'summary',
    staleTime: 30_000,
  })

  const generateMutation = useMutation({
    mutationFn: (req: GeneratePassRequest) => queueService.generatePass(req),
    onSuccess: (pass) => {
      queryClient.invalidateQueries({ queryKey: queueKeys.activePass(farmer!.id) })
      toast.success(isHi ? 'पास तैयार है!' : 'Pass generated!', {
        description: isHi
          ? `टोकन ${pass.token} — कतार में स्थान #${pass.queuePosition}`
          : `Token ${pass.token} — Queue position #${pass.queuePosition}`,
        duration: 5000,
      })
      onClose()
      navigate(`/pass/${pass.id}`)
    },
    onError: () => {
      toast.error(isHi ? 'पास बनाने में समस्या' : 'Pass generation failed', {
        description: isHi ? 'कृपया पुनः प्रयास करें।' : 'Please try again.',
      })
    },
  })

  // Focus management — trap focus inside dialog when open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => closeBtnRef.current?.focus(), 50)
    } else {
      setStep('crop')
      setSelectedCrop(null)
      setSelectedCentreId('centre-001')
      setQuantity(40.5)
    }
  }, [isOpen])

  // Keyboard: Escape to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  function goNext() {
    setDirection(1)
    const next = STEPS[stepIndex + 1]
    if (next) setStep(next)
  }

  function goPrev() {
    setDirection(-1)
    const prev = STEPS[stepIndex - 1]
    if (prev) setStep(prev)
  }

  function canProceed(): boolean {
    if (step === 'crop') return selectedCrop !== null
    if (step === 'centre') return selectedCentreId !== null
    if (step === 'quantity') return quantity > 0
    return true
  }

  function handleConfirm() {
    if (!farmer || !selectedCrop || !selectedCentreId) return
    generateMutation.mutate({
      farmerId: farmer.id,
      centreId: selectedCentreId,
      crop: selectedCrop,
      quantityQ: quantity,
    })
  }

  const slideVariants = {
    enter: (dir: number) => ({ x: dir * 40, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir * -40, opacity: 0 }),
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="sell-modal__backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            ref={overlayRef}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Sheet */}
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={isHi ? 'फसल बेचें' : 'Sell Crop'}
            className="sell-modal"
            initial={{ y: '100%', opacity: 0.5 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', duration: 0.45, bounce: 0.1 }}
          >
            {/* Handle */}
            <div className="sell-modal__handle" aria-hidden="true" />

            {/* Header */}
            <div className="sell-modal__header">
              <h2 className="sell-modal__title">
                {isHi ? 'फसल बेचें' : 'Sell Crop'}
              </h2>
              <button
                ref={closeBtnRef}
                className="sell-modal__close"
                onClick={onClose}
                aria-label={isHi ? 'बंद करें' : 'Close'}
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>

            {/* Step progress bar */}
            <div
              className="sell-modal__steps"
              role="navigation"
              aria-label={isHi ? 'चरण प्रगति' : 'Step progress'}
            >
              {STEPS.map((s, i) => (
                <div
                  key={s}
                  className={`sell-step-pip ${i <= stepIndex ? 'sell-step-pip--done' : ''} ${s === step ? 'sell-step-pip--active' : ''}`}
                  aria-current={s === step ? 'step' : undefined}
                >
                  <span className="sell-step-pip__label">
                    {isHi ? STEP_LABELS[s].hi : STEP_LABELS[s].en}
                  </span>
                </div>
              ))}
            </div>

            {/* Step content — slide animation */}
            <div className="sell-modal__body">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={step}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
                >
                  {step === 'crop' && (
                    <StepCropSelect
                      language={language}
                      selectedCrop={selectedCrop}
                      onSelect={setSelectedCrop}
                    />
                  )}
                  {step === 'centre' && selectedCrop && (
                    <StepCentreSelect
                      language={language}
                      selectedCentreId={selectedCentreId}
                      onSelect={setSelectedCentreId}
                      cropId={selectedCrop}
                    />
                  )}
                  {step === 'quantity' && selectedCrop && (
                    <StepQuantity
                      language={language}
                      quantity={quantity}
                      onChange={setQuantity}
                      cropId={selectedCrop}
                    />
                  )}
                  {step === 'summary' && summary && (
                    <StepSummary
                      language={language}
                      summary={summary}
                      isGenerating={generateMutation.isPending}
                      onConfirm={handleConfirm}
                    />
                  )}
                  {step === 'summary' && !summary && (
                    <div className="sell-step sell-step--loading" aria-busy="true" aria-live="polite">
                      <motion.div
                        className="sell-step__spinner"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
                        aria-hidden="true"
                      />
                      <p>{isHi ? 'सारांश लोड हो रहा है...' : 'Loading summary...'}</p>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer nav */}
            <div className="sell-modal__footer">
              {stepIndex > 0 && (
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  className="sell-modal__back-btn"
                  onClick={goPrev}
                  aria-label={isHi ? 'पिछला चरण' : 'Previous step'}
                >
                  {isHi ? '← पीछे' : '← Back'}
                </motion.button>
              )}
              {step !== 'summary' && (
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  className="sell-modal__next-btn"
                  onClick={goNext}
                  disabled={!canProceed()}
                  aria-label={isHi ? 'अगला चरण' : 'Next step'}
                  aria-disabled={!canProceed()}
                >
                  {isHi ? 'अगला →' : 'Next →'}
                </motion.button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
