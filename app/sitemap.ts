import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://combatbooking.com'
  const now = new Date()

  const routes = [
    '/',
    '/search',
    '/blog',
    '/blog/best-muay-thai-camps-thailand-2026',
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

  return routes.map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: now,
  }))
}

