import type { MetadataRoute } from 'next'
import { createPublicClient } from '@/lib/supabase/public-server'

const siteUrl = (
  process.env.NEXT_PUBLIC_APP_URL || 'https://www.combatbooking.com'
).replace(/\/$/, '')

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  const staticPaths = [
    '/',
    '/search',
    '/blog',
    '/blog/best-muay-thai-camps-thailand-2026',
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
  ]

  const staticRoutes: MetadataRoute.Sitemap = staticPaths.map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: now,
  }))

  let gymRoutes: MetadataRoute.Sitemap = []
  try {
    const supabase = createPublicClient()
    const { data: gyms } = await supabase
      .from('gyms')
      .select('id, updated_at')
      .eq('verification_status', 'verified')

    gymRoutes =
      gyms?.map((g) => ({
        url: `${siteUrl}/gyms/${g.id}`,
        lastModified: g.updated_at ? new Date(g.updated_at) : now,
      })) ?? []
  } catch (err) {
    console.error('sitemap: failed to load gyms', err)
  }

  return [...staticRoutes, ...gymRoutes]
}
