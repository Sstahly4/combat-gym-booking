import { unstable_cache } from 'next/cache'
import { createPublicClient } from '@/lib/supabase/public-server'
import { attachReviewStatsPublic } from '@/lib/reviews/attach-review-stats-public'
import type { Offer } from '@/lib/types/database'
import {
  HOMEPAGE_CARD_GYM_SELECT,
  HOMEPAGE_SLIM_GYM_WITH_PACKAGES_SELECT,
} from '@/lib/homepage/homepage-gym-select'
import {
  buildHomepageRow,
  compareByQuality,
  deriveTopRatedGyms,
  HOMEPAGE_ROW_SIZE_DESKTOP,
  HOMEPAGE_ROW_SIZE_MOBILE,
  sortGymImages,
  type HomepageGym,
} from '@/lib/homepage/homepage-rows'

const LIVE_VERIFICATION = ['verified', 'trusted'] as const

const GYM_IMAGE_ORDER = {
  ascending: true,
  nullsFirst: false,
  foreignTable: 'gym_images' as const,
}

/** Sample size for the fast LCP row — quality-sorted in memory, not the full catalog. */
const FIRST_ROW_POOL_SIZE = 48

/** Cap homepage shelf / TripPlanner pool — avoids unbounded catalog fetch on cache miss. */
const HOMEPAGE_CATALOG_POOL_SIZE = 120

async function fetchSlimGymsWithPackages(): Promise<HomepageGym[]> {
  const supabase = createPublicClient()
  const { data } = await supabase
    .from('gyms')
    .select(HOMEPAGE_SLIM_GYM_WITH_PACKAGES_SELECT)
    .in('verification_status', [...LIVE_VERIFICATION])
    .order('order', GYM_IMAGE_ORDER)
    .limit(1, { foreignTable: 'gym_images' })
    .limit(HOMEPAGE_CATALOG_POOL_SIZE)

  const gyms = sortGymImages((data || []) as HomepageGym[])
  const withReviews = await attachReviewStatsPublic(gyms)
  return withReviews.sort((a, b) => {
    if (b.averageRating !== a.averageRating) return b.averageRating - a.averageRating
    if (b.reviewCount !== a.reviewCount) return b.reviewCount - a.reviewCount
    return String(a.name ?? '').localeCompare(String(b.name ?? ''))
  })
}

async function fetchFirstRowPool(): Promise<HomepageGym[]> {
  const supabase = createPublicClient()
  const { data } = await supabase
    .from('gyms')
    .select(HOMEPAGE_CARD_GYM_SELECT)
    .in('verification_status', [...LIVE_VERIFICATION])
    .order('order', GYM_IMAGE_ORDER)
    .limit(1, { foreignTable: 'gym_images' })
    .limit(FIRST_ROW_POOL_SIZE)

  return sortGymImages((data || []) as HomepageGym[])
}

async function fetchGymCountsByDiscipline(): Promise<Record<string, number>> {
  const supabase = createPublicClient()
  const { data } = await supabase
    .from('gyms')
    .select('disciplines')
    .eq('verification_status', 'verified')
    .eq('status', 'approved')

  if (!data) return {}

  const counts: Record<string, number> = {}
  const allDisciplines = ['Muay Thai', 'MMA', 'BJJ', 'Boxing', 'Wrestling', 'Kickboxing']

  allDisciplines.forEach((discipline) => {
    counts[discipline] = 0
  })

  data.forEach((gym) => {
    if (gym.disciplines && Array.isArray(gym.disciplines)) {
      gym.disciplines.forEach((d: string) => {
        if (allDisciplines.includes(d)) {
          counts[d] = (counts[d] || 0) + 1
        }
      })
    }
  })

  return counts
}

async function fetchOffers(): Promise<Offer[]> {
  const supabase = createPublicClient()
  const { data } = await supabase
    .from('offers')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  const now = new Date()

  return (data || [])
    .filter((offer: Offer) => {
      if (!offer.expires_at) return true
      return new Date(offer.expires_at) > now
    })
    .map((offer: Offer) => offer)
}

export const getHomepageFirstRowCached = unstable_cache(
  async () => {
    const pool = await fetchFirstRowPool()
    const withReviews = await attachReviewStatsPublic(pool)
    return buildHomepageRow({
      pool: withReviews,
      primary: () => true,
      sort: compareByQuality,
      used: new Set(),
      limit: HOMEPAGE_ROW_SIZE_MOBILE,
    })
  },
  ['homepage-first-row-v1'],
  { revalidate: 300 },
)

export const getHomepageDataCached = unstable_cache(
  async () => {
    const topRatedLimit = Math.max(HOMEPAGE_ROW_SIZE_DESKTOP, HOMEPAGE_ROW_SIZE_MOBILE)
    const [allGymsWithPackages, disciplineCounts, offers, firstRowGyms] = await Promise.all([
      fetchSlimGymsWithPackages(),
      fetchGymCountsByDiscipline(),
      fetchOffers(),
      getHomepageFirstRowCached(),
    ])

    const topRatedGyms = deriveTopRatedGyms(allGymsWithPackages, topRatedLimit)
    // Must be a plain array — unstable_cache JSON-serializes values; Set becomes {} and breaks spread.
    const firstRowIds = firstRowGyms.map((gym) => gym.id).filter(Boolean) as string[]

    return {
      allGymsWithPackages,
      topRatedGyms,
      disciplineCounts,
      offers,
      firstRowIds,
    }
  },
  ['homepage-redesign-data-v6'],
  { revalidate: 300 },
)
