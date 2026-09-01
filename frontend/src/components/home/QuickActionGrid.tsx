import { motion } from 'motion/react'
import { ShoppingBasket, ListOrdered, MapPin, MessageCircle } from 'lucide-react'

interface Action {
  readonly id: string
  readonly icon: React.ReactNode
  readonly titleEn: string
  readonly titleHi: string
  readonly descEn: string
  readonly descHi: string
  readonly gradient: string
  readonly onClick: () => void
  readonly disabled?: boolean
}

interface QuickActionGridProps {
  readonly language: 'en' | 'hi'
  readonly onSellCrop: () => void
  readonly onViewQueue: () => void
  readonly onViewCentres: () => void
  readonly onWhatsApp: () => void
  readonly hasActivePass: boolean
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.1 },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', duration: 0.5, bounce: 0.2 } },
}

export function QuickActionGrid({
  language,
  onSellCrop,
  onViewQueue,
  onViewCentres,
  onWhatsApp,
  hasActivePass,
}: QuickActionGridProps) {
  const isHi = language === 'hi'

  const ACTIONS: Action[] = [
    {
      id: 'sell',
      icon: <ShoppingBasket size={28} strokeWidth={1.75} aria-hidden="true" />,
      titleEn: 'Sell Crop',
      titleHi: 'फसल बेचें',
      descEn: hasActivePass ? 'You have an active pass' : 'Generate digital pass',
      descHi: hasActivePass ? 'आपके पास सक्रिय पास है' : 'डिजिटल पास बनाएं',
      gradient: 'linear-gradient(135deg, #40534C 0%, #677D6A 100%)',
      onClick: onSellCrop,
    },
    {
      id: 'queue',
      icon: <ListOrdered size={28} strokeWidth={1.75} aria-hidden="true" />,
      titleEn: 'My Queue',
      titleHi: 'मेरी कतार',
      descEn: hasActivePass ? 'Track your position' : 'No active queue',
      descHi: hasActivePass ? 'अपनी स्थिति देखें' : 'कोई सक्रिय कतार नहीं',
      gradient: 'linear-gradient(135deg, #1A3636 0%, #40534C 100%)',
      onClick: onViewQueue,
    },
    {
      id: 'centres',
      icon: <MapPin size={28} strokeWidth={1.75} aria-hidden="true" />,
      titleEn: 'Nearby Mandis',
      titleHi: 'नज़दीकी मंडियां',
      descEn: 'Live conditions & ETAs',
      descHi: 'लाइव स्थिति और समय',
      gradient: 'linear-gradient(135deg, #677D6A 0%, #D6BD98 100%)',
      onClick: onViewCentres,
    },
    {
      id: 'whatsapp',
      icon: <MessageCircle size={28} strokeWidth={1.75} aria-hidden="true" />,
      titleEn: 'Krishi Mitra',
      titleHi: 'कृषि मित्र',
      descEn: 'WhatsApp assistant',
      descHi: 'व्हाट्सएप सहायक',
      gradient: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
      onClick: onWhatsApp,
    },
  ]

  return (
    <section
      aria-label={isHi ? 'त्वरित कार्रवाई' : 'Quick actions'}
      className="quick-actions"
    >
      <h2 className="quick-actions__title">
        {isHi ? 'क्या करना है?' : 'What would you like to do?'}
      </h2>
      <motion.div
        className="quick-actions__grid"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {ACTIONS.map((action) => (
          <motion.button
            key={action.id}
            variants={cardVariants}
            whileTap={{ scale: 0.97 }}
            whileHover={{ y: -2 }}
            className="quick-action-card"
            style={{ background: action.gradient }}
            onClick={action.onClick}
            disabled={action.disabled}
            aria-label={`${isHi ? action.titleHi : action.titleEn}: ${isHi ? action.descHi : action.descEn}`}
          >
            <span className="quick-action-card__icon">{action.icon}</span>
            <span className="quick-action-card__title">
              {isHi ? action.titleHi : action.titleEn}
            </span>
            <span className="quick-action-card__desc">
              {isHi ? action.descHi : action.descEn}
            </span>
          </motion.button>
        ))}
      </motion.div>
    </section>
  )
}
