/** @type {import('next').NextConfig} */
const LEGACY_BRAND_HOSTS = ['combatbooking.com', 'www.combatbooking.com']

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'static.wixstatic.com',
      },
      {
        protocol: 'https',
        hostname: 'southeastasiabackpacker.com',
      },
      {
        protocol: 'https',
        hostname: 'www.southeastasiabackpacker.com',
      },
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
      },
      {
        protocol: 'https',
        hostname: 'commons.wikimedia.org',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 86400,
  },
  // Enable compression
  compress: true,
  // Optimize production builds
  swcMinify: true,
  // Enable React strict mode for better performance
  reactStrictMode: true,
  /**
   * 301 every path on legacy domains → canonical app URL (Search Console “Change of address”,
   * link equity, bookmarks). Only applies when those hostnames still route to this deployment
   * (e.g. Vercel domain alias). If the old domain is parked elsewhere, configure redirects there.
   */
  async redirects() {
    const base = (process.env.NEXT_PUBLIC_APP_URL || 'https://www.combatstay.com').replace(
      /\/$/,
      '',
    )
    return LEGACY_BRAND_HOSTS.map((host) => ({
      source: '/:path*',
      has: [{ type: 'host', value: host }],
      destination: `${base}/:path*`,
      permanent: true,
    }))
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self), interest-cohort=()',
          },
        ],
      },
    ]
  },
};

module.exports = nextConfig;
