export type PackageTrainingAccess = 'twice_daily' | 'once_daily' | 'flexible_daily'

export const TRAINING_ACCESS_OPTIONS: {
  value: PackageTrainingAccess
  label: string
  subtitle: string
  description: string
}[] = [
  {
    value: 'twice_daily',
    label: 'Twice Daily',
    subtitle: 'Full Access',
    description: 'Morning and evening sessions — the standard fight-camp routine.',
  },
  {
    value: 'once_daily',
    label: 'Once Daily',
    subtitle: 'Lite Access',
    description: 'One formal session per day at a fixed time block.',
  },
  {
    value: 'flexible_daily',
    label: 'Flexible Session Choice',
    subtitle: 'Once daily · your pick',
    description: 'One session per day — guest chooses morning or evening each day.',
  },
]

const TRAINING_OFFER_TYPES = new Set([
  'TYPE_TRAINING_ONLY',
  'TYPE_TRAINING_ACCOM',
  'TYPE_ALL_INCLUSIVE',
  'TYPE_CUSTOM_EXP',
])

export function offerTypeUsesTrainingAccess(offerType: string | null | undefined): boolean {
  return !!offerType && TRAINING_OFFER_TYPES.has(offerType)
}

export function isPackageTrainingAccess(value: string | null | undefined): value is PackageTrainingAccess {
  return value === 'twice_daily' || value === 'once_daily' || value === 'flexible_daily'
}

export function getTrainingAccessMeta(value: PackageTrainingAccess | null | undefined) {
  if (!value) return null
  return TRAINING_ACCESS_OPTIONS.find((o) => o.value === value) ?? null
}

/** Short label for package cards and checkout rows. */
export function trainingAccessCardLabel(value: PackageTrainingAccess | null | undefined): string | null {
  const meta = getTrainingAccessMeta(value)
  return meta ? meta.label : null
}

/** Inclusion line for checkout / what's included. */
export function trainingAccessInclusionLabel(value: PackageTrainingAccess | null | undefined): string | null {
  switch (value) {
    case 'twice_daily':
      return 'Twice daily training (morning + evening)'
    case 'once_daily':
      return 'Once daily training'
    case 'flexible_daily':
      return 'Flexible session choice (morning or evening)'
    default:
      return null
  }
}

/** Accordion subtitle when package defines access explicitly. */
export function trainingAccessAccordionSubtitle(value: PackageTrainingAccess | null | undefined): string | null {
  switch (value) {
    case 'twice_daily':
      return '2 sessions per day · morning + evening'
    case 'once_daily':
      return '1 session per day'
    case 'flexible_daily':
      return '1 session per day · choose morning or evening'
    default:
      return null
  }
}
