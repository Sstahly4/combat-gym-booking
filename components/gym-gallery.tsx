'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import type { GymImage } from '@/lib/types/database'

interface GymGalleryProps {
  images: GymImage[]
  gymName: string
}

const LIGHTBOX_PRELOAD = 2 // preload this many images ahead and behind

export function GymGallery({ images, gymName }: GymGalleryProps) {
  const [open, setOpen] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)

  if (!images || images.length === 0) return null

  const openLightbox = (index: number) => {
    setCurrentIndex(index)
    setOpen(true)
  }

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

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') goTo(currentIndex + 1)
    if (e.key === 'ArrowLeft') goTo(currentIndex - 1)
    if (e.key === 'Escape') setOpen(false)
  }

  return (
    <>
      {/* Desktop Grid / Mobile Hero */}
      <div
        className="grid grid-cols-1 md:grid-cols-3 grid-rows-1 md:grid-rows-2 gap-2 h-[240px] md:h-[400px] rounded-lg md:rounded-xl overflow-hidden cursor-pointer"
        onClick={() => openLightbox(0)}
      >
        {/* Hero image */}
        <div className="col-span-1 md:col-span-2 row-span-1 md:row-span-2 relative hover:opacity-95 transition-opacity">
          <Image
            src={images[0].url}
            alt={`${gymName} hero`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 66vw"
            priority
          />
        </div>

        {/* Secondary image */}
        {images.length > 1 && (
          <div className="hidden md:block col-span-1 row-span-1 relative hover:opacity-95 transition-opacity">
              <Image
                src={images[1].url}
                alt={`${gymName} 2`}
                fill
                className="object-cover"
              sizes="33vw"
              priority
              />
          </div>
        )}
        
        {/* Tertiary image with "+N photos" overlay */}
        {images.length > 2 && (
          <div className="hidden md:block col-span-1 row-span-1 relative hover:opacity-95 transition-opacity">
              <div className="relative w-full h-full">
                <Image
                  src={images[2].url}
                  alt={`${gymName} 3`}
                  fill
                  className="object-cover"
                sizes="33vw"
                priority
                />
                {images.length > 3 && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-bold text-base md:text-lg z-10">
                    +{images.length - 3} photos
                  </div>
                )}
              </div>
          </div>
        )}
        
        {/* Mobile: photo count badge */}
        {images.length > 1 && (
          <div className="md:hidden absolute bottom-2 right-2 bg-black/60 text-white px-2 py-1 rounded text-xs font-medium z-10">
            {images.length} photos
          </div>
        )}
      </div>

      {/* Lightbox */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="max-w-5xl h-[90vh] p-0 bg-black/95 border-none flex flex-col items-center justify-center outline-none"
          onKeyDown={handleKeyDown}
        >
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Close */}
            <button 
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 z-50 p-2 bg-black/50 text-white rounded-full hover:bg-black/70"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Prev */}
            {images.length > 1 && (
            <button 
              onClick={prevImage}
              className="absolute left-4 z-50 p-3 bg-black/50 text-white rounded-full hover:bg-black/70"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
            )}
            
            {/* Current image */}
            <Image
              src={images[currentIndex].url}
              alt={`${gymName} ${currentIndex + 1}`}
              width={1920}
              height={1080}
              className="max-h-full max-w-full object-contain"
              sizes="90vw"
              priority
            />

            {/* Next */}
            {images.length > 1 && (
            <button 
              onClick={nextImage}
              className="absolute right-4 z-50 p-3 bg-black/50 text-white rounded-full hover:bg-black/70"
            >
              <ChevronRight className="w-8 h-8" />
            </button>
            )}

            {/* Counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white bg-black/50 px-4 py-1 rounded-full text-sm pointer-events-none">
              {currentIndex + 1} / {images.length}
            </div>

            {/* 
              Hidden preload images — browser fetches them into cache
              so that prev/next slides appear instantly.
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
                  sizes="90vw"
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
