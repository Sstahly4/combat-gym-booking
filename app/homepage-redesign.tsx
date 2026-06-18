import Link from 'next/link'
import Image from 'next/image'
import { Suspense } from 'react'
import { FeaturedCarousel } from '@/components/featured-carousel'
import { SportTypeCarousel } from '@/components/sport-type-carousel'
import { TripPlanner } from '@/components/trip-planner'
import { HomepageHero } from '@/components/homepage-hero'
import { HomepageCarouselSkeleton } from '@/components/homepage-carousel-skeleton'
import { HomepageFirstRowSkeleton } from '@/components/homepage-first-row-skeleton'
import { HomepageMobilePopularFast } from '@/components/homepage-mobile-popular-fast'
import { OffersSection } from '@/components/offers-section'
import { BookingProvider } from '@/lib/contexts/booking-context'
import { BLUR_DATA_URL } from '@/lib/images/blur'
import { homepageSportTileVariants } from '@/lib/homepage/homepage-sport-tile-images'
import { getHomepageDataCached } from '@/lib/homepage/fetch-homepage-data'
import {
  buildHomepageRow,
  compareByQuality,
  countGymsInDestination,
  hasBeachsideSignal,
  hasBeginnerSignal,
  hasHolidaySignal,
  hasTrainStayPackageSignal,
  HOMEPAGE_ROW_SIZE_DESKTOP,
  HOMEPAGE_ROW_SIZE_MOBILE,
} from '@/lib/homepage/homepage-rows'

export default async function HomepageRedesign({
  searchParams,
}: {
  searchParams?: { checkin?: string; checkout?: string }
}) {
  return (
    <BookingProvider>
      <main className="min-h-screen bg-white">
        <HomepageHero />
        <Suspense fallback={<HomepageFirstRowSkeleton />}>
          <HomepageMobilePopularFast />
        </Suspense>
        <Suspense fallback={<HomepageCarouselSkeleton />}>
          <HomepageCarouselContent searchParams={searchParams} />
        </Suspense>
      </main>
    </BookingProvider>
  )
}

async function HomepageCarouselContent({
  searchParams,
}: {
  searchParams?: { checkin?: string; checkout?: string }
}) {
  const { allGymsWithPackages, topRatedGyms, disciplineCounts, offers, firstRowIds } =
    await getHomepageDataCached()

  const formatDateForDisplay = (dateString: string) => {
    if (!dateString) return ''
    const date = new Date(`${dateString}T00:00:00`)
    const day = date.getDate()
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const month = months[date.getMonth()]
    return `${day} ${month}`
  }

  const checkin = searchParams?.checkin || ''
  const checkout = searchParams?.checkout || ''

  const today = new Date()
  const nextDay = new Date(today)
  nextDay.setDate(today.getDate() + 2)

  const finalCheckin = checkin || today.toISOString().split('T')[0]
  const finalCheckout = checkout || nextDay.toISOString().split('T')[0]

  const dateDisplay = `${formatDateForDisplay(finalCheckin)}-${formatDateForDisplay(finalCheckout)}, 1 adult`

  const countryCounts: Record<string, number> = {}
  allGymsWithPackages?.forEach((gym: any) => {
    if (gym.country) {
      countryCounts[gym.country] = (countryCounts[gym.country] || 0) + 1
    }
  })

  const mostCommonCountry =
    Object.entries(countryCounts).reduce((a, b) => (countryCounts[a[0]] > countryCounts[b[0]] ? a : b), [
      'Thailand',
      0,
    ])[0] || 'Thailand'

  const availableSports = ['Muay Thai', 'MMA', 'BJJ', 'Boxing', 'Wrestling', 'Kickboxing']
    .filter((sport) => (disciplineCounts[sport] || 0) > 0)
    .map((sport) => ({
      name: sport,
      image: homepageSportTileVariants(sport),
      count: disciplineCounts[sport] || 0,
    }))

  const destinations = [
    {
      name: 'Phuket',
      image: '/phuket.jpg',
      flag: '🇹🇭',
      availableCount: countGymsInDestination(allGymsWithPackages, 'Phuket'),
    },
    {
      name: 'Bangkok',
      image: '/Bangkok-Thailand.jpg',
      flag: '🇹🇭',
      availableCount: countGymsInDestination(allGymsWithPackages, 'Bangkok'),
    },
    {
      name: 'Krabi',
      image: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=800&q=80',
      flag: '🇹🇭',
      availableCount: countGymsInDestination(allGymsWithPackages, 'Krabi'),
    },
    {
      name: 'Pattaya',
      image: '/pattaya.jpg',
      flag: '🇹🇭',
      availableCount: countGymsInDestination(allGymsWithPackages, 'Pattaya'),
    },
    {
      name: 'Chiang Mai',
      image: '/chiang-mai-thailand-16by9.webp',
      flag: '🇹🇭',
      availableCount: countGymsInDestination(allGymsWithPackages, 'Chiang Mai'),
    },
  ]

  const homepagePool = [...allGymsWithPackages].sort(compareByQuality)
  const topRatedIds = new Set<string>(topRatedGyms.map((gym: any) => gym.id).filter(Boolean))

  const usedDesktop = new Set<string>(topRatedIds)
  const popularTrainingGymsDesktop = buildHomepageRow({
    pool: homepagePool,
    primary: () => true,
    sort: compareByQuality,
    used: usedDesktop,
    limit: HOMEPAGE_ROW_SIZE_DESKTOP,
  })
  const trainingHolidayGymsDesktop = buildHomepageRow({
    pool: homepagePool,
    primary: hasHolidaySignal,
    sort: compareByQuality,
    used: usedDesktop,
    limit: HOMEPAGE_ROW_SIZE_DESKTOP,
  })
  const beginnerFriendlyGymsDesktop = buildHomepageRow({
    pool: homepagePool,
    primary: hasBeginnerSignal,
    sort: compareByQuality,
    used: usedDesktop,
    limit: HOMEPAGE_ROW_SIZE_DESKTOP,
  })

  const usedMobile = new Set<string>([...topRatedIds, ...firstRowIds])
  const trainAndStayGymsMobile = buildHomepageRow({
    pool: homepagePool,
    primary: hasTrainStayPackageSignal,
    sort: compareByQuality,
    used: usedMobile,
    limit: HOMEPAGE_ROW_SIZE_MOBILE,
  })
  const beachsideTrainingGymsMobile = buildHomepageRow({
    pool: homepagePool,
    primary: hasBeachsideSignal,
    sort: compareByQuality,
    used: usedMobile,
    limit: HOMEPAGE_ROW_SIZE_MOBILE,
  })
  const trainingHolidayGymsMobile = buildHomepageRow({
    pool: homepagePool,
    primary: hasHolidaySignal,
    sort: compareByQuality,
    used: usedMobile,
    limit: HOMEPAGE_ROW_SIZE_MOBILE,
  })
  const beginnerFriendlyGymsMobile = buildHomepageRow({
    pool: homepagePool,
    primary: hasBeginnerSignal,
    sort: compareByQuality,
    used: usedMobile,
    limit: HOMEPAGE_ROW_SIZE_MOBILE,
  })

  return (
    <>
      <OffersSection offers={offers} />

      <div className="relative z-0 flex flex-col">
        <div className="hidden md:flex md:flex-col">
          <section className="order-[5] pt-4 pb-4 md:pt-6 md:pb-6 bg-white">
            <div className="max-w-6xl mx-auto px-4">
              <h2 className="text-xl md:text-2xl font-bold mb-2 text-gray-900">Top Rated Camps</h2>
              <p className="text-sm md:text-base text-gray-700 mb-3 md:mb-4">
                Highly rated by fighters who&apos;ve trained there - verified reviews from real bookings
              </p>
              <FeaturedCarousel gyms={topRatedGyms} priorityCount={3} />
            </div>
          </section>

          <section className="order-[10] pt-4 pb-4 md:pt-6 md:pb-6 bg-white">
            <div className="max-w-6xl mx-auto px-4">
              <TripPlanner gyms={allGymsWithPackages} />
            </div>
          </section>

          <section className="order-[15] pt-4 pb-4 md:pt-6 md:pb-6 bg-white">
            <div className="max-w-6xl mx-auto px-4">
              <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4 text-gray-900">Trending destinations</h2>
              <div className="grid grid-cols-6 gap-4">
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

          <section className="order-[20] pt-3 pb-4 md:pt-4 md:pb-6 bg-white">
            <div className="max-w-6xl mx-auto px-4">
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-3 md:p-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0">
                  <div className="flex-1">
                    <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-1 md:mb-2">
                      Book with confidence
                    </h3>
                    <p className="text-xs md:text-sm text-gray-600">
                      Secure payments, verified gyms, and instant booking confirmations. Your training journey starts
                      here.
                    </p>
                  </div>
                  <Link
                    href="/search"
                    className="text-xs md:text-sm text-[#003580] font-medium hover:underline whitespace-nowrap md:ml-4"
                  >
                    Start searching →
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {availableSports.length > 0 && (
            <section className="order-[30] pt-4 pb-4 md:pt-6 md:pb-6 bg-white">
              <div className="max-w-6xl mx-auto px-4">
                <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4 text-gray-900">
                  Browse by sport type in {mostCommonCountry}
                </h2>
                <SportTypeCarousel
                  sports={availableSports}
                  country={mostCommonCountry}
                  dateDisplay={dateDisplay}
                  priorityCount={0}
                />
              </div>
            </section>
          )}

          <section className="order-[50] pt-4 pb-4 md:pt-6 md:pb-6 bg-white">
            <div className="max-w-6xl mx-auto px-4">
              <h2 className="text-xl md:text-2xl font-bold mb-2 text-gray-900">Popular Training Camps</h2>
              <p className="text-sm md:text-base text-gray-700 mb-3 md:mb-4">
                From intensive fight camps to holistic training retreats, find your perfect match
              </p>
              <FeaturedCarousel gyms={popularTrainingGymsDesktop} />
            </div>
          </section>
        </div>

        <div className="md:hidden flex flex-col">
          <section className="pt-4 pb-4 bg-white">
            <div className="max-w-6xl mx-auto px-4">
              <h2 className="text-xl font-bold mb-2 text-gray-900">Top Rated Camps</h2>
              <p className="text-sm text-gray-700 mb-3">
                Highly rated by fighters who&apos;ve trained there - verified reviews from real bookings
              </p>
              <FeaturedCarousel gyms={topRatedGyms} priorityCount={0} />
            </div>
          </section>
          <section className="pt-4 pb-4 bg-white">
            <div className="max-w-6xl mx-auto px-4">
              <h2 className="text-xl font-bold mb-2 text-gray-900">Train &amp; stay</h2>
              <p className="text-sm text-gray-700 mb-3">
                Camps with accommodation packages so you can train hard and stay on-site or nearby.
              </p>
              <FeaturedCarousel gyms={trainAndStayGymsMobile} />
            </div>
          </section>
          <section className="pt-4 pb-4 bg-white">
            <div className="max-w-6xl mx-auto px-4">
              <h2 className="text-xl font-bold mb-2 text-gray-900">Beachside training</h2>
              <p className="text-sm text-gray-700 mb-3">
                Thailand islands and coast—train with sand and sea a short ride away.
              </p>
              <FeaturedCarousel gyms={beachsideTrainingGymsMobile} />
            </div>
          </section>
        </div>

        <section className="pt-4 pb-4 md:pt-6 md:pb-6 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-xl md:text-2xl font-bold mb-2 text-gray-900">Training Holidays</h2>
            <p className="text-sm md:text-base text-gray-700 mb-3 md:mb-4">
              Combine training with vacation in stunning locations
            </p>
            <div className="md:hidden">
              <FeaturedCarousel gyms={trainingHolidayGymsMobile} />
            </div>
            <div className="hidden md:block">
              <FeaturedCarousel gyms={trainingHolidayGymsDesktop} />
            </div>
          </div>
        </section>

        <section className="pt-4 pb-4 md:pt-6 md:pb-6 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-xl md:text-2xl font-bold mb-2 text-gray-900">Beginner-Friendly Camps</h2>
            <p className="text-sm md:text-base text-gray-700 mb-3 md:mb-4">
              Perfect for those starting their combat sports journey
            </p>
            <div className="md:hidden">
              <FeaturedCarousel gyms={beginnerFriendlyGymsMobile} />
            </div>
            <div className="hidden md:block">
              <FeaturedCarousel gyms={beginnerFriendlyGymsDesktop} />
            </div>
          </div>
        </section>
      </div>

      <section className="pt-4 pb-8 md:pt-6 md:pb-12 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="border border-[#003580] rounded-lg shadow-sm p-4 md:p-8 bg-white">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-0">
              <div className="max-w-2xl">
                <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2 md:mb-3">We&apos;re here to help</h3>
                <p className="text-sm md:text-base text-gray-600 leading-relaxed">
                  Your training journey matters to us. From finding the perfect camp to ensuring your booking goes
                  smoothly, we&apos;re committed to making your combat sports experience exceptional. Our team is always
                  ready to assist you every step of the way.
                </p>
              </div>
              <Link
                href="/contact"
                className="text-xs md:text-sm text-[#003580] font-medium hover:underline whitespace-nowrap md:ml-6"
              >
                Contact Support →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
