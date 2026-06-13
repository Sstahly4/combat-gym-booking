import { PLATFORM_COMMISSION_RATE } from '@/lib/affiliates/constants'

/** CombatStay platform fee from booking total (15% default). */
export function combatstayCommission(totalPrice: number): number {
  return Number((Number(totalPrice) * PLATFORM_COMMISSION_RATE).toFixed(2))
}

/** Affiliate cut = commission_rate × platform fee. */
export function affiliatePayoutAud(totalPrice: number, commissionRate: number): number {
  const platformFee = combatstayCommission(totalPrice)
  return Number((platformFee * commissionRate).toFixed(2))
}
