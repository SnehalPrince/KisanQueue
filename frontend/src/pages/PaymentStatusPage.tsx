import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'motion/react'
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Building2,
  Share2,
  Info,
} from 'lucide-react'
import { toast } from 'sonner'
import { useQueueLiveStore } from '@/store/queue-live-store'
import { useAppStore } from '@/store/app-store'

export function PaymentStatusPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const language = useAppStore((s) => s.language)

  const { procurements } = useQueueLiveStore()

  const receiptId = id ?? 'rec-39'
  const record =
    procurements[receiptId] ||
    procurements['rec-39'] ||
    Object.values(procurements)[0]

  if (!record) {
    return (
      <div className="min-h-screen bg-[#1A3636] text-[#F9F6F0] flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <p className="text-lg font-bold text-white">
            {language === 'hi' ? 'भुगतान विवरण नहीं मिला' : 'Payment Details Not Found'}
          </p>
          <button
            onClick={() => navigate('/home')}
            className="px-4 py-2 bg-[#D6BD98] text-[#1A3636] font-bold rounded-xl text-sm"
          >
            {language === 'hi' ? 'डैशबोर्ड पर जाएं' : 'Go to Dashboard'}
          </button>
        </div>
      </div>
    )
  }

  const isPaid = record.paymentStatus === 'PAID'
  const isProcessing = record.paymentStatus === 'PROCESSING'

  function handleShare() {
    const text =
      language === 'hi'
        ? `किसानक्यू डीबीटी स्थिति: रसीद #${record.receiptNumber}, राशि: ₹${record.netAmount.toLocaleString('en-IN')}, स्थिति: ${record.paymentStatus}, बैंक: ${record.bankName} (${record.accountMask})`
        : `KisanQueue DBT Status: Receipt #${record.receiptNumber}, Amount: ₹${record.netAmount.toLocaleString('en-IN')}, Status: ${record.paymentStatus}, Bank: ${record.bankName} (${record.accountMask})`

    if (navigator.share) {
      navigator.share({ title: 'DBT Payment Status', text }).catch(() => {})
    } else {
      navigator.clipboard.writeText(text)
      toast.success(language === 'hi' ? 'भुगतान विवरण कॉपी किया गया!' : 'Status copied!')
    }
  }

  return (
    <div className="min-h-screen bg-[#1A3636] text-[#F9F6F0] flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-[#1A3636]/95 backdrop-blur-md border-b border-[#40534C] px-4 py-3 sm:px-6">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate(`/procurement/${record.id}`)}
            className="flex items-center gap-2 text-[#D6BD98] hover:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#D6BD98] rounded-md px-2 py-1"
          >
            <ArrowLeft size={18} />
            <span>{language === 'hi' ? 'खरीद रसीद' : 'Procurement Receipt'}</span>
          </button>

          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#40534C] text-[#D6BD98] hover:bg-[#4d635c] transition-colors border border-[#677D6A]/40"
          >
            <Share2 size={14} />
            <span>{language === 'hi' ? 'साझा करें' : 'Share'}</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-6 sm:px-6 space-y-6">
        {/* Hero Payment Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
          className="bg-gradient-to-br from-[#40534C] to-[#1A3636] border-2 border-[#D6BD98]/60 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold font-mono uppercase tracking-wider text-[#D6BD98] flex items-center gap-1.5">
                <Building2 size={14} />
                <span>GOVT DBT PIPELINE (PFMS-APBS)</span>
              </span>
              <h1 className="text-3xl sm:text-4xl font-black text-white mt-1">
                ₹{record.netAmount.toLocaleString('en-IN')}
              </h1>
              <p className="text-xs sm:text-sm text-white/70 mt-1">
                {language === 'hi' ? 'लाभार्थी किसान:' : 'Beneficiary:'}{' '}
                <strong className="text-[#D6BD98]">{record.farmerName}</strong> ·{' '}
                {record.bankName} ({record.accountMask})
              </p>
            </div>

            <div className="text-left sm:text-right">
              <span
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                  isPaid
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-900/50'
                    : isProcessing
                    ? 'bg-blue-500 text-white animate-pulse'
                    : 'bg-amber-500 text-[#1A3636]'
                }`}
              >
                {isPaid ? (
                  <>
                    <CheckCircle2 size={14} />
                    <span>{language === 'hi' ? 'खाते में जमा (PAID)' : 'CREDITED (PAID)'}</span>
                  </>
                ) : isProcessing ? (
                  <>
                    <Clock size={14} />
                    <span>{language === 'hi' ? 'प्रक्रियाधीन' : 'PROCESSING'}</span>
                  </>
                ) : (
                  <>
                    <Clock size={14} />
                    <span>{language === 'hi' ? 'लंबित' : 'PENDING'}</span>
                  </>
                )}
              </span>
              {record.utrNumber && (
                <span className="block text-[11px] font-mono text-[#D6BD98] mt-1">
                  UTR: {record.utrNumber}
                </span>
              )}
            </div>
          </div>

          {/* Multi-Stage DBT Stepper */}
          <div className="pt-4 border-t border-[#677D6A]/40 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-white/70">
              {language === 'hi' ? 'डीबीटी अंतरण चरण' : 'Direct Benefit Transfer Milestones'}
            </h2>

            <div className="space-y-3">
              {/* Stage 1 */}
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 shadow">
                  <CheckCircle2 size={14} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white">
                      {language === 'hi' ? '1. उपार्जन रिकॉर्डिंग व तौल' : '1. Procurement & Weighbridge Recorded'}
                    </span>
                    <span className="text-[11px] text-emerald-400 font-mono">Completed</span>
                  </div>
                  <p className="text-xs text-white/60">
                    {language === 'hi'
                      ? 'राजगढ़ उपार्जन केंद्र पर तौल और एफसीआई एफएक्यू ग्रेडिंग स्वीकृत हुई।'
                      : 'Weighing & FCI FAQ Grade A verification completed by Mandi Incharge.'}
                  </p>
                </div>
              </div>

              {/* Stage 2 */}
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 shadow">
                  <CheckCircle2 size={14} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white">
                      {language === 'hi' ? '2. स्टॉक आवक व ऑडिट सत्यापन' : '2. Stock Inward & Mandi Audit Passed'}
                    </span>
                    <span className="text-[11px] text-emerald-400 font-mono">Completed</span>
                  </div>
                  <p className="text-xs text-white/60">
                    {language === 'hi'
                      ? 'मंडी समिति इलेक्ट्रॉनिक स्टॉक रजिस्टर में आवक प्रविष्टि पूर्ण।'
                      : 'Electronic warehouse receipt created and validated against quota.'}
                  </p>
                </div>
              </div>

              {/* Stage 3 */}
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 shadow">
                  <CheckCircle2 size={14} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white">
                      {language === 'hi' ? '3. राज्य कोषालय स्वीकृति बिल' : '3. State Treasury Sanction Order Generated'}
                    </span>
                    <span className="text-[11px] text-emerald-400 font-mono">Completed</span>
                  </div>
                  <p className="text-xs text-white/60">
                    {language === 'hi'
                      ? 'खाद्य व नागरिक आपूर्ति विभाग द्वारा ₹' + record.netAmount.toLocaleString('en-IN') + ' का ई-बिल स्वीकृत।'
                      : `Treasury e-bill sanctioned for ₹${record.netAmount.toLocaleString('en-IN')} under MP Kisan Kalyan Scheme.`}
                  </p>
                </div>
              </div>

              {/* Stage 4 */}
              <div className="flex items-start gap-3">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 ${
                    isPaid
                      ? 'bg-emerald-500 text-white shadow'
                      : 'bg-blue-500 text-white animate-pulse'
                  }`}
                >
                  {isPaid ? <CheckCircle2 size={14} /> : '4'}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white">
                      {language === 'hi' ? '4. पीएफएमएस / एनपीसीआई आधार बैंक ब्रिज' : '4. PFMS / NPCI Aadhaar Bridge Transfer'}
                    </span>
                    <span className={`text-[11px] font-mono ${isPaid ? 'text-emerald-400' : 'text-blue-400'}`}>
                      {isPaid ? 'Cleared' : 'In Transit'}
                    </span>
                  </div>
                  <p className="text-xs text-white/60">
                    {language === 'hi'
                      ? 'आधार से जुड़े बैंक खाते पर प्रत्यक्ष लाभ अंतरण (DBT-APBS) प्रेषित।'
                      : 'Direct payment bridge dispatched to beneficiary bank account.'}
                  </p>
                </div>
              </div>

              {/* Stage 5 */}
              <div className="flex items-start gap-3">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 ${
                    isPaid ? 'bg-emerald-500 text-white shadow' : 'bg-[#40534C] text-white/60'
                  }`}
                >
                  {isPaid ? <CheckCircle2 size={14} /> : '5'}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white">
                      {language === 'hi' ? '5. बैंक खाते में राशि जमा' : '5. Credited to Farmer Bank Account'}
                    </span>
                    <span className={`text-[11px] font-mono ${isPaid ? 'text-emerald-400 font-bold' : 'text-white/40'}`}>
                      {isPaid ? 'Success' : 'Expected < 24h'}
                    </span>
                  </div>
                  <p className="text-xs text-white/60">
                    {isPaid
                      ? `${record.bankName} (${record.accountMask}) · UTR: ${record.utrNumber}`
                      : language === 'hi'
                      ? 'राशि 24 से 48 घंटे के भीतर आपके बैंक खाते में जमा होगी।'
                      : 'Funds will reflect in your account within standard DBT banking clearance.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Informational Assurance Card */}
        <div className="bg-[#40534C]/30 border border-[#677D6A]/40 rounded-2xl p-4 sm:p-5 flex items-start gap-3 text-xs sm:text-sm text-white/80">
          <Info size={20} className="text-[#D6BD98] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <strong className="font-semibold text-white">
              {language === 'hi' ? 'सरकारी एमएसपी गारंटी:' : 'Government MSP Guarantee:'}
            </strong>
            <p className="text-xs text-white/70 leading-relaxed">
              {language === 'hi'
                ? 'सभी भुगतान भारत सरकार और राज्य नागरिक आपूर्ति निगम द्वारा अनुमोदित न्यूनतम समर्थन मूल्य (MSP) के अनुसार सीधे आधार लिंक बैंक खाते में भेजे जाते हैं। किसी बिचौलिए या कमीशन का कोई शुल्क नहीं है।'
                : 'All payments are disbursed at 100% Minimum Support Price directly into your Aadhaar-linked bank account without any intermediaries or deductions.'}
            </p>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => navigate('/home')}
            className="flex-1 py-3 px-4 rounded-xl bg-[#D6BD98] text-[#1A3636] font-bold text-sm hover:bg-[#c4ab85] transition-all shadow-lg active:scale-[0.98] text-center"
          >
            {language === 'hi' ? 'डैशबोर्ड पर लौटें' : 'Return to Dashboard'}
          </button>

          <button
            onClick={() => navigate('/queue')}
            className="flex-1 py-3 px-4 rounded-xl bg-[#40534C] text-white font-semibold text-sm hover:bg-[#4d635c] transition-all border border-[#677D6A]/50 text-center"
          >
            {language === 'hi' ? 'लाइव कतार देखें' : 'View Live Mandi Queue'}
          </button>
        </div>
      </main>
    </div>
  )
}
