'use client'

import { useState, useRef, useCallback } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { GymImage } from '@/lib/types/database'
import { gymImageSrc, gymImageSrcSet } from '@/lib/images/gym-image-variants'

interface GymGalleryMobileProps {
  images: GymImage[]
  gymName: string
  onImageClick?: (index: number) => void
}

const PRELOAD_AHEAD = 1

function circularSlideDistance(idx: number, currentIndex: number, total: number) {
  return Math.min(Math.abs(idx - currentIndex), total - Math.abs(idx - currentIndex))
}

function wrapIndex(index: number, total: number) {
  return ((index % total) + total) % total
}

function neighborIndices(center: number, total: number, radius: number) {
  const indices: number[] = []
  for (let offset = -radius; offset <= radius; offset += 1) {
    indices.push(wrapIndex(center + offset, total))
  }
  return indices
}

export function GymGalleryMobile({ images, gymName, onImageClick }: GymGalleryMobileProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [prefetchIndices, setPrefetchIndices] = useState<Set<number>>(() => new Set([0]))
  const touchStartX = useRef<number | null>(null)
  const touchDeltaX = useRef(0)

  if (!images || images.length === 0) return null

  const addPrefetchIndices = useCallback(
    (indices: number[]) => {
      setPrefetchIndices((prev) => {
        const next = new Set(prev)
        for (const idx of indices) next.add(idx)
        return next
      })
    },
    [],
  )

  const goTo = useCallback(
    (index: number) => {
      const wrapped = wrapIndex(index, images.length)
      addPrefetchIndices(neighborIndices(wrapped, images.length, PRELOAD_AHEAD))
      setCurrentIndex(wrapped)
    },
    [addPrefetchIndices, images.length],
  )

  const prefetchBeforeNav = useCallback(
    (targetIndex: number) => {
      addPrefetchIndices(neighborIndices(targetIndex, images.length, PRELOAD_AHEAD))
    },
    [addPrefetchIndices, images.length],
  )

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation()
    const target = wrapIndex(currentIndex + 1, images.length)
    prefetchBeforeNav(target)
    goTo(target)
  }

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation()
    const target = wrapIndex(currentIndex - 1, images.length)
    prefetchBeforeNav(target)
    goTo(target)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchDeltaX.current = 0
    addPrefetchIndices(neighborIndices(currentIndex, images.length, PRELOAD_AHEAD + 1))
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    touchDeltaX.current = e.touches[0].clientX - touchStartX.current
  }

  const handleTouchEnd = () => {
    if (Math.abs(touchDeltaX.current) > 40) {
      const target =
        touchDeltaX.current < 0
          ? wrapIndex(currentIndex + 1, images.length)
          : wrapIndex(currentIndex - 1, images.length)
      prefetchBeforeNav(target)
      goTo(target)
    }
    touchStartX.current = null
    touchDeltaX.current = 0
  }

  const handleImageClick = () => {
    onImageClick?.(currentIndex)
  }

  const trackOffsetPercent = (currentIndex / images.length) * 100

  return (
    <div
      className="relative w-full h-[300px] md:hidden bg-gray-100 overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="flex h-full"
        style={{
          width: `${images.length * 100}%`,
          transform: `translate3d(-${trackOffsetPercent}%, 0, 0)`,
          transition: 'transform 280ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          willChange: 'transform',
          backfaceVisibility: 'hidden',
        }}
        onClick={handleImageClick}
      >
        {images.map((image, idx) => {
          const isCoverPhoto = idx === 0
          const isNearActive =
            circularSlideDistance(idx, currentIndex, images.length) <= PRELOAD_AHEAD
          const shouldLoadImage = isCoverPhoto || isNearActive || prefetchIndices.has(idx)

          return (
            <div
              key={image.url}
              className="relative flex-shrink-0 cursor-pointer h-full"
              style={{ width: `${100 / images.length}%` }}
            >
              {shouldLoadImage ? (
                <img
                  src={gymImageSrc(image)}
                  srcSet={gymImageSrcSet(image)}
                  alt={`${gymName} ${idx + 1}`}
                  loading="eager"
                  decoding="async"
                  fetchPriority={isCoverPhoto ? 'high' : 'auto'}
                  sizes="100vw"
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 h-full w-full bg-gray-200" aria-hidden />
              )}
            </div>
          )
        })}
      </div>

      {images.length > 1 && (
        <>
          <button
            onClick={prevImage}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-10 p-2.5 bg-white/90 hover:bg-white shadow-md text-gray-700 rounded-full transition-all"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            onClick={nextImage}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-10 p-2.5 bg-white/90 hover:bg-white shadow-md text-gray-700 rounded-full transition-all"
            aria-label="Next image"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <div className="absolute bottom-3 right-3 bg-gray-900/70 text-white px-3 py-1.5 rounded-md text-xs font-medium z-10 backdrop-blur-sm pointer-events-none">
            {currentIndex + 1} / {images.length}
          </div>

          {images.length <= 10 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1 z-10 pointer-events-none">
              {images.map((_, idx) => (
                <div
                  key={idx}
                  className={`rounded-full transition-all duration-200 ${
                    idx === currentIndex
                      ? 'w-4 h-1.5 bg-white'
                      : 'w-1.5 h-1.5 bg-white/50'
                  }`}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
