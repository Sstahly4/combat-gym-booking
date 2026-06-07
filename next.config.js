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
    // 'unsafe-eval' is intentionally absent — Next.js production builds don't
    // need it and including it would defeat most of the CSP.
    // style-src retains 'unsafe-inline' — unavoidable with Tailwind utility
    // classes and Radix component styles without migrating to CSS modules.
    const csp = [
      "default-src 'self'",
      // next/script chunks (self), Stripe payment JS, Stripe Connect embedded
      // components, Vercel Analytics/Speed Insights (served via /_vercel/ on
      // Vercel, i.e. self — va.vercel-scripts.com is the CDN fallback in dev).
      // Note: the JSON-LD <Script> in layout.tsx uses type="application/ld+json"
      // which the HTML spec classifies as a data block, not executable JS —
      // browsers exempt it from script-src, so no 'unsafe-inline' needed here.
      "script-src 'self' https://js.stripe.com https://connect-js.stripe.com https://va.vercel-scripts.com",
      // Stripe Elements iframe, Stripe Connect iframe, Google Maps embed iframe.
      "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://www.google.com",
      // Supabase REST/Auth/Storage/Realtime, Stripe API, Vercel vitals beacon.
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://ppm.stripe.com https://vitals.vercel-insights.com",
      // next/image optimised URLs (self + blob), Supabase Storage, all five
      // remotePatterns from next.config.js images section, Google Maps tiles.
      "img-src 'self' data: blob: https://*.supabase.co https://images.unsplash.com https://static.wixstatic.com https://southeastasiabackpacker.com https://www.southeastasiabackpacker.com https://upload.wikimedia.org https://commons.wikimedia.org https://maps.googleapis.com https://maps.gstatic.com",
      // Tailwind and Radix component inline styles.
      "style-src 'self' 'unsafe-inline'",
      // next/font/google downloads Inter at build time and self-hosts it —
      // no runtime call to fonts.googleapis.com needed.
      "font-src 'self' data:",
      "worker-src 'none'",
    ].join('; ')

    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: csp,
          },
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
