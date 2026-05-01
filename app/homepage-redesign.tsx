import Link from 'next/link'
import Image from 'next/image'
import { createPublicClient } from '@/lib/supabase/public-server'
import { unstable_cache } from 'next/cache'
import { Button } from '@/components/ui/button'
import { attachReviewStatsPublic } from '@/lib/reviews/attach-review-stats-public'
import { FeaturedCarousel } from '@/components/featured-carousel'
import { SportTypeCarousel } from '@/components/sport-type-carousel'
import { TripPlanner } from '@/components/trip-planner'
import { HomepageHero } from '@/components/homepage-hero'
import { OffersSection } from '@/components/offers-section'
import { DestinationsCarousel } from '@/components/destinations-carousel'
import { BookingProvider } from '@/lib/contexts/booking-context'
import type { Offer } from '@/lib/types/database'
import { BLUR_DATA_URL } from '@/lib/images/blur'

const HOMEPAGE_ROW_SIZE = 10
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

/** Match `/search?location=` behavior: `city.ilike.%location%` (substring, case-insensitive). */
function countGymsInDestination(gyms: HomepageGym[], destination: string): number {
  const needle = normalizeText(destination).trim()
  if (!needle) return 0
  return gyms.filter((gym) => normalizeText(gym.city).includes(needle)).length
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

async function getGyms(limit: number = 10) {
  const supabase = createPublicClient()
  const { data } = await supabase
    .from('gyms')
    .select('*, images:gym_images(url, variants, order)')
    .in('verification_status', ['verified', 'trusted'])
    .order('created_at', { ascending: false })
    .limit(limit) 
  
  if (data) {
    data.forEach((gym: any) => {
      if (gym.images && Array.isArray(gym.images)) {
        gym.images.sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
      }
    })
  }
  
  return await attachReviewStatsPublic(data || [])
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

async function getGymCountsByDiscipline() {
  const supabase = createPublicClient()
  const { data } = await supabase
    .from('gyms')
    .select('disciplines')
    .eq('verification_status', 'verified')
    .eq('status', 'approved')
  
  if (!data) return {}
  
  const counts: Record<string, number> = {}
  const allDisciplines = ['Muay Thai', 'MMA', 'BJJ', 'Boxing', 'Wrestling', 'Kickboxing']
  
  allDisciplines.forEach(discipline => {
    counts[discipline] = 0
  })
  
  data.forEach(gym => {
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
    const [allGyms, allGymsWithPackages, topRatedGyms, disciplineCounts, offers] = await Promise.all([
      getGyms(20),
      getGymsWithPackages(),
      getTopRatedGyms(10),
      getGymCountsByDiscipline(),
      getOffers(),
    ])

    return { allGyms, allGymsWithPackages, topRatedGyms, disciplineCounts, offers }
  },
  ['homepage-redesign-data-v1'],
  { revalidate: 300 }
)

export default async function HomepageRedesign({ searchParams }: { searchParams?: { checkin?: string, checkout?: string } }) {
  const { allGyms, allGymsWithPackages, topRatedGyms, disciplineCounts, offers } = await getHomepageDataCached()
  
  const formatDateForDisplay = (dateString: string) => {
    if (!dateString) return ''
    const date = new Date(dateString + 'T00:00:00')
    const day = date.getDate()
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const month = months[date.getMonth()]
    return `${day} ${month}`
  }
  
  const checkin = searchParams?.checkin || ''
  const checkout = searchParams?.checkout || ''
  
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)
  const nextDay = new Date(today)
  nextDay.setDate(today.getDate() + 2)
  
  const finalCheckin = checkin || today.toISOString().split('T')[0]
  const finalCheckout = checkout || nextDay.toISOString().split('T')[0]
  
  const dateDisplay = `${formatDateForDisplay(finalCheckin)}-${formatDateForDisplay(finalCheckout)}, 1 adult`
  
  const countryCounts: Record<string, number> = {}
  allGyms?.forEach((gym: any) => {
    if (gym.country) {
      countryCounts[gym.country] = (countryCounts[gym.country] || 0) + 1
    }
  })
  
  const mostCommonCountry = Object.entries(countryCounts).reduce((a, b) => 
    countryCounts[a[0]] > countryCounts[b[0]] ? a : b, ['Thailand', 0]
  )[0] || 'Thailand'
  
  const sportImages: Record<string, string> = {
    'Muay Thai': '/N-8427.jpeg.avif',
    'Boxing': '/e079bedfbf7e870f827b4fda7ce2132f.avif',
    'MMA': '/1296749132.jpg',
    'BJJ': '/IMG_3557_246c0a62-a253-4f95-abfd-9cb306228c6c.jpg',
    'Wrestling': '/tjj8r5ovjts8nhqjhkqc.avif',
    'Kickboxing': '/Superbon-Singha-Mawynn-Chingiz-Allazov-ONE-Fight-Night-6-1920X1280-62.jpg',
  }
  
  const availableSports = ['Muay Thai', 'MMA', 'BJJ', 'Boxing', 'Wrestling', 'Kickboxing']
    .filter(sport => (disciplineCounts[sport] || 0) > 0)
    .map(sport => ({
      name: sport,
      image: sportImages[sport] || sportImages['Muay Thai'],
      count: disciplineCounts[sport] || 0
    }))

  const destinations = [
    {
      name: "Phuket",
      image: "/phuket.jpg",
      flag: "🇹🇭",
      availableCount: countGymsInDestination(allGymsWithPackages, "Phuket")
    },
    {
      name: "Bangkok",
      image: "/Bangkok-Thailand.jpg",
      flag: "🇹🇭",
      availableCount: countGymsInDestination(allGymsWithPackages, "Bangkok")
    },
    {
      name: "Krabi",
      image: "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=800&q=80",
      flag: "🇹🇭",
      availableCount: countGymsInDestination(allGymsWithPackages, "Krabi")
    },
    {
      name: "Pattaya",
      image: "/pattaya.jpg",
      flag: "🇹🇭",
      availableCount: countGymsInDestination(allGymsWithPackages, "Pattaya")
    },
    {
      name: "Chiang Mai",
      image: "/chiang-mai-thailand-16by9.webp",
      flag: "🇹🇭",
      availableCount: countGymsInDestination(allGymsWithPackages, "Chiang Mai")
    }
  ]

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
  })
  const trainingHolidayGyms = buildHomepageRow({
    pool: homepagePool,
    primary: hasHolidaySignal,
    sort: compareByQuality,
    used: usedHomepageGymIds,
  })
  const beginnerFriendlyGyms = buildHomepageRow({
    pool: homepagePool,
    primary: hasBeginnerSignal,
    sort: compareByQuality,
    used: usedHomepageGymIds,
  })

  return (
    <BookingProvider>
    <main className="min-h-screen bg-white">
      <HomepageHero />

      <OffersSection offers={offers} />

      <div className="relative z-0 flex flex-col">
        {/* Popular Training Camps */}
        <section className="order-[50] md:order-[50] pt-4 pb-4 md:pt-6 md:pb-6 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-xl md:text-2xl font-bold mb-2 text-gray-900">Popular Training Camps</h2>
            <p className="text-sm md:text-base text-gray-700 mb-3 md:mb-4">From intensive fight camps to holistic training retreats, find your perfect match</p>
            <FeaturedCarousel gyms={popularTrainingGyms} />
          </div>
        </section>

        {/* Trust Container */}
        <section className="order-[20] md:order-[20] pt-3 pb-4 md:pt-4 md:pb-6 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-3 md:p-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0">
                <div className="flex-1">
                  <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-1 md:mb-2">Book with confidence</h3>
                  <p className="text-xs md:text-sm text-gray-600">
                    Secure payments, verified gyms, and instant booking confirmations. Your training journey starts here.
                  </p>
                </div>
                <Link href="/search" className="text-xs md:text-sm text-[#003580] font-medium hover:underline whitespace-nowrap md:ml-4">
                  Start searching →
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Browse by Sport Type */}
        {availableSports.length > 0 && (
          <section className="order-[30] md:order-[30] pt-4 pb-4 md:pt-6 md:pb-6 bg-white">
            <div className="max-w-6xl mx-auto px-4">
              <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4 text-gray-900">Browse by sport type in {mostCommonCountry}</h2>
              <SportTypeCarousel sports={availableSports} country={mostCommonCountry} dateDisplay={dateDisplay} />
            </div>
          </section>
        )}

        {/* Top Rated Camps */}
        <section className="order-[5] md:order-[5] pt-4 pb-4 md:pt-6 md:pb-6 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-xl md:text-2xl font-bold mb-2 text-gray-900">Top Rated Camps</h2>
            <p className="text-sm md:text-base text-gray-700 mb-3 md:mb-4">Highly rated by fighters who've trained there - verified reviews from real bookings</p>
            {/* First visible carousel: preload the first 3 cards (2 mobile viewports, 4 desktop). */}
            <FeaturedCarousel gyms={topRatedGyms} priorityCount={3} />
          </div>
        </section>


        {/* Trip Planner */}
        <section className="order-[10] md:order-[10] pt-4 pb-4 md:pt-6 md:pb-6 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <TripPlanner gyms={allGymsWithPackages} />
          </div>
        </section>

        {/* Trending Destinations */}
        <section className="order-[15] md:order-[15] pt-4 pb-4 md:pt-6 md:pb-6 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4 text-gray-900">Trending destinations</h2>
            
            {/* Mobile Carousel */}
            <div className="md:hidden">
              <DestinationsCarousel destinations={destinations} />
            </div>

            {/* Desktop Grid */}
            <div className="hidden md:grid grid-cols-6 gap-4">
              {destinations.slice(0, 2).map((city) => (
                <Link 
                  key={city.name} 
                  href={`/search?location=${encodeURIComponent(city.name)}`} 
                  className="col-span-3 relative h-64 group cursor-pointer overflow-hidden rounded-lg shadow-sm"
                >
                  <Image
                    src={city.image}
                    alt={city.name}
                    fill
                    sizes="(max-width: 768px) 0px, (max-width: 1200px) 50vw, 576px"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    placeholder="blur"
                    blurDataURL={BLUR_DATA_URL}
                    unoptimized
                  />
                  <div className="absolute top-4 left-4 text-white text-shadow-lg drop-shadow-md">
                    <h3 className="text-2xl font-bold flex items-center gap-2">
                      {city.name} <span className="text-xl">{city.flag}</span>
                    </h3>
                  </div>
                </Link>
              ))}
              {destinations.slice(2, 5).map((city) => (
                <Link 
                  key={city.name} 
                  href={`/search?location=${encodeURIComponent(city.name)}`} 
                  className="col-span-2 relative h-64 group cursor-pointer overflow-hidden rounded-lg shadow-sm"
                >
                  <Image
                    src={city.image}
                    alt={city.name}
                    fill
                    sizes="(max-width: 768px) 0px, (max-width: 1200px) 33vw, 384px"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    placeholder="blur"
                    blurDataURL={BLUR_DATA_URL}
                    unoptimized
                  />
                  <div className="absolute top-4 left-4 text-white text-shadow-lg drop-shadow-md">
                    <h3 className="text-2xl font-bold flex items-center gap-2">
                      {city.name} <span className="text-xl">{city.flag}</span>
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </div>

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
