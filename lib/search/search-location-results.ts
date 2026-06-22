import { ALL_GYM_COUNTRIES } from '@/lib/constants/gym-countries'

/** Max driving-ish radius for the "nearby" section (Krabi ↔ Phuket ~160 km). */
export const NEARBY_SEARCH_RADIUS_KM = 150

export const NEARBY_SEARCH_MAX_RESULTS = 12

export type GymSearchCoords = {
  id: string
  city: string | null
  country: string | null
  latitude: number | null
  longitude: number | null
}

export type NearbySearchGym<T extends GymSearchCoords> = T & { distanceKm: number }

function normalizeKey(value: string): string {
  return value.trim().toLowerCase()
}

function matchCountryName(value: string): string | null {
  const q = value.trim()
  if (!q) return null
  const exact = ALL_GYM_COUNTRIES.find((c) => c === q)
  if (exact) return exact
  const low = normalizeKey(q)
  return ALL_GYM_COUNTRIES.find((c) => normalizeKey(c) === low) ?? null
}

export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/** Mirrors search page `city/country ilike` matching, including "City, Country" queries. */
export function gymMatchesLocationQuery(
  gym: Pick<GymSearchCoords, 'city' | 'country'>,
  locationQuery: string,
): boolean {
  const q = locationQuery.trim().toLowerCase()
  if (!q) return true

  const city = (gym.city || '').trim().toLowerCase()
  const country = (gym.country || '').trim().toLowerCase()

  if (q.includes(',')) {
    const parts = q.split(',').map((p) => p.trim()).filter(Boolean)
    const placePart = parts[0]?.toLowerCase() ?? ''
    const countryPart = parts.length > 1 ? parts[parts.length - 1].toLowerCase() : ''
    if (placePart && countryPart) {
      return city.includes(placePart) && country.includes(countryPart)
    }
  }

  return city.includes(q) || country.includes(q) || (city.length > 0 && q.includes(city))
}

export function isCountryOnlyLocationSearch(locationQuery: string): boolean {
  return matchCountryName(locationQuery) != null
}

export function inferCountryFromLocationQuery(locationQuery: string): string | null {
  const q = locationQuery.trim()
  if (!q) return null

  const direct = matchCountryName(q)
  if (direct) return direct

  if (q.includes(',')) {
    const countryPart = q.split(',').slice(-1)[0]?.trim() ?? ''
    const fromComma = matchCountryName(countryPart)
    if (fromComma) return fromComma
  }

  return null
}

export function locationSearchLabel(locationQuery: string): string {
  const q = locationQuery.trim()
  if (!q) return ''
  if (q.includes(',')) return q.split(',')[0]?.trim() || q
  return q
}

export function centroidOfGyms(
  gyms: Array<Pick<GymSearchCoords, 'latitude' | 'longitude'>>,
): { lat: number; lng: number } | null {
  const pts = gyms.filter(
    (g) => g.latitude != null && g.longitude != null && Number.isFinite(g.latitude) && Number.isFinite(g.longitude),
  )
  if (!pts.length) return null
  const lat = pts.reduce((sum, g) => sum + (g.latitude as number), 0) / pts.length
  const lng = pts.reduce((sum, g) => sum + (g.longitude as number), 0) / pts.length
  return { lat, lng }
}

export function partitionLocationSearchGyms<T extends GymSearchCoords>(
  gyms: T[],
  options: {
    locationQuery: string
    anchor: { lat: number; lng: number }
    radiusKm?: number
    maxNearby?: number
  },
): { primary: T[]; nearby: NearbySearchGym<T>[] } {
  const primary = gyms.filter((g) => gymMatchesLocationQuery(g, options.locationQuery))
  const primaryIds = new Set(primary.map((g) => g.id))
  const radiusKm = options.radiusKm ?? NEARBY_SEARCH_RADIUS_KM
  const maxNearby = options.maxNearby ?? NEARBY_SEARCH_MAX_RESULTS

  const nearby = gyms
    .filter(
      (g) =>
        !primaryIds.has(g.id) &&
        g.latitude != null &&
        g.longitude != null &&
        Number.isFinite(g.latitude) &&
        Number.isFinite(g.longitude),
    )
    .map((g) => ({
      ...g,
      distanceKm: haversineKm(options.anchor.lat, options.anchor.lng, g.latitude as number, g.longitude as number),
    }))
    .filter((g) => g.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, maxNearby)

  return { primary, nearby }
}

export function formatNearbyDistanceKm(distanceKm: number): string {
  if (distanceKm < 1) return 'Less than 1 km away'
  if (distanceKm < 10) return `${distanceKm.toFixed(1).replace(/\.0$/, '')} km away`
  return `${Math.round(distanceKm)} km away`
}
