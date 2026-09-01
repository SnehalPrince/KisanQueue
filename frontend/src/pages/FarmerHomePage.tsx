import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { useQuery } from '@tanstack/react-query'
import { LogOut, Settings } from 'lucide-react'
import { toast } from 'sonner'
import { useAppStore } from '@/store/app-store'
import { queueService } from '@/services/mock/queue-service'
import { centreService } from '@/services/mock/centre-service'
import { queueKeys } from '@/lib/queue-keys'
import { WelcomeBanner } from '@/components/home/WelcomeBanner'
import { ActivePassCard } from '@/components/home/ActivePassCard'
import { QuickActionGrid } from '@/components/home/QuickActionGrid'
import { SellCropModal } from '@/components/sell/SellCropModal'

/**
 * FarmerHomePage — authenticated dashboard at /home.
 *
 * Requires an authenticated farmer session. Unauthenticated users are
 * redirected to /onboarding.
 */
export function FarmerHomePage() {
  const farmer = useAppStore((s) => s.farmer)
  const language = useAppStore((s) => s.language)
  const logout = useAppStore((s) => s.logout)
  const isAuthenticated = useAppStore((s) => s.isAuthenticated)
  const navigate = useNavigate()

  const [sellOpen, setSellOpen] = useState(false)

  // Auth guard
  useEffect(() => {
    if (!isAuthenticated || !farmer) {
      navigate('/onboarding', { replace: true })
    }
  }, [isAuthenticated, farmer, navigate])

  // Active pass query — refetch every 30s for "live" feel
  const {
    data: activePass,
    isLoading: passLoading,
  } = useQuery({
    queryKey: queueKeys.activePass(farmer?.id ?? ''),
    queryFn: () => queueService.getActivePass(farmer!.id),
    enabled: !!farmer,
    refetchInterval: 30_000,
    staleTime: 15_000,
  })

  // Nearby centres — used as context, displayed in QuickAction card
  useQuery({
    queryKey: ['centres', 'previews'],
    queryFn: () => centreService.listPreviews(),
    staleTime: 60_000,
  })

  function handleLogout() {
    logout()
    toast.success(language === 'hi' ? 'लॉग आउट हो गए' : 'Logged out successfully')
    navigate('/', { replace: true })
  }

  function handleWhatsApp() {
    toast.info(
      language === 'hi' ? 'कृषि मित्र जल्द आ रहा है!' : 'Krishi Mitra coming soon!',
      {
        description:
          language === 'hi'
            ? 'व्हाट्सएप असिस्टेंट अगले अपडेट में मिलेगा।'
            : 'WhatsApp assistant will be available in the next update.',
      },
    )
  }

  if (!farmer) return null

  return (
    <div className="home-page" id="main-content">
      {/* Skip link for keyboard users */}
      <a href="#quick-actions" className="skip-link">
        {language === 'hi' ? 'मुख्य कार्रवाई पर जाएं' : 'Skip to main actions'}
      </a>

      {/* Top navigation bar */}
      <header className="home-topbar" role="banner">
        <motion.div
          className="home-topbar__brand"
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
        >
          <span className="home-topbar__logo" aria-hidden="true">🌾</span>
          <span className="home-topbar__name">
            {language === 'hi' ? 'किसानक्यू' : 'KisanQueue'}
          </span>
        </motion.div>

        <div className="home-topbar__actions">
          <button
            className="home-topbar__icon-btn"
            onClick={() => toast.info(language === 'hi' ? 'सेटिंग्स जल्द आ रहा है' : 'Settings coming soon')}
            aria-label={language === 'hi' ? 'सेटिंग्स' : 'Settings'}
          >
            <Settings size={20} aria-hidden="true" />
          </button>
          <button
            className="home-topbar__icon-btn home-topbar__icon-btn--logout"
            onClick={handleLogout}
            aria-label={language === 'hi' ? 'लॉग आउट' : 'Log out'}
          >
            <LogOut size={20} aria-hidden="true" />
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="home-main" aria-label={language === 'hi' ? 'किसान डैशबोर्ड' : 'Farmer dashboard'}>
        {/* 1. Welcome banner */}
        <WelcomeBanner farmer={farmer} language={language} />

        {/* 2. Active pass card (if farmer has one) */}
        <ActivePassCard
          pass={activePass ?? null}
          isLoading={passLoading}
          language={language}
          onViewPass={(passId) => navigate(`/pass/${passId}`)}
        />

        {/* 3. Quick action grid */}
        <div id="quick-actions">
          <QuickActionGrid
            language={language}
            onSellCrop={() => setSellOpen(true)}
            onViewQueue={() => {
              if (activePass) {
                navigate(`/pass/${activePass.id}`)
              } else {
                toast.info(
                  language === 'hi' ? 'कोई सक्रिय पास नहीं' : 'No active pass',
                  {
                    description:
                      language === 'hi'
                        ? 'फसल बेचें और पास बनाएं।'
                        : 'Sell a crop to generate your pass.',
                  },
                )
              }
            }}
            onViewCentres={() => navigate('/centres')}
            onWhatsApp={handleWhatsApp}
            hasActivePass={!!activePass}
          />
        </div>

        {/* 4. Recent activity note */}
        <motion.section
          className="home-activity"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55, duration: 0.4 }}
          aria-label={language === 'hi' ? 'हाल की गतिविधि' : 'Recent activity'}
        >
          <h2 className="home-activity__title">
            {language === 'hi' ? 'हाल की जानकारी' : 'Recent Activity'}
          </h2>

          <div className="home-activity__tip">
            <span className="home-activity__tip-icon" aria-hidden="true">💡</span>
            <div>
              <p className="home-activity__tip-title">
                {language === 'hi' ? 'डेमो जानकारी' : 'Demo Info'}
              </p>
              <p className="home-activity__tip-desc">
                {language === 'hi'
                  ? 'रमेश कुमार के पास पहले से पास KQ-1047 है — कतार में 5वां स्थान, अनुमानित प्रतीक्षा 63 मिनट।'
                  : 'Ramesh Kumar already has pass KQ-1047 — position 5 in queue, ~63 min wait. Click "View QR Pass" to see it.'}
              </p>
            </div>
          </div>
        </motion.section>
      </main>

      {/* Sell Crop Modal */}
      <SellCropModal
        isOpen={sellOpen}
        onClose={() => setSellOpen(false)}
        language={language}
      />
    </div>
  )
}
