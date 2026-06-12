import { unstable_cache } from 'next/cache'
import { createPublicClient } from '@/lib/supabase/public-server'
import { attachReviewStatsPublic } from '@/lib/reviews/attach-review-stats-public'
import { gymListsDiscipline } from '@/lib/guides/discipline-match'
import type { Gym, GymImage, VerificationStatus } from '@/lib/types/database'

export type GuideGym = Gym & {
  images?: Array<Pick<GymImage, 'url' | 'variants' | 'order'>>
  /** Present when column exists on row */
  training_schedule?: Record<string, Array<{ time: string; type?: string }>>
  averageRating: number
  reviewCount: number
}

export type ThailandGuideFilters = {
  discipline?: string
  /** Match cities containing this string (e.g. Phuket matches "Phuket Town") */
  city?: string
  limit?: number
}

const LIVE_STATUSES: VerificationStatus[] = ['verified', 'trusted']

function normalizeDiscipline(discipline: string) {
  return discipline.trim().toLowerCase()
}

function postFilterByDiscipline(gyms: GuideGym[], discipline?: string): GuideGym[] {
  if (!discipline) return gyms
  const d = normalizeDiscipline(discipline)
  if (d === 'muay thai') return gyms.filter((g) => gymListsDiscipline(g.disciplines, 'Muay Thai'))
  if (d === 'mma') return gyms.filter((g) => gymListsDiscipline(g.disciplines, 'MMA'))
  if (d === 'bjj') return gyms.filter((g) => gymListsDiscipline(g.disciplines, 'BJJ'))
  if (d === 'boxing') return gyms.filter((g) => gymListsDiscipline(g.disciplines, 'Boxing'))
  if (d === 'kickboxing' || d === 'kick boxing' || d === 'k-1' || d === 'k1') {
    return gyms.filter((g) => gymListsDiscipline(g.disciplines, 'Kickboxing'))
  }
  if (d === 'judo') return gyms.filter((g) => gymListsDiscipline(g.disciplines, 'Judo'))
  return gyms
}

function sortGuideGyms(gyms: GuideGym[]): GuideGym[] {
  return [...gyms].sort((a, b) => {
    if (b.averageRating !== a.averageRating) return b.averageRating - a.averageRating
    if (b.reviewCount !== a.reviewCount) return b.reviewCount - a.reviewCount
    return (a.name || '').localeCompare(b.name || '')
  })
}

function sortGymImages(gyms: GuideGym[]): GuideGym[] {
  gyms.forEach((gym) => {
    if (gym.images && Array.isArray(gym.images)) {
      gym.images.sort((a, b) => (a.order || 0) - (b.order || 0))
    }
  })
  return gyms
}

/** One cached Thailand pool — all guide pages filter in memory instead of re-querying. */
const getThailandGuidePoolCached = unstable_cache(
  async (): Promise<GuideGym[]> => {
    const supabase = createPublicClient()
    const { data } = await supabase
      .from('gyms')
      .select('*, images:gym_images(url, variants, order)')
      .in('verification_status', LIVE_STATUSES)
      .ilike('country', '%Thailand%')

    const gyms = sortGymImages((data || []) as GuideGym[])
    return (await attachReviewStatsPublic(gyms)) as GuideGym[]
  },
  ['thailand-guide-pool-v1'],
  { revalidate: 3600 },
)

export async function getThailandGymsForGuide(filters: ThailandGuideFilters = {}): Promise<GuideGym[]> {
  let gyms = await getThailandGuidePoolCached()

  if (filters.city) {
    const needle = filters.city.trim().toLowerCase()
    gyms = gyms.filter((g) => (g.city || '').toLowerCase().includes(needle))
  }

  if (filters.discipline) {
    gyms = postFilterByDiscipline(gyms, filters.discipline)
  }

  const sorted = sortGuideGyms(gyms)

  const limit = typeof filters.limit === 'number' ? filters.limit : undefined
  return typeof limit === 'number' ? sorted.slice(0, Math.max(0, limit)) : sorted
}

export function groupGymsByCity(gyms: GuideGym[]): Array<{ city: string; gyms: GuideGym[] }> {
  const map = new Map<string, GuideGym[]>()
  gyms.forEach((g) => {
    const key = g.city || ''
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(g)
  })

  return Array.from(map.entries())
    .map(([city, list]) => ({ city, gyms: list }))
    .sort((a, b) => a.city.toLowerCase().localeCompare(b.city.toLowerCase()))
}
