import type { GymImage } from '@/lib/types/database'
import { gymImageSrc, gymImageSrcSet } from '@/lib/images/gym-image-variants'

type ResponsiveGymImageProps = {
  image: Pick<GymImage, 'url' | 'variants' | 'focus_x' | 'focus_y'>
  alt: string
  sizes: string
  className?: string
  priority?: boolean
}

export function ResponsiveGymImage({
  image,
  alt,
  sizes,
  className = 'object-cover',
  priority = false,
}: ResponsiveGymImageProps) {
  const fx = typeof image.focus_x === 'number' ? image.focus_x : null
  const fy = typeof image.focus_y === 'number' ? image.focus_y : null
  const objectPosition =
    fx != null && fy != null && Number.isFinite(fx) && Number.isFinite(fy)
      ? `${Math.round(fx * 100)}% ${Math.round(fy * 100)}%`
      : undefined
  return (
    <img
      src={gymImageSrc(image)}
      srcSet={gymImageSrcSet(image)}
      sizes={sizes}
      alt={alt}
      className={`absolute inset-0 h-full w-full ${className}`}
      style={objectPosition ? { objectPosition } : undefined}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      fetchPriority={priority ? 'high' : 'auto'}
    />
  )
}
