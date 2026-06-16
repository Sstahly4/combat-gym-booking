import { createClient } from '@/lib/supabase/client'
import { computeBreakdownForStay } from '@/lib/booking/resolve-booking-price'
import { calculatePackagePrice, type PriceBreakdown } from '@/lib/utils'
import { calendarDatesForStay } from '@/lib/booking/resolve-seasonal-prices'
import type { Package, PackageSeasonalRate, PackageVariant } from '@/lib/types/database'

/**
 * Client-side pricing for checkout previews — mirrors server create/PATCH path
 * when seasonal rates exist for the stay window.
 */
export async function resolveClientPriceBreakdown(input: {
  package_: Pick<
    Package,
    'id' | 'type' | 'price_per_day' | 'price_per_week' | 'price_per_month'
  >
  variant: Pick<
    PackageVariant,
    'id' | 'price_per_day' | 'price_per_week' | 'price_per_month'
  > | null
  pricingDuration: number
  checkin: string
  checkout: string
}): Promise<{ breakdown: PriceBreakdown; has_seasonal_overlap: boolean }> {
  const { package_, variant, pricingDuration, checkin, checkout } = input

  const basePrices = {
    daily: variant?.price_per_day ?? package_.price_per_day,
    weekly: variant?.price_per_week ?? package_.price_per_week,
    monthly: variant?.price_per_month ?? package_.price_per_month,
  }

  const fallback = calculatePackagePrice(pricingDuration, package_.type, basePrices)

  if (!checkin || !checkout) {
    return { breakdown: fallback, has_seasonal_overlap: false }
  }

  const supabase = createClient()
  const { data: seasonalRows } = await supabase
    .from('package_seasonal_rates')
    .select('*')
    .eq('package_id', package_.id)
    .lte('start_date', checkout)
    .gte('end_date', checkin)

  const rates = (seasonalRows ?? []) as PackageSeasonalRate[]
  if (rates.length === 0) {
    return { breakdown: fallback, has_seasonal_overlap: false }
  }

  const seasonalBreakdown = computeBreakdownForStay(
    package_.id,
    package_,
    variant,
    rates,
    checkin,
    checkout
  )

  if (!seasonalBreakdown) {
    return { breakdown: fallback, has_seasonal_overlap: false }
  }

  const isTraining = package_.type === 'training'
  const calendarDates = calendarDatesForStay(checkin, checkout, isTraining)
  const activeRuleIds = new Set<string>()

  for (const dateStr of calendarDates) {
    const applicable = rates.filter((rule) => {
      if (rule.variant_id && variant?.id && rule.variant_id !== variant.id) return false
      if (rule.variant_id && !variant?.id) return false
      return rule.start_date <= dateStr && rule.end_date >= dateStr
    })
    if (applicable.length === 0) continue
    applicable.sort((a, b) => {
      // Prefer variant-specific rules, then most recently-started rule.
      const aSpecific = a.variant_id ? 1 : 0
      const bSpecific = b.variant_id ? 1 : 0
      if (aSpecific !== bSpecific) return bSpecific - aSpecific
      if (a.start_date !== b.start_date) return b.start_date.localeCompare(a.start_date)
      return String(b.id).localeCompare(String(a.id))
    })
    activeRuleIds.add(String(applicable[0].id))
    if (activeRuleIds.size > 1) break
  }

  return { breakdown: seasonalBreakdown, has_seasonal_overlap: activeRuleIds.size > 1 }
}
