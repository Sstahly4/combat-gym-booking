import type { GymImage } from '@/lib/types/database'
import { gymImageCardSrc } from '@/lib/images/gym-image-variants'

/** Client-safe gym shape for stay-and-train cards and photo strips. */
export type StayTrainGym = {
  id: string
  slug?: string | null
  name: string
  city?: string | null
  images?: Array<Pick<GymImage, 'url' | 'variants' | 'order'>>
  averageRating: number
  reviewCount: number
  price_per_day?: number | null
  currency?: string | null
  offers_accommodation?: boolean | null
  _amenities: Record<string, boolean>
}

export function stayTrainGymImages(g: Pick<StayTrainGym, 'images'>) {
  const sorted = [...(g.images || [])].sort((a, b) => (a.order || 0) - (b.order || 0))
  const cardUrls = sorted.map((img) => gymImageCardSrc(img)).filter(Boolean)
  return {
    gym: cardUrls[0] || null,
    room: cardUrls[1] || cardUrls[0] || null,
    all: cardUrls,
  }
}

export function pickCityHeroImage(gyms: Pick<StayTrainGym, 'images'>[], fallback: string) {
  for (const g of gyms) {
    const img = stayTrainGymImages(g).gym
    if (img) return img
  }
  return fallback
}
