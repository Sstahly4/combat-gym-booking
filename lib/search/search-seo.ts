import { createPublicClient } from '@/lib/supabase/public-server'
import { gymCanonicalPath } from '@/lib/seo/gym-canonical-path'
import { PUBLIC_GYM_VERIFICATION_STATUSES } from '@/lib/seo/gym-public-status'
import {
  buildSearchBrowseTitleFromSearchParams,
  parseSearchQuery,
} from '@/lib/search/search-browse-title'

function firstParam(
  sp: Record<string, string | string[] | undefined>,
  key: string,
): string {
  const v = sp[key]
  if (typeof v === 'string') return v
  if (Array.isArray(v) && v[0]) return v[0]
  return ''
}

export function buildSearchBrowseDescriptionFromSearchParams(
  sp: Record<string, string | string[] | undefined>,
): string {
  const query = firstParam(sp, 'query')
  const location = firstParam(sp, 'location')
  const discipline = firstParam(sp, 'discipline')
  const parsed = parseSearchQuery(query)
  const loc = (location || parsed.location).trim()
  const disc = (discipline || parsed.discipline).trim()

  if (loc && disc) {
    return `Compare verified ${disc} training camps in ${loc}. Filter by price, dates, and amenities — book instantly on CombatStay.`
  }
  if (loc) {
    return `Browse verified Muay Thai and MMA camps in ${loc}. Compare prices, photos, reviews, and amenities — book instantly on CombatStay.`
  }
  if (disc) {
    return `Find verified ${disc} training camps worldwide. Compare prices, photos, and reviews — book instantly on CombatStay.`
  }
  return 'Search verified Muay Thai, MMA, BJJ, and boxing camps worldwide. Compare prices, photos, reviews, and amenities — book instantly on CombatStay.'
}

export type SearchSeoListing = {
  id: string
  name: string
  href: string
  city: string | null
  country: string | null
}

export async function fetchSearchSeoListings(
  sp: Record<string, string | string[] | undefined>,
  limit = 24,
): Promise<SearchSeoListing[]> {
  const query = firstParam(sp, 'query')
  const location = firstParam(sp, 'location')
  const discipline = firstParam(sp, 'discipline')
  const parsed = parseSearchQuery(query)
  const loc = (location || parsed.location).trim()
  const disc = (discipline || parsed.discipline).trim()

  if (!loc && !disc) return []

  try {
    const supabase = createPublicClient()
    let request = supabase
      .from('gyms')
      .select('id, name, slug, city, country, disciplines')
      .in('verification_status', [...PUBLIC_GYM_VERIFICATION_STATUSES])
      .order('updated_at', { ascending: false })
      .limit(limit)

    if (loc) {
      request = request.or(`city.ilike.%${loc}%,country.ilike.%${loc}%`)
    }

    const { data, error } = await request
    if (error || !data) return []

    const filtered = disc
      ? data.filter((g) =>
          (g.disciplines ?? []).some(
            (d: string) => d.toLowerCase() === disc.toLowerCase(),
          ),
        )
      : data

    return filtered.map((g) => ({
      id: g.id,
      name: g.name,
      href: gymCanonicalPath(g),
      city: g.city,
      country: g.country,
    }))
  } catch (err) {
    console.error('fetchSearchSeoListings failed:', err)
    return []
  }
}

export function searchSeoHeadingFromSearchParams(
  sp: Record<string, string | string[] | undefined>,
): string {
  const title = buildSearchBrowseTitleFromSearchParams(sp)
  return title.replace(/\s*\|\s*CombatStay$/, '')
}
