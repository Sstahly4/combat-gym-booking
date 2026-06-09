/**
 * Booking prefill cache — written when the user taps Continue on the review
 * modal. Steps 2 and 3 read this to render real content immediately under the
 * overlay instead of an empty page, giving the Airbnb-style "content is already
 * there, just confirming" feel.
 *
 * Key is intentionally singular (not per-gym) because a user can only be in one
 * active booking flow at a time. gymId + packageId are validated on read so
 * stale data from a previous flow is ignored.
 */

const PREFILL_KEY = 'booking_prefill'
const TTL_MS = 30 * 60 * 1000 // 30 minutes

export interface BookingPrefillData {
  gymId: string
  packageId: string
  variantId?: string
  /** Full gym object as-fetched (Record to avoid circular import) */
  gym: Record<string, unknown>
  /** Full package object as-fetched */
  package_: Record<string, unknown>
  checkin: string
  checkout: string
  guestCount: number
  reviewCount: number
  reviewAverage: number
  writtenAt: number
}

export function writeBookingPrefill(
  data: Omit<BookingPrefillData, 'writtenAt'>
): void {
  try {
    const payload: BookingPrefillData = { ...data, writtenAt: Date.now() }
    sessionStorage.setItem(PREFILL_KEY, JSON.stringify(payload))
  } catch {}
}

/**
 * Returns the cached prefill if it exists, belongs to the requested
 * gymId + packageId, and was written within the TTL. Returns null otherwise.
 */
export function readBookingPrefill(
  gymId: string,
  packageId: string
): BookingPrefillData | null {
  try {
    const raw = sessionStorage.getItem(PREFILL_KEY)
    if (!raw) return null
    const data: BookingPrefillData = JSON.parse(raw)
    if (data.gymId !== gymId || data.packageId !== packageId) return null
    if (Date.now() - data.writtenAt > TTL_MS) return null
    return data
  } catch {
    return null
  }
}

export function clearBookingPrefill(): void {
  try {
    sessionStorage.removeItem(PREFILL_KEY)
  } catch {}
}
