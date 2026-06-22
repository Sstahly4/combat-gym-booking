import { unstable_cache } from 'next/cache'
import { createPublicClient } from '@/lib/supabase/public-server'
import { mergeGymAmenitiesFromDb } from '@/lib/constants/gym-amenities'
import { locationToSlug } from '@/lib/seo/location-slug'
import {
  getThailandGymsForGuide,
  type GuideGym,
} from '@/lib/guides/thailand-gyms'

export type AmenityCatalogRow = {
  id: string
  key: string
  name: string
  slug: string
  category: string | null
}

export type Tier4MatrixCell = {
  city: string
  citySlug: string
  amenitySlug: string
  amenityName: string
  gymCount: number
}

export type Tier4AmenityLink = {
  href: string
  label: string
  gymCount: number
}

const DEFAULT_DISCIPLINE = 'Muay Thai'

export function tier4GuidePath(city: string, amenitySlug: string): string {
  return `/blog/best-muay-thai-gyms/${locationToSlug(city)}/${amenitySlug}`
}

/** Copy builder when amenity slug is known (canonical paths use DB slug). */
export function buildTier4GuideCopyFromSlug(
  city: string,
  amenity: Pick<AmenityCatalogRow, 'name' | 'slug'>,
) {
  const title = `Best Muay Thai Gyms in ${city} with ${amenity.name} (2026)`
  const seoTitle = `Muay Thai ${city} ${amenity.name} 2026 [Prices + Reviews]`
  const path = tier4GuidePath(city, amenity.slug)
  const description = `Ranked Muay Thai gyms in ${city}, Thailand with ${amenity.name.toLowerCase()}. Verified listings, prices, photos, and reviews — book on CombatStay.`
  return { title, seoTitle, description, path }
}

const getAmenityCatalogCached = unstable_cache(
  async (): Promise<AmenityCatalogRow[]> => {
    try {
      const supabase = createPublicClient()
      const { data, error } = await supabase
        .from('amenities')
        .select('id, key, name, slug, category')
        .order('name')
      if (error) {
        console.error('getAmenityCatalogCached:', error)
        return []
      }
      return (data || []) as AmenityCatalogRow[]
    } catch (err) {
      console.error('getAmenityCatalogCached failed:', err)
      return []
    }
  },
  ['amenity-catalog-v1'],
  { revalidate: 3600, tags: ['gyms'] },
)

const getGymAmenitySlugsCached = unstable_cache(
  async (): Promise<Record<string, string[]>> => {
    const byGym: Record<string, string[]> = {}
    try {
      const supabase = createPublicClient()
      const { data, error } = await supabase
        .from('gym_amenities')
        .select('gym_id, amenity:amenities(slug)')
      if (error) {
        console.error('getGymAmenitySlugsCached:', error)
        return byGym
      }
      for (const row of data || []) {
        const gymId = row.gym_id as string
        const slug = (row.amenity as { slug?: string } | null)?.slug
        if (!gymId || !slug) continue
        if (!byGym[gymId]) byGym[gymId] = []
        if (!byGym[gymId]!.includes(slug)) byGym[gymId]!.push(slug)
      }
    } catch (err) {
      console.error('getGymAmenitySlugsCached failed:', err)
    }
    return byGym
  },
  ['gym-amenity-slugs-v1'],
  { revalidate: 3600, tags: ['gyms'] },
)

function amenitySlugsForGym(
  gym: GuideGym,
  junctionByGym: Record<string, string[]>,
  slugByKey: Map<string, string>,
): Set<string> {
  const fromJunction = junctionByGym[gym.id]
  if (fromJunction && fromJunction.length > 0) return new Set(fromJunction)

  const slugs = new Set<string>()
  const merged = mergeGymAmenitiesFromDb(gym.amenities)
  for (const [key, enabled] of Object.entries(merged)) {
    if (!enabled) continue
    const slug = slugByKey.get(key)
    if (slug) slugs.add(slug)
  }
  return slugs
}

export async function getAmenityBySlug(slug: string): Promise<AmenityCatalogRow | null> {
  const catalog = await getAmenityCatalogCached()
  return catalog.find((a) => a.slug === slug) ?? null
}

export async function getThailandGymsForAmenityGuide(filters: {
  city: string
  amenitySlug: string
  discipline?: string
}): Promise<{ gyms: GuideGym[]; amenity: AmenityCatalogRow } | null> {
  const amenity = await getAmenityBySlug(filters.amenitySlug)
  if (!amenity) return null

  const discipline = filters.discipline ?? DEFAULT_DISCIPLINE
  const junctionByGym = await getGymAmenitySlugsCached()
  const catalog = await getAmenityCatalogCached()
  const slugByKey = new Map(catalog.map((a) => [a.key, a.slug]))

  const cityGyms = await getThailandGymsForGuide({ city: filters.city, discipline })
  const gyms = cityGyms.filter((g) =>
    amenitySlugsForGym(g, junctionByGym, slugByKey).has(amenity.slug),
  )

  return { gyms, amenity }
}

export async function getTier4MatrixCells(
  discipline = DEFAULT_DISCIPLINE,
): Promise<Tier4MatrixCell[]> {
  const [gyms, junctionByGym, catalog] = await Promise.all([
    getThailandGymsForGuide({ discipline }),
    getGymAmenitySlugsCached(),
    getAmenityCatalogCached(),
  ])

  const slugByKey = new Map(catalog.map((a) => [a.key, a.slug]))
  const nameBySlug = new Map(catalog.map((a) => [a.slug, a.name]))
  const counts = new Map<string, Tier4MatrixCell>()

  for (const gym of gyms) {
    const city = gym.city?.trim()
    if (!city) continue

    const slugs = amenitySlugsForGym(gym, junctionByGym, slugByKey)
    for (const amenitySlug of slugs) {
      const key = `${locationToSlug(city)}:${amenitySlug}`
      const existing = counts.get(key)
      if (existing) {
        existing.gymCount += 1
        continue
      }
      counts.set(key, {
        city,
        citySlug: locationToSlug(city),
        amenitySlug,
        amenityName: nameBySlug.get(amenitySlug) ?? amenitySlug,
        gymCount: 1,
      })
    }
  }

  return Array.from(counts.values())
    .filter((c) => c.gymCount > 0)
    .sort((a, b) => {
      const cityCmp = a.city.localeCompare(b.city)
      if (cityCmp !== 0) return cityCmp
      return a.amenityName.localeCompare(b.amenityName)
    })
}

export async function getTier4AmenityLinksForCity(
  city: string,
  discipline = DEFAULT_DISCIPLINE,
  limit = 12,
): Promise<Tier4AmenityLink[]> {
  const citySlug = locationToSlug(city)
  const cells = await getTier4MatrixCells(discipline)
  return cells
    .filter((c) => c.citySlug === citySlug)
    .sort((a, b) => b.gymCount - a.gymCount)
    .slice(0, limit)
    .map((c) => ({
      href: tier4GuidePath(c.city, c.amenitySlug),
      label: c.amenityName,
      gymCount: c.gymCount,
    }))
}
