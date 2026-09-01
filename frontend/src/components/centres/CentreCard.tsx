import { motion } from 'motion/react'
import { Clock, Users, Activity, ChevronRight, AlertTriangle, Wifi, WifiOff } from 'lucide-react'
import type { CentrePreview, CentreStatus } from '@/types/centre'

// ─── Status Config ────────────────────────────────────────────────────────────

const STATUS: Record<
  CentreStatus,
  { dotClass: string; labelEn: string; labelHi: string; badgeClass: string }
> = {
  NORMAL: {
    dotClass: 'status-dot--green',
    labelEn: 'Normal',
    labelHi: 'सामान्य',
    badgeClass: 'status-badge--green',
  },
  BUSY: {
    dotClass: 'status-dot--amber',
    labelEn: 'Busy',
    labelHi: 'व्यस्त',
    badgeClass: 'status-badge--amber',
  },
  LIFTING_DELAYED: {
    dotClass: 'status-dot--orange',
    labelEn: 'Lifting Delayed',
    labelHi: 'उठान में देरी',
    badgeClass: 'status-badge--orange',
  },
  PAUSED: {
    dotClass: 'status-dot--red',
    labelEn: 'Paused',
    labelHi: 'बंद',
    badgeClass: 'status-badge--red',
  },
}

// Capacity bar fill — based on status
const CAPACITY_FILL: Record<CentreStatus, number> = {
  NORMAL: 0.45,
  BUSY: 0.82,
  LIFTING_DELAYED: 0.65,
  PAUSED: 0,
}

interface CentreCardProps {
  readonly centre: CentrePreview
  readonly language: 'en' | 'hi'
  readonly onClick: () => void
  readonly index: number
}

export function CentreCard({ centre, language, onClick, index }: CentreCardProps) {
  const isHi = language === 'hi'
  const s = STATUS[centre.status]
  const capFill = CAPACITY_FILL[centre.status]
  const isStale = centre.updatedMinutesAgo > 30
  const isPaused = centre.status === 'PAUSED'
  const isDelayed = centre.status === 'LIFTING_DELAYED'

  const etaText = isPaused
    ? isHi ? 'बंद है' : 'Paused'
    : centre.etaMinutes !== null
      ? isHi ? `~${centre.etaMinutes} मिनट` : `~${centre.etaMinutes} min`
      : isHi ? 'अज्ञात' : 'Unknown'

  const updatedText = isHi
    ? `${centre.updatedMinutesAgo} मिनट पहले`
    : `${centre.updatedMinutesAgo}m ago`

  return (
    <motion.button
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.07, ease: [0.23, 1, 0.32, 1] }}
      whileTap={{ scale: 0.98 }}
      className={`centre-card ${isPaused ? 'centre-card--paused' : ''}`}
      onClick={onClick}
      disabled={false}
      aria-label={`${isHi ? centre.hindiName : centre.name}, ${isHi ? s.labelHi : s.labelEn}, ${etaText}`}
    >
      {/* Stale data warning strip */}
      {isStale && (
        <div className="centre-card__stale-strip" role="alert">
          <WifiOff size={12} aria-hidden="true" />
          <span>{isHi ? 'डेटा पुराना हो सकता है' : 'Data may be outdated'}</span>
        </div>
      )}

      {/* Lifting Delayed notice */}
      {isDelayed && (
        <div className="centre-card__delay-strip" role="note">
          <AlertTriangle size={12} aria-hidden="true" />
          <span>{isHi ? 'उठान में देरी — प्रतीक्षा लंबी हो सकती है' : 'Lifting delayed — wait may be longer than usual'}</span>
        </div>
      )}

      {/* Card body */}
      <div className="centre-card__body">
        <div className="centre-card__main">
          {/* Left: name + meta */}
          <div className="centre-card__info">
            <div className="centre-card__name-row">
              <span className={`status-dot ${s.dotClass}`} aria-hidden="true" />
              <span className="centre-card__name">
                {isHi ? centre.hindiName : centre.name}
              </span>
            </div>

            <span className="centre-card__district">{centre.district}</span>

            <div className="centre-card__metrics">
              <span className="centre-card__metric">
                <Clock size={12} aria-hidden="true" />
                {etaText}
              </span>
              {!isPaused && (
                <>
                  <span className="centre-card__metric-sep" aria-hidden="true">·</span>
                  <span className="centre-card__metric">
                    <Users size={12} aria-hidden="true" />
                    {centre.queueLength} {isHi ? 'प्रतीक्षारत' : 'waiting'}
                  </span>
                  <span className="centre-card__metric-sep" aria-hidden="true">·</span>
                  <span className="centre-card__metric">
                    <Activity size={12} aria-hidden="true" />
                    {centre.activeCounters} {isHi ? 'काउंटर' : 'counters'}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Right: status badge + distance + chevron */}
          <div className="centre-card__right">
            <span className={`status-badge ${s.badgeClass}`}>
              {isHi ? s.labelHi : s.labelEn}
            </span>
            <span className="centre-card__distance">{centre.distanceKm} km</span>
            <ChevronRight
              size={16}
              className="centre-card__chevron"
              aria-hidden="true"
            />
          </div>
        </div>

        {/* Capacity bar */}
        {!isPaused && (
          <div
            className="centre-card__cap-bar"
            role="meter"
            aria-valuenow={Math.round(capFill * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={isHi ? 'केंद्र क्षमता' : 'Centre capacity'}
          >
            <motion.div
              className={`centre-card__cap-fill centre-card__cap-fill--${centre.status.toLowerCase()}`}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: capFill }}
              transition={{ duration: 0.6, delay: 0.15 + index * 0.07, ease: [0.23, 1, 0.32, 1] }}
              style={{ transformOrigin: 'left' }}
            />
          </div>
        )}

        {/* Footer: freshness */}
        <div className="centre-card__footer">
          <span className="centre-card__updated">
            {isStale ? <WifiOff size={11} aria-hidden="true" /> : <Wifi size={11} aria-hidden="true" />}
            {isHi ? 'अपडेट:' : 'Updated:'} {updatedText}
          </span>
          {!isPaused && (
            <span className="centre-card__confidence">
              {isHi ? 'विश्वास:' : 'Confidence:'}{' '}
              <strong>{centre.confidence}</strong>
            </span>
          )}
        </div>
      </div>
    </motion.button>
  )
}
