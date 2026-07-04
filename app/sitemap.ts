import type { MetadataRoute } from 'next'
import { createPublicClient } from '@/lib/supabase/public-server'
import { canonicalSiteUrl } from '@/lib/brand'
import { locationToSlug } from '@/lib/seo/location-slug'
import { discoverBlogSitemapPaths } from '@/lib/seo/discover-blog-paths'
import { PUBLIC_GYM_VERIFICATION_STATUSES } from '@/lib/seo/gym-public-status'
import { gymCanonicalPath } from '@/lib/seo/gym-canonical-path'
import { gymListsDiscipline } from '@/lib/guides/discipline-match'

const siteUrl = canonicalSiteUrl()

const FLAGSHIP_GUIDE_PATH = '/blog/best-muay-thai-camps-thailand-2026'
const FLAGSHIP_GUIDE_LAST_MODIFIED = new Date('2026-07-04T12:00:00Z')

const HIGH_PRIORITY_CITY_GUIDES = new Set([
  '/blog/best-muay-thai-gyms-bangkok',
  '/blog/best-muay-thai-gyms-phuket',
  '/blog/best-muay-thai-gyms-chiang-mai',
])

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
    lastModified: path === FLAGSHIP_GUIDE_PATH ? FLAGSHIP_GUIDE_LAST_MODIFIED : now,
    ...(path === FLAGSHIP_GUIDE_PATH
      ? { priority: 0.9, changeFrequency: 'weekly' as const }
      : path === '/'
        ? { priority: 0.8, changeFrequency: 'weekly' as const }
        : HIGH_PRIORITY_CITY_GUIDES.has(path)
          ? { priority: 0.75, changeFrequency: 'weekly' as const }
          : {}),
  }))

  let gymRoutes: MetadataRoute.Sitemap = []
  let muayThaiCityGuideRoutes: MetadataRoute.Sitemap = []
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
  } catch (err) {
    console.error('sitemap: failed to load gyms', err)
  }

  return [...staticRoutes, ...gymRoutes, ...muayThaiCityGuideRoutes]
}
