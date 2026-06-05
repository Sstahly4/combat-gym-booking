import type { Gym } from '@/lib/types/database'

/** Returns true when the gym has completed Stripe Connect onboarding. */
export function isGymPayoutComplete(
  gym: Pick<Gym, 'stripe_connect_verified'>,
): boolean {
  return Boolean(gym.stripe_connect_verified)
}
