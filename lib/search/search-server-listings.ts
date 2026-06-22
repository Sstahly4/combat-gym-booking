import { unstable_cache } from 'next/cache'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createPublicClient } from '@/lib/supabase/public-server'
import { PUBLIC_GYM_VERIFICATION_STATUSES } from '@/lib/seo/gym-public-status'
import { geocodeLocationServer } from '@/lib/geo/geocode-location-server'
import {
  centroidOfGyms,
  gymMatchesLocationQuery,
  inferCountryFromLocationQuery,
  isCountryOnlyLocationSearch,
  locationSearchLabel,
  partitionLocationSearchGyms,
  type NearbySearchGym,
} from '@/lib/search/search-location-results'
import {
  parseSearchCatalogFiltersFromParams,
  searchCatalogFiltersKey,
  type SearchCatalogFilters,
} from '@/lib/search/search-filters'

export const SEARCH_GYM_SELECT = `
  id,
  name,
  slug,
  city,
  country,
  address,
  tagline,
  description,
  price_per_day,
  price_per_week,
  price_per_month,
  currency,
  disciplines,
  amenities,
  created_at,
  latitude,
  longitude,
  images:gym_images(url, variants, order)
`

export type SearchListingGym = {
  id: string
  name: string
  slug: string | null
  city: string | null
  country: string | null
  address: string | null
  tagline: string | null
  description: string | null
  price_per_day: number | null
  price_per_week: number | null
  price_per_month: number | null
  currency: string
  disciplines: string[]
  amenities: Record<string, unknown> | null
  created_at: string
  latitude: number | null
  longitude: number | null
  images: Array<{ url: string; variants?: Record<string, string> | null; order?: number | null }>
  average_rating: number
  review_count: number
}

export type SearchServerPayload = {
  filtersKey: string
  filters: SearchCatalogFilters
  gyms: SearchListingGym[]
  nearbyGyms: NearbySearchGym<SearchListingGym>[]
}

function applyCatalogFilters(
  supabase: SupabaseClient,
  filters: SearchCatalogFilters,
) {
  let query = supabase
    .from('gyms')
    .select(SEARCH_GYM_SELECT)
    .in('verification_status', [...PUBLIC_GYM_VERIFICATION_STATUSES])
    .eq('status', 'approved')
    .eq('is_live', true)
    .order('order', { ascending: true, nullsFirst: false, foreignTable: 'gym_images' })
    .limit(1, { foreignTable: 'gym_images' })

  if (filters.country) query = query.ilike('country', `%${filters.country}%`)
  if (filters.discipline) query = query.contains('disciplines', [filters.discipline])
  if (filters.minPrice) {
    const min = parseFloat(filters.minPrice)
    if (Number.isFinite(min)) query = query.gte('price_per_day', min)
  }
  if (filters.maxPrice) {
    const max = parseFloat(filters.maxPrice)
    if (Number.isFinite(max)) query = query.lte('price_per_day', max)
  }
  if (filters.accommodation) {
    query = query.eq('amenities->accommodation', true)
  }

  return query
}

async function enrichSearchGyms(
  supabase: SupabaseClient,
  gymsRaw: Record<string, unknown>[],
): Promise<SearchListingGym[]> {
  const ids = gymsRaw.map((g) => g.id as string).filter(Boolean)
  const statsByGym: Record<string, { avg: number; count: number }> = {}

  if (ids.length > 0) {
    const { data: reviews } = await supabase
      .from('reviews')
      .select('gym_id, rating')
      .in('gym_id', ids)

    const byGym: Record<string, number[]> = {}
    for (const row of reviews || []) {
      const gymId = row.gym_id as string | undefined
      const rating = row.rating as number | undefined
      if (!gymId || typeof rating !== 'number') continue
      if (!byGym[gymId]) byGym[gymId] = []
      byGym[gymId].push(rating)
    }

    for (const [gymId, ratings] of Object.entries(byGym)) {
      statsByGym[gymId] = {
        avg: ratings.reduce((s, n) => s + n, 0) / ratings.length,
        count: ratings.length,
      }
    }
  }

  return gymsRaw.map((gym) => {
    const images = Array.isArray(gym.images)
      ? [...gym.images].sort(
          (a, b) =>
            ((a as { order?: number }).order ?? 999) -
            ((b as { order?: number }).order ?? 999),
        )
      : []

    const id = gym.id as string
    return {
      id,
      name: String(gym.name ?? ''),
      slug: (gym.slug as string | null) ?? null,
      city: (gym.city as string | null) ?? null,
      country: (gym.country as string | null) ?? null,
      address: (gym.address as string | null) ?? null,
      tagline: (gym.tagline as string | null) ?? null,
      description: (gym.description as string | null) ?? null,
      price_per_day: (gym.price_per_day as number | null) ?? null,
      price_per_week: (gym.price_per_week as number | null) ?? null,
      price_per_month: (gym.price_per_month as number | null) ?? null,
      currency: String(gym.currency ?? 'USD'),
      disciplines: Array.isArray(gym.disciplines) ? (gym.disciplines as string[]) : [],
      amenities: (gym.amenities as Record<string, unknown> | null) ?? null,
      created_at: String(gym.created_at ?? ''),
      latitude: (gym.latitude as number | null) ?? null,
      longitude: (gym.longitude as number | null) ?? null,
      images: images as SearchListingGym['images'],
      average_rating: statsByGym[id]?.avg ?? 0,
      review_count: statsByGym[id]?.count ?? 0,
    }
  })
}

export async function fetchSearchGymsServer(
  filters: SearchCatalogFilters,
): Promise<Pick<SearchServerPayload, 'gyms' | 'nearbyGyms'>> {
  const supabase = createPublicClient()
  const locationQuery = filters.location.trim()
  const useNearbyExpansion = Boolean(locationQuery) && !isCountryOnlyLocationSearch(locationQuery)

  if (useNearbyExpansion) {
    let country = inferCountryFromLocationQuery(locationQuery)
    const anchor = await geocodeLocationServer(locationQuery)

    if (!country && anchor?.country) {
      country = inferCountryFromLocationQuery(anchor.country) ?? anchor.country
    }

    let regionalQuery = applyCatalogFilters(supabase, filters)
    if (country) {
      regionalQuery = regionalQuery.ilike('country', `%${country}%`)
    } else {
      regionalQuery = regionalQuery.or(
        `city.ilike.%${locationQuery}%,country.ilike.%${locationQuery}%`,
      )
    }

    const { data, error } = await regionalQuery
    if (error) {
      console.error('fetchSearchGymsServer regional:', error)
      return { gyms: [], nearbyGyms: [] }
    }

    const enriched = await enrichSearchGyms(supabase, data || [])
    const primaryMatches = enriched.filter((g) => gymMatchesLocationQuery(g, locationQuery))

    const centroid = centroidOfGyms(primaryMatches)
    let resolvedAnchor = centroid ?? (anchor ? { lat: anchor.lat, lng: anchor.lng } : null)
    if (!resolvedAnchor && country) {
      const geo = await geocodeLocationServer(`${locationSearchLabel(locationQuery)}, ${country}`)
      if (geo) resolvedAnchor = { lat: geo.lat, lng: geo.lng }
    }

    if (resolvedAnchor) {
      const { primary, nearby } = partitionLocationSearchGyms(enriched, {
        locationQuery,
        anchor: resolvedAnchor,
      })
      return { gyms: primary, nearbyGyms: nearby }
    }

    return { gyms: primaryMatches, nearbyGyms: [] }
  }

  let query = applyCatalogFilters(supabase, filters)
  if (locationQuery) {
    query = query.or(`city.ilike.%${locationQuery}%,country.ilike.%${locationQuery}%`)
  }

  const { data, error } = await query
  if (error) {
    console.error('fetchSearchGymsServer:', error)
    return { gyms: [], nearbyGyms: [] }
  }

  const enriched = await enrichSearchGyms(supabase, data || [])
  return { gyms: enriched, nearbyGyms: [] }
}

const getCachedSearchPayload = unstable_cache(
  async (filtersKey: string) => {
    const filters = JSON.parse(filtersKey) as SearchCatalogFilters
    const result = await fetchSearchGymsServer(filters)
    return {
      filtersKey,
      filters,
      ...result,
    } satisfies SearchServerPayload
  },
  ['search-ssr-payload-v1'],
  { revalidate: 300, tags: ['gyms'] },
)

export async function fetchSearchServerPayload(
  sp: Record<string, string | string[] | undefined>,
): Promise<SearchServerPayload> {
  const filters = parseSearchCatalogFiltersFromParams(sp)
  const filtersKey = searchCatalogFiltersKey(filters)
  return getCachedSearchPayload(filtersKey)
}
