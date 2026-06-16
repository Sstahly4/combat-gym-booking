import { createClient } from '@/lib/supabase/client'
import { computeBreakdownForStay } from '@/lib/booking/resolve-booking-price'
import { calculatePackagePrice, type PriceBreakdown } from '@/lib/utils'
import type { Package, PackageSeasonalRate, PackageVariant } from '@/lib/types/database'

const SEASONAL_NOTE =
  'Rates vary by season; blended pricing applies across your selected dates.'

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
}): Promise<{ breakdown: PriceBreakdown; seasonalNote: string | null }> {
  const { package_, variant, pricingDuration, checkin, checkout } = input

  const basePrices = {
    daily: variant?.price_per_day ?? package_.price_per_day,
    weekly: variant?.price_per_week ?? package_.price_per_week,
    monthly: variant?.price_per_month ?? package_.price_per_month,
  }

  const fallback = calculatePackagePrice(pricingDuration, package_.type, basePrices)

  if (!checkin || !checkout) {
    return { breakdown: fallback, seasonalNote: null }
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
    return { breakdown: fallback, seasonalNote: null }
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
    return { breakdown: fallback, seasonalNote: null }
  }

  return { breakdown: seasonalBreakdown, seasonalNote: SEASONAL_NOTE }
}
