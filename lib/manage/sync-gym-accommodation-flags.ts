/**
 * Keep gyms.offers_accommodation + gyms.amenities.accommodation aligned with
 * active accommodation rows (and packages that include accommodation).
 * Search filters on amenities->accommodation; homepage also reads offers_accommodation.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { mergeGymAmenitiesFromDb } from '@/lib/constants/gym-amenities'

export async function syncGymAccommodationFlags(
  supabase: SupabaseClient,
  gymId: string,
): Promise<boolean | null> {
  const { count: activeRoomCount, error: roomErr } = await supabase
    .from('accommodations')
    .select('id', { count: 'exact', head: true })
    .eq('gym_id', gymId)
    .eq('is_active', true)

  if (roomErr) {
    console.error('[syncGymAccommodationFlags] accommodations count failed', roomErr.message)
    return null
  }

  const { data: accomPackages, error: pkgErr } = await supabase
    .from('packages')
    .select('id')
    .eq('gym_id', gymId)
    .eq('includes_accommodation', true)
    .limit(1)

  if (pkgErr) {
    console.error('[syncGymAccommodationFlags] packages check failed', pkgErr.message)
    return null
  }

  const shouldOffer = (activeRoomCount ?? 0) > 0 || (accomPackages?.length ?? 0) > 0

  const { data: gym, error: gymErr } = await supabase
    .from('gyms')
    .select('amenities')
    .eq('id', gymId)
    .maybeSingle()

  if (gymErr || !gym) return null

  const amenities = mergeGymAmenitiesFromDb(gym.amenities as Record<string, unknown> | null)
  amenities.accommodation = shouldOffer

  const { error: updateErr } = await supabase
    .from('gyms')
    .update({
      offers_accommodation: shouldOffer,
      amenities,
    })
    .eq('id', gymId)

  if (updateErr) {
    console.error('[syncGymAccommodationFlags] gym update failed', updateErr.message)
    return null
  }

  return shouldOffer
}
