const DISMISSED_PREFIX = 'checkout_review_nudge_dismissed_'

function dismissedKey(bookingId: string): string {
  return `${DISMISSED_PREFIX}${bookingId}`
}

export function isCheckoutReviewNudgeDismissed(bookingId: string): boolean {
  if (typeof window === 'undefined' || !bookingId) return true
  try {
    return sessionStorage.getItem(dismissedKey(bookingId)) === '1'
  } catch {
    return true
  }
}

export function dismissCheckoutReviewNudge(bookingId: string): void {
  if (typeof window === 'undefined' || !bookingId) return
  try {
    sessionStorage.setItem(dismissedKey(bookingId), '1')
  } catch {}
}

/** Clears cached dismissals so the nudge can show on a fresh checkout flow. */
export function clearAllCheckoutReviewNudges(): void {
  if (typeof window === 'undefined') return
  try {
    const keysToRemove: string[] = []
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i)
      if (key?.startsWith(DISMISSED_PREFIX)) keysToRemove.push(key)
    }
    keysToRemove.forEach((key) => sessionStorage.removeItem(key))
  } catch {}
}
