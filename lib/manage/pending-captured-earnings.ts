/**
 * Computes the total gym-net earnings from payment-captured bookings where
 * the gym has not yet completed Stripe Connect verification.
 *
 * "Pending" here means funds are tracked on the platform but cannot be paid
 * out until stripe_connect_verified becomes true. Copy must reflect this —
 * the amount is NOT already in the gym's Stripe balance.
 */

export type PendingEarningsBooking = {
  gym_id: string
  status: string
  total_price: number | null
  platform_fee: number | null
  payment_captured_at: string | null
}

/**
 * Returns the sum of (total_price - platform_fee) for all bookings that are
 * payment-captured for the given gym. Only includes rows where
 * payment_captured_at is non-null (i.e. the charge has actually settled).
 */
export function computePendingCapturedEarnings(
  bookings: PendingEarningsBooking[],
  gymId: string,
): number {
  return bookings
    .filter(
      (b) =>
        b.gym_id === gymId &&
        (b.status === 'paid' || b.status === 'completed' || b.status === 'confirmed') &&
        b.payment_captured_at != null,
    )
    .reduce((sum, b) => {
      const total = Number(b.total_price) || 0
      const fee = Number(b.platform_fee) || 0
      return sum + Math.max(0, total - fee)
    }, 0)
}
