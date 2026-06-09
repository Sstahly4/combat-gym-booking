import type { BookingPrefillData } from '@/lib/utils/booking-prefill'

/** Slug or UUID segment from `/gyms/[id]`. */
export function gymSlugOrIdFromPathname(pathname: string): string | null {
  const match = pathname.match(/^\/gyms\/([^/?#]+)/)
  return match?.[1] ?? null
}

export function prefillMatchesGymRoute(
  prefill: BookingPrefillData,
  slugOrId: string
): boolean {
  const gym = prefill.gym as { id?: string; slug?: string | null }
  const route = slugOrId.trim()
  return (
    prefill.gymId === route ||
    gym.id === route ||
    (typeof gym.slug === 'string' && gym.slug.trim() === route)
  )
}
