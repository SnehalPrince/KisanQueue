import type { Language } from '@/store/app-store'

interface ErrorRetryProps {
  readonly onRetry: () => void
  readonly language: Language
}

/**
 * Bilingual error state with retry button.
 * role="alert" ensures screen readers announce the error on mount.
 */
export function ErrorRetry({ onRetry, language }: ErrorRetryProps) {
  const isHindi = language === 'hi'
  return (
    <div className="error-state" role="alert" aria-live="assertive">
      <strong>
        {isHindi
          ? 'केंद्र की स्थिति अभी लोड नहीं हुई।'
          : 'Centre conditions could not be loaded.'}
      </strong>
      <p>
        {isHindi
          ? 'कृपया अपना इंटरनेट कनेक्शन जांचें और दोबारा कोशिश करें।'
          : 'Please check your connection and try again.'}
      </p>
      <button type="button" className="primary-button" onClick={onRetry}>
        {isHindi ? 'फिर से कोशिश करें' : 'Try again'}
      </button>
    </div>
  )
}
