'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Star, X, Calendar, Users, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { calculatePackagePrice } from '@/lib/utils'
import { useCurrency } from '@/lib/contexts/currency-context'
import { DateRangePicker } from '@/components/date-range-picker'
import { BookingTrustLine } from '@/components/booking-trust-line'
import type { Gym, Package, PackageVariant } from '@/lib/types/database'

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
    <div className="fixed inset-0 z-[100]">
      <div className="fixed inset-0 bg-black/50 z-[101]" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl z-[102] flex flex-col max-h-[85dvh]">
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>
        <div className="flex items-center justify-between px-5 pt-3 pb-4 border-b border-gray-100 flex-shrink-0">
          <h3 className="text-lg font-semibold">Guests</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 text-xl">✕</button>
        </div>
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
        <div className="px-5 pb-8 flex-shrink-0" style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}>
          <Button className="w-full h-12 bg-[#003580] hover:bg-[#003580]/90 font-semibold text-base" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Row with label + value + optional Change button ──────────────────────────
function Row({
  label,
  value,
  sub,
  onEdit,
}: {
  label: string
  value: string
  sub?: string
  onEdit?: () => void
}) {
  return (
    <div className="flex items-start justify-between py-4">
      <div>
        <div className="text-sm font-semibold text-gray-900 mb-0.5">{label}</div>
        <div className="text-sm text-gray-600">{value}</div>
        {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
      </div>
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          className="ml-4 inline-flex shrink-0 items-center justify-center rounded-lg bg-gray-200 px-3.5 py-1.5 text-sm font-medium text-gray-900 can-hover:hover:bg-gray-300 active:bg-gray-300 transition-colors touch-manipulation"
        >
          Change
        </button>
      )}
    </div>
  )
}

// ─── Page content ──────────────────────────────────────────────────────────────
function ReviewPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { convertPrice, formatPrice } = useCurrency()

  const [gym, setGym] = useState<(Gym & { images?: { url: string; order?: number }[] }) | null>(null)
  const [package_, setPackage_] = useState<Package | null>(null)
  const [loading, setLoading] = useState(true)
  const [averageRating, setAverageRating] = useState(0)
  const [reviewCount, setReviewCount] = useState(0)

  const [checkin, setCheckin] = useState(searchParams.get('checkin') || '')
  const [checkout, setCheckout] = useState(searchParams.get('checkout') || '')
  const [guestCount, setGuestCount] = useState(
    parseInt(searchParams.get('guests') || '1') || 1
  )

  const [datePickerOpen, setDatePickerOpen] = useState(false)
  const [guestSheetOpen, setGuestSheetOpen] = useState(false)

  // Desktop: skip this page and go straight to summary
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth >= 768) {
      const params = new URLSearchParams(searchParams.toString())
      router.replace(`/bookings/summary?${params.toString()}`)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const gymId = searchParams.get('gymId')
    const packageId = searchParams.get('packageId')
    if (!gymId || !packageId) { setLoading(false); return }

    const supabase = createClient()
    const [{ data: gymData }, { data: pkgData }] = await Promise.all([
      supabase
        .from('gyms')
        .select('*, images:gym_images(url, variants, order, focus_x, focus_y)')
        .eq('id', gymId)
        .order('order', { referencedTable: 'gym_images', ascending: true })
        .single(),
      supabase.from('packages').select('*').eq('id', packageId).single(),
    ])

    if (gymData) {
      setGym(gymData as Gym & { images?: { url: string }[] })

      // Reviews
      const [{ data: bkgReviews }, { data: manualReviews }] = await Promise.all([
        supabase.from('bookings').select('id, reviews(rating)').eq('gym_id', gymId),
        supabase.from('reviews').select('rating').eq('gym_id', gymId).eq('manual_review', true),
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
    if (pkgData) setPackage_(pkgData as Package)
    setLoading(false)
  }

  // ── Derived values ────────────────────────────────────────────────────────
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

  const formatDate = (d: string) => {
    if (!d) return '–'
    const dt = new Date(d + 'T00:00:00')
    return dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  // "7–14 June 2026" — share month/year when both dates are in the same month
  const formatDateRange = (from: string, to: string) => {
    if (!from || !to) return 'No dates selected'
    const a = new Date(from + 'T00:00:00')
    const b = new Date(to + 'T00:00:00')
    const sameMonth = a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()
    if (sameMonth) {
      const month = a.toLocaleDateString('en-GB', { month: 'long' })
      const year = a.getFullYear()
      return `${a.getDate()}–${b.getDate()} ${month} ${year}`
    }
    return `${a.getDate()} ${a.toLocaleDateString('en-GB', { month: 'long' })} – ${b.getDate()} ${b.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}`
  }

  const mainImage =
    gym?.images && gym.images.length > 0
      ? [...gym.images].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))[0].url
      : null

  const gymSlugOrId = (gym as any)?.slug || gym?.id || ''

  // ── Build the "Continue" URL (forwards to step 2) ────────────────────────
  const buildContinueUrl = () => {
    const params = new URLSearchParams()
    if (gym) params.set('gymId', gym.id)
    const packageId = searchParams.get('packageId')
    if (packageId) params.set('packageId', packageId)
    const variantId = searchParams.get('variantId')
    if (variantId) params.set('variantId', variantId)
    if (checkin) params.set('checkin', checkin)
    if (checkout) params.set('checkout', checkout)
    params.set('guests', String(guestCount))
    return `/bookings/summary?${params.toString()}`
  }

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <div className="flex items-center justify-between px-4 pt-4 pb-3">
          <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse" />
          <div className="h-5 w-40 bg-gray-200 rounded animate-pulse" />
          <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse" />
        </div>
        <div className="flex-1 px-4 space-y-4 pt-2 pb-36">
          <div className="flex gap-3">
            <div className="w-20 h-20 rounded-xl bg-gray-200 animate-pulse shrink-0" />
            <div className="flex-1 space-y-2 pt-1">
              <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
              <div className="h-3 w-1/2 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-14 border-b border-gray-100 flex items-center">
              <div className="flex-1 space-y-1.5">
                <div className="h-2.5 w-12 bg-gray-200 rounded animate-pulse" />
                <div className="h-3.5 w-32 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
        <div className="fixed bottom-0 left-0 right-0 px-4 pb-8 pt-4 space-y-3 bg-white border-t border-gray-100 z-40">
          <StepProgressBar step={1} />
          <div className="h-13 w-full bg-gray-200 rounded-xl animate-pulse" />
        </div>
      </div>
    )
  }

  if (!gym || !package_) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-gray-600 text-sm">Booking information not found.</p>
        <button onClick={() => router.back()} className="text-[#003580] text-sm font-medium">
          Go back
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* ── Top nav ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-end px-4 pt-4 pb-2">
        <Link
          href={`/gyms/${gymSlugOrId}`}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Exit to gym listing"
        >
          <X className="w-4 h-4 text-gray-700" />
        </Link>
      </div>

      {/* ── Scrollable content ──────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 pt-2 pb-36">
        {/* Page title */}
        <h1 className="text-3xl font-bold text-gray-900 mb-5">Review and continue</h1>
        {/* ── Gym + booking summary card ─────────────────────────────── */}
        <div className="border border-gray-200 rounded-xl overflow-hidden mb-4">

          {/* Gym identity */}
          <div className="px-4 pt-4 pb-3 border-b border-gray-100">
            <div className="flex gap-3 items-start">
              {mainImage ? (
                <img
                  src={mainImage}
                  alt={gym.name}
                  className="w-20 h-20 rounded-xl object-cover shrink-0"
                />
              ) : (
                <div className="w-20 h-20 rounded-xl bg-gray-100 shrink-0" />
              )}
              <div className="pt-0.5 min-w-0 flex-1">
                <p className="font-bold text-base text-gray-900 leading-snug line-clamp-2">
                  {gym.name}
                </p>
                {/* Rating + package type inline */}
                <div className="flex items-center gap-4 mt-1">
                  {reviewCount > 0 && (
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-gray-900 text-gray-900" />
                      <span className="text-xs font-medium text-gray-800">{averageRating.toFixed(1)}</span>
                      <span className="text-xs text-gray-500">({reviewCount})</span>
                    </div>
                  )}
                  {package_ && (
                    <span className="text-xs text-gray-600 font-medium">{package_.name}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── Summary rows ─────────────────────────────────────────── */}
          <div className="divide-y divide-gray-100 px-4">
            {/* Dates */}
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

            {/* Guests */}
            <Row
              label="Guests"
              value={`${guestCount} ${guestCount === 1 ? 'adult' : 'adults'}`}
              onEdit={() => setGuestSheetOpen(true)}
            />

            {/* Price */}
            <Row
              label="Total price"
              value={
                totalPrice != null
                  ? formatPrice(totalPrice)
                  : checkin && checkout
                  ? 'Calculating…'
                  : 'Select dates for pricing'
              }
              sub={priceInfo?.durationLabel || undefined}
            />

            {/* Trust / cancellation signal */}
            {package_ && checkin && (
              <div className="py-3">
                <BookingTrustLine pkg={package_ as any} gym={gym} checkin={checkin} variant="featured" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Fixed bottom: progress + CTA ────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-gray-100 bg-white px-4 pt-3 pb-5 space-y-3 z-40" style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}>
        <StepProgressBar step={1} />
        <Button
          onClick={() => router.push(buildContinueUrl())}
          className="w-full h-13 text-base font-semibold bg-[#003580] hover:bg-[#003580]/90 text-white rounded-xl"
        >
          Continue
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      {/* ── Date picker overlay ─────────────────────────────────────── */}
      {datePickerOpen && (
        <div className="fixed inset-0 z-[100]">
          <div
            className="fixed inset-0 bg-black/40 z-[45]"
            onClick={() => setDatePickerOpen(false)}
          />
          <div className="fixed inset-0 z-[52] pointer-events-none [&>div]:pointer-events-auto [&>div>div:first-child]:opacity-0 [&>div>div:first-child]:pointer-events-none">
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

      {/* ── Guest count sheet ───────────────────────────────────────── */}
      {guestSheetOpen && (
        <GuestSheet
          value={guestCount}
          onChange={setGuestCount}
          onClose={() => setGuestSheetOpen(false)}
        />
      )}
    </div>
  )
}

export default function ReviewPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#003580] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ReviewPageContent />
    </Suspense>
  )
}
