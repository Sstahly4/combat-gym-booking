'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { GymImage } from '@/lib/types/database'

interface GymGalleryMobileProps {
  images: GymImage[]
  gymName: string
  onImageClick?: (index: number) => void
}

export function GymGalleryMobile({ images, gymName, onImageClick }: GymGalleryMobileProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  if (!images || images.length === 0) return null

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentIndex((prev) => (prev + 1) % images.length)
  }

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  const handleImageClick = () => {
    if (onImageClick) {
      onImageClick(currentIndex)
    }
  }

  return (
    <div className="relative w-full h-[300px] md:hidden bg-gray-100">
      {/* Main Image */}
      <div 
        className="relative w-full h-full cursor-pointer"
        onClick={handleImageClick}
      >
        <Image
          src={images[currentIndex].url}
          alt={`${gymName} ${currentIndex + 1}`}
          fill
          className="object-cover"
          sizes="100vw"
          priority={currentIndex === 0}
        />
      </div>

      {/* Navigation Arrows - Booking.com style */}
      {images.length > 1 && (
        <>
          {/* Left Arrow */}
          <button
            onClick={prevImage}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-10 p-2.5 bg-white/90 hover:bg-white shadow-md text-gray-700 rounded-full transition-all"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Right Arrow */}
          <button
            onClick={nextImage}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-10 p-2.5 bg-white/90 hover:bg-white shadow-md text-gray-700 rounded-full transition-all"
            aria-label="Next image"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Image Counter - Bottom right, Booking.com style */}
          <div className="absolute bottom-3 right-3 bg-gray-900/70 text-white px-3 py-1.5 rounded-md text-xs font-medium z-10 backdrop-blur-sm">
            {currentIndex + 1} / {images.length}
          </div>
        </>
      )}
    </div>
  )
}
