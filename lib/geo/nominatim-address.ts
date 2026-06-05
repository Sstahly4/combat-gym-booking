/**
 * Returns true when the string contains characters from a non-Latin script
 * (Thai, CJK, Hangul, Cyrillic, Arabic, Devanagari, etc.).
 * Extended-Latin characters (München, São Paulo, Kraków) pass through cleanly.
 */
export function hasNonLatinChars(s: string): boolean {
  return /[\u0E00-\u0E7F\u3000-\u9FFF\uAC00-\uD7AF\u0400-\u04FF\u0600-\u06FF\u0900-\u097F]/.test(s)
}

/**
 * Derive a display "city" label from Nominatim `address` object (addressdetails=1).
 * Order follows populated-place granularity: city → town → village → … → county.
 */
export function parseCityFromNominatimAddress(
  a: Record<string, string | undefined> | null | undefined
): string | null {
  if (!a) return null
  const keys = [
    'city',
    'town',
    'village',
    'municipality',
    'city_district',
    'borough',
    'state_district',
    'county',
  ] as const
  for (const k of keys) {
    const v = a[k]
    if (v && typeof v === 'string' && v.trim()) return v.trim()
  }
  return null
}

/** Match OSM country name to platform list (full country names). */
export function matchGymCountryName(
  osmCountry: string | undefined,
  countries: readonly string[]
): string | null {
  if (!osmCountry?.trim()) return null
  const t = osmCountry.trim()
  const exact = countries.find((c) => c === t)
  if (exact) return exact
  const low = t.toLowerCase()
  return countries.find((c) => c.toLowerCase() === low) ?? null
}

export function buildNominatimAddressQueries(query: string): string[] {
  const q = query.trim().replace(/\s+/g, ' ')
  const variants = [
    q,
    q.replace(/\bM\.?\s*\d+\b/gi, '').replace(/\s+/g, ' '),
    q.replace(/\bMoo\s*\d+\b/gi, '').replace(/\s+/g, ' '),
    q
      .replace(/\bM\.?\s*\d+\b/gi, '')
      .replace(/\bMoo\s*\d+\b/gi, '')
      .replace(/\s*,\s*/g, ', ')
      .replace(/\s+/g, ' '),
  ]

  return Array.from(new Set(variants.map((item) => item.trim()).filter((item) => item.length >= 3)))
}

export type NominatimSearchHit = {
  display_name: string
  lat: string
  lon: string
  address?: Record<string, string>
}
