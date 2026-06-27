'use client'

import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { ResponsiveGymImage } from '@/components/responsive-gym-image'
import { cn } from '@/lib/utils'
import type { GymPhotoTourDisplayItem } from '@/components/manage/gym-photo-tour-types'

const SLIDE_MS = 320
const SLIDE_EASE = 'cubic-bezier(0.4, 0, 0.2, 1)'
const SWIPE_COMMIT_PX = 56
const CLICK_MOVE_TOLERANCE_PX = 8

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

const CARD_SURFACE_CLASS =
  'overflow-hidden rounded-3xl bg-gray-100 shadow-lg shadow-gray-900/10 ring-1 ring-black/5'

const CARD_SIZE_CLASS =
  'h-[min(58vw,15rem)] w-[min(58vw,15rem)] sm:h-64 sm:w-64 md:h-72 md:w-72'

type StackSlot = 'prev' | 'active' | 'next'

function baseOffset(slot: StackSlot, cardWidth: number): number {
  if (cardWidth <= 0) return 0
  if (slot === 'prev') return -cardWidth / 2
  if (slot === 'next') return cardWidth / 2
  return 0
}

function stackZIndex(slot: StackSlot, slideDir: 0 | 1 | -1): number {
  if (slideDir === 1 && slot === 'next') return 30
  if (slideDir === -1 && slot === 'prev') return 30
  if (slot === 'active') return 20
  return 10
}

function cardTransform(
  slot: StackSlot,
  cardWidth: number,
  slideDir: 0 | 1 | -1,
  dragPx: number,
): string {
  const slideShift = slideDir === 0 ? 0 : slideDir * -(cardWidth / 2)
  const x = baseOffset(slot, cardWidth) + slideShift + dragPx
  return `translate(calc(-50% + ${x}px), -50%)`
}

/** Stacked deck preview — three equal cards, center in front, sides half visible (Airbnb photo tour style). */
export function GymPhotoTourCarousel({
  items,
  pendingPreviewUrls,
}: {
  items: GymPhotoTourDisplayItem[]
  pendingPreviewUrls: Record<string, string>
}) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [slideDir, setSlideDir] = useState<0 | 1 | -1>(0)
  const [dragPx, setDragPx] = useState(0)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [cardWidthPx, setCardWidthPx] = useState(0)

  const stackRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const cardWidthRef = useRef(0)
  const pointerStartX = useRef<number | null>(null)
  const pointerStartY = useRef<number | null>(null)
  const dragActive = useRef(false)
  const slidingRef = useRef(false)

  const count = items.length

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setReducedMotion(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  useEffect(() => {
    setActiveIndex((index) => Math.min(index, Math.max(0, count - 1)))
  }, [count, items.map((item) => item.key).join('|')])

  const measureCardWidth = useCallback(() => {
    const probe = stackRef.current?.querySelector('[data-card-probe]') as HTMLElement | null
    const width = probe?.getBoundingClientRect().width ?? 0
    if (width > 0) {
      cardWidthRef.current = width
      setCardWidthPx(width)
    }
    return width
  }, [])

  useEffect(() => {
    measureCardWidth()
    const node = stackRef.current
    if (!node || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(() => measureCardWidth())
    observer.observe(node)
    return () => observer.disconnect()
  }, [measureCardWidth, count])

  const completeSlide = useCallback(
    (direction: 1 | -1) => {
      setSlideDir(0)
      setDragPx(0)
      slidingRef.current = false
      setActiveIndex((index) => (((index + direction) % count) + count) % count)
    },
    [count],
  )

  const startSlide = useCallback(
    (direction: 1 | -1) => {
      if (count <= 1 || slidingRef.current) return

      if (reducedMotion) {
        completeSlide(direction)
        return
      }

      slidingRef.current = true
      setDragPx(0)
      setSlideDir(direction)
    },
    [completeSlide, count, reducedMotion],
  )

  const goPrev = useCallback(() => startSlide(-1), [startSlide])
  const goNext = useCallback(() => startSlide(1), [startSlide])

  const onSlideTransitionEnd = useCallback(() => {
    if (slideDir === 0 || !slidingRef.current) return
    completeSlide(slideDir)
  }, [completeSlide, slideDir])

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

  const resetPointer = () => {
    pointerStartX.current = null
    pointerStartY.current = null
    dragActive.current = false
  }

  const snapBack = useCallback(() => {
    setDragPx(0)
  }, [])

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (count <= 1 || slidingRef.current) return
    pointerStartX.current = event.clientX
    pointerStartY.current = event.clientY
    dragActive.current = false
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (count <= 1 || pointerStartX.current === null || slidingRef.current) return

    const deltaX = event.clientX - pointerStartX.current
    const deltaY =
      pointerStartY.current === null ? 0 : event.clientY - pointerStartY.current

    if (!dragActive.current) {
      if (Math.abs(deltaX) < CLICK_MOVE_TOLERANCE_PX) return
      if (Math.abs(deltaX) < Math.abs(deltaY)) {
        resetPointer()
        return
      }
      dragActive.current = true
    }

    const cardWidth = cardWidthRef.current || cardWidthPx
    const maxDrag = cardWidth * 0.55
    setDragPx(deltaX > 0 ? Math.min(deltaX, maxDrag) : Math.max(deltaX, -maxDrag))
  }

  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (count <= 1) return

    const startX = pointerStartX.current
    const wasDragging = dragActive.current
    const deltaX = startX === null ? 0 : event.clientX - startX

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }

    resetPointer()

    if (slidingRef.current) return

    if (wasDragging) {
      if (deltaX <= -SWIPE_COMMIT_PX) {
        setDragPx(0)
        goNext()
        return
      }
      if (deltaX >= SWIPE_COMMIT_PX) {
        setDragPx(0)
        goPrev()
        return
      }
      snapBack()
      return
    }

    if (Math.abs(deltaX) > CLICK_MOVE_TOLERANCE_PX) return

    const rect = stackRef.current?.getBoundingClientRect()
    if (!rect) return
    const relativeX = event.clientX - rect.left
    if (relativeX < rect.width * 0.3) goPrev()
    else if (relativeX > rect.width * 0.7) goNext()
  }

  const onPointerCancel = () => {
    resetPointer()
    if (!slidingRef.current) snapBack()
  }

  if (count === 0) return null

  const prevIndex = count > 1 ? (activeIndex - 1 + count) % count : null
  const nextIndex = count > 1 ? (activeIndex + 1) % count : null
  const activeItem = items[activeIndex]!
  const isSliding = slideDir !== 0
  const cardWidth = cardWidthPx || cardWidthRef.current

  const cardStyle = (slot: StackSlot): CSSProperties => ({
    zIndex: stackZIndex(slot, slideDir),
    transform: cardTransform(slot, cardWidth, slideDir, dragPx),
    transition:
      isSliding && !reducedMotion
        ? `transform ${SLIDE_MS}ms ${SLIDE_EASE}`
        : dragPx !== 0
          ? 'none'
          : undefined,
  })

  return (
    <section aria-label="Photo order preview" className="px-1 py-2 sm:px-2 sm:py-4">
      <div className="mb-5 text-center sm:mb-6">
        <p className="text-sm font-medium text-gray-900">Preview guest order</p>
        <p className="mt-1 text-sm text-gray-500">
          Reorder photos below, then swipe or tap the side previews to browse your gallery order.
        </p>
      </div>

      <div
        ref={containerRef}
        tabIndex={count > 1 ? 0 : -1}
        className="relative mx-auto max-w-3xl outline-none"
      >
        {count > 1 ? (
          <div
            ref={stackRef}
            className={cn(
              'relative mx-auto touch-none select-none cursor-grab active:cursor-grabbing',
              'h-[min(58vw,15rem)] w-[min(116vw,30rem)] sm:h-64 sm:w-[32rem] md:h-72 md:w-[36rem]',
            )}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerCancel}
            aria-roledescription="carousel"
          >
            {/* Size probe — matches visible card dimensions */}
            <div
              data-card-probe
              className={cn('pointer-events-none invisible absolute', CARD_SIZE_CLASS)}
              aria-hidden
            />

            <div
              className={cn('absolute left-1/2 top-1/2', CARD_SIZE_CLASS, CARD_SURFACE_CLASS)}
              style={cardStyle('prev')}
              aria-hidden
            >
              {prevIndex !== null ? (
                <CarouselSlide
                  item={items[prevIndex]!}
                  pendingPreviewUrls={pendingPreviewUrls}
                  sizes="30vw"
                  className="pointer-events-none h-full w-full"
                />
              ) : null}
            </div>

            <div
              className={cn('absolute left-1/2 top-1/2', CARD_SIZE_CLASS, CARD_SURFACE_CLASS)}
              style={cardStyle('active')}
              onTransitionEnd={(event) => {
                if (event.propertyName !== 'transform') return
                onSlideTransitionEnd()
              }}
            >
              <CarouselSlide
                item={activeItem}
                pendingPreviewUrls={pendingPreviewUrls}
                sizes="(max-width: 768px) 58vw, 18rem"
                priority
                className="pointer-events-none h-full w-full"
              />
              <div className="pointer-events-none absolute left-3 top-3 flex flex-wrap gap-2">
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

            <div
              className={cn('absolute left-1/2 top-1/2', CARD_SIZE_CLASS, CARD_SURFACE_CLASS)}
              style={cardStyle('next')}
              aria-hidden
            >
              {nextIndex !== null ? (
                <CarouselSlide
                  item={items[nextIndex]!}
                  pendingPreviewUrls={pendingPreviewUrls}
                  sizes="30vw"
                  className="pointer-events-none h-full w-full"
                />
              ) : null}
            </div>
          </div>
        ) : (
          <div className="relative mx-auto flex justify-center">
            <div className={cn('relative', CARD_SIZE_CLASS, CARD_SURFACE_CLASS)}>
              <CarouselSlide
                item={activeItem}
                pendingPreviewUrls={pendingPreviewUrls}
                sizes="(max-width: 768px) 58vw, 18rem"
                priority
                className="h-full w-full"
              />
              <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                <span className="rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-gray-900 shadow-sm">
                  {count} photo
                </span>
                <span className="rounded-full bg-gray-900/85 px-3 py-1 text-xs font-semibold text-white shadow-sm">
                  Cover
                </span>
              </div>
            </div>
          </div>
        )}

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
