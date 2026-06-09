import { clearBookingPrefillIfForeignGym } from '@/lib/utils/booking-prefill'
import { clearGuestDetailsIfForeignGym } from '@/lib/utils/checkout-details-prefill'

export interface ReviewModalRestoreParams {
  gymId: string
  packageId: string
  variantId?: string
  checkin: string
  checkout: string
  guestCount?: number
}

const HIDE_SITE_CHROME_KEY = 'hide_site_chrome'
const CHECKOUT_EXIT_GYM_KEY = 'checkout_exit_gym'
export const REVIEW_RESTORE_KEY = 'review_modal_restore'
const EXIT_TTL_MS = 30 * 60 * 1000

export interface CheckoutExitTarget {
  slugOrId: string
  gymId: string
  writtenAt: number
}

/** Set while navigating from checkout back to a specific gym listing (instant shell). */
export function setCheckoutExitToGym(slugOrId: string, gymId: string): void {
  try {
    const payload: CheckoutExitTarget = {
      slugOrId: slugOrId.trim(),
      gymId,
      writtenAt: Date.now(),
    }
    sessionStorage.setItem(CHECKOUT_EXIT_GYM_KEY, JSON.stringify(payload))
  } catch {}
}

export function readCheckoutExitTarget(): CheckoutExitTarget | null {
  try {
    const raw = sessionStorage.getItem(CHECKOUT_EXIT_GYM_KEY)
    if (!raw) return null
    const data: CheckoutExitTarget = JSON.parse(raw)
    if (Date.now() - data.writtenAt > EXIT_TTL_MS) return null
    return data
  } catch {
    return null
  }
}

export function clearCheckoutExitToGym(): void {
  try {
    sessionStorage.removeItem(CHECKOUT_EXIT_GYM_KEY)
  } catch {}
}

/** True only when exiting checkout to this exact gym route (slug or UUID). */
export function isCheckoutExitToGym(slugOrId: string): boolean {
  if (typeof window === 'undefined') return false
  const target = readCheckoutExitTarget()
  if (!target) return false
  const route = slugOrId.trim()
  return target.slugOrId === route || target.gymId === route
}

export function clearReviewModalRestoreIfForeignGym(gymId: string): void {
  const stored = readReviewModalRestore()
  if (stored && stored.gymId !== gymId) clearReviewModalRestore()
}

/** Remove checkout session keys that belong to another gym listing. */
export function purgeStaleCheckoutSessionForGym(gymId: string, slugOrId?: string): void {
  clearBookingPrefillIfForeignGym(gymId, slugOrId)
  clearGuestDetailsIfForeignGym(gymId)
  clearReviewModalRestoreIfForeignGym(gymId)
  const exit = readCheckoutExitTarget()
  if (!exit) return
  const route = slugOrId?.trim()
  const matches = exit.gymId === gymId || (route != null && exit.slugOrId === route)
  if (!matches) clearCheckoutExitToGym()
}

/** Hide global navbar/footer while the review checkout modal is active. */
export function setReviewCheckoutChromeHidden(): void {
  try {
    sessionStorage.setItem(HIDE_SITE_CHROME_KEY, 'review')
  } catch {}
}

export function clearReviewCheckoutChromeHidden(): void {
  try {
    sessionStorage.removeItem(HIDE_SITE_CHROME_KEY)
  } catch {}
}

export function isReviewCheckoutChromeHidden(): boolean {
  if (typeof window === 'undefined') return false
  try {
    if (sessionStorage.getItem(HIDE_SITE_CHROME_KEY) === 'review') return true
    const path = window.location.pathname
    if (!path.startsWith('/gyms/')) return false
    const sp = new URLSearchParams(window.location.search)
    return sp.get('review') === '1' && !!sp.get('pkg')
  } catch {
    return false
  }
}

export function writeReviewModalRestore(params: ReviewModalRestoreParams): void {
  try {
    sessionStorage.setItem(REVIEW_RESTORE_KEY, JSON.stringify(params))
  } catch {}
}

export function readReviewModalRestore(): ReviewModalRestoreParams | null {
  try {
    const raw = sessionStorage.getItem(REVIEW_RESTORE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function clearReviewModalRestore(): void {
  try {
    sessionStorage.removeItem(REVIEW_RESTORE_KEY)
  } catch {}
}
