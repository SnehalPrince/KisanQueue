import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import {
  Languages,
  ArrowUpRight,
  ChevronDown,
  LayoutDashboard,
  QrCode,
  ListOrdered,
  Building2,
  LogOut,
  User,
} from 'lucide-react'
import { toast } from 'sonner'
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
 * Sticky site header with animated farmer profile menu & bilingual navigation.
 *
 * Applied skills:
 * - emil-design-eng: button scale(0.97) on press, transform-origin on popover, <200ms dropdown
 * - accessibility-a11y: aria-expanded, aria-haspopup, role="menu", role="menuitem", escape key handler
 * - framer-motion: spring entry for dropdown menu
 */
export function SiteHeader({ language, text, onToggleLanguage, onProfileClick }: SiteHeaderProps) {
  const navigate = useNavigate()
  const { farmer, isAuthenticated, logout } = useAppStore()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [menuOpen])

  // Close dropdown on Escape key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && menuOpen) {
        setMenuOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [menuOpen])

  function handleNavigate(path: string) {
    setMenuOpen(false)
    navigate(path)
  }

  function handleLogout() {
    setMenuOpen(false)
    logout()
    toast.info(language === 'hi' ? 'सत्र समाप्त किया गया' : 'Logged out successfully')
    navigate('/')
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
          <a
            href="/queue"
            className="nav-queue-pill"
            onClick={(e) => {
              e.preventDefault()
              navigate('/queue')
            }}
          >
            <span className="live-dot-green" aria-hidden="true" />
            {language === 'hi' ? 'लाइव कतार (#5)' : 'Live Queue (#5)'}
          </a>
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
          <Languages size={16} aria-hidden="true" />
          <span>{language === 'hi' ? 'EN' : 'हि'}</span>
        </button>

        {isAuthenticated && farmer ? (
          <div className="header-profile-wrapper" ref={menuRef}>
            <button
              className={`user-profile-btn ${menuOpen ? 'is-active' : ''}`}
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              aria-label={
                language === 'hi'
                  ? `${farmer.name} - किसान मेनू`
                  : `${farmer.name} - Farmer Profile Menu`
              }
            >
              <span className="user-avatar-initial" aria-hidden="true">
                {farmer.name.slice(0, 1).toUpperCase()}
              </span>
              <span className="user-name-text">{farmer.name}</span>
              <ChevronDown
                size={14}
                className={`profile-chevron ${menuOpen ? 'is-rotated' : ''}`}
                aria-hidden="true"
              />
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  className="profile-dropdown-menu"
                  role="menu"
                  initial={{ opacity: 0, scale: 0.95, y: -6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -6 }}
                  transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className="profile-dropdown-header">
                    <div className="dropdown-farmer-avatar">
                      <User size={18} aria-hidden="true" />
                    </div>
                    <div className="dropdown-farmer-meta">
                      <strong className="dropdown-farmer-name">{farmer.name}</strong>
                      <span className="dropdown-farmer-sub">
                        {farmer.village}, {farmer.district} · {farmer.primaryCrop}
                      </span>
                    </div>
                  </div>

                  <div className="profile-dropdown-divider" role="separator" />

                  <div className="profile-dropdown-links">
                    <button
                      type="button"
                      role="menuitem"
                      className="dropdown-item"
                      onClick={() => handleNavigate('/home')}
                    >
                      <LayoutDashboard size={16} aria-hidden="true" />
                      <span>{language === 'hi' ? 'किसान डैशबोर्ड' : 'Farmer Dashboard'}</span>
                    </button>

                    <button
                      type="button"
                      role="menuitem"
                      className="dropdown-item"
                      onClick={() => handleNavigate('/pass/PASS-7729')}
                    >
                      <QrCode size={16} aria-hidden="true" />
                      <span>{language === 'hi' ? 'डिजिटल पास और क्यूआर' : 'Digital Pass & QR'}</span>
                    </button>

                    <button
                      type="button"
                      role="menuitem"
                      className="dropdown-item"
                      onClick={() => handleNavigate('/queue')}
                    >
                      <ListOrdered size={16} aria-hidden="true" />
                      <span>{language === 'hi' ? 'लाइव कतार स्थिति' : 'Live Queue Status'}</span>
                    </button>

                    <button
                      type="button"
                      role="menuitem"
                      className="dropdown-item"
                      onClick={() => handleNavigate('/centres')}
                    >
                      <Building2 size={16} aria-hidden="true" />
                      <span>{language === 'hi' ? 'मंडी केंद्र खोजें' : 'Mandi Centres'}</span>
                    </button>
                  </div>

                  <div className="profile-dropdown-divider" role="separator" />

                  <button
                    type="button"
                    role="menuitem"
                    className="dropdown-item is-danger"
                    onClick={handleLogout}
                  >
                    <LogOut size={16} aria-hidden="true" />
                    <span>{language === 'hi' ? 'लॉग आउट करें' : 'Log Out'}</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
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
