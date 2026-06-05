/**
 * One-direction sync: cheapest active package price_per_day → gyms.price_per_day.
 *
 * Rules (per product spec):
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
  // 1. Find cheapest active package price_per_day for this gym
  const { data: packages, error: pkgErr } = await supabase
    .from('packages')
    .select('price_per_day')
    .eq('gym_id', gymId)
    .not('price_per_day', 'is', null)
    .gt('price_per_day', 0)

  if (pkgErr || !packages || packages.length === 0) return null

  const cheapest = Math.min(...packages.map((p) => Number(p.price_per_day)))
  if (!isFinite(cheapest) || cheapest <= 0) return null

  // 2. Get current gym price
  const { data: gym, error: gymErr } = await supabase
    .from('gyms')
    .select('price_per_day')
    .eq('id', gymId)
    .maybeSingle()

  if (gymErr || !gym) return null

  const current = Number(gym.price_per_day) || 0

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
