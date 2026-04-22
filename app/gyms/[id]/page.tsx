import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { unstable_cache } from 'next/cache'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { createPublicClient } from '@/lib/supabase/public-server'
import { Card, CardContent } from '@/components/ui/card'
import type { Gym, GymImage, Review, Package } from '@/lib/types/database'
import { PackagesList } from '@/components/packages-list'
import { GymGallery } from '@/components/gym-gallery'
import { GymGalleryMobileWrapper } from '@/components/gym-gallery-mobile-wrapper'
import { GymMap } from '@/components/gym-map'
import { BookingProvider } from '@/lib/contexts/booking-context'
import { ReserveButton } from '@/components/reserve-button'
import { SaveButton } from '@/components/save-button'
import { PropertyHighlightsCard } from '@/components/property-highlights-card'
import { ReviewsLinkButton } from '@/components/reviews-link-button'
import { ReviewCard } from '@/components/review-card'
import { ReviewsCarousel } from '@/components/reviews-carousel'
import { FacilitiesList } from '@/components/facilities-list'
import { GymDescription } from '@/components/gym-description'
import { TrainingSchedule } from '@/components/training-schedule'
import { ShowOnMapLink } from '@/components/show-on-map-link'
import { GymAddressCopy } from '@/components/gym-address-copy'
import { MapPin, Star } from 'lucide-react'
import { formatLandmarksText } from '@/lib/utils/landmarks'
import { absoluteUrl, siteUrl } from '@/lib/seo/site-url'

// Helper function to format review date as "time ago"
function formatReviewDate(createdAt: string): string {
  const reviewDate = new Date(createdAt)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - reviewDate.getTime())
  const diffMonths = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30))
  const diffYears = Math.floor(diffMonths / 12)
  
  if (diffYears > 0) {
    return `${diffYears} ${diffYears === 1 ? 'year' : 'years'} ago`
  } else if (diffMonths > 0) {
    return `${diffMonths} ${diffMonths === 1 ? 'month' : 'months'} ago`
  } else {
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    if (diffDays > 0) {
      return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`
    } else {
      return 'Today'
    }
  }
}

// Helper component to render star rating (Booking.com style)
function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-4 h-4 ${
            star <= rating
              ? 'fill-[#febb02] text-[#febb02]'
              : 'fill-gray-200 text-gray-200'
          }`}
        />
      ))}
    </div>
  )
}


interface GymWithDetails extends Gym {
  images: GymImage[]
  reviews: (Review & { booking: { user_id: string } })[]
  owner: { full_name: string | null }
  packages: Package[]
  opening_hours?: any
  training_schedule?: Record<string, Array<{ time: string; type?: string }>>
}

const GYM_LISTING_SELECT = `
        *,
        packages(*, variants:package_variants(*)),
        reviews:bookings(
          id,
          user_id,
          reviews(*)
        ),
        owner:profiles!gyms_owner_id_fkey(full_name)
      `

// Revalidate pre-rendered gym pages hourly so fresh pricing/reviews land
// without rebuilding. Non-statically-generated gyms still render on demand
// (dynamicParams = true) and get cached on the edge after first hit.
export const revalidate = 3600
export const dynamicParams = true

/**
 * Pre-render the top 100 most-reviewed verified gyms at build time so popular
 * detail pages load as static HTML (0ms DB wait). Everything else falls back
 * to on-demand ISR via dynamicParams=true.
 */
export async function generateStaticParams() {
  try {
    const supabase = createPublicClient()
    const { data, error } = await supabase
      .from('gyms')
      .select('id, reviews:bookings(reviews(id))')
      .eq('verification_status', 'verified')
      .eq('status', 'approved')
      .limit(300)
    if (error || !data) return []

    const ranked = data
      .map((g: any) => ({
        id: g.id as string,
        count: (g.reviews || []).reduce(
          (sum: number, b: any) => sum + ((b?.reviews || []).length || 0),
          0,
        ),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 100)

    return ranked.map(({ id }) => ({ id }))
  } catch (err) {
    console.error('generateStaticParams(gyms) failed:', err)
    return []
  }
}

// Shared reducer that turns raw Supabase rows into a GymWithDetails. The same
// query shape is used for the cached public path and the owner-draft fallback,
// so we keep the reshape logic in one place.
async function assembleGym(
  supabase: SupabaseClient,
  gymData: any,
  id: string,
): Promise<GymWithDetails | null> {
  if (!gymData) return null

  const { data: imagesData, error: imagesError } = await supabase
    .from('gym_images')
    .select('*')
    .eq('gym_id', id)
    .order('order', { ascending: true, nullsFirst: false })

  if (imagesError) {
    console.error('Error fetching images:', imagesError)
  }

  const sortedImages = (imagesData || []).sort((a: any, b: any) => {
    const orderA = a.order !== null && a.order !== undefined ? a.order : 999
    const orderB = b.order !== null && b.order !== undefined ? b.order : 999
    return orderA - orderB
  })

  const bookingReviews = (gymData.reviews || []).flatMap((booking: any) =>
    (booking.reviews || []).map((review: any) => ({
      ...review,
      booking: { user_id: booking.user_id },
    })),
  )

  // MVP ONLY: Fetch manual reviews (gym_id based) - REMOVE BEFORE SHIPPING
  let manualReviews: any[] = []
  try {
    const { data: reviewsData } = await supabase
      .from('reviews')
      .select('id, rating, comment, created_at, reviewer_name')
      .eq('gym_id', id)
      .eq('manual_review', true)
      .limit(10)
    manualReviews = reviewsData || []
  } catch (reviewError) {
    console.error('Error fetching manual reviews:', reviewError)
  }

  const reviews = [
    ...bookingReviews,
    ...manualReviews.map((review: any) => ({
      ...review,
      booking: null,
    })),
  ]

  return {
    ...gymData,
    images: sortedImages,
    reviews,
  } as GymWithDetails
}

/**
 * Public, cookie-free fetch for verified/trusted gyms. Because we never touch
 * cookies() / auth on this path, Next can actually statically render the
 * page (with ISR) and cache it at the edge. Wrapped in unstable_cache so
 * repeat requests for the same gym within the revalidation window skip
 * Supabase entirely.
 */
const getPublicGym = unstable_cache(
  async (id: string): Promise<GymWithDetails | null> => {
    try {
      const supabase = createPublicClient()
      const { data: gymData, error } = await supabase
        .from('gyms')
        .select(GYM_LISTING_SELECT)
        .eq('id', id)
        .in('verification_status', ['verified', 'trusted'])
        .maybeSingle()
      if (error) {
        console.error('Error fetching public gym:', error)
        return null
      }
      return await assembleGym(supabase as any, gymData, id)
    } catch (err) {
      console.error('Error in getPublicGym:', err)
      return null
    }
  },
  ['gym-detail'],
  { revalidate: 3600, tags: ['gyms'] },
)

/**
 * Cookie-scoped fallback used only when the public fetch returns nothing —
 * typically a draft gym the current user owns. This path reads auth and is
 * therefore dynamic, but it only runs for <1% of traffic.
 */
async function getOwnerDraftGym(id: string): Promise<GymWithDetails | null> {
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
    return await assembleGym(supabase as any, gymData, id)
  } catch (err) {
    console.error('Error in getOwnerDraftGym:', err)
    return null
  }
}

// Cached, cookie-free metadata lookup. Using createPublicClient (instead of
// the cookie-bound createClient) keeps generateMetadata from accidentally
// opting the whole page into dynamic rendering, and unstable_cache tagged
// with 'gyms' means metadata invalidates alongside the main page whenever
// revalidateGymCache() runs.
const getGymMetadata = unstable_cache(
  async (id: string) => {
    const supabase = createPublicClient()
    const { data } = await supabase
      .from('gyms')
      .select('name, description, verification_status')
      .eq('id', id)
      .maybeSingle()
    return data
  },
  ['gym-metadata'],
  { revalidate: 3600, tags: ['gyms'] },
)

export async function generateMetadata({
  params,
}: {
  params: { id: string }
}): Promise<Metadata> {
  const data = await getGymMetadata(params.id)

  if (!data || data.verification_status !== 'verified') {
    return {
      title: 'Gym Not Found | Combatbooking',
      robots: { index: false, follow: false },
    }
  }

  const name = data.name?.trim() || 'Training Camp'
  const description =
    data.description?.trim() ||
    `Train at ${name}. Book your next combat sports camp on Combatbooking.`

  return {
    title: `${name} — Book Training Camps | Combatbooking`,
    description,
    alternates: {
      canonical: `/gyms/${params.id}`,
    },
    openGraph: {
      title: `${name} — Book Training Camps | Combatbooking`,
      description,
      url: `/gyms/${params.id}`,
      type: 'website',
    },
  }
}

export default async function GymDetailsPage({ params, searchParams }: { params: { id: string }, searchParams: { checkin?: string, checkout?: string } }) {
  // Fast path: cookie-free, cached fetch — renders statically for verified/trusted gyms.
  let gym = await getPublicGym(params.id)
  // Only fall back to the cookie-based owner path (which opts this request into
  // dynamic rendering) when the public fetch returned nothing. That keeps the
  // top 100 pre-rendered at build and the long tail edge-cached after one hit.
  let isOwner = false
  if (!gym) {
    gym = await getOwnerDraftGym(params.id)
    isOwner = !!gym
  }

  if (!gym) {
    notFound()
  }

  const isVerified = gym.verification_status === 'verified'
  const isDraft = gym.verification_status === 'draft'

  if (!isVerified && !isOwner) {
    notFound()
  }

  const averageRating = gym.reviews.length > 0
    ? gym.reviews.reduce((sum, r) => sum + r.rating, 0) / gym.reviews.length
    : 0

  const primaryImage =
    gym.images && gym.images.length > 0 ? gym.images[0]?.url : undefined

  const sportsActivityLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'SportsActivityLocation',
    '@id': absoluteUrl(`/gyms/${gym.id}`),
    name: gym.name,
    url: absoluteUrl(`/gyms/${gym.id}`),
    description: gym.description || `Train at ${gym.name} in ${gym.city}, ${gym.country}. Book combat sports camps on Combatbooking.`,
    image: primaryImage ? [primaryImage] : undefined,
    address: {
      '@type': 'PostalAddress',
      streetAddress: gym.address || undefined,
      addressLocality: gym.city || undefined,
      addressCountry: gym.country || undefined,
    },
    geo:
      typeof gym.latitude === 'number' && typeof gym.longitude === 'number'
        ? {
            '@type': 'GeoCoordinates',
            latitude: gym.latitude,
            longitude: gym.longitude,
          }
        : undefined,
    telephone: gym.public_contact_phone || undefined,
    sport: Array.isArray(gym.disciplines) && gym.disciplines.length > 0 ? gym.disciplines : undefined,
    priceRange:
      typeof gym.price_per_day === 'number' && gym.price_per_day > 0
        ? `From $${gym.price_per_day}/day`
        : undefined,
    aggregateRating:
      gym.reviews.length > 0
        ? {
            '@type': 'AggregateRating',
            ratingValue: Number(averageRating.toFixed(2)),
            reviewCount: gym.reviews.length,
            bestRating: 5,
            worstRating: 1,
          }
        : undefined,
    isPartOf: {
      '@type': 'WebSite',
      name: 'Combatbooking',
      url: siteUrl,
    },
  }

  // Get nearby landmarks - ONLY use cached from database, never fetch on page load
  // Landmarks should be fetched once via API endpoint when gym is created/approved
  let landmarks: Array<{ name: string; distance: number }> = []
  let landmarksText = ''
  
  // Check if we have cached landmarks in database
  if (gym.nearby_attractions && Array.isArray(gym.nearby_attractions) && gym.nearby_attractions.length > 0) {
    // Use cached landmarks (instant, no API call - page loads fast!)
    landmarks = gym.nearby_attractions
    landmarksText = formatLandmarksText(landmarks)
  }
  // If no cache exists, landmarks will be empty (no API calls on page load)

  return (
    <BookingProvider initialCheckin={searchParams.checkin} initialCheckout={searchParams.checkout}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(sportsActivityLd) }}
      />
      <div className="min-h-screen bg-white pb-12">
        {/* Draft Mode Notice for Owner */}
        {isDraft && isOwner && (
          <div className="bg-yellow-50 border-b border-yellow-200 py-2 md:py-3">
            <div className="max-w-6xl mx-auto px-4">
              <p className="text-xs md:text-sm text-yellow-800 font-medium">
                ⚠️ Preview Mode: Your gym is in draft status and not visible to the public. Complete verification to go live.
              </p>
            </div>
          </div>
        )}
        {/* Header / Breadcrumbs */}
        <div className="bg-white border-b border-gray-200 py-4 md:py-6">
          <div className="max-w-6xl mx-auto px-4">
            {/* Breadcrumbs - Smaller on mobile, scrollable if needed */}
            <div className="flex items-center text-xs md:text-sm text-gray-500 mb-3 md:mb-4 overflow-x-auto no-scrollbar">
              <a href="/" className="hover:text-[#003580] transition-colors whitespace-nowrap">Home</a>
              <span className="mx-1.5 md:mx-2">/</span>
              <a href={`/search?country=${encodeURIComponent(gym.country)}`} className="hover:text-[#003580] transition-colors whitespace-nowrap">{gym.country}</a>
              <span className="mx-1.5 md:mx-2">/</span>
              <a href={`/search?location=${encodeURIComponent(gym.city)}`} className="hover:text-[#003580] transition-colors whitespace-nowrap">{gym.city}</a>
              <span className="mx-1.5 md:mx-2">/</span>
              <span className="text-gray-900 font-medium whitespace-nowrap truncate">{gym.name}</span>
            </div>
            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-3 md:gap-4">
              <div className="flex-1 min-w-0">
                {/* Mobile: Title and Reserve button inline */}
                <div className="flex items-start justify-between gap-3 mb-2 md:mb-0">
                  <h1 className="text-xl md:text-3xl lg:text-4xl font-bold text-gray-900 leading-tight flex-1 min-w-0">{gym.name}</h1>
                  {/* Save + Reserve - inline on mobile */}
                  <div className="md:hidden flex-shrink-0 flex items-center gap-2">
                    <SaveButton gymId={gym.id} inline />
                    <ReserveButton gym={gym} />
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 md:gap-2 text-gray-600 mb-2 md:mb-0">
                  <MapPin className="w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0" />
                  <span className="text-sm md:text-[15px]">{gym.city}, {gym.country}</span>
                  {gym.address && (
                    <>
                      <span className="text-gray-400 hidden md:inline">•</span>
                      <GymAddressCopy address={gym.address} className="text-sm md:text-[15px]" />
                    </>
                  )}
                  {/* Show on map link - Mobile only */}
                  <ShowOnMapLink />
                </div>
                {/* Star Rating & Reviews - Mobile only */}
                {averageRating > 0 && (
                  <div className="md:hidden flex items-center gap-1.5 flex-wrap mt-1">
                    <StarRating rating={Math.round(averageRating)} />
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-semibold text-gray-900">{averageRating.toFixed(1)}</span>
                      <span className="text-xs text-gray-600">({gym.reviews.length} {gym.reviews.length === 1 ? 'review' : 'reviews'})</span>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Save + Reserve - Desktop only (mobile is inline above) */}
              <div className="hidden md:flex items-center gap-2 flex-shrink-0">
                <SaveButton gymId={gym.id} inline />
                <ReserveButton gym={gym} />
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Gallery - Full width slider at top (mobile only) */}
        <div className="md:hidden w-full">
          <GymGalleryMobileWrapper 
            images={gym.images} 
            gymName={gym.name}
          />
        </div>

        {/* Mobile Description & Facilities - Right after gallery (mobile only) */}
        <div className="md:hidden w-full px-4 py-4 space-y-6">
          <GymDescription 
            gymName={gym.name}
            description={gym.description}
            landmarksText={landmarksText}
            amenities={gym.amenities}
            disciplines={gym.disciplines}
          />
          
          {/* Packages - Mobile only, below facilities */}
          <div id="packages" className="border-t border-gray-200 pt-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-900">Available Packages</h2>
            <PackagesList packages={gym.packages} gym={gym} />
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-4 md:py-8">
          <div className="grid lg:grid-cols-3 gap-6 md:gap-10">
            {/* Right Sidebar - Shows FIRST on mobile, then moves to right on desktop */}
            <div className="lg:col-span-1 space-y-4 md:space-y-6 order-1 lg:order-2">
              
              {/* Property Highlights - Dynamic based on gym and dates */}
              <PropertyHighlightsCard 
                gym={gym} 
                averageRating={averageRating}
                reviewCount={gym.reviews.length}
                googleMapsKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || ''}
              />

              {/* Reviews Summary - Desktop only */}
              {averageRating > 0 && (
                <Card className="hidden md:block border border-gray-200 shadow-sm">
                  <CardContent className="p-4 md:p-5">
                    <div className="flex items-center justify-between mb-2 md:mb-3">
                      <h3 className="font-bold text-base md:text-lg text-gray-900">Guest Reviews</h3>
                      <StarRating rating={Math.round(averageRating)} />
                    </div>
                    <div className="flex items-center gap-2 mb-2 md:mb-3">
                      <span className="text-gray-600 text-xs md:text-sm font-medium">{averageRating.toFixed(1)}</span>
                      <span className="text-gray-400 text-xs md:text-sm">({gym.reviews.length} {gym.reviews.length === 1 ? 'review' : 'reviews'})</span>
                    </div>
                    <p className="text-xs md:text-sm text-gray-600 mb-2 md:mb-3">
                      {gym.reviews.length} {gym.reviews.length === 1 ? 'review' : 'reviews'}
                    </p>
                    {gym.reviews.length > 0 && (
                      <ReviewsLinkButton />
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Map Embed with Modal - Desktop only (mobile is in PropertyHighlightsCard) */}
              <div id="gym-map-section" className="hidden md:block">
                <GymMap 
                  gym={gym} 
                  googleMapsKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || ''} 
                />
              </div>

              {/* Opening Hours - Mobile and Desktop */}
              {(gym.opening_hours || gym.training_schedule) && (
                <Card className="border border-gray-200 shadow-sm">
                  <CardContent className="p-4 md:p-5">
                    {gym.opening_hours && (() => {
                      const dayOrder = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
                      const sortedHours = dayOrder
                        .map(day => ({ day, hours: gym.opening_hours[day] }))
                        .filter(item => item.hours !== undefined)
                      
                      if (sortedHours.length === 0) return null
                      
                      return (
                        <>
                          <h3 className="font-bold text-sm md:text-lg mb-2.5 md:mb-4 text-gray-900">Opening Hours</h3>
                          <div className="grid gap-1 md:gap-2 text-xs md:text-sm">
                            {sortedHours.map(({ day, hours }) => (
                              <div key={day} className="flex justify-between py-1.5 md:py-1 border-b last:border-0 border-dashed border-gray-100">
                                <span className="capitalize font-medium text-gray-700 text-xs md:text-sm">{day}</span>
                                <span className="text-gray-500 text-xs md:text-sm">{hours}</span>
                              </div>
                            ))}
                          </div>
                        </>
                      )
                    })()}
                    
                    {/* Class Schedule - Below Opening Hours (Mobile and Desktop) */}
                    {gym.training_schedule && (
                      <TrainingSchedule trainingSchedule={gym.training_schedule} />
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6 md:space-y-10 order-2 lg:order-1">
              
              {/* Gallery - Desktop only (mobile gallery is at top) */}
              <div className="hidden md:block">
                <GymGallery images={gym.images} gymName={gym.name} />
              </div>

              {/* Description & Facilities - Blended (Booking.com style) - Desktop only */}
              <div className="hidden md:block">
                <GymDescription 
                  gymName={gym.name}
                  description={gym.description}
                  landmarksText={landmarksText}
                  amenities={gym.amenities}
                  disciplines={gym.disciplines}
                />
              </div>

              {/* Packages - DIRECTLY UNDERNEATH Amenities - Desktop only (mobile is above) */}
              <div id="packages" className="hidden md:block border-t border-gray-200 pt-6 md:pt-8">
                <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-4 text-gray-900">Available Packages</h2>
                <PackagesList packages={gym.packages} gym={gym} />
              </div>

            </div>
          </div>

          {/* Reviews - Full width, aligned with sidebar edge */}
          <div id="reviews" className="border-t border-gray-200 pt-6 md:pt-8 mt-6 md:mt-10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0 mb-4">
              <h2 className="text-lg md:text-xl font-semibold text-gray-900">Guest Reviews</h2>
              {averageRating > 0 && (
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="text-right">
                    <div className="text-xs md:text-sm text-gray-600">Excellent</div>
                    <div className="text-[10px] md:text-xs text-gray-500">{gym.reviews.length} {gym.reviews.length === 1 ? 'review' : 'reviews'}</div>
                  </div>
                  <div className="bg-[#003580] text-white px-2.5 md:px-3 py-1.5 md:py-2 rounded-md text-lg md:text-xl font-bold min-w-[50px] md:min-w-[60px] text-center">
                    {averageRating.toFixed(1)}
                  </div>
                </div>
              )}
            </div>
            {gym.reviews.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                <p className="text-gray-500 font-medium">No reviews yet.</p>
                <p className="text-sm text-gray-400 mt-1">Be the first to review this gym!</p>
              </div>
            ) : (
              <ReviewsCarousel reviews={gym.reviews} />
            )}
          </div>
        </div>
      </div>
    </BookingProvider>
  )
}
