import { unstable_cache } from 'next/cache'
import { createPublicClient } from '@/lib/supabase/public-server'

export type DestinationVisual = 'island' | 'metro' | 'coast' | 'beachTown' | 'mountain'

export type LiveDestination = {
  name: string
  country: string
  gymCount: number
  subtitle: string
  visual: DestinationVisual
  flag: string
  image: string
}

type GymCityRow = { city: string | null; country: string | null }

const LIVE_VERIFICATION = ['verified', 'trusted'] as const

const COUNTRY_FLAGS: Record<string, string> = {
  Thailand: '🇹🇭',
  Indonesia: '🇮🇩',
  Singapore: '🇸🇬',
  Malaysia: '🇲🇾',
  Vietnam: '🇻🇳',
  Philippines: '🇵🇭',
  Japan: '🇯🇵',
  'South Korea': '🇰🇷',
  China: '🇨🇳',
  Australia: '🇦🇺',
  'New Zealand': '🇳🇿',
  'United Kingdom': '🇬🇧',
  Ireland: '🇮🇪',
  France: '🇫🇷',
  Germany: '🇩🇪',
  Spain: '🇪🇸',
  Portugal: '🇵🇹',
  Netherlands: '🇳🇱',
  'United States': '🇺🇸',
  Canada: '🇨🇦',
  Mexico: '🇲🇽',
  Brazil: '🇧🇷',
  UAE: '🇦🇪',
  'United Arab Emirates': '🇦🇪',
}

const CITY_SUBTITLES: Record<string, string> = {
  phuket: 'Popular beach & island destination',
  bangkok: 'Great for city stays and night markets',
  krabi: 'Quiet beaches and dramatic limestone coast',
  pattaya: 'Lively beach city with long resort strips',
  'chiang mai': 'Cooler mountain city with a slower pace',
  pai: 'Mountain town with a laid-back camp scene',
  'koh samui': 'Island training with beach-town energy',
  'koh phangan': 'Island stays close to Gulf beaches',
  'koh tao': 'Small island with a tight-knit camp scene',
  bali: 'Tropical island with a huge camp scene',
  'hua hin': 'Coastal town with a relaxed pace',
}

const CITY_IMAGES: Record<string, string> = {
  phuket: '/phuket.jpg',
  bangkok: '/Bangkok-Thailand.jpg',
  pattaya: '/pattaya.jpg',
  'chiang mai': '/chiang-mai-thailand-16by9.webp',
  krabi:
    'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=800&q=80',
}

const DEFAULT_DESTINATION_IMAGE =
  'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=800&q=80'

function normalizeKey(value: string): string {
  return value.trim().toLowerCase()
}

export function countryFlagEmoji(country: string): string {
  const trimmed = country.trim()
  if (!trimmed) return '🌍'
  return COUNTRY_FLAGS[trimmed] ?? '🌍'
}

export function inferDestinationVisual(city: string, country: string): DestinationVisual {
  const c = normalizeKey(city)
  if (
    ['phuket', 'koh samui', 'koh phangan', 'koh tao', 'koh lanta', 'phi phi', 'samui'].some(
      (x) => c.includes(x),
    )
  ) {
    return 'island'
  }
  if (
    ['bangkok', 'singapore', 'jakarta', 'manila', 'kuala lumpur', 'ho chi minh', 'hanoi'].some(
      (x) => c.includes(x),
    )
  ) {
    return 'metro'
  }
  if (['pattaya', 'jomtien'].some((x) => c.includes(x))) return 'beachTown'
  if (['chiang mai', 'pai', 'chiang rai', 'mae hong son'].some((x) => c.includes(x))) {
    return 'mountain'
  }
  if (['krabi', 'hua hin', 'cha-am', 'rayong'].some((x) => c.includes(x))) return 'coast'
  if (normalizeKey(country) === 'thailand' && c.includes('koh')) return 'island'
  return 'coast'
}

function destinationSubtitle(city: string, country: string, gymCount: number): string {
  const custom = CITY_SUBTITLES[normalizeKey(city)]
  if (custom) return custom
  const place = country ? `${city}, ${country}` : city
  return `${gymCount} training camp${gymCount === 1 ? '' : 's'} in ${place}`
}

function destinationImage(city: string): string {
  return CITY_IMAGES[normalizeKey(city)] ?? DEFAULT_DESTINATION_IMAGE
}

/** Aggregate live catalog cities with gym counts (OTA-style destination list). */
export function buildLiveDestinationsFromGyms(
  gyms: Array<{ city?: string | null; country?: string | null }>,
): LiveDestination[] {
  const map = new Map<string, { city: string; country: string; count: number }>()

  for (const gym of gyms) {
    const city = gym.city?.trim()
    if (!city) continue
    const country = gym.country?.trim() || ''
    const key = `${normalizeKey(city)}|${normalizeKey(country)}`
    const existing = map.get(key)
    if (existing) {
      existing.count += 1
    } else {
      map.set(key, { city, country, count: 1 })
    }
  }

  return [...map.values()]
    .map(({ city, country, count }) => ({
      name: city,
      country,
      gymCount: count,
      subtitle: destinationSubtitle(city, country, count),
      visual: inferDestinationVisual(city, country),
      flag: countryFlagEmoji(country),
      image: destinationImage(city),
    }))
    .sort((a, b) => {
      if (b.gymCount !== a.gymCount) return b.gymCount - a.gymCount
      return a.name.localeCompare(b.name)
    })
}

export function filterLiveDestinations(
  destinations: LiveDestination[],
  query: string,
  limit = 12,
): LiveDestination[] {
  const q = normalizeKey(query)
  if (!q) return destinations.slice(0, limit)
  return destinations
    .filter(
      (d) =>
        normalizeKey(d.name).includes(q) ||
        normalizeKey(d.country).includes(q) ||
        normalizeKey(d.subtitle).includes(q),
    )
    .slice(0, limit)
}

export function findLiveDestinationByQuery(
  destinations: LiveDestination[],
  query: string,
): LiveDestination | undefined {
  const q = normalizeKey(query)
  if (!q) return undefined
  return destinations.find(
    (d) =>
      normalizeKey(d.name) === q ||
      normalizeKey(d.name).startsWith(`${q} `) ||
      `${normalizeKey(d.country)} ${normalizeKey(d.name)}` === q ||
      normalizeKey(d.name).includes(q),
  )
}

export function queryLooksLikeDestination(
  query: string,
  destinations: LiveDestination[],
): boolean {
  const q = normalizeKey(query)
  if (!q) return false
  const nearbyPhrases = ['near me', 'nearby', 'close to me', 'around me']
  if (nearbyPhrases.some((w) => q.includes(w))) return true
  if (/\bthailand\b/.test(q)) return true
  if (findLiveDestinationByQuery(destinations, q)) return true
  return filterLiveDestinations(destinations, q, 1).length > 0
}

async function fetchLiveDestinationRows(): Promise<GymCityRow[]> {
  const supabase = createPublicClient()
  const { data, error } = await supabase
    .from('gyms')
    .select('city, country')
    .in('verification_status', [...LIVE_VERIFICATION])
    .eq('status', 'approved')
    .eq('is_live', true)
    .not('city', 'is', null)

  if (error) {
    console.error('[live-destinations] fetch failed', error.message)
    return []
  }
  return (data ?? []) as GymCityRow[]
}

export async function fetchLiveDestinations(): Promise<LiveDestination[]> {
  const rows = await fetchLiveDestinationRows()
  return buildLiveDestinationsFromGyms(rows)
}

export const getLiveDestinationsCached = unstable_cache(
  fetchLiveDestinations,
  ['live-destinations-v1'],
  { revalidate: 300 },
)
