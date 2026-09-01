import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import {
  ShieldCheck,
  LogOut,
  Sliders,
  QrCode,
  Users,
  CheckCircle2,
  AlertTriangle,
  Play,
  FileText,
  ExternalLink,
  Search,
  Scale,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { useQueueLiveStore } from '@/store/queue-live-store'
import { useAppStore } from '@/store/app-store'
import type { CentreStatus } from '@/types/centre'

export function OfficerDashboardPage() {
  const navigate = useNavigate()
  const language = useAppStore((s) => s.language)
  const setLanguage = useAppStore((s) => s.setLanguage)

  const {
    condition,
    entries,
    officerUser,
    logoutOfficer,
    setCondition,
    checkInEntry,
    startProcessingEntry,
    completeProcurement,
  } = useQueueLiveStore()

  const [activeTab, setActiveTab] = useState<'ALL' | 'WAITING' | 'CHECKED_IN' | 'PROCESSING' | 'COMPLETED'>('ALL')
  const [tokenInput, setTokenInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  // Procurement completion modal state
  const [completingEntry, setCompletingEntry] = useState<(typeof entries)[0] | null>(null)
  const [selectedGrade, setSelectedGrade] = useState<'A' | 'B' | 'C'>('A')
  const [actualWeight, setActualWeight] = useState<number>(40.5)

  // Quick statistics
  const waitingCount = entries.filter((e) => e.status === 'WAITING').length
  const checkedInCount = entries.filter((e) => e.status === 'CHECKED_IN').length
  const processingCount = entries.filter((e) => e.status === 'PROCESSING').length
  const completedCount = entries.filter((e) => e.status === 'COMPLETED').length

  function handleLogout() {
    logoutOfficer()
    toast.info(language === 'hi' ? 'अधिकारी सत्र समाप्त' : 'Officer session logged out')
    navigate('/officer', { replace: true })
  }

  function handleConditionSelect(status: CentreStatus) {
    if (status === 'NORMAL') {
      setCondition('NORMAL', 1.0, 2, 'Operations normal at all counters')
      toast.success(
        language === 'hi' ? 'स्थिति: सामान्य (100% क्षमता, 2 काउंटर)' : 'Condition: NORMAL (100% capacity, 2 counters)',
      )
    } else if (status === 'BUSY') {
      setCondition('BUSY', 0.8, 2, 'High arrival volume today')
      toast.warning(
        language === 'hi' ? 'स्थिति: व्यस्त (80% क्षमता, 2 काउंटर)' : 'Condition: BUSY (80% capacity, 2 counters)',
      )
    } else if (status === 'LIFTING_DELAYED') {
      setCondition('LIFTING_DELAYED', 0.6, 1, 'FCI truck delayed by ~2 hours')
      toast.error(
        language === 'hi'
          ? 'स्थिति: उठान में देरी (60% क्षमता, 1 काउंटर, ईटीए स्वतः बढ़ा)'
          : 'Condition: LIFTING DELAYED (60% capacity, 1 counter, all ETAs jumped)',
      )
    } else if (status === 'PAUSED') {
      setCondition('PAUSED', 0.0, 0, 'Centre operations temporarily paused')
      toast.error(
        language === 'hi' ? 'स्थिति: कामकाज बंद (प्रवेश रोका गया)' : 'Condition: PAUSED (Queue entries stopped)',
      )
    }
  }

  function handleGateCheckIn(e?: React.FormEvent) {
    if (e) e.preventDefault()
    const clean = tokenInput.replace(/[^0-9]/g, '')
    if (!clean) {
      toast.error(language === 'hi' ? 'कृपया टोकन संख्या दर्ज करें' : 'Please enter token number')
      return
    }

    const success = checkInEntry(clean)
    if (success) {
      toast.success(
        language === 'hi'
          ? `टोकन #${clean} का गेट चेक-इन सफल!`
          : `Token #${clean} Gate Check-in Successful!`,
      )
      setTokenInput('')
    } else {
      toast.error(
        language === 'hi' ? `टोकन #${clean} कतार में नहीं मिला` : `Token #${clean} not found in queue`,
      )
    }
  }

  function handleStartProcessing(token: number) {
    const success = startProcessingEntry(token)
    if (success) {
      toast.info(
        language === 'hi'
          ? `टोकन #${token} का काउंटर प्रसंस्करण शुरू हुआ`
          : `Token #${token} counter processing started`,
      )
    }
  }

  function handleOpenCompleteModal(entry: (typeof entries)[0]) {
    setCompletingEntry(entry)
    setActualWeight(entry.quantityQ)
    setSelectedGrade('A')
  }

  function handleFinalizeProcurement() {
    if (!completingEntry) return

    const record = completeProcurement(completingEntry.token, selectedGrade, actualWeight)
    if (record) {
      toast.success(
        language === 'hi'
          ? `टोकन #${completingEntry.token} की खरीद दर्ज हुई! भुगतान राशि: ₹${record.netAmount.toLocaleString('en-IN')}`
          : `Procurement recorded for Token #${completingEntry.token}! Payout: ₹${record.netAmount.toLocaleString('en-IN')}`,
      )
      setCompletingEntry(null)
      navigate(`/procurement/${record.id}`)
    }
  }

  // Filter entries
  const filteredEntries = entries.filter((e) => {
    if (activeTab !== 'ALL' && e.status !== activeTab) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      return (
        e.farmerName.toLowerCase().includes(q) ||
        String(e.token).includes(q) ||
        `kq-10${e.token}`.includes(q) ||
        e.crop.toLowerCase().includes(q)
      )
    }
    return true
  })

  return (
    <div className="min-h-screen bg-[#1A3636] text-[#F9F6F0] flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-[#1A3636]/95 backdrop-blur-md border-b border-[#40534C] px-4 py-3 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#D6BD98]/20 border border-[#D6BD98]/40 flex items-center justify-center text-[#D6BD98]">
              <ShieldCheck size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-white leading-tight">
                  {language === 'hi' ? 'राजगढ़ उपार्जन केंद्र' : 'Rajgarh Procurement Centre'}
                </h1>
                <span className="text-[11px] bg-emerald-900/60 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-mono">
                  LIVE CONSOLE
                </span>
              </div>
              <p className="text-xs text-[#D6BD98]">
                {officerUser?.name || 'Officer Suresh Patel'} · Mandi Incharge
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => navigate('/queue')}
              className="hidden sm:flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#40534C] text-[#D6BD98] hover:bg-[#4d635c] transition-colors border border-[#677D6A]/40"
            >
              <span>{language === 'hi' ? 'किसान लाइव दृश्य' : 'Farmer Live View'}</span>
              <ExternalLink size={13} />
            </button>

            <button
              onClick={() => setLanguage(language === 'hi' ? 'en' : 'hi')}
              className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-[#677D6A]/60 bg-[#40534C]/40 text-[#D6BD98]"
            >
              {language === 'hi' ? 'English' : 'हिंदी'}
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-950/60 border border-red-500/40 text-red-300 hover:bg-red-900/60 transition-colors"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">{language === 'hi' ? 'लॉग आउट' : 'Logout'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 sm:px-6 space-y-6">
        {/* Metric Cards Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-[#40534C]/40 border border-[#677D6A]/40 rounded-2xl p-4">
            <div className="flex items-center justify-between text-white/70 mb-1">
              <span className="text-xs font-semibold uppercase">{language === 'hi' ? 'प्रतीक्षारत' : 'Waiting'}</span>
              <Users size={16} className="text-[#D6BD98]" />
            </div>
            <span className="text-3xl font-black text-white">{waitingCount}</span>
          </div>

          <div className="bg-[#40534C]/40 border border-[#677D6A]/40 rounded-2xl p-4">
            <div className="flex items-center justify-between text-white/70 mb-1">
              <span className="text-xs font-semibold uppercase">{language === 'hi' ? 'गेट चेक-इन' : 'Checked In'}</span>
              <QrCode size={16} className="text-purple-400" />
            </div>
            <span className="text-3xl font-black text-purple-300">{checkedInCount}</span>
          </div>

          <div className="bg-[#40534C]/40 border border-[#677D6A]/40 rounded-2xl p-4">
            <div className="flex items-center justify-between text-white/70 mb-1">
              <span className="text-xs font-semibold uppercase">{language === 'hi' ? 'प्रसंस्करण में' : 'Processing'}</span>
              <Scale size={16} className="text-blue-400" />
            </div>
            <span className="text-3xl font-black text-blue-300">{processingCount}</span>
          </div>

          <div className="bg-[#40534C]/40 border border-[#677D6A]/40 rounded-2xl p-4">
            <div className="flex items-center justify-between text-white/70 mb-1">
              <span className="text-xs font-semibold uppercase">{language === 'hi' ? 'आज पूर्ण' : 'Completed'}</span>
              <CheckCircle2 size={16} className="text-emerald-400" />
            </div>
            <span className="text-3xl font-black text-emerald-300">{completedCount}</span>
          </div>
        </div>

        {/* 2-Tap Operational Condition Selector (CORE FEATURE) */}
        <section className="bg-gradient-to-br from-[#40534C]/60 to-[#1A3636] border-2 border-[#D6BD98]/50 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <Sliders className="text-[#D6BD98]" size={20} />
                <h2 className="text-lg font-bold text-white">
                  {language === 'hi' ? '2-टैप मंडी स्थिति एवं क्षमता नियंत्रण' : '2-Tap Operational Condition & Capacity Engine'}
                </h2>
              </div>
              <p className="text-xs text-white/70 mt-0.5">
                {language === 'hi'
                  ? 'एक टैप में स्थिति बदलें। सभी प्रतीक्षा कर रहे किसानों का ईटीए 2 सेकंड में स्वतः अपडेट हो जाता है।'
                  : 'Change condition in one tap. Background engine recalculates all waiting ETAs within < 2 seconds.'}
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-white/60">{language === 'hi' ? 'वर्तमान स्थिति:' : 'Active Condition:'}</span>
              <span className="font-bold text-[#D6BD98] px-2.5 py-1 rounded-md bg-[#1A3636] border border-[#677D6A]/50">
                {condition.status} ({Math.round(condition.capacityFactor * 100)}% · {condition.activeCounters} {language === 'hi' ? 'काउंटर' : 'counters'})
              </span>
            </div>
          </div>

          {/* 4 Large Condition Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            {/* NORMAL */}
            <button
              type="button"
              onClick={() => handleConditionSelect('NORMAL')}
              className={`p-4 rounded-2xl border text-left transition-all active:scale-[0.98] ${
                condition.status === 'NORMAL'
                  ? 'bg-emerald-950/80 border-emerald-400 ring-2 ring-emerald-400/40 shadow-lg shadow-emerald-950/50'
                  : 'bg-[#1A3636]/60 border-[#677D6A]/40 hover:border-emerald-500/60'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  {language === 'hi' ? 'सामान्य' : 'NORMAL'}
                </span>
                <span className="text-xs font-mono font-bold bg-emerald-900/60 text-emerald-200 px-2 py-0.5 rounded">
                  100%
                </span>
              </div>
              <h3 className="font-bold text-white text-sm">
                {language === 'hi' ? 'सामान्य संचालन' : 'Operating Normally'}
              </h3>
              <p className="text-[11px] text-white/60 mt-1">
                {language === 'hi' ? '2 काउंटर सक्रिय · निर्बाध उठान' : '2 active counters · Uninterrupted lifting'}
              </p>
            </button>

            {/* BUSY */}
            <button
              type="button"
              onClick={() => handleConditionSelect('BUSY')}
              className={`p-4 rounded-2xl border text-left transition-all active:scale-[0.98] ${
                condition.status === 'BUSY'
                  ? 'bg-amber-950/80 border-amber-400 ring-2 ring-amber-400/40 shadow-lg shadow-amber-950/50'
                  : 'bg-[#1A3636]/60 border-[#677D6A]/40 hover:border-amber-500/60'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  {language === 'hi' ? 'व्यस्त' : 'BUSY'}
                </span>
                <span className="text-xs font-mono font-bold bg-amber-900/60 text-amber-200 px-2 py-0.5 rounded">
                  80%
                </span>
              </div>
              <h3 className="font-bold text-white text-sm">
                {language === 'hi' ? 'भारी आवक' : 'High Volume'}
              </h3>
              <p className="text-[11px] text-white/60 mt-1">
                {language === 'hi' ? '2 काउंटर · मामूली भीड़' : '2 counters · High queue arrival'}
              </p>
            </button>

            {/* LIFTING DELAYED (DEMO STAR MOMENT) */}
            <button
              type="button"
              onClick={() => handleConditionSelect('LIFTING_DELAYED')}
              className={`p-4 rounded-2xl border text-left transition-all active:scale-[0.98] ${
                condition.status === 'LIFTING_DELAYED'
                  ? 'bg-amber-950/90 border-amber-300 ring-2 ring-amber-400 shadow-xl shadow-amber-950/70 animate-pulse'
                  : 'bg-[#1A3636]/60 border-[#677D6A]/40 hover:border-amber-400'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1">
                  <AlertTriangle size={12} />
                  {language === 'hi' ? 'उठान में देरी' : 'LIFTING DELAY'}
                </span>
                <span className="text-xs font-mono font-bold bg-amber-900 text-amber-100 px-2 py-0.5 rounded">
                  60%
                </span>
              </div>
              <h3 className="font-bold text-white text-sm">
                {language === 'hi' ? 'एफसीआई ट्रक में देरी' : 'FCI Truck Delayed'}
              </h3>
              <p className="text-[11px] text-white/70 mt-1">
                {language === 'hi' ? '1 काउंटर · ईटीए 63m से 209m बढ़ा' : '1 counter · ETA jumps 63m → 209m'}
              </p>
            </button>

            {/* PAUSED */}
            <button
              type="button"
              onClick={() => handleConditionSelect('PAUSED')}
              className={`p-4 rounded-2xl border text-left transition-all active:scale-[0.98] ${
                condition.status === 'PAUSED'
                  ? 'bg-red-950/90 border-red-400 ring-2 ring-red-400/40 shadow-lg shadow-red-950/50'
                  : 'bg-[#1A3636]/60 border-[#677D6A]/40 hover:border-red-500/60'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-red-400 uppercase tracking-wider">
                  {language === 'hi' ? 'कार्य बंद' : 'PAUSED'}
                </span>
                <span className="text-xs font-mono font-bold bg-red-900/60 text-red-200 px-2 py-0.5 rounded">
                  0%
                </span>
              </div>
              <h3 className="font-bold text-white text-sm">
                {language === 'hi' ? 'अस्थायी रूप से बंद' : 'Operations Paused'}
              </h3>
              <p className="text-[11px] text-white/60 mt-1">
                {language === 'hi' ? '0 काउंटर · कतार प्रवेश बंद' : '0 counters · Block new queue entries'}
              </p>
            </button>
          </div>
        </section>

        {/* Gate Scanner & Quick Check-in Bar */}
        <div className="bg-[#40534C]/40 border border-[#677D6A]/50 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="w-10 h-10 rounded-xl bg-[#D6BD98]/20 border border-[#D6BD98]/40 flex items-center justify-center text-[#D6BD98] shrink-0">
              <QrCode size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {language === 'hi' ? 'गेट चेक-इन स्कैनर' : 'Gate Check-in Scanner'}
              </h3>
              <p className="text-xs text-white/60">
                {language === 'hi' ? 'आगमन पर क्यूआर टोकन स्कैन करें या नंबर डालें' : 'Scan QR pass or enter token number on arrival'}
              </p>
            </div>
          </div>

          <form onSubmit={handleGateCheckIn} className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-48">
              <input
                type="text"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="Token # e.g. 47"
                className="w-full bg-[#1A3636] border border-[#677D6A]/60 rounded-xl py-2 px-3 text-white text-sm font-mono placeholder:text-white/30 focus:outline-none focus:border-[#D6BD98]"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                setTokenInput('47')
                toast.info(language === 'hi' ? 'रमेश कुमार टोकन 47 भरा गया' : 'Ramesh Kumar Token 47 filled')
              }}
              className="text-xs px-2.5 py-2 rounded-xl bg-[#1A3636] border border-[#677D6A] text-[#D6BD98] hover:bg-[#234747] font-bold"
            >
              {language === 'hi' ? 'रमेश (47)' : 'Ramesh (47)'}
            </button>
            <button
              type="submit"
              className="bg-[#D6BD98] hover:bg-[#c4ab85] text-[#1A3636] font-bold text-xs px-4 py-2 rounded-xl transition-all shadow active:scale-95 whitespace-nowrap"
            >
              {language === 'hi' ? 'चेक-इन करें' : 'Check In'}
            </button>
          </form>
        </div>

        {/* Live Queue Management Table */}
        <section className="bg-[#40534C]/30 border border-[#677D6A]/40 rounded-3xl p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Users size={20} className="text-[#D6BD98]" />
              <h2 className="text-base font-bold text-white">
                {language === 'hi' ? 'आज की उपार्जन कतार प्रबंधन' : "Today's Mandi Queue Management"}
              </h2>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={language === 'hi' ? 'किसान या टोकन खोजें...' : 'Search farmer or token...'}
                className="w-full bg-[#1A3636] border border-[#677D6A]/60 rounded-xl py-1.5 pl-9 pr-3 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[#D6BD98]"
              />
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1 text-xs">
            {(['ALL', 'WAITING', 'CHECKED_IN', 'PROCESSING', 'COMPLETED'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-colors ${
                  activeTab === tab
                    ? 'bg-[#D6BD98] text-[#1A3636]'
                    : 'bg-[#1A3636]/60 text-white/70 hover:text-white border border-[#677D6A]/40'
                }`}
              >
                {tab === 'ALL'
                  ? language === 'hi'
                    ? 'सभी'
                    : 'All'
                  : tab === 'WAITING'
                  ? language === 'hi'
                    ? 'प्रतीक्षा'
                    : 'Waiting'
                  : tab === 'CHECKED_IN'
                  ? language === 'hi'
                    ? 'गेट चेक-इन'
                    : 'Checked In'
                  : tab === 'PROCESSING'
                  ? language === 'hi'
                    ? 'प्रसंस्करण'
                    : 'Processing'
                  : language === 'hi'
                  ? 'पूर्ण'
                  : 'Completed'}
              </button>
            ))}
          </div>

          {/* Entries Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#677D6A]/40 text-white/60">
                  <th className="py-2.5 px-3 font-semibold">{language === 'hi' ? 'टोकन' : 'Token'}</th>
                  <th className="py-2.5 px-3 font-semibold">{language === 'hi' ? 'किसान नाम' : 'Farmer Name'}</th>
                  <th className="py-2.5 px-3 font-semibold">{language === 'hi' ? 'फसल व मात्रा' : 'Crop & Qty'}</th>
                  <th className="py-2.5 px-3 font-semibold">{language === 'hi' ? 'आगमन समय' : 'Joined At'}</th>
                  <th className="py-2.5 px-3 font-semibold">{language === 'hi' ? 'स्थिति' : 'Status'}</th>
                  <th className="py-2.5 px-3 font-semibold text-right">{language === 'hi' ? 'कार्रवाई' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#677D6A]/20">
                {filteredEntries.map((entry) => {
                  const isRamesh = entry.token === 47
                  return (
                    <tr
                      key={entry.id}
                      className={`hover:bg-[#40534C]/40 transition-colors ${
                        isRamesh ? 'bg-[#D6BD98]/10' : ''
                      }`}
                    >
                      <td className="py-3 px-3 font-mono font-bold text-white">
                        <span className={`px-2 py-1 rounded-md ${isRamesh ? 'bg-[#D6BD98] text-[#1A3636]' : 'bg-[#1A3636]'}`}>
                          #{entry.token}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-white">{entry.farmerName}</span>
                          {isRamesh && (
                            <span className="text-[10px] bg-[#D6BD98] text-[#1A3636] font-bold px-1.5 py-0.2 rounded">
                              DEMO
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-white/50">{entry.farmerId}</span>
                      </td>

                      <td className="py-3 px-3">
                        <span className="text-white font-medium">
                          {entry.crop === 'soybean' ? 'Soybean' : 'Wheat'}
                        </span>
                        <span className="text-white/60 block">{entry.quantityQ} Quintals</span>
                      </td>

                      <td className="py-3 px-3 text-white/70">{entry.joinedAt}</td>

                      <td className="py-3 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            entry.status === 'COMPLETED'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                              : entry.status === 'PROCESSING'
                              ? 'bg-blue-950 text-blue-300 border border-blue-500/40 animate-pulse'
                              : entry.status === 'CHECKED_IN'
                              ? 'bg-purple-950 text-purple-300 border border-purple-500/40'
                              : 'bg-[#1A3636] text-white/70 border border-[#677D6A]/30'
                          }`}
                        >
                          {entry.status}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right">
                        {entry.status === 'WAITING' && (
                          <button
                            onClick={() => checkInEntry(entry.token)}
                            className="text-xs bg-[#D6BD98] text-[#1A3636] font-bold px-3 py-1 rounded-lg hover:bg-[#c4ab85] transition-all active:scale-95"
                          >
                            {language === 'hi' ? 'चेक-इन' : 'Check In'}
                          </button>
                        )}

                        {entry.status === 'CHECKED_IN' && (
                          <button
                            onClick={() => handleStartProcessing(entry.token)}
                            className="text-xs bg-blue-600 text-white font-bold px-3 py-1 rounded-lg hover:bg-blue-500 transition-all active:scale-95 flex items-center gap-1 ml-auto"
                          >
                            <Play size={12} />
                            <span>{language === 'hi' ? 'प्रसंस्करण शुरू' : 'Start Weighing'}</span>
                          </button>
                        )}

                        {entry.status === 'PROCESSING' && (
                          <button
                            onClick={() => handleOpenCompleteModal(entry)}
                            className="text-xs bg-emerald-600 text-white font-bold px-3 py-1 rounded-lg hover:bg-emerald-500 transition-all active:scale-95 flex items-center gap-1 ml-auto shadow-md"
                          >
                            <CheckCircle2 size={12} />
                            <span>{language === 'hi' ? 'खरीद पूर्ण व रसीद' : 'Complete & Issue'}</span>
                          </button>
                        )}

                        {entry.status === 'COMPLETED' && (
                          <button
                            onClick={() => navigate(`/procurement/rec-${entry.token}`)}
                            className="text-xs bg-[#1A3636] text-[#D6BD98] border border-[#677D6A]/50 px-2.5 py-1 rounded-lg hover:bg-[#234747] transition-all flex items-center gap-1 ml-auto"
                          >
                            <FileText size={12} />
                            <span>{language === 'hi' ? 'रसीद' : 'Receipt'}</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* Complete Weighing & Grading Modal */}
      <AnimatePresence>
        {completingEntry && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#1A3636] border border-[#D6BD98] rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between border-b border-[#40534C] pb-3">
                <div className="flex items-center gap-2">
                  <Scale className="text-[#D6BD98]" size={22} />
                  <h3 className="text-base font-bold text-white">
                    {language === 'hi' ? 'तौल व गुणवत्ता ग्रेडिंग सत्यापन' : 'Weighbridge & Quality Grading'}
                  </h3>
                </div>
                <button
                  onClick={() => setCompletingEntry(null)}
                  className="text-white/60 hover:text-white p-1"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="bg-[#40534C]/40 p-3.5 rounded-2xl border border-[#677D6A]/40 space-y-1">
                <span className="text-xs text-[#D6BD98] font-bold">
                  Token #{completingEntry.token} · {completingEntry.farmerName}
                </span>
                <p className="text-xs text-white/70">
                  Crop: {completingEntry.crop.toUpperCase()} · Declared Qty: {completingEntry.quantityQ} Q
                </p>
              </div>

              {/* Actual Weight Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-white/80 block">
                  {language === 'hi' ? 'वास्तविक वजन (क्विंटल में)' : 'Actual Net Weight (Quintals)'}
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={actualWeight}
                  onChange={(e) => setActualWeight(Number(e.target.value))}
                  className="w-full bg-[#40534C]/30 border border-[#677D6A] rounded-xl py-2 px-3 text-white text-sm font-mono focus:outline-none focus:border-[#D6BD98]"
                />
              </div>

              {/* Crop Grade Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-white/80 block">
                  {language === 'hi' ? 'गुणवत्ता ग्रेड (FSSAI/FCI मानक)' : 'Quality Grade (FSSAI/FCI Standards)'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['A', 'B', 'C'] as const).map((grade) => (
                    <button
                      key={grade}
                      type="button"
                      onClick={() => setSelectedGrade(grade)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                        selectedGrade === grade
                          ? 'bg-[#D6BD98] text-[#1A3636] border-[#D6BD98]'
                          : 'bg-[#40534C]/30 border-[#677D6A]/40 text-white hover:border-[#677D6A]'
                      }`}
                    >
                      Grade {grade}
                    </button>
                  ))}
                </div>
              </div>

              {/* MSP Calculation Summary */}
              <div className="bg-[#1A3636] border border-[#677D6A]/60 rounded-xl p-3 flex items-center justify-between text-xs">
                <div>
                  <span className="text-white/60 block">{language === 'hi' ? 'एमएसपी दर:' : 'MSP Rate:'}</span>
                  <span className="font-bold text-white">
                    ₹{completingEntry.crop === 'soybean' ? '4,600' : '2,275'} / Q
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-white/60 block">{language === 'hi' ? 'कुल भुगतान राशि:' : 'Total Payout:'}</span>
                  <span className="font-extrabold text-[#D6BD98] text-base">
                    ₹{Math.round(actualWeight * (completingEntry.crop === 'soybean' ? 4600 : 2275)).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCompletingEntry(null)}
                  className="flex-1 py-2.5 rounded-xl border border-[#677D6A]/50 text-xs font-semibold text-white/80 hover:bg-[#40534C]"
                >
                  {language === 'hi' ? 'रद्द करें' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={handleFinalizeProcurement}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg active:scale-95"
                >
                  {language === 'hi' ? 'खरीद दर्ज करें व रसीद बनाएं' : 'Record & Issue Receipt'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
