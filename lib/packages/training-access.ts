/**
 * Sessions-per-day terminology for training packages.
 *
 * Note: `flexible_daily` is deprecated (merged into `once_daily`) but is still
 * accepted for backward compatibility until all rows are normalized.
 */
export type PackageTrainingAccess = 'twice_daily' | 'once_daily' | 'flexible_daily'

export type NormalizedPackageTrainingAccess = 'twice_daily' | 'once_daily'

export type TrainingTier = NormalizedPackageTrainingAccess

export const TRAINING_TIER_DEFAULT: TrainingTier = 'twice_daily'

export const TRAINING_ACCESS_OPTIONS: {
  value: NormalizedPackageTrainingAccess
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
    subtitle: 'Flexible Choice',
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

export function normalizeTrainingAccess(
  value: PackageTrainingAccess | null | undefined
): NormalizedPackageTrainingAccess | null {
  if (!value) return null
  if (value === 'flexible_daily') return 'once_daily'
  return value
}

export function getTrainingAccessMeta(value: PackageTrainingAccess | null | undefined) {
  const normalized = normalizeTrainingAccess(value)
  if (!normalized) return null
  return TRAINING_ACCESS_OPTIONS.find((o) => o.value === normalized) ?? null
}

/** Review/checkout summary row — guest-selected tier at booking time. */
export function trainingTierCheckoutLabel(tier: TrainingTier): string {
  return tier === 'once_daily' ? 'Once Daily (Flexible)' : 'Twice Daily (Full Access)'
}

export function parseTrainingTier(value: string | null | undefined): TrainingTier {
  return value === 'once_daily' ? 'once_daily' : TRAINING_TIER_DEFAULT
}

export function packageShowsTrainingTierSelection(pkg: {
  type?: string | null
  offer_type?: string | null
} | null | undefined): boolean {
  if (!pkg) return false
  if (pkg.type === 'training') return true
  return offerTypeUsesTrainingAccess(pkg.offer_type)
}

/** True when a cheaper once-daily track is configured (variant or package-level). */
export function offersOnceDailyTrainingChoice(
  pkg: {
    type?: string | null
    offer_type?: string | null
    once_daily_price_per_day?: number | null
  } | null
  | undefined,
  variant: { once_daily_price_per_day?: number | null } | null | undefined
): boolean {
  if (!packageShowsTrainingTierSelection(pkg)) return false
  if (variant) return variant.once_daily_price_per_day != null
  return pkg?.once_daily_price_per_day != null
}

/** Short label for package cards and checkout rows. */
export function trainingAccessCardLabel(value: PackageTrainingAccess | null | undefined): string | null {
  const meta = getTrainingAccessMeta(value)
  return meta ? meta.label : null
}

/** Inclusion line for checkout / what's included. */
export function trainingAccessInclusionLabel(value: PackageTrainingAccess | null | undefined): string | null {
  switch (normalizeTrainingAccess(value)) {
    case 'twice_daily':
      return 'Twice daily training (morning + evening)'
    case 'once_daily':
      return 'Once daily training (choose morning or evening)'
    default:
      return null
  }
}

/** Accordion subtitle when package defines access explicitly. */
export function trainingAccessAccordionSubtitle(value: PackageTrainingAccess | null | undefined): string | null {
  switch (normalizeTrainingAccess(value)) {
    case 'twice_daily':
      return '2 sessions per day · morning + evening'
    case 'once_daily':
      return '1 session per day · choose morning or evening'
    default:
      return null
  }
}
