import type { Metadata } from 'next'
import { Suspense } from 'react'
import { notFound, permanentRedirect } from 'next/navigation'
import { unstable_cache } from 'next/cache'
import { createPublicClient } from '@/lib/supabase/public-server'
import { Card, CardContent } from '@/components/ui/card'
import type { GymImage } from '@/lib/types/database'
import { PackagesList } from '@/components/packages-list'
import { GymGallery } from '@/components/gym-gallery'
import { GymGalleryMobileWrapper } from '@/components/gym-gallery-mobile-wrapper'
import { GymMap } from '@/components/gym-map'
import { GymContextNav } from '@/components/gym/gym-context-nav'
import { GymFaqSection } from '@/components/gym/gym-faq-section'
import { GymCheckoutExitCleanup } from '@/components/gym/gym-checkout-exit-cleanup'
import { GymPageCurrencyHint } from '@/lib/contexts/currency-context'
import { GymPageClientShell } from '@/components/gym/gym-page-client-shell'
import { GymReviewsCarouselSection } from '@/components/gym/gym-reviews-section'
import { GymReviewsCarouselSkeleton } from '@/components/gym/gym-reviews-skeleton'
import { ReserveButton } from '@/components/reserve-button'
import { SaveButton } from '@/components/save-button'
import { PropertyHighlightsCard } from '@/components/property-highlights-card'
import { ReviewsLinkButton } from '@/components/reviews-link-button'
import { GymDescription } from '@/components/gym-description'
import { TrainingSchedule } from '@/components/training-schedule'
import { ShowOnMapLink } from '@/components/show-on-map-link'
import { GymAddressCopy } from '@/components/gym-address-copy'
import { MapPin, Star } from 'lucide-react'
import { formatLandmarksText } from '@/lib/utils/landmarks'
import { ThingsToDoCard } from '@/components/things-to-do-card'
import { gymImageSrc, gymImageSrcSet } from '@/lib/images/gym-image-variants'
import {
  getOwnerDraftGym,
  getPublicGym,
  getPublicGymBySlug,
  getGymReviews,
} from '@/lib/gym/gym-listing-data'
import { looksLikeUuid } from '@/lib/utils/gym-route'
import { isPublicGymListing, PUBLIC_GYM_VERIFICATION_STATUSES } from '@/lib/seo/gym-public-status'
import { buildGymMetaDescription } from '@/lib/seo/gym-meta-description'
import { gymCanonicalPath } from '@/lib/seo/gym-canonical-path'
import { buildGymPageJsonLd, normalizeGymFaq } from '@/lib/seo/gym-page-schema'

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

export const revalidate = 3600
export const dynamicParams = true

export async function generateStaticParams() {
  try {
    const supabase = createPublicClient()
    const { data, error } = await supabase
      .from('gyms')
      .select('id, reviews:bookings(reviews(id))')
      .in('verification_status', [...PUBLIC_GYM_VERIFICATION_STATUSES])
      .eq('status', 'approved')
      .limit(300)
    if (error || !data) return []

    const ranked = data
      .map((g: { id: string; reviews?: { reviews?: { id: string }[] }[] }) => ({
        id: g.id,
        count: (g.reviews || []).reduce(
          (sum, b) => sum + (b?.reviews || []).length,
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

const getGymMetadata = unstable_cache(
  async (idOrSlug: string) => {
    const supabase = createPublicClient()
    const { data } = await supabase
      .from('gyms')
      .select(
        'id, slug, name, description, tagline, city, disciplines, verification_status, amenities, images:gym_images(url, variants, order)',
      )
      .or(looksLikeUuid(idOrSlug) ? `id.eq.${idOrSlug}` : `slug.eq.${idOrSlug}`)
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

  if (!data || !isPublicGymListing(data.verification_status)) {
    return {
      title: 'Gym Not Found | CombatStay',
      robots: { index: false, follow: false },
    }
  }

  const name = data.name?.trim() || 'Training Camp'
  const city: string = data.city?.trim() || ''
  const rawDisciplines: string[] = Array.isArray(data.disciplines) ? data.disciplines : []

  const disciplineLabel =
    rawDisciplines.length > 0
      ? rawDisciplines.slice(0, 2).join(' & ')
      : 'Combat Sports'
  const titleCity = city ? ` ${city}` : ''
  const pageTitle = `${name}${titleCity} | ${disciplineLabel} Training | CombatStay`

  const metaDescription = buildGymMetaDescription({
    name,
    city,
    tagline: data.tagline,
    description: data.description,
    firstDiscipline: rawDisciplines[0] ?? 'combat sports',
    amenities: data.amenities as Record<string, unknown> | null,
  })

  const canonicalSlug = data.slug || params.id
  const canonicalPath = gymCanonicalPath({ id: data.id, slug: canonicalSlug })

  type MetadataCoverImage = { url: string; variants?: GymImage['variants']; order?: number | null }
  const metaImages = (data as { images?: MetadataCoverImage[] }).images
  const coverImage = Array.isArray(metaImages)
    ? [...metaImages].sort((a, b) => (a.order ?? 999) - (b.order ?? 999))[0]
    : undefined
  const ogImage = coverImage ? gymImageSrc(coverImage) : undefined

  return {
    title: pageTitle,
    description: metaDescription,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title: pageTitle,
      description: metaDescription,
      url: canonicalPath,
      type: 'website',
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },
    twitter: {
      card: ogImage ? 'summary_large_image' : 'summary',
      title: pageTitle,
      description: metaDescription,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  }
}

export default async function GymDetailsPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams?: Record<string, string | string[] | undefined>
}) {
  const idOrSlug = params.id
  let gym = looksLikeUuid(idOrSlug) ? await getPublicGym(idOrSlug) : await getPublicGymBySlug(idOrSlug)
  let isOwner = false
  if (!gym) {
    gym = looksLikeUuid(idOrSlug) ? await getOwnerDraftGym(idOrSlug) : null
    isOwner = !!gym
  }

  if (!gym) {
    notFound()
  }

  const isDraft = gym.verification_status === 'draft'

  if (!isPublicGymListing(gym.verification_status) && !isOwner) {
    notFound()
  }

  if (looksLikeUuid(idOrSlug) && gym.slug?.trim()) {
    const qs = new URLSearchParams()
    if (searchParams) {
      for (const [key, value] of Object.entries(searchParams)) {
        if (typeof value === 'string') qs.set(key, value)
        else if (Array.isArray(value)) value.forEach((v) => qs.append(key, v))
      }
    }
    const query = qs.toString()
    permanentRedirect(`${gymCanonicalPath(gym)}${query ? `?${query}` : ''}`)
  }

  const { reviewCount, averageRating } = gym

  const primaryImage =
    gym.images && gym.images.length > 0 ? gym.images[0]?.url : undefined

  const gymPublicPath = gymCanonicalPath(gym)
  const faqItems = normalizeGymFaq(gym.faq)
  const schemaReviews = reviewCount > 0 ? await getGymReviews(gym.id) : []

  const gymPageLd = buildGymPageJsonLd({
    gym,
    gymPublicPath,
    packages: gym.packages,
    reviewCount,
    averageRating,
    primaryImage: primaryImage || undefined,
    reviews: schemaReviews,
    faqItems,
  })

  let landmarksText = ''
  if (gym.nearby_attractions && Array.isArray(gym.nearby_attractions) && gym.nearby_attractions.length > 0) {
    landmarksText = formatLandmarksText(gym.nearby_attractions)
  }

  const gymSlugOrId = gym.slug?.trim() || gym.id
  const coverImage = gym.images[0]
  const coverPreloadHref = coverImage ? gymImageSrc(coverImage) : null
  const coverPreloadSrcSet = coverImage ? gymImageSrcSet(coverImage) : undefined

  return (
    <GymPageClientShell gymId={gym.id} gymSlugOrId={gymSlugOrId}>
      {coverPreloadHref ? (
        <link
          rel="preload"
          as="image"
          href={coverPreloadHref}
          {...(coverPreloadSrcSet
            ? { imageSrcSet: coverPreloadSrcSet, imageSizes: '100vw' }
            : {})}
          fetchPriority="high"
        />
      ) : null}
      <GymCheckoutExitCleanup gymId={gym.id} />
      <GymPageCurrencyHint currency={gym.currency} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(gymPageLd) }}
      />
      <div className="min-h-screen bg-white pb-12">
        {isDraft && isOwner && (
          <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-slate-50 py-2.5 md:py-3">
            <div className="max-w-6xl mx-auto px-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs md:text-sm font-medium text-slate-700">
                Preview mode: your gym is still in draft and not visible publicly until verification is complete.
              </p>
              <a
                href="/manage"
                className="inline-flex w-fit items-center rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Exit preview mode
              </a>
            </div>
          </div>
        )}

        <div className="bg-white border-b border-gray-200 py-4 md:py-6">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-3 md:gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3 mb-2 md:mb-0">
                  <h1 className="text-xl md:text-3xl lg:text-4xl font-bold text-gray-900 leading-tight flex-1 min-w-0">{gym.name}</h1>
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
                  <ShowOnMapLink />
                </div>
                {averageRating > 0 && (
                  <div className="md:hidden flex items-center gap-1.5 flex-wrap mt-1">
                    <StarRating rating={Math.round(averageRating)} />
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-semibold text-gray-900">{averageRating.toFixed(1)}</span>
                      <span className="text-xs text-gray-600">({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="hidden md:flex items-center gap-2 flex-shrink-0">
                <SaveButton gymId={gym.id} inline />
                <ReserveButton gym={gym} />
              </div>
            </div>
          </div>
        </div>

        <div className="md:hidden w-full">
          <GymGalleryMobileWrapper images={gym.images} gymName={gym.name} />
        </div>

        <div className="md:hidden w-full px-4 py-4 space-y-6">
          <GymDescription
            gymName={gym.name}
            description={gym.description}
            landmarksText={landmarksText}
            amenities={gym.amenities}
            disciplines={gym.disciplines}
          />
          <div id="packages" className="border-t border-gray-200 pt-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-900">Available Packages</h2>
            <PackagesList packages={gym.packages} gym={gym} />
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-4 md:py-8">
          <div className="grid lg:grid-cols-3 gap-6 md:gap-10">
            <div className="lg:col-span-1 space-y-4 md:space-y-6 order-1 lg:order-2">
              <PropertyHighlightsCard
                gym={gym}
                averageRating={averageRating}
                reviewCount={reviewCount}
                googleMapsKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || ''}
              />

              {averageRating > 0 && (
                <Card className="hidden md:block border border-gray-200 shadow-sm">
                  <CardContent className="p-4 md:p-5">
                    <div className="flex items-center justify-between mb-2 md:mb-3">
                      <h3 className="font-bold text-base md:text-lg text-gray-900">Guest Reviews</h3>
                      <StarRating rating={Math.round(averageRating)} />
                    </div>
                    <div className="flex items-center gap-2 mb-2 md:mb-3">
                      <span className="text-gray-600 text-xs md:text-sm font-medium">{averageRating.toFixed(1)}</span>
                      <span className="text-gray-400 text-xs md:text-sm">({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})</span>
                    </div>
                    <p className="text-xs md:text-sm text-gray-600 mb-2 md:mb-3">
                      {reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}
                    </p>
                    {reviewCount > 0 && <ReviewsLinkButton />}
                  </CardContent>
                </Card>
              )}

              <div data-gym-map-anchor className="hidden md:block">
                <GymMap gym={gym} googleMapsKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || ''} />
              </div>

              {gym.things_to_do && gym.things_to_do.length >= 2 && (
                <div className="md:hidden">
                  <ThingsToDoCard city={gym.city} items={gym.things_to_do} />
                </div>
              )}

              {(gym.opening_hours || gym.training_schedule) && (
                <Card className="border border-gray-200 shadow-sm">
                  <CardContent className="p-4 md:p-5">
                    {gym.opening_hours && (() => {
                      const dayOrder = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
                      const sortedHours = dayOrder
                        .map((day) => ({ day, hours: gym.opening_hours![day] }))
                        .filter((item) => item.hours !== undefined)

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
                    {gym.training_schedule ? (
                      <TrainingSchedule trainingSchedule={gym.training_schedule} />
                    ) : null}
                  </CardContent>
                </Card>
              )}

              {gym.things_to_do && gym.things_to_do.length >= 2 && (
                <div className="hidden md:block">
                  <ThingsToDoCard city={gym.city} items={gym.things_to_do} />
                </div>
              )}
            </div>

            <div className="lg:col-span-2 space-y-6 md:space-y-10 order-2 lg:order-1">
              <div className="hidden md:block">
                <GymGallery images={gym.images} gymName={gym.name} />
              </div>
              <div className="hidden md:block">
                <GymDescription
                  gymName={gym.name}
                  description={gym.description}
                  landmarksText={landmarksText}
                  amenities={gym.amenities}
                  disciplines={gym.disciplines}
                />
              </div>
              <div id="packages" className="hidden md:block border-t border-gray-200 pt-6 md:pt-8">
                <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-4 text-gray-900">Available Packages</h2>
                <PackagesList packages={gym.packages} gym={gym} />
              </div>
            </div>
          </div>

          <div id="reviews" className="border-t border-gray-200 pt-6 md:pt-8 mt-6 md:mt-10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0 mb-4">
              <h2 className="text-lg md:text-xl font-semibold text-gray-900">Guest Reviews</h2>
              {averageRating > 0 && (
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="text-right">
                    <div className="text-xs md:text-sm text-gray-600">Excellent</div>
                    <div className="text-[10px] md:text-xs text-gray-500">{reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}</div>
                  </div>
                  <div className="bg-[#003580] text-white px-2.5 md:px-3 py-1.5 md:py-2 rounded-md text-lg md:text-xl font-bold min-w-[50px] md:min-w-[60px] text-center">
                    {averageRating.toFixed(1)}
                  </div>
                </div>
              )}
            </div>
            {reviewCount === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 px-6 py-10 text-center">
                {isDraft && isOwner ? (
                  <>
                    <p className="text-base font-semibold tracking-tight text-slate-800">
                      You are still in draft mode.
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">
                      Guest reviews will appear here once your listing is verified, live, and bookings are completed.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-base font-semibold tracking-tight text-slate-800">No reviews yet</p>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">
                      Reviews from verified stays will appear here after guests complete their trips.
                    </p>
                  </>
                )}
              </div>
            ) : (
              <Suspense fallback={<GymReviewsCarouselSkeleton />}>
                <GymReviewsCarouselSection gymId={gym.id} />
              </Suspense>
            )}
          </div>

          <GymFaqSection items={faqItems} />
          <GymContextNav gym={gym} />
        </div>
      </div>
    </GymPageClientShell>
  )
}
