'use client'

import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { GymImage } from '@/lib/types/database'
import { ResponsiveGymImage } from '@/components/responsive-gym-image'

const MAX_SLIDES = 12
const DOTS_VISIBLE = 5
const DOT_PX = 5
const DOT_GAP_PX = 5
const STEP_PX = DOT_PX + DOT_GAP_PX

type Props = {
  images: GymImage[]
  alt: string
  sizes: string
}

/** Left index of the 5-dot viewport; keeps `active` centered when not near edges. */
function windowStart(active: number, slideCount: number): number {
  if (slideCount <= DOTS_VISIBLE) return 0
  const maxFirst = slideCount - DOTS_VISIBLE
  const mid = Math.floor((DOTS_VISIBLE - 1) / 2)
  return Math.min(Math.max(active - mid, 0), maxFirst)
}

export function SearchResultGymImageCarousel({ images, alt, sizes }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const slideRefs = useRef<(HTMLDivElement | null)[]>([])
  const [active, setActive] = useState(0)
  const slides = useMemo(() => images.slice(0, MAX_SLIDES), [images])

  const slideCount = slides.length

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

  const n = slideCount
  const first = windowStart(active, n)
  const translateX = -(first * STEP_PX)
  const clipW = DOTS_VISIBLE * DOT_PX + (DOTS_VISIBLE - 1) * DOT_GAP_PX

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
        className="pointer-events-none absolute bottom-2 left-0 right-0 z-[1] flex justify-center px-2"
        aria-hidden
      >
        <div className="overflow-hidden" style={{ width: clipW }}>
          <div
            className="flex items-center transition-transform duration-200 ease-out will-change-transform"
            style={{
              gap: DOT_GAP_PX,
              transform: `translateX(${translateX}px)`,
            }}
          >
            {Array.from({ length: n }, (__, slideIdx) => {
              const isOn = slideIdx === active
              const isSmallRightCue =
                n > DOTS_VISIBLE &&
                slideIdx === first + DOTS_VISIBLE - 1 &&
                slideIdx < n - 1
              const d = isSmallRightCue && !isOn ? 3 : DOT_PX
              return (
                <span
                  key={slideIdx}
                  className="flex flex-shrink-0 items-center justify-center"
                  style={{ width: DOT_PX, height: DOT_PX }}
                >
                  <span
                    className={`rounded-full transition-[opacity,background-color,box-shadow] duration-150 ${
                      isOn
                        ? 'bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.12)]'
                        : 'bg-white/55 shadow-[0_0_0_1px_rgba(0,0,0,0.08)]'
                    } ${isSmallRightCue && !isOn ? 'opacity-75' : ''}`}
                    style={{ width: d, height: d }}
                  />
                </span>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
