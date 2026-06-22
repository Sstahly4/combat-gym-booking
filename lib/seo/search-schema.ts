import { absoluteUrl } from '@/lib/seo/site-url'
import { gymCanonicalPath } from '@/lib/seo/gym-canonical-path'
import type { SearchListingGym } from '@/lib/search/search-server-listings'

export function buildSearchItemListLd(
  name: string,
  gyms: SearchListingGym[],
): Record<string, unknown> | null {
  if (gyms.length === 0) return null

  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    numberOfItems: gyms.length,
    itemListElement: gyms.slice(0, 24).map((gym, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: absoluteUrl(gymCanonicalPath(gym)),
      name: gym.name,
    })),
  }
}
