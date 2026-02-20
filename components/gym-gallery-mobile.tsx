'use client'

import { useState, useRef, useCallback } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { GymImage } from '@/lib/types/database'

interface GymGalleryMobileProps {
  images: GymImage[]
  gymName: string
  onImageClick?: (index: number) => void
}

const PRELOAD_AHEAD = 3 // how many images ahead to keep hot

export function GymGalleryMobile({ images, gymName, onImageClick }: GymGalleryMobileProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const touchStartX = useRef<number | null>(null)
  const touchDeltaX = useRef(0)

  if (!images || images.length === 0) return null

  const goTo = useCallback((index: number) => {
    setCurrentIndex(((index % images.length) + images.length) % images.length)
  }, [images.length])

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation()
    goTo(currentIndex + 1)
  }

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation()
    goTo(currentIndex - 1)
  }

  // Touch swipe support
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchDeltaX.current = 0
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    touchDeltaX.current = e.touches[0].clientX - touchStartX.current
  }

  const handleTouchEnd = () => {
    if (Math.abs(touchDeltaX.current) > 40) {
      if (touchDeltaX.current < 0) {
        goTo(currentIndex + 1)
      } else {
        goTo(currentIndex - 1)
      }
    }
    touchStartX.current = null
    touchDeltaX.current = 0
  }

  const handleImageClick = () => {
    if (onImageClick) {
      onImageClick(currentIndex)
    }
  }

  return (
    <div
      className="relative w-full h-[300px] md:hidden bg-gray-100 overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* 
        Sliding strip — ALL images stay in the DOM.
        We shift the strip with translateX so the browser never unmounts/remounts
        images and can composite the animation on the GPU.
      */}
      <div
        className="flex h-full"
        style={{
          width: `${images.length * 100}%`,
          transform: `translateX(-${(currentIndex / images.length) * 100}%)`,
          transition: 'transform 280ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          willChange: 'transform',
        }}
        onClick={handleImageClick}
      >
        {images.map((image, idx) => {
          // Eagerly load current + next PRELOAD_AHEAD; lazy-load the rest
          const shouldPrioritize = idx === 0 || Math.abs(idx - currentIndex) <= PRELOAD_AHEAD
          return (
            <div
              key={image.url}
              className="relative flex-shrink-0 cursor-pointer"
              style={{ width: `${100 / images.length}%` }}
            >
              <Image
                src={image.url}
                alt={`${gymName} ${idx + 1}`}
                fill
                className="object-cover"
                sizes="100vw"
                priority={shouldPrioritize}
                loading={shouldPrioritize ? 'eager' : 'lazy'}
              />
            </div>
          )
        })}
      </div>

      {/* Navigation Arrows */}
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

          {/* Image Counter */}
          <div className="absolute bottom-3 right-3 bg-gray-900/70 text-white px-3 py-1.5 rounded-md text-xs font-medium z-10 backdrop-blur-sm pointer-events-none">
            {currentIndex + 1} / {images.length}
          </div>

          {/* Dot indicators */}
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
