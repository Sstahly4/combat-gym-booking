'use client'

import { useEffect, useState } from 'react'
import type { GymImage } from '@/lib/types/database'
import {
  gymImageCardSrc,
  gymImageSrc,
  gymImageSrcSet,
  gymImageThumbhash,
} from '@/lib/images/gym-image-variants'
import { thumbhashBase64ToDataUrl } from '@/lib/images/thumbhash-client'

type ResponsiveGymImageProps = {
  image: Pick<GymImage, 'url' | 'variants' | 'focus_x' | 'focus_y'>
  alt: string
  sizes: string
  className?: string
  priority?: boolean
  /** Card thumbnails prefer w400; hero/gallery contexts prefer w800. */
  context?: 'card' | 'hero'
}

export function ResponsiveGymImage({
  image,
  alt,
  sizes,
  className = 'object-cover',
  priority = false,
  context = 'card',
}: ResponsiveGymImageProps) {
  const [loaded, setLoaded] = useState(false)
  const [placeholderUrl, setPlaceholderUrl] = useState<string | null>(null)

  const thumbhash = gymImageThumbhash(image)

  useEffect(() => {
    setLoaded(false)
    if (!thumbhash) {
      setPlaceholderUrl(null)
      return
    }
    setPlaceholderUrl(thumbhashBase64ToDataUrl(thumbhash))
  }, [thumbhash, image.url])

  const fx = typeof image.focus_x === 'number' ? image.focus_x : null
  const fy = typeof image.focus_y === 'number' ? image.focus_y : null
  const objectPosition =
    fx != null && fy != null && Number.isFinite(fx) && Number.isFinite(fy)
      ? `${Math.round(fx * 100)}% ${Math.round(fy * 100)}%`
      : undefined
  const src = context === 'hero' ? gymImageSrc(image) : gymImageCardSrc(image)

  return (
    <>
      {placeholderUrl && !loaded && (
        <img
          src={placeholderUrl}
          alt=""
          aria-hidden
          className={`absolute inset-0 h-full w-full scale-110 blur-lg ${className}`}
          style={objectPosition ? { objectPosition } : undefined}
        />
      )}
      <img
        src={src}
        srcSet={gymImageSrcSet(image)}
        sizes={sizes}
        alt={alt}
        className={`absolute inset-0 h-full w-full transition-opacity duration-300 ${className} ${
          loaded || !placeholderUrl ? 'opacity-100' : 'opacity-0'
        }`}
        style={objectPosition ? { objectPosition } : undefined}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={priority ? 'high' : 'auto'}
        onLoad={() => setLoaded(true)}
      />
    </>
  )
}
