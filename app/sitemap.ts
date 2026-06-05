import type { MetadataRoute } from 'next'
import { createPublicClient } from '@/lib/supabase/public-server'
import { canonicalSiteUrl } from '@/lib/brand'
import { locationToSlug } from '@/lib/seo/location-slug'
import { gymListsDiscipline } from '@/lib/guides/discipline-match'

const siteUrl = canonicalSiteUrl()

const MAIN_CITY_GUIDES = new Set([
  'Phuket',
  'Bangkok',
  'Chiang Mai',
  'Pattaya',
  'Hua Hin',
  'Krabi',
  'Koh Samui',
  'Koh Phangan',
  'Koh Tao',
])

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  const staticPaths = [
    '/',
    '/search',
    '/blog',
    '/blog/combat-sports-travel-guide-thailand-2026',
    '/blog/dont-get-burned-thailand-training-trip',
    '/blog/fighters-blueprint-recovery-housing-thailand-2026',
    '/blog/best-muay-thai-camps-thailand-2026',
    '/blog/muay-thai-krabi-private-ac-rooms',
    '/blog/best-muay-thai-gym-female-solo-travelers-2026',
    '/blog/muay-thai-fight-prep-camps-physiotherapy',
    '/blog/muay-thai-camp-thailand-cost',
    '/blog/muay-thai-camp-1-week-vs-1-month',
    '/blog/packing-list-combat-sports-camp-thailand',
    '/blog/beginners-guide-muay-thai-chiang-mai',
    '/blog/koh-tao-vs-koh-phangan-muay-thai',
    '/blog/bjj-in-thailand-rise-top-camps',
    '/blog/western-boxing-bangkok',
    '/blog/ed-visa-martial-arts-training-thailand',
    '/blog/phuket-fighter-conditioning-gyms',
    '/blog/thailand-training-visa-dtv',
    '/blog/thailand-visa-extension-overstay-guide',
    '/blog/best-muay-thai-gyms-phuket',
    '/blog/best-muay-thai-gyms-bangkok',
    '/blog/best-muay-thai-gyms-chiang-mai',
    '/blog/best-muay-thai-gyms-pattaya',
    '/blog/best-muay-thai-gyms-hua-hin',
    '/blog/best-muay-thai-gyms-krabi',
    '/blog/best-muay-thai-gyms-koh-samui',
    '/blog/best-muay-thai-gyms-koh-phangan',
    '/blog/best-muay-thai-gyms-koh-tao',
    '/blog/best-mma-camps-thailand',
    '/blog/best-bjj-gyms-thailand',
    '/blog/best-boxing-gyms-thailand',
    '/blog/best-kickboxing-gyms-thailand',
    '/blog/best-judo-gyms-thailand',
    '/blog/ludus-sports-complex-chalong-phuket',
  ]

  const staticRoutes: MetadataRoute.Sitemap = staticPaths.map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: now,
  }))

  let gymRoutes: MetadataRoute.Sitemap = []
  let muayThaiCityGuideRoutes: MetadataRoute.Sitemap = []
  try {
    const supabase = createPublicClient()
    const { data: gyms } = await supabase
      .from('gyms')
      .select('id, slug, updated_at')
      .eq('verification_status', 'verified')

    gymRoutes =
      gyms?.map((g) => ({
        url: `${siteUrl}/gyms/${g.slug?.trim() || g.id}`,
        lastModified: g.updated_at ? new Date(g.updated_at) : now,
      })) ?? []

    // “Micro-location” Muay Thai city/suburb guides (dynamic route).
    // This keeps SEO coverage up to date as new gyms/cities are added.
    const { data: thaiMuayThaiRows } = await supabase
      .from('gyms')
      .select('city, updated_at, disciplines, country, verification_status')
      .in('verification_status', ['verified', 'trusted'])
      .ilike('country', '%Thailand%')

    const cityLatest = new Map<string, Date>()
    for (const row of (thaiMuayThaiRows ?? []) as Array<{
      city: string | null
      updated_at: string | null
      disciplines: string[] | null
    }>) {
      const city = (row.city || '').trim()
      if (!city) continue
      if (MAIN_CITY_GUIDES.has(city)) continue
      if (!gymListsDiscipline(row.disciplines ?? [], 'Muay Thai')) continue

      const d = row.updated_at ? new Date(row.updated_at) : now
      const prev = cityLatest.get(city)
      if (!prev || d > prev) cityLatest.set(city, d)
    }

    muayThaiCityGuideRoutes = Array.from(cityLatest.entries()).map(([city, lastModified]) => ({
      url: `${siteUrl}/blog/best-muay-thai-gyms/${locationToSlug(city)}`,
      lastModified,
    }))
  } catch (err) {
    console.error('sitemap: failed to load gyms', err)
  }

  return [...staticRoutes, ...gymRoutes, ...muayThaiCityGuideRoutes]
}
