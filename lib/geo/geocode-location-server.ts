import {
  buildNominatimAddressQueries,
  type NominatimSearchHit,
} from '@/lib/geo/nominatim-address'

const NOMINATIM = 'https://nominatim.openstreetmap.org/search'

/** Server-side geocode for search SSR (mirrors /api/geo/address-search first hit). */
export async function geocodeLocationServer(
  query: string,
): Promise<{ lat: number; lng: number; country: string | null } | null> {
  const q = query.trim()
  if (q.length < 3) return null

  try {
    let raw: NominatimSearchHit[] = []
    for (const nominatimQuery of buildNominatimAddressQueries(q)) {
      const params = new URLSearchParams({
        q: nominatimQuery,
        format: 'json',
        limit: '8',
        addressdetails: '1',
        'accept-language': 'en',
      })

      const res = await fetch(`${NOMINATIM}?${params.toString()}`, {
        headers: { 'User-Agent': 'CombatStay/1.0 (https://combatstay.com)' },
        next: { revalidate: 3600 },
      })

      if (!res.ok) continue

      const nextRaw = (await res.json()) as NominatimSearchHit[]
      if (Array.isArray(nextRaw) && nextRaw.length > 0) {
        raw = nextRaw
        break
      }
    }

    const hit = raw.find((row) => row.lat && row.lon)
    if (!hit?.lat || !hit.lon) return null

    const lat = parseFloat(hit.lat)
    const lng = parseFloat(hit.lon)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null

    return {
      lat,
      lng,
      country: hit.address?.country?.trim() || null,
    }
  } catch (err) {
    console.error('geocodeLocationServer failed:', err)
    return null
  }
}
