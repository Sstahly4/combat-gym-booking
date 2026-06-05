/** Canonical public gym profile path — prefers SEO slug, falls back to UUID. */
export function gymCanonicalPath(gym: { id: string; slug?: string | null }): string {
  const slug = gym.slug?.trim()
  return `/gyms/${slug || gym.id}`
}
