import { unstable_cache } from 'next/cache'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { createPublicClient } from '@/lib/supabase/public-server'
import type { Gym, GymImage, Package } from '@/lib/types/database'
import type { GymReview } from '@/lib/gym/gym-reviews-data'

export function looksLikeUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  )
}

export interface GymListing extends Gym {
  images: GymImage[]
  owner: { full_name: string | null }
  packages: Package[]
  reviewCount: number
  averageRating: number
  opening_hours?: Record<string, string>
  training_schedule?: Record<string, Array<{ time: string; type?: string }>>
}

export const GYM_LISTING_SELECT = `
  *,
  packages(*, variants:package_variants(*)),
  images:gym_images(*),
  owner:profiles!gyms_owner_id_fkey(full_name)
`

function sortGymImages(images: GymImage[]): GymImage[] {
  return [...images].sort((a, b) => {
    const orderA = a.order !== null && a.order !== undefined ? a.order : 999
    const orderB = b.order !== null && b.order !== undefined ? b.order : 999
    return orderA - orderB
  })
}

/** Ratings-only aggregate for header stars and JSON-LD — no review bodies. */
export async function fetchGymReviewStats(
  supabase: SupabaseClient,
  gymId: string,
): Promise<{ reviewCount: number; averageRating: number }> {
  const [bookingRes, manualRes] = await Promise.all([
    supabase.from('bookings').select('reviews(rating)').eq('gym_id', gymId),
    supabase
      .from('reviews')
      .select('rating')
      .eq('gym_id', gymId)
      .eq('manual_review', true),
  ])

  if (bookingRes.error) {
    console.error('Error fetching booking review stats:', bookingRes.error)
  }
  if (manualRes.error) {
    console.error('Error fetching manual review stats:', manualRes.error)
  }

  const ratings: number[] = []
  for (const booking of bookingRes.data || []) {
    for (const review of (booking as { reviews?: { rating?: number }[] }).reviews || []) {
      if (typeof review.rating === 'number') ratings.push(review.rating)
    }
  }
  for (const review of manualRes.data || []) {
    if (typeof review.rating === 'number') ratings.push(review.rating)
  }

  const reviewCount = ratings.length
  const averageRating =
    reviewCount > 0 ? ratings.reduce((sum, r) => sum + r, 0) / reviewCount : 0

  return { reviewCount, averageRating }
}

function assembleGymListing(
  gymData: Record<string, unknown> | null,
  stats: { reviewCount: number; averageRating: number },
): GymListing | null {
  if (!gymData) return null

  const rawImages = (gymData.images as GymImage[] | undefined) || []
  const { images: _images, ...rest } = gymData

  return {
    ...(rest as unknown as Gym),
    images: sortGymImages(rawImages),
    reviewCount: stats.reviewCount,
    averageRating: stats.averageRating,
  } as GymListing
}

async function loadPublicGymRow(
  supabase: SupabaseClient,
  filter: { column: 'id' | 'slug'; value: string },
): Promise<GymListing | null> {
  const gymQuery = supabase
    .from('gyms')
    .select(GYM_LISTING_SELECT)
    .in('verification_status', ['verified', 'trusted'])

  const { data: gymData, error } =
    filter.column === 'id'
      ? await gymQuery.eq('id', filter.value).maybeSingle()
      : await gymQuery.eq('slug', filter.value).maybeSingle()

  if (error) {
    console.error('Error fetching public gym:', error)
    return null
  }
  if (!gymData?.id) return null

  const stats = await fetchGymReviewStats(supabase, gymData.id as string)
  return assembleGymListing(gymData as Record<string, unknown>, stats)
}

export const getPublicGym = unstable_cache(
  async (id: string): Promise<GymListing | null> => {
    try {
      const supabase = createPublicClient()
      const [gymRes, stats] = await Promise.all([
        supabase
          .from('gyms')
          .select(GYM_LISTING_SELECT)
          .eq('id', id)
          .in('verification_status', ['verified', 'trusted'])
          .maybeSingle(),
        fetchGymReviewStats(supabase, id),
      ])
      if (gymRes.error) {
        console.error('Error fetching public gym:', gymRes.error)
        return null
      }
      return assembleGymListing(gymRes.data as Record<string, unknown> | null, stats)
    } catch (err) {
      console.error('Error in getPublicGym:', err)
      return null
    }
  },
  ['gym-detail'],
  { revalidate: 3600, tags: ['gyms'] },
)

export const getPublicGymBySlug = unstable_cache(
  async (slug: string): Promise<GymListing | null> => {
    try {
      const supabase = createPublicClient()
      return await loadPublicGymRow(supabase, { column: 'slug', value: slug })
    } catch (err) {
      console.error('Error in getPublicGymBySlug:', err)
      return null
    }
  },
  ['gym-detail-by-slug'],
  { revalidate: 3600, tags: ['gyms'] },
)

export async function getOwnerDraftGym(id: string): Promise<GymListing | null> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return null

    const { data: gymData, error } = await supabase
      .from('gyms')
      .select(GYM_LISTING_SELECT)
      .eq('id', id)
      .eq('owner_id', user.id)
      .maybeSingle()
    if (error) {
      console.error('Error fetching gym (owner fallback):', error)
      return null
    }
    if (!gymData?.id) return null

    const stats = await fetchGymReviewStats(supabase, gymData.id)
    return assembleGymListing(gymData as Record<string, unknown>, stats)
  } catch (err) {
    console.error('Error in getOwnerDraftGym:', err)
    return null
  }
}

export async function fetchGymReviewsForListing(gymId: string): Promise<GymReview[]> {
  const supabase = createPublicClient()

  const [bookingRes, manualRes] = await Promise.all([
    supabase
      .from('bookings')
      .select('id, user_id, reviews(*)')
      .eq('gym_id', gymId),
    supabase
      .from('reviews')
      .select('id, rating, comment, created_at, reviewer_name')
      .eq('gym_id', gymId)
      .eq('manual_review', true)
      .limit(10),
  ])

  if (bookingRes.error) {
    console.error('Error fetching booking reviews:', bookingRes.error)
  }

  const bookingReviews = (bookingRes.data || []).flatMap((booking) =>
    ((booking as { reviews?: GymReview[] }).reviews || []).map((review) => ({
      ...review,
      booking: { user_id: (booking as { user_id: string }).user_id },
    })),
  )

  const manualReviews = (manualRes.data || []).map((review) => ({
    ...review,
    booking: null,
  }))

  return [...bookingReviews, ...manualReviews] as GymReview[]
}

export const getGymReviews = unstable_cache(
  async (gymId: string) => fetchGymReviewsForListing(gymId),
  ['gym-reviews'],
  { revalidate: 3600, tags: ['gyms'] },
)
