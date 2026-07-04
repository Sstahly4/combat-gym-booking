import { getThailandGymsForGuide } from '@/lib/guides/thailand-gyms'
import { gymListsDiscipline } from '@/lib/guides/discipline-match'
import { locationToSlug } from '@/lib/seo/location-slug'

export const FLAGSHIP_MUAY_THAI_GUIDE = {
  href: '/blog/best-muay-thai-camps-thailand-2026',
  label: '25 best Muay Thai camps in Thailand (2026)',
} as const

/** Dedicated static routes for primary cities (matches sitemap MAIN_CITY_GUIDES). */
const DEDICATED_CITY_GUIDE_PATH: Record<string, string> = {
  Bangkok: '/blog/best-muay-thai-gyms-bangkok',
  Phuket: '/blog/best-muay-thai-gyms-phuket',
  'Chiang Mai': '/blog/best-muay-thai-gyms-chiang-mai',
  Pattaya: '/blog/best-muay-thai-gyms-pattaya',
  'Hua Hin': '/blog/best-muay-thai-gyms-hua-hin',
  Krabi: '/blog/best-muay-thai-gyms-krabi',
  'Koh Samui': '/blog/best-muay-thai-gyms-koh-samui',
  'Koh Phangan': '/blog/best-muay-thai-gyms-koh-phangan',
  'Koh Tao': '/blog/best-muay-thai-gyms-koh-tao',
}

export function isThailandMuayThaiGym(gym: {
  country?: string | null
  disciplines?: string[] | null
}): boolean {
  const country = (gym.country || '').trim().toLowerCase()
  if (!country.includes('thailand')) return false
  return gymListsDiscipline(gym.disciplines ?? [], 'Muay Thai')
}

export function muayThaiCityGuidePath(city: string): string {
  const trimmed = city.trim()
  return DEDICATED_CITY_GUIDE_PATH[trimmed] ?? `/blog/best-muay-thai-gyms/${locationToSlug(trimmed)}`
}

export type MuayThaiGuideContext = {
  nationalRank: number | null
  totalRanked: number
  cityGuideHref: string | null
  city: string | null
}

export async function getMuayThaiGuideContextForGym(
  gymId: string,
  gym: { country?: string | null; city?: string | null; disciplines?: string[] | null },
): Promise<MuayThaiGuideContext | null> {
  if (!isThailandMuayThaiGym(gym)) return null

  const ranked = await getThailandGymsForGuide({ discipline: 'Muay Thai' })
  const index = ranked.findIndex((g) => g.id === gymId)
  const city = gym.city?.trim() || null

  return {
    nationalRank: index >= 0 ? index + 1 : null,
    totalRanked: ranked.length,
    cityGuideHref: city ? muayThaiCityGuidePath(city) : null,
    city,
  }
}
