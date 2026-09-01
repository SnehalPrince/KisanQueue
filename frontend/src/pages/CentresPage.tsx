import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Search, SlidersHorizontal, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { useAppStore } from '@/store/app-store'
import { centreService } from '@/services/api/centre-service'
import { CentreCard } from '@/components/centres/CentreCard'
import type { CentreStatus } from '@/types/centre'

type FilterStatus = CentreStatus | 'ALL'

const FILTER_OPTIONS: { value: FilterStatus; labelEn: string; labelHi: string }[] = [
  { value: 'ALL', labelEn: 'All', labelHi: 'सभी' },
  { value: 'NORMAL', labelEn: 'Normal', labelHi: 'सामान्य' },
  { value: 'BUSY', labelEn: 'Busy', labelHi: 'व्यस्त' },
  { value: 'LIFTING_DELAYED', labelEn: 'Delayed', labelHi: 'देरी' },
  { value: 'PAUSED', labelEn: 'Paused', labelHi: 'बंद' },
]

/**
 * CentresPage — `/centres`
 *
 * Shows all nearby procurement centres with:
 * - Live status indicators (Normal / Busy / Lifting Delayed / Paused)
 * - Animated capacity bar per centre
 * - Bilingual search (EN+HI)
 * - Status filter pills
 * - Stale-data badge when updatedMinutesAgo > 30
 * - Navigate to /centres/:id for full detail
 */
export function CentresPage() {
  const language = useAppStore((s) => s.language)
  const navigate = useNavigate()
  const isHi = language === 'hi'

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('ALL')

  const {
    data: centres,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['centres', 'list'],
    queryFn: () => centreService.listPreviews(),
    staleTime: 60_000,
    refetchInterval: 60_000,
  })

  const filtered = useMemo(() => {
    if (!centres) return []
    return centres.filter((c) => {
      const matchesSearch =
        search.trim() === '' ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.hindiName.includes(search) ||
        c.district.toLowerCase().includes(search.toLowerCase())
      const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [centres, search, statusFilter])

  function handleRefresh() {
    refetch()
    toast.info(isHi ? 'डेटा रिफ्रेश हो रहा है…' : 'Refreshing live data…')
  }

  return (
    <div className="centres-page" id="main-content">
      {/* Header */}
      <header className="centres-header" role="banner">
        <div className="centres-header__top">
          <motion.button
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.16 }}
            className="centres-header__back"
            onClick={() => navigate(-1)}
            aria-label={isHi ? 'वापस जाएं' : 'Go back'}
          >
            <ArrowLeft size={20} aria-hidden="true" />
          </motion.button>

          <div className="centres-header__title-group">
            <h1 className="centres-header__title">
              {isHi ? 'नज़दीकी मंडियां' : 'Nearby Mandis'}
            </h1>
            <p className="centres-header__subtitle">
              {isHi
                ? `${centres?.length ?? 0} उपार्जन केंद्र मिले`
                : `${centres?.length ?? 0} procurement centres`}
            </p>
          </div>

          <motion.button
            whileTap={{ scale: 0.9, rotate: 180 }}
            transition={{ duration: 0.3 }}
            className={`centres-header__refresh ${isFetching ? 'centres-header__refresh--spinning' : ''}`}
            onClick={handleRefresh}
            aria-label={isHi ? 'रिफ्रेश करें' : 'Refresh data'}
            disabled={isFetching}
          >
            <RefreshCw size={18} aria-hidden="true" />
          </motion.button>
        </div>

        {/* Search */}
        <div className="centres-search-row">
          <label htmlFor="centres-search" className="sr-only">
            {isHi ? 'केंद्र खोजें' : 'Search centres'}
          </label>
          <div className="centres-search-wrap">
            <Search size={16} className="centres-search-icon" aria-hidden="true" />
            <input
              id="centres-search"
              type="search"
              placeholder={isHi ? 'जिला या केंद्र खोजें…' : 'Search district or centre…'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="centres-search-input"
              aria-label={isHi ? 'केंद्र खोजें' : 'Search centres'}
            />
          </div>
        </div>

        {/* Status filter pills */}
        <div
          className="centres-filters"
          role="group"
          aria-label={isHi ? 'स्थिति फ़िल्टर' : 'Status filter'}
        >
          <SlidersHorizontal size={14} className="centres-filters__icon" aria-hidden="true" />
          <div className="centres-filters__pills" role="listbox">
            {FILTER_OPTIONS.map((opt) => (
              <motion.button
                key={opt.value}
                whileTap={{ scale: 0.95 }}
                role="option"
                aria-selected={statusFilter === opt.value}
                className={`filter-pill ${statusFilter === opt.value ? 'filter-pill--active' : ''}`}
                onClick={() => setStatusFilter(opt.value)}
              >
                {isHi ? opt.labelHi : opt.labelEn}
              </motion.button>
            ))}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="centres-main" aria-label={isHi ? 'केंद्र सूची' : 'Centre list'}>
        <AnimatePresence mode="wait">
          {isLoading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="centres-state"
              aria-busy="true"
              aria-live="polite"
            >
              {[0, 1, 2].map((i) => (
                <div key={i} className="centre-skeleton">
                  <div className="skeleton-line skeleton-line--title" />
                  <div className="skeleton-line skeleton-line--short" />
                  <div className="skeleton-line skeleton-line--bar" />
                </div>
              ))}
            </motion.div>
          )}

          {isError && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="centres-state centres-state--error"
              role="alert"
            >
              <span className="centres-state__icon" aria-hidden="true">📡</span>
              <p className="centres-state__title">
                {isHi ? 'डेटा लोड नहीं हो सका' : 'Failed to load centres'}
              </p>
              <p className="centres-state__desc">
                {isHi
                  ? 'कृपया नेटवर्क जांचें या केंद्र से संपर्क करें।'
                  : 'Check your network connection or contact the centre directly.'}
              </p>
              <motion.button
                whileTap={{ scale: 0.97 }}
                className="centres-state__retry"
                onClick={() => refetch()}
              >
                {isHi ? 'पुनः प्रयास करें' : 'Try again'}
              </motion.button>
            </motion.div>
          )}

          {!isLoading && !isError && (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="centres-list"
              role="list"
              aria-label={isHi ? 'केंद्र सूची' : 'Centre list'}
            >
              {filtered.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="centres-empty"
                >
                  <span className="centres-empty__icon" aria-hidden="true">🔍</span>
                  <p className="centres-empty__title">
                    {isHi ? 'कोई केंद्र नहीं मिला' : 'No centres found'}
                  </p>
                  <p className="centres-empty__desc">
                    {isHi ? 'फ़िल्टर बदलकर देखें।' : 'Try changing your filters or search term.'}
                  </p>
                </motion.div>
              ) : (
                filtered.map((centre, i) => (
                  <div key={centre.id} role="listitem">
                    <CentreCard
                      centre={centre}
                      language={language}
                      index={i}
                      onClick={() => navigate(`/centres/${centre.id}`)}
                    />
                  </div>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pro tip */}
        {!isLoading && !isError && filtered.length > 0 && (
          <motion.aside
            className="centres-tip"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            aria-label={isHi ? 'सुझाव' : 'Tip'}
          >
            <span className="centres-tip__icon" aria-hidden="true">💡</span>
            <p className="centres-tip__text">
              {isHi
                ? 'कम भीड़ वाले केंद्र जाएं। कम प्रतीक्षा, जल्दी घर।'
                : 'Choose a centre with fewer waiting farmers for a shorter visit.'}
            </p>
          </motion.aside>
        )}
      </main>
    </div>
  )
}
