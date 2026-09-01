import { Languages, ArrowUpRight, User, LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store/app-store'
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
 * When authenticated: Displays farmer avatar, name, and 1-tap link to /home.
 * When unauthenticated: Displays "Set up profile ↗" button to /onboarding.
 */
export function SiteHeader({ language, text, onToggleLanguage, onProfileClick }: SiteHeaderProps) {
  const navigate = useNavigate()
  const { farmer, isAuthenticated, logout } = useAppStore()

  function handleDashboardClick() {
    navigate('/home')
  }

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
        {isAuthenticated && (
          <>
            <a href="/home" className="nav-dashboard-link">
              {language === 'hi' ? 'डैशबोर्ड' : 'Dashboard'}
            </a>
            <a href="/queue" className="nav-queue-link">
              {language === 'hi' ? 'लाइव कतार' : 'Live Queue'}
            </a>
          </>
        )}
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

        {isAuthenticated && farmer ? (
          <div className="auth-header-group">
            <button
              className="user-profile-btn"
              type="button"
              onClick={handleDashboardClick}
              aria-label={
                language === 'hi'
                  ? `${farmer.name} - किसान डैशबोर्ड`
                  : `${farmer.name} - Farmer Dashboard`
              }
            >
              <span className="user-avatar-initial" aria-hidden="true">
                {farmer.name.slice(0, 1).toUpperCase()}
              </span>
              <span className="user-name-text">{farmer.name}</span>
              <span className="user-badge-tag">
                {language === 'hi' ? 'डैशबोर्ड' : 'Dashboard'}
              </span>
            </button>
          </div>
        ) : (
          <button
            className="quiet-button"
            type="button"
            onClick={onProfileClick}
            aria-label={text.profile}
          >
            {text.profile}
            <ArrowUpRight size={15} aria-hidden="true" />
          </button>
        )}
      </div>
    </header>
  )
}

