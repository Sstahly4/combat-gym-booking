import type { BookingPrefillData } from '@/lib/utils/booking-prefill'

export function looksLikeUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  )
}

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
