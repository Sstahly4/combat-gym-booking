'use client'

import { useRef, useState, useEffect } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface TripPlannerProps {
  gyms: any[]
}

const filterCategories = [
  { id: 'train-stay', label: 'Train & Stay', searchParams: '/search?accommodation=true' },
  { id: 'beachside', label: 'BeachSide Training', searchParams: '/search?location=Phuket' },
  { id: 'authentic', label: 'Authentic Experience', searchParams: '/search?discipline=Muay Thai' },
  { id: 'all-inclusive', label: 'All Inclusive', searchParams: '/search' },
  { id: 'beginner', label: 'Beginner Friendly', searchParams: '/search' },
  { id: 'hardcore', label: 'Hardcore Training', searchParams: '/search' },
]

// Beach cities in Thailand
const beachCities = ['Phuket', 'Krabi', 'Pattaya', 'Koh Samui', 'Koh Phangan', 'Koh Tao', 'Hua Hin', 'Cha-am']

export function TripPlanner({ gyms }: TripPlannerProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  const [selectedFilter, setSelectedFilter] = useState('train-stay')

  // Filter gyms based on selected filter
  // Data arrives pre-sorted by rating (highest first) from the server
  const filterGyms = () => {
    if (!gyms || gyms.length === 0) return []

    const hasValidPackages = (gym: any) =>
      gym.packages && Array.isArray(gym.packages) && gym.packages.length > 0

    switch (selectedFilter) {
      case 'all-inclusive':
        // Gyms with all_inclusive packages
        return gyms.filter((gym: any) => {
          if (!hasValidPackages(gym)) return false
          return gym.packages.some((pkg: any) =>
            pkg.type === 'all_inclusive' || pkg.includes_meals === true
          )
        })
      
      case 'train-stay':
        // Gyms with accommodation packages
        return gyms.filter((gym: any) => {
          if (!hasValidPackages(gym)) return false
          return gym.packages.some((pkg: any) =>
            pkg.type === 'accommodation' || pkg.includes_accommodation === true
          )
        })
      
      case 'beachside':
        // Gyms in beach cities
        return gyms.filter((gym: any) => 
          beachCities.some(city => 
            gym.city?.toLowerCase().includes(city.toLowerCase())
          )
        )
      
      case 'authentic':
        // Gyms with Muay Thai discipline
        return gyms.filter((gym: any) => 
          gym.disciplines && Array.isArray(gym.disciplines) && 
          gym.disciplines.some((d: string) => d.toLowerCase().includes('muay thai'))
        )
      
      case 'beginner':
        return gyms
      
      case 'hardcore':
        return gyms
      
      default:
        return gyms
    }
  }

  const filteredGyms = filterGyms()
  
  const displayGyms = filteredGyms.length > 0 ? filteredGyms.slice(0, 10) : gyms.slice(0, 10) // Fallback to all gyms if filter returns nothing

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1)
    }
  }

  useEffect(() => {
    checkScroll()
    window.addEventListener('resize', checkScroll)
    return () => window.removeEventListener('resize', checkScroll)
  }, [selectedFilter])

  useEffect(() => {
    // Recheck scroll when filtered gyms change
    setTimeout(checkScroll, 100)
  }, [filteredGyms.length])

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const containerWidth = scrollRef.current.clientWidth
      const gap = window.innerWidth < 768 ? 12 : 16
      // On mobile: 2 cards per view (50vw), on desktop: 5 cards per view
      const itemWidth = window.innerWidth < 768
        ? (containerWidth - gap) / 2
        : (containerWidth - (4 * gap)) / 5
      const scrollAmount = itemWidth + gap

      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      })
    }
  }

  return (
    <div>
      {/* Title and Subtitle */}
      <div className="mb-4 md:mb-6">
        <h2 className="text-xl md:text-3xl font-bold text-gray-900 mb-1 md:mb-2">Find your perfect training experience</h2>
        <p className="text-sm md:text-base text-gray-600">Choose your training style and discover top camps in Thailand</p>
      </div>

      {/* Filter Categories */}
      <div className="flex gap-2 md:gap-3 mb-4 md:mb-6 overflow-x-auto pb-2 no-scrollbar">
        {filterCategories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedFilter(category.id)}
            className={`px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-medium whitespace-nowrap transition-all ${
              selectedFilter === category.id
                ? 'bg-blue-50 text-[#003580] border border-[#003580]'
                : 'text-gray-700 border border-transparent hover:border-gray-300'
            }`}
          >
            {category.label}
          </button>
        ))}
      </div>

      {/* Carousel */}
      <div className="relative group">
        {/* Left Button */}
        {canScrollLeft && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 bg-white shadow-md rounded-full w-8 h-8 md:w-10 md:h-10 hover:bg-gray-50 border flex opacity-0 md:group-hover:opacity-100 transition-opacity"
            onClick={() => scroll('left')}
          >
            <ChevronLeft className="h-4 w-4 md:h-6 md:w-6 text-gray-700" />
          </Button>
        )}

        {/* Right Button */}
        {canScrollRight && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 bg-white shadow-md rounded-full w-8 h-8 md:w-10 md:h-10 hover:bg-gray-50 border flex opacity-0 md:group-hover:opacity-100 transition-opacity"
            onClick={() => scroll('right')}
          >
            <ChevronRight className="h-4 w-4 md:h-6 md:w-6 text-gray-700" />
          </Button>
        )}

        {/* Scroll Container */}
        {displayGyms.length > 0 ? (
          <div
            ref={scrollRef}
            onScroll={checkScroll}
            className="flex gap-3 md:gap-4 overflow-x-auto pb-4 snap-x snap-mandatory no-scrollbar scroll-smooth"
          >
            {displayGyms.map((gym) => (
              <Link
                key={gym.id}
                href={`/gyms/${gym.id}`}
                className="min-w-[calc(50%-12px)] md:min-w-[calc(20%-12.8px)] max-w-[calc(50%-12px)] md:max-w-[calc(20%-12.8px)] snap-start flex-shrink-0"
              >
                <div className="cursor-pointer hover:shadow-md transition-shadow">
                <div className="w-full aspect-[4/3] rounded-lg overflow-hidden mb-2">
                  {gym.images && gym.images.length > 0 ? (
                    <img
                      src={gym.images[0].url}
                      alt={gym.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 text-xs md:text-sm">
                      No Image
                    </div>
                  )}
                </div>
                <h3 className="font-semibold text-xs md:text-sm text-gray-900 mb-0.5 line-clamp-1">{gym.name}</h3>
                <p className="text-[10px] md:text-xs text-gray-600">{gym.city}, {gym.country}</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 md:py-8 text-sm md:text-base text-gray-500">
            <p>No gyms found matching this filter. Try selecting a different option.</p>
          </div>
        )}
      </div>
    </div>
  )
}
