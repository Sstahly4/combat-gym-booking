'use client'

import { useRef, useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BLUR_DATA_URL } from '@/lib/images/blur'

interface Destination {
  name: string
  image: string
  flag?: string
  availableCount?: number
}

interface DestinationsCarouselProps {
  destinations: Destination[]
  /** Number of leading images to preload via Next.js `priority`. */
  priorityCount?: number
}

export function DestinationsCarousel({ destinations, priorityCount = 0 }: DestinationsCarouselProps) {
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
      // Mobile mirrors marketplace shelves: about 3 large cards plus a hint of the next item.
      const itemWidth = window.innerWidth < 768
        ? (containerWidth - (2.15 * gap)) / 3.15
        : (containerWidth - (2 * gap)) / 3
      const scrollAmount = itemWidth + gap

      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'auto',
      })
    }
  }

  const availabilityLabel = (count?: number) => {
    if (!Number.isFinite(count) || count == null) return null
    return `${count} ${count === 1 ? 'available' : 'available'}`
  }

  return (
    <div className="relative">
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
        className="flex gap-3 md:gap-4 overflow-x-auto pb-4 snap-x snap-mandatory no-scrollbar"
      >
        {destinations.map((city, idx) => {
          const availableText = availabilityLabel(city.availableCount)

          return (
            <Link
              key={city.name}
              href={`/search?location=${encodeURIComponent(city.name)}`}
              className="min-w-[calc((100%_-_25.8px)_/_3.15)] max-w-[calc((100%_-_25.8px)_/_3.15)] md:min-w-[calc((100%_-_32px)_/_3)] md:max-w-[calc((100%_-_32px)_/_3)] snap-start flex-shrink-0"
            >
              <div className="cursor-pointer">
                <div className="w-full aspect-square rounded-xl overflow-hidden mb-2.5 relative bg-gray-200">
                  <Image
                    src={city.image}
                    alt={city.name}
                    fill
                    sizes="(max-width: 768px) 32vw, (max-width: 1200px) 33vw, 384px"
                    className="object-cover"
                    placeholder="blur"
                    blurDataURL={BLUR_DATA_URL}
                    priority={idx < priorityCount}
                    loading={idx < priorityCount ? 'eager' : 'lazy'}
                    unoptimized
                  />
                </div>
                <h3 className="font-semibold text-sm md:text-sm text-gray-900 leading-tight mb-1 line-clamp-1">
                  {city.name}
                </h3>
                {availableText && (
                  <p className="text-xs text-gray-500 leading-tight">
                    {availableText}
                  </p>
                )}
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
