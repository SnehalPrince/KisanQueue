import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { ShieldCheck, Lock, User, ArrowRight, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { useQueueLiveStore } from '@/store/queue-live-store'
import { useAppStore } from '@/store/app-store'

export function OfficerLoginPage() {
  const navigate = useNavigate()
  const language = useAppStore((s) => s.language)
  const loginOfficer = useQueueLiveStore((s) => s.loginOfficer)

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  function handleDemoFill() {
    setUsername('officer_rajgarh')
    setPassword('Demo@1234')
    toast.info(language === 'hi' ? 'डेमो विवरण भरा गया' : 'Demo credentials autofilled')
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!username.trim()) {
      toast.error(language === 'hi' ? 'कृपया यूज़रनेम दर्ज करें' : 'Please enter username')
      return
    }

    setIsLoading(true)
    setTimeout(() => {
      const success = loginOfficer(username, password)
      setIsLoading(false)
      if (success) {
        toast.success(
          language === 'hi'
            ? 'स्वागत है, अधिकारी सुरेश पटेल (राजगढ़ उपार्जन केंद्र)'
            : 'Welcome, Officer Suresh Patel (Rajgarh APMC)',
        )
        navigate('/officer/dashboard', { replace: true })
      } else {
        toast.error(
          language === 'hi'
            ? 'अमान्य विवरण। डेमो लॉगिन के लिए "डेमो विवरण" बटन दबाएं।'
            : 'Invalid credentials. Click "Demo Login" for instant access.',
        )
      }
    }, 400)
  }

  return (
    <div className="min-h-screen bg-[#1A3636] text-[#F9F6F0] flex flex-col">
      {/* Top bar */}
      <header className="px-4 py-3 border-b border-[#40534C] flex items-center justify-between">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-[#D6BD98] hover:text-white text-sm font-medium"
        >
          <ArrowLeft size={16} />
          <span>{language === 'hi' ? 'मुख्य पृष्ठ' : 'Home'}</span>
        </button>
        <span className="text-xs font-mono text-white/50">
          GOVT OF MP · FOOD & CIVIL SUPPLIES
        </span>
      </header>

      {/* Login Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-[#40534C]/40 border border-[#677D6A]/50 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-6"
        >
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#D6BD98]/20 border border-[#D6BD98]/40 text-[#D6BD98] mb-2 shadow-inner">
              <ShieldCheck size={32} />
            </div>
            <h1 className="text-2xl font-bold text-white">
              {language === 'hi' ? 'मंडी अधिकारी कंसोल' : 'Mandi Officer Portal'}
            </h1>
            <p className="text-xs sm:text-sm text-white/70">
              {language === 'hi'
                ? 'उपार्जन केंद्र प्रबंधन, गेट चेक-इन व 2-टैप क्षमता नियंत्रण'
                : 'Procurement Centre console, gate check-in & 2-tap capacity engine'}
            </p>
          </div>

          {/* Quick Demo Fill Chip */}
          <div className="bg-[#1A3636]/80 border border-[#D6BD98]/40 rounded-2xl p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-[#D6BD98] uppercase tracking-wider block">
                {language === 'hi' ? 'डेमो त्वरित पहुंच' : 'SIH Evaluator Quick Access'}
              </span>
              <span className="text-xs text-white/80">
                Officer Suresh Patel · Rajgarh Mandi
              </span>
            </div>
            <button
              type="button"
              onClick={handleDemoFill}
              className="text-xs font-bold bg-[#D6BD98] text-[#1A3636] px-3 py-1.5 rounded-lg hover:bg-[#c4ab85] transition-all active:scale-95 shadow"
            >
              {language === 'hi' ? 'डेमो भरें' : 'Fill Demo'}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white/80 block">
                {language === 'hi' ? 'अधिकारी यूज़रनेम' : 'Officer Username'}
              </label>
              <div className="relative">
                <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. officer_rajgarh"
                  className="w-full bg-[#1A3636] border border-[#677D6A]/60 rounded-xl py-2.5 pl-10 pr-4 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#D6BD98] focus:ring-1 focus:ring-[#D6BD98]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white/80 block">
                {language === 'hi' ? 'पासवर्ड' : 'Password'}
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#1A3636] border border-[#677D6A]/60 rounded-xl py-2.5 pl-10 pr-4 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#D6BD98] focus:ring-1 focus:ring-[#D6BD98]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#D6BD98] hover:bg-[#c4ab85] text-[#1A3636] font-bold py-3 px-4 rounded-xl transition-all shadow-lg active:scale-[0.98] flex items-center justify-center gap-2 mt-2"
            >
              <span>{isLoading ? (language === 'hi' ? 'प्रवेश हो रहा है...' : 'Signing in...') : (language === 'hi' ? 'कंसोल में प्रवेश करें' : 'Sign in to Console')}</span>
              <ArrowRight size={18} />
            </button>
          </form>

          <div className="text-center">
            <span className="text-[11px] text-white/40">
              KisanQueue Mandi Operations Suite v1.0 · Protected by State e-Governance
            </span>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
