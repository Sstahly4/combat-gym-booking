import { canonicalSiteUrl } from '@/lib/brand'

export const siteUrl = canonicalSiteUrl()

export function absoluteUrl(path: string): string {
  if (!path.startsWith('/')) {
    return `${siteUrl}/${path}`
  }
  return `${siteUrl}${path}`
}
