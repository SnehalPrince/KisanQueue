import { motion } from 'motion/react'
import { CheckCircle2, Clock, Hash, Loader2, AlertCircle } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import type { ProcurementPass } from '@/types/queue'

interface QRPassCardProps {
  readonly pass: ProcurementPass
  readonly language: 'en' | 'hi'
}

const STATUS_CONFIG: Record<
  string,
  { label: { en: string; hi: string }; color: string; icon: React.ReactNode }
> = {
  WAITING: {
    label: { en: 'Waiting in queue', hi: 'कतार में प्रतीक्षारत' },
    color: '#40534C',
    icon: <Clock size={18} aria-hidden="true" />,
  },
  CHECKED_IN: {
    label: { en: 'Checked in at gate', hi: 'गेट पर चेक-इन हो गया' },
    color: '#677D6A',
    icon: <CheckCircle2 size={18} aria-hidden="true" />,
  },
  PROCESSING: {
    label: { en: 'Being processed', hi: 'प्रक्रिया में है' },
    color: '#1A3636',
    icon: <Loader2 size={18} aria-hidden="true" className="spin" />,
  },
  COMPLETED: {
    label: { en: 'Procurement complete', hi: 'खरीद पूर्ण हो गई' },
    color: '#25a244',
    icon: <CheckCircle2 size={18} aria-hidden="true" />,
  },
}

export function QRPassCard({ pass, language }: QRPassCardProps) {
  const isHi = language === 'hi'
  const statusConfig = STATUS_CONFIG[pass.queueEntryStatus] ?? STATUS_CONFIG['WAITING']!

  const issuedDate = new Date(pass.issuedAt).toLocaleString(isHi ? 'hi-IN' : 'en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })

  const etaText =
    pass.etaMinutes !== null
      ? isHi
        ? `~${pass.etaMinutes} मिनट`
        : `~${pass.etaMinutes} min`
      : isHi
        ? 'समय उपलब्ध नहीं'
        : 'ETA unavailable'

  return (
    <motion.div
      className="qr-pass-card"
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', duration: 0.55, bounce: 0.15 }}
      role="region"
      aria-label={isHi ? 'डिजिटल प्रोक्योरमेंट पास' : 'Digital procurement pass'}
    >
      {/* Pass header strip */}
      <div className="qr-pass-card__header" style={{ background: `linear-gradient(135deg, #1A3636, ${statusConfig.color})` }}>
        <div className="qr-pass-card__brand">
          <span aria-hidden="true">🌾</span>
          <span>{isHi ? 'किसानक्यू' : 'KisanQueue'}</span>
        </div>
        <div className="qr-pass-card__status-badge" style={{ color: statusConfig.color }}>
          {statusConfig.icon}
          <span>{isHi ? statusConfig.label.hi : statusConfig.label.en}</span>
        </div>
      </div>

      {/* Token prominently */}
      <div className="qr-pass-card__token-hero">
        <span className="qr-pass-card__token-label">
          <Hash size={14} aria-hidden="true" />
          {isHi ? 'टोकन' : 'Token'}
        </span>
        <motion.span
          className="qr-pass-card__token-value"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', duration: 0.5, bounce: 0.3 }}
        >
          {pass.token}
        </motion.span>
        <span className="qr-pass-card__position">
          {isHi ? `कतार में स्थान #${pass.queuePosition}` : `Queue position #${pass.queuePosition}`}
        </span>
      </div>

      {/* QR Code placeholder (react-qr-code or qrcode.react) */}
      <div className="qr-pass-card__qr-wrapper" aria-label={`QR code for ${pass.token}`}>
        {/* We use a dynamic import pattern to avoid SSR issues */}
        <QRCodeDisplay value={pass.qrPayload} size={200} />
        <p className="qr-pass-card__qr-hint">
          {isHi
            ? 'मंडी के गेट पर यह QR दिखाएं'
            : 'Show this QR at the procurement centre gate'}
        </p>
      </div>

      {/* Pass meta details */}
      <div className="qr-pass-card__details">
        <PassDetailRow
          label={isHi ? 'केंद्र' : 'Centre'}
          value={isHi ? pass.centreHindiName : pass.centreName}
        />
        <PassDetailRow
          label={isHi ? 'फसल' : 'Crop'}
          value={isHi ? pass.cropNameHi : pass.cropNameEn}
        />
        <PassDetailRow
          label={isHi ? 'मात्रा' : 'Quantity'}
          value={`${pass.quantityQ} ${isHi ? 'क्विंटल' : 'Quintals'}`}
        />
        <PassDetailRow
          label={isHi ? 'अनुमानित प्रतीक्षा' : 'Est. wait'}
          value={etaText}
          highlight
        />
        <PassDetailRow
          label={isHi ? 'जारी किया गया' : 'Issued at'}
          value={issuedDate}
        />
      </div>

      {/* Offline notice */}
      <div className="qr-pass-card__offline-notice" role="note">
        <AlertCircle size={14} aria-hidden="true" />
        <span>
          {isHi
            ? 'यह पास ऑफलाइन भी काम करेगा — स्क्रीनशॉट लें'
            : 'This pass works offline — take a screenshot'}
        </span>
      </div>
    </motion.div>
  )
}

function PassDetailRow({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className={`pass-detail-row ${highlight ? 'pass-detail-row--highlight' : ''}`}>
      <span className="pass-detail-row__label">{label}</span>
      <span className="pass-detail-row__value">{value}</span>
    </div>
  )
}

/** QR code display using the statically imported QRCodeSVG from qrcode.react */
function QRCodeDisplay({ value, size }: { value: string; size: number }) {
  return (
    <QRCodeSVG
      value={value}
      size={size}
      fgColor="#1A3636"
      bgColor="#FAFAF7"
      level="M"
    />
  )
}
