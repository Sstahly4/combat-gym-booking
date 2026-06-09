'use client'

import type { ReactNode } from 'react'
import { Star, X, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LoadingOverlay } from '@/components/loading-overlay'
import { useCurrency } from '@/lib/contexts/currency-context'
import { calculatePackagePrice } from '@/lib/utils'
import { hydrateReviewParams } from '@/lib/utils/booking-prefill'
import type { ReviewModalParams } from '@/lib/contexts/review-modal-context'
import type { Gym, Package } from '@/lib/types/database'

function StepProgressBar({ step }: { step: 1 | 2 | 3 }) {
  return (
    <div className="flex gap-1.5 px-5 pb-1">
      {([1, 2, 3] as const).map((s) => (
        <div
          key={s}
          className="h-1 flex-1 rounded-full transition-colors"
          style={{ backgroundColor: s <= step ? '#003580' : '#e5e7eb' }}
        />
      ))}
    </div>
  )
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  AUD: 'A$',
  THB: '฿',
  IDR: 'Rp',
  JPY: '¥',
  CNY: '¥',
  SGD: 'S$',
  MYR: 'RM',
  NZD: 'NZ$',
  CAD: 'C$',
  HKD: 'HK$',
  INR: '₹',
  KRW: '₩',
  PHP: '₱',
  VND: '₫',
}

function formatAmountOnly(amount: number, currency: string): string {
  const formatted = amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  const symbol = CURRENCY_SYMBOLS[currency] ?? ''
  return symbol ? `${symbol}${formatted}` : formatted
}

function formatPriceWithCode(amount: number, currency: string): string {
  const formatted = amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  const symbol = CURRENCY_SYMBOLS[currency] ?? ''
  return symbol ? `${symbol}${formatted} ${currency}` : `${currency} ${formatted}`
}

function formatDateRange(from: string, to: string) {
  if (!from || !to) return 'No dates selected'
  const a = new Date(from + 'T00:00:00')
  const b = new Date(to + 'T00:00:00')
  const sameMonth = a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()
  if (sameMonth) {
    const month = a.toLocaleDateString('en-GB', { month: 'long' })
    return `${a.getDate()}–${b.getDate()} ${month} ${a.getFullYear()}`
  }
  return `${a.getDate()} ${a.toLocaleDateString('en-GB', { month: 'short' })} – ${b.getDate()} ${b.toLocaleDateString('en-GB', { month: 'short' })} ${b.getFullYear()}`
}

function SummaryRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-start justify-between py-4">
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-gray-900 mb-0.5">{label}</div>
        <div className="text-sm text-gray-700">{value}</div>
      </div>
    </div>
  )
}

/**
 * Instant paint of the review step while the full modal chunk loads.
 * Uses booking_prefill so back-nav from Your details shows real content, not a blank page.
 */
export function ReviewModalShell({ params }: { params: ReviewModalParams }) {
  const { convertPrice, selectedCurrency } = useCurrency()
  const hydrated = hydrateReviewParams(params)
  const gym = hydrated.gymData as (Gym & { images?: { url: string }[] }) | undefined
  const package_ = hydrated.packageData as Package | undefined
  const checkin = hydrated.checkin
  const checkout = hydrated.checkout
  const guestCount = hydrated.guestCount ?? 1
  const reviewCount = hydrated.initialReviewCount ?? 0
  const averageRating = hydrated.initialReviewAverage ?? 0

  const duration =
    checkin && checkout
      ? Math.floor(
          (new Date(checkout).getTime() - new Date(checkin).getTime()) / (1000 * 60 * 60 * 24)
        )
      : 0
  const isTraining = package_?.type === 'training'
  const pricingDuration = isTraining ? Math.max(1, duration + 1) : duration
  const priceInfo =
    package_ && pricingDuration > 0
      ? calculatePackagePrice(pricingDuration, package_.type, {
          daily: package_.price_per_day,
          weekly: package_.price_per_week,
          monthly: package_.price_per_month,
        })
      : null
  const totalPrice = priceInfo ? convertPrice(priceInfo.price, gym?.currency ?? 'USD') : null
  const mainImage = gym?.images && gym.images.length > 0 ? gym.images[0].url : null

  return (
    <div className="fixed inset-0 z-[200] bg-white flex flex-col overflow-hidden">
      <LoadingOverlay show={true} zClass="z-[220]" />

      <div className="flex-1 overflow-y-auto pb-36">
        <div className="flex items-center justify-end px-5 pt-4 pb-2">
          <div className="w-8 h-8 flex items-center justify-center rounded-full">
            <X className="w-4 h-4 text-gray-700" />
          </div>
        </div>
        <div className="px-4 pt-2">
        <h1 className="text-3xl font-bold text-gray-900 mb-5">Review and continue</h1>

        <div className="border border-gray-200 rounded-xl overflow-hidden mb-4">
          <div className="px-4 pt-4 pb-3 border-b border-gray-100">
            <div className="flex gap-3 items-start">
              {mainImage ? (
                <img src={mainImage} alt={gym?.name} className="w-20 h-20 rounded-xl object-cover shrink-0" />
              ) : (
                <div className="w-20 h-20 rounded-xl bg-gray-100 shrink-0" />
              )}
              <div className="pt-0.5 min-w-0 flex-1">
                <p className="font-bold text-base text-gray-900 leading-snug line-clamp-2">{gym?.name}</p>
                <div className="flex items-center gap-4 mt-1">
                  {reviewCount > 0 && (
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-gray-900 text-gray-900" />
                      <span className="text-xs font-medium text-gray-800">{averageRating.toFixed(1)}</span>
                      <span className="text-xs text-gray-500">({reviewCount})</span>
                    </div>
                  )}
                  <span className="text-xs text-gray-600 font-medium">{package_?.name}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="divide-y divide-gray-100 px-4">
            <SummaryRow label="Dates" value={formatDateRange(checkin, checkout)} />
            <SummaryRow
              label="Guests"
              value={`${guestCount} ${guestCount === 1 ? 'adult' : 'adults'}`}
            />
            <SummaryRow
              label="Total price"
              value={
                totalPrice != null ? (
                  <span className="inline-flex items-baseline gap-1">
                    <span>{formatAmountOnly(totalPrice, selectedCurrency)}</span>
                    <span className="font-semibold text-gray-900 underline">{selectedCurrency}</span>
                  </span>
                ) : checkin && checkout ? (
                  'Calculating…'
                ) : (
                  'Select dates for pricing'
                )
              }
            />
          </div>
        </div>

        <div className="mt-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Choose when to pay</h2>
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between gap-4 px-4 py-4">
              <span className="text-[15px] font-semibold text-gray-900">
                {totalPrice != null ? (
                  <>Pay {formatPriceWithCode(totalPrice, selectedCurrency)} now</>
                ) : (
                  'Pay now'
                )}
              </span>
              <span
                className="relative inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-gray-900 bg-white"
                aria-hidden
              >
                <span className="h-3.5 w-3.5 rounded-full bg-gray-900" />
              </span>
            </div>
          </div>
        </div>
        </div>
      </div>

      <div
        className="fixed bottom-0 left-0 right-0 border-t border-gray-100 bg-white px-4 pt-2 space-y-2 z-[210]"
        style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
      >
        <StepProgressBar step={1} />
        <Button
          disabled
          className="w-full h-11 text-base font-semibold bg-[#003580] hover:bg-[#003580]/90 text-white rounded-xl opacity-100"
        >
          Continue <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  )
}
