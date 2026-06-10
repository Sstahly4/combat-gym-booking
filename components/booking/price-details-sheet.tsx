'use client'

import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import type { PriceLine } from '@/lib/utils'
import { formatCheckoutPriceWithCode } from '@/components/booking/checkout-ui'

function lineUnitLabel(line: PriceLine): string {
  if (line.label.toLowerCase().includes('session')) {
    return line.qty === 1 ? 'session' : 'sessions'
  }
  if (line.kind === 'month') return line.qty === 1 ? 'month' : 'months'
  if (line.kind === 'week') return line.qty === 1 ? 'week' : 'weeks'
  return line.qty === 1 ? 'night' : 'nights'
}

export function formatBreakdownDateRange(from: string, to: string): string {
  const a = new Date(from + 'T00:00:00')
  const b = new Date(to + 'T00:00:00')
  const sameMonth = a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()
  if (sameMonth) {
    const month = a.toLocaleDateString('en-GB', { month: 'long' })
    return `${a.getDate()}–${b.getDate()} ${month}`
  }
  return `${a.getDate()} ${a.toLocaleDateString('en-GB', { month: 'short' })} – ${b.getDate()} ${b.toLocaleDateString('en-GB', { month: 'short' })}`
}

function stayUnitLabel(count: number, isTraining: boolean): string {
  if (isTraining) return count === 1 ? 'day' : 'days'
  return count === 1 ? 'night' : 'nights'
}

export function buildPriceBreakdownSummaryLabel({
  checkin,
  checkout,
  pricingDuration,
  isTraining,
}: {
  checkin: string
  checkout: string
  pricingDuration: number
  isTraining: boolean
}): string {
  if (checkin && checkout && pricingDuration > 0) {
    return `${pricingDuration} ${stayUnitLabel(pricingDuration, isTraining)} · ${formatBreakdownDateRange(checkin, checkout)}`
  }
  return `${pricingDuration} ${stayUnitLabel(pricingDuration, isTraining)}`
}

export function PriceBreakdownSheet({
  summaryLabel,
  savedVsNightly,
  total,
  gymCurrency,
  displayCurrency,
  convertPrice,
  onClose,
}: {
  summaryLabel: string
  savedVsNightly: number
  total: number
  gymCurrency: string
  displayCurrency: string
  convertPrice: (amount: number, fromCurrency: string) => number
  onClose: () => void
}) {
  const formatDisplay = (amount: number) =>
    formatCheckoutPriceWithCode(convertPrice(amount, gymCurrency), displayCurrency)

  const preDiscountTotal = total + savedVsNightly
  const rootRef = useRef<HTMLDivElement>(null)
  const sheetRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const preventBackdropScroll: EventListener = (e) => {
      if (sheetRef.current?.contains(e.target as Node)) return
      e.preventDefault()
    }
    root.addEventListener('touchmove', preventBackdropScroll, { passive: false })
    return () => root.removeEventListener('touchmove', preventBackdropScroll)
  }, [])

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-[310] overscroll-none"
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/50 z-[311] touch-none"
        onClick={onClose}
      />
      <div
        ref={sheetRef}
        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-[312] flex flex-col max-h-[85dvh] overscroll-contain"
        style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
      >
        <div className="relative flex items-center justify-center px-6 pt-6 pb-5 flex-shrink-0">
          <h3 className="text-base font-semibold text-gray-900">Price breakdown</h3>
          <button
            onClick={onClose}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Close price breakdown"
          >
            <X className="w-4 h-4 text-gray-800" />
          </button>
        </div>

        <div className="px-6 pb-2 flex-1 overflow-y-auto">
          <div className="space-y-5">
            <div className="flex items-start justify-between gap-6">
              <span className="text-[15px] leading-snug text-gray-900">{summaryLabel}</span>
              <span className="text-[15px] leading-snug text-gray-900 shrink-0 text-right">
                {formatDisplay(preDiscountTotal)}
              </span>
            </div>

            {savedVsNightly > 0 && (
              <div>
                <div className="flex items-start justify-between gap-6">
                  <span className="text-[15px] leading-snug text-emerald-700">Special offer</span>
                  <span className="text-[15px] leading-snug text-emerald-700 shrink-0 text-right">
                    -{formatDisplay(savedVsNightly)}
                  </span>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-gray-500 pr-6">
                  Bundle pricing applied for your selected dates. Weekly and monthly rates can
                  reduce your total compared with paying the nightly rate.
                </p>
              </div>
            )}
          </div>

          <div className="border-t border-gray-200 mt-6 pt-5 flex items-baseline justify-between gap-6">
            <span className="text-[15px] font-semibold text-gray-900">
              Total <span className="font-semibold underline">{displayCurrency}</span>
            </span>
            <span className="text-[15px] font-semibold text-gray-900 shrink-0 text-right">
              {formatDisplay(total)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export function PriceDetailsSheet({
  lines,
  savedVsNightly,
  total,
  gymCurrency,
  displayCurrency,
  convertPrice,
  checkin,
  checkout,
  pricingDuration,
  isTraining,
  onClose,
}: {
  lines: PriceLine[]
  savedVsNightly: number
  total: number
  gymCurrency: string
  displayCurrency: string
  convertPrice: (amount: number, fromCurrency: string) => number
  checkin: string
  checkout: string
  pricingDuration: number
  isTraining: boolean
  onClose: () => void
}) {
  const [breakdownOpen, setBreakdownOpen] = useState(false)

  const formatDisplay = (amount: number) =>
    formatCheckoutPriceWithCode(convertPrice(amount, gymCurrency), displayCurrency)

  const breakdownSummaryLabel = buildPriceBreakdownSummaryLabel({
    checkin,
    checkout,
    pricingDuration,
    isTraining,
  })

  const rootRef = useRef<HTMLDivElement>(null)
  const sheetRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const preventBackdropScroll: EventListener = (e) => {
      if (sheetRef.current?.contains(e.target as Node)) return
      e.preventDefault()
    }
    root.addEventListener('touchmove', preventBackdropScroll, { passive: false })
    return () => root.removeEventListener('touchmove', preventBackdropScroll)
  }, [])

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-[300] overscroll-none"
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/50 z-[301] touch-none"
        onClick={() => {
          if (!breakdownOpen) onClose()
        }}
      />
      <div
        ref={sheetRef}
        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-[302] flex flex-col max-h-[85dvh] overscroll-contain"
        style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
      >
        <div className="relative flex items-center justify-center px-6 pt-6 pb-5 flex-shrink-0">
          <h3 className="text-base font-semibold text-gray-900">Price details</h3>
          <button
            onClick={onClose}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4 text-gray-800" />
          </button>
        </div>

        <div className="px-6 pb-2 flex-1 overflow-y-auto">
          <div className="space-y-5">
            {lines.map((line, i) => (
              <div key={i} className="flex items-start justify-between gap-6">
                <span className="text-[15px] leading-snug text-gray-900">
                  {line.qty} {lineUnitLabel(line)} x {formatDisplay(line.unitPrice)}
                </span>
                <span className="text-[15px] leading-snug text-gray-900 shrink-0 text-right">
                  {formatDisplay(line.subtotal)}
                </span>
              </div>
            ))}
            {savedVsNightly > 0 && (
              <div className="flex items-start justify-between gap-6">
                <span className="text-[15px] leading-snug text-emerald-700">Special offer</span>
                <span className="text-[15px] leading-snug text-emerald-700 shrink-0 text-right">
                  -{formatDisplay(savedVsNightly)}
                </span>
              </div>
            )}
          </div>

          <div className="border-t border-gray-200 mt-6 pt-5 flex items-baseline justify-between gap-6">
            <span className="text-[15px] font-semibold text-gray-900">
              Total <span className="font-semibold underline">{displayCurrency}</span>
            </span>
            <span className="text-[15px] font-semibold text-gray-900 shrink-0 text-right">
              {formatDisplay(total)}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setBreakdownOpen(true)}
            className="mt-4 text-[15px] text-gray-900 underline text-left hover:text-gray-700 transition-colors"
          >
            Price breakdown
          </button>
        </div>
      </div>

      {breakdownOpen && (
        <PriceBreakdownSheet
          summaryLabel={breakdownSummaryLabel}
          savedVsNightly={savedVsNightly}
          total={total}
          gymCurrency={gymCurrency}
          displayCurrency={displayCurrency}
          convertPrice={convertPrice}
          onClose={() => setBreakdownOpen(false)}
        />
      )}
    </div>
  )
}
