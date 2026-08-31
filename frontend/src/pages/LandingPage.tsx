import { useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'motion/react'
import { useQuery } from '@tanstack/react-query'
import { ArrowDown, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { useAppStore } from '@/store/app-store'
import { copy } from '@/lib/copy'
import { centreKeys } from '@/lib/query-keys'
import { centreService } from '@/services/mock/centre-service'
import type { CentrePreview } from '@/types/centre'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { CentreStatusGrid } from '@/components/centre/CentreStatusGrid'
import { CentreModal } from '@/components/centre/CentreModal'

/**
 * Landing page — `/`
 *
 * Public, unauthenticated. Shows:
 *  1. Hero — product promise, language switcher, onboarding entry point
 *  2. Centre status preview — Rajgarh / Hisar / Patiala with real mock data
 *  3. How it works — brief product explanation
 *  4. Footer — data disclaimer
 *
 * Sign-in / personalized features are gated behind a toast in this slice.
 * The next slice (farmer onboarding) implements the actual auth flow.
 */
/**
 * Landing page — `/`
 *
 * Skills applied:
 * - react: function keyword, handle prefix for handlers, named export
 * - tanstack-query: centreKeys query key factory
 * - framer-motion: motion.button with whileTap, variants outside render
 * - accessibility-a11y: skip link, lang attrs, aria-labels, focus management
 * - emil-design-eng: <300ms transitions, scale(0.97) on press, ease-out
 * - zustand: select only needed state, persist middleware in store
 */
export function LandingPage() {
  const { language, setLanguage } = useAppStore()
  const [selectedCentre, setSelectedCentre] = useState<CentrePreview | null>(null)
  const reduceMotion = useReducedMotion()
  const text = copy[language]

  // tanstack-query skill: use key factory for type-safe, cacheable keys
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

  // react skill: handle prefix for event handlers
  function handleToggleLanguage() {
    setLanguage(language === 'hi' ? 'en' : 'hi')
  }

  function handleProfileClick() {
    toast.info(text.toastTitle, { description: text.toastDescription })
  }

  function handleScrollToCentres() {
    document.getElementById('content')?.scrollIntoView({
      behavior: reduceMotion ? 'auto' : 'smooth',
    })
  }

  return (
    <main id="main-content">
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
        <img
          className="hero-image"
          src="/assets/images/hero_mandi_dusk.png"
          alt="Tractors carrying grain at a procurement mandi at sunrise"
          fetchPriority="high"
          decoding="async"
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
            {/* framer-motion skill: motion.button + whileTap per emil-design-eng press feedback */}
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
            <span className="profile-hint" lang={language === 'hi' ? 'hi' : 'en'}>
              {text.profileHint}
            </span>
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
      <section id="how-it-works" className="explain-section" aria-labelledby="how-title">
        <div className="explain-rule" aria-hidden="true" />
        <p className="section-kicker">02 / KISANQUEUE</p>
        <h2 id="how-title" lang={language === 'hi' ? 'hi' : 'en'}>
          {text.howTitle}
        </h2>
        <p lang={language === 'hi' ? 'hi' : 'en'}>{text.howText}</p>

        <div className="stat-row" role="list" aria-label="Key features">
          <span role="listitem">
            <strong aria-hidden="true">01</strong>
            <span lang={language === 'hi' ? 'hi' : 'en'}>{text.statOne}</span>
          </span>
          <span role="listitem">
            <strong aria-hidden="true">02</strong>
            <span lang={language === 'hi' ? 'hi' : 'en'}>{text.statTwo}</span>
          </span>
          <span role="listitem">
            <strong aria-hidden="true">03</strong>
            <span lang={language === 'hi' ? 'hi' : 'en'}>{text.statThree}</span>
          </span>
        </div>
      </section>

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
