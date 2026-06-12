import type { GymImage } from '@/lib/types/database'

/** Client-safe gym shape for stay-and-train cards and photo strips. */
export type StayTrainGym = {
  id: string
  slug?: string | null
  name: string
  city?: string | null
  images?: Array<Pick<GymImage, 'url' | 'order'>>
  averageRating: number
  reviewCount: number
  price_per_day?: number | null
  currency?: string | null
  offers_accommodation?: boolean | null
  _amenities: Record<string, boolean>
}

export function stayTrainGymImages(g: Pick<StayTrainGym, 'images'>) {
  const urls = (g.images || []).map((img) => img.url).filter(Boolean) as string[]
  return {
    gym: urls[0] || null,
    room: urls[1] || urls[0] || null,
    all: urls,
  }
}

export function pickCityHeroImage(gyms: Pick<StayTrainGym, 'images'>[], fallback: string) {
  for (const g of gyms) {
    const img = stayTrainGymImages(g).gym
    if (img) return img
  }
  return fallback
}
