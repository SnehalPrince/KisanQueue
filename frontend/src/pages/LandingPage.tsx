import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { useQuery } from '@tanstack/react-query'
import { ArrowDown, ShieldCheck } from 'lucide-react'
import { useAppStore } from '@/store/app-store'
import { copy } from '@/lib/copy'
import { centreKeys } from '@/lib/query-keys'
import { centreService } from '@/services/mock/centre-service'
import type { CentrePreview } from '@/types/centre'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { CentreStatusGrid } from '@/components/centre/CentreStatusGrid'
import { CentreModal } from '@/components/centre/CentreModal'
import { useSmoothScroll } from '@/components/layout/SmoothScrollProvider'

/**
 * Stagger variants for the How It Works section.
 * Applied per framer-motion & emil-design-eng skills.
 */
const sectionVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.32,
      ease: [0.22, 1, 0.36, 1],
      staggerChildren: 0.08,
    },
  },
} as const

const statItemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.24, ease: [0.22, 1, 0.36, 1] },
  },
} as const

/**
 * Landing page — `/`
 *
 * Skills applied:
 * - lenis / smooth-scroll: Lenis smooth scroll provider + scrollTo helper
 * - framer-motion: useScroll reading page progress, useTransform for subtle hero parallax, whileInView stagger
 * - accessibility-a11y: skip link, aria-labels, touch targets >=44px, prefers-reduced-motion respected
 * - emil-design-eng: button scale(0.97) on press, hardware-accelerated transforms, <300ms transitions
 */
export function LandingPage() {
  const navigate = useNavigate()
  const { language, setLanguage, farmer, isAuthenticated } = useAppStore()
  const { scrollTo } = useSmoothScroll()
  const [selectedCentre, setSelectedCentre] = useState<CentrePreview | null>(null)
  const reduceMotion = useReducedMotion()
  const text = copy[language]

  // Scroll progress for top progress bar & subtle parallax
  const { scrollYProgress } = useScroll()
  const heroImageY = useTransform(scrollYProgress, [0, 0.25], reduceMotion ? [0, 0] : [0, 36])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.3], reduceMotion ? [1, 1] : [1, 0.75])

  // TanStack Query for centre data
  const {
    data: centres,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: centreKeys.list(),
    queryFn: () => centreService.listPreviews(),
    staleTime: 30_000,
  })

  function handleToggleLanguage() {
    setLanguage(language === 'hi' ? 'en' : 'hi')
  }

  function handleProfileClick() {
    if (isAuthenticated && farmer) {
      navigate('/home')
    } else {
      navigate('/onboarding')
    }
  }

  function handleScrollToCentres() {
    scrollTo('#content', { offset: -20 })
  }

  return (
    <main id="main-content">
      {/* Scroll Progress Bar at the top */}
      <motion.div
        className="page-scroll-progress"
        style={{ scaleX: scrollYProgress, transformOrigin: '0% 50%' }}
        aria-hidden="true"
      />

      {/* Skip link — must be first focusable element */}
      <a className="skip-link" href="#content">
        Skip to centre conditions
      </a>

      <SiteHeader
        language={language}
        text={text}
        onToggleLanguage={handleToggleLanguage}
        onProfileClick={handleProfileClick}
      />

      {/* ─── Hero ─────────────────────────────────────────────────── */}
      <section id="top" className="hero-section" aria-labelledby="hero-title">
        <motion.img
          className="hero-image"
          src="/assets/images/hero_mandi_dusk.png"
          alt="Tractors carrying grain at a procurement mandi at sunrise"
          loading="eager"
          decoding="async"
          style={{ y: heroImageY, opacity: heroOpacity }}
        />
        <div className="hero-wash" aria-hidden="true" />
        <div className="hero-grain" aria-hidden="true" />

        <div className="hero-content">
          {/* Live pill */}
          <div className="live-pill" role="status" aria-label="Live operational preview">
            <span className="live-dot" aria-hidden="true" />
            {text.live}
          </div>

          {/* Headline copy */}
          <div className="t-stagger is-shown hero-copy">
            <p className="t-stagger-line t-stagger-line--1 eyebrow" lang={language === 'hi' ? 'hi' : 'en'}>
              {text.eyebrow}
            </p>
            <h1
              id="hero-title"
              className="t-stagger-line t-stagger-line--2"
              lang={language === 'hi' ? 'hi' : 'en'}
            >
              {text.heading}
            </h1>
          </div>

          <p className="hero-intro" lang={language === 'hi' ? 'hi' : 'en'}>
            {text.intro}
          </p>

          {/* Primary actions */}
          <div className="hero-actions">
            <motion.button
              type="button"
              className="primary-button"
              onClick={handleScrollToCentres}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.1, ease: 'easeOut' }}
            >
              {text.explore}
              <ArrowDown size={18} aria-hidden="true" />
            </motion.button>
            {isAuthenticated && farmer ? (
              <button
                type="button"
                className="hero-farmer-badge"
                onClick={() => navigate('/home')}
                aria-label={language === 'hi' ? 'किसान डैशबोर्ड खोलें' : 'Open Farmer Dashboard'}
              >
                <span>🌾 {language === 'hi' ? `नमस्ते, ${farmer.name}` : `Welcome, ${farmer.name}`}</span>
                <strong className="hero-farmer-link">
                  {language === 'hi' ? 'डैशबोर्ड खोलें →' : 'Open Dashboard →'}
                </strong>
              </button>
            ) : (
              <span className="profile-hint" lang={language === 'hi' ? 'hi' : 'en'}>
                {text.profileHint}
              </span>
            )}
          </div>
        </div>

        {/* Proof bar */}
        <div className="hero-proof">
          <span className="proof-icon" aria-hidden="true">
            <ShieldCheck size={19} />
          </span>
          <div>
            <strong lang={language === 'hi' ? 'hi' : 'en'}>{text.proofTitle}</strong>
            <span lang={language === 'hi' ? 'hi' : 'en'}>{text.proofBody}</span>
          </div>
        </div>

        <button
          className="scroll-cue"
          type="button"
          onClick={handleScrollToCentres}
          aria-label={text.scroll}
        >
          <span>{text.scroll}</span>
          <ArrowDown size={16} aria-hidden="true" />
        </button>
      </section>

      {/* ─── Centre Status Preview ─────────────────────────────────── */}
      <section id="content" className="centres-section" aria-labelledby="centres-title">
        <div className="section-heading">
          <div>
            <p className="section-kicker">01 / {text.status}</p>
            <h2 id="centres-title">{text.preview}</h2>
          </div>
          <p lang={language === 'hi' ? 'hi' : 'en'}>{text.previewNote}</p>
        </div>

        <CentreStatusGrid
          centres={centres}
          isLoading={isLoading}
          isError={isError}
          language={language}
          text={text}
          onRetry={() => { void refetch() }}
          onDetails={setSelectedCentre}
        />
      </section>

      {/* ─── How It Works ──────────────────────────────────────────── */}
      <motion.section
        id="how-it-works"
        className="explain-section"
        aria-labelledby="how-title"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={sectionVariants}
      >
        <div className="explain-rule" aria-hidden="true" />
        <p className="section-kicker">02 / KISANQUEUE</p>
        <h2 id="how-title" lang={language === 'hi' ? 'hi' : 'en'}>
          {text.howTitle}
        </h2>
        <p lang={language === 'hi' ? 'hi' : 'en'}>{text.howText}</p>

        <div className="stat-row" role="list" aria-label="Key features">
          <motion.span role="listitem" variants={statItemVariants}>
            <strong aria-hidden="true">01</strong>
            <span lang={language === 'hi' ? 'hi' : 'en'}>{text.statOne}</span>
          </motion.span>
          <motion.span role="listitem" variants={statItemVariants}>
            <strong aria-hidden="true">02</strong>
            <span lang={language === 'hi' ? 'hi' : 'en'}>{text.statTwo}</span>
          </motion.span>
          <motion.span role="listitem" variants={statItemVariants}>
            <strong aria-hidden="true">03</strong>
            <span lang={language === 'hi' ? 'hi' : 'en'}>{text.statThree}</span>
          </motion.span>
        </div>
      </motion.section>

      {/* ─── Footer ────────────────────────────────────────────────── */}
      <footer role="contentinfo">
        <span>© 2026 KisanQueue — Snehal Prince</span>
        <span lang={language === 'hi' ? 'hi' : 'en'}>{text.source}</span>
      </footer>

      {/* ─── Centre Detail Modal ───────────────────────────────────── */}
      <AnimatePresence>
        {selectedCentre ? (
          <CentreModal
            key={selectedCentre.id}
            centre={selectedCentre}
            language={language}
            text={text}
            onClose={() => setSelectedCentre(null)}
          />
        ) : null}
      </AnimatePresence>
    </main>
  )
}
