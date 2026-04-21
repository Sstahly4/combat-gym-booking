import type { MetadataRoute } from 'next'

const siteUrl = (
  process.env.NEXT_PUBLIC_APP_URL || 'https://www.combatbooking.com'
).replace(/\/$/, '')

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/manage',
          '/admin',
          '/dashboard',
          '/bookings',
          '/auth',
          '/claim',
          '/api',
          '/samples',
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  }
}
