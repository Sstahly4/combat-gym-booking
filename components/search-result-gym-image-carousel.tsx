'use client'

import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { GymImage } from '@/lib/types/database'
import { ResponsiveGymImage } from '@/components/responsive-gym-image'

const MAX_SLIDES = 12
/** Max dot indicators on screen; 5th is visually smaller (OTA-style “more” cue). */
const DOT_CAP = 5

/** Map slide index → dot index when there are more slides than dots (slide 0 → dot 0, last slide → last dot). */
function dotHighlightIndex(activeSlide: number, slideCount: number): number {
  if (slideCount <= 1) return 0
  if (slideCount <= DOT_CAP) return activeSlide
  const cap = DOT_CAP - 1
  const denom = Math.max(1, slideCount - 1)
  return Math.min(cap, Math.round((activeSlide / denom) * cap))
}

type Props = {
  images: GymImage[]
  alt: string
  sizes: string
}

export function SearchResultGymImageCarousel({ images, alt, sizes }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const slideRefs = useRef<(HTMLDivElement | null)[]>([])
  const [active, setActive] = useState(0)
  const slides = useMemo(() => images.slice(0, MAX_SLIDES), [images])

  const slideCount = slides.length

  /** IntersectionObserver: which slide fills the viewport most — stable on mobile vs scrollLeft / width division. */
  useLayoutEffect(() => {
    if (slideCount <= 1) return
    const root = scrollRef.current
    if (!root) return

    const ratios = new Map<Element, number>()
    const pickWinner = () => {
      let bestIdx = 0
      let bestR = -1
      slideRefs.current.forEach((el, idx) => {
        if (!el) return
        const r = ratios.get(el) ?? 0
        if (r > bestR) {
          bestR = r
          bestIdx = idx
        } else if (Math.abs(r - bestR) < 1e-6 && idx < bestIdx) {
          bestIdx = idx
        }
      })
      if (bestR > 0.02) setActive(bestIdx)
    }

    const observer = new IntersectionObserver(
      entries => {
        for (const e of entries) {
          ratios.set(e.target, e.intersectionRatio)
        }
        pickWinner()
      },
      { root, rootMargin: '0px', threshold: [0, 0.02, 0.05, 0.1, 0.2, 0.35, 0.5, 0.65, 0.8, 0.95, 1] },
    )

    slideRefs.current.forEach((el) => {
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [slideCount, slides])

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

  const dotCount = Math.min(slides.length, DOT_CAP)
  const highlightedDot = dotHighlightIndex(active, slides.length)
  const fifthIsSmall = dotCount === DOT_CAP

  return (
    <div className="absolute inset-0">
      <div
        ref={scrollRef}
        className="flex h-full w-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain no-scrollbar touch-pan-x"
      >
        {slides.map((image, i) => (
          <div
            key={`${image.url}-${i}`}
            ref={(el) => {
              slideRefs.current[i] = el
            }}
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
        className="pointer-events-none absolute bottom-2 left-0 right-0 z-[1] flex items-center justify-center gap-[5px] px-2"
        aria-hidden
      >
        {Array.from({ length: dotCount }, (_, i) => {
          const isSmall = fifthIsSmall && i === DOT_CAP - 1
          const isOn = i === highlightedDot
          return (
            <span
              key={i}
              className="flex h-2.5 w-2.5 flex-shrink-0 items-center justify-center"
            >
              <span
                className={`rounded-full transition-[transform,opacity,background-color] duration-150 ${
                  isSmall ? 'h-[3px] w-[3px]' : 'h-[5px] w-[5px]'
                } ${
                  isOn
                    ? 'bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.12)] scale-100'
                    : 'bg-white/55 shadow-[0_0_0_1px_rgba(0,0,0,0.08)]'
                } ${isSmall && !isOn ? 'opacity-75' : ''}`}
              />
            </span>
          )
        })}
      </div>
    </div>
  )
}
