import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import {
  ArrowLeft,
  Clock,
  QrCode,
  Users,
  AlertTriangle,
  CheckCircle2,
  Share2,
  RefreshCw,
  Sliders,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  Radio,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAppStore } from '@/store/app-store'
import { useQueueLiveStore } from '@/store/queue-live-store'
import { queueService } from '@/services/api/queue-service'
import { realtimeService } from '@/services/api/realtime-service'
import { formatEta } from '@/lib/eta'
import { statusKey } from '@/lib/copy'

export function QueuePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const tokenQuery = searchParams.get('token') ?? '47'

  const language = useAppStore((s) => s.language)
  const setLanguage = useAppStore((s) => s.setLanguage)
  const farmer = useAppStore((s) => s.farmer)

  const { condition, entries, procurements, getFarmerPositionAndEta, setCondition, completeProcurement } =
    useQueueLiveStore()

  const [selectedToken, setSelectedToken] = useState<string>(tokenQuery)
  const [lastSyncSeconds, setLastSyncSeconds] = useState(0)
  const [isSimulating, setIsSimulating] = useState(false)
  const [activeBackendPass, setActiveBackendPass] = useState<any>(null)

  // Fetch active pass and live queue from backend
  const fetchLiveStatus = useCallback(async () => {
    try {
      const pass = await queueService.getMyActivePass()
      if (pass) {
        setActiveBackendPass(pass)
        const tokenDigits = pass.token.replace(/[^0-9]/g, '')
        if (tokenDigits) {
          setSelectedToken(tokenDigits)
        }
      }

      // Fetch queue entries for centre
      const centreId = pass?.centreId || 'centre-001'
      const qEntries = await queueService.getQueueEntries(centreId)
      if (qEntries && qEntries.length > 0) {
        const mapped = qEntries.map((qe) => ({
          id: qe.id,
          token: parseInt(qe.token.replace(/[^0-9]/g, ''), 10) || 1,
          farmerId: `farmer-${qe.id.slice(0, 4)}`,
          farmerName: `Farmer (${qe.token})`,
          crop: qe.crop as any,
          quantityQ: qe.quantityQ,
          status: qe.status as any,
          position: qe.position,
          joinedAt: 'Today',
        }))
        useQueueLiveStore.setState({ entries: mapped })
      }
    } catch (e) {
      console.warn('Backend live status fetch error, using local state:', e)
    }
  }, [])

  // Live timer for sync counter
  useEffect(() => {
    const timer = setInterval(() => {
      setLastSyncSeconds((prev) => (prev >= 60 ? 1 : prev + 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Connect WebSocket & fetch on mount
  useEffect(() => {
    fetchLiveStatus()

    realtimeService.connect()

    const unsubEta = realtimeService.subscribe('ETA_UPDATED', (data) => {
      setLastSyncSeconds(0)
      if (data.eta_minutes !== undefined) {
        fetchLiveStatus()
      }
    })

    const unsubPos = realtimeService.subscribe('QUEUE_POSITION_CHANGED', () => {
      setLastSyncSeconds(0)
      fetchLiveStatus()
    })

    const unsubStatus = realtimeService.subscribe('CENTRE_STATUS_CHANGED', (data) => {
      setLastSyncSeconds(0)
      if (data.status) {
        setCondition(data.status, data.capacity_factor, data.active_counters)
      }
    })

    const unsubCompleted = realtimeService.subscribe('PROCESSING_COMPLETED', () => {
      setLastSyncSeconds(0)
      fetchLiveStatus()
    })

    return () => {
      unsubEta()
      unsubPos()
      unsubStatus()
      unsubCompleted()
    }
  }, [fetchLiveStatus, setCondition])

  // Lookup target entry (uses active backend pass or defaults to Ramesh Token 47)
  const targetTokenNum = activeBackendPass
    ? (parseInt(activeBackendPass.token.replace(/[^0-9]/g, ''), 10) || 47)
    : (Number(selectedToken) || 47)
  const farmerData = getFarmerPositionAndEta(targetTokenNum)
  const activeEntry = entries.find((e) => e.token === targetTokenNum)
  const activePassId = activeBackendPass?.id || (farmer?.id === 'farmer-001' || targetTokenNum === 47 ? 'pass-kq-1047' : 'pass-kq-1047')
  const isCompleted = activeEntry?.status === 'COMPLETED' || activeBackendPass?.queueEntryStatus === 'COMPLETED'
  const procurementRecord = procurements[`rec-${targetTokenNum}`] || (isCompleted ? procurements['rec-farmer-001'] : null)

  function handleSimulateDelay() {
    setIsSimulating(true)
    if (condition.status === 'NORMAL') {
      setCondition('LIFTING_DELAYED', 0.6, 1, 'FCI truck delayed by ~2 hours — ETA adjusted')
      toast.warning(
        language === 'hi' ? 'उठान में देरी दर्ज की गई!' : 'Lifting Delay Reported!',
        {
          description:
            language === 'hi'
              ? 'मंडी अधिकारी ने 1 काउंटर और 60% क्षमता सेट की। प्रतीक्षा समय बढ़ गया है।'
              : 'Officer set 1 counter & 60% capacity. Wait time recalculated live without refresh.',
        },
      )
    } else {
      setCondition('NORMAL', 1.0, 2, 'Operations normal at all counters')
      toast.success(
        language === 'hi' ? 'मंडी स्थिति सामान्य हुई!' : 'Mandi Status Normal!',
        {
          description:
            language === 'hi'
              ? 'क्षमता 100% और 2 काउंटर सक्रिय। प्रतीक्षा समय घट गया है।'
              : 'Capacity 100% and 2 counters active. Wait time restored.',
        },
      )
    }
    setTimeout(() => setIsSimulating(false), 400)
  }

  function handleSimulateProgress() {
    // Complete the first non-completed entry ahead
    const nextWaiting = entries.find((e) => e.status === 'PROCESSING' || e.status === 'CHECKED_IN' || e.status === 'WAITING')
    if (nextWaiting) {
      completeProcurement(nextWaiting.token, 'A')
      toast.success(
        language === 'hi'
          ? `टोकन #${nextWaiting.token} की खरीद पूरी हुई!`
          : `Token #${nextWaiting.token} procurement completed!`,
        {
          description:
            language === 'hi'
              ? 'आपकी कतार में 1 स्थान आगे बढ़ गए हैं।'
              : 'Your position in the queue has moved forward.',
        },
      )
    } else {
      toast.info(language === 'hi' ? 'कतार में कोई अन्य किसान नहीं है' : 'No other farmers in queue')
    }
  }

  function handleShareWhatsApp() {
    const text =
      language === 'hi'
        ? `किसानक्यू लाइव स्थिति: टोकन KQ-1047, कतार क्रमांक #${farmerData.position ?? 'पूर्ण'}, अनुमानित समय ${formatEta(farmerData.etaMinutes, 'hi', '—')} राजगढ़ मंडी में।`
        : `KisanQueue Live Update: Token KQ-1047, Queue Position #${farmerData.position ?? 'Done'}, ETA ${formatEta(farmerData.etaMinutes, 'en', '—')} at Rajgarh Procurement Centre.`
    
    if (navigator.share) {
      navigator.share({ title: 'KisanQueue Live Status', text }).catch(() => {})
    } else {
      navigator.clipboard.writeText(text)
      toast.success(language === 'hi' ? 'लिंक और स्थिति कॉपी हो गई!' : 'Status copied to clipboard!')
    }
  }

  return (
    <div className="queue-page min-h-screen bg-[#1A3636] text-[#F9F6F0]">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 bg-[#1A3636]/95 backdrop-blur-md border-b border-[#40534C]/60 px-4 py-3 sm:px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate('/home')}
            className="flex items-center gap-2 text-[#D6BD98] hover:text-white transition-colors text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#D6BD98] rounded-md px-2 py-1"
            aria-label={language === 'hi' ? 'डैशबोर्ड पर वापस जाएं' : 'Back to dashboard'}
          >
            <ArrowLeft size={18} />
            <span>{language === 'hi' ? 'डैशबोर्ड' : 'Dashboard'}</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 bg-[#40534C]/80 text-[#D6BD98] border border-[#677D6A]/50 text-xs px-2.5 py-1 rounded-full font-mono">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>{language === 'hi' ? 'लाइव कतार' : 'Live Sync'}</span>
            </span>

            <button
              onClick={() => setLanguage(language === 'hi' ? 'en' : 'hi')}
              className="text-xs font-semibold px-2.5 py-1 rounded-full border border-[#677D6A]/60 bg-[#40534C]/40 text-[#D6BD98] hover:bg-[#40534C] transition-colors"
            >
              {language === 'hi' ? 'English' : 'हिंदी'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 sm:px-6 space-y-6">
        {/* Centre Operational Banner */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 sm:p-5 rounded-2xl border transition-all ${
            condition.status === 'LIFTING_DELAYED'
              ? 'bg-amber-950/40 border-amber-500/50 text-amber-200'
              : condition.status === 'PAUSED'
              ? 'bg-red-950/40 border-red-500/50 text-red-200'
              : 'bg-[#40534C]/40 border-[#677D6A]/40 text-[#D6BD98]'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider text-[#D6BD98]/80">
                  {language === 'hi' ? 'उपार्जन केंद्र' : 'Procurement Centre'}
                </span>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                    condition.status === 'NORMAL'
                      ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-500/40'
                      : condition.status === 'BUSY'
                      ? 'bg-amber-900/60 text-amber-300 border border-amber-500/40'
                      : condition.status === 'LIFTING_DELAYED'
                      ? 'bg-amber-900/80 text-amber-200 border border-amber-400/60 animate-pulse'
                      : 'bg-red-900/60 text-red-300 border border-red-500/40'
                  }`}
                >
                  {statusKey[condition.status] ? (language === 'hi' ? (condition.status === 'NORMAL' ? 'सामान्य' : condition.status === 'BUSY' ? 'व्यस्त' : condition.status === 'LIFTING_DELAYED' ? 'उठान में देरी' : 'कामकाज बंद') : condition.status) : condition.status}
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-bold text-white mt-1">
                {language === 'hi' ? 'राजगढ़ उपार्जन केंद्र' : 'Rajgarh Procurement Centre'}
              </h1>
            </div>

            <div className="flex items-center gap-3 text-xs sm:text-sm">
              <div className="bg-[#1A3636]/60 px-3 py-1.5 rounded-lg border border-[#677D6A]/30">
                <span className="text-white/60 block text-[10px] uppercase font-semibold">
                  {language === 'hi' ? 'सक्रिय काउंटर' : 'Active Counters'}
                </span>
                <span className="font-bold text-white text-base">{condition.activeCounters}</span>
              </div>
              <div className="bg-[#1A3636]/60 px-3 py-1.5 rounded-lg border border-[#677D6A]/30">
                <span className="text-white/60 block text-[10px] uppercase font-semibold">
                  {language === 'hi' ? 'क्षमता दर' : 'Capacity Factor'}
                </span>
                <span className="font-bold text-white text-base">
                  {Math.round(condition.capacityFactor * 100)}%
                </span>
              </div>
            </div>
          </div>

          {/* Alert Notice if Delay or Paused */}
          {condition.status === 'LIFTING_DELAYED' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-3 pt-3 border-t border-amber-500/30 flex items-start gap-2.5 text-xs sm:text-sm text-amber-200"
            >
              <AlertTriangle className="text-amber-400 shrink-0 mt-0.5" size={16} />
              <div>
                <strong className="font-semibold">
                  {language === 'hi' ? 'अधिकारी सूचना:' : 'Officer Notice:'}
                </strong>{' '}
                {condition.note || (language === 'hi' ? 'एफसीआई ट्रक में देरी। ईटीए समय बढ़ गया है।' : 'FCI truck delayed. ETA automatically adjusted.')}
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Farmer Live Queue Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="relative overflow-hidden bg-gradient-to-br from-[#40534C] to-[#1A3636] border-2 border-[#D6BD98]/60 rounded-3xl p-6 sm:p-8 shadow-2xl"
        >
          {/* Background watermark badge */}
          <div className="absolute right-4 -top-8 text-9xl font-black text-white/5 select-none pointer-events-none">
            {activeEntry ? activeEntry.token : '47'}
          </div>

          <div className="relative z-10 space-y-6">
            {/* Header info */}
            <div className="flex items-start justify-between">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D6BD98]/20 border border-[#D6BD98]/40 text-[#D6BD98] text-xs font-bold font-mono uppercase tracking-wider">
                  <ShieldCheck size={14} />
                  {language === 'hi' ? 'वैध डिजिटल टोकन' : 'Verified Digital Token'}
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-[#D6BD98] tracking-tight mt-2">
                  KQ-10{activeEntry ? activeEntry.token : '47'}
                </h2>
                <p className="text-sm text-white/80 mt-0.5">
                  {activeEntry ? activeEntry.farmerName : 'Ramesh Kumar'} ·{' '}
                  <span className="text-[#D6BD98] font-medium">
                    {activeEntry?.crop === 'soybean'
                      ? language === 'hi'
                        ? 'सोयाबीन'
                        : 'Soybean'
                      : language === 'hi'
                      ? 'गेहूं'
                      : 'Wheat'}
                  </span>{' '}
                  ({activeEntry ? activeEntry.quantityQ : 40.5} Q)
                </p>
              </div>

              <div className="text-right">
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    isCompleted
                      ? 'bg-emerald-500 text-white'
                      : activeEntry?.status === 'PROCESSING'
                      ? 'bg-blue-500 text-white animate-pulse'
                      : activeEntry?.status === 'CHECKED_IN'
                      ? 'bg-purple-500 text-white'
                      : 'bg-[#D6BD98] text-[#1A3636]'
                  }`}
                >
                  {isCompleted
                    ? language === 'hi'
                      ? 'खरीद पूर्ण'
                      : 'Completed'
                    : activeEntry?.status === 'PROCESSING'
                    ? language === 'hi'
                      ? 'काउंटर पर प्रसंस्करण'
                      : 'In Processing'
                    : activeEntry?.status === 'CHECKED_IN'
                    ? language === 'hi'
                      ? 'गेट पर उपस्थित'
                      : 'Checked In'
                    : language === 'hi'
                    ? 'कतार में'
                    : 'In Queue'}
                </span>
              </div>
            </div>

            {/* Main Counters Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {/* Position Card */}
              <div className="bg-[#1A3636]/70 border border-[#677D6A]/50 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white/70 uppercase tracking-wider">
                    {language === 'hi' ? 'कतार में स्थान' : 'Queue Position'}
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <AnimatePresence mode="popLayout">
                      <motion.span
                        key={farmerData.position ?? 'done'}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="text-4xl sm:text-5xl font-black text-white"
                      >
                        {farmerData.position !== null ? `#${farmerData.position}` : '✓'}
                      </motion.span>
                    </AnimatePresence>
                    {farmerData.position !== null && (
                      <span className="text-xs text-[#D6BD98]">
                        ({farmerData.waitingAheadCount}{' '}
                        {language === 'hi' ? 'किसान आगे' : 'ahead'})
                      </span>
                    )}
                  </div>
                </div>
                <div className="h-12 w-12 rounded-xl bg-[#40534C]/80 border border-[#677D6A]/60 flex items-center justify-center text-[#D6BD98]">
                  <Users size={24} />
                </div>
              </div>

              {/* Live ETA Card */}
              <div className="bg-[#1A3636]/70 border border-[#677D6A]/50 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white/70 uppercase tracking-wider">
                    {language === 'hi' ? 'अनुमानित प्रतीक्षा' : 'Estimated Wait'}
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <AnimatePresence mode="popLayout">
                      <motion.span
                        key={farmerData.etaMinutes ?? 'no-eta'}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className={`text-3xl sm:text-4xl font-extrabold ${
                          condition.status === 'LIFTING_DELAYED'
                            ? 'text-amber-400'
                            : 'text-[#D6BD98]'
                        }`}
                      >
                        {farmerData.etaMinutes !== null
                          ? formatEta(farmerData.etaMinutes, language, '—')
                          : isCompleted
                          ? language === 'hi'
                            ? 'पूर्ण'
                            : 'Done'
                          : language === 'hi'
                          ? 'रोका गया'
                          : 'Paused'}
                      </motion.span>
                    </AnimatePresence>
                  </div>
                  <span className="text-[11px] text-white/60 block mt-0.5">
                    {condition.status === 'LIFTING_DELAYED'
                      ? language === 'hi'
                        ? 'उठान में देरी के कारण समय बढ़ा'
                        : 'Lifting delay factored in'
                      : language === 'hi'
                      ? 'उच्च विश्वसनीयता अनुमान'
                      : 'High confidence dynamic estimate'}
                  </span>
                </div>
                <div
                  className={`h-12 w-12 rounded-xl border flex items-center justify-center ${
                    condition.status === 'LIFTING_DELAYED'
                      ? 'bg-amber-950/60 border-amber-500/50 text-amber-400'
                      : 'bg-[#40534C]/80 border-[#677D6A]/60 text-[#D6BD98]'
                  }`}
                >
                  <Clock size={24} />
                </div>
              </div>
            </div>

            {/* Stepper Progression */}
            <div className="pt-4 border-t border-[#677D6A]/30">
              <span className="text-xs font-bold text-white/70 uppercase tracking-wider block mb-3">
                {language === 'hi' ? 'खरीद प्रगति' : 'Procurement Journey'}
              </span>
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                {/* Step 1: Token */}
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold mb-1 shadow-lg shadow-emerald-900/50">
                    <CheckCircle2 size={16} />
                  </div>
                  <span className="font-semibold text-white text-[11px]">
                    {language === 'hi' ? 'पास जारी' : 'Pass Issued'}
                  </span>
                </div>

                {/* Step 2: Queue */}
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mb-1 ${
                      isCompleted || activeEntry?.status === 'CHECKED_IN' || activeEntry?.status === 'PROCESSING'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-[#D6BD98] text-[#1A3636] ring-4 ring-[#D6BD98]/30 animate-pulse'
                    }`}
                  >
                    2
                  </div>
                  <span className="font-semibold text-[#D6BD98] text-[11px]">
                    {language === 'hi' ? 'कतार में' : 'In Queue'}
                  </span>
                </div>

                {/* Step 3: Gate check-in */}
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mb-1 ${
                      isCompleted || activeEntry?.status === 'PROCESSING'
                        ? 'bg-emerald-500 text-white'
                        : activeEntry?.status === 'CHECKED_IN'
                        ? 'bg-purple-500 text-white ring-4 ring-purple-500/30'
                        : 'bg-[#40534C] text-white/60'
                    }`}
                  >
                    3
                  </div>
                  <span className="font-medium text-white/70 text-[11px]">
                    {language === 'hi' ? 'गेट सत्यापन' : 'Gate Check-in'}
                  </span>
                </div>

                {/* Step 4: Complete */}
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mb-1 ${
                      isCompleted ? 'bg-emerald-500 text-white' : 'bg-[#40534C] text-white/60'
                    }`}
                  >
                    4
                  </div>
                  <span className="font-medium text-white/70 text-[11px]">
                    {language === 'hi' ? 'रसीद व भुगतान' : 'Receipt & Payout'}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => navigate(`/pass/${activePassId}`)}
                className="flex-1 flex items-center justify-center gap-2 bg-[#D6BD98] hover:bg-[#c4ab85] text-[#1A3636] font-bold py-3 px-4 rounded-xl transition-all shadow-lg active:scale-[0.98]"
              >
                <QrCode size={18} />
                <span>{language === 'hi' ? 'डिजिटल क्यूआर पास देखें' : 'View Digital QR Pass'}</span>
              </button>

              {isCompleted && (
                <button
                  onClick={() => navigate(`/procurement/${procurementRecord?.id ?? 'rec-39'}`)}
                  className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg active:scale-[0.98]"
                >
                  <CheckCircle2 size={18} />
                  <span>{language === 'hi' ? 'खरीद रसीद देखें' : 'View Procurement Receipt'}</span>
                </button>
              )}

              <button
                onClick={handleShareWhatsApp}
                className="flex items-center justify-center gap-2 bg-[#40534C] hover:bg-[#4d635c] text-white font-semibold py-3 px-4 rounded-xl border border-[#677D6A]/50 transition-all active:scale-[0.98]"
                aria-label={language === 'hi' ? 'व्हाट्सएप पर साझा करें' : 'Share on WhatsApp'}
              >
                <Share2 size={18} />
                <span className="hidden sm:inline">{language === 'hi' ? 'साझा करें' : 'Share'}</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Live Simulation Controls for Evaluators & Demo */}
        <div className="bg-[#40534C]/30 border border-[#677D6A]/40 rounded-2xl p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sliders size={18} className="text-[#D6BD98]" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                {language === 'hi' ? 'लाइव डेमो सिमुलेटर' : 'Live Demo Controls (Realtime Proof)'}
              </h3>
            </div>
            <button
              onClick={() => navigate('/officer')}
              className="text-xs text-[#D6BD98] hover:underline flex items-center gap-1 font-medium"
            >
              <span>{language === 'hi' ? 'अधिकारी कंसोल' : 'Open Officer Console'}</span>
              <ExternalLink size={12} />
            </button>
          </div>

          <p className="text-xs text-white/70">
            {language === 'hi'
              ? 'बिना पेज रीफ्रेश किए रीयल-टाइम अपडेट का अनुभव करें। जब मंडी अधिकारी क्षमता बदलते हैं या किसान आगे बढ़ते हैं, तो स्क्रीन तुरंत बदल जाती है:'
              : 'Experience instant reactive recalculations without page refresh. Trigger officer actions below to see ETA and positions jump in real time:'}
          </p>

          <div className="flex flex-wrap gap-2.5 pt-1">
            <button
              disabled={isSimulating}
              onClick={handleSimulateDelay}
              className={`text-xs font-bold px-3 py-2 rounded-xl border transition-all active:scale-95 flex items-center gap-1.5 ${
                condition.status === 'LIFTING_DELAYED'
                  ? 'bg-emerald-800/60 border-emerald-500 text-emerald-200'
                  : 'bg-amber-900/60 border-amber-500 text-amber-200 hover:bg-amber-900'
              }`}
            >
              <Radio size={14} className="animate-pulse" />
              <span>
                {condition.status === 'LIFTING_DELAYED'
                  ? language === 'hi'
                    ? 'उठान ठीक करें (सामान्य 100%)'
                    : 'Clear Delay (Restore Normal)'
                  : language === 'hi'
                  ? 'उठान में देरी सिमुलेट करें (60% क्षमता)'
                  : 'Simulate Lifting Delay (60% capacity)'}
              </span>
            </button>

            <button
              onClick={handleSimulateProgress}
              className="text-xs font-bold px-3 py-2 rounded-xl bg-[#1A3636] border border-[#677D6A] text-[#D6BD98] hover:bg-[#234747] transition-all active:scale-95 flex items-center gap-1.5"
            >
              <CheckCircle2 size={14} />
              <span>
                {language === 'hi' ? 'आगे वाले किसान की खरीद पूरी करें' : 'Complete 1 Farmer Ahead'}
              </span>
            </button>
          </div>
        </div>

        {/* Live Mandi Queue List */}
        <section className="space-y-3" aria-label={language === 'hi' ? 'मंडी कतार सूची' : 'Mandi queue list'}>
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Users size={18} className="text-[#D6BD98]" />
              <span>{language === 'hi' ? 'आज की मंडी कतार' : "Today's Mandi Queue"}</span>
              <span className="text-xs font-normal text-white/60">
                ({entries.filter((e) => e.status !== 'COMPLETED').length} {language === 'hi' ? 'प्रतीक्षारत' : 'waiting'})
              </span>
            </h2>

            <div className="flex items-center gap-1.5 text-xs text-white/50">
              <RefreshCw size={12} className="animate-spin text-emerald-400" />
              <span>{lastSyncSeconds}s {language === 'hi' ? 'पहले' : 'ago'}</span>
            </div>
          </div>

          <div className="space-y-2">
            {entries.map((entry) => {
              const isUser = entry.token === targetTokenNum
              return (
                <motion.div
                  key={entry.id}
                  layout
                  transition={{ duration: 0.3 }}
                  className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${
                    isUser
                      ? 'bg-[#D6BD98]/15 border-[#D6BD98] shadow-md ring-1 ring-[#D6BD98]/40'
                      : entry.status === 'COMPLETED'
                      ? 'bg-[#1A3636]/40 border-[#40534C]/40 opacity-60'
                      : 'bg-[#40534C]/30 border-[#677D6A]/30 hover:border-[#677D6A]/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm font-mono ${
                        isUser
                          ? 'bg-[#D6BD98] text-[#1A3636]'
                          : entry.status === 'COMPLETED'
                          ? 'bg-emerald-950 border border-emerald-500/40 text-emerald-300'
                          : 'bg-[#1A3636] text-white border border-[#677D6A]/40'
                      }`}
                    >
                      #{entry.token}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-semibold ${isUser ? 'text-[#D6BD98]' : 'text-white'}`}>
                          {entry.farmerName}
                        </span>
                        {isUser && (
                          <span className="text-[10px] bg-[#D6BD98] text-[#1A3636] font-bold px-1.5 py-0.5 rounded">
                            {language === 'hi' ? 'आप' : 'YOU'}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-white/60">
                        {entry.crop === 'soybean' ? (language === 'hi' ? 'सोयाबीन' : 'Soybean') : (language === 'hi' ? 'गेहूं' : 'Wheat')} · {entry.quantityQ} Q · {entry.joinedAt}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        entry.status === 'COMPLETED'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                          : entry.status === 'PROCESSING'
                          ? 'bg-blue-950 text-blue-300 border border-blue-500/40 animate-pulse'
                          : entry.status === 'CHECKED_IN'
                          ? 'bg-purple-950 text-purple-300 border border-purple-500/40'
                          : 'bg-[#1A3636] text-white/70 border border-[#677D6A]/30'
                      }`}
                    >
                      {entry.status === 'COMPLETED'
                        ? language === 'hi'
                          ? 'पूर्ण'
                          : 'Done'
                        : entry.status === 'PROCESSING'
                        ? language === 'hi'
                          ? 'प्रसंस्करण'
                          : 'Processing'
                        : entry.status === 'CHECKED_IN'
                        ? language === 'hi'
                          ? 'उपस्थित'
                          : 'Checked In'
                        : language === 'hi'
                        ? 'प्रतीक्षा'
                        : 'Waiting'}
                    </span>

                    {entry.status === 'COMPLETED' && (
                      <button
                        onClick={() => navigate(`/procurement/rec-${entry.token}`)}
                        className="text-xs text-[#D6BD98] hover:text-white p-1"
                        aria-label="View receipt"
                      >
                        <ChevronRight size={16} />
                      </button>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </section>
      </main>
    </div>
  )
}
