/** Shimmer skeleton for a single centre card during loading state. */
export function SkeletonCard() {
  return (
    <div className="skeleton-card" aria-hidden="true">
      <span className="skeleton-line skeleton-line--sm" />
      <span className="skeleton-line skeleton-line--lg" />
      <span className="skeleton-line skeleton-line--md skeleton-line--push" />
      <span className="skeleton-line skeleton-line--full skeleton-line--push-sm" />
    </div>
  )
}

/** Three skeleton cards for the loading state of the centre grid. */
export function CentreGridSkeleton() {
  return (
    <div className="centre-list" aria-label="केंद्र की स्थिति लोड हो रही है" aria-busy="true">
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </div>
  )
}
