export interface ReviewModalRestoreParams {
  gymId: string
  packageId: string
  variantId?: string
  checkin: string
  checkout: string
  guestCount?: number
}

const HIDE_SITE_CHROME_KEY = 'hide_site_chrome'
export const REVIEW_RESTORE_KEY = 'review_modal_restore'

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
