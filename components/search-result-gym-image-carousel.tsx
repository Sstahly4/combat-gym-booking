'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { GymImage } from '@/lib/types/database'
import { ResponsiveGymImage } from '@/components/responsive-gym-image'

const MAX_SLIDES = 12

type Props = {
  images: GymImage[]
  alt: string
  sizes: string
}

export function SearchResultGymImageCarousel({ images, alt, sizes }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const slides = useMemo(() => images.slice(0, MAX_SLIDES), [images])

  const syncIndexFromScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el || slides.length <= 1) return
    const w = el.clientWidth
    if (w <= 0) return
    const i = Math.round(el.scrollLeft / w)
    setActive(Math.min(Math.max(0, i), slides.length - 1))
  }, [slides.length])

  useEffect(() => {
    syncIndexFromScroll()
  }, [slides.length, syncIndexFromScroll])

  if (slides.length === 0) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-xs text-gray-400">
        No image
      </div>
    )
  }

  if (slides.length === 1) {
    return (
      <div className="absolute inset-0">
        <ResponsiveGymImage image={slides[0]!} alt={alt} sizes={sizes} className="object-cover" priority />
      </div>
    )
  }

  return (
    <div className="absolute inset-0">
      <div
        ref={scrollRef}
        onScroll={syncIndexFromScroll}
        className="flex h-full w-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain scroll-smooth no-scrollbar touch-pan-x"
      >
        {slides.map((image, i) => (
          <div
            key={`${image.url}-${i}`}
            className="relative h-full w-full flex-shrink-0 snap-center snap-always"
          >
            <ResponsiveGymImage
              image={image}
              alt={`${alt} — photo ${i + 1}`}
              sizes={sizes}
              className="object-cover"
              priority={i === 0}
            />
          </div>
        ))}
      </div>
      <div
        className="pointer-events-none absolute bottom-2.5 left-0 right-0 z-[1] flex justify-center gap-1.5 px-2"
        aria-hidden
      >
        {slides.map((_, i) => (
          <span
            key={i}
            className={`h-1.5 w-1.5 flex-shrink-0 rounded-full shadow-sm transition-all duration-200 ${
              i === active ? 'bg-white ring-1 ring-black/10 scale-110' : 'bg-white/50 ring-1 ring-black/5'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
