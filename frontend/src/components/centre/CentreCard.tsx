import { motion } from 'motion/react'
import { MapPin, CheckCircle2, ChevronRight } from 'lucide-react'
import type { CentrePreview } from '@/types/centre'
import type { Language } from '@/store/app-store'
import type { CopyMap } from '@/lib/copy'
import { statusKey } from '@/lib/copy'
import { formatEta } from '@/lib/eta'

/**
 * Non-colour status symbol map.
 * WCAG 1.4.1: status must not be conveyed by colour alone.
 * Each status has a distinct shape + text label.
 *
 * Applied from accessibility-a11y skill.
 */
const STATUS_SYMBOL: Record<'normal' | 'busy' | 'delayed' | 'paused', string> = {
  normal: '●',
  busy: '▲',
  delayed: '◆',
  paused: '■',
}

/**
 * Motion variants for card entrance.
 *
 * Applied from framer-motion skill:
 * - Variants defined outside component to prevent re-creation on each render
 * - Only animate transform (y) + opacity — GPU-accelerated, no layout triggers
 * - ease [0.22,1,0.36,1] is a strong ease-out (from emil-design-eng custom curves)
 * - Duration 280ms — under the 300ms UI threshold from emil-design-eng skill
 */
const cardVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.28,
      delay: index * 0.06,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
} as const

interface CentreCardProps {
  readonly centre: CentrePreview
  readonly index: number
  readonly language: Language
  readonly text: CopyMap
  readonly onDetails: (centre: CentrePreview) => void
}

/**
 * Public centre status card.
 *
 * Applied skills: framer-motion (variants, whileTap), emil-design-eng (scale on press,
 * hover guard, animation duration <300ms), accessibility-a11y (non-colour status,
 * aria-labels, 44px touch targets), react (function keyword, handle prefix).
 */
export function CentreCard({ centre, index, language, text, onDetails }: CentreCardProps) {
  const status = statusKey[centre.status]
  const etaText = formatEta(centre.etaMinutes, language, text.pausedEta)
  const centreName = language === 'hi' ? centre.hindiName : centre.name

  function handleDetailsClick() {
    onDetails(centre)
  }

  return (
    <motion.article
      className={`centre-card centre-card--${status}`}
      custom={index}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      variants={cardVariants}
      aria-label={`${centreName} — ${text[status]}`}
    >
      {/* Status + distance */}
      <div className="card-topline">
        <span
          className={`status-badge status-badge--${status}`}
          aria-label={`Status: ${text[status]}`}
        >
          <span className="status-symbol" aria-hidden="true">
            {STATUS_SYMBOL[status]}
          </span>
          {text[status]}
        </span>
        <span className="distance">
          <MapPin size={14} aria-hidden="true" />
          <span aria-label={`${centre.distanceKm} kilometres away`}>{centre.distanceKm} km</span>
        </span>
      </div>

      {/* Centre name */}
      <div className="centre-name">
        <p lang={language === 'hi' ? 'hi' : 'en'}>{centreName}</p>
        <span>{centre.district}</span>
      </div>

      {/* ETA — primary farmer-facing value */}
      <div className="eta-block">
        <span>{text.estimatedWait}</span>
        <strong aria-label={`${text.estimatedWait}: ${etaText}`}>{etaText}</strong>
        <small>
          <CheckCircle2 size={13} aria-hidden="true" />
          {text[centre.confidence.toLowerCase() as 'high' | 'medium' | 'low' | 'na']}
        </small>
      </div>

      {/* Operational facts */}
      <dl className="centre-facts">
        <div>
          <dt>{text.queue}</dt>
          <dd>{centre.status === 'PAUSED' ? '—' : centre.queueLength}</dd>
        </div>
        <div>
          <dt>{text.counters}</dt>
          <dd>{centre.status === 'PAUSED' ? '—' : centre.activeCounters}</dd>
        </div>
        <div>
          <dt>{text.updated}</dt>
          <dd>
            {centre.updatedMinutesAgo} {text.min}
          </dd>
        </div>
      </dl>

      {/* Details CTA — whileTap for Emil's press feedback */}
      <motion.button
        type="button"
        className="details-link"
        onClick={handleDetailsClick}
        aria-label={`${text.details}: ${centreName}`}
        whileTap={{ scale: 0.97 }}
        transition={{ duration: 0.1, ease: 'easeOut' }}
      >
        {text.details}
        <ChevronRight size={17} aria-hidden="true" />
      </motion.button>
    </motion.article>
  )
}
