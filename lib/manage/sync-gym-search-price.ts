/**
 * Sync gyms.price_per_day from package rates (search “starting from” price).
 *
 * Packages are the source of truth — includes twice-daily, once-daily, variants,
 * and pricing_config daily equivalents. Only packages in the gym's base currency count.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import {
  lowestSearchPricePerDay,
  type PackageSearchPriceRow,
} from '@/lib/manage/gym-search-listing-price'

export async function syncGymSearchPrice(
  supabase: SupabaseClient,
  gymId: string,
): Promise<number | null> {
  const { data: gym, error: gymErr } = await supabase
    .from('gyms')
    .select('currency')
    .eq('id', gymId)
    .maybeSingle()

  if (gymErr || !gym) return null

  const gymCurrency = gym.currency || 'USD'

  const { data: packages, error: pkgErr } = await supabase
    .from('packages')
    .select(
      'price_per_day, once_daily_price_per_day, currency, pricing_config, variants:package_variants(price_per_day, once_daily_price_per_day)',
    )
    .eq('gym_id', gymId)

  if (pkgErr || !packages || packages.length === 0) {
    return null
  }

  const cheapest = lowestSearchPricePerDay(packages as PackageSearchPriceRow[], gymCurrency)
  if (cheapest === null) return null

  const { error: updateErr } = await supabase
    .from('gyms')
    .update({ price_per_day: cheapest })
    .eq('id', gymId)

  if (updateErr) {
    console.error('[syncGymSearchPrice] update failed', updateErr)
    return null
  }

  return cheapest
}
