/** Tab-title suffixes so users can see which secure area they are in. */
export const SITE_HUB_SUFFIX = {
  admin: 'Combatbooking Admin Hub',
  partner: 'Combatbooking Partner Hub',
  member: 'Combatbooking Member Hub',
} as const

export type SiteHubKey = keyof typeof SITE_HUB_SUFFIX

export function formatHubDocumentTitle(specific: string, hub: SiteHubKey): string {
  return `${specific} | ${SITE_HUB_SUFFIX[hub]}`
}

/** Traveler account / booking flow titles (OTA-style: specific action first, then hub). */
export function memberHubPageTitle(specific: string): string {
  return formatHubDocumentTitle(specific, 'member')
}
