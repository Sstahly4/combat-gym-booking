import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { FeaturedCarousel } from '@/components/featured-carousel'
import { SportTypeCarousel } from '@/components/sport-type-carousel'
import { TripPlanner } from '@/components/trip-planner'
import { SearchForm } from '@/components/search-form'
import { DestinationsCarousel } from '@/components/destinations-carousel'
import { ArrowRight, CalendarDays, PhoneCall, SlidersHorizontal, Sparkles } from 'lucide-react'

async function attachReviewStats(gyms: any[]) {
  if (!gyms || gyms.length === 0) return gyms || []
  const supabase = await createClient()
  const ids = gyms.map((g) => g.id).filter(Boolean)
  if (ids.length === 0) return gyms

  const { data: reviews } = await supabase
    .from('reviews')
    .select('gym_id, rating')
    .in('gym_id', ids)

  const byGym: Record<string, number[]> = {}
  reviews?.forEach((r: any) => {
    if (!r?.gym_id || typeof r.rating !== 'number') return
    if (!byGym[r.gym_id]) byGym[r.gym_id] = []
    byGym[r.gym_id].push(r.rating)
  })

  return gyms.map((gym) => {
    const ratings = byGym[gym.id] || []
    const averageRating = ratings.length > 0 ? ratings.reduce((s, n) => s + n, 0) / ratings.length : 0
    return {
      ...gym,
      averageRating,
      reviewCount: ratings.length,
    }
  })
}

async function getGyms(limit: number = 10) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('gyms')
    .select('*, images:gym_images(url, order)')
    .eq('verification_status', 'verified') // Only verified gyms
    .eq('status', 'approved')
    .limit(limit) 
  
  // Sort images by order for each gym
  if (data) {
    data.forEach((gym: any) => {
      if (gym.images && Array.isArray(gym.images)) {
        gym.images.sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
      }
    })
  }
  
  return await attachReviewStats(data || [])
}

async function getGymsWithPackages(limit: number = 20) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('gyms')
    .select(`
      *,
      images:gym_images(url, order),
      packages(id, type, includes_accommodation, name, description)
    `)
    .eq('verification_status', 'verified') // Only verified gyms
    .eq('status', 'approved')
    .limit(limit)
  
  // Sort images by order for each gym
  if (data) {
    data.forEach((gym: any) => {
      if (gym.images && Array.isArray(gym.images)) {
        gym.images.sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
      }
    })
  }
  
  return await attachReviewStats(data || [])
}

async function getTopRatedGyms(limit: number = 10) {
  const supabase = await createClient()
  
  // Fetch all verified gyms with images
  const { data: allGyms } = await supabase
    .from('gyms')
    .select('*, images:gym_images(url, order)')
    .eq('verification_status', 'verified') // Only verified gyms
    .eq('status', 'approved')
  
  if (!allGyms) return []
  
  // Sort images by order for each gym
  allGyms.forEach((gym: any) => {
    if (gym.images && Array.isArray(gym.images)) {
      gym.images.sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
    }
  })
  
  // Fetch all reviews (including manual reviews for MVP)
  const { data: allReviews } = await supabase
    .from('reviews')
    .select('gym_id, rating')
  
  // Group reviews by gym_id and calculate averages
  const reviewsByGym: Record<string, number[]> = {}
  allReviews?.forEach((review: any) => {
    if (review.gym_id && review.rating) {
      if (!reviewsByGym[review.gym_id]) {
        reviewsByGym[review.gym_id] = []
      }
      reviewsByGym[review.gym_id].push(review.rating)
    }
  })
  
  // Calculate ratings for each gym
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
  
  // Sort by rating (highest first), then by review count, then by name
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
  const supabase = await createClient()
  const { data } = await supabase
    .from('gyms')
    .select('disciplines')
    .eq('verification_status', 'verified') // Only verified gyms
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

export default async function Home({ searchParams }: { searchParams?: { checkin?: string, checkout?: string } }) {
  // Fetch gyms for all carousels in parallel for better performance
  const [allGyms, allGymsWithPackages, topRatedGyms, disciplineCounts] = await Promise.all([
    getGyms(20),
    getGymsWithPackages(20),
    getTopRatedGyms(10),
    getGymCountsByDiscipline()
  ])
  
  // Format dates for display
  const formatDateForDisplay = (dateString: string) => {
    if (!dateString) return ''
    const date = new Date(dateString + 'T00:00:00')
    const day = date.getDate()
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const month = months[date.getMonth()]
    return `${day} ${month}`
  }
  
  // Get dates from search params or use defaults
  const checkin = searchParams?.checkin || ''
  const checkout = searchParams?.checkout || ''
  
  // Format date range string - always show dates (use defaults if not set)
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)
  const nextDay = new Date(today)
  nextDay.setDate(today.getDate() + 2)
  
  const finalCheckin = checkin || today.toISOString().split('T')[0]
  const finalCheckout = checkout || nextDay.toISOString().split('T')[0]
  
  const dateDisplay = `${formatDateForDisplay(finalCheckin)}-${formatDateForDisplay(finalCheckout)}, 1 adult`
  
  // Get the most common country from approved gyms for the "Browse by sport type" section
  // Use cached data from allGyms to avoid extra query
  const countryCounts: Record<string, number> = {}
  allGyms?.forEach((gym: any) => {
    if (gym.country) {
      countryCounts[gym.country] = (countryCounts[gym.country] || 0) + 1
    }
  })
  
  const mostCommonCountry = Object.entries(countryCounts).reduce((a, b) => 
    countryCounts[a[0]] > countryCounts[b[0]] ? a : b, ['Thailand', 0]
  )[0] || 'Thailand'
  
  // Sport images mapping
  const sportImages: Record<string, string> = {
    'Muay Thai': '/N-8427.jpeg.avif',
    'Boxing': '/e079bedfbf7e870f827b4fda7ce2132f.avif',
    'MMA': '/1296749132.jpg',
    'BJJ': '/IMG_3557_246c0a62-a253-4f95-abfd-9cb306228c6c.jpg',
    'Wrestling': '/tjj8r5ovjts8nhqjhkqc.avif',
    'Kickboxing': '/Superbon-Singha-Mawynn-Chingiz-Allazov-ONE-Fight-Night-6-1920X1280-62.jpg',
  }
  
  // Filter disciplines that have at least 1 gym
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
      image: "https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?auto=format&fit=crop&w=800&q=80",
      flag: "🇹🇭"
    },
    {
      name: "Bangkok",
      image: "https://images.unsplash.com/photo-1508009603885-50cf7c579365?q=80&w=2250&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      flag: "🇹🇭"
    },
    {
      name: "Krabi",
      image: "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=800&q=80",
      flag: "🇹🇭"
    },
    {
      name: "Pattaya",
      image: "https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b?auto=format&fit=crop&w=800&q=80",
      flag: "🇹🇭"
    },
    {
      name: "Chiang Mai",
      image: "https://images.unsplash.com/photo-1710262210319-15266954e283?q=80&w=2708&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      flag: "🇹🇭"
    }
  ]

  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-[#003580] text-white pt-8 pb-8 md:pt-16 md:pb-16 relative">
        <div className="max-w-6xl mx-auto px-4">
          <div className="max-w-3xl">
            <h1 className="text-2xl md:text-5xl font-bold mb-3 md:mb-4 tracking-tight">
              Find your next fight camp
            </h1>
            <p className="text-base md:text-2xl text-blue-50 font-light mb-4 md:mb-6">
              Search for authentic Muay Thai, MMA, and BJJ gyms worldwide.
            </p>
            <Link href="/search">
              <Button size="lg" className="bg-[#006ce4] hover:bg-[#006ce4]/90 text-white font-medium px-4 py-3 md:px-6 md:py-6 text-sm md:text-lg rounded-sm">
                Book your dream camp
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Search Bar - Overlapping & Centered */}
      <div className="max-w-6xl mx-auto px-4 -mt-4 md:-mt-8 relative z-10">
        <SearchForm />
      </div>

      {/* Trending Destinations */}
      <section className="pt-4 pb-4 md:pt-6 md:pb-6 bg-white">
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
                <img 
                  src={city.image} 
                  alt={city.name} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
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
                <img 
                  src={city.image} 
                  alt={city.name} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
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

      {/* Order swap: Trip Planner goes where Popular was; Popular goes where Trip Planner was (mobile + desktop). */}
      <div className="flex flex-col">
        {/* Popular Training Camps */}
        <section className="order-[50] md:order-[50] pt-4 pb-4 md:pt-6 md:pb-6 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-xl md:text-2xl font-bold mb-2 text-gray-900">Popular Training Camps</h2>
            <p className="text-sm md:text-base text-gray-700 mb-3 md:mb-4">From intensive fight camps to holistic training retreats, find your perfect match</p>
            <FeaturedCarousel gyms={allGyms.slice(0, 10)} />
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
        <section className="order-[40] md:order-[40] pt-4 pb-4 md:pt-6 md:pb-6 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-xl md:text-2xl font-bold mb-2 text-gray-900">Top Rated Camps</h2>
            <p className="text-sm md:text-base text-gray-700 mb-3 md:mb-4">Highly rated by fighters who've trained there - verified reviews from real bookings</p>
            <FeaturedCarousel gyms={topRatedGyms} />
          </div>
        </section>

        {/* Mobile-only feature shortcuts (Booking.com-style break section) - Hidden on mobile */}
        <section className="order-[45] hidden md:block pt-0 pb-4 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
              <Link
                href="/how-it-works"
                className="flex items-center justify-between gap-3 px-3 py-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <Sparkles className="w-4 h-4 text-[#003580] mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-sm font-semibold text-gray-900 leading-snug">How it works</div>
                    <div className="text-xs text-gray-600 leading-snug mt-0.5">
                      Request a spot, get confirmation, then you’re set.
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
              </Link>

              <div className="h-px bg-gray-200" />

              <Link
                href="/search"
                className="flex items-center justify-between gap-3 px-3 py-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <SlidersHorizontal className="w-4 h-4 text-[#003580] mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-sm font-semibold text-gray-900 leading-snug">Explore camps</div>
                    <div className="text-xs text-gray-600 leading-snug mt-0.5">
                      Compare locations, disciplines, and packages.
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
              </Link>

              <div className="h-px bg-gray-200" />

              <Link
                href="/bookings"
                className="flex items-center justify-between gap-3 px-3 py-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <CalendarDays className="w-4 h-4 text-[#003580] mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-sm font-semibold text-gray-900 leading-snug">Your bookings</div>
                    <div className="text-xs text-gray-600 leading-snug mt-0.5">
                      Access your booking details anytime.
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
              </Link>

              <div className="h-px bg-gray-200" />

              <Link
                href="/contact"
                className="flex items-center justify-between gap-3 px-3 py-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <PhoneCall className="w-4 h-4 text-[#003580] mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-sm font-semibold text-gray-900 leading-snug">Need help choosing?</div>
                    <div className="text-xs text-gray-600 leading-snug mt-0.5">
                      Tell us your goals — we’ll suggest great options.
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
              </Link>
            </div>
          </div>
        </section>

        {/* Trip Planner */}
        <section className="order-[10] md:order-[10] pt-4 pb-4 md:pt-6 md:pb-6 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <TripPlanner gyms={allGymsWithPackages} />
          </div>
        </section>
      </div>

      {/* Training Holidays - Hidden on mobile */}
      <section className="hidden md:block pt-4 pb-4 md:pt-6 md:pb-6 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-xl md:text-2xl font-bold mb-2 text-gray-900">Training Holidays</h2>
          <p className="text-sm md:text-base text-gray-700 mb-3 md:mb-4">Combine training with vacation in stunning locations</p>
          <FeaturedCarousel gyms={allGyms.slice(0, 10)} />
        </div>
      </section>

      {/* Beginner-Friendly Camps - Hidden on mobile */}
      <section className="hidden md:block pt-4 pb-4 md:pt-6 md:pb-6 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-xl md:text-2xl font-bold mb-2 text-gray-900">Beginner-Friendly Camps</h2>
          <p className="text-sm md:text-base text-gray-700 mb-3 md:mb-4">Perfect for those starting their combat sports journey</p>
          <FeaturedCarousel gyms={allGyms.slice(0, 10)} />
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
  )
}
