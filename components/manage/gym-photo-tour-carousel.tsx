'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { ResponsiveGymImage } from '@/components/responsive-gym-image'
import { cn } from '@/lib/utils'
import type { GymPhotoTourDisplayItem } from '@/components/manage/gym-photo-tour-types'

function slideImage(
  item: GymPhotoTourDisplayItem,
  pendingPreviewUrls: Record<string, string>,
) {
  if (item.kind === 'saved') {
    return { kind: 'saved' as const, image: item.image }
  }
  const url =
    item.kind === 'transition'
      ? item.previewUrl
      : pendingPreviewUrls[item.pending.id] ?? item.pending.previewUrl
  return { kind: 'url' as const, url }
}

function CarouselSlide({
  item,
  pendingPreviewUrls,
  className,
  sizes,
  priority,
}: {
  item: GymPhotoTourDisplayItem
  pendingPreviewUrls: Record<string, string>
  className?: string
  sizes: string
  priority?: boolean
}) {
  const src = slideImage(item, pendingPreviewUrls)

  return (
    <div className={cn('relative h-full w-full overflow-hidden bg-gray-100', className)}>
      {src.kind === 'saved' ? (
        <ResponsiveGymImage
          image={src.image}
          alt="Listing photo preview"
          sizes={sizes}
          context="hero"
          aspect="fill"
          className="object-cover"
          priority={priority}
          eager={!priority}
        />
      ) : (
        <img src={src.url} alt="Listing photo preview" className="h-full w-full object-cover" />
      )}
    </div>
  )
}

/** Stacked preview carousel — browse listing photos in guest order. */
export function GymPhotoTourCarousel({
  items,
  pendingPreviewUrls,
}: {
  items: GymPhotoTourDisplayItem[]
  pendingPreviewUrls: Record<string, string>
}) {
  const [activeIndex, setActiveIndex] = useState(0)
  const swipeStartX = useRef<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const count = items.length

  useEffect(() => {
    setActiveIndex((index) => Math.min(index, Math.max(0, count - 1)))
  }, [count, items.map((item) => item.key).join('|')])

  const goTo = useCallback(
    (index: number) => {
      if (count === 0) return
      setActiveIndex(((index % count) + count) % count)
    },
    [count],
  )

  const goPrev = useCallback(() => goTo(activeIndex - 1), [activeIndex, goTo])
  const goNext = useCallback(() => goTo(activeIndex + 1), [activeIndex, goTo])

  useEffect(() => {
    const node = containerRef.current
    if (!node || count <= 1) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') goPrev()
      if (event.key === 'ArrowRight') goNext()
    }
    node.addEventListener('keydown', onKeyDown)
    return () => node.removeEventListener('keydown', onKeyDown)
  }, [count, goNext, goPrev])

  if (count === 0) return null

  const prevIndex = count > 1 ? (activeIndex - 1 + count) % count : null
  const nextIndex = count > 1 ? (activeIndex + 1) % count : null
  const activeItem = items[activeIndex]!

  return (
    <section
      aria-label="Photo order preview"
      className="rounded-2xl border border-gray-100 bg-gradient-to-b from-gray-50/80 to-white px-4 py-6 sm:px-8 sm:py-8"
    >
      <div className="mb-5 text-center sm:mb-6">
        <p className="text-sm font-medium text-gray-900">Preview guest order</p>
        <p className="mt-1 text-sm text-gray-500">
          Reorder photos below, then swipe here to see how your listing gallery flows.
        </p>
      </div>

      <div
        ref={containerRef}
        tabIndex={count > 1 ? 0 : -1}
        className="relative mx-auto max-w-3xl outline-none"
        onPointerDown={(event) => {
          swipeStartX.current = event.clientX
        }}
        onPointerUp={(event) => {
          if (swipeStartX.current === null || count <= 1) return
          const delta = event.clientX - swipeStartX.current
          swipeStartX.current = null
          if (Math.abs(delta) < 48) return
          if (delta > 0) goPrev()
          else goNext()
        }}
      >
        <div className="relative mx-auto flex h-[min(58vw,15rem)] items-center justify-center sm:h-64 md:h-72">
          {prevIndex !== null ? (
            <button
              type="button"
              onClick={goPrev}
              className="absolute left-0 top-1/2 z-0 h-[72%] w-[30%] max-w-[9.5rem] -translate-y-1/2 overflow-hidden rounded-2xl shadow-md transition-transform hover:scale-[1.02] sm:w-[28%]"
              aria-label="Previous photo"
            >
              <CarouselSlide
                item={items[prevIndex]!}
                pendingPreviewUrls={pendingPreviewUrls}
                sizes="20vw"
                className="pointer-events-none scale-95 opacity-90"
              />
            </button>
          ) : null}

          <div className="relative z-10 h-full w-[min(72%,20rem)] sm:w-[min(68%,22rem)]">
            <div className="h-full overflow-hidden rounded-3xl shadow-lg shadow-gray-900/10 ring-1 ring-black/5">
              <CarouselSlide
                item={activeItem}
                pendingPreviewUrls={pendingPreviewUrls}
                sizes="(max-width: 768px) 72vw, 22rem"
                priority
              />
            </div>
            <div className="absolute left-3 top-3 flex flex-wrap gap-2">
              <span className="rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-gray-900 shadow-sm">
                {count} {count === 1 ? 'photo' : 'photos'}
              </span>
              {activeIndex === 0 ? (
                <span className="rounded-full bg-gray-900/85 px-3 py-1 text-xs font-semibold text-white shadow-sm">
                  Cover
                </span>
              ) : null}
            </div>
          </div>

          {nextIndex !== null ? (
            <button
              type="button"
              onClick={goNext}
              className="absolute right-0 top-1/2 z-0 h-[72%] w-[30%] max-w-[9.5rem] -translate-y-1/2 overflow-hidden rounded-2xl shadow-md transition-transform hover:scale-[1.02] sm:w-[28%]"
              aria-label="Next photo"
            >
              <CarouselSlide
                item={items[nextIndex]!}
                pendingPreviewUrls={pendingPreviewUrls}
                sizes="20vw"
                className="pointer-events-none scale-95 opacity-90"
              />
            </button>
          ) : null}
        </div>

        {count > 1 ? (
          <div className="mt-5 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={goPrev}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
              aria-label="Previous photo"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden />
            </button>
            <p className="min-w-[5.5rem] text-center text-sm font-medium tabular-nums text-gray-600">
              {activeIndex + 1} / {count}
            </p>
            <button
              type="button"
              onClick={goNext}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
              aria-label="Next photo"
            >
              <ChevronRight className="h-5 w-5" aria-hidden />
            </button>
          </div>
        ) : null}
      </div>
    </section>
  )
}
