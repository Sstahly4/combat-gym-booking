import { unstable_cache } from 'next/cache'
import { createPublicClient } from '@/lib/supabase/public-server'
import type { GymBusynessRecord } from '@/lib/gym/busyness-types'

export async function getGymBusyness(gymId: string): Promise<GymBusynessRecord | null> {
  const supabase = createPublicClient()
  const { data, error } = await supabase
    .from('gym_busyness')
    .select('id, gym_id, popular_times, source, updated_at')
    .eq('gym_id', gymId)
    .maybeSingle()

  if (error || !data) return null
  return data as GymBusynessRecord
}

export const getCachedGymBusyness = unstable_cache(
  async (gymId: string) => getGymBusyness(gymId),
  ['gym-busyness'],
  { revalidate: 3600, tags: ['gym-busyness'] },
)
