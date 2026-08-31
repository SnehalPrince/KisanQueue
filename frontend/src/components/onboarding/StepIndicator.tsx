import { Check } from 'lucide-react'
import type { CopyMap } from '@/lib/copy'

interface StepIndicatorProps {
  readonly currentStep: 1 | 2 | 3
  readonly text: CopyMap
}

/**
 * StepIndicator component.
 *
 * Applied skills:
 * - accessibility-a11y: semantic <nav>, ordered list <ol>, aria-current="step", aria-label
 * - emil-design-eng: clean transitions, subtle badge border tokens
 */
export function StepIndicator({ currentStep, text }: StepIndicatorProps) {
  const steps = [
    { number: 1, label: text.stepPhone },
    { number: 2, label: text.stepProfile },
    { number: 3, label: text.stepPrefs },
  ] as const

  return (
    <nav
      className="step-indicator"
      aria-label={`${text.stepOf} ${currentStep} of 3`}
    >
      <ol className="step-list">
        {steps.map((step) => {
          const isCompleted = currentStep > step.number
          const isCurrent = currentStep === step.number

          return (
            <li
              key={step.number}
              className={`step-item ${isCurrent ? 'is-current' : ''} ${
                isCompleted ? 'is-completed' : ''
              }`}
              aria-current={isCurrent ? 'step' : undefined}
            >
              <div className="step-marker" aria-hidden="true">
                {isCompleted ? <Check size={14} strokeWidth={3} /> : step.number}
              </div>
              <span className="step-label">{step.label}</span>
            </li>
          )
        })}
      </ol>
      <div className="step-progress-track" aria-hidden="true">
        <div
          className="step-progress-bar"
          style={{ width: `${((currentStep - 1) / 2) * 100}%` }}
        />
      </div>
    </nav>
  )
}
