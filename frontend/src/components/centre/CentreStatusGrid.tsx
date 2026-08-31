import type { CentrePreview } from '@/types/centre'
import type { Language } from '@/store/app-store'
import type { CopyMap } from '@/lib/copy'
import { CentreCard } from './CentreCard'
import { CentreGridSkeleton } from '@/components/ui/SkeletonCard'
import { ErrorRetry } from '@/components/ui/ErrorRetry'

interface CentreStatusGridProps {
  readonly centres: readonly CentrePreview[] | undefined
  readonly isLoading: boolean
  readonly isError: boolean
  readonly language: Language
  readonly text: CopyMap
  readonly onRetry: () => void
  readonly onDetails: (centre: CentrePreview) => void
}

/**
 * Orchestrates the three display states of the centre grid:
 *  - Loading  → shimmer skeletons
 *  - Error    → bilingual error with retry
 *  - Empty    → should not occur with seeded mock data, but guarded
 *  - Success  → 3 CentreCard components with stagger animation
 *
 * aria-live="polite" ensures screen readers announce when content updates.
 */
export function CentreStatusGrid({
  centres,
  isLoading,
  isError,
  language,
  text,
  onRetry,
  onDetails,
}: CentreStatusGridProps) {
  if (isLoading) return <CentreGridSkeleton />

  if (isError) return <ErrorRetry onRetry={onRetry} language={language} />

  if (!centres || centres.length === 0) {
    return (
      <div className="empty-state" role="status">
        <p>
          {language === 'hi'
            ? 'अभी कोई केंद्र उपलब्ध नहीं है।'
            : 'No centres available right now.'}
        </p>
      </div>
    )
  }

  return (
    <div
      id="centres"
      className="centre-list"
      aria-live="polite"
      aria-label={
        language === 'hi' ? 'नज़दीकी केंद्रों की स्थिति' : 'Nearby centre conditions'
      }
    >
      {centres.map((centre, index) => (
        <CentreCard
          key={centre.id}
          centre={centre}
          index={index}
          language={language}
          text={text}
          onDetails={onDetails}
        />
      ))}
    </div>
  )
}
