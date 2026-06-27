'use client'

import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { ResponsiveGymImage } from '@/components/responsive-gym-image'
import { cn } from '@/lib/utils'
import type { GymPhotoTourDisplayItem } from '@/components/manage/gym-photo-tour-types'

const TRANSITION_MS = 380
const TRANSITION_EASE = 'cubic-bezier(0.33, 1, 0.68, 1)'
const SWIPE_COMMIT_RATIO = 0.22
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

type StackSlot = 'prev' | 'active' | 'next'

function stackOffsetPx(slot: StackSlot, cardWidthPx: number, dragPx: number): number {
  const half = cardWidthPx / 2
  const base = slot === 'prev' ? -half : slot === 'next' ? half : 0
  return base + dragPx
}

function stackScale(slot: StackSlot, dragPx: number, cardWidthPx: number): number {
  if (cardWidthPx <= 0) return slot === 'active' ? 1 : 1
  const t = Math.min(1, Math.abs(dragPx) / cardWidthPx)
  if (slot === 'active') return 1 - t * 0.04
  if (slot === 'next' && dragPx < 0) return 1 + t * 0.04
  if (slot === 'prev' && dragPx > 0) return 1 + t * 0.04
  return 1
}

function stackOpacity(slot: StackSlot, dragPx: number, cardWidthPx: number): number {
  if (cardWidthPx <= 0) return 1
  const t = Math.min(1, Math.abs(dragPx) / cardWidthPx)
  if (slot === 'prev' && dragPx < 0) return Math.max(0, 1 - t * 1.4)
  if (slot === 'next' && dragPx > 0) return Math.max(0, 1 - t * 1.4)
  return 1
}

function stackZIndex(slot: StackSlot, dragPx: number): number {
  if (slot === 'active') return 20
  if (dragPx < 0 && slot === 'next') return 30
  if (dragPx > 0 && slot === 'prev') return 30
  return 10
}

function cardStyle({
  slot,
  cardWidthPx,
  dragPx,
  animate,
  reducedMotion,
}: {
  slot: StackSlot
  cardWidthPx: number
  dragPx: number
  animate: boolean
  reducedMotion: boolean
}): CSSProperties {
  const offset = stackOffsetPx(slot, cardWidthPx, dragPx)
  const scale = stackScale(slot, dragPx, cardWidthPx)
  const opacity = stackOpacity(slot, dragPx, cardWidthPx)

  return {
    left: '50%',
    top: '50%',
    width: '50%',
    zIndex: stackZIndex(slot, dragPx),
    opacity,
    transform: `translate(calc(-50% + ${offset}px), -50%) scale(${scale})`,
    transition:
      animate && !reducedMotion
        ? `transform ${TRANSITION_MS}ms ${TRANSITION_EASE}, opacity ${TRANSITION_MS}ms ${TRANSITION_EASE}`
        : 'none',
    willChange: animate || dragPx !== 0 ? 'transform, opacity' : undefined,
  }
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
  const [dragPx, setDragPx] = useState(0)
  const [animate, setAnimate] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [cardWidthPx, setCardWidthPx] = useState(0)

  const stackRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const cardWidthRef = useRef(0)
  const pointerStartX = useRef<number | null>(null)
  const pointerStartY = useRef<number | null>(null)
  const dragActive = useRef(false)
  const animatingRef = useRef(false)

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
    const node = stackRef.current
    if (!node) return 0
    const width = node.getBoundingClientRect().width * 0.5
    cardWidthRef.current = width
    setCardWidthPx(width)
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

  const goTo = useCallback(
    (index: number) => {
      if (count === 0) return
      setActiveIndex(((index % count) + count) % count)
    },
    [count],
  )

  const finishSlide = useCallback(
    (direction: 1 | -1) => {
      if (count <= 1 || animatingRef.current) return

      if (reducedMotion) {
        setDragPx(0)
        setActiveIndex((index) => (((index + direction) % count) + count) % count)
        return
      }

      animatingRef.current = true
      setAnimate(true)

      const cardWidth = cardWidthRef.current || measureCardWidth()
      const targetDrag = direction === 1 ? -cardWidth : cardWidth
      setDragPx(targetDrag)

      window.setTimeout(() => {
        setAnimate(false)
        setDragPx(0)
        setActiveIndex((index) => (((index + direction) % count) + count) % count)
        animatingRef.current = false
      }, TRANSITION_MS)
    },
    [count, measureCardWidth, reducedMotion],
  )

  const goPrev = useCallback(() => finishSlide(-1), [finishSlide])
  const goNext = useCallback(() => finishSlide(1), [finishSlide])

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
    if (dragPx === 0) return
    setAnimate(true)
    setDragPx(0)
    window.setTimeout(() => setAnimate(false), reducedMotion ? 0 : TRANSITION_MS)
  }, [dragPx, reducedMotion])

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (count <= 1 || animatingRef.current) return
    pointerStartX.current = event.clientX
    pointerStartY.current = event.clientY
    dragActive.current = false
    setAnimate(false)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (count <= 1 || pointerStartX.current === null || animatingRef.current) return

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

    const cardWidth = cardWidthRef.current || measureCardWidth()
    const maxDrag = cardWidth * 0.92
    const clamped =
      deltaX > 0 ? Math.min(deltaX, maxDrag) : Math.max(deltaX, -maxDrag)
    setDragPx(clamped)
  }

  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (count <= 1) return

    const startX = pointerStartX.current
    const cardWidth = cardWidthRef.current || measureCardWidth()
    const wasDragging = dragActive.current
    const deltaX = startX === null ? 0 : event.clientX - startX

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }

    resetPointer()

    if (animatingRef.current) return

    if (wasDragging) {
      const commit = cardWidth * SWIPE_COMMIT_RATIO
      if (deltaX <= -commit) {
        goNext()
        return
      }
      if (deltaX >= commit) {
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
    if (relativeX < rect.width * 0.28) goPrev()
    else if (relativeX > rect.width * 0.72) goNext()
  }

  const onPointerCancel = () => {
    resetPointer()
    if (!animatingRef.current) snapBack()
  }

  if (count === 0) return null

  const prevIndex = count > 1 ? (activeIndex - 1 + count) % count : null
  const nextIndex = count > 1 ? (activeIndex + 1) % count : null
  const activeItem = items[activeIndex]!

  return (
    <section aria-label="Photo order preview" className="px-1 py-2 sm:px-2 sm:py-4">
      <div className="mb-5 text-center sm:mb-6">
        <p className="text-sm font-medium text-gray-900">Preview guest order</p>
        <p className="mt-1 text-sm text-gray-500">
          Reorder photos below, then drag or swipe here to see how your listing gallery flows.
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
            className="relative mx-auto w-full max-w-md touch-none select-none sm:max-w-lg aspect-[2/1] cursor-grab active:cursor-grabbing"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerCancel}
            aria-roledescription="carousel"
          >
            {prevIndex !== null ? (
              <div
                className={cn('absolute aspect-square', CARD_SURFACE_CLASS)}
                style={cardStyle({
                  slot: 'prev',
                  cardWidthPx,
                  dragPx,
                  animate,
                  reducedMotion,
                })}
                aria-hidden
              >
                <CarouselSlide
                  item={items[prevIndex]!}
                  pendingPreviewUrls={pendingPreviewUrls}
                  sizes="25vw"
                  className="pointer-events-none h-full w-full"
                />
              </div>
            ) : null}

            <div
              className={cn('absolute aspect-square', CARD_SURFACE_CLASS)}
              style={cardStyle({
                slot: 'active',
                cardWidthPx,
                dragPx,
                animate,
                reducedMotion,
              })}
            >
              <CarouselSlide
                item={activeItem}
                pendingPreviewUrls={pendingPreviewUrls}
                sizes="(max-width: 768px) 50vw, 16rem"
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

            {nextIndex !== null ? (
              <div
                className={cn('absolute aspect-square', CARD_SURFACE_CLASS)}
                style={cardStyle({
                  slot: 'next',
                  cardWidthPx,
                  dragPx,
                  animate,
                  reducedMotion,
                })}
                aria-hidden
              >
                <CarouselSlide
                  item={items[nextIndex]!}
                  pendingPreviewUrls={pendingPreviewUrls}
                  sizes="25vw"
                  className="pointer-events-none h-full w-full"
                />
              </div>
            ) : null}
          </div>
        ) : (
          <div className="relative mx-auto w-full max-w-xs sm:max-w-sm aspect-square">
            <div className={cn('absolute inset-0', CARD_SURFACE_CLASS)}>
              <CarouselSlide
                item={activeItem}
                pendingPreviewUrls={pendingPreviewUrls}
                sizes="(max-width: 768px) 72vw, 18rem"
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
