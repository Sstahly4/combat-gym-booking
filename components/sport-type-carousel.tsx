'use client'

import { Suspense, useRef, useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  HOMEPAGE_SPORT_TILE_IMG_SIZES,
  homepageSportTileSrcSet,
  type HomepageSportTileVariants,
} from '@/lib/homepage/homepage-sport-tile-images'
import { buildHomepageDateDisplay } from '@/lib/homepage/homepage-date-display'

interface Sport {
  name: string
  image: HomepageSportTileVariants
  count: number
}

interface SportTypeCarouselProps {
  sports: Sport[]
  country: string
  /** Omit to read ?checkin=&checkout= on the client (keeps homepage ISR-cacheable). */
  dateDisplay?: string
  /** First N tiles: eager load + high fetch priority (LCP / above-the-fold). */
  priorityCount?: number
}

function cardsOverflowing(count: number) {
  if (typeof window === 'undefined') return count > 2
  return count > (window.innerWidth < 768 ? 2 : 4)
}

function SportTypeCarouselInner({
  sports,
  country,
  dateDisplay: dateDisplayProp,
  priorityCount = 0,
}: SportTypeCarouselProps) {
  const searchParams = useSearchParams()
  const dateDisplay =
    dateDisplayProp ??
    buildHomepageDateDisplay(searchParams.get('checkin'), searchParams.get('checkout'))

  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(() => cardsOverflowing(sports.length))

  const checkScroll = useCallback(() => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1)
    }
  }, [])

  useEffect(() => {
    setCanScrollRight(cardsOverflowing(sports.length))
  }, [sports.length])

  useEffect(() => {
    let raf = 0
    const onResize = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(checkScroll)
    }
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      cancelAnimationFrame(raf)
    }
  }, [checkScroll])

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const containerWidth = scrollRef.current.clientWidth
      const gap = window.innerWidth < 768 ? 12 : 16
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

      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex gap-3 md:gap-4 overflow-x-auto pb-4 snap-x snap-mandatory no-scrollbar scroll-smooth"
      >
        {sports.map((sport, idx) => (
          <Link
            key={sport.name}
            href={`/search?discipline=${encodeURIComponent(sport.name)}&country=${encodeURIComponent(country)}`}
            className="min-w-[calc(50%-12px)] md:min-w-[calc(25%-12px)] max-w-[calc(50%-12px)] md:max-w-[calc(25%-12px)] snap-start flex-shrink-0"
          >
            <div className="cursor-pointer hover:shadow-md transition-shadow">
              <div className="relative w-full aspect-[5/4] rounded-lg overflow-hidden mb-2 bg-gray-100">
                <img
                  src={sport.image.w800}
                  srcSet={homepageSportTileSrcSet(sport.image)}
                  sizes={HOMEPAGE_SPORT_TILE_IMG_SIZES}
                  alt={sport.name}
                  className="absolute inset-0 h-full w-full object-cover"
                  loading={idx < priorityCount ? 'eager' : 'lazy'}
                  decoding="async"
                  fetchPriority={idx < priorityCount ? 'high' : 'auto'}
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

export function SportTypeCarousel(props: SportTypeCarouselProps) {
  const fallbackDate = props.dateDisplay ?? buildHomepageDateDisplay()

  return (
    <Suspense fallback={<SportTypeCarouselInner {...props} dateDisplay={fallbackDate} />}>
      <SportTypeCarouselInner {...props} />
    </Suspense>
  )
}
