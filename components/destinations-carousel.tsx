'use client'

import { useRef, useState, useEffect } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Destination {
  name: string
  image: string
  flag: string
}

interface DestinationsCarouselProps {
  destinations: Destination[]
}

export function DestinationsCarousel({ destinations }: DestinationsCarouselProps) {
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
          // On mobile: 3.5 cards per view, on desktop: 3 cards per view
          const itemWidth = window.innerWidth < 768
            ? (containerWidth - (2.5 * gap)) / 3.5
            : (containerWidth - (2 * gap)) / 3
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
        className="flex gap-3 md:gap-4 overflow-x-auto pb-4 snap-x snap-mandatory no-scrollbar scroll-smooth group"
      >
        {destinations.map((city) => (
          <Link
            key={city.name}
            href={`/search?location=${encodeURIComponent(city.name)}`}
            className="min-w-[calc(28.57%-8.57px)] md:min-w-[calc(33.333%-10.67px)] max-w-[calc(28.57%-8.57px)] md:max-w-[calc(33.333%-10.67px)] snap-start flex-shrink-0"
          >
            <div className="cursor-pointer hover:shadow-md transition-shadow">
              <div className="w-full aspect-square rounded-lg overflow-hidden mb-2 relative bg-gray-200">
                <img
                  src={city.image}
                  alt={city.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute top-2 left-2 text-white drop-shadow-md">
                  <span className="text-[10px] font-semibold bg-black/30 rounded px-1.5 py-0.5">
                    {city.flag}
                  </span>
                </div>
              </div>
              <h3 className="font-semibold text-xs md:text-sm text-gray-900 mb-0.5 line-clamp-1">
                {city.name}
              </h3>
              <p className="hidden md:block text-[10px] md:text-xs text-gray-600">Thailand</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
