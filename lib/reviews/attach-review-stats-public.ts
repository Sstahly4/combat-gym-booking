import { createPublicClient } from '@/lib/supabase/public-server'

export type WithReviewStats<T> = T & {
  averageRating: number
  reviewCount: number
}

export async function attachReviewStatsPublic<T extends { id?: string | null }>(
  gyms: T[]
): Promise<Array<WithReviewStats<T>>> {
  if (!gyms || gyms.length === 0) return (gyms || []) as Array<WithReviewStats<T>>

  const ids = gyms.map((g) => g.id).filter(Boolean) as string[]
  if (ids.length === 0) return gyms as Array<WithReviewStats<T>>

  const supabase = createPublicClient()
  const { data: reviews } = await supabase
    .from('reviews')
    .select('gym_id, rating')
    .in('gym_id', ids)

  const byGym: Record<string, number[]> = {}
  reviews?.forEach((r: any) => {
    if (!r?.gym_id || typeof r.rating !== 'number') return
    if (!byGym[r.gym_id]) byGym[r.gym_id] = []
    byGym[r.gym_id].push(r.rating)
  })

  return gyms.map((gym) => {
    const ratings = (gym.id && byGym[gym.id]) || []
    const averageRating = ratings.length > 0 ? ratings.reduce((s, n) => s + n, 0) / ratings.length : 0
    return {
      ...gym,
      averageRating,
      reviewCount: ratings.length,
    }
  })
}

