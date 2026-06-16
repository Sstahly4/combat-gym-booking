'use client'

import { cn } from '@/lib/utils'
import type { PriceBreakdown } from '@/lib/utils'
import { PLATFORM_COMMISSION_RATE } from '@/lib/affiliates/constants'

export function stayReceiptUnits(
  stayUnitCount: number,
  isTraining: boolean
): { count: number; label: string } {
  if (isTraining) {
    return { count: stayUnitCount, label: stayUnitCount === 1 ? 'day' : 'days' }
  }
  return { count: stayUnitCount, label: stayUnitCount === 1 ? 'night' : 'nights' }
}

export type CheckoutReceiptBreakdownProps = {
  breakdown: PriceBreakdown
  stayUnitCount: number
  isTraining: boolean
  formatAmount: (amount: number) => string
  seasonalNote?: string | null
  className?: string
}

/**
 * Apple-style checkout receipt: one clean stay line, optional bundle discount,
 * service fee, and total. Maps directly from PriceBreakdown engine output.
 */
export function CheckoutReceiptBreakdown({
  breakdown,
  stayUnitCount,
  isTraining,
  formatAmount,
  seasonalNote,
  className,
}: CheckoutReceiptBreakdownProps) {
  const { label: stayLabel } = stayReceiptUnits(stayUnitCount, isTraining)
  const staySubtotal = breakdown.price + breakdown.savedVsNightly
  const serviceFee = Number((breakdown.price * PLATFORM_COMMISSION_RATE).toFixed(2))

  return (
    <div
      className={cn(
        'rounded-xl border border-gray-200 bg-white px-5 py-5 shadow-sm',
        className
      )}
    >
      <h2 className="text-base font-semibold text-gray-900 mb-4">Pricing details</h2>

      <div className="space-y-3">
        <div className="flex justify-between items-center gap-4">
          <span className="text-sm text-gray-900">
            {stayUnitCount} {stayLabel}
          </span>
          <span className="text-sm font-medium text-gray-900 tabular-nums text-right">
            {formatAmount(staySubtotal)}
          </span>
        </div>

        <div className="flex justify-between items-center gap-4">
          <span className="text-sm text-gray-600">CombatStay Service Fee</span>
          <span className="text-sm font-medium text-gray-900 tabular-nums text-right">
            {formatAmount(serviceFee)}
          </span>
        </div>

        {breakdown.savedVsNightly > 0 && (
          <div className="flex justify-between items-center text-zinc-600">
            <span className="text-sm">Weekly bundle discount</span>
            <span className="text-sm font-medium text-emerald-600 tabular-nums text-right">
              -{formatAmount(breakdown.savedVsNightly)}
            </span>
          </div>
        )}

        {seasonalNote ? (
          <p className="text-xs leading-relaxed text-zinc-500">{seasonalNote}</p>
        ) : null}
      </div>

      <div className="border-t border-gray-200 mt-4 pt-4 flex justify-between items-baseline gap-4">
        <span className="text-sm font-semibold text-gray-900">Total (incl. taxes)</span>
        <span className="text-base font-semibold text-gray-900 tabular-nums text-right">
          {formatAmount(breakdown.price)}
        </span>
      </div>
    </div>
  )
}
