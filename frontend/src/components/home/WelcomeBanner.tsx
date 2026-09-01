import { motion } from 'motion/react'
import type { FarmerProfile } from '@/types/auth'

interface WelcomeBannerProps {
  readonly farmer: FarmerProfile
  readonly language: 'en' | 'hi'
}

const GREETINGS = {
  en: { hello: 'Welcome back,', sub: 'Here is your mandi dashboard' },
  hi: { hello: 'नमस्ते,', sub: 'आपका मंडी डैशबोर्ड' },
}

const CROP_EMOJIS: Record<string, string> = {
  wheat: '🌾',
  soybean: '🫘',
  paddy: '🌿',
  barley: '🌱',
}

export function WelcomeBanner({ farmer, language }: WelcomeBannerProps) {
  const c = GREETINGS[language]
  const cropEmoji = CROP_EMOJIS[farmer.primaryCrop] ?? '🌾'

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', duration: 0.55, bounce: 0.18 }}
      className="welcome-banner"
      aria-label={language === 'hi' ? 'किसान स्वागत बैनर' : 'Farmer welcome banner'}
    >
      <div className="welcome-banner__avatar" aria-hidden="true">
        <span className="welcome-banner__crop-emoji">{cropEmoji}</span>
      </div>

      <div className="welcome-banner__text">
        <p className="welcome-banner__greeting">{c.hello}</p>
        <h1 className="welcome-banner__name">
          {language === 'hi' ? farmer.hindiName : farmer.name}
        </h1>
        <p className="welcome-banner__meta">
          {farmer.village} · {farmer.district}
        </p>
        <p className="welcome-banner__sub">{c.sub}</p>
      </div>

      {/* Live indicator pill */}
      <motion.div
        className="welcome-banner__live"
        animate={{ opacity: [1, 0.5, 1] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        aria-label="Live data"
      >
        <span className="welcome-banner__live-dot" aria-hidden="true" />
        <span>Live</span>
      </motion.div>
    </motion.section>
  )
}
