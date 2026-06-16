import type { PackageSeasonalRate } from '@/lib/types/database'

export type SeasonalRateScope = {
  variant_id: string | null
  start_date: string
  end_date: string
}

/** True when two rules conflict for the same variant scope (used for form validation). */
export function seasonalRateScopesOverlap(
  a: SeasonalRateScope,
  b: SeasonalRateScope
): boolean {
  if (a.start_date > b.end_date || b.start_date > a.end_date) return false

  const aAll = a.variant_id == null
  const bAll = b.variant_id == null
  if (aAll && bAll) return true
  if (!aAll && !bAll && a.variant_id === b.variant_id) return true
  return false
}

export function findOverlappingSeasonalRate(
  candidate: SeasonalRateScope,
  existing: PackageSeasonalRate[],
  excludeId?: string | null
): PackageSeasonalRate | undefined {
  return existing.find((rule) => {
    if (excludeId && rule.id === excludeId) return false
    return seasonalRateScopesOverlap(candidate, {
      variant_id: rule.variant_id,
      start_date: rule.start_date,
      end_date: rule.end_date,
    })
  })
}

export function hasAtLeastOneSeasonalTier(input: {
  price_per_day: string
  price_per_week: string
  price_per_month: string
}): boolean {
  return [input.price_per_day, input.price_per_week, input.price_per_month].some(
    (v) => v.trim() !== '' && Number.isFinite(Number(v)) && Number(v) >= 0
  )
}

export function formatSeasonalDateWindow(start: string, end: string): string {
  const fmt = (iso: string) => {
    const d = new Date(`${iso}T12:00:00`)
    return d.toLocaleDateString(undefined, { month: 'short', day: '2-digit' })
  }
  return `${fmt(start)} – ${fmt(end)}`
}

export function formatSeasonalOverrides(
  rule: Pick<PackageSeasonalRate, 'price_per_day' | 'price_per_week' | 'price_per_month'>,
  currency: string
): string {
  const parts: string[] = []
  if (rule.price_per_day != null) {
    parts.push(`Daily: ${currency} ${Number(rule.price_per_day).toLocaleString()}`)
  }
  if (rule.price_per_week != null) {
    parts.push(`Weekly: ${currency} ${Number(rule.price_per_week).toLocaleString()}`)
  }
  if (rule.price_per_month != null) {
    parts.push(`Monthly: ${currency} ${Number(rule.price_per_month).toLocaleString()}`)
  }
  return parts.join(' · ') || '—'
}

export function isoTodayLocal(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
