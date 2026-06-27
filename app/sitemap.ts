import type { MetadataRoute } from 'next'
import { createPublicClient } from '@/lib/supabase/public-server'
import { canonicalSiteUrl } from '@/lib/brand'
import { locationToSlug } from '@/lib/seo/location-slug'
import { discoverBlogSitemapPaths } from '@/lib/seo/discover-blog-paths'
import { PUBLIC_GYM_VERIFICATION_STATUSES } from '@/lib/seo/gym-public-status'
import { gymCanonicalPath } from '@/lib/seo/gym-canonical-path'
import { getTier4MatrixCells } from '@/lib/guides/tier4-amenity-guides'
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
    '/destinations',
    '/faq',
    '/help/bookings',
    '/help/payments',
    '/help/safety',
    '/help/gyms',
    '/help/general',
    '/contact',
    '/how-it-works',
    '/about',
    '/privacy',
    '/terms',
    '/data-deletion',
    '/accessibility',
    '/owners/help',
    '/owners/help/listings',
    '/owners/help/bookings',
    '/owners/help/payouts',
    '/owners/help/promotions',
    '/owners/help/account',
    '/owners/help/support',
    '/owners',
    ...discoverBlogSitemapPaths(),
  ]

  const staticRoutes: MetadataRoute.Sitemap = staticPaths.map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: now,
  }))

  let gymRoutes: MetadataRoute.Sitemap = []
  let muayThaiCityGuideRoutes: MetadataRoute.Sitemap = []
  let tier4AmenityGuideRoutes: MetadataRoute.Sitemap = []
  try {
    const supabase = createPublicClient()
    const { data: gyms } = await supabase
      .from('gyms')
      .select('id, slug, updated_at')
      .in('verification_status', [...PUBLIC_GYM_VERIFICATION_STATUSES])

    gymRoutes =
      gyms?.map((g) => ({
        url: `${siteUrl}${gymCanonicalPath(g)}`,
        lastModified: g.updated_at ? new Date(g.updated_at) : now,
      })) ?? []

    const { data: thaiMuayThaiRows } = await supabase
      .from('gyms')
      .select('city, updated_at, disciplines, country, verification_status')
      .in('verification_status', [...PUBLIC_GYM_VERIFICATION_STATUSES])
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

    const tier4Cells = await getTier4MatrixCells()
    tier4AmenityGuideRoutes = tier4Cells.map((cell) => ({
      url: `${siteUrl}/blog/best-muay-thai-gyms/${cell.citySlug}/${cell.amenitySlug}`,
      lastModified: now,
    }))
  } catch (err) {
    console.error('sitemap: failed to load gyms', err)
  }

  return [...staticRoutes, ...gymRoutes, ...muayThaiCityGuideRoutes, ...tier4AmenityGuideRoutes]
}
