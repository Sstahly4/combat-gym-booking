'use client'

import { useState, useEffect, useRef, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Star, X, ChevronRight } from 'lucide-react'
import { calculatePackagePrice, type PriceLine } from '@/lib/utils'
import { useCurrency } from '@/lib/contexts/currency-context'
import { DateRangePicker } from '@/components/date-range-picker'
import { BookingTrustLine } from '@/components/booking-trust-line'
import { LoadingOverlay } from '@/components/loading-overlay'
import { writeBookingPrefill, readBookingPrefill } from '@/lib/utils/booking-prefill'
import type { Gym, Package } from '@/lib/types/database'
import type { ReviewModalParams } from '@/lib/contexts/review-modal-context'

// ─── Thin 3-step progress bar ─────────────────────────────────────────────────
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

function formatPriceWithCode(amount: number, currency: string): string {
  const formatted = amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  const symbol = CURRENCY_SYMBOLS[currency] ?? ''
  return symbol ? `${symbol}${formatted} ${currency}` : `${currency} ${formatted}`
}

function formatAmountOnly(amount: number, currency: string): string {
  const formatted = amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  const symbol = CURRENCY_SYMBOLS[currency] ?? ''
  return symbol ? `${symbol}${formatted}` : formatted
}

function lineUnitLabel(line: PriceLine): string {
  if (line.label.toLowerCase().includes('session')) {
    return line.qty === 1 ? 'session' : 'sessions'
  }
  if (line.kind === 'month') return line.qty === 1 ? 'month' : 'months'
  if (line.kind === 'week') return line.qty === 1 ? 'week' : 'weeks'
  return line.qty === 1 ? 'night' : 'nights'
}

function formatBreakdownDateRange(from: string, to: string): string {
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

// ─── Price breakdown (nested above price details) ─────────────────────────────
function PriceBreakdownSheet({
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
    formatPriceWithCode(convertPrice(amount, gymCurrency), displayCurrency)

  const preDiscountTotal = total + savedVsNightly

  return (
    <div className="fixed inset-0 z-[310]">
      <div className="fixed inset-0 bg-black/50 z-[311]" onClick={onClose} />
      <div
        className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-[312] flex flex-col max-h-[85dvh]"
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

// ─── Price details bottom sheet ────────────────────────────────────────────────
function PriceDetailsSheet({
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
    formatPriceWithCode(convertPrice(amount, gymCurrency), displayCurrency)

  const breakdownSummaryLabel =
    checkin && checkout && pricingDuration > 0
      ? `${pricingDuration} ${stayUnitLabel(pricingDuration, isTraining)} · ${formatBreakdownDateRange(checkin, checkout)}`
      : `${pricingDuration} ${stayUnitLabel(pricingDuration, isTraining)}`

  return (
    <div className="fixed inset-0 z-[300]">
      <div
        className="fixed inset-0 bg-black/50 z-[301]"
        onClick={() => {
          if (!breakdownOpen) onClose()
        }}
      />
      <div
        className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-[302] flex flex-col max-h-[85dvh]"
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

// ─── Guest count bottom sheet ──────────────────────────────────────────────────
function GuestSheet({
  value,
  onChange,
  onClose,
}: {
  value: number
  onChange: (n: number) => void
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-[300]">
      <div className="fixed inset-0 bg-black/50 z-[301]" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl z-[302] flex flex-col max-h-[85dvh]">
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-3 pb-4 border-b border-gray-100 flex-shrink-0">
          <h3 className="text-lg font-semibold">Guests</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 text-xl">✕</button>
        </div>
        {/* Content */}
        <div className="px-5 py-6 flex-1">
          <div className="flex items-center justify-between py-4">
            <div>
              <div className="text-base font-medium text-gray-900">Adults</div>
              <div className="text-sm text-gray-500">Ages 13 or above</div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => onChange(Math.max(1, value - 1))}
                disabled={value <= 1}
                className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-gray-700 text-xl disabled:opacity-30 hover:border-gray-500 transition-colors"
              >
                −
              </button>
              <span className="w-6 text-center text-base font-medium">{value}</span>
              <button
                onClick={() => onChange(value + 1)}
                className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-gray-700 text-xl hover:border-gray-500 transition-colors"
              >
                +
              </button>
            </div>
          </div>
        </div>
        {/* CTA */}
        <div className="px-5 pb-8 flex-shrink-0" style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}>
          <Button
            className="w-full h-11 bg-[#003580] hover:bg-[#003580]/90 font-semibold text-base"
            onClick={onClose}
          >
            Done
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Row ──────────────────────────────────────────────────────────────────────
function Row({
  label,
  value,
  sub,
  onEdit,
  editLabel = 'Change',
}: {
  label: string
  value: ReactNode
  sub?: string
  onEdit?: () => void
  editLabel?: string
}) {
  return (
    <div className="flex items-start justify-between py-4">
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-gray-900 mb-0.5">{label}</div>
        <div className="text-sm text-gray-600">{value}</div>
        {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
      </div>
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          className="ml-4 inline-flex shrink-0 items-center justify-center rounded-lg bg-gray-100 px-3.5 py-1.5 text-sm font-medium text-gray-900 can-hover:hover:bg-gray-200 active:bg-gray-200 transition-colors touch-manipulation"
        >
          {editLabel}
        </button>
      )}
    </div>
  )
}

// ─── Modal content ────────────────────────────────────────────────────────────
export function ReviewModal({
  params: initialParams,
  gymSlugOrId,
  onClose,
}: {
  params: ReviewModalParams
  gymSlugOrId: string
  onClose: () => void
}) {
  const router = useRouter()
  const { convertPrice, selectedCurrency } = useCurrency()
  const continuingRef = useRef(false)

  // Pre-loaded from gym page, hydrated from booking_prefill on back-nav, or fetched.
  const cachedPrefill = readBookingPrefill(initialParams.gymId, initialParams.packageId)
  const resolvedGymData = initialParams.gymData ?? cachedPrefill?.gym
  const resolvedPackageData = initialParams.packageData ?? cachedPrefill?.package_
  const hasPreloaded = !!(resolvedGymData && resolvedPackageData)

  const [gym, setGym] = useState<(Gym & { images?: { url: string; order?: number }[] }) | null>(
    hasPreloaded ? (resolvedGymData as unknown as Gym & { images?: { url: string; order?: number }[] }) : null
  )
  const [package_, setPackage_] = useState<Package | null>(
    hasPreloaded ? (resolvedPackageData as unknown as Package) : null
  )
  const [loading, setLoading] = useState(!hasPreloaded)
  const [averageRating, setAverageRating] = useState(
    initialParams.initialReviewAverage ?? cachedPrefill?.reviewAverage ?? 0
  )
  const [reviewCount, setReviewCount] = useState(
    initialParams.initialReviewCount ?? cachedPrefill?.reviewCount ?? 0
  )

  const [checkin, setCheckin] = useState(initialParams.checkin)
  const [checkout, setCheckout] = useState(initialParams.checkout)
  const [guestCount, setGuestCount] = useState(initialParams.guestCount ?? 1)

  const [datePickerOpen, setDatePickerOpen] = useState(false)
  const [guestSheetOpen, setGuestSheetOpen] = useState(false)
  const [priceSheetOpen, setPriceSheetOpen] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    if (!hasPreloaded) {
      // Fallback: fetch gym + package when pre-loaded data wasn't supplied
      const fetchData = async () => {
        const [{ data: gymData }, { data: pkgData }] = await Promise.all([
          supabase
            .from('gyms')
            .select('*, images:gym_images(url, variants, order, focus_x, focus_y)')
            .eq('id', initialParams.gymId)
            .order('order', { referencedTable: 'gym_images', ascending: true })
            .single(),
          supabase.from('packages').select('*').eq('id', initialParams.packageId).single(),
        ])
        if (gymData) setGym(gymData as Gym & { images?: { url: string; order?: number }[] })
        if (pkgData) setPackage_(pkgData as Package)
        setLoading(false)
      }
      fetchData()
    }

    // Reviews are always fetched in the background — they fade in once ready
    // without blocking the initial render.
    const fetchReviews = async () => {
      const [{ data: bkgReviews }, { data: manualReviews }] = await Promise.all([
        supabase.from('bookings').select('id, reviews(rating)').eq('gym_id', initialParams.gymId),
        supabase.from('reviews').select('rating').eq('gym_id', initialParams.gymId).eq('manual_review', true),
      ])
      const all = [
        ...((bkgReviews || []) as any[]).flatMap((b) => b.reviews || []),
        ...(manualReviews || []),
      ]
      if (all.length > 0) {
        setAverageRating(all.reduce((s: number, r: any) => s + r.rating, 0) / all.length)
        setReviewCount(all.length)
      }
    }
    fetchReviews()
  }, [initialParams.gymId, initialParams.packageId, hasPreloaded])

  // ── Derived values ──────────────────────────────────────────────────────────
  const duration =
    checkin && checkout
      ? Math.floor(
          (new Date(checkout).getTime() - new Date(checkin).getTime()) /
            (1000 * 60 * 60 * 24)
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

  const formatDateRange = (from: string, to: string) => {
    if (!from || !to) return 'No dates selected'
    const a = new Date(from + 'T00:00:00')
    const b = new Date(to + 'T00:00:00')
    const sameMonth = a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()
    if (sameMonth) {
      const month = a.toLocaleDateString('en-GB', { month: 'long' })
      return `${a.getDate()}–${b.getDate()} ${month} ${a.getFullYear()}`
    }
    return `${a.getDate()} ${a.toLocaleDateString('en-GB', { month: 'long' })} – ${b.getDate()} ${b.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}`
  }

  const mainImage =
    gym?.images && gym.images.length > 0
      ? [...gym.images].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))[0].url
      : null

  const buildContinueUrl = () => {
    const p = new URLSearchParams()
    if (gym) p.set('gymId', gym.id)
    p.set('packageId', initialParams.packageId)
    if (initialParams.variantId) p.set('variantId', initialParams.variantId)
    if (checkin) p.set('checkin', checkin)
    if (checkout) p.set('checkout', checkout)
    p.set('guests', String(guestCount))
    return `/bookings/summary?${p.toString()}`
  }

  useEffect(() => {
    if (gym && package_) {
      router.prefetch(buildContinueUrl())
    }
  }, [gym, package_, checkin, checkout, guestCount, initialParams.packageId, initialParams.variantId, router])

  const handleContinue = () => {
    if (continuingRef.current) return
    continuingRef.current = true
    if (gym && package_) {
      writeBookingPrefill({
        gymId: gym.id,
        packageId: initialParams.packageId,
        variantId: initialParams.variantId,
        gym: gym as unknown as Record<string, unknown>,
        package_: package_ as unknown as Record<string, unknown>,
        checkin,
        checkout,
        guestCount,
        reviewCount,
        reviewAverage: averageRating,
      })
    }
    router.push(buildContinueUrl())
  }

  const ready = !!(gym && package_)
  const showOverlay = loading || !ready

  return (
    <div className="fixed inset-0 z-[200] bg-white flex flex-col overflow-hidden">
      <LoadingOverlay show={showOverlay} zClass="z-[220]" />

      {/* Error state — only when loading finished and data is missing */}
      {!loading && !ready ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-4">
          <p className="text-gray-600 text-sm">Booking information not found.</p>
          <button onClick={onClose} className="text-[#003580] text-sm font-medium">Go back</button>
        </div>
      ) : ready ? (
        <>
          {/* ── Top nav ─────────────────────────────────────────────── */}
          <div className="flex items-center justify-end px-4 pt-4 pb-2 flex-shrink-0">
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4 text-gray-700" />
            </button>
          </div>

          {/* ── Scrollable content ──────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto px-4 pt-2 pb-36">
            <h1 className="text-3xl font-bold text-gray-900 mb-5">Review and continue</h1>

            <div className="border border-gray-200 rounded-xl overflow-hidden mb-4">
              {/* Gym identity */}
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

              {/* ── Summary rows ──────────────────────────────────────── */}
              <div className="divide-y divide-gray-100 px-4">
                <Row
                  label="Dates"
                  value={formatDateRange(checkin, checkout)}
                  sub={
                    duration > 0
                      ? `${isTraining ? pricingDuration : duration} ${
                          isTraining
                            ? pricingDuration === 1 ? 'day' : 'days'
                            : duration === 1 ? 'night' : 'nights'
                        }`
                      : undefined
                  }
                  onEdit={() => setDatePickerOpen(true)}
                />
                <Row
                  label="Guests"
                  value={`${guestCount} ${guestCount === 1 ? 'adult' : 'adults'}`}
                  onEdit={() => setGuestSheetOpen(true)}
                />
                <Row
                  label="Total price"
                  value={
                    totalPrice != null ? (
                      <span className="inline-flex items-baseline gap-1">
                        <span>{formatAmountOnly(totalPrice, selectedCurrency)}</span>
                        <span className="font-semibold text-gray-900 underline">
                          {selectedCurrency}
                        </span>
                      </span>
                    ) : checkin && checkout ? (
                      'Calculating…'
                    ) : (
                      'Select dates for pricing'
                    )
                  }
                  onEdit={priceInfo && totalPrice != null ? () => setPriceSheetOpen(true) : undefined}
                  editLabel="Details"
                />
                {package_ && checkin && (
                  <div className="py-3">
                    <BookingTrustLine pkg={package_ as any} gym={gym} checkin={checkin} variant="featured" />
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Choose when to pay</h2>
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <label className="flex items-center justify-between gap-4 px-4 py-4 cursor-default">
                  <span className="text-[15px] font-semibold text-gray-900">
                    {totalPrice != null ? (
                      <>Pay {formatPriceWithCode(totalPrice, selectedCurrency)} now</>
                    ) : checkin && checkout ? (
                      'Pay now'
                    ) : (
                      'Select dates to see price'
                    )}
                  </span>
                  <span
                    className="relative inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-gray-900 bg-white"
                    aria-hidden
                  >
                    <span className="h-3.5 w-3.5 rounded-full bg-gray-900" />
                  </span>
                  <input
                    type="radio"
                    name="pay-when"
                    value="now"
                    checked
                    readOnly
                    className="sr-only"
                    aria-label="Pay now"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* ── Fixed bottom: progress + CTA ──────────────────────── */}
          <div
            className="fixed bottom-0 left-0 right-0 border-t border-gray-100 bg-white px-4 pt-2 space-y-2 z-[210]"
            style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
          >
            <StepProgressBar step={1} />
            <Button
              onClick={handleContinue}
              className="w-full h-11 text-base font-semibold bg-[#003580] hover:bg-[#003580]/90 text-white rounded-xl"
            >
              Continue <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          {/* ── Date picker overlay ────────────────────────────────── */}
          {datePickerOpen && (
            <div className="fixed inset-0 z-[250]">
              <div className="fixed inset-0 bg-black/40 z-[251]" onClick={() => setDatePickerOpen(false)} />
              {/* z-[252] wrapper: trigger input is hidden via opacity but fixed sheet children still render */}
              <div className="fixed inset-0 z-[252] pointer-events-none [&>div]:pointer-events-auto [&>div>div:first-child]:opacity-0 [&>div>div:first-child]:pointer-events-none">
                <DateRangePicker
                  checkin={checkin}
                  checkout={checkout}
                  forceOpen={true}
                  onClose={() => setDatePickerOpen(false)}
                  onCheckinChange={setCheckin}
                  onCheckoutChange={setCheckout}
                />
              </div>
            </div>
          )}

          {/* ── Guest count sheet ──────────────────────────────────── */}
          {guestSheetOpen && (
            <GuestSheet
              value={guestCount}
              onChange={setGuestCount}
              onClose={() => setGuestSheetOpen(false)}
            />
          )}

          {priceSheetOpen && priceInfo && gym && (
            <PriceDetailsSheet
              lines={priceInfo.lines}
              savedVsNightly={priceInfo.savedVsNightly}
              total={priceInfo.price}
              gymCurrency={gym.currency ?? 'USD'}
              displayCurrency={selectedCurrency}
              convertPrice={convertPrice}
              checkin={checkin}
              checkout={checkout}
              pricingDuration={pricingDuration}
              isTraining={!!isTraining}
              onClose={() => setPriceSheetOpen(false)}
            />
          )}
        </>
      ) : null}
    </div>
  )
}
