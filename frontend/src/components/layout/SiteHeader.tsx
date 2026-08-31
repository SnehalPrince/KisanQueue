import { Languages, ArrowUpRight } from 'lucide-react'
import type { Language } from '@/store/app-store'
import type { CopyMap } from '@/lib/copy'

interface SiteHeaderProps {
  readonly language: Language
  readonly text: CopyMap
  readonly onToggleLanguage: () => void
  readonly onProfileClick: () => void
}

/**
 * Sticky site header: brand mark, desktop nav, language toggle, profile CTA.
 *
 * Profile CTA is toast-gated in this slice (no auth yet).
 * Desktop nav is hidden on mobile (< 760px via CSS).
 */
export function SiteHeader({ language, text, onToggleLanguage, onProfileClick }: SiteHeaderProps) {
  return (
    <header className="site-header" aria-label="Primary navigation">
      <a className="brand" href="#top" aria-label="KisanQueue home">
        <span className="brand-mark" aria-hidden="true">
          क्यू
        </span>
        <span>{text.brand}</span>
      </a>

      <nav className="desktop-nav" aria-label="Section navigation">
        <a href="#centres">{text.navCentres}</a>
        <a href="#how-it-works">{text.navHow}</a>
      </nav>

      <div className="header-actions">
        <button
          className="language-button"
          type="button"
          onClick={onToggleLanguage}
          aria-label={language === 'hi' ? 'Switch to English' : 'हिंदी में बदलें'}
          aria-pressed={language === 'hi'}
        >
          <Languages size={17} aria-hidden="true" />
          <span>{language === 'hi' ? 'EN' : 'हि'}</span>
        </button>

        <button
          className="quiet-button"
          type="button"
          onClick={onProfileClick}
          aria-label={text.profile}
        >
          {text.profile}
          <ArrowUpRight size={15} aria-hidden="true" />
        </button>
      </div>
    </header>
  )
}
