/**
 * Single source of truth for brand and canonical host.
 *
 * Keep this minimal and dependency-free so it can be imported from metadata,
 * SEO helpers, and server routes without causing bundling surprises.
 */

export const BRAND_NAME = 'CombatStay'
export const BRAND_DOMAIN = 'combatstay.com'
export const BRAND_HOST = 'https://www.combatstay.com'

export function canonicalSiteUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || BRAND_HOST).replace(/\/$/, '')
}

