import { motion } from 'motion/react'
import { Clock, MapPin, Hash, ChevronRight, Loader2 } from 'lucide-react'
import type { ProcurementPass } from '@/types/queue'

interface ActivePassCardProps {
  readonly pass: ProcurementPass | null
  readonly isLoading: boolean
  readonly language: 'en' | 'hi'
  readonly onViewPass: (passId: string) => void
}

const STATUS_LABELS: Record<string, { en: string; hi: string; className: string }> = {
  WAITING: { en: 'Waiting in queue', hi: 'कतार में प्रतीक्षारत', className: 'pass-card__status--waiting' },
  CHECKED_IN: { en: 'Checked in', hi: 'चेक-इन हो गया', className: 'pass-card__status--checked-in' },
  PROCESSING: { en: 'Being processed', hi: 'प्रक्रिया में है', className: 'pass-card__status--processing' },
  COMPLETED: { en: 'Completed', hi: 'पूर्ण', className: 'pass-card__status--completed' },
}

export function ActivePassCard({ pass, isLoading, language, onViewPass }: ActivePassCardProps) {
  const isHi = language === 'hi'

  if (isLoading) {
    return (
      <div className="pass-card pass-card--loading" aria-busy="true" aria-label="Loading pass">
        <Loader2 className="pass-card__loader" aria-hidden="true" />
        <span className="sr-only">{isHi ? 'पास लोड हो रहा है...' : 'Loading pass...'}</span>
      </div>
    )
  }

  if (!pass) return null

  const statusInfo = STATUS_LABELS[pass.queueEntryStatus] ?? STATUS_LABELS['WAITING']!

  const etaText =
    pass.etaMinutes !== null
      ? isHi
        ? `${pass.etaMinutes} मिनट में`
        : `~${pass.etaMinutes} min wait`
      : isHi
        ? 'समय उपलब्ध नहीं'
        : 'ETA unavailable'

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', duration: 0.45, bounce: 0.15 }}
      className="pass-card"
      role="region"
      aria-label={isHi ? 'सक्रिय डिजिटल पास' : 'Active digital pass'}
    >
      <div className="pass-card__header">
        <div className="pass-card__badge">
          <span className="pass-card__badge-dot" aria-hidden="true" />
          {isHi ? 'सक्रिय पास' : 'Active Pass'}
        </div>
        <span className={`pass-card__status ${statusInfo.className}`}>
          {isHi ? statusInfo.hi : statusInfo.en}
        </span>
      </div>

      <div className="pass-card__token-row">
        <div className="pass-card__token">
          <Hash size={16} aria-hidden="true" />
          <span>{pass.token}</span>
        </div>
        <div className="pass-card__position">
          {isHi ? 'स्थान' : 'Position'}{' '}
          <strong>#{pass.queuePosition}</strong>
        </div>
      </div>

      <div className="pass-card__details">
        <div className="pass-card__detail">
          <MapPin size={14} aria-hidden="true" />
          <span>{isHi ? pass.centreHindiName : pass.centreName}</span>
        </div>
        <div className="pass-card__detail">
          <Clock size={14} aria-hidden="true" />
          <span>{etaText}</span>
        </div>
      </div>

      <div className="pass-card__crop-row">
        <span className="pass-card__crop">
          {isHi ? pass.cropNameHi : pass.cropNameEn}
        </span>
        <span className="pass-card__qty">{pass.quantityQ} {isHi ? 'क्विंटल' : 'Quintals'}</span>
      </div>

      <motion.button
        whileTap={{ scale: 0.97 }}
        transition={{ duration: 0.16 }}
        className="pass-card__view-btn"
        onClick={() => onViewPass(pass.id)}
        aria-label={isHi ? 'पूरा पास देखें' : 'View full pass with QR code'}
      >
        {isHi ? 'QR पास देखें' : 'View QR Pass'}
        <ChevronRight size={16} aria-hidden="true" />
      </motion.button>
    </motion.div>
  )
}
