import { useState } from 'react'
import { motion } from 'motion/react'
import { User, MapPin, Building2, ShieldCheck, ArrowRight, ArrowLeft, AlertCircle } from 'lucide-react'
import type { CopyMap } from '@/lib/copy'

export interface ProfileFormData {
  name: string
  village: string
  district: string
  primaryCrop: string
  aadhaarLast4?: string
}

interface ProfileStepProps {
  readonly text: CopyMap
  readonly initialData?: Partial<ProfileFormData>
  readonly onNext: (data: ProfileFormData) => void
  readonly onBack: () => void
}

const DISTRICT_OPTIONS = [
  'Rajgarh',
  'Hisar',
  'Patiala',
  'Sehore',
  'Bhopal',
  'Indore',
  'Ludhiana',
  'Ambala',
]

/**
 * Step 2: Farmer Details (Name, Location, Crop, Aadhaar Hint).
 *
 * Applied skills:
 * - accessibility-a11y: semantic <fieldset>, <label for="...">, role="radiogroup", min 44x44px touch targets
 * - emil-design-eng: button press scale(0.97), smooth focus outlines, subtle crop chip borders
 * - react: function keyword, named event handlers
 */
export function ProfileStep({ text, initialData, onNext, onBack }: ProfileStepProps) {
  const [name, setName] = useState(initialData?.name || '')
  const [village, setVillage] = useState(initialData?.village || '')
  const [district, setDistrict] = useState(initialData?.district || 'Rajgarh')
  const [primaryCrop, setPrimaryCrop] = useState(initialData?.primaryCrop || 'Wheat')
  const [aadhaarLast4, setAadhaarLast4] = useState(initialData?.aadhaarLast4 || '')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const crops = [
    { id: 'Wheat', label: text.cropWheat },
    { id: 'Soybean', label: text.cropSoybean },
    { id: 'Paddy', label: text.cropPaddy },
    { id: 'Barley', label: text.cropBarley },
  ]

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      setErrorMessage(text.errNameRequired)
      return
    }
    if (!village.trim()) {
      setErrorMessage(text.errVillageRequired)
      return
    }
    if (!district.trim()) {
      setErrorMessage(text.errDistrictRequired)
      return
    }

    onNext({
      name: name.trim(),
      village: village.trim(),
      district: district.trim(),
      primaryCrop,
      aadhaarLast4: aadhaarLast4.trim() || undefined,
    })
  }

  function handleAadhaarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 4)
    setAadhaarLast4(digits)
  }

  return (
    <div className="onboarding-step-card">
      <div className="step-header">
        <h2 className="step-title">{text.stepProfile}</h2>
        <p className="step-subtitle">{text.onboardingSubtitle}</p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        {/* Full Name */}
        <div className="form-group">
          <label htmlFor="farmer-name" className="form-label">
            {text.nameLabel} <span className="required-star">*</span>
          </label>
          <div className="input-with-icon">
            <input
              id="farmer-name"
              type="text"
              className="form-input"
              placeholder={text.namePlaceholder}
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setErrorMessage(null)
              }}
              required
            />
            <User className="input-icon" size={18} aria-hidden="true" />
          </div>
        </div>

        {/* Location Grid: Village & District */}
        <div className="form-row-2">
          <div className="form-group">
            <label htmlFor="farmer-village" className="form-label">
              {text.villageLabel} <span className="required-star">*</span>
            </label>
            <div className="input-with-icon">
              <input
                id="farmer-village"
                type="text"
                className="form-input"
                placeholder={text.villagePlaceholder}
                value={village}
                onChange={(e) => {
                  setVillage(e.target.value)
                  setErrorMessage(null)
                }}
                required
              />
              <MapPin className="input-icon" size={18} aria-hidden="true" />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="farmer-district" className="form-label">
              {text.districtLabel} <span className="required-star">*</span>
            </label>
            <div className="input-with-icon">
              <select
                id="farmer-district"
                className="form-select"
                value={district}
                onChange={(e) => {
                  setDistrict(e.target.value)
                  setErrorMessage(null)
                }}
                required
              >
                {DISTRICT_OPTIONS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              <Building2 className="input-icon" size={18} aria-hidden="true" />
            </div>
          </div>
        </div>

        {/* Primary Crop Selector */}
        <fieldset className="form-group">
          <legend className="form-label">{text.cropLabel}</legend>
          <div className="crop-chips-grid" role="radiogroup" aria-label={text.cropLabel}>
            {crops.map((crop) => {
              const isSelected = primaryCrop === crop.id
              return (
                <button
                  key={crop.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  className={`crop-chip ${isSelected ? 'is-selected' : ''}`}
                  onClick={() => setPrimaryCrop(crop.id)}
                >
                  <span className="crop-radio-dot" aria-hidden="true" />
                  <span>{crop.label}</span>
                </button>
              )
            })}
          </div>
        </fieldset>

        {/* Aadhaar Last 4 Digits (Optional) */}
        <div className="form-group">
          <label htmlFor="aadhaar-input" className="form-label">
            {text.aadhaarLabel}
          </label>
          <div className="input-with-icon">
            <input
              id="aadhaar-input"
              type="text"
              inputMode="numeric"
              maxLength={4}
              className="form-input"
              placeholder={text.aadhaarPlaceholder}
              value={aadhaarLast4}
              onChange={handleAadhaarChange}
            />
            <ShieldCheck className="input-icon" size={18} aria-hidden="true" />
          </div>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="form-error-banner" role="alert">
            <AlertCircle size={16} aria-hidden="true" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="step-actions button-row">
          <button type="button" className="quiet-button" onClick={onBack}>
            <ArrowLeft size={18} aria-hidden="true" />
            {text.backStep}
          </button>
          <motion.button
            type="submit"
            className="primary-button"
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.1, ease: 'easeOut' }}
          >
            {text.nextStep}
            <ArrowRight size={18} aria-hidden="true" />
          </motion.button>
        </div>
      </form>
    </div>
  )
}
