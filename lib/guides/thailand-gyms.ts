import { createClient } from '@/lib/supabase/server'
import { attachReviewStats } from '@/lib/reviews/attach-review-stats'
import { gymListsDiscipline } from '@/lib/guides/discipline-match'
import type { Gym, GymImage, VerificationStatus } from '@/lib/types/database'

export type GuideGym = Gym & {
  images?: Array<Pick<GymImage, 'url' | 'order'>>
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

function quoteArrayLiteralValue(value: string) {
  const escaped = value.replaceAll('"', '\\"')
  return `"${escaped}"`
}

// Broad DB pre-filter; we always apply gymListsDiscipline() after fetch for accuracy.
function disciplineVariants(discipline: string): string[] {
  const d = normalizeDiscipline(discipline)
  if (d === 'muay thai') return ['Muay Thai', 'muay thai', 'MuayThai', 'Muay-Thai']
  if (d === 'mma') return ['MMA', 'Mixed Martial Arts', 'mixed martial arts', 'mma']
  if (d === 'bjj' || d === 'jiu jitsu' || d === 'brazilian jiu jitsu') {
    return ['BJJ', 'bjj', 'Brazilian Jiu Jitsu', 'Brazilian Jiu-Jitsu', 'Jiu Jitsu', 'Jiu-Jitsu', 'No-Gi']
  }
  if (d === 'boxing') return ['Boxing', 'boxing']
  if (d === 'kickboxing' || d === 'kick boxing' || d === 'k1' || d === 'k-1') {
    return ['Kickboxing', 'kickboxing', 'Kick Boxing', 'kick boxing', 'K-1', 'K1']
  }
  if (d === 'judo') return ['Judo', 'judo']
  return [discipline]
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

export async function getThailandGymsForGuide(filters: ThailandGuideFilters = {}): Promise<GuideGym[]> {
  const supabase = await createClient()

  let query = supabase
    .from('gyms')
    .select('*, images:gym_images(url, order)')
    .in('verification_status', LIVE_STATUSES)
    .ilike('country', '%Thailand%')

  if (filters.city) {
    const c = filters.city.trim()
    query = query.ilike('city', `%${c}%`)
  }

  if (filters.discipline) {
    const variants = disciplineVariants(filters.discipline)
    const orExpr = variants.map((v) => `disciplines.cs.{${quoteArrayLiteralValue(v)}}`).join(',')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    query = (query as any).or(orExpr)
  }

  const { data } = await query

  let gyms = (data || []) as GuideGym[]

  gyms.forEach((gym) => {
    if (gym.images && Array.isArray(gym.images)) {
      gym.images.sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
    }
  })

  // Guarantee discipline relevance (only BJJ gyms on BJJ page, etc.)
  gyms = postFilterByDiscipline(gyms, filters.discipline)

  const withReviews = await attachReviewStats(gyms as any)
  const sorted = withReviews.sort((a: any, b: any) => {
    if (b.averageRating !== a.averageRating) return b.averageRating - a.averageRating
    if (b.reviewCount !== a.reviewCount) return b.reviewCount - a.reviewCount
    return (a.name || '').localeCompare(b.name || '')
  }) as GuideGym[]

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
