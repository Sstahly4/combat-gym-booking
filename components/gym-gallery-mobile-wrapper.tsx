'use client'

import { useState } from 'react'
import { GymGalleryMobile } from './gym-gallery-mobile'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import type { GymImage } from '@/lib/types/database'

interface GymGalleryMobileWrapperProps {
  images: GymImage[]
  gymName: string
}

export function GymGalleryMobileWrapper({ images, gymName }: GymGalleryMobileWrapperProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)

  const handleImageClick = (index: number) => {
    setCurrentIndex(index)
    setLightboxOpen(true)
  }

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentIndex((prev) => (prev + 1) % images.length)
  }

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
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
        <DialogContent className="max-w-[95vw] h-[95vh] p-0 bg-black/95 border-none flex flex-col items-center justify-center">
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Close Button */}
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
            
            <Image
              src={images[currentIndex].url}
              alt={`${gymName} ${currentIndex + 1}`}
              width={1920}
              height={1080}
              className="max-h-full max-w-full object-contain"
              sizes="95vw"
              priority
            />

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white bg-black/50 px-4 py-1 rounded-full text-sm">
              {currentIndex + 1} / {images.length}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
