'use client'

import { useState, useCallback } from 'react'
import { GymGalleryMobile } from './gym-gallery-mobile'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import type { GymImage } from '@/lib/types/database'

interface GymGalleryMobileWrapperProps {
  images: GymImage[]
  gymName: string
}

const LIGHTBOX_PRELOAD = 2 // preload this many images ahead and behind

export function GymGalleryMobileWrapper({ images, gymName }: GymGalleryMobileWrapperProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)

  const goTo = useCallback((index: number) => {
    setCurrentIndex(((index % images.length) + images.length) % images.length)
  }, [images.length])

  const handleImageClick = (index: number) => {
    setCurrentIndex(index)
    setLightboxOpen(true)
  }

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation()
    goTo(currentIndex + 1)
  }

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation()
    goTo(currentIndex - 1)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') goTo(currentIndex + 1)
    if (e.key === 'ArrowLeft') goTo(currentIndex - 1)
    if (e.key === 'Escape') setLightboxOpen(false)
  }

  return (
    <>
      <GymGalleryMobile
        images={images}
        gymName={gymName}
        onImageClick={handleImageClick}
      />

      {/* Lightbox Modal */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent
          className="max-w-[95vw] h-[95vh] p-0 bg-black/95 border-none flex flex-col items-center justify-center outline-none"
          onKeyDown={handleKeyDown}
        >
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Close */}
            <button
              onClick={() => setLightboxOpen(false)}
              className="absolute top-4 right-4 z-50 p-2 bg-black/50 text-white rounded-full hover:bg-black/70"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Navigation */}
            {images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 z-50 p-3 bg-black/50 text-white rounded-full hover:bg-black/70"
                >
                  <ChevronLeft className="w-8 h-8" />
                </button>

                <button
                  onClick={nextImage}
                  className="absolute right-4 z-50 p-3 bg-black/50 text-white rounded-full hover:bg-black/70"
                >
                  <ChevronRight className="w-8 h-8" />
                </button>
              </>
            )}

            {/* Current image */}
            <Image
              src={images[currentIndex].url}
              alt={`${gymName} ${currentIndex + 1}`}
              width={1920}
              height={1080}
              className="max-h-full max-w-full object-contain"
              sizes="95vw"
              priority
            />

            {/* Counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white bg-black/50 px-4 py-1 rounded-full text-sm pointer-events-none">
              {currentIndex + 1} / {images.length}
            </div>

            {/* 
              Hidden preload images — browser fetches prev/next into cache
              before the user swipes, eliminating loading gaps.
            */}
            {images.map((img, idx) => {
              const distance = Math.abs(idx - currentIndex)
              const wrappedDistance = Math.min(distance, images.length - distance)
              if (wrappedDistance === 0 || wrappedDistance > LIGHTBOX_PRELOAD) return null
              return (
                <Image
                  key={img.url}
                  src={img.url}
                  alt=""
                  width={1920}
                  height={1080}
                  className="sr-only absolute"
                  sizes="95vw"
                  priority
                  aria-hidden
                />
              )
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
