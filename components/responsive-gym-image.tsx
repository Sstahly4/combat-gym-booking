import type { GymImage } from '@/lib/types/database'
import { gymImageSrc, gymImageSrcSet } from '@/lib/images/gym-image-variants'

type ResponsiveGymImageProps = {
  image: Pick<GymImage, 'url' | 'variants'>
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
  return (
    <img
      src={gymImageSrc(image)}
      srcSet={gymImageSrcSet(image)}
      sizes={sizes}
      alt={alt}
      className={`absolute inset-0 h-full w-full ${className}`}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      fetchPriority={priority ? 'high' : 'auto'}
    />
  )
}
