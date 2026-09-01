import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'motion/react'
import { ArrowLeft, Share2, Download } from 'lucide-react'
import { toast } from 'sonner'
import { useAppStore } from '@/store/app-store'
import { queueService } from '@/services/api/queue-service'
import { queueKeys } from '@/lib/queue-keys'
import { QRPassCard } from '@/components/pass/QRPassCard'

/**
 * PassPage — Digital procurement pass display at /pass/:id
 *
 * Shows the QR code, token number, queue position, and ETA.
 * Works with offline-cached data (show screenshot hint).
 */
export function PassPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const language = useAppStore((s) => s.language)
  const farmer = useAppStore((s) => s.farmer)
  const isHi = language === 'hi'

  const {
    data: pass,
    isLoading,
    isError,
  } = useQuery({
    queryKey: queueKeys.passById(id ?? ''),
    queryFn: () => queueService.getPassById(id ?? ''),
    enabled: !!id,
    refetchInterval: 30_000,
    staleTime: 15_000,
  })

  function handleShare() {
    const text = isHi
      ? `मेरा KisanQueue पास: ${pass?.token} — ${pass?.centreName}`
      : `My KisanQueue pass: ${pass?.token} — ${pass?.centreName}`

    if (navigator.share) {
      navigator.share({ title: 'KisanQueue Pass', text }).catch(() => {})
    } else {
      navigator.clipboard.writeText(text)
      toast.success(isHi ? 'पास की जानकारी कॉपी हो गई!' : 'Pass info copied to clipboard!')
    }
  }

  function handleDownload() {
    toast.info(isHi ? 'स्क्रीनशॉट लें' : 'Take a screenshot to save offline', {
      description: isHi
        ? 'यह पास ऑफलाइन भी काम करता है।'
        : 'This QR pass works even without internet.',
    })
  }

  return (
    <div className="pass-page" id="main-content">
      {/* Navigation header */}
      <header className="pass-page__header" role="banner">
        <motion.button
          whileTap={{ scale: 0.95 }}
          className="pass-page__back"
          onClick={() => navigate('/home')}
          aria-label={isHi ? 'होम पर वापस जाएं' : 'Back to home'}
        >
          <ArrowLeft size={20} aria-hidden="true" />
          <span>{isHi ? 'डैशबोर्ड' : 'Dashboard'}</span>
        </motion.button>

        <h1 className="pass-page__title">
          {isHi ? 'डिजिटल पास' : 'Digital Pass'}
        </h1>

        <div className="pass-page__actions">
          <button
            className="pass-page__action-btn"
            onClick={handleShare}
            aria-label={isHi ? 'पास शेयर करें' : 'Share pass'}
            disabled={!pass}
          >
            <Share2 size={20} aria-hidden="true" />
          </button>
          <button
            className="pass-page__action-btn"
            onClick={handleDownload}
            aria-label={isHi ? 'पास सेव करें' : 'Save pass offline'}
            disabled={!pass}
          >
            <Download size={20} aria-hidden="true" />
          </button>
        </div>
      </header>

      <main className="pass-page__main" aria-label={isHi ? 'डिजिटल पास' : 'Digital pass'}>
        <AnimatePresence mode="wait">
          {isLoading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="pass-page__state"
              aria-busy="true"
              aria-live="polite"
            >
              <motion.div
                className="pass-page__spinner"
                animate={{ rotate: 360 }}
                transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
                aria-hidden="true"
              />
              <p className="pass-page__state-text">
                {isHi ? 'पास लोड हो रहा है...' : 'Loading your pass...'}
              </p>
            </motion.div>
          )}

          {isError && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="pass-page__state pass-page__state--error"
              role="alert"
            >
              <p className="pass-page__state-text">
                {isHi ? 'पास नहीं मिला।' : 'Pass not found.'}
              </p>
              <motion.button
                whileTap={{ scale: 0.97 }}
                className="pass-page__retry-btn"
                onClick={() => navigate('/home')}
              >
                {isHi ? 'होम पर जाएं' : 'Go to Home'}
              </motion.button>
            </motion.div>
          )}

          {pass && (
            <motion.div
              key="pass"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <QRPassCard pass={pass} language={language} />

              {/* Farmer name affirmation below card */}
              <motion.p
                className="pass-page__farmer-name"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                {farmer
                  ? isHi
                    ? `${farmer.hindiName} का पास`
                    : `${farmer.name}'s pass`
                  : ''}
              </motion.p>

              {/* Instructions */}
              <motion.section
                className="pass-page__instructions"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                aria-label={isHi ? 'निर्देश' : 'Instructions'}
              >
                <h2 className="pass-page__instructions-title">
                  {isHi ? 'मंडी पर क्या करें?' : 'What to do at the mandi?'}
                </h2>
                <ol className="pass-page__steps-list">
                  <li>{isHi ? 'गेट पर यह QR दिखाएं' : 'Show this QR at the gate'}</li>
                  <li>{isHi ? 'अधिकारी स्कैन करेगा' : 'Officer will scan and check you in'}</li>
                  <li>{isHi ? 'अपनी बारी का इंतजार करें' : 'Wait for your turn at the counter'}</li>
                  <li>{isHi ? 'तौल और ग्रेडिंग होगी' : 'Weighing and grading will happen'}</li>
                  <li>{isHi ? 'DBT से सीधे बैंक में पैसा' : 'Payment via DBT directly to your bank'}</li>
                </ol>
              </motion.section>

              {/* Cancel Button */}
              {pass.queueEntryStatus === 'WAITING' && (
                <div style={{ padding: '1.5rem 0', textAlign: 'center' }}>
                  <button
                    onClick={async () => {
                      if (window.confirm(isHi ? 'क्या आप वाकई इस पास को रद्द करना चाहते हैं?' : 'Are you sure you want to cancel this pass?')) {
                        try {
                          await queueService.cancelPass(pass.id)
                          toast.success(isHi ? 'पास सफलतापूर्वक रद्द कर दिया गया' : 'Pass cancelled successfully')
                          navigate('/home')
                        } catch (err: any) {
                          toast.error(isHi ? 'पास रद्द करने में असमर्थ' : 'Failed to cancel pass', {
                            description: err?.message || 'Please try again.',
                          })
                        }
                      }
                    }}
                    style={{
                      background: 'rgba(239, 68, 68, 0.15)',
                      border: '1px solid rgba(239, 68, 68, 0.4)',
                      color: '#fca5a5',
                      padding: '0.6rem 1.2rem',
                      borderRadius: '0.75rem',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {isHi ? '✕ पास रद्द करें' : '✕ Cancel Pass'}
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}
