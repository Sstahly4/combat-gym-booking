/**
 * One-direction sync: cheapest package price_per_day (matching gym currency) → gyms.price_per_day.
 *
 * Rules (per product spec):
 *  - Only considers packages whose currency matches the gym's base currency
 *  - Only updates if gyms.price_per_day === 0 OR new cheapest < current gym price
 *  - Never overrides a manually set price that is already lower than all packages
 *  - Only reads price_per_day on packages (rate-mode packages); fixed-mode packages
 *    with null price_per_day are excluded — acceptable limitation for now
 *
 * Returns the new price if an update was made, null otherwise.
 */

import type { SupabaseClient } from '@supabase/supabase-js'

export async function syncGymSearchPrice(
  supabase: SupabaseClient,
  gymId: string,
): Promise<number | null> {
  // 1. Get gym base currency + current search listing price
  const { data: gym, error: gymErr } = await supabase
    .from('gyms')
    .select('price_per_day, currency')
    .eq('id', gymId)
    .maybeSingle()

  if (gymErr || !gym) return null

  const gymCurrency = gym.currency || 'USD'

  const current = Number(gym.price_per_day) || 0

  // 2. Cheapest package rate in the gym's currency only (ignore cross-currency packages)
  const { data: packages, error: pkgErr } = await supabase
    .from('packages')
    .select('price_per_day')
    .eq('gym_id', gymId)
    .eq('currency', gymCurrency)
    .not('price_per_day', 'is', null)
    .gt('price_per_day', 0)

  if (pkgErr || !packages || packages.length === 0) {
    console.info('[syncGymSearchPrice] no currency-matched packages found', {
      gymId,
      gymCurrency,
    })
    return null
  }

  const cheapest = Math.min(...packages.map((p) => Number(p.price_per_day)))
  if (!isFinite(cheapest) || cheapest <= 0) return null

  // 3. Only update if gym price is 0 (never set) or cheapest package is lower
  if (current !== 0 && current <= cheapest) return null

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
