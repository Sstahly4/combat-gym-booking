import { unstable_cache } from 'next/cache'
import { createPublicClient } from '@/lib/supabase/public-server'
import { PUBLIC_GYM_VERIFICATION_STATUSES } from '@/lib/seo/gym-public-status'
import type { GymBusynessRecord, PopularTimes } from '@/lib/gym/busyness-types'
import { hasMeaningfulBusynessData } from '@/lib/gym/busyness-types'

type BusynessRow = Pick<GymBusynessRecord, 'id' | 'gym_id' | 'popular_times' | 'source' | 'updated_at'>

async function fetchGymCity(gymId: string): Promise<string | null> {
  const supabase = createPublicClient()
  const { data } = await supabase.from('gyms').select('city').eq('id', gymId).maybeSingle()
  const city = data?.city?.trim()
  return city || null
}

async function fetchCityGoogleBusyness(
  gymId: string,
  city: string,
): Promise<Pick<BusynessRow, 'popular_times' | 'updated_at'> | null> {
  const supabase = createPublicClient()

  const { data: cityGyms, error: gymsError } = await supabase
    .from('gyms')
    .select('id')
    .eq('status', 'approved')
    .in('verification_status', [...PUBLIC_GYM_VERIFICATION_STATUSES])
    .ilike('city', city)
    .neq('id', gymId)

  if (gymsError || !cityGyms?.length) return null

  const peerIds = cityGyms.map((g) => g.id)
  const { data: peers, error: peersError } = await supabase
    .from('gym_busyness')
    .select('popular_times, updated_at, source')
    .in('gym_id', peerIds)
    .eq('source', 'google')
    .order('updated_at', { ascending: false })

  if (peersError || !peers?.length) return null

  for (const peer of peers) {
    const popularTimes = peer.popular_times as PopularTimes
    if (hasMeaningfulBusynessData(popularTimes)) {
      return { popular_times: popularTimes, updated_at: peer.updated_at }
    }
  }

  return null
}

/**
 * Template gyms borrow a same-city Google curve at read time when available.
 * The DB row stays `template`; display uses `nearby_clone` for chart styling.
 */
async function resolveBusynessRecord(record: BusynessRow, gymId: string): Promise<GymBusynessRecord> {
  if (record.source !== 'template') {
    return record as GymBusynessRecord
  }

  const city = await fetchGymCity(gymId)
  if (!city) return record as GymBusynessRecord

  const cityPeer = await fetchCityGoogleBusyness(gymId, city)
  if (!cityPeer) return record as GymBusynessRecord

  return {
    ...record,
    popular_times: cityPeer.popular_times,
    source: 'nearby_clone',
    updated_at: cityPeer.updated_at,
  } as GymBusynessRecord
}

export async function getGymBusyness(gymId: string): Promise<GymBusynessRecord | null> {
  const supabase = createPublicClient()
  const { data, error } = await supabase
    .from('gym_busyness')
    .select('id, gym_id, popular_times, source, updated_at')
    .eq('gym_id', gymId)
    .maybeSingle()

  if (error || !data) return null
  return resolveBusynessRecord(data as BusynessRow, gymId)
}

export const getCachedGymBusyness = unstable_cache(
  async (gymId: string) => getGymBusyness(gymId),
  ['gym-busyness'],
  { revalidate: 3600, tags: ['gym-busyness'] },
)
