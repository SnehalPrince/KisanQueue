import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft,
  Clock,
  Users,
  Activity,
  Wheat,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAppStore } from '@/store/app-store'
import { centreService } from '@/services/api/centre-service'
import { queueService } from '@/services/api/queue-service'
import { queueKeys } from '@/lib/queue-keys'
// Fixtures can stay here for now or be moved to a constants file
import { CROP_OPTIONS } from '@/services/mock/fixtures/crops'
import { SellCropModal } from '@/components/sell/SellCropModal'
import type { CentreStatus } from '@/types/centre'

const STATUS_CONFIG: Record<
  CentreStatus,
  { color: string; labelEn: string; labelHi: string; icon: React.ReactNode }
> = {
  NORMAL: {
    color: '#40534C',
    labelEn: 'Operating Normally',
    labelHi: 'सामान्य संचालन',
    icon: <CheckCircle2 size={18} aria-hidden="true" />,
  },
  BUSY: {
    color: '#d97706',
    labelEn: 'Currently Busy',
    labelHi: 'अभी व्यस्त है',
    icon: <AlertTriangle size={18} aria-hidden="true" />,
  },
  LIFTING_DELAYED: {
    color: '#c2410c',
    labelEn: 'Lifting Delayed',
    labelHi: 'उठान में देरी',
    icon: <AlertTriangle size={18} aria-hidden="true" />,
  },
  PAUSED: {
    color: '#b91c1c',
    labelEn: 'Operations Paused',
    labelHi: 'संचालन बंद है',
    icon: <XCircle size={18} aria-hidden="true" />,
  },
}

// Capacity percentage approximation
const CAP_PCT: Record<CentreStatus, number> = {
  NORMAL: 45,
  BUSY: 85,
  LIFTING_DELAYED: 62,
  PAUSED: 0,
}

/**
 * CentreDetailPage — `/centres/:id`
 *
 * Shows full centre details:
 * - Status banner with animated capacity bar
 * - Live queue list (showing entry positions)
 * - Crops accepted + MSP rates
 * - Operational note (collapsible)
 * - CTA: "Sell here" → opens SellCropModal pre-set to this centre
 */
export function CentreDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const language = useAppStore((s) => s.language)
  const isAuthenticated = useAppStore((s) => s.isAuthenticated)
  const isHi = language === 'hi'

  const [noteExpanded, setNoteExpanded] = useState(false)
  const [sellOpen, setSellOpen] = useState(false)

  const { data: centre, isLoading: centreLoading, isError: centreError } = useQuery({
    queryKey: ['centres', id],
    queryFn: () => centreService.getDetail(id!),
    enabled: !!id,
    staleTime: 60_000,
  })

  const { data: queueEntries, isLoading: queueLoading } = useQuery({
    queryKey: queueKeys.centreQueue(id ?? ''),
    queryFn: () => queueService.getQueueEntries(id ?? ''),
    enabled: !!id,
    staleTime: 30_000,
    refetchInterval: 30_000,
  })

  function handleSellHere() {
    if (!isAuthenticated) {
      toast.info(isHi ? 'पहले साइन इन करें' : 'Please sign in first', {
        description: isHi ? 'पास बनाने के लिए लॉग इन आवश्यक है।' : 'Login required to generate a pass.',
        action: {
          label: isHi ? 'साइन इन' : 'Sign In',
          onClick: () => navigate('/onboarding'),
        },
      })
      return
    }
    setSellOpen(true)
  }

  if (centreLoading) {
    return (
      <div className="centre-detail-page">
        <header className="centres-header">
          <div className="centres-header__top">
            <button className="centres-header__back" onClick={() => navigate(-1)}>
              <ArrowLeft size={20} aria-hidden="true" />
            </button>
            <div className="centres-header__title-group">
              <div className="skeleton-line skeleton-line--title" style={{ width: '200px' }} />
              <div className="skeleton-line skeleton-line--short" style={{ width: '140px' }} />
            </div>
          </div>
        </header>
        <main className="centres-main">
          <div className="centre-skeleton" style={{ height: '140px' }} />
          <div className="centre-skeleton" style={{ height: '200px' }} />
        </main>
      </div>
    )
  }

  if (centreError || !centre) {
    return (
      <div className="centre-detail-page">
        <header className="centres-header">
          <div className="centres-header__top">
            <button className="centres-header__back" onClick={() => navigate(-1)}>
              <ArrowLeft size={20} aria-hidden="true" />
            </button>
          </div>
        </header>
        <main className="centres-main" role="alert">
          <div className="centres-state centres-state--error">
            <span className="centres-state__icon" aria-hidden="true">📡</span>
            <p className="centres-state__title">{isHi ? 'केंद्र नहीं मिला' : 'Centre not found'}</p>
            <button className="centres-state__retry" onClick={() => navigate('/centres')}>
              {isHi ? 'वापस जाएं' : 'Back to list'}
            </button>
          </div>
        </main>
      </div>
    )
  }

  const sc = STATUS_CONFIG[centre.status]
  const capPct = CAP_PCT[centre.status]
  const isPaused = centre.status === 'PAUSED'

  return (
    <div className="centre-detail-page" id="main-content">
      {/* Header */}
      <header className="centres-header" role="banner">
        <div className="centres-header__top">
          <motion.button
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.16 }}
            className="centres-header__back"
            onClick={() => navigate(-1)}
            aria-label={isHi ? 'केंद्र सूची में वापस' : 'Back to centre list'}
          >
            <ArrowLeft size={20} aria-hidden="true" />
          </motion.button>
          <div className="centres-header__title-group">
            <h1 className="centres-header__title">
              {isHi ? centre.hindiName : centre.name}
            </h1>
            <p className="centres-header__subtitle">{centre.district} · {centre.distanceKm} km</p>
          </div>
        </div>
      </header>

      <main className="centres-main" aria-label={isHi ? 'केंद्र विवरण' : 'Centre details'}>
        {/* Status Banner */}
        <motion.section
          className="cdetail-status-banner"
          style={{ borderColor: sc.color }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
          aria-label={isHi ? 'केंद्र स्थिति' : 'Centre status'}
        >
          <div className="cdetail-status-banner__header" style={{ color: sc.color }}>
            {sc.icon}
            <span className="cdetail-status-banner__label">
              {isHi ? sc.labelHi : sc.labelEn}
            </span>
          </div>

          <div className="cdetail-status-banner__metrics">
            {!isPaused && (
              <>
                <div className="cdetail-metric">
                  <Clock size={16} aria-hidden="true" />
                  <div>
                    <span className="cdetail-metric__value">
                      {centre.etaMinutes !== null ? (isHi ? `~${centre.etaMinutes} मिनट` : `~${centre.etaMinutes} min`) : '—'}
                    </span>
                    <span className="cdetail-metric__label">{isHi ? 'अनुमानित प्रतीक्षा' : 'Est. wait'}</span>
                  </div>
                </div>
                <div className="cdetail-metric">
                  <Users size={16} aria-hidden="true" />
                  <div>
                    <span className="cdetail-metric__value">{centre.queueLength}</span>
                    <span className="cdetail-metric__label">{isHi ? 'कतार में' : 'In queue'}</span>
                  </div>
                </div>
                <div className="cdetail-metric">
                  <Activity size={16} aria-hidden="true" />
                  <div>
                    <span className="cdetail-metric__value">{centre.activeCounters}</span>
                    <span className="cdetail-metric__label">{isHi ? 'काउंटर' : 'Counters'}</span>
                  </div>
                </div>
              </>
            )}
            {isPaused && (
              <p className="cdetail-paused-note">
                {isHi
                  ? 'आज इस केंद्र पर नई कतार प्रविष्टि स्वीकार नहीं हो रही।'
                  : 'This centre is not accepting new queue entries today.'}
              </p>
            )}
          </div>

          {/* Capacity bar */}
          {!isPaused && (
            <div className="cdetail-cap-bar-wrap">
              <div className="cdetail-cap-bar-label">
                <span>{isHi ? 'क्षमता उपयोग' : 'Capacity utilisation'}</span>
                <span>{capPct}%</span>
              </div>
              <div
                className="cdetail-cap-bar"
                role="meter"
                aria-valuenow={capPct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={isHi ? 'केंद्र क्षमता' : 'Centre capacity'}
              >
                <motion.div
                  className={`cdetail-cap-fill cdetail-cap-fill--${centre.status.toLowerCase()}`}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: capPct / 100 }}
                  transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
                  style={{ transformOrigin: 'left' }}
                />
              </div>
              <p className="cdetail-cap-note">
                {isHi
                  ? `${centre.activeCounters} में से ${centre.activeCounters} काउंटर सक्रिय · क्षमता गुणांक ${centre.capacityFactor.toFixed(2)}`
                  : `${centre.activeCounters} of ${centre.activeCounters} counters active · capacity factor ${centre.capacityFactor.toFixed(2)}`}
              </p>
            </div>
          )}
        </motion.section>

        {/* Operational Note (collapsible) */}
        <motion.section
          className="cdetail-note"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.35 }}
          aria-label={isHi ? 'केंद्र नोट' : 'Centre note'}
        >
          <button
            className="cdetail-note__toggle"
            onClick={() => setNoteExpanded(!noteExpanded)}
            aria-expanded={noteExpanded}
            aria-controls="centre-note-body"
          >
            <span>{isHi ? 'अधिकारी नोट' : 'Officer note'}</span>
            {noteExpanded ? <ChevronUp size={16} aria-hidden="true" /> : <ChevronDown size={16} aria-hidden="true" />}
          </button>
          <AnimatePresence>
            {noteExpanded && (
              <motion.p
                id="centre-note-body"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                className="cdetail-note__body"
              >
                {centre.note}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.section>

        {/* Crops Accepted */}
        <motion.section
          className="cdetail-crops"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.35 }}
          aria-label={isHi ? 'स्वीकृत फसलें' : 'Accepted crops'}
        >
          <h2 className="cdetail-section-title">
            <Wheat size={15} aria-hidden="true" />
            {isHi ? 'स्वीकृत फसलें और एमएसपी' : 'Accepted Crops & MSP Rates'}
          </h2>
          <div className="cdetail-crops__grid">
            {CROP_OPTIONS.map((crop) => (
              <div key={crop.id} className="cdetail-crop-chip">
                <span className="cdetail-crop-chip__emoji" aria-hidden="true">{crop.emoji}</span>
                <div>
                  <span className="cdetail-crop-chip__name">
                    {isHi ? crop.nameHi : crop.nameEn}
                  </span>
                  <span className="cdetail-crop-chip__msp">
                    ₹{crop.mspPerQuintal.toLocaleString('en-IN')}/{isHi ? 'क्विंटल' : 'q'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Live Queue */}
        <motion.section
          className="cdetail-queue"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.35 }}
          aria-label={isHi ? 'लाइव कतार' : 'Live queue'}
        >
          <h2 className="cdetail-section-title">
            <Users size={15} aria-hidden="true" />
            {isHi ? 'लाइव कतार' : 'Live Queue'}
          </h2>

          {queueLoading ? (
            <div className="cdetail-queue__loading" aria-busy="true" aria-live="polite">
              {[0, 1, 2].map((i) => (
                <div key={i} className="skeleton-line" style={{ height: '40px', borderRadius: '8px', marginBottom: '6px' }} />
              ))}
            </div>
          ) : !queueEntries || queueEntries.length === 0 ? (
            <p className="cdetail-queue__empty">
              {isHi ? 'कतार में कोई नहीं है।' : 'Queue is empty.'}
            </p>
          ) : (
            <div className="cdetail-queue__list" role="list">
              {queueEntries.slice(0, 10).map((entry, i) => (
                <motion.div
                  key={entry.id}
                  role="listitem"
                  className={`cdetail-queue-row ${entry.status === 'PROCESSING' ? 'cdetail-queue-row--processing' : ''}`}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <span className="cdetail-queue-row__pos">#{entry.position}</span>
                  <span className="cdetail-queue-row__token">KQ-{entry.token}</span>
                  <span className="cdetail-queue-row__crop">
                    {CROP_OPTIONS.find((c) => c.id === entry.crop)?.emoji ?? '🌾'}
                  </span>
                  <span className="cdetail-queue-row__qty">{entry.quantityQ}q</span>
                  <span className={`cdetail-queue-row__status cdetail-queue-row__status--${entry.status.toLowerCase()}`}>
                    {entry.status === 'WAITING' ? (isHi ? 'प्रतीक्षा' : 'Waiting')
                      : entry.status === 'PROCESSING' ? (isHi ? 'प्रक्रिया में' : 'Processing')
                      : entry.status === 'CHECKED_IN' ? (isHi ? 'चेक-इन' : 'Checked in')
                      : (isHi ? 'पूर्ण' : 'Done')}
                  </span>
                </motion.div>
              ))}
              {queueEntries.length > 10 && (
                <p className="cdetail-queue__more">
                  {isHi
                    ? `+${queueEntries.length - 10} और किसान`
                    : `+${queueEntries.length - 10} more farmers`}
                </p>
              )}
            </div>
          )}
        </motion.section>

        {/* CTA */}
        {!isPaused && (
          <motion.div
            className="cdetail-cta"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <motion.button
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.16 }}
              className="cdetail-cta__btn"
              onClick={handleSellHere}
              aria-label={isHi ? `${centre.hindiName} पर फसल बेचें` : `Sell crop at ${centre.name}`}
            >
              {isHi ? `इस केंद्र पर बेचें →` : `Sell here →`}
            </motion.button>
            <p className="cdetail-cta__hint">
              {isHi
                ? 'पास बनाने से पहले ऊपर की कतार और प्रतीक्षा समय देखें।'
                : 'Check the queue above before generating your pass.'}
            </p>
          </motion.div>
        )}
      </main>

      {/* Sell Crop Modal */}
      <SellCropModal
        isOpen={sellOpen}
        onClose={() => setSellOpen(false)}
        language={language}
      />
    </div>
  )
}
