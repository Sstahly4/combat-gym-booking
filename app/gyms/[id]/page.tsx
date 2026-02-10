import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import type { Gym, GymImage, Review, Package } from '@/lib/types/database'
import { PackagesList } from '@/components/packages-list'
import { GymGallery } from '@/components/gym-gallery'
import { GymGalleryMobileWrapper } from '@/components/gym-gallery-mobile-wrapper'
import { GymMap } from '@/components/gym-map'
import { BookingProvider } from '@/lib/contexts/booking-context'
import { ReserveButton } from '@/components/reserve-button'
import { PropertyHighlightsCard } from '@/components/property-highlights-card'
import { ReviewsLinkButton } from '@/components/reviews-link-button'
import { ReviewCard } from '@/components/review-card'
import { ReviewsCarousel } from '@/components/reviews-carousel'
import { FacilitiesList } from '@/components/facilities-list'
import { GymDescription } from '@/components/gym-description'
import { TrainingSchedule } from '@/components/training-schedule'
import { ShowOnMapLink } from '@/components/show-on-map-link'
import { MapPin, Star } from 'lucide-react'
import { formatLandmarksText } from '@/lib/utils/landmarks'

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

async function getGym(id: string) {
  try {
    const supabase = await createClient()
    
    // Fetch gym with images - explicitly select order column and sort in query
    const { data: gymData, error: gymError } = await supabase
      .from('gyms')
      .select(`
        *,
        packages(*, variants:package_variants(*)),
        reviews:bookings(
          id,
          reviews(*)
        ),
        owner:profiles!gyms_owner_id_fkey(full_name)
      `)
      .eq('id', id)
      .in('verification_status', ['verified', 'trusted', 'draft'])
      .single()

    if (gymError) {
      console.error('Error fetching gym:', gymError)
      return null
    }

    if (!gymData) {
      return null
    }

    // Fetch images separately with explicit order column and sorting
    // This ensures consistent ordering matching other pages (homepage, search, etc.)
    const { data: imagesData, error: imagesError } = await supabase
      .from('gym_images')
      .select('*')
      .eq('gym_id', id)
      .order('order', { ascending: true, nullsFirst: false })

    if (imagesError) {
      console.error('Error fetching images:', imagesError)
    }

    // Attach sorted images to gym data - images are already ordered by query, but ensure consistency
    const sortedImages = (imagesData || []).sort((a: any, b: any) => {
      const orderA = a.order !== null && a.order !== undefined ? a.order : 999
      const orderB = b.order !== null && b.order !== undefined ? b.order : 999
      return orderA - orderB
    })

    const data = {
      ...gymData,
      images: sortedImages
    }

    // Flatten reviews from bookings
    const bookingReviews = (data.reviews || []).flatMap((booking: any) => 
      (booking.reviews || []).map((review: any) => ({
        ...review,
        booking: { user_id: booking.user_id }
      }))
    )

    // MVP ONLY: Fetch manual reviews (gym_id based) - REMOVE BEFORE SHIPPING
    // Fetch in parallel with main query for better performance
    let manualReviews: any[] = []
    try {
      const { data: reviewsData } = await supabase
        .from('reviews')
        .select('id, rating, comment, created_at, reviewer_name')
        .eq('gym_id', id)
        .eq('manual_review', true)
        .limit(10) // Limit to prevent large queries
      manualReviews = reviewsData || []
    } catch (reviewError) {
      console.error('Error fetching manual reviews:', reviewError)
      // Continue without manual reviews
    }

    // Combine booking reviews and manual reviews
    const reviews = [
      ...bookingReviews,
      ...(manualReviews || []).map((review: any) => ({
        ...review,
        booking: null // Manual reviews don't have bookings
      }))
    ]

    return {
      ...data,
      reviews,
    } as GymWithDetails
  } catch (err) {
    console.error('Error in getGym:', err)
    return null
  }
}

export default async function GymDetailsPage({ params, searchParams }: { params: { id: string }, searchParams: { checkin?: string, checkout?: string } }) {
  const gym = await getGym(params.id)

  if (!gym) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-12 text-center">
            Gym not found
          </CardContent>
        </Card>
      </div>
    )
  }

  // Check if user is owner (for draft preview)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const isOwner = user && gym.owner_id === user.id
  const isDraft = gym.verification_status === 'draft'

  // Block public access to draft gyms (only owner can preview)
  if (isDraft && !isOwner) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <h2 className="text-2xl font-bold mb-4">Gym Not Available</h2>
            <p className="text-gray-600">This gym is not yet live and cannot be viewed.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const averageRating = gym.reviews.length > 0
    ? gym.reviews.reduce((sum, r) => sum + r.rating, 0) / gym.reviews.length
    : 0

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
                  {/* Reserve button - inline on mobile, separate on desktop */}
                  <div className="md:hidden flex-shrink-0">
                    <ReserveButton gym={gym} />
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 md:gap-2 text-gray-600 mb-2 md:mb-0">
                  <MapPin className="w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0" />
                  <span className="text-sm md:text-[15px]">{gym.city}, {gym.country}</span>
                  {gym.address && (
                    <>
                      <span className="text-gray-400 hidden md:inline">•</span>
                      <span className="text-sm md:text-[15px] break-words">{gym.address}</span>
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
              
              {/* Reserve button - Desktop only (mobile is inline above) */}
              <div className="hidden md:flex flex-col items-end gap-3 flex-shrink-0">
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
