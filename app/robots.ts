import type { MetadataRoute } from 'next'
import { canonicalSiteUrl } from '@/lib/brand'

const siteUrl = canonicalSiteUrl()

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
