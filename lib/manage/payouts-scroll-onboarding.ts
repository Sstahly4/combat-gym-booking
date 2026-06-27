/** One-time scroll to onboarding after the owner taps Start / Continue payout setup. */
export const PAYOUTS_SCROLL_ONBOARDING_KEY = 'cs:payouts-scroll-onboarding'

export function markPayoutsScrollOnboarding(): void {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(PAYOUTS_SCROLL_ONBOARDING_KEY, '1')
}

export function consumePayoutsScrollOnboarding(): boolean {
  if (typeof window === 'undefined') return false
  if (sessionStorage.getItem(PAYOUTS_SCROLL_ONBOARDING_KEY) !== '1') return false
  sessionStorage.removeItem(PAYOUTS_SCROLL_ONBOARDING_KEY)
  return true
}
