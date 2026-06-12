import { getThailandGymsForGuide, type GuideGym } from '@/lib/guides/thailand-gyms'
import { mergeGymAmenitiesFromDb } from '@/lib/constants/gym-amenities'
import {
  pickCityHeroImage,
  stayTrainGymImages,
} from '@/lib/guides/stay-train-gym-utils'

export type StayTrainGym = GuideGym & {
  _amenities: ReturnType<typeof mergeGymAmenitiesFromDb>
}

export type StayTrainShortlistOptions = {
  city?: string
  /** Alias for `city` (e.g. suburb filter "Chalong"). */
  location?: string
  accommodation?: boolean
  meals?: boolean
  limit?: number
}

export async function getStayTrainShortlist({
  city,
  location,
  accommodation = true,
  meals = false,
  limit = 12,
}: StayTrainShortlistOptions = {}): Promise<StayTrainGym[]> {
  const area = location || city
  const gyms = await getThailandGymsForGuide({
    discipline: 'Muay Thai',
    ...(area ? { city: area } : {}),
  })

  return gyms
    .map((g) => ({
      ...g,
      _amenities: mergeGymAmenitiesFromDb((g as any).amenities),
    }))
    .filter((g) => {
      const hasAcc = g._amenities.accommodation || g.offers_accommodation
      if (accommodation && !hasAcc) return false
      if (meals && !g._amenities.meals) return false
      return true
    })
    .sort((a, b) => {
      if (meals) {
        const aMeals = a._amenities.meals ? 1 : 0
        const bMeals = b._amenities.meals ? 1 : 0
        if (bMeals !== aMeals) return bMeals - aMeals
      }
      if (b.averageRating !== a.averageRating) return b.averageRating - a.averageRating
      if (b.reviewCount !== a.reviewCount) return b.reviewCount - a.reviewCount
      return (a.name || '').localeCompare(b.name || '')
    })
    .slice(0, limit)
}

export { pickCityHeroImage, stayTrainGymImages }
