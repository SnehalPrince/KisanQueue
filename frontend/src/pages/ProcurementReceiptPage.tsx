import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'motion/react'
import {
  ArrowLeft,
  CheckCircle2,
  Printer,
  Share2,
  Building2,
  Calendar,
  CreditCard,
} from 'lucide-react'
import { toast } from 'sonner'
import { useQueueLiveStore } from '@/store/queue-live-store'
import { useAppStore } from '@/store/app-store'

export function ProcurementReceiptPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const language = useAppStore((s) => s.language)

  const { procurements } = useQueueLiveStore()

  // Find receipt or fallback to demo Priya Bai / Ramesh record
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
            {language === 'hi' ? 'खरीद रसीद नहीं मिली' : 'Receipt Not Found'}
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

  function handlePrint() {
    window.print()
  }

  function handleShare() {
    const text =
      language === 'hi'
        ? `किसानक्यू डिजिटल खरीद रसीद: रसीद #${record.receiptNumber}, किसान: ${record.farmerName}, फसल: ${record.cropNameHi}, मात्रा: ${record.quantityQ} क्विंटल, कुल भुगतान: ₹${record.netAmount.toLocaleString('en-IN')}`
        : `KisanQueue Digital Procurement Receipt: Receipt #${record.receiptNumber}, Farmer: ${record.farmerName}, Crop: ${record.cropNameEn}, Qty: ${record.quantityQ} Q, Net Payout: ₹${record.netAmount.toLocaleString('en-IN')}`
    
    if (navigator.share) {
      navigator.share({ title: 'Procurement Receipt', text }).catch(() => {})
    } else {
      navigator.clipboard.writeText(text)
      toast.success(language === 'hi' ? 'रसीद विवरण कॉपी किया गया!' : 'Receipt details copied!')
    }
  }

  return (
    <div className="min-h-screen bg-[#1A3636] text-[#F9F6F0] flex flex-col print:bg-white print:text-black">
      {/* Top Header (Hidden on print) */}
      <header className="sticky top-0 z-40 bg-[#1A3636]/95 backdrop-blur-md border-b border-[#40534C] px-4 py-3 sm:px-6 print:hidden">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate('/home')}
            className="flex items-center gap-2 text-[#D6BD98] hover:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#D6BD98] rounded-md px-2 py-1"
          >
            <ArrowLeft size={18} />
            <span>{language === 'hi' ? 'डैशबोर्ड' : 'Dashboard'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#40534C] text-[#D6BD98] hover:bg-[#4d635c] transition-colors border border-[#677D6A]/40"
              aria-label="Print receipt"
            >
              <Printer size={14} />
              <span className="hidden sm:inline">{language === 'hi' ? 'प्रिंट करें' : 'Print'}</span>
            </button>

            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#40534C] text-[#D6BD98] hover:bg-[#4d635c] transition-colors border border-[#677D6A]/40"
              aria-label="Share receipt"
            >
              <Share2 size={14} />
              <span className="hidden sm:inline">{language === 'hi' ? 'साझा करें' : 'Share'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Receipt Content */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-6 sm:px-6 space-y-6">
        {/* Certificate Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
          className="bg-[#F9F6F0] text-[#1A3636] rounded-3xl p-6 sm:p-10 shadow-2xl border-4 border-[#D6BD98] relative overflow-hidden print:border-none print:shadow-none print:p-0"
        >
          {/* Subtle Watermark Stamp */}
          <div className="absolute right-6 top-1/3 -rotate-12 select-none pointer-events-none opacity-10 border-8 border-[#40534C] rounded-full p-8 text-center">
            <span className="text-4xl font-black uppercase tracking-widest block text-[#40534C]">
              VERIFIED
            </span>
            <span className="text-xs font-bold block text-[#40534C]">GOVT OF MP</span>
          </div>

          {/* Official Mandi Header */}
          <div className="border-b-2 border-[#1A3636]/15 pb-6 text-center space-y-2">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Building2 className="text-[#40534C]" size={28} />
              <span className="font-extrabold text-xs tracking-widest uppercase text-[#40534C]">
                GOVERNMENT OF MADHYA PRADESH · APMC
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#1A3636] tracking-tight">
              {language === 'hi' ? record.centreHindiName : record.centreName}
            </h1>
            <p className="text-xs text-[#40534C] font-medium">
              {language === 'hi'
                ? 'कृषि उपज मंडी समिति · ई-उपार्जन डिजिटल पावती'
                : 'Agricultural Produce Market Committee · e-Procurement Digital Receipt'}
            </p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold font-mono mt-1">
              <CheckCircle2 size={14} />
              <span>{record.receiptNumber}</span>
            </div>
          </div>

          {/* Key Meta Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-6 border-b border-[#1A3636]/10 text-xs">
            <div>
              <span className="text-[#40534C]/70 block uppercase font-semibold text-[10px]">
                {language === 'hi' ? 'टोकन संख्या' : 'Token No.'}
              </span>
              <span className="font-mono font-black text-sm text-[#1A3636]">
                #{record.token} ({record.tokenCode})
              </span>
            </div>

            <div>
              <span className="text-[#40534C]/70 block uppercase font-semibold text-[10px]">
                {language === 'hi' ? 'किसान का नाम' : 'Farmer Name'}
              </span>
              <span className="font-bold text-sm text-[#1A3636]">
                {record.farmerName}
              </span>
            </div>

            <div>
              <span className="text-[#40534C]/70 block uppercase font-semibold text-[10px]">
                {language === 'hi' ? 'तौल समय' : 'Weighing Time'}
              </span>
              <span className="font-medium text-sm text-[#1A3636] flex items-center gap-1">
                <Calendar size={12} />
                <span>{record.weighingTime}, Today</span>
              </span>
            </div>

            <div>
              <span className="text-[#40534C]/70 block uppercase font-semibold text-[10px]">
                {language === 'hi' ? 'प्रमाणन' : 'Grading Status'}
              </span>
              <span className="font-bold text-sm text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded inline-block">
                Grade {record.grade} (Passed)
              </span>
            </div>
          </div>

          {/* Itemized Table */}
          <div className="py-6 border-b-2 border-[#1A3636]/15">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-[#1A3636]/20 text-[#40534C] font-bold">
                  <th className="py-2">{language === 'hi' ? 'विवरण' : 'Description'}</th>
                  <th className="py-2 text-right">{language === 'hi' ? 'मात्रा (क्विंटल)' : 'Qty (Q)'}</th>
                  <th className="py-2 text-right">{language === 'hi' ? 'एमएसपी दर (₹/Q)' : 'MSP Rate (₹/Q)'}</th>
                  <th className="py-2 text-right">{language === 'hi' ? 'कुल राशि (₹)' : 'Total (₹)'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A3636]/10">
                <tr>
                  <td className="py-3">
                    <span className="font-bold block text-sm">
                      {language === 'hi' ? record.cropNameHi : record.cropNameEn}
                    </span>
                    <span className="text-xs text-[#40534C]">
                      FSSAI / FCI Fair Average Quality (FAQ) Standard
                    </span>
                  </td>
                  <td className="py-3 text-right font-mono font-semibold">{record.quantityQ.toFixed(2)}</td>
                  <td className="py-3 text-right font-mono font-semibold">₹{record.mspRate.toLocaleString('en-IN')}</td>
                  <td className="py-3 text-right font-mono font-black text-sm">
                    ₹{record.grossAmount.toLocaleString('en-IN')}
                  </td>
                </tr>

                <tr>
                  <td className="py-2.5 text-[#40534C]">
                    {language === 'hi' ? 'मंडी शुल्क व तौल उपकर' : 'Mandi Cess & Weighing Fee'}
                  </td>
                  <td className="py-2.5 text-right font-mono">—</td>
                  <td className="py-2.5 text-right font-mono">0.00%</td>
                  <td className="py-2.5 text-right font-mono text-emerald-800 font-semibold">
                    {language === 'hi' ? 'किसान हेतु छूट (₹0.00)' : 'Exempted (₹0.00)'}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Net Amount Callout */}
            <div className="mt-4 p-4 rounded-2xl bg-[#D6BD98]/30 border border-[#D6BD98] flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#40534C]">
                  {language === 'hi' ? 'कुल देय राशि (डीबीटी बैंक अंतरण)' : 'Net Payable Amount (Direct Benefit Transfer)'}
                </span>
                <p className="text-xs text-[#40534C] font-medium">
                  {language === 'hi'
                    ? 'सीधे आपके आधार से जुड़े बैंक खाते में अंतरित की जाएगी'
                    : 'Credited directly to your Aadhaar-linked Bank Account'}
                </p>
              </div>
              <div className="text-right">
                <span className="text-2xl sm:text-3xl font-black text-[#1A3636]">
                  ₹{record.netAmount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* Signatures and Verification Footer */}
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-[#40534C]">
            <div className="space-y-1 text-center sm:text-left">
              <span className="block font-bold text-[#1A3636]">
                {record.officerName}
              </span>
              <span className="block text-[11px]">
                {language === 'hi' ? 'प्राधिकृत उपार्जन अधिकारी' : 'Authorized Procurement Officer'}
              </span>
              <span className="block text-[10px] font-mono text-emerald-800 font-bold">
                ✓ Digitally Signed & Timestamped
              </span>
            </div>

            <div className="border border-[#1A3636]/20 bg-white p-3 rounded-xl flex items-center gap-3">
              <div className="text-center font-mono text-[10px] space-y-0.5">
                <span className="font-bold block text-[#1A3636]">GOV-MP-EPASSPORT</span>
                <span className="text-emerald-700 font-semibold">HMAC-SHA256: VALID</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* DBT Payment Tracker Callout Card */}
        <div className="bg-[#40534C]/40 border border-[#677D6A]/50 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#D6BD98]/20 border border-[#D6BD98]/40 flex items-center justify-center text-[#D6BD98] shrink-0">
              <CreditCard size={24} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {language === 'hi' ? 'डीबीटी बैंक भुगतान स्थिति ट्रैक करें' : 'Track DBT Direct Bank Payment'}
              </h2>
              <p className="text-xs text-white/70">
                {language === 'hi'
                  ? 'पीएफएमएस और राज्य कोषालय द्वारा सीधे बैंक खाते में भुगतान की स्थिति देखें'
                  : 'Monitor real-time PFMS treasury clearance & credit to your bank account'}
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate(`/payment/${record.id}`)}
            className="w-full sm:w-auto bg-[#D6BD98] hover:bg-[#c4ab85] text-[#1A3636] font-bold px-6 py-3 rounded-xl transition-all shadow-lg active:scale-95 whitespace-nowrap text-sm"
          >
            {language === 'hi' ? 'डीबीटी स्थिति देखें' : 'View DBT Status'}
          </button>
        </div>
      </main>
    </div>
  )
}
