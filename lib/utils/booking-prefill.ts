import { prefillMatchesGymRoute } from '@/lib/utils/gym-route'
import { clearAllCheckoutReviewNudges } from '@/lib/utils/checkout-review-nudge'

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
  trainingTier?: 'once_daily' | 'twice_daily'
  /** Full gym object as-fetched (Record to avoid circular import) */
  gym: Record<string, unknown>
  /** Full package object as-fetched */
  package_: Record<string, unknown>
  checkin: string
  checkout: string
  guestCount: number
  reviewCount: number
  reviewAverage: number
  /** Step 1 pay timing — full charge now vs Klarna Pay in 4 */
  payTiming?: 'now' | 'klarna'
  writtenAt: number
}

export function writeBookingPrefill(
  data: Omit<BookingPrefillData, 'writtenAt'>
): void {
  try {
    clearAllCheckoutReviewNudges()
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

/** Latest checkout prefill if still within TTL (no gym filter). */
export function readLatestBookingPrefill(): BookingPrefillData | null {
  try {
    const raw = sessionStorage.getItem(PREFILL_KEY)
    if (!raw) return null
    const data: BookingPrefillData = JSON.parse(raw)
    if (Date.now() - data.writtenAt > TTL_MS) return null
    return data
  } catch {
    return null
  }
}

/** Prefill only when it belongs to the gym route being loaded (slug or UUID). */
export function readBookingPrefillForGymRoute(slugOrId: string): BookingPrefillData | null {
  const prefill = readLatestBookingPrefill()
  if (!prefill || !prefillMatchesGymRoute(prefill, slugOrId)) return null
  return prefill
}

/** Drop checkout prefill when it belongs to a different gym listing. */
export function clearBookingPrefillIfForeignGym(gymId: string, slugOrId?: string): void {
  const prefill = readLatestBookingPrefill()
  if (!prefill) return
  const matches =
    prefill.gymId === gymId ||
    (slugOrId != null && prefillMatchesGymRoute(prefill, slugOrId))
  if (!matches) clearBookingPrefill()
}

const PAYMENT_INTENT_PREFIX = 'payment_intent_'

/** Cache Stripe client_secret so step 3 can render Elements without waiting on navigation. */
export function writePaymentIntentCache(bookingId: string, clientSecret: string): void {
  try {
    sessionStorage.setItem(`${PAYMENT_INTENT_PREFIX}${bookingId}`, clientSecret)
  } catch {}
}

export function readPaymentIntentCache(bookingId: string): string | null {
  try {
    return sessionStorage.getItem(`${PAYMENT_INTENT_PREFIX}${bookingId}`)
  } catch {
    return null
  }
}

export function clearPaymentIntentCache(bookingId: string): void {
  try {
    sessionStorage.removeItem(`${PAYMENT_INTENT_PREFIX}${bookingId}`)
  } catch {}
}

/** Read prefill for the current /bookings/summary URL (sync, first paint). */
export function readSummaryPrefillFromUrl(): BookingPrefillData | null {
  if (typeof window === 'undefined') return null
  const sp = new URLSearchParams(window.location.search)
  const gymId = sp.get('gymId')
  const packageId = sp.get('packageId')
  if (!gymId || !packageId) return null
  return readBookingPrefill(gymId, packageId)
}

/**
 * Attach cached gym/package objects so the review modal can render instantly
 * after back-navigation from Your details (no Supabase round-trip).
 */
export function hydrateReviewParams<T extends {
  gymId: string
  packageId: string
  gymData?: Record<string, unknown>
  packageData?: Record<string, unknown>
  initialReviewCount?: number
  initialReviewAverage?: number
  trainingTier?: 'once_daily' | 'twice_daily'
}>(params: T): T {
  if (params.gymData && params.packageData) return params
  const prefill = readBookingPrefill(params.gymId, params.packageId)
  if (!prefill) return params
  return {
    ...params,
    gymData: prefill.gym,
    packageData: prefill.package_,
    initialReviewCount: params.initialReviewCount ?? prefill.reviewCount,
    initialReviewAverage: params.initialReviewAverage ?? prefill.reviewAverage,
    trainingTier: params.trainingTier ?? prefill.trainingTier,
  }
}
