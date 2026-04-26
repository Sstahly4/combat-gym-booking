/**
 * Fetches real nearby points of interest from OpenStreetMap Overpass API
 * (free, no API key, used by Airbnb neighbourhood guides internally).
 *
 * Called ONCE per gym from the admin enrichment endpoint — never on page load.
 * Results are stored in gyms.things_to_do and served from the DB at render time.
 */

export type ThingsToDoCategory = 'eat' | 'nature' | 'training' | 'explore'

export interface ThingToDo {
  name: string
  category: ThingsToDoCategory
  distanceKm: number
}

const OVERPASS_ENDPOINT = 'https://overpass-api.de/api/interpreter'

// Build an Overpass QL query for relevant POI types around a lat/lon.
// We search different radii by category:
//   eat       → 600m   (walking distance to food)
//   training  → 3000m  (worth a taxi to cross-train)
//   nature    → 2500m  (roadwork / recovery)
//   explore   → 1500m  (local culture, markets)
function buildQuery(lat: number, lon: number): string {
  return `
[out:json][timeout:30];
(
  node["amenity"~"^(restaurant|cafe|food_court|bar|fast_food)$"]["name"](around:600,${lat},${lon});
  node["shop"~"^(marketplace|supermarket)$"]["name"](around:600,${lat},${lon});
  node["amenity"="marketplace"]["name"](around:700,${lat},${lon});
  node["leisure"~"^(park|nature_reserve|beach|sports_centre|fitness_centre|golf_course|swimming_pool|track)$"]["name"](around:2500,${lat},${lon});
  way["natural"~"^(beach|water|coastline)$"]["name"](around:2500,${lat},${lon});
  node["sport"~"^(martial_arts|boxing|kickboxing|muay_thai|wrestling|judo|bjj|mma|fitness)$"]["name"](around:3000,${lat},${lon});
  node["amenity"~"^(arts_centre|cinema|theatre|nightclub)$"]["name"](around:1500,${lat},${lon});
  node["tourism"~"^(attraction|viewpoint|museum|gallery|theme_park|zoo)$"]["name"](around:1500,${lat},${lon});
);
out center 50;
  `.trim()
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
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

function classifyCategory(tags: Record<string, string>): ThingsToDoCategory {
  const amenity = tags.amenity ?? ''
  const leisure = tags.leisure ?? ''
  const sport = tags.sport ?? ''
  const tourism = tags.tourism ?? ''
  const natural = tags.natural ?? ''
  const shop = tags.shop ?? ''

  if (/restaurant|cafe|food_court|bar|fast_food|marketplace/.test(amenity) || /marketplace|supermarket/.test(shop)) {
    return 'eat'
  }
  if (/martial_arts|boxing|kickboxing|muay_thai|wrestling|judo|bjj|mma|fitness/.test(sport) ||
      /sports_centre|fitness_centre|swimming_pool|track/.test(leisure)) {
    return 'training'
  }
  if (/park|nature_reserve|beach|golf_course/.test(leisure) || /beach|water|coastline/.test(natural)) {
    return 'nature'
  }
  if (/arts_centre|cinema|theatre|nightclub/.test(amenity) || /attraction|viewpoint|museum|gallery|theme_park|zoo/.test(tourism)) {
    return 'explore'
  }
  return 'explore'
}

function isUsableName(name: string): boolean {
  if (!name || name.length < 2) return false
  // Skip if entirely non-Latin (Thai, Chinese, Arabic etc.) with no Latin characters
  const hasLatin = /[A-Za-z]/.test(name)
  const hasNonLatin = /[^\u0000-\u007F]/.test(name)
  if (hasNonLatin && !hasLatin) return false
  // Skip generic/unhelpful names
  const skip = /^(unnamed|no name|unknown|n\/a)$/i
  if (skip.test(name.trim())) return false
  return true
}

function preferredName(tags: Record<string, string>): string {
  // OpenStreetMap tags: name:en > brand > name
  return (tags['name:en'] || tags['brand'] || tags['name'] || '').trim()
}

/**
 * Fetches and returns up to `maxResults` categorised nearby POIs for a given
 * lat/lon from OpenStreetMap. Returns an empty array if coordinates are missing
 * or the API is unavailable.
 */
export async function fetchThingsToDo(
  lat: number,
  lon: number,
  maxResults = 6,
): Promise<ThingToDo[]> {
  const query = buildQuery(lat, lon)

  let json: any
  try {
    const res = await fetch(OVERPASS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(query)}`,
      signal: AbortSignal.timeout(35_000),
    })
    if (!res.ok) throw new Error(`Overpass HTTP ${res.status}`)
    json = await res.json()
  } catch (err) {
    console.error('[things-to-do] Overpass fetch failed:', err)
    return []
  }

  const elements: any[] = json?.elements ?? []
  const seen = new Set<string>()
  const results: ThingToDo[] = []

  // Category slot caps so the card stays balanced (not 6 restaurants)
  const categoryCount: Record<ThingsToDoCategory, number> = { eat: 0, nature: 0, training: 0, explore: 0 }
  const MAX_PER_CATEGORY = 2

  // Sort by distance before applying slot caps
  const withDistance = elements
    .map((el) => {
      const elLat: number = el.lat ?? el.center?.lat
      const elLon: number = el.lon ?? el.center?.lon
      if (!elLat || !elLon) return null
      const tags: Record<string, string> = el.tags ?? {}
      const name = preferredName(tags)
      if (!isUsableName(name)) return null
      return {
        name,
        tags,
        distanceKm: Math.round(haversineKm(lat, lon, elLat, elLon) * 10) / 10,
      }
    })
    .filter(Boolean)
    .sort((a, b) => a!.distanceKm - b!.distanceKm) as Array<{
    name: string
    tags: Record<string, string>
    distanceKm: number
  }>

  for (const item of withDistance) {
    if (results.length >= maxResults) break
    const key = item.name.toLowerCase()
    if (seen.has(key)) continue
    const category = classifyCategory(item.tags)
    if (categoryCount[category] >= MAX_PER_CATEGORY) continue
    seen.add(key)
    categoryCount[category]++
    results.push({ name: item.name, category, distanceKm: item.distanceKm })
  }

  return results
}
