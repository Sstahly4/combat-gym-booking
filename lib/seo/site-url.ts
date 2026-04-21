export const siteUrl = (
  process.env.NEXT_PUBLIC_APP_URL || 'https://www.combatbooking.com'
).replace(/\/$/, '')

export function absoluteUrl(path: string): string {
  if (!path.startsWith('/')) {
    return `${siteUrl}/${path}`
  }
  return `${siteUrl}${path}`
}
