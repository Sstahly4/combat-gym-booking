'use client'

import { useRef, useState, useEffect } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Sport {
  name: string
  image: string
  count: number
}

interface SportTypeCarouselProps {
  sports: Sport[]
  country: string
  dateDisplay: string
}

export function SportTypeCarousel({ sports, country, dateDisplay }: SportTypeCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

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
  }, [])

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const containerWidth = scrollRef.current.clientWidth
      const gap = window.innerWidth < 768 ? 12 : 16
      // On mobile: 2 cards per view (50vw), on desktop: 4 cards per view
      const itemWidth = window.innerWidth < 768
        ? (containerWidth - gap) / 2
        : (containerWidth - (3 * gap)) / 4
      const scrollAmount = itemWidth + gap

      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      })
    }
  }

  return (
    <div className="relative group">
      {/* Left Button - Hidden on mobile */}
      {canScrollLeft && (
        <Button
          variant="ghost"
          size="icon"
          className="hidden md:flex absolute left-0 top-[37%] -translate-y-1/2 -translate-x-1/2 z-10 bg-white shadow-md rounded-full w-8 h-8 md:w-10 md:h-10 hover:bg-gray-50 border"
          onClick={() => scroll('left')}
        >
          <ChevronLeft className="h-4 w-4 md:h-6 md:w-6 text-gray-700" />
        </Button>
      )}

      {/* Right Button - Hidden on mobile */}
      {canScrollRight && (
        <Button
          variant="ghost"
          size="icon"
          className="hidden md:flex absolute right-0 top-[37%] -translate-y-1/2 translate-x-1/2 z-10 bg-white shadow-md rounded-full w-8 h-8 md:w-10 md:h-10 hover:bg-gray-50 border"
          onClick={() => scroll('right')}
        >
          <ChevronRight className="h-4 w-4 md:h-6 md:w-6 text-gray-700" />
        </Button>
      )}

      {/* Scroll Container */}
      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex gap-3 md:gap-4 overflow-x-auto pb-4 snap-x snap-mandatory no-scrollbar scroll-smooth"
      >
        {sports.map((sport) => (
          <Link
            key={sport.name}
            href={`/search?discipline=${encodeURIComponent(sport.name)}&country=${encodeURIComponent(country)}`}
            className="min-w-[calc(50%-12px)] md:min-w-[calc(25%-12px)] max-w-[calc(50%-12px)] md:max-w-[calc(25%-12px)] snap-start flex-shrink-0"
          >
            <div className="cursor-pointer hover:shadow-md transition-shadow">
              <div className="w-full aspect-[5/4] rounded-lg overflow-hidden mb-2">
                <img
                  src={sport.image}
                  alt={sport.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="font-semibold text-xs md:text-sm text-gray-900 mb-0.5">{sport.name}</h3>
              <p className="text-xs md:text-sm text-gray-600 mb-0.5">{dateDisplay}</p>
              <p className="text-[10px] md:text-xs text-gray-500">{sport.count} {sport.count === 1 ? 'available' : 'available'}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
