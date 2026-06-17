/**
 * Phase 4 — Europe origin market launch checklist.
 * Pages exist at the paths below with `robots: { index: false }` until you flip them live.
 */
export const EUROPE_ORIGIN_PATHS = [
  '/blog/muay-thai-trip-from-europe',
  '/blog/thailand-training-holiday-europe',
] as const

/** Steps to run when indexing runway clears (do not run during crawl-throttle window). */
export const EUROPE_ORIGIN_LAUNCH_STEPS = [
  'Remove robots: { index: false, follow: false } from both page metadata exports.',
  'Add EUROPE_ORIGIN_PATHS to app/sitemap.ts staticPaths.',
  'Add Europe section to public/llms.txt (mirror USA/UK blocks).',
  'Add europeGuides array + section to app/blog/page.tsx (mirror usaGuides / ukGuides).',
  'Optional: link from app/blog/combat-sports-travel-guide-thailand-2026 alongside USA/UK hubs.',
  'Deploy once; let sitemap.ts propagate — no manual Search Console URL submissions.',
] as const
