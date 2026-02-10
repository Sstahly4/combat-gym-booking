'use client'

import { useRef, useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { ChevronLeft, ChevronRight, Check, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCurrency } from '@/lib/contexts/currency-context'

interface FeaturedCarouselProps {
  gyms: any[]
}

export function FeaturedCarousel({ gyms }: FeaturedCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  const { convertPrice, formatPrice } = useCurrency()

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
      setCanScrollLeft(scrollLeft > 0)
      // Use a small buffer (1px) for float comparisons
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

  const getFallbackRating = (gymId: string): number => {
    // Deterministic "random" rating between 3.5 and 5.0 (half-star increments)
    const str = String(gymId || 'gym')
    let hash = 0
    for (let i = 0; i < str.length; i++) hash = (hash * 31 + str.charCodeAt(i)) >>> 0
    // 4 possible values: 3.5, 4.0, 4.5, 5.0
    const step = hash % 4
    const rating = 3.5 + step * 0.5
    return Math.min(5.0, rating)
  }

  const renderStars = (rating: number) => {
    const stars = Array.from({ length: 5 }, (_, i) => {
      const starValue = i + 1
      const isFull = rating >= starValue
      const isHalf = !isFull && rating >= starValue - 0.5

      if (isFull) {
        return (
          <Star
            key={i}
            className="w-3 h-3 text-[#febb02] fill-[#febb02]"
          />
        )
      }

      if (isHalf) {
        return (
          <span key={i} className="relative inline-flex w-3 h-3">
            <Star className="absolute inset-0 w-3 h-3 text-gray-300 fill-gray-200" />
            <span className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
              <Star className="w-3 h-3 text-[#febb02] fill-[#febb02]" />
            </span>
          </span>
        )
      }

      return (
        <Star
          key={i}
          className="w-3 h-3 text-gray-300 fill-gray-200"
        />
      )
    })

    return <div className="flex items-center gap-0.5">{stars}</div>
  }

  return (
    <div className="relative group">
      {/* Left Button */}
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

      {/* Right Button */}
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
        {gyms.map((gym: any) => (
          <Link 
            key={gym.id} 
            href={`/gyms/${gym.id}`} 
            target="_blank"
            rel="noopener noreferrer"
            className="min-w-[calc(50%-12px)] md:min-w-[calc(25%-12px)] snap-start"
          >
            <Card className="cursor-pointer hover:shadow-lg transition-shadow h-full border border-gray-200 shadow-sm rounded-lg overflow-hidden group/card flex flex-col">
              <div className="aspect-[4/3] bg-gray-200 relative overflow-hidden flex-shrink-0">
                {gym.images && gym.images.length > 0 ? (
                  <Image
                    src={gym.images[0].url}
                    alt={gym.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 25vw"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-gray-100 text-sm">
                    No Image
                  </div>
                )}
              </div>
              <CardContent className="p-3 md:p-4 flex flex-col flex-grow">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-bold text-sm md:text-base text-gray-900 line-clamp-1 group-hover/card:underline">{gym.name}</h3>
                </div>
                <p className="text-xs md:text-sm text-gray-600 mb-1 line-clamp-1">
                  {gym.city}, {gym.country}
                </p>
                <div className="flex items-center gap-1 mb-2 md:mb-3">
                  <Check className="w-3 h-3 md:w-3.5 md:h-3.5 text-green-600" />
                  <span className="text-[10px] md:text-xs text-gray-600 font-medium">Verified</span>
                </div>
                <div className="flex items-center gap-1.5 md:gap-2 mb-4 md:mb-6 flex-wrap">
                  {(() => {
                    const countFromField = typeof gym.reviewCount === 'number' ? gym.reviewCount : undefined
                    const avgFromField = typeof gym.averageRating === 'number' ? gym.averageRating : undefined
                    const hasReviewsFromFields = typeof countFromField === 'number' && countFromField > 0 && typeof avgFromField === 'number'

                    const hasReviewsFromArray = gym.reviews && Array.isArray(gym.reviews) && gym.reviews.length > 0
                    const avgFromArray = hasReviewsFromArray
                      ? gym.reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / gym.reviews.length
                      : undefined

                    const hasReviews = hasReviewsFromFields || hasReviewsFromArray
                    const avg = hasReviewsFromFields
                      ? (avgFromField as number)
                      : (hasReviewsFromArray ? (avgFromArray as number) : getFallbackRating(gym.id))
                    const display = Math.round(avg * 2) / 2

                    return (
                      <>
                        <div className="bg-[#003580] text-white px-1.5 py-0.5 md:px-2 md:py-1 rounded text-[10px] md:text-xs font-bold">
                          {hasReviews ? display.toFixed(1) : display.toFixed(1)}
                        </div>
                        <span className="text-[10px] md:text-xs text-gray-700">
                          {hasReviews ? 'Very good' : 'Exceptional'}
                        </span>
                        {hasReviews && (
                          <span className="text-[10px] md:text-xs text-gray-500">
                            {(hasReviewsFromFields ? countFromField : gym.reviews.length)} verified reviews
                          </span>
                        )}
                        <div className="w-full" />
                        <div className="flex items-center gap-2">
                          {renderStars(display)}
                          <span className="text-[10px] md:text-xs text-gray-500">{display.toFixed(1)}</span>
                        </div>
                      </>
                    )
                  })()}
                </div>
                <div className="flex justify-end items-end mt-auto pt-2">
                  <div className="text-right">
                    <p className="text-[10px] md:text-xs text-gray-500 mb-0.5 md:mb-1">Starting from</p>
                    <p className="text-base md:text-lg font-bold text-gray-900 leading-tight">
                      {formatPrice(convertPrice(gym.price_per_day, gym.currency))}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
