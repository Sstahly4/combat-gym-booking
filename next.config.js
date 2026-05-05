/** @type {import('next').NextConfig} */
/**
 * Optional 301 sources for a previous hostname (comma-separated, no scheme).
 * Configure via `LEGACY_REDIRECT_HOSTS` in the deployment environment if needed;
 * do not commit previous brand domains in source.
 */
const LEGACY_REDIRECT_HOSTS = (process.env.LEGACY_REDIRECT_HOSTS || '')
  .split(',')
  .map((h) => h.trim().toLowerCase())
  .filter(Boolean)

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
   * 301 every path on configured legacy hostnames → canonical app URL (Search Console,
   * link equity, bookmarks). Only applies when those hostnames still route to this deployment
   * (e.g. Vercel domain alias). Set `LEGACY_REDIRECT_HOSTS` if you still serve traffic on a
   * retired hostname.
   */
  async redirects() {
    const base = (process.env.NEXT_PUBLIC_APP_URL || 'https://www.combatstay.com').replace(
      /\/$/,
      '',
    )
    return LEGACY_REDIRECT_HOSTS.map((host) => ({
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
