/**
 * Homepage sport carousel: pre-generated `/public/homepage-sports/*-{400|800}.webp`.
 * Regenerate after changing sources: `pnpm run generate:homepage-sports`
 * (script: `scripts/generate-homepage-sport-variants.mjs`). Same idea as gym-image variants:
 * `<img srcSet>` + `sizes`, no Vercel Image Optimization quota.
 */

export type HomepageSportTileVariants = {
  w400: string
  w800: string
  /** Original public asset — `img.src` fallback for browsers without srcSet support. */
  fallbackSrc: string
}

/** Slugs align with scripts/generate-homepage-sport-variants.mjs */
const BASE = '/homepage-sports'

const MUAY_THAI: HomepageSportTileVariants = {
  w400: `${BASE}/muay-thai-400.webp`,
  w800: `${BASE}/muay-thai-800.webp`,
  fallbackSrc: '/N-8427.jpeg.avif',
}
const BOXING: HomepageSportTileVariants = {
  w400: `${BASE}/boxing-400.webp`,
  w800: `${BASE}/boxing-800.webp`,
  fallbackSrc: '/e079bedfbf7e870f827b4fda7ce2132f.avif',
}
const MMA: HomepageSportTileVariants = {
  w400: `${BASE}/mma-400.webp`,
  w800: `${BASE}/mma-800.webp`,
  fallbackSrc: '/1296749132.jpg',
}
const BJJ: HomepageSportTileVariants = {
  w400: `${BASE}/bjj-400.webp`,
  w800: `${BASE}/bjj-800.webp`,
  fallbackSrc: '/IMG_3557_246c0a62-a253-4f95-abfd-9cb306228c6c.jpg',
}
const WRESTLING: HomepageSportTileVariants = {
  w400: `${BASE}/wrestling-400.webp`,
  w800: `${BASE}/wrestling-800.webp`,
  fallbackSrc: '/tjj8r5ovjts8nhqjhkqc.avif',
}
const KICKBOXING: HomepageSportTileVariants = {
  w400: `${BASE}/kickboxing-400.webp`,
  w800: `${BASE}/kickboxing-800.webp`,
  fallbackSrc: '/Superbon-Singha-Mawynn-Chingiz-Allazov-ONE-Fight-Night-6-1920X1280-62.jpg',
}

const BY_DISCIPLINE: Record<string, HomepageSportTileVariants> = {
  'Muay Thai': MUAY_THAI,
  Boxing: BOXING,
  MMA,
  BJJ,
  Wrestling: WRESTLING,
  Kickboxing: KICKBOXING,
}

export function homepageSportTileVariants(discipline: string): HomepageSportTileVariants {
  const v = BY_DISCIPLINE[discipline]
  return v ?? MUAY_THAI
}

/** `sizes` tuned to carousel tiles: ~50vw mobile (2-up), ~25vw desktop (4-up). */
export const HOMEPAGE_SPORT_TILE_IMG_SIZES =
  '(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 288px'

export function homepageSportTileSrcSet(variants: HomepageSportTileVariants): string {
  return `${variants.w400} 400w, ${variants.w800} 800w`
}
