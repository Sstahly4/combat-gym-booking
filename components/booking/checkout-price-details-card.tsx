'use client'

import { ChevronRight } from 'lucide-react'
import { formatCheckoutAmountOnly, formatCheckoutPriceWithCode } from '@/components/booking/checkout-ui'
import type { PriceLine } from '@/lib/utils'

function lineUnitLabel(line: PriceLine): string {
  if (line.label.toLowerCase().includes('session')) {
    return line.qty === 1 ? 'session' : 'sessions'
  }
  if (line.kind === 'month') return line.qty === 1 ? 'month' : 'months'
  if (line.kind === 'week') return line.qty === 1 ? 'week' : 'weeks'
  return line.qty === 1 ? 'night' : 'nights'
}

export function CheckoutPriceDetailsRow({
  total,
  gymCurrency,
  displayCurrency,
  convertPrice,
  onOpen,
}: {
  total: number
  gymCurrency: string
  displayCurrency: string
  convertPrice: (amount: number, fromCurrency: string) => number
  onOpen: () => void
}) {
  const displayTotal = convertPrice(total, gymCurrency)

  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full border border-gray-200 rounded-xl px-4 py-4 text-left flex items-center justify-between gap-4 transition-colors hover:bg-gray-50 active:bg-gray-100"
    >
      <div className="min-w-0">
        <div className="text-sm font-semibold text-gray-900 mb-2">Price details</div>
        <div className="text-sm text-gray-600">
          {formatCheckoutAmountOnly(displayTotal, displayCurrency)} {displayCurrency} total · Line items and breakdown
        </div>
      </div>
      <ChevronRight className="w-5 h-5 text-gray-900 shrink-0" />
    </button>
  )
}

export function CheckoutPriceDetailsCard({
  lines,
  savedVsNightly,
  total,
  gymCurrency,
  displayCurrency,
  convertPrice,
  onCurrencyClick,
  onPriceBreakdownClick,
}: {
  lines: PriceLine[]
  savedVsNightly: number
  total: number
  gymCurrency: string
  displayCurrency: string
  convertPrice: (amount: number, fromCurrency: string) => number
  onCurrencyClick: () => void
  onPriceBreakdownClick: () => void
}) {
  const formatDisplay = (amount: number) =>
    formatCheckoutPriceWithCode(convertPrice(amount, gymCurrency), displayCurrency)

  return (
    <div className="border border-gray-200 rounded-xl px-4 py-4">
      <h2 className="text-sm font-semibold text-gray-900 mb-4">Price details</h2>
      <div className="space-y-3 text-sm">
        {lines.map((line, i) => (
          <div key={i} className="flex items-start justify-between gap-4">
            <span className="text-gray-900 leading-snug">
              {line.qty} {lineUnitLabel(line)} x {formatDisplay(line.unitPrice)}
            </span>
            <span className="text-gray-900 shrink-0 text-right">{formatDisplay(line.subtotal)}</span>
          </div>
        ))}
        {savedVsNightly > 0 && (
          <div className="flex items-start justify-between gap-4">
            <span className="text-emerald-700 leading-snug">Special offer</span>
            <span className="text-emerald-700 shrink-0 text-right">-{formatDisplay(savedVsNightly)}</span>
          </div>
        )}
      </div>
      <div className="border-t border-gray-200 mt-4 pt-4 flex items-baseline justify-between gap-4">
        <span className="text-sm font-semibold text-gray-900 inline-flex items-baseline gap-1">
          Total{' '}
          <button
            type="button"
            onClick={onCurrencyClick}
            className="font-semibold text-gray-900 underline hover:text-gray-700 transition-colors"
            aria-label={`Change currency, currently ${displayCurrency}`}
          >
            {displayCurrency}
          </button>
        </span>
        <span className="text-sm font-semibold text-gray-900 shrink-0 text-right">
          {formatDisplay(total)}
        </span>
      </div>
      <button
        type="button"
        onClick={onPriceBreakdownClick}
        className="mt-4 text-sm text-gray-900 underline text-left hover:text-gray-700 transition-colors"
      >
        Price breakdown
      </button>
    </div>
  )
}
