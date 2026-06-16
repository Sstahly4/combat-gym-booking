import { calculatePackagePrice, type PriceBreakdown } from '@/lib/utils'
import { nightsBetween } from '@/lib/booking/recalculate-booking-price'
import type { Package, PackageSeasonalRate, PackageVariant } from '@/lib/types/database'

function addCalendarDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T12:00:00`)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

/** Calendar dates covered by the stay (training includes checkout day). */
export function calendarDatesForStay(
  startDate: string,
  endDate: string,
  isTraining: boolean
): string[] {
  const dates: string[] = []
  let current = startDate
  while (current < endDate) {
    dates.push(current)
    current = addCalendarDays(current, 1)
  }
  if (isTraining) {
    dates.push(endDate)
  }
  return dates
}

function asMoney(value: number | string | null | undefined): number | null {
  if (value == null || value === '') return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function pickSeasonalRuleForDate(
  dateStr: string,
  seasonalRates: PackageSeasonalRate[],
  variantId?: string | null
): PackageSeasonalRate | undefined {
  const applicable = seasonalRates.filter((rule) => {
    if (dateStr < rule.start_date || dateStr > rule.end_date) return false
    if (rule.variant_id && rule.variant_id !== variantId) return false
    return true
  })

  if (applicable.length === 0) return undefined

  // Prefer variant-specific rules over package-wide rules.
  applicable.sort((a, b) => {
    const aVariant = a.variant_id ? 1 : 0
    const bVariant = b.variant_id ? 1 : 0
    return bVariant - aVariant
  })

  return applicable[0]
}

/**
 * Blended-rate pre-pass: average tier rates across each calendar day of the stay,
 * then run the existing weekly/monthly waterfall on the blended tier.
 */
export function computeBookingPriceWithSeasons(
  startDate: string,
  endDate: string,
  package_: Pick<
    Package,
    'id' | 'type' | 'price_per_day' | 'price_per_week' | 'price_per_month'
  >,
  seasonalRates: PackageSeasonalRate[],
  variant?: Pick<
    PackageVariant,
    'id' | 'price_per_day' | 'price_per_week' | 'price_per_month'
  > | null
): PriceBreakdown | null {
  const nights = nightsBetween(startDate, endDate)
  if (nights <= 0) return null

  const isTraining = package_.type === 'training'
  const duration = isTraining ? Math.max(1, nights + 1) : nights

  const calendarDates = calendarDatesForStay(startDate, endDate, isTraining)
  if (calendarDates.length === 0) return null

  let cumulativeDaily = 0
  let cumulativeWeekly = 0
  let cumulativeMonthly = 0

  for (const dateStr of calendarDates) {
    const activeRule = pickSeasonalRuleForDate(dateStr, seasonalRates, variant?.id)

    cumulativeDaily +=
      asMoney(activeRule?.price_per_day) ??
      asMoney(variant?.price_per_day) ??
      asMoney(package_.price_per_day) ??
      0
    cumulativeWeekly +=
      asMoney(activeRule?.price_per_week) ??
      asMoney(variant?.price_per_week) ??
      asMoney(package_.price_per_week) ??
      0
    cumulativeMonthly +=
      asMoney(activeRule?.price_per_month) ??
      asMoney(variant?.price_per_month) ??
      asMoney(package_.price_per_month) ??
      0
  }

  const dayCount = calendarDates.length
  const blendedPrices = {
    daily: cumulativeDaily / dayCount,
    weekly: cumulativeWeekly / dayCount,
    monthly: cumulativeMonthly / dayCount,
  }

  return calculatePackagePrice(duration, package_.type, blendedPrices)
}
