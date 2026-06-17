'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { GymImage } from '@/lib/types/database'
import {
  gymImageCardSrc,
  gymImageSrc,
  gymImageSrcSet,
  gymImageThumbhash,
} from '@/lib/images/gym-image-variants'
import { thumbhashBase64ToDataUrl } from '@/lib/images/thumbhash-client'
import { cn } from '@/lib/utils'

/** Preset aspect boxes that reserve space before the image loads. */
export type ResponsiveGymImageAspect = 'fill' | '4/3' | '16/9' | 'video'

const ASPECT_CLASS: Record<Exclude<ResponsiveGymImageAspect, 'fill'>, string> = {
  '4/3': 'aspect-[4/3]',
  '16/9': 'aspect-[16/9]',
  video: 'aspect-video',
}

type ResponsiveGymImageProps = {
  image: Pick<GymImage, 'url' | 'variants' | 'focus_x' | 'focus_y'>
  alt: string
  sizes: string
  className?: string
  priority?: boolean
  /** Card thumbnails prefer w400; hero/gallery contexts prefer w800. */
  context?: 'card' | 'hero'
  /**
   * Locks the image box aspect ratio to prevent CLS. Default `fill` sizes to the
   * parent (use when the parent already sets aspect or fixed height).
   */
  aspect?: ResponsiveGymImageAspect
  wrapperClassName?: string
}

export function ResponsiveGymImage({
  image,
  alt,
  sizes,
  className = 'object-cover',
  priority = false,
  context = 'card',
  aspect = 'fill',
  wrapperClassName,
}: ResponsiveGymImageProps) {
  const imgRef = useRef<HTMLImageElement>(null)
  const [loaded, setLoaded] = useState(false)
  const [useFade, setUseFade] = useState(false)
  const [placeholderUrl, setPlaceholderUrl] = useState<string | null>(null)

  const thumbhash = gymImageThumbhash(image)
  const src = context === 'hero' ? gymImageSrc(image) : gymImageCardSrc(image)

  useEffect(() => {
    if (!thumbhash) {
      setPlaceholderUrl(null)
      return
    }
    setPlaceholderUrl(thumbhashBase64ToDataUrl(thumbhash))
  }, [thumbhash, image.url])

  useLayoutEffect(() => {
    const img = imgRef.current
    if (img?.complete && img.naturalWidth > 0) {
      setLoaded(true)
      setUseFade(false)
    } else {
      setLoaded(false)
      setUseFade(true)
    }
  }, [src])

  const handleLoad = () => {
    setLoaded(true)
  }

  const fx = typeof image.focus_x === 'number' ? image.focus_x : null
  const fy = typeof image.focus_y === 'number' ? image.focus_y : null
  const objectPosition =
    fx != null && fy != null && Number.isFinite(fx) && Number.isFinite(fy)
      ? `${Math.round(fx * 100)}% ${Math.round(fy * 100)}%`
      : undefined

  const showPlaceholder = Boolean(placeholderUrl)
  const imageVisible = loaded || !showPlaceholder
  const fadeClass = useFade ? 'transition-opacity duration-300 ease-out' : 'transition-none'

  return (
    <div
      className={cn(
        'relative w-full overflow-hidden bg-gray-100',
        aspect === 'fill' ? 'h-full min-h-0' : ASPECT_CLASS[aspect],
        wrapperClassName,
      )}
    >
      {showPlaceholder && (
        <img
          src={placeholderUrl!}
          alt=""
          aria-hidden
          className={cn(
            'absolute inset-0 h-full w-full scale-105 blur-md',
            fadeClass,
            className,
            loaded ? 'opacity-0' : 'opacity-100',
          )}
          style={objectPosition ? { objectPosition } : undefined}
        />
      )}
      <img
        ref={imgRef}
        src={src}
        srcSet={gymImageSrcSet(image)}
        sizes={sizes}
        alt={alt}
        className={cn(
          'absolute inset-0 h-full w-full',
          fadeClass,
          className,
          imageVisible ? 'opacity-100' : 'opacity-0',
        )}
        style={objectPosition ? { objectPosition } : undefined}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={priority ? 'high' : 'auto'}
        onLoad={handleLoad}
        onError={handleLoad}
      />
    </div>
  )
}
