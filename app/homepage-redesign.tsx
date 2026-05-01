import Link from 'next/link'
import { createPublicClient } from '@/lib/supabase/public-server'
import { unstable_cache } from 'next/cache'
import { attachReviewStatsPublic } from '@/lib/reviews/attach-review-stats-public'
import { FeaturedCarousel } from '@/components/featured-carousel'
import { HomepageHero } from '@/components/homepage-hero'
import { OffersSection } from '@/components/offers-section'
import { BookingProvider } from '@/lib/contexts/booking-context'
import type { Offer } from '@/lib/types/database'

const HOMEPAGE_ROW_SIZE = 8
const HOLIDAY_CITIES = [
  'phuket',
  'krabi',
  'pattaya',
  'koh samui',
  'koh phangan',
  'koh tao',
  'hua hin',
  'chiang mai',
]

type HomepageGym = Record<string, any>

function normalizeText(value: unknown): string {
  return String(value ?? '').toLowerCase()
}

function hasPackages(gym: HomepageGym): boolean {
  return Array.isArray(gym.packages) && gym.packages.length > 0
}

function packageText(gym: HomepageGym): string {
  if (!hasPackages(gym)) return ''
  return gym.packages
    .map((pkg: any) => `${pkg?.name ?? ''} ${pkg?.description ?? ''} ${pkg?.type ?? ''} ${pkg?.offer_type ?? ''}`)
    .join(' ')
    .toLowerCase()
}

function hasAccommodationSignal(gym: HomepageGym): boolean {
  if (gym.offers_accommodation === true) return true
  if (gym.amenities?.accommodation === true) return true
  if (gym.accommodation_price_per_day != null || gym.accommodation_price_per_week != null) return true
  if (!hasPackages(gym)) return false
  return gym.packages.some((pkg: any) =>
    pkg?.includes_accommodation === true ||
    pkg?.type === 'accommodation' ||
    pkg?.offer_type === 'TYPE_TRAINING_ACCOM' ||
    pkg?.offer_type === 'TYPE_ALL_INCLUSIVE'
  )
}

function hasHolidaySignal(gym: HomepageGym): boolean {
  const city = normalizeText(gym.city)
  const text = packageText(gym)
  return (
    hasAccommodationSignal(gym) ||
    HOLIDAY_CITIES.some((holidayCity) => city.includes(holidayCity)) ||
    /holiday|retreat|stay|accommodation|accom|camp/i.test(text)
  )
}

function hasBeginnerSignal(gym: HomepageGym): boolean {
  const amenities = gym.amenities ?? {}
  const text = `${normalizeText(gym.description)} ${packageText(gym)}`
  return (
    amenities.beginner_friendly === true ||
    amenities.beginnerFriendly === true ||
    /beginner|first[-\s]?timer|fundamentals|all levels|no experience/i.test(text)
  )
}

/** Same logic as TripPlanner “Train & stay” filter — packages that include accommodation. */
function hasTrainStayPackageSignal(gym: HomepageGym): boolean {
  if (!hasPackages(gym)) return false
  return gym.packages.some(
    (pkg: any) => pkg.type === 'accommodation' || pkg.includes_accommodation === true,
  )
}

const BEACH_TRAINING_CITY_SUBSTRINGS = [
  'phuket',
  'krabi',
  'pattaya',
  'koh samui',
  'koh phangan',
  'koh tao',
  'hua hin',
  'cha-am',
]

/** Same beach-city list as TripPlanner “Beachside training”. */
function hasBeachsideSignal(gym: HomepageGym): boolean {
  const city = normalizeText(gym.city)
  return BEACH_TRAINING_CITY_SUBSTRINGS.some((needle) => city.includes(needle))
}

function qualityScore(gym: HomepageGym): number {
  const rating = Number(gym.averageRating ?? 0)
  const reviewCount = Number(gym.reviewCount ?? 0)
  const imageCount = Array.isArray(gym.images) ? gym.images.length : 0
  const packageCount = Array.isArray(gym.packages) ? gym.packages.length : 0
  const createdAt = gym.created_at ? new Date(gym.created_at).getTime() : 0
  const ageDays = Number.isFinite(createdAt) && createdAt > 0
    ? (Date.now() - createdAt) / 86_400_000
    : Number.POSITIVE_INFINITY
  const freshnessBoost = Math.max(0, 12 - Math.max(0, ageDays) / 5)

  return (
    rating * 20 +
    Math.min(reviewCount, 20) * 2 +
    Math.min(imageCount, 8) * 1.5 +
    Math.min(packageCount, 4) * 3 +
    (gym.verification_status === 'trusted' ? 8 : 0) +
    freshnessBoost
  )
}

function compareByQuality(a: HomepageGym, b: HomepageGym): number {
  const scoreDiff = qualityScore(b) - qualityScore(a)
  if (scoreDiff !== 0) return scoreDiff
  return String(a.name ?? '').localeCompare(String(b.name ?? ''))
}

function buildHomepageRow({
  pool,
  primary,
  sort = compareByQuality,
  used,
  limit = HOMEPAGE_ROW_SIZE,
}: {
  pool: HomepageGym[]
  primary: (gym: HomepageGym) => boolean
  sort?: (a: HomepageGym, b: HomepageGym) => number
  used: Set<string>
  limit?: number
}): HomepageGym[] {
  const selected: HomepageGym[] = []
  const add = (gym: HomepageGym) => {
    if (!gym?.id || used.has(gym.id) || selected.some((g) => g.id === gym.id)) return
    selected.push(gym)
  }

  pool.filter(primary).sort(sort).forEach(add)
  if (selected.length < limit) {
    pool.filter((gym) => !primary(gym)).sort(sort).forEach(add)
  }

  const row = selected.slice(0, limit)
  row.forEach((gym) => used.add(gym.id))
  return row
}

async function getGymsWithPackages() {
  const supabase = createPublicClient()
  const { data } = await supabase
    .from('gyms')
    .select(`
      *,
      images:gym_images(url, variants, order),
      packages(id, type, includes_accommodation, includes_meals, name, description, offer_type, event_date, event_end_date, max_attendees, price_per_day)
    `)
    .in('verification_status', ['verified', 'trusted'])
  
  if (data) {
    data.forEach((gym: any) => {
      if (gym.images && Array.isArray(gym.images)) {
        gym.images.sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
      }
    })
  }
  
  const withReviews = await attachReviewStatsPublic(data || [])
  return withReviews.sort((a: any, b: any) => {
    if (b.averageRating !== a.averageRating) return b.averageRating - a.averageRating
    if (b.reviewCount !== a.reviewCount) return b.reviewCount - a.reviewCount
    return a.name.localeCompare(b.name)
  })
}

async function getTopRatedGyms(limit: number = 10) {
  const supabase = createPublicClient()
  
  const { data: allGyms } = await supabase
    .from('gyms')
    .select('*, images:gym_images(url, variants, order)')
    .in('verification_status', ['verified', 'trusted'])
  
  if (!allGyms) return []
  
  allGyms.forEach((gym: any) => {
    if (gym.images && Array.isArray(gym.images)) {
      gym.images.sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
    }
  })
  
  const { data: allReviews } = await supabase
    .from('reviews')
    .select('gym_id, rating')
  
  const reviewsByGym: Record<string, number[]> = {}
  allReviews?.forEach((review: any) => {
    if (review.gym_id && review.rating) {
      if (!reviewsByGym[review.gym_id]) {
        reviewsByGym[review.gym_id] = []
      }
      reviewsByGym[review.gym_id].push(review.rating)
    }
  })
  
  const gymsWithRatings = allGyms.map((gym: any) => {
    const ratings = reviewsByGym[gym.id] || []
    const averageRating = ratings.length > 0
      ? ratings.reduce((sum: number, r: number) => sum + r, 0) / ratings.length
      : 0
    
    return {
      ...gym,
      averageRating,
      reviewCount: ratings.length,
      images: gym.images || []
    }
  })
  
  const sorted = gymsWithRatings.sort((a: any, b: any) => {
    if (b.averageRating !== a.averageRating) {
      return b.averageRating - a.averageRating
    }
    if (b.reviewCount !== a.reviewCount) {
      return b.reviewCount - a.reviewCount
    }
    return a.name.localeCompare(b.name)
  })
  
  return sorted.slice(0, limit)
}

async function getOffers() {
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

const getHomepageDataCached = unstable_cache(
  async () => {
    const [allGymsWithPackages, topRatedGyms, offers] = await Promise.all([
      getGymsWithPackages(),
      getTopRatedGyms(HOMEPAGE_ROW_SIZE),
      getOffers(),
    ])

    return { allGymsWithPackages, topRatedGyms, offers }
  },
  ['homepage-redesign-data-v2'],
  { revalidate: 300 }
)

export default async function HomepageRedesign({ searchParams }: { searchParams?: { checkin?: string, checkout?: string } }) {
  void searchParams
  const { allGymsWithPackages, topRatedGyms, offers } = await getHomepageDataCached()

  // Marketplace shelf pattern:
  // 1. Top rated keeps the strongest quality row.
  // 2. Lower rows use true candidates first, then backfill from next-best unused gyms.
  //    This keeps small inventory feeling varied now and naturally improves as more gyms are added.
  const homepagePool = [...allGymsWithPackages].sort(compareByQuality)
  const usedHomepageGymIds = new Set<string>(topRatedGyms.map((gym: any) => gym.id).filter(Boolean))
  const popularTrainingGyms = buildHomepageRow({
    pool: homepagePool,
    primary: () => true,
    sort: compareByQuality,
    used: usedHomepageGymIds,
    limit: HOMEPAGE_ROW_SIZE,
  })
  const trainAndStayGyms = buildHomepageRow({
    pool: homepagePool,
    primary: hasTrainStayPackageSignal,
    sort: compareByQuality,
    used: usedHomepageGymIds,
    limit: HOMEPAGE_ROW_SIZE,
  })
  const beachsideTrainingGyms = buildHomepageRow({
    pool: homepagePool,
    primary: hasBeachsideSignal,
    sort: compareByQuality,
    used: usedHomepageGymIds,
    limit: HOMEPAGE_ROW_SIZE,
  })
  const trainingHolidayGyms = buildHomepageRow({
    pool: homepagePool,
    primary: hasHolidaySignal,
    sort: compareByQuality,
    used: usedHomepageGymIds,
    limit: HOMEPAGE_ROW_SIZE,
  })
  const beginnerFriendlyGyms = buildHomepageRow({
    pool: homepagePool,
    primary: hasBeginnerSignal,
    sort: compareByQuality,
    used: usedHomepageGymIds,
    limit: HOMEPAGE_ROW_SIZE,
  })

  return (
    <BookingProvider>
    <main className="min-h-screen bg-white">
      <HomepageHero />

      <OffersSection offers={offers} />

      {/* Temporary layout: six gym carousels (8 gyms each). Book-with-confidence, browse-by-sport, trending destinations, and TripPlanner UI removed; “Train & stay” + “Beachside” reuse TripPlanner-style filters as shelves. */}
      <div className="relative z-0 flex flex-col">
        {/* Popular Training Camps */}
        <section className="pt-4 pb-4 md:pt-6 md:pb-6 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-xl md:text-2xl font-bold mb-2 text-gray-900">Popular Training Camps</h2>
            <p className="text-sm md:text-base text-gray-700 mb-3 md:mb-4">From intensive fight camps to holistic training retreats, find your perfect match</p>
            <FeaturedCarousel gyms={popularTrainingGyms} />
          </div>
        </section>

        {/* Top Rated Camps */}
        <section className="pt-4 pb-4 md:pt-6 md:pb-6 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-xl md:text-2xl font-bold mb-2 text-gray-900">Top Rated Camps</h2>
            <p className="text-sm md:text-base text-gray-700 mb-3 md:mb-4">Highly rated by fighters who've trained there - verified reviews from real bookings</p>
            <FeaturedCarousel gyms={topRatedGyms} priorityCount={3} />
          </div>
        </section>

        {/* Train & stay — shelf sourced from TripPlanner-style accommodation package filter */}
        <section className="pt-4 pb-4 md:pt-6 md:pb-6 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-xl md:text-2xl font-bold mb-2 text-gray-900">Train &amp; stay</h2>
            <p className="text-sm md:text-base text-gray-700 mb-3 md:mb-4">
              Camps with accommodation packages so you can train hard and stay on-site or nearby.
            </p>
            <FeaturedCarousel gyms={trainAndStayGyms} />
          </div>
        </section>

        {/* Beachside training — same coastal city signals as TripPlanner “Beachside training” */}
        <section className="pt-4 pb-4 md:pt-6 md:pb-6 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-xl md:text-2xl font-bold mb-2 text-gray-900">Beachside training</h2>
            <p className="text-sm md:text-base text-gray-700 mb-3 md:mb-4">
              Thailand islands and coast—train with sand and sea a short ride away.
            </p>
            <FeaturedCarousel gyms={beachsideTrainingGyms} />
          </div>
        </section>

        {/* Training Holidays */}
        <section className="pt-4 pb-4 md:pt-6 md:pb-6 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-xl md:text-2xl font-bold mb-2 text-gray-900">Training Holidays</h2>
            <p className="text-sm md:text-base text-gray-700 mb-3 md:mb-4">Combine training with vacation in stunning locations</p>
            <FeaturedCarousel gyms={trainingHolidayGyms} />
          </div>
        </section>

        {/* Beginner-Friendly Camps */}
        <section className="pt-4 pb-4 md:pt-6 md:pb-6 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-xl md:text-2xl font-bold mb-2 text-gray-900">Beginner-Friendly Camps</h2>
            <p className="text-sm md:text-base text-gray-700 mb-3 md:mb-4">Perfect for those starting their combat sports journey</p>
            <FeaturedCarousel gyms={beginnerFriendlyGyms} />
          </div>
        </section>
      </div>

      {/* Trust Container 2 */}
      <section className="pt-4 pb-8 md:pt-6 md:pb-12 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="border border-[#003580] rounded-lg shadow-sm p-4 md:p-8 bg-white">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-0">
              <div className="max-w-2xl">
                <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2 md:mb-3">We're here to help</h3>
                <p className="text-sm md:text-base text-gray-600 leading-relaxed">
                  Your training journey matters to us. From finding the perfect camp to ensuring your booking goes smoothly, we're committed to making your combat sports experience exceptional. Our team is always ready to assist you every step of the way.
                </p>
              </div>
              <Link href="/contact" className="text-xs md:text-sm text-[#003580] font-medium hover:underline whitespace-nowrap md:ml-6">
                Contact Support →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
    </BookingProvider>
  )
}
