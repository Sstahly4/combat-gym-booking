'use client'

import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent, type TransitionEvent } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { ResponsiveGymImage } from '@/components/responsive-gym-image'
import { cn } from '@/lib/utils'
import type { GymPhotoTourDisplayItem } from '@/components/manage/gym-photo-tour-types'

const SLIDE_MS = 480
const SLIDE_EASE = 'cubic-bezier(0.32, 0.72, 0, 1)'
const COMMIT_THRESHOLD = 0.16
const CLICK_MOVE_TOLERANCE_PX = 8
const DRAG_DISTANCE_RATIO = 1

const PEEK_X_RATIO = 0.52
const PEEK_ROTATE_DEG = 11
const PEEK_SCALE = 0.9
const PEEK_Y_PX = 10

/** Homepage search-card dot strip — sliding 5-dot viewport. */
const DOTS_VISIBLE = 5
const DOT_PX = 7
const DOT_SMALL_PX = 4
const DOT_GAP_PX = 6
const DOT_STEP_PX = DOT_PX + DOT_GAP_PX

function windowStart(active: number, slideCount: number): number {
  if (slideCount <= DOTS_VISIBLE) return 0
  const maxFirst = slideCount - DOTS_VISIBLE
  const mid = Math.floor((DOTS_VISIBLE - 1) / 2)
  return Math.min(Math.max(active - mid, 0), maxFirst)
}

function wrapIndex(index: number, count: number): number {
  return ((index % count) + count) % count
}

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
  'overflow-hidden rounded-xl bg-gray-100 ring-1 ring-black/[0.06]'

/** Match photo grid tile size: 2-col mobile, 4-col desktop. */
const CARD_SIZE_CLASS =
  'aspect-square w-[min(calc(50%-0.5rem),14rem)] sm:w-56 md:w-[min(calc(25%-0.75rem),16rem)] lg:w-64'

type StackSlot = 'prev' | 'active' | 'next'

type CardVisual = {
  x: number
  y: number
  scale: number
  opacity: number
  z: number
  rotate: number
  shadow: string
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function peekLeft(cardW: number): CardVisual {
  return {
    x: -cardW * PEEK_X_RATIO,
    y: PEEK_Y_PX,
    scale: PEEK_SCALE,
    opacity: 1,
    z: 10,
    rotate: -PEEK_ROTATE_DEG,
    shadow: '0 8px 24px -4px rgb(0 0 0 / 0.12)',
  }
}

function peekRight(cardW: number): CardVisual {
  return {
    x: cardW * PEEK_X_RATIO,
    y: PEEK_Y_PX,
    scale: PEEK_SCALE,
    opacity: 1,
    z: 10,
    rotate: PEEK_ROTATE_DEG,
    shadow: '0 8px 24px -4px rgb(0 0 0 / 0.12)',
  }
}

function centerMid(): CardVisual {
  return {
    x: 0,
    y: 0,
    scale: 1,
    opacity: 1,
    z: 30,
    rotate: 0,
    shadow: '0 20px 40px -8px rgb(0 0 0 / 0.18)',
  }
}

/**
 * Slot indices rotate as a continuous train — when dragging next, the vacated side
 * immediately shows the next photo in sequence (wraps on small sets).
 */
function slotIndices(
  activeIndex: number,
  count: number,
  progress: number,
  dragOffsetPx: number,
  isDragging: boolean,
) {
  const wrap = (offset: number) => wrapIndex(activeIndex + offset, count)
  const towardNext =
    progress < -0.001 || (isDragging && dragOffsetPx < -CLICK_MOVE_TOLERANCE_PX)
  const towardPrev =
    progress > 0.001 || (isDragging && dragOffsetPx > CLICK_MOVE_TOLERANCE_PX)

  if (towardNext) {
    return { prev: wrap(0), active: wrap(1), next: wrap(2) }
  }
  if (towardPrev) {
    return { prev: wrap(-2), active: wrap(-1), next: wrap(0) }
  }
  return { prev: wrap(-1), active: wrap(0), next: wrap(1) }
}

function getCardVisual(
  slot: StackSlot,
  progress: number,
  cardW: number,
  cardH: number,
  dragOffsetPx: number,
  isDragging: boolean,
  towardNext: boolean,
  towardPrev: boolean,
): CardVisual {
  const peekL = peekLeft(cardW)
  const peekR = peekRight(cardW)
  const mid = centerMid()
  const riseFrom = cardH * 0.07
  const t = clamp(Math.abs(progress), 0, 1)

  if (!towardNext && !towardPrev) {
    if (slot === 'prev') return peekL
    if (slot === 'active') {
      if (isDragging && Math.abs(dragOffsetPx) > 0.5) {
        return {
          ...mid,
          x: dragOffsetPx,
          rotate: dragOffsetPx * -0.025,
        }
      }
      return mid
    }
    return peekR
  }

  if (towardNext) {
    if (slot === 'prev') {
      return {
        x: lerp(0, peekL.x, t),
        y: lerp(0, peekL.y, t),
        scale: lerp(1, peekL.scale, t),
        opacity: lerp(1, 0.92, t),
        z: Math.round(lerp(28, 10, t)),
        rotate: lerp(0, peekL.rotate, t),
        shadow: lerp(0, 1, t) > 0.4 ? peekL.shadow : mid.shadow,
      }
    }
    if (slot === 'active') {
      return {
        x: lerp(peekR.x, 0, t),
        y: lerp(riseFrom, 0, t),
        scale: lerp(peekR.scale, 1, t),
        opacity: lerp(0.9, 1, t),
        z: Math.round(lerp(14, 30, t)),
        rotate: lerp(peekR.rotate, 0, t),
        shadow: lerp(0, 1, t) > 0.5 ? mid.shadow : peekR.shadow,
      }
    }
    return {
      ...peekR,
      opacity: lerp(0.85, 1, Math.min(t * 2, 1)),
    }
  }

  if (slot === 'next') {
    return {
      x: lerp(0, peekR.x, t),
      y: lerp(0, peekR.y, t),
      scale: lerp(1, peekR.scale, t),
      opacity: lerp(1, 0.92, t),
      z: Math.round(lerp(28, 10, t)),
      rotate: lerp(0, peekR.rotate, t),
      shadow: lerp(0, 1, t) > 0.4 ? peekR.shadow : mid.shadow,
    }
  }
  if (slot === 'active') {
    return {
      x: lerp(peekL.x, 0, t),
      y: lerp(riseFrom, 0, t),
      scale: lerp(peekL.scale, 1, t),
      opacity: lerp(0.9, 1, t),
      z: Math.round(lerp(14, 30, t)),
      rotate: lerp(peekL.rotate, 0, t),
      shadow: lerp(0, 1, t) > 0.5 ? mid.shadow : peekL.shadow,
    }
  }
  return {
    ...peekL,
    opacity: lerp(0.85, 1, Math.min(t * 2, 1)),
  }
}

function cardStyleFromVisual(
  visual: CardVisual,
  animate: boolean,
  reducedMotion: boolean,
): CSSProperties {
  return {
    zIndex: visual.z,
    opacity: visual.opacity,
    boxShadow: visual.shadow,
    transform: `translate3d(calc(-50% + ${visual.x}px), calc(-50% + ${visual.y}px), 0) rotate(${visual.rotate}deg) scale(${visual.scale})`,
    transformStyle: 'preserve-3d',
    transition:
      animate && !reducedMotion
        ? `transform ${SLIDE_MS}ms ${SLIDE_EASE}, opacity ${SLIDE_MS}ms ${SLIDE_EASE}, box-shadow ${SLIDE_MS}ms ${SLIDE_EASE}`
        : 'none',
    willChange: animate ? 'transform, opacity' : undefined,
  }
}

function PhotoDotStrip({
  count,
  activeIndex,
  animating,
  onSelect,
}: {
  count: number
  activeIndex: number
  animating: boolean
  onSelect: (index: number) => void
}) {
  const first = windowStart(activeIndex, count)
  const translateX = -(first * DOT_STEP_PX)
  const clipW = DOTS_VISIBLE * DOT_PX + (DOTS_VISIBLE - 1) * DOT_GAP_PX

  return (
    <div
      className="flex justify-center"
      role="tablist"
      aria-label="Photo position"
    >
      <div className="overflow-hidden" style={{ width: count <= DOTS_VISIBLE ? count * DOT_STEP_PX - DOT_GAP_PX : clipW }}>
        <div
          className="flex items-center transition-transform duration-200 ease-out will-change-transform"
          style={{ gap: DOT_GAP_PX, transform: `translateX(${translateX}px)` }}
        >
          {Array.from({ length: count }, (_, slideIdx) => {
            const isOn = slideIdx === activeIndex
            const isSmallRightCue =
              count > DOTS_VISIBLE &&
              slideIdx === first + DOTS_VISIBLE - 1 &&
              slideIdx < count - 1
            const d = isSmallRightCue && !isOn ? DOT_SMALL_PX : DOT_PX

            return (
              <button
                key={slideIdx}
                type="button"
                role="tab"
                aria-selected={isOn}
                aria-label={`Photo ${slideIdx + 1}${slideIdx === 0 ? ', cover' : ''}`}
                disabled={animating}
                onClick={() => onSelect(slideIdx)}
                className="flex flex-shrink-0 items-center justify-center disabled:opacity-50"
                style={{ width: DOT_PX, height: DOT_PX }}
              >
                <span
                  className={cn(
                    'rounded-full transition-[opacity,background-color,transform] duration-200 ease-out',
                    isOn ? 'bg-gray-900' : 'bg-gray-300 hover:bg-gray-400',
                    isSmallRightCue && !isOn ? 'opacity-70' : '',
                  )}
                  style={{ width: d, height: d }}
                />
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/** Stacked deck preview — fanned side peeks + drag-to-cycle guest order. */
export function GymPhotoTourCarousel({
  items,
  pendingPreviewUrls,
}: {
  items: GymPhotoTourDisplayItem[]
  pendingPreviewUrls: Record<string, string>
}) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const [dragOffsetPx, setDragOffsetPx] = useState(0)
  const [animating, setAnimating] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [cardWidthPx, setCardWidthPx] = useState(0)
  const [cardHeightPx, setCardHeightPx] = useState(0)

  const stackRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const cardWidthRef = useRef(0)
  const cardHeightRef = useRef(0)
  const pointerStartX = useRef<number | null>(null)
  const pointerStartY = useRef<number | null>(null)
  const dragStartProgress = useRef(0)
  const dragActive = useRef(false)
  const commitTarget = useRef<-1 | 0 | 1>(0)
  const finishingRef = useRef(false)

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

  const measureCards = useCallback(() => {
    const probe = stackRef.current?.querySelector('[data-card-probe]') as HTMLElement | null
    if (!probe) return { width: 0, height: 0 }
    const { width, height } = probe.getBoundingClientRect()
    if (width > 0) {
      cardWidthRef.current = width
      setCardWidthPx(width)
    }
    if (height > 0) {
      cardHeightRef.current = height
      setCardHeightPx(height)
    }
    return { width, height }
  }, [])

  useEffect(() => {
    measureCards()
    const node = stackRef.current
    if (!node || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(() => measureCards())
    observer.observe(node)
    return () => observer.disconnect()
  }, [measureCards, count])

  const finishCommit = useCallback(
    (direction: -1 | 1) => {
      if (finishingRef.current) return
      finishingRef.current = true
      commitTarget.current = 0
      setAnimating(false)
      setProgress(0)
      setDragOffsetPx(0)
      setActiveIndex((index) => wrapIndex(index - direction, count))
      finishingRef.current = false
    },
    [count],
  )

  const animateTo = useCallback(
    (target: -1 | 0 | 1) => {
      if (count <= 1) return

      if (reducedMotion && target !== 0) {
        finishCommit(target)
        return
      }

      commitTarget.current = target
      setAnimating(true)
      setIsDragging(false)
      setDragOffsetPx(0)
      setProgress(target)
    },
    [count, finishCommit, reducedMotion],
  )

  const goPrev = useCallback(() => animateTo(1), [animateTo])
  const goNext = useCallback(() => animateTo(-1), [animateTo])

  const goToIndex = useCallback(
    (target: number) => {
      if (target === activeIndex || animating || count <= 1) return
      const delta = target - activeIndex
      const steps =
        Math.abs(delta) <= count / 2
          ? delta
          : delta > 0
            ? delta - count
            : delta + count

      if (steps === 0) return

      commitTarget.current = 0
      setAnimating(false)
      setProgress(0)
      setDragOffsetPx(0)
      setActiveIndex(target)
    },
    [activeIndex, animating, count],
  )

  const onSlideTransitionEnd = useCallback(() => {
    const target = commitTarget.current
    if (!animating) return
    if (target === -1 || target === 1) {
      finishCommit(target)
      return
    }
    if (target === 0) {
      setAnimating(false)
    }
  }, [animating, finishCommit])

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
    setIsDragging(false)
  }

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (count <= 1 || animating) return
    pointerStartX.current = event.clientX
    pointerStartY.current = event.clientY
    dragStartProgress.current = progress
    dragActive.current = false
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (count <= 1 || pointerStartX.current === null || animating) return

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
      setIsDragging(true)
    }

    const cardWidth = cardWidthRef.current || cardWidthPx || 1
    setDragOffsetPx(deltaX)
    const dragProgress = -deltaX / (cardWidth * DRAG_DISTANCE_RATIO)
    setProgress(clamp(dragStartProgress.current + dragProgress, -1, 1))
  }

  const snapBack = () => {
    commitTarget.current = 0
    setDragOffsetPx(0)
    if (reducedMotion) {
      setProgress(0)
      setAnimating(false)
      return
    }
    setAnimating(true)
    setProgress(0)
  }

  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (count <= 1) return

    const startX = pointerStartX.current
    const wasDragging = dragActive.current
    const deltaX = startX === null ? 0 : event.clientX - startX

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }

    const releaseProgress = progress
    resetPointer()

    if (animating) return

    if (wasDragging) {
      setDragOffsetPx(0)
      if (releaseProgress <= -COMMIT_THRESHOLD) {
        animateTo(-1)
        return
      }
      if (releaseProgress >= COMMIT_THRESHOLD) {
        animateTo(1)
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
    setDragOffsetPx(0)
    if (!animating) snapBack()
  }

  if (count === 0) return null

  const indices = slotIndices(activeIndex, count, progress, dragOffsetPx, isDragging && !animating)
  const cardW = cardWidthPx || cardWidthRef.current
  const cardH = cardHeightPx || cardHeightRef.current || cardW

  const towardNext =
    progress < -0.001 || (isDragging && dragOffsetPx < -CLICK_MOVE_TOLERANCE_PX)
  const towardPrev =
    progress > 0.001 || (isDragging && dragOffsetPx > CLICK_MOVE_TOLERANCE_PX)

  const styleFor = (slot: StackSlot): CSSProperties =>
    cardStyleFromVisual(
      getCardVisual(
        slot,
        progress,
        cardW,
        cardH,
        dragOffsetPx,
        isDragging && !animating,
        towardNext,
        towardPrev,
      ),
      animating,
      reducedMotion,
    )

  const handleCardTransitionEnd = (event: TransitionEvent<HTMLDivElement>) => {
    if (event.propertyName !== 'transform') return
    onSlideTransitionEnd()
  }

  const displayActiveIndex = wrapIndex(
    activeIndex + (towardNext ? 1 : towardPrev ? -1 : 0),
    count,
  )

  return (
    <section aria-label="Photo order preview" className="px-1 py-2 sm:px-2 sm:py-4">
      <div className="mb-5 text-center sm:mb-6">
        <p className="text-sm font-medium text-gray-900">Preview guest order</p>
        <p className="mt-1 text-sm text-gray-500">
          Drag the stack or use the arrows to browse in order.
        </p>
      </div>

      <div
        ref={containerRef}
        tabIndex={count > 1 ? 0 : -1}
        className="relative mx-auto w-full max-w-3xl outline-none"
      >
        {count > 1 ? (
          <>
            <PhotoDotStrip
              count={count}
              activeIndex={displayActiveIndex}
              animating={animating}
              onSelect={goToIndex}
            />

            <div
              ref={stackRef}
              className={cn(
                'relative isolate mx-auto mt-5 touch-none select-none cursor-grab active:cursor-grabbing',
                'aspect-square w-full max-w-[min(100%,42rem)]',
              )}
              style={{ perspective: '1400px', perspectiveOrigin: '50% 55%' }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerCancel}
              aria-roledescription="carousel"
            >
              <div
                data-card-probe
                className={cn(
                  'pointer-events-none invisible absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2',
                  CARD_SIZE_CLASS,
                )}
                aria-hidden
              />

              <div
                className={cn('absolute left-1/2 top-1/2', CARD_SIZE_CLASS, CARD_SURFACE_CLASS)}
                style={styleFor('prev')}
                aria-hidden
              >
                <CarouselSlide
                  item={items[indices.prev]!}
                  pendingPreviewUrls={pendingPreviewUrls}
                  sizes="30vw"
                  className="pointer-events-none h-full w-full"
                />
              </div>

              <div
                className={cn('absolute left-1/2 top-1/2', CARD_SIZE_CLASS, CARD_SURFACE_CLASS)}
                style={styleFor('next')}
                aria-hidden
              >
                <CarouselSlide
                  item={items[indices.next]!}
                  pendingPreviewUrls={pendingPreviewUrls}
                  sizes="30vw"
                  className="pointer-events-none h-full w-full"
                />
              </div>

              <div
                className={cn('absolute left-1/2 top-1/2', CARD_SIZE_CLASS, CARD_SURFACE_CLASS)}
                style={styleFor('active')}
                onTransitionEnd={handleCardTransitionEnd}
              >
                <CarouselSlide
                  item={items[indices.active]!}
                  pendingPreviewUrls={pendingPreviewUrls}
                  sizes="(max-width: 768px) 50vw, 16rem"
                  priority
                  className="pointer-events-none h-full w-full"
                />
                <div className="pointer-events-none absolute left-3 top-3 flex flex-wrap gap-2">
                  <span className="rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-gray-900 shadow-sm">
                    {count} {count === 1 ? 'photo' : 'photos'}
                  </span>
                  {displayActiveIndex === 0 ? (
                    <span className="rounded-full bg-gray-900/85 px-3 py-1 text-xs font-semibold text-white shadow-sm">
                      Cover
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={goPrev}
                disabled={animating}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:opacity-50"
                aria-label="Previous photo"
              >
                <ChevronLeft className="h-5 w-5" aria-hidden />
              </button>
              <p className="min-w-[5.5rem] text-center text-sm font-medium tabular-nums text-gray-600">
                {displayActiveIndex + 1} / {count}
              </p>
              <button
                type="button"
                onClick={goNext}
                disabled={animating}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:opacity-50"
                aria-label="Next photo"
              >
                <ChevronRight className="h-5 w-5" aria-hidden />
              </button>
            </div>
          </>
        ) : (
          <div className="relative mx-auto flex justify-center">
            <div
              className={cn('relative', CARD_SIZE_CLASS, CARD_SURFACE_CLASS)}
              style={{ boxShadow: '0 20px 40px -8px rgb(0 0 0 / 0.18)' }}
            >
              <CarouselSlide
                item={items[0]!}
                pendingPreviewUrls={pendingPreviewUrls}
                sizes="(max-width: 768px) 50vw, 16rem"
                priority
                className="h-full w-full"
              />
              <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                <span className="rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-gray-900 shadow-sm">
                  1 photo
                </span>
                <span className="rounded-full bg-gray-900/85 px-3 py-1 text-xs font-semibold text-white shadow-sm">
                  Cover
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
