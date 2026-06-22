import { parseSearchQuery } from '@/lib/search/search-browse-title'

export type SearchCatalogFilters = {
  location: string
  discipline: string
  country: string
  minPrice: string
  maxPrice: string
  accommodation: boolean
}

function firstParam(
  sp: Record<string, string | string[] | undefined>,
  key: string,
): string {
  const v = sp[key]
  if (typeof v === 'string') return v
  if (Array.isArray(v) && v[0]) return v[0]
  return ''
}

/** Catalog filters shared by SSR search and the client search page (URL params only). */
export function parseSearchCatalogFiltersFromParams(
  sp: Record<string, string | string[] | undefined>,
): SearchCatalogFilters {
  const query = firstParam(sp, 'query')
  const parsed = parseSearchQuery(query)

  return {
    location: (firstParam(sp, 'location') || parsed.location).trim(),
    discipline: (firstParam(sp, 'discipline') || parsed.discipline).trim(),
    country: firstParam(sp, 'country').trim(),
    minPrice: firstParam(sp, 'minPrice').trim(),
    maxPrice: firstParam(sp, 'maxPrice').trim(),
    accommodation: firstParam(sp, 'accommodation') === 'true',
  }
}

export function searchCatalogFiltersKey(filters: SearchCatalogFilters): string {
  return JSON.stringify({
    location: filters.location,
    discipline: filters.discipline,
    country: filters.country,
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
    accommodation: filters.accommodation,
  })
}
