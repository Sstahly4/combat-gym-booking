import type { Gym } from '@/lib/types/database'

/** Matches `getGymReadiness` payout gate for Wise vs Stripe Connect. */
export function isGymPayoutComplete(
  gym: Pick<Gym, 'payout_rail' | 'stripe_connect_verified' | 'wise_payout_ready' | 'wise_recipient_id' | 'wise_recipient_currency'>,
): boolean {
  const rail = gym.payout_rail === 'stripe_connect' ? 'stripe_connect' : 'wise'
  if (rail === 'stripe_connect') return Boolean(gym.stripe_connect_verified)
  return Boolean(
    gym.wise_payout_ready &&
      gym.wise_recipient_id &&
      gym.wise_recipient_currency &&
      String(gym.wise_recipient_currency).trim().length > 0,
  )
}
