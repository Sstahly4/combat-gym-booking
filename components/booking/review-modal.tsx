'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Star, X, ChevronRight } from 'lucide-react'
import { calculatePackagePrice } from '@/lib/utils'
import type { PriceBreakdown } from '@/lib/utils'
import { resolveClientPriceBreakdown } from '@/lib/booking/client-price-breakdown'
import { applyTrainingTierToBreakdown } from '@/lib/booking/price-breakdown-display'
import {
  CheckoutSummaryRow,
  formatCheckoutAmountOnly,
  formatCheckoutDateRange,
} from '@/components/booking/checkout-ui'
import { PriceDetailsSheet } from '@/components/booking/price-details-sheet'
import {
  ChooseWhenToPaySection,
  type PayWhenChoice,
} from '@/components/booking/choose-when-to-pay'
import { KlarnaInfoSheet } from '@/components/booking/klarna-info-sheet'
import { useCurrency } from '@/lib/contexts/currency-context'
import { DateRangePicker } from '@/components/date-range-picker'
import { BookingTrustLine } from '@/components/booking-trust-line'
import { LoadingOverlay } from '@/components/loading-overlay'
import { CurrencyModal } from '@/components/currency-modal'
import { writeBookingPrefill, readBookingPrefill } from '@/lib/utils/booking-prefill'
import { isKlarnaAvailableForCurrency } from '@/lib/payments/klarna'
import type { Gym, Package, PackageVariant } from '@/lib/types/database'
import { primaryGymImageCardSrc } from '@/lib/images/gym-image-variants'
import type { ReviewModalParams } from '@/lib/contexts/review-modal-context'
import {
  parseTrainingTier,
  getTravelerTrainingTierOptions,
  travelerCanChooseTrainingSession,
  resolveEffectiveTrainingTier,
  travelerSessionLabel,
  type TrainingTier,
} from '@/lib/packages/training-access'
import { TrainingSessionSheet } from '@/components/booking/training-session-picker'

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
  const [trainingTier, setTrainingTier] = useState<TrainingTier>(() =>
    parseTrainingTier(
      initialParams.trainingTier ?? cachedPrefill?.trainingTier ?? 'twice_daily'
    )
  )
  const [variant, setVariant] = useState<PackageVariant | null>(null)
  const [priceBreakdown, setPriceBreakdown] = useState<PriceBreakdown | null>(null)
  const [hasSeasonalOverlap, setHasSeasonalOverlap] = useState(false)

  const [datePickerOpen, setDatePickerOpen] = useState(false)
  const [guestSheetOpen, setGuestSheetOpen] = useState(false)
  const [trainingTierSheetOpen, setTrainingTierSheetOpen] = useState(false)
  const [priceSheetOpen, setPriceSheetOpen] = useState(false)
  const [currencyModalOpen, setCurrencyModalOpen] = useState(false)
  const gymCurrency = gym?.currency ?? 'USD'
  const [payWhen, setPayWhen] = useState<PayWhenChoice>(() => {
    if (
      cachedPrefill?.payTiming === 'klarna' &&
      isKlarnaAvailableForCurrency(cachedPrefill.gym?.currency as string | undefined)
    ) {
      return 'klarna'
    }
    return 'now'
  })
  const [klarnaInfoOpen, setKlarnaInfoOpen] = useState(false)

  useEffect(() => {
    if (payWhen === 'klarna' && !isKlarnaAvailableForCurrency(gymCurrency)) {
      setPayWhen('now')
    }
  }, [gymCurrency, payWhen])

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

  useEffect(() => {
    if (!initialParams.variantId) {
      setVariant(null)
      return
    }
    const supabase = createClient()
    void supabase
      .from('package_variants')
      .select('*')
      .eq('id', initialParams.variantId)
      .single()
      .then(({ data }) => {
        if (data) setVariant(data as PackageVariant)
      })
  }, [initialParams.variantId])

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
  const trainingTierOptions = useMemo(
    () => getTravelerTrainingTierOptions(package_, variant),
    [package_, variant]
  )
  const showTrainingTier = travelerCanChooseTrainingSession(trainingTierOptions)
  const effectiveTrainingTier = resolveEffectiveTrainingTier(trainingTierOptions, trainingTier)
  const usesOnceDailyPricing = effectiveTrainingTier === 'once_daily'
  const tierVariant =
    usesOnceDailyPricing && variant
      ? {
          price_per_day: variant.once_daily_price_per_day ?? variant.price_per_day,
          price_per_week: variant.once_daily_price_per_week ?? variant.price_per_week,
          price_per_month: variant.once_daily_price_per_month ?? variant.price_per_month,
        }
      : variant

  const syncFallbackPrice =
    package_ && pricingDuration > 0
      ? calculatePackagePrice(pricingDuration, package_.type, {
          daily: tierVariant?.price_per_day ?? (
            usesOnceDailyPricing
              ? package_.once_daily_price_per_day ?? package_.price_per_day
              : package_.price_per_day
          ),
          weekly: tierVariant?.price_per_week ?? (
            usesOnceDailyPricing
              ? package_.once_daily_price_per_week ?? package_.price_per_week
              : package_.price_per_week
          ),
          monthly: tierVariant?.price_per_month ?? (
            usesOnceDailyPricing
              ? package_.once_daily_price_per_month ?? package_.price_per_month
              : package_.price_per_month
          ),
        })
      : null

  useEffect(() => {
    if (!package_ || pricingDuration <= 0 || !checkin || !checkout) {
      setPriceBreakdown(null)
      setHasSeasonalOverlap(false)
      return
    }

    let cancelled = false

    void resolveClientPriceBreakdown({
      package_: package_,
      variant: variant
        ? {
            id: variant.id,
            price_per_day: variant.price_per_day,
            price_per_week: variant.price_per_week,
            price_per_month: variant.price_per_month,
            once_daily_price_per_day: variant.once_daily_price_per_day,
            once_daily_price_per_week: variant.once_daily_price_per_week,
            once_daily_price_per_month: variant.once_daily_price_per_month,
          }
        : null,
      pricingDuration,
      checkin,
      checkout,
      training_tier: effectiveTrainingTier,
    }).then(({ breakdown, has_seasonal_overlap }) => {
      if (!cancelled) {
        setPriceBreakdown(breakdown)
        setHasSeasonalOverlap(has_seasonal_overlap)
      }
    })

    return () => {
      cancelled = true
    }
  }, [package_, variant, checkin, checkout, pricingDuration, effectiveTrainingTier])

  useEffect(() => {
    const resolved = resolveEffectiveTrainingTier(trainingTierOptions, trainingTier)
    if (resolved !== trainingTier) {
      setTrainingTier(resolved)
    }
  }, [trainingTierOptions, trainingTier])

  const priceInfo = priceBreakdown ?? syncFallbackPrice
  const displayPriceInfo =
    priceInfo && usesOnceDailyPricing
      ? applyTrainingTierToBreakdown(priceInfo, {
          showTrainingTier: true,
          trainingTier: 'once_daily',
        })
      : priceInfo

  const chargeTotalPrice = priceInfo?.price ?? null
  const totalPrice =
    chargeTotalPrice != null ? convertPrice(chargeTotalPrice, gymCurrency) : null

  const cardImage = primaryGymImageCardSrc(gym?.images)

  const buildContinueUrl = () => {
    const p = new URLSearchParams()
    if (gym) p.set('gymId', gym.id)
    p.set('packageId', initialParams.packageId)
    if (initialParams.variantId) p.set('variantId', initialParams.variantId)
    if (trainingTierOptions && effectiveTrainingTier !== 'twice_daily') {
      p.set('trainingTier', effectiveTrainingTier)
    }
    if (checkin) p.set('checkin', checkin)
    if (checkout) p.set('checkout', checkout)
    p.set('guests', String(guestCount))
    if (payWhen === 'klarna' && isKlarnaAvailableForCurrency(gymCurrency)) {
      p.set('payTiming', 'klarna')
    }
    return `/bookings/summary?${p.toString()}`
  }

  useEffect(() => {
    if (gym && package_) {
      router.prefetch(buildContinueUrl())
    }
  }, [gym, package_, checkin, checkout, guestCount, effectiveTrainingTier, trainingTierOptions, initialParams.packageId, initialParams.variantId, router])

  const handleContinue = () => {
    if (continuingRef.current) return
    continuingRef.current = true
    if (gym && package_) {
      writeBookingPrefill({
        gymId: gym.id,
        packageId: initialParams.packageId,
        variantId: initialParams.variantId,
        trainingTier: trainingTierOptions ? effectiveTrainingTier : undefined,
        gym: gym as unknown as Record<string, unknown>,
        package_: package_ as unknown as Record<string, unknown>,
        checkin,
        checkout,
        guestCount,
        reviewCount,
        reviewAverage: averageRating,
        payTiming:
          payWhen === 'klarna' && isKlarnaAvailableForCurrency(gymCurrency) ? 'klarna' : 'now',
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
          {/* ── Scrollable content (top bar scrolls with page, like steps 2–3) ── */}
          <div className="flex-1 overflow-y-auto pb-36">
            <div className="flex items-center justify-end px-5 pt-4 pb-2">
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4 text-gray-700" />
              </button>
            </div>
            <div className="px-4 pt-2">
            <h1 className="text-3xl font-bold text-gray-900 mb-5">Review and continue</h1>

            <div className="border border-gray-200 rounded-xl overflow-hidden mb-4">
              {/* Gym identity */}
              <div className="px-4 pt-4 pb-3 border-b border-gray-100">
                <div className="flex gap-3 items-start">
                  {cardImage ? (
                    <img src={cardImage} alt={gym?.name} className="w-20 h-20 rounded-xl object-cover shrink-0" />
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
                <CheckoutSummaryRow
                  label="Dates"
                  value={formatCheckoutDateRange(checkin, checkout)}
                  onEdit={() => setDatePickerOpen(true)}
                />
                <CheckoutSummaryRow
                  label="Guests"
                  value={`${guestCount} ${guestCount === 1 ? 'adult' : 'adults'}`}
                  onEdit={() => setGuestSheetOpen(true)}
                />
                {trainingTierOptions && (
                  <CheckoutSummaryRow
                    label="Sessions per day"
                    value={travelerSessionLabel(effectiveTrainingTier)}
                    onEdit={showTrainingTier ? () => setTrainingTierSheetOpen(true) : undefined}
                  />
                )}
                <CheckoutSummaryRow
                  label="Total price"
                  value={
                    totalPrice != null ? (
                      <span className="inline-flex items-baseline gap-1">
                        <span>{formatCheckoutAmountOnly(totalPrice, selectedCurrency)}</span>
                        <button
                          type="button"
                          onClick={() => setCurrencyModalOpen(true)}
                          className="font-semibold text-gray-900 underline hover:text-gray-700 transition-colors"
                          aria-label={`Change currency, currently ${selectedCurrency}`}
                        >
                          {selectedCurrency}
                        </button>
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

            <ChooseWhenToPaySection
              value={payWhen}
              onChange={setPayWhen}
              totalPrice={totalPrice}
              selectedCurrency={selectedCurrency}
              chargeCurrency={gymCurrency}
              chargeTotalPrice={chargeTotalPrice}
              hasDates={!!(checkin && checkout)}
              onOpenKlarnaInfo={() => setKlarnaInfoOpen(true)}
            />
            </div>
          </div>

          {/* ── Fixed bottom: progress + CTA (hidden under nested sheets) ─ */}
          {!currencyModalOpen && !klarnaInfoOpen && (
            <div
              className="fixed bottom-0 left-0 right-0 z-[210] border-t border-gray-100 bg-white px-4 pt-2 space-y-2"
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
          )}

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

          {trainingTierSheetOpen && showTrainingTier && (
            <TrainingSessionSheet
              value={trainingTier}
              onChange={setTrainingTier}
              onClose={() => setTrainingTierSheetOpen(false)}
            />
          )}

          {priceSheetOpen && displayPriceInfo && gym && (
            <PriceDetailsSheet
              lines={displayPriceInfo.lines}
              savedVsNightly={displayPriceInfo.savedVsNightly}
              total={displayPriceInfo.price}
              gymName={gym.name}
              has_seasonal_overlap={hasSeasonalOverlap}
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

          <CurrencyModal
            open={currencyModalOpen}
            onOpenChange={setCurrencyModalOpen}
            initialTab="currency"
            currencyOnly
            confirmSelection
            checkoutSheet
          />

          {chargeTotalPrice != null && isKlarnaAvailableForCurrency(gymCurrency) && (
            <KlarnaInfoSheet
              open={klarnaInfoOpen}
              onClose={() => setKlarnaInfoOpen(false)}
              totalPrice={chargeTotalPrice}
              currency={gymCurrency}
            />
          )}
        </>
      ) : null}
    </div>
  )
}
