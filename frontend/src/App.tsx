import { useQuery } from '@tanstack/react-query'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { ArrowDown, ArrowUpRight, CheckCircle2, ChevronRight, Clock3, Languages, MapPin, ShieldCheck, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { copy, type Language, statusKey } from './lib/copy'
import { centreService } from './services/mock/centre-service'
import type { CentrePreview } from './types/centre'

function App() {
  const [language, setLanguage] = useState<Language>(() => (localStorage.getItem('kq-language') as Language) || 'hi')
  const [selectedCentre, setSelectedCentre] = useState<CentrePreview | null>(null)
  const reduceMotion = useReducedMotion()
  const text = copy[language]
  const { data: centres, isLoading, isError, refetch } = useQuery({ queryKey: ['centre-previews'], queryFn: centreService.listPreviews })

  useEffect(() => { localStorage.setItem('kq-language', language) }, [language])
  const profileToast = () => toast.info(text.toastTitle, { description: text.toastDescription })
  const scrollToCentres = () => document.getElementById('centres')?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' })
  return <main>
    <a className="skip-link" href="#content">Skip to centre conditions</a>
    <header className="site-header" aria-label="Primary navigation">
      <a className="brand" href="#top" aria-label="KisanQueue home"><span className="brand-mark">क्यू</span><span>{text.brand}</span></a>
      <nav className="desktop-nav"><a href="#centres">{text.navCentres}</a><a href="#how-it-works">{text.navHow}</a></nav>
      <div className="header-actions"><button className="language-button" type="button" onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')} aria-label="Change language"><Languages size={17} /><span>{language === 'hi' ? 'EN' : 'हि'}</span></button><button className="quiet-button" type="button" onClick={profileToast}>{text.profile}<ArrowUpRight size={15} /></button></div>
    </header>
    <section id="top" className="hero-section" aria-labelledby="hero-title">
      <img className="hero-image" src="/assets/images/hero_mandi_dusk.png" alt="Tractors carrying grain in a procurement mandi at sunrise" /><div className="hero-wash" /><div className="hero-grain" aria-hidden="true" />
      <div className="hero-content"><div className="live-pill"><span className="live-dot" />{text.live}</div><div className="t-stagger is-shown hero-copy"><p className="t-stagger-line t-stagger-line--1 eyebrow">{text.eyebrow}</p><h1 id="hero-title" className="t-stagger-line t-stagger-line--2">{text.heading}</h1></div><p className="hero-intro">{text.intro}</p><div className="hero-actions"><button type="button" className="primary-button" onClick={scrollToCentres}>{text.explore}<ArrowDown size={18} /></button><span>{text.profileHint}</span></div></div>
      <div className="hero-proof"><span className="proof-icon"><ShieldCheck size={19} /></span><div><strong>{text.proofTitle}</strong><span>{text.proofBody}</span></div></div><button className="scroll-cue" type="button" onClick={scrollToCentres}><span>{text.scroll}</span><ArrowDown size={16} /></button>
    </section>
    <section id="content" className="centres-section" aria-labelledby="centres-title"><div className="section-heading"><div><p className="section-kicker">01 / {text.status}</p><h2 id="centres-title">{text.preview}</h2></div><p>{text.previewNote}</p></div>{isLoading ? <CentreSkeleton /> : null}{isError ? <ErrorState onRetry={() => void refetch()} language={language} /> : null}{centres ? <div id="centres" className="centre-list" aria-live="polite">{centres.map((centre, index) => <CentreCard key={centre.id} centre={centre} index={index} language={language} onDetails={setSelectedCentre} />)}</div> : null}</section>
    <section id="how-it-works" className="explain-section" aria-labelledby="how-title"><div className="explain-rule" aria-hidden="true" /><p className="section-kicker">02 / KISANQUEUE</p><h2 id="how-title">{text.howTitle}</h2><p>{text.howText}</p><div className="stat-row"><span><strong>01</strong>{text.statOne}</span><span><strong>02</strong>{text.statTwo}</span><span><strong>03</strong>{text.statThree}</span></div></section>
    <footer><span>© 2026 KisanQueue</span><span>{text.source}</span></footer>
    <AnimatePresence>{selectedCentre ? <CentreModal centre={selectedCentre} language={language} onClose={() => setSelectedCentre(null)} /> : null}</AnimatePresence>
  </main>
}

function CentreCard({ centre, index, language, onDetails }: { readonly centre: CentrePreview; readonly index: number; readonly language: Language; readonly onDetails: (centre: CentrePreview) => void }) {
  const text = copy[language]; const status = statusKey[centre.status]
  return <motion.article className={`centre-card centre-card--${status}`} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.45, delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}><div className="card-topline"><span className={`status-badge status-badge--${status}`}><span className="status-symbol">{status === 'normal' ? '●' : status === 'busy' ? '▲' : status === 'paused' ? '■' : '!'}</span>{text[status]}</span><span className="distance"><MapPin size={14} />{centre.distanceKm} km</span></div><div className="centre-name"><p>{language === 'hi' ? centre.hindiName : centre.name}</p><span>{centre.district}</span></div><div className="eta-block"><span>{text.estimatedWait}</span><strong>{formatEta(centre.etaMinutes, language, text.pausedEta)}</strong><small><CheckCircle2 size={13} />{text[centre.confidence.toLowerCase() as 'high' | 'medium' | 'low' | 'na']}</small></div><dl className="centre-facts"><div><dt>{text.queue}</dt><dd>{centre.queueLength}</dd></div><div><dt>{text.counters}</dt><dd>{centre.activeCounters}</dd></div><div><dt>{text.updated}</dt><dd>{centre.updatedMinutesAgo} {text.min}</dd></div></dl><button type="button" className="details-link" onClick={() => onDetails(centre)}>{text.details}<ChevronRight size={17} /></button></motion.article>
}

function CentreModal({ centre, language, onClose }: { readonly centre: CentrePreview; readonly language: Language; readonly onClose: () => void }) {
  const text = copy[language]; const status = statusKey[centre.status]
  useEffect(() => { const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }; window.addEventListener('keydown', escape); return () => window.removeEventListener('keydown', escape) }, [onClose])
  return <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={onClose} role="presentation"><motion.section className="centre-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" initial={{ opacity: 0, scale: 0.96, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 8 }} transition={{ type: 'spring', stiffness: 350, damping: 28 }} onMouseDown={(event) => event.stopPropagation()}><button type="button" className="close-button" onClick={onClose} aria-label={text.close}><X size={20} /></button><p className="section-kicker">{text.modalTitle}</p><h2 id="modal-title">{language === 'hi' ? centre.hindiName : centre.name}</h2><span className={`status-badge status-badge--${status}`}>{text[status]}</span><p className="modal-note">{centre.note}</p><div className="modal-eta"><Clock3 size={22} /><div><span>{text.estimatedWait}</span><strong>{formatEta(centre.etaMinutes, language, text.pausedEta)}</strong></div></div><button type="button" className="primary-button modal-action" onClick={() => toast.info(text.toastTitle, { description: text.toastDescription })}>{text.joinSignIn}<ArrowUpRight size={17} /></button></motion.section></motion.div>
}
function CentreSkeleton() { return <div className="centre-list" aria-label="Loading centre conditions" aria-busy="true">{[0, 1, 2].map((item) => <div className="skeleton-card" key={item}><span /><span /><span /><span /></div>)}</div> }
function ErrorState({ onRetry, language }: { readonly onRetry: () => void; readonly language: Language }) { const isHindi = language === 'hi'; return <div className="error-state" role="alert"><strong>{isHindi ? 'केंद्र की स्थिति अभी लोड नहीं हुई।' : 'Centre conditions could not load.'}</strong><p>{isHindi ? 'कृपया अपना इंटरनेट कनेक्शन जांचें और दोबारा कोशिश करें।' : 'Please check your connection and try again.'}</p><button type="button" className="primary-button" onClick={onRetry}>{isHindi ? 'फिर से कोशिश करें' : 'Try again'}</button></div> }
function formatEta(minutes: number | null, language: Language, pausedText: string) { if (minutes === null) return pausedText; if (minutes < 60) return `~${minutes} ${language === 'hi' ? 'मिनट' : 'min'}`; const hours = Math.floor(minutes / 60); const remainder = minutes % 60; return language === 'hi' ? `~${hours} घं ${remainder} मि` : `~${hours}h ${remainder}m` }
export default App
