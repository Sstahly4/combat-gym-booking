'use client'

import { useState, useEffect, useRef, Suspense, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { calculatePackagePrice } from '@/lib/utils'
import { resolveClientPriceBreakdown } from '@/lib/booking/client-price-breakdown'
import { useCurrency } from '@/lib/contexts/currency-context'
import type { PriceBreakdown } from '@/lib/utils'
import type { Gym, Package, PackageVariant } from '@/lib/types/database'
import { ArrowLeft, MapPin, AlertCircle, Dumbbell, Star, Wifi, Car, UtensilsCrossed, Droplets, Building2, X } from 'lucide-react'
import Link from 'next/link'
import { LoadingOverlay } from '@/components/loading-overlay'
import {
  readBookingPrefill,
  readSummaryPrefillFromUrl,
  writeBookingPrefill,
  writePaymentIntentCache,
} from '@/lib/utils/booking-prefill'
import { useReviewCheckoutChrome } from '@/lib/contexts/review-checkout-chrome-context'
import {
  prepareCheckoutExitToGym,
  writeReviewModalRestore,
} from '@/lib/utils/review-checkout-chrome'
import { gymHrefWithOptionalDates } from '@/lib/booking-dates-intent'
import {
  BOOKING_DATES_EXPIRED_ERROR,
  BOOKING_DATES_EXPIRED_INLINE,
  isBookingDatesExpiredError,
  isBookingStartDateInPast,
} from '@/lib/booking/validate-booking-dates'
import {
  CHECKOUT_PAY_BUTTON_CLASS,
  CheckoutDatesUnavailableAlert,
  CheckoutStepTitle,
  CheckoutSummaryFieldError,
  formatCheckoutPriceWithCode,
} from '@/components/booking/checkout-ui'
import { CheckoutReceiptBreakdown } from '@/components/booking/checkout-receipt-breakdown'
import { DateRangePicker } from '@/components/date-range-picker'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useAuth } from '@/lib/hooks/use-auth'
import {
  detailsFromProfile,
  readGuestDetails,
  readGuestFlowSession,
  writeGuestDetails,
  writeGuestFlowSession,
} from '@/lib/utils/checkout-details-prefill'

const DISCIPLINES = ['Muay Thai', 'MMA', 'BJJ', 'Boxing', 'Wrestling', 'Kickboxing']

/** Step 2 → Step 1: reopen the review modal on the gym listing. */
function buildReviewBackHref(
  gymSlugOrId: string,
  packageId: string,
  opts: { variantId?: string; checkin?: string; checkout?: string; guests?: number }
): string {
  const p = new URLSearchParams()
  p.set('review', '1')
  p.set('pkg', packageId)
  if (opts.variantId) p.set('variant', opts.variantId)
  if (opts.checkin) p.set('checkin', opts.checkin)
  if (opts.checkout) p.set('checkout', opts.checkout)
  p.set('guests', String(opts.guests ?? 1))
  return `/gyms/${gymSlugOrId}?${p.toString()}`
}

// Thin 3-segment progress bar — matches review modal
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

function CheckoutExitButton({ gym }: { gym: { slug?: string | null; id: string } | null }) {
  const router = useRouter()
  const { showReviewChrome } = useReviewCheckoutChrome()

  if (!gym) return <div className="w-8 h-8 shrink-0" aria-hidden />

  const handleExit = () => {
    prepareCheckoutExitToGym(gym)
    showReviewChrome()
    router.replace(`/gyms/${gym.slug || gym.id}`)
  }

  return (
    <button
      type="button"
      onClick={handleExit}
      className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
      aria-label="Return to gym listing"
    >
      <X className="w-4 h-4 text-gray-900" />
    </button>
  )
}

function CheckoutTopBar({
  gym,
  onBack,
}: {
  gym: { slug?: string | null; id: string } | null
  onBack: () => void
}) {
  return (
    <div className="flex items-center justify-between px-5 pt-4 pb-2 flex-shrink-0">
      <button
        type="button"
        onClick={onBack}
        aria-label="Back to review"
        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 text-gray-900" />
      </button>
      <CheckoutExitButton gym={gym} />
    </div>
  )
}

function CheckoutBottomBar({
  error,
  submitting,
  disabled,
  onSubmit,
}: {
  error: string | null
  submitting: boolean
  disabled: boolean
  onSubmit: () => void
}) {
  return (
    <div
      className="fixed bottom-0 left-0 right-0 border-t border-gray-100 bg-white px-4 pt-2 space-y-2 z-50"
      style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
    >
      <StepProgressBar step={submitting ? 3 : 2} />
      {error && !isBookingDatesExpiredError(error) && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </div>
      )}
      <Button
        onClick={onSubmit}
        disabled={disabled || submitting}
        className={CHECKOUT_PAY_BUTTON_CLASS}
      >
        Final Steps
      </Button>
    </div>
  )
}

function BookingSummaryPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, profile, loading: authLoading } = useAuth()
  const { convertPrice, formatPrice, selectedCurrency } = useCurrency()
  const { hideReviewChrome, showReviewChrome } = useReviewCheckoutChrome()

  const initialPrefill = readSummaryPrefillFromUrl()

  const [gym, setGym] = useState<Gym & { images?: { url: string }[] } | null>(() =>
    initialPrefill
      ? (initialPrefill.gym as unknown as Gym & { images?: { url: string }[] })
      : null
  )
  const [package_, setPackage_] = useState<Package | null>(() =>
    initialPrefill ? (initialPrefill.package_ as unknown as Package) : null
  )
  const [variant, setVariant] = useState<PackageVariant | null>(null)
  const [loading, setLoading] = useState(() => !initialPrefill)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [averageRating, setAverageRating] = useState(() => initialPrefill?.reviewAverage ?? 0)
  const [reviewCount, setReviewCount] = useState(() => initialPrefill?.reviewCount ?? 0)
  
  const [checkin, setCheckin] = useState(searchParams.get('checkin') || '')
  const [checkout, setCheckout] = useState(searchParams.get('checkout') || '')
  const [guestCount, setGuestCount] = useState(
    parseInt(searchParams.get('guests') || '1') || 1
  )
  const [discipline, setDiscipline] = useState('')
  const [notes, setNotes] = useState('')
  
  // User details (KYC)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [country, setCountry] = useState('Australia')
  const [bookingFor, setBookingFor] = useState<'self' | 'other'>('self')
  const [addressCopied, setAddressCopied] = useState(false)
  const [datePickerOpen, setDatePickerOpen] = useState(false)
  const [priceBreakdown, setPriceBreakdown] = useState<PriceBreakdown | null>(null)
  const [seasonalNote, setSeasonalNote] = useState<string | null>(null)
  // Tracks when initial data load is done; prevents persist from overwriting restored data.
  const sessionLoadedRef = useRef(!!initialPrefill)
  // Guest details / profile prefill applied — gates guest sessionStorage writes.
  const detailsHydratedRef = useRef(false)

  const copyAddress = async () => {
    if (!gym?.address) return
    try {
      await navigator.clipboard.writeText(gym.address)
      setAddressCopied(true)
      setTimeout(() => setAddressCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy address:', err)
    }
  }

  const navigateBackToReview = () => {
    const gymId = searchParams.get('gymId')
    const packageId = searchParams.get('packageId')
    const slugOrId = gym?.slug || gym?.id || gymId
    const pkgId = package_?.id || packageId
    if (slugOrId && pkgId && gym && package_) {
      // Keep booking_prefill fresh so the review modal paints instantly on back-nav.
      const backCheckin = checkin || searchParams.get('checkin') || ''
      const backCheckout = checkout || searchParams.get('checkout') || ''
      const backVariantId = variant?.id || searchParams.get('variantId') || undefined

      writeBookingPrefill({
        gymId: gym.id,
        packageId: pkgId,
        variantId: backVariantId,
        gym: gym as unknown as Record<string, unknown>,
        package_: package_ as unknown as Record<string, unknown>,
        checkin: backCheckin,
        checkout: backCheckout,
        guestCount,
        reviewCount,
        reviewAverage: averageRating,
      })
      writeReviewModalRestore({
        gymId: gym.id,
        packageId: pkgId,
        variantId: backVariantId,
        checkin: backCheckin,
        checkout: backCheckout,
        guestCount,
      })
      hideReviewChrome()
      const backHref = buildReviewBackHref(slugOrId, pkgId, {
        variantId: backVariantId,
        checkin: backCheckin || undefined,
        checkout: backCheckout || undefined,
        guests: guestCount,
      })
      router.prefetch(backHref)
      router.replace(backHref)
      return
    }
    router.back()
  }

  useEffect(() => {
    fetchBookingData()
    import('@/components/booking/review-modal')
    const gymId = searchParams.get('gymId')
    const slugOrId = gym?.slug || gym?.id || gymId
    if (slugOrId) {
      router.prefetch(`/gyms/${slugOrId}`)
    }
  }, [])

  /** Signed-in: profile only. Guest: sessionStorage as they type. */
  const hydrateCheckoutDetails = useCallback(
    (gymId: string, isSignedIn: boolean) => {
      if (isSignedIn) {
        if (profile) {
          const d = detailsFromProfile(profile, user?.email)
          setFirstName(d.firstName)
          setLastName(d.lastName)
          setEmail(d.email)
          setPhone(d.phone)
          setCountry(d.country)
        } else if (user?.email) {
          setEmail(user.email)
        }
        detailsHydratedRef.current = true
        return
      }

      const flow = readGuestFlowSession(gymId)
      if (flow) {
        if (flow.checkin) setCheckin(flow.checkin)
        if (flow.checkout) setCheckout(flow.checkout)
        if (typeof flow.guestCount === 'number') setGuestCount(flow.guestCount)
        if (flow.bookingFor) setBookingFor(flow.bookingFor)
      }

      const saved = readGuestDetails(gymId)
      if (saved) {
        if (saved.firstName) setFirstName(saved.firstName)
        if (saved.lastName) setLastName(saved.lastName)
        if (saved.email) setEmail(saved.email)
        if (saved.phone) setPhone(saved.phone)
        if (saved.country) setCountry(saved.country)
        if (saved.notes !== undefined) setNotes(saved.notes)
        if (saved.discipline) setDiscipline(saved.discipline)
      }
      detailsHydratedRef.current = true
    },
    [profile, user?.email]
  )

  useEffect(() => {
    if (authLoading || !sessionLoadedRef.current || detailsHydratedRef.current) return
    const gymId = searchParams.get('gymId')
    if (!gymId) return
    hydrateCheckoutDetails(gymId, !!user)
  }, [authLoading, user, profile, hydrateCheckoutDetails, searchParams])

  // Guest only — persist Your details + flow fields for back-nav from payment.
  useEffect(() => {
    if (!sessionLoadedRef.current || !detailsHydratedRef.current || user) return
    const gymId = searchParams.get('gymId')
    if (!gymId) return
    writeGuestDetails(gymId, {
      firstName,
      lastName,
      email,
      phone,
      country,
      notes,
      discipline,
    })
  }, [user, firstName, lastName, email, phone, country, notes, discipline, searchParams])

  useEffect(() => {
    if (!sessionLoadedRef.current || !detailsHydratedRef.current || user) return
    const gymId = searchParams.get('gymId')
    if (!gymId) return
    writeGuestFlowSession(gymId, { checkin, checkout, guestCount, bookingFor })
  }, [user, checkin, checkout, guestCount, bookingFor, searchParams])

  useEffect(() => {
    if (isBookingDatesExpiredError(error) && checkin && !isBookingStartDateInPast(checkin)) {
      setError(null)
    }
  }, [checkin, error])

  /** Apply gym + package data to state and resolve variant/discipline */
  const applyGymPackageData = (
    gymData: any,
    packageData: any,
    variantId: string | null,
    savedDiscipline?: string | null
  ) => {
    setGym(gymData as Gym)
    setPackage_(packageData as Package)
    if (!savedDiscipline && gymData.disciplines?.length > 0) {
      setDiscipline(gymData.disciplines[0])
    }
    if (variantId && packageData.variants) {
      const v = packageData.variants.find((x: PackageVariant) => x.id === variantId)
      if (v) setVariant(v)
    }
  }

  /**
   * Background validation — runs after a prefill paint to silently confirm
   * gym/package data is still accurate. No UI block; updates state if changed.
   */
  const validateInBackground = async (
    gymId: string,
    packageId: string,
    variantId: string | null
  ) => {
    try {
      const supabase = createClient()
      const [{ data: gymData }, { data: packageData }] = await Promise.all([
        supabase
          .from('gyms')
          .select('*, images:gym_images(url, variants, order, focus_x, focus_y)')
          .eq('id', gymId)
          .single(),
        supabase
          .from('packages')
          .select('*, variants:package_variants(*)')
          .eq('id', packageId)
          .single(),
      ])
      if (gymData) setGym(gymData as Gym)
      if (packageData) {
        setPackage_(packageData as Package)
        if (variantId && packageData.variants) {
          const v = packageData.variants.find((x: PackageVariant) => x.id === variantId)
          if (v) setVariant(v)
        }
      }
    } catch {}
  }

  const fetchBookingData = async () => {
    const gymId = searchParams.get('gymId')
    const packageId = searchParams.get('packageId')
    const variantId = searchParams.get('variantId')

    if (!gymId || !packageId) {
      setError('Missing booking information')
      setLoading(false)
      return
    }

    // ── Fast path: prefill from review modal ──────────────────────────────────
    // The review modal writes gym + package data to sessionStorage before
    // navigating here. If the data matches this gymId + packageId we can render
    // immediately and validate in the background.
    const prefill = readBookingPrefill(gymId, packageId)
    if (prefill) {
      applyGymPackageData(prefill.gym, prefill.package_, variantId, null)
      setAverageRating(prefill.reviewAverage)
      setReviewCount(prefill.reviewCount)
      sessionLoadedRef.current = true
      setLoading(false)
      // Background fetch validates price/availability silently — no UI block
      validateInBackground(gymId, packageId, variantId)
      return
    }

    // ── Cold path: no prefill (direct URL, refresh, etc.) ────────────────────
    const supabase = createClient()

    const { data: gymData, error: gymError } = await supabase
      .from('gyms')
      .select('*, images:gym_images(url, variants, order, focus_x, focus_y)')
      .eq('id', gymId)
      .single()

    if (gymError || !gymData) {
      setError('Gym not found')
      setLoading(false)
      return
    }

    const { data: packageData, error: packageError } = await supabase
      .from('packages')
      .select('*, variants:package_variants(*)')
      .eq('id', packageId)
      .single()

    if (packageError || !packageData) {
      setError('Package not found')
      setLoading(false)
      return
    }

    applyGymPackageData(gymData, packageData, variantId, null)

    // Reviews fetched on cold path only (prefill path has them from the modal)
    const [{ data: bookingReviews }, { data: manualReviews }] = await Promise.all([
      supabase.from('bookings').select('id, reviews(rating)').eq('gym_id', gymId),
      supabase.from('reviews').select('rating').eq('gym_id', gymId).eq('manual_review', true),
    ])
    const allReviews = [
      ...(bookingReviews || []).flatMap((b: any) => b.reviews || []),
      ...(manualReviews || []),
    ]
    if (allReviews.length > 0) {
      const avg = allReviews.reduce((s: number, r: any) => s + r.rating, 0) / allReviews.length
      setAverageRating(avg)
      setReviewCount(allReviews.length)
    }

    sessionLoadedRef.current = true
    setLoading(false)
  }

  const duration = (checkin && checkout)
    ? Math.floor((new Date(checkout).getTime() - new Date(checkin).getTime()) / (1000 * 60 * 60 * 24))
    : 0

  const rangeIsNonNegative = duration >= 0
  const isTraining = package_?.type === 'training'
  const isAllInclusive = package_?.type === 'all_inclusive'
  const isValidDuration = isTraining ? rangeIsNonNegative : duration > 0
  const minStay = package_?.min_stay_days ?? (package_?.type === 'training' ? 1 : 7)
  const pricingDuration =
    package_ && isValidDuration && (isTraining || isAllInclusive)
      ? duration + 1
      : duration
  const durationForMinStay = package_?.type === 'training' ? pricingDuration : duration
  const meetsMinimumStay = !package_ || durationForMinStay >= minStay

  // Calculate price (sync fallback; seasonal-aware breakdown loaded in effect below)
  const priceInfo = (package_ && isValidDuration)
    ? calculatePackagePrice(pricingDuration, package_.type, {
        daily: variant ? variant.price_per_day : package_.price_per_day,
        weekly: variant ? variant.price_per_week : package_.price_per_week,
        monthly: variant ? variant.price_per_month : package_.price_per_month
      })
    : null

  useEffect(() => {
    if (!package_ || !isValidDuration || !checkin || !checkout) {
      setPriceBreakdown(null)
      setSeasonalNote(null)
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
          }
        : null,
      pricingDuration,
      checkin,
      checkout,
    }).then(({ breakdown, seasonalNote: note }) => {
      if (!cancelled) {
        setPriceBreakdown(breakdown)
        setSeasonalNote(note)
      }
    })

    return () => {
      cancelled = true
    }
  }, [package_, variant, checkin, checkout, isValidDuration, pricingDuration])

  const calculatedPriceBreakdown = priceBreakdown ?? priceInfo
  const totalPrice = calculatedPriceBreakdown?.price || 0
  const receiptStayCount = isTraining ? pricingDuration : duration
  const formatReceiptAmount = (amount: number) =>
    formatCheckoutPriceWithCode(convertPrice(amount, gym?.currency ?? 'USD'), selectedCurrency)

  const formatDate = (dateString: string) => {
    if (!dateString) return ''
    const date = new Date(dateString + 'T00:00:00') // Add time to avoid timezone issues
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`
  }

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

  const handleSubmit = async () => {
    if (!gym || !package_) return
    if (checkin && isBookingStartDateInPast(checkin)) {
      setError(BOOKING_DATES_EXPIRED_ERROR)
      return
    }
    if (!isValidDuration) {
      setError('Please select valid dates')
      return
    }
    if (!meetsMinimumStay) {
      setError(`This package requires a minimum stay of ${minStay} ${minStay === 1 ? 'day' : 'days'}`)
      return
    }
    if (!firstName || !lastName || !email || !phone) {
      setError('Please fill in all required personal details')
      return
    }

    setError(null)
    setSubmitting(true)

    try {
      // Create booking request (guest checkout - no auth required)
      const response = await fetch('/api/bookings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gym_id: gym.id,
          package_id: package_.id,
          package_variant_id: variant?.id || null,
          start_date: checkin,
          end_date: checkout,
          discipline: discipline || gym.disciplines?.[0] || null,
          experience_level: 'beginner',
          notes: notes || null,
          // Guest booking details
          guest_email: email,
          guest_phone: phone,
          guest_name: `${firstName} ${lastName}`,
        }),
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create booking')
      }

      if (!data.booking_id) {
        throw new Error('Booking was created but no booking ID was returned')
      }

      const bookingId = data.booking_id as string

      // Warm payment intent while navigating so step 3 overlay clears faster
      void fetch(`/api/bookings/${bookingId}/payment-intent`, { method: 'POST' })
        .then((res) => res.json())
        .then((intent) => {
          if (intent.client_secret) writePaymentIntentCache(bookingId, intent.client_secret)
        })
        .catch(() => {})

      router.replace(`/bookings/${bookingId}/payment`)
    } catch (err: any) {
      setError(err.message)
      setSubmitting(false)
    }
  }

  if (error && !gym) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Error</h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={() => router.back()}>Go Back</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // During loading the overlay covers the page shell.
  // Once loading finishes, if gym/package are still null show the overlay over a blank page.
  if (loading || !gym || !package_) {
    return (
      <div className="min-h-screen bg-white flex flex-col overflow-hidden">
        <LoadingOverlay show={true} />
        <CheckoutTopBar gym={gym} onBack={navigateBackToReview} />
        <CheckoutBottomBar
          error={error}
          submitting={submitting}
          disabled
          onSubmit={handleSubmit}
        />
      </div>
    )
  }

  const mainImage = gym.images && gym.images.length > 0 ? gym.images[0].url : null

  const submitDisabled =
    !isValidDuration ||
    !meetsMinimumStay ||
    !firstName ||
    !lastName ||
    !email ||
    !phone

  const datesExpired =
    isBookingDatesExpiredError(error) || (!!checkin && isBookingStartDateInPast(checkin))

  const goToGymListing = () => {
    if (!gym) return
    prepareCheckoutExitToGym(gym)
    showReviewChrome()
    router.replace(`/gyms/${gym.slug || gym.id}`)
  }

  return (
    <div className="min-h-screen bg-white flex flex-col overflow-hidden">
      <LoadingOverlay show={submitting} zClass="z-[60]" />
      <CheckoutTopBar gym={gym} onBack={navigateBackToReview} />

      <div className="flex-1 overflow-y-auto pb-36">
      <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
        {/* Mobile Layout */}
        <div className="md:hidden space-y-6">
          <CheckoutStepTitle>Your details</CheckoutStepTitle>

          {calculatedPriceBreakdown && isValidDuration && meetsMinimumStay && (
            <CheckoutReceiptBreakdown
              breakdown={calculatedPriceBreakdown}
              stayUnitCount={receiptStayCount}
              isTraining={isTraining}
              formatAmount={formatReceiptAmount}
              seasonalNote={seasonalNote}
            />
          )}

          {/* Compact gym summary + guest details — single card */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 pt-4 pb-3">
              <div className="flex gap-3 items-start">
                {mainImage ? (
                  <img src={mainImage} alt={gym.name} className="w-20 h-20 rounded-xl object-cover shrink-0" />
                ) : (
                  <div className="w-20 h-20 rounded-xl bg-gray-100 shrink-0" />
                )}
                <div className="pt-0.5 min-w-0 flex-1">
                  <p className="font-bold text-base text-gray-900 leading-snug line-clamp-2">{gym.name}</p>
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
                  {checkin && checkout && (
                    <p className="text-xs text-gray-600 mt-1">{formatDateRange(checkin, checkout)}</p>
                  )}
                  {datesExpired && (
                    <div className="mt-2">
                      <CheckoutSummaryFieldError>{BOOKING_DATES_EXPIRED_INLINE}</CheckoutSummaryFieldError>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {datesExpired && (
              <CheckoutDatesUnavailableAlert
                onGoToListing={goToGymListing}
                className="mx-4 mb-4"
              />
            )}

            <div className="border-t border-gray-100 px-4 pt-5 pb-4 space-y-5">
              <h2 className="text-lg font-semibold text-gray-900">Enter your details</h2>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName-mobile" className="text-sm font-medium">
                  First name <span className="text-red-600">*</span>
                </Label>
                <Input
                  id="firstName-mobile"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="h-11"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName-mobile" className="text-sm font-medium">
                  Last name <span className="text-red-600">*</span>
                </Label>
                <Input
                  id="lastName-mobile"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="h-11"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email-mobile" className="text-sm font-medium">
                Email address <span className="text-red-600">*</span>
              </Label>
              <Input
                id="email-mobile"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11"
                required
              />
              <p className="text-xs text-gray-500">Confirmation email goes to this address</p>
            </div>

            {/* Who are you booking for? - Moved under email */}
            <div className="space-y-2 pt-2">
              <Label className="text-sm font-medium">Who are you booking for? (optional)</Label>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="radio"
                    name="bookingFor-mobile"
                    value="self"
                    checked={bookingFor === 'self'}
                    onChange={(e) => setBookingFor(e.target.value as 'self' | 'other')}
                    className="w-4 h-4 text-[#003580] border-gray-300 focus:ring-[#003580]"
                  />
                  <span className="text-sm text-gray-700 group-hover:text-gray-900">I am the main guest</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="radio"
                    name="bookingFor-mobile"
                    value="other"
                    checked={bookingFor === 'other'}
                    onChange={(e) => setBookingFor(e.target.value as 'self' | 'other')}
                    className="w-4 h-4 text-[#003580] border-gray-300 focus:ring-[#003580]"
                  />
                  <span className="text-sm text-gray-700 group-hover:text-gray-900">Booking is for someone else</span>
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="country-mobile" className="text-sm font-medium">
                Country/region <span className="text-red-600">*</span>
              </Label>
              <Select
                id="country-mobile"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="h-11"
                required
              >
                <option value="Australia">Australia</option>
                <option value="United States">United States</option>
                <option value="United Kingdom">United Kingdom</option>
                <option value="Canada">Canada</option>
                <option value="Thailand">Thailand</option>
                <option value="Other">Other</option>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone-mobile" className="text-sm font-medium">
                Phone number <span className="text-red-600">*</span>
              </Label>
              <div className="flex gap-2">
                <Select className="w-32 h-11" value="AU">
                  <option value="AU">AU +61</option>
                  <option value="US">US +1</option>
                  <option value="UK">UK +44</option>
                  <option value="CA">CA +1</option>
                  <option value="TH">TH +66</option>
                </Select>
                <Input
                  id="phone-mobile"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="flex-1 h-11"
                  required
                />
              </div>
              <p className="text-xs text-gray-500">To verify your booking, and for the property to connect if needed</p>
            </div>

            {gym.disciplines && gym.disciplines.length > 1 && (
              <div className="space-y-2">
                <Label htmlFor="discipline-mobile" className="text-sm font-medium">
                  Discipline
                </Label>
                <Select
                  id="discipline-mobile"
                  value={discipline}
                  onChange={(e) => setDiscipline(e.target.value)}
                  className="h-11"
                >
                  <option value="">Select a discipline</option>
                  {DISCIPLINES.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </Select>
              </div>
            )}

            {/* Sign in to save details checkbox */}
            <div className="space-y-3 pt-2">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-1 w-4 h-4 text-[#003580] border-gray-300 rounded focus:ring-[#003580]"
                />
                <div>
                  <span className="text-sm text-gray-700">Sign in to save your details (optional)</span>
                  <p className="text-xs text-gray-500 mt-1">You'll also get free access to discounts and travel rewards</p>
                </div>
              </label>
            </div>

            </div>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden md:grid lg:grid-cols-[minmax(0,280px)_minmax(0,1fr)_minmax(0,300px)] gap-6 items-start">
          {/* Left Sidebar - Booking Summary */}
          <div className="lg:col-span-1 space-y-4">
            {/* Gym Summary Box */}
            <Card className="overflow-hidden border border-gray-300 rounded-lg shadow-sm">
              {mainImage && (
                <div className="w-full h-48 overflow-hidden">
                  <img src={mainImage} alt={gym.name} className="w-full h-full object-cover" />
                </div>
              )}
              <CardContent className="p-5">
                {/* Star Rating & Reviews */}
                {reviewCount > 0 && averageRating > 0 && (
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= Math.round(averageRating)
                              ? 'fill-[#febb02] text-[#febb02]'
                              : 'fill-gray-200 text-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-gray-600">
                      {averageRating.toFixed(1)} · {reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}
                    </span>
                  </div>
                )}
                
                <h3 className="font-bold text-xl mb-2 text-gray-900">{gym.name}</h3>
                
                {gym.address && (
                  <div 
                    onClick={copyAddress}
                    className="flex items-start gap-2 text-gray-700 text-sm mb-3 cursor-pointer group hover:text-[#003580] transition-colors"
                    title="Click to copy address"
                  >
                    <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span className="flex-1 font-medium group-hover:underline">
                      {gym.address}
                      {addressCopied && (
                        <span className="ml-2 text-green-600 text-xs">✓ Copied!</span>
                      )}
                    </span>
                  </div>
                )}
                {!gym.address && (
                  <div className="flex items-center gap-2 text-gray-700 text-sm mb-3 font-medium">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span>{gym.city}, {gym.country}</span>
                  </div>
                )}

                {/* Amenities */}
                {gym.amenities && (
                  <div className="flex flex-wrap gap-3 mb-3">
                    {gym.amenities.wifi && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-700">
                        <Wifi className="w-4 h-4" />
                        <span>Free WiFi</span>
                      </div>
                    )}
                    {gym.amenities.parking && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-700">
                        <Car className="w-4 h-4" />
                        <span>Parking</span>
                      </div>
                    )}
                    {gym.amenities.meals && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-700">
                        <UtensilsCrossed className="w-4 h-4" />
                        <span>Restaurant</span>
                      </div>
                    )}
                    {gym.amenities.showers && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-700">
                        <Droplets className="w-4 h-4" />
                        <span>Showers</span>
                      </div>
                    )}
                    {gym.amenities.accommodation && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-700">
                        <Building2 className="w-4 h-4" />
                        <span>Accommodation</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Disciplines */}
                {gym.disciplines && gym.disciplines.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200">
                  {gym.disciplines.slice(0, 2).map((d, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1 text-xs bg-gray-100 px-2 py-1 rounded">
                      <Dumbbell className="w-3 h-3 text-[#003580]" />
                      {d}
                    </span>
                  ))}
                </div>
                )}
              </CardContent>
            </Card>

            {/* Your Booking Details */}
            <Card className="border border-gray-300 rounded-lg shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold">Your booking details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Dates Side by Side */}
                <div className="space-y-3 pb-4 border-b border-gray-300">
                  <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Check-in</div>
                    <div className="font-semibold">{formatDate(checkin)}</div>
                    <div className="text-xs text-gray-600 mt-1">14:00 – 00:00</div>
                  </div>
                  <div className="border-l border-gray-300 pl-4">
                    <div className="text-xs text-gray-500 mb-1">Check-out</div>
                    <div className="font-semibold">{formatDate(checkout)}</div>
                    <div className="text-xs text-gray-600 mt-1">00:00 – 12:00</div>
                    </div>
                  </div>
                  {/* Change Dates Link - Above divider */}
                  <div>
                    <button
                      onClick={() => setDatePickerOpen(true)}
                      className="text-sm text-[#003580] hover:underline font-medium"
                    >
                      Change dates
                    </button>
                  </div>
                </div>
                
                <div>
                  <div className="text-xs text-gray-500 mb-1">Total length of stay:</div>
                  <div className="font-semibold">
                    {isTraining
                      ? `${pricingDuration} ${pricingDuration === 1 ? 'day' : 'days'}`
                      : `${duration} ${duration === 1 ? 'night' : 'nights'}`}
                    {priceInfo && ` (${calculatedPriceBreakdown?.durationLabel ?? priceInfo.durationLabel})`}
                  </div>
                </div>
                <div className="pt-3 border-t border-gray-300">
                  <div className="text-xs text-gray-500 mb-1">You selected</div>
                  <div className="font-semibold">
                    {guestCount} {guestCount === 1 ? 'guest' : 'guests'}
                    {package_ && ` • ${package_.name}`}
                    {variant && ` • ${variant.name}`}
                  </div>
                </div>
                <Link 
                  href={gymHrefWithOptionalDates(gym.slug || gym.id, {
                    checkin,
                    checkout,
                    datesConfirmed: true,
                  })}
                  className="block text-sm text-[#003580] hover:underline mt-3"
                >
                  Change your selection
                </Link>
              </CardContent>
            </Card>

          </div>

          {/* Center Column - User Details Form */}
          <div className="space-y-4">
            <div>
              <CheckoutStepTitle className="mb-3">Enter your details</CheckoutStepTitle>
              
              {/* Sign-in/Register Prompt */}
              <div className="mb-3 p-3 bg-gray-50 rounded-md border border-gray-300">
                <p className="text-sm text-gray-700">
                  Sign in to book with your saved details or{' '}
                  <Link href="/auth/signup" className="text-[#003580] hover:underline font-medium">register</Link>
                  {' '}to manage your bookings on the go!
                </p>
              </div>

            </div>

            {/* Personal Information */}
            <Card className="border border-gray-300 rounded-lg shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold">Enter your details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-sm font-medium">First name *</Label>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="h-11"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-sm font-medium">Last name *</Label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="h-11"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">Email address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11 max-w-[calc(50%-8px)]"
                    required
                  />
                  <p className="text-xs text-gray-500">Confirmation email goes to this address</p>
                </div>

                <div className="space-y-3 pt-2">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      className="mt-1 w-4 h-4 text-[#003580] border-gray-300 rounded focus:ring-[#003580]"
                    />
                    <div>
                      <span className="text-sm text-gray-700">Sign in to save your details (optional)</span>
                      <p className="text-xs text-gray-500 mt-1">You'll also get free access to discounts and travel rewards</p>
                    </div>
                  </label>
                </div>

                  <div className="space-y-2">
                  <Label htmlFor="country" className="text-sm font-medium">Country/region *</Label>
                    <Select
                      id="country"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                    className="h-11 max-w-[calc(50%-8px)]"
                      required
                    >
                      <option value="Australia">Australia</option>
                      <option value="United States">United States</option>
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="Canada">Canada</option>
                      <option value="Thailand">Thailand</option>
                      <option value="Other">Other</option>
                    </Select>
                  </div>

                  <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium">Phone number *</Label>
                  <div className="flex gap-2 max-w-[calc(50%-8px)]">
                    <Select className="w-32 h-11" value="AU">
                        <option value="AU">AU +61</option>
                        <option value="US">US +1</option>
                        <option value="UK">UK +44</option>
                      <option value="CA">CA +1</option>
                      <option value="TH">TH +66</option>
                      </Select>
                      <Input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      className="flex-1 h-11"
                        required
                      />
                  </div>
                  <p className="text-xs text-gray-500">To verify your booking, and for the property to connect if needed</p>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-300 pt-5 mt-2">
                  <div className="space-y-2 mb-4">
                    <Label className="text-sm font-medium">Who are you booking for? (optional)</Label>
                    <div className="space-y-3">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="radio"
                          name="bookingFor"
                          value="self"
                          checked={bookingFor === 'self'}
                          onChange={(e) => setBookingFor(e.target.value as 'self' | 'other')}
                          className="w-4 h-4 text-[#003580] border-gray-300 focus:ring-[#003580]"
                        />
                        <span className="text-sm text-gray-700 group-hover:text-gray-900">I am the main guest</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="radio"
                          name="bookingFor"
                          value="other"
                          checked={bookingFor === 'other'}
                          onChange={(e) => setBookingFor(e.target.value as 'self' | 'other')}
                          className="w-4 h-4 text-[#003580] border-gray-300 focus:ring-[#003580]"
                        />
                        <span className="text-sm text-gray-700 group-hover:text-gray-900">Booking is for someone else</span>
                      </label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Training Details */}
            <Card className="border border-gray-300 rounded-lg shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold">Training Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                  <div className="space-y-2">
                  <Label htmlFor="guests" className="text-sm font-medium">Number of Guests *</Label>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setGuestCount(Math.max(1, guestCount - 1))}
                      className="h-10 w-10"
                      >
                        -
                      </Button>
                      <Input
                        id="guests"
                        type="number"
                        min="1"
                        value={guestCount}
                        onChange={(e) => setGuestCount(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-20 text-center h-10"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setGuestCount(guestCount + 1)}
                      className="h-10 w-10"
                      >
                        +
                      </Button>
                    </div>
                  </div>

                  {gym.disciplines && gym.disciplines.length > 1 && (
                    <div className="space-y-2">
                      <Label htmlFor="discipline" className="text-sm font-medium">Discipline</Label>
                      <Select
                        id="discipline"
                        value={discipline}
                        onChange={(e) => setDiscipline(e.target.value)}
                        className="h-11"
                      >
                        <option value="">Select a discipline</option>
                        {DISCIPLINES.map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </Select>
                    </div>
                  )}

                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-sm font-medium">Special Requests (optional)</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                    placeholder="Any special requests or notes for the gym..."
                    className="resize-none"
                  />
                </div>
              </CardContent>
            </Card>


          </div>

          {/* Right column — pricing receipt (sticky) */}
          <div className="lg:sticky lg:top-6 space-y-4">
            {calculatedPriceBreakdown && isValidDuration && meetsMinimumStay ? (
              <CheckoutReceiptBreakdown
                breakdown={calculatedPriceBreakdown}
                stayUnitCount={receiptStayCount}
                isTraining={isTraining}
                formatAmount={formatReceiptAmount}
                seasonalNote={seasonalNote}
              />
            ) : (
              <Card className="border border-gray-300 rounded-lg shadow-sm">
                <CardContent className="p-5 text-sm text-gray-600">
                  {checkin && checkout
                    ? 'Select valid dates that meet the minimum stay to see pricing.'
                    : 'Select dates to see your pricing breakdown.'}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
      </div>

      <CheckoutBottomBar
        error={error}
        submitting={submitting}
        disabled={submitDisabled}
        onSubmit={handleSubmit}
      />

        {/* Date Picker Modal - Uses exact same DateRangePicker as homepage */}
        {datePickerOpen && (
        <>
          {/* Mobile: Add backdrop and let DateRangePicker handle its own bottom sheet (same as homepage) */}
          <div className="md:hidden fixed inset-0 z-[100]">
            <div
              className="fixed inset-0 bg-black/40 z-[45]"
              onClick={() => setDatePickerOpen(false)}
            />
            <div className="relative z-[50]">
              <DateRangePicker
                checkin={checkin}
                checkout={checkout}
                forceOpen={true}
                onClose={() => setDatePickerOpen(false)}
                onCheckinChange={(date) => {
                  setCheckin(date)
                  const params = new URLSearchParams(searchParams.toString())
                  params.set('checkin', date)
                  router.replace(`?${params.toString()}`, { scroll: false })
                }}
                onCheckoutChange={(date) => {
                  setCheckout(date)
                  const params = new URLSearchParams(searchParams.toString())
                  params.set('checkout', date)
                  router.replace(`?${params.toString()}`, { scroll: false })
                }}
              />
            </div>
          </div>

          {/* Desktop: Modal Style */}
          <Dialog open={datePickerOpen} onOpenChange={setDatePickerOpen}>
            <DialogContent className="hidden md:block max-w-2xl p-6">
              <DialogHeader>
                <DialogTitle>Change dates</DialogTitle>
              </DialogHeader>
              <div className="mt-4">
                <DateRangePicker
                  checkin={checkin}
                  checkout={checkout}
                  forceOpen={true}
                  onClose={() => setDatePickerOpen(false)}
                  onCheckinChange={(date) => {
                    setCheckin(date)
                    const params = new URLSearchParams(searchParams.toString())
                    params.set('checkin', date)
                    router.replace(`?${params.toString()}`, { scroll: false })
                  }}
                  onCheckoutChange={(date) => {
                    setCheckout(date)
                    const params = new URLSearchParams(searchParams.toString())
                    params.set('checkout', date)
                    router.replace(`?${params.toString()}`, { scroll: false })
                  }}
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <Button variant="outline" onClick={() => setDatePickerOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => setDatePickerOpen(false)}
                  className="bg-[#003580] hover:bg-[#003580]/90"
                >
                  Done
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </>
        )}
    </div>
  )
}

function SummaryPageSuspenseFallback() {
  return (
    <div className="min-h-screen bg-white">
      <LoadingOverlay show={true} />
    </div>
  )
}

export default function BookingSummaryPage() {
  return (
    <Suspense fallback={<SummaryPageSuspenseFallback />}>
      <BookingSummaryPageContent />
    </Suspense>
  )
}
