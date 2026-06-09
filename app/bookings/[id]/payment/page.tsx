'use client'

import { useEffect, useState, type ComponentProps, type ReactNode } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { loadStripe, type StripeError } from '@stripe/stripe-js'
import {
  Elements,
  ExpressCheckoutElement,
  PaymentElement,
  useStripe,
  useElements,
  type PaymentElementProps,
} from '@stripe/react-stripe-js'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useCurrency } from '@/lib/contexts/currency-context'
import type { Booking, Gym, Package, PackageVariant, GymImage } from '@/lib/types/database'
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Car,
  ChevronRight,
  CreditCard,
  Check,
  Dumbbell,
  Droplets,
  MapPin,
  Star,
  UtensilsCrossed,
  Wifi,
  X,
} from 'lucide-react'
import Link from 'next/link'
import { calculatePackagePrice } from '@/lib/utils'
import { BookingProgressBar } from '@/components/booking-progress-bar'
import { PaymentHoldExplainer } from '@/components/payment-hold-explainer'
import { BookingTrustLine } from '@/components/booking-trust-line'
import { BookingWhatsIncluded } from '@/components/booking/booking-whats-included'
import { BookingSafetyPolicies } from '@/components/booking/booking-safety-policies'
import { GoodToKnowCard } from '@/components/good-to-know-card'
import { LoadingOverlay } from '@/components/loading-overlay'
import {
  readBookingPrefill,
  readPaymentIntentCache,
  clearPaymentIntentCache,
} from '@/lib/utils/booking-prefill'
import { clearGuestCheckoutSession } from '@/lib/utils/checkout-details-prefill'
import {
  CheckoutSummaryRow,
  StepProgressBar,
  formatCheckoutAmountOnly,
  formatCheckoutDateRange,
} from '@/components/booking/checkout-ui'
import { PriceDetailsSheet } from '@/components/booking/price-details-sheet'
import {
  PaymentMethodPicker,
  type PaymentMethodChoice,
} from '@/components/booking/payment-method-picker'
import {
  CardBrandLogosRow,
  PaymentMethodMark,
} from '@/components/booking/payment-brand-logos'

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null

const PAYMENT_FORM_ID = 'payment-checkout-form'

const CARD_ELEMENT_OPTIONS: PaymentElementProps['options'] = {
  wallets: {
    applePay: 'never',
    googlePay: 'never',
  },
}

/** Stripe.js runtime supports paymentMethods; @stripe/stripe-js 2.x types are narrower */
type WalletExpressOptions = {
  paymentMethods: {
    applePay: 'always' | 'never' | 'auto'
    googlePay: 'always' | 'never' | 'auto'
    link: 'never'
    paypal: 'never'
  }
  paymentMethodOrder: string[]
  wallets: {
    applePay: 'always' | 'never' | 'auto'
    googlePay: 'always' | 'never' | 'auto'
  }
}

function walletExpressOptions(method: PaymentMethodChoice): WalletExpressOptions {
  if (method === 'apple_pay') {
    return {
      paymentMethods: {
        applePay: 'always',
        googlePay: 'never',
        link: 'never',
        paypal: 'never',
      },
      paymentMethodOrder: ['apple_pay'],
      wallets: { applePay: 'always', googlePay: 'never' },
    }
  }
  return {
    paymentMethods: {
      applePay: 'never',
      googlePay: 'always',
      link: 'never',
      paypal: 'never',
    },
    paymentMethodOrder: ['google_pay'],
    wallets: { applePay: 'never', googlePay: 'always' },
  }
}

/** Keep off-screen Stripe iframes at real size — squishing to 1px causes bleed/blur over our logos */
const CARD_ELEMENT_OFFSCREEN_CLASS =
  'fixed top-0 -left-[10000px] z-0 w-[min(100%,28rem)] max-w-md opacity-0 pointer-events-none overflow-hidden'

const PAYMENT_METHOD_LABELS: Record<PaymentMethodChoice, string> = {
  card: 'Credit or debit card',
  apple_pay: 'Apple Pay',
  google_pay: 'Google Pay',
}

type PaymentModalStep = 'pick' | 'card-details'

function PaymentMethodSheet({
  open,
  onClose,
  onCancel,
  title,
  primaryLabel,
  onPrimary,
  children,
}: {
  open: boolean
  onClose: () => void
  onCancel: () => void
  title: string
  primaryLabel: 'Next' | 'Done'
  onPrimary: () => void
  children: ReactNode
}) {
  return (
    <div
      className={`md:hidden fixed inset-0 z-[300] transition-opacity duration-200 ${
        open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
      aria-hidden={!open}
    >
      <button
        type="button"
        aria-label="Close"
        tabIndex={open ? 0 : -1}
        className="fixed inset-0 bg-black/50 z-[301]"
        onClick={onClose}
      />
      <div
        className={`fixed inset-x-0 top-[4%] bottom-0 z-[302] flex flex-col rounded-t-2xl bg-white shadow-2xl transition-transform duration-200 ${
          open ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>
        <div className="flex items-start justify-between gap-4 px-6 pt-2 pb-5 flex-shrink-0">
          <h2 className="text-[22px] font-semibold leading-tight text-gray-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            tabIndex={open ? 0 : -1}
            className="w-8 h-8 -mr-1 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors shrink-0"
            aria-label="Close"
          >
            <X className="w-4 h-4 text-gray-800" />
          </button>
        </div>
        <div className="flex-1 flex flex-col min-h-0 px-6">{children}</div>
        <div
          className="flex items-center justify-between gap-4 px-6 py-4 border-t border-gray-100 flex-shrink-0"
          style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
        >
          <button
            type="button"
            onClick={onCancel}
            tabIndex={open ? 0 : -1}
            className="text-sm font-semibold text-gray-900 py-1.5 hover:text-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onPrimary}
            tabIndex={open ? 0 : -1}
            className="h-11 px-6 text-sm font-semibold rounded-xl bg-gray-900 hover:bg-gray-800 text-white transition-colors"
          >
            {primaryLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

function PaymentCheckoutTopBar({
  onBack,
  onExit,
}: {
  onBack: () => void
  onExit: () => void
}) {
  return (
    <div className="flex items-center justify-between px-5 pt-4 pb-2 flex-shrink-0">
      <button
        type="button"
        onClick={onBack}
        aria-label="Back to your details"
        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 text-gray-900" />
      </button>
      <button
        type="button"
        onClick={onExit}
        aria-label="Return to gym listing"
        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
      >
        <X className="w-4 h-4 text-gray-900" />
      </button>
    </div>
  )
}

function CheckoutForm({
  booking,
  formId = PAYMENT_FORM_ID,
  onLoadingChange,
  onErrorChange,
  hideMobileSubmit = false,
  mobilePaymentModalOpen = false,
  onCloseMobilePaymentModal,
  paymentFieldsMounted = false,
  selectedPaymentMethod = 'card',
  onPaymentMethodChange,
  paymentModalStep = 'pick',
  draftPaymentMethod = 'card',
  onDraftPaymentMethodChange,
  onPaymentModalStepChange,
  onCardFieldsMounted,
  cardFieldsMounted = false,
}: {
  booking: Booking & { gym: Gym }
  formId?: string
  onLoadingChange?: (loading: boolean) => void
  onErrorChange?: (error: string | null) => void
  hideMobileSubmit?: boolean
  mobilePaymentModalOpen?: boolean
  onCloseMobilePaymentModal?: () => void
  /** Keep Stripe elements mounted after the modal is first opened */
  paymentFieldsMounted?: boolean
  selectedPaymentMethod?: PaymentMethodChoice
  onPaymentMethodChange?: (method: PaymentMethodChoice) => void
  paymentModalStep?: PaymentModalStep
  draftPaymentMethod?: PaymentMethodChoice
  onDraftPaymentMethodChange?: (method: PaymentMethodChoice) => void
  onPaymentModalStepChange?: (step: PaymentModalStep) => void
  onCardFieldsMounted?: () => void
  cardFieldsMounted?: boolean
}) {
  const router = useRouter()
  const params = useParams()
  const bookingId = params.id as string
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [walletAvailable, setWalletAvailable] = useState<boolean | null>(null)

  useEffect(() => {
    setWalletAvailable(null)
  }, [selectedPaymentMethod])

  const completePayment = async (paymentIntent: { id: string; status: string }) => {
    try {
      const confirmRes = await fetch(`/api/bookings/${bookingId}/confirm-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_intent: paymentIntent.id }),
      })
      const confirmData = await confirmRes.json()
      if (!confirmRes.ok) {
        const msg = confirmData?.error || 'Failed to finalize booking. Please contact support.'
        setError(msg)
        onErrorChange?.(msg)
        setLoading(false)
        onLoadingChange?.(false)
        return
      }

      router.replace(
        `/bookings/${bookingId}/success?payment_intent=${encodeURIComponent(paymentIntent.id)}&redirect_status=${encodeURIComponent(paymentIntent.status)}`
      )
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Failed to finalize booking. Please contact support.'
      setError(msg)
      onErrorChange?.(msg)
      setLoading(false)
      onLoadingChange?.(false)
    }
  }

  const handlePaymentResult = async (
    confirmError: StripeError | null,
    paymentIntent: { id: string; status: string } | undefined
  ) => {
    if (confirmError) {
      const msg = confirmError.message || 'Payment failed'
      setError(msg)
      onErrorChange?.(msg)
      setLoading(false)
      onLoadingChange?.(false)
      return
    }

    if (
      paymentIntent &&
      (paymentIntent.status === 'requires_capture' || paymentIntent.status === 'succeeded')
    ) {
      await completePayment(paymentIntent)
      return
    }

    setLoading(false)
    onLoadingChange?.(false)
  }

  const handleWalletConfirm = async (event: {
    paymentFailed: (payload?: { reason?: 'fail' | 'invalid_shipping_address' }) => void
  }) => {
    if (!stripe || !elements) return

    setLoading(true)
    onLoadingChange?.(true)
    setError(null)
    onErrorChange?.(null)

    const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/bookings/${bookingId}/success`,
      },
      redirect: 'if_required',
    })

    if (confirmError) {
      event.paymentFailed({ reason: 'fail' })
    }

    await handlePaymentResult(confirmError ?? null, paymentIntent)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) return

    if (hideMobileSubmit && selectedPaymentMethod !== 'card') {
      return
    }

    setLoading(true)
    onLoadingChange?.(true)
    setError(null)
    onErrorChange?.(null)

    const { error: submitError } = await elements.submit()
    if (submitError) {
      const msg = submitError.message || 'Payment form error'
      setError(msg)
      onErrorChange?.(msg)
      setLoading(false)
      onLoadingChange?.(false)
      return
    }

    const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/bookings/${bookingId}/success`,
      },
      redirect: 'if_required',
    })

    await handlePaymentResult(confirmError ?? null, paymentIntent)
  }

  const modalPrimaryLabel: 'Next' | 'Done' =
    paymentModalStep === 'card-details'
      ? 'Done'
      : draftPaymentMethod === 'card'
        ? 'Next'
        : 'Done'

  const handleModalPrimary = () => {
    if (paymentModalStep === 'pick') {
      if (draftPaymentMethod === 'card') {
        onPaymentMethodChange?.('card')
        onCardFieldsMounted?.()
        onPaymentModalStepChange?.('card-details')
        return
      }
      onPaymentMethodChange?.(draftPaymentMethod)
      onCloseMobilePaymentModal?.()
      return
    }
    onCloseMobilePaymentModal?.()
  }

  const handleModalCancel = () => {
    onDraftPaymentMethodChange?.(selectedPaymentMethod)
    onPaymentModalStepChange?.('pick')
    onCloseMobilePaymentModal?.()
  }

  const showCardElementInModal =
    paymentFieldsMounted &&
    cardFieldsMounted &&
    selectedPaymentMethod === 'card' &&
    mobilePaymentModalOpen &&
    paymentModalStep === 'card-details'

  const showCardElementOffscreen =
    paymentFieldsMounted &&
    cardFieldsMounted &&
    selectedPaymentMethod === 'card' &&
    !mobilePaymentModalOpen

  if (hideMobileSubmit) {
    return (
      <>
        <form id={formId} onSubmit={handleSubmit}>
          {showCardElementOffscreen && (
            <div className={CARD_ELEMENT_OFFSCREEN_CLASS} aria-hidden>
              <PaymentElement options={CARD_ELEMENT_OPTIONS} />
            </div>
          )}
          {paymentFieldsMounted && (
            <PaymentMethodSheet
              open={mobilePaymentModalOpen}
              onClose={handleModalCancel}
              onCancel={handleModalCancel}
              title={paymentModalStep === 'card-details' ? 'Add card details' : 'Pay with'}
              primaryLabel={modalPrimaryLabel}
              onPrimary={handleModalPrimary}
            >
              {paymentModalStep === 'pick' ? (
                <>
                  <div className="relative z-10 flex-shrink-0">
                    <PaymentMethodPicker
                      value={draftPaymentMethod}
                      onChange={(method) => onDraftPaymentMethodChange?.(method)}
                    />
                  </div>
                  <div className="flex-1 min-h-0" aria-hidden />
                </>
              ) : (
                <div className="relative z-10 flex-shrink-0 overflow-y-auto space-y-3 pb-4">
                  <p className="text-sm text-gray-600">
                    You&apos;ll pay when you complete this booking.
                  </p>
                  {showCardElementInModal && (
                    <PaymentElement options={CARD_ELEMENT_OPTIONS} />
                  )}
                </div>
              )}
              {error && (
                <div className="mt-3 p-3 bg-red-50 text-red-800 rounded-md text-sm">{error}</div>
              )}
            </PaymentMethodSheet>
          )}
        </form>
        {paymentFieldsMounted &&
          !mobilePaymentModalOpen &&
          selectedPaymentMethod !== 'card' && (
            <div className="mt-2 space-y-2">
              <ExpressCheckoutElement
                key={selectedPaymentMethod}
                onConfirm={handleWalletConfirm}
                onReady={(event) => {
                  const available =
                    selectedPaymentMethod === 'apple_pay'
                      ? event.availablePaymentMethods?.applePay
                      : event.availablePaymentMethods?.googlePay
                  setWalletAvailable(available ?? false)
                }}
                options={
                  walletExpressOptions(selectedPaymentMethod) as unknown as NonNullable<
                    ComponentProps<typeof ExpressCheckoutElement>['options']
                  >
                }
              />
              {walletAvailable === false && (
                <p className="text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  {selectedPaymentMethod === 'apple_pay'
                    ? 'Apple Pay is not available in this browser. Use Safari on an iPhone, iPad, or Mac, or choose another payment method.'
                    : 'Google Pay is not available on this device. Choose another payment method.'}
                </p>
              )}
            </div>
          )}
      </>
    )
  }

  return (
    <form id={formId} onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
      <div className="space-y-3 md:space-y-4">
        {(booking as any).package && booking.start_date && (
          <BookingTrustLine
            pkg={(booking as any).package}
            gym={booking.gym}
            checkin={booking.start_date}
            className="mb-1"
          />
        )}
        <p className="text-sm text-gray-600">You&apos;ll pay when you complete this booking.</p>
        <PaymentElement
          options={{
            wallets: { applePay: 'auto', googlePay: 'auto' },
          }}
        />
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-800 rounded-md text-sm">{error}</div>
      )}

      {/* Desktop: Inline button */}
      <div className="hidden md:block">
        <Button 
          type="submit" 
          className="w-full h-14 text-lg font-bold bg-[#003580] hover:bg-[#003580]/90" 
          disabled={!stripe || loading}
        >
          {loading ? 'Processing...' : (
            <>
              Confirm Booking
              <ArrowRight className="w-5 h-5 ml-2" />
            </>
          )}
        </Button>
        <PaymentHoldExplainer />
      </div>
    </form>
  )
}

type BookingWithExtras = Booking & {
  gym: Gym & { images?: GymImage[]; averageRating?: number; reviewCount?: number }
  package?: Package
  variant?: PackageVariant
}

export default function PaymentPage() {
  const params = useParams()
  const router = useRouter()
  const { convertPrice, formatPrice, selectedCurrency } = useCurrency()
  const bookingId = params.id as string
  const [clientSecret, setClientSecret] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null
    return readPaymentIntentCache(bookingId)
  })
  const [booking, setBooking] = useState<BookingWithExtras | null>(() => {
    // Synchronously seed from prefill so the page has real content under the
    // overlay while the PaymentIntent fetch runs. The real booking from the
    // server replaces this silently once it arrives.
    if (typeof window === 'undefined') return null
    try {
      const raw = sessionStorage.getItem('booking_prefill')
      if (!raw) return null
      const prefill = JSON.parse(raw)
      const gym = prefill.gym as Record<string, any>
      const pkg = prefill.package_ as Record<string, any>
      if (!gym || !pkg) return null
      return {
        id: '', // filled by server
        gym_id: prefill.gymId,
        package_id: prefill.packageId,
        package_variant_id: prefill.variantId ?? null,
        start_date: prefill.checkin,
        end_date: prefill.checkout,
        total_price: 0, // server-confirmed value replaces this
        status: 'pending',
        gym: {
          ...gym,
          averageRating: prefill.reviewAverage,
          reviewCount: prefill.reviewCount,
        } as Gym & { averageRating?: number; reviewCount?: number },
        package: pkg as Package,
      } as unknown as BookingWithExtras
    } catch {
      return null
    }
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [addressCopied, setAddressCopied] = useState(false)
  const [priceSheetOpen, setPriceSheetOpen] = useState(false)
  const [paymentMethodOpen, setPaymentMethodOpen] = useState(false)
  const [paymentModalStep, setPaymentModalStep] = useState<PaymentModalStep>('pick')
  const [draftPaymentMethod, setDraftPaymentMethod] = useState<PaymentMethodChoice>('card')
  const [cardFieldsMounted, setCardFieldsMounted] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<PaymentMethodChoice>('card')

  const openPaymentMethodModal = () => {
    setDraftPaymentMethod(selectedPaymentMethod)
    setPaymentModalStep('pick')
    setPaymentMethodOpen(true)
  }

  const closePaymentMethodModal = () => {
    setPaymentMethodOpen(false)
    setPaymentModalStep('pick')
  }
  const [payLoading, setPayLoading] = useState(false)
  const [payError, setPayError] = useState<string | null>(null)

  useEffect(() => {
    fetchBookingAndPaymentIntent()
  }, [bookingId])

  const fetchBookingAndPaymentIntent = async () => {
    try {
      let resolvedSecret = clientSecret

      if (!resolvedSecret) {
        const cached = readPaymentIntentCache(bookingId)
        if (cached) {
          resolvedSecret = cached
          setClientSecret(cached)
        }
      }

      if (!resolvedSecret) {
        const response = await fetch(`/api/bookings/${bookingId}/payment-intent`, {
          method: 'POST',
        })

        const data = await response.json()

        if (!response.ok) {
          console.error('Error creating payment intent:', data.error, data.details)
          let errorMessage = 'Failed to load payment details'
          if (data.error?.includes('not configured') || data.error?.includes('API key')) {
            errorMessage = 'Payment system is not configured. Please contact support to complete your booking.'
          } else if (data.error) {
            errorMessage = data.error
          }
          setError(errorMessage)
          setLoading(false)
          return
        }

        resolvedSecret = data.client_secret
        setClientSecret(data.client_secret)
      }

      if (resolvedSecret) clearPaymentIntentCache(bookingId)

      // Fetch booking details via API (handles RLS properly)
      const bookingResponse = await fetch(`/api/bookings/${bookingId}`)
      if (bookingResponse.ok) {
        const bookingApiData = await bookingResponse.json()
        
        // Fetch reviews for rating if gym_id is available
        if (bookingApiData.gym?.id) {
          const supabase = createClient()
          const { data: bookingReviews } = await supabase
            .from('bookings')
            .select('id, reviews(rating)')
            .eq('gym_id', bookingApiData.gym.id)

          const { data: manualReviews } = await supabase
            .from('reviews')
            .select('rating')
            .eq('gym_id', bookingApiData.gym.id)
            .eq('manual_review', true)

          const allReviews = [
            ...(bookingReviews || []).flatMap((b: any) => b.reviews || []),
            ...(manualReviews || [])
          ]

          if (allReviews.length > 0) {
            const avg = allReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / allReviews.length
            bookingApiData.gym.averageRating = avg
            bookingApiData.gym.reviewCount = allReviews.length
          }
        }
        
        setBooking((prev) => {
          const prefillData =
            bookingApiData.gym_id && bookingApiData.package_id
              ? readBookingPrefill(bookingApiData.gym_id, bookingApiData.package_id)
              : null
          const prefillGym = prefillData?.gym as { images?: GymImage[] } | undefined
          const prevImages = prev?.gym?.images
          const mergedImages =
            bookingApiData.gym?.images?.length > 0
              ? bookingApiData.gym.images
              : prevImages?.length
                ? prevImages
                : prefillGym?.images

          return {
            ...bookingApiData,
            gym: {
              ...bookingApiData.gym,
              images: mergedImages,
              averageRating:
                bookingApiData.gym.averageRating ??
                prev?.gym?.averageRating ??
                prefillData?.reviewAverage,
              reviewCount:
                bookingApiData.gym.reviewCount ??
                prev?.gym?.reviewCount ??
                prefillData?.reviewCount,
            },
            package: bookingApiData.package ?? prev?.package,
          } as BookingWithExtras
        })
      } else {
        const errorData = await bookingResponse.json()
        console.error('Error fetching booking details:', errorData)
        setError(`Failed to load booking details: ${errorData.error || 'Unknown error'}`)
      }

      setLoading(false)
    } catch (err: any) {
      console.error('Error in fetchBookingAndPaymentIntent:', err)
      setError(err.message || 'Failed to load payment page')
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return ''
    const date = new Date(dateString + 'T00:00:00')
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`
  }

  const duration = booking
    ? Math.floor((new Date(booking.end_date).getTime() - new Date(booking.start_date).getTime()) / (1000 * 60 * 60 * 24))
    : 0
  const isTraining = booking?.package?.type === 'training'
  const displayDuration = isTraining ? Math.max(1, duration + 1) : duration

  const copyAddress = async () => {
    if (!booking?.gym?.address) return
    try {
      await navigator.clipboard.writeText(booking.gym.address)
      setAddressCopied(true)
      setTimeout(() => setAddressCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy address:', err)
    }
  }


  // Hard error only — missing clientSecret while loading is normal and
  // handled by the overlay + conditional Elements render below.
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="mb-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CreditCard className="w-8 h-8 text-red-600" />
                </div>
                <h2 className="text-xl font-bold mb-2">Payment Unavailable</h2>
                <p className="text-gray-600 mb-2">{error}</p>
                {error.includes('not configured') && (
                  <p className="text-sm text-gray-500 mt-2">
                    The payment system needs to be set up. Please contact support or try again later.
                  </p>
                )}
              </div>
              <div className="flex gap-3 justify-center">
                <Button onClick={() => router.back()} variant="outline">Go Back</Button>
                <Button onClick={() => window.location.reload()}>Try Again</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }


  const options = clientSecret
    ? { clientSecret, appearance: { theme: 'stripe' as const } }
    : undefined

  const prefill =
    booking?.gym_id && booking.package_id
      ? readBookingPrefill(booking.gym_id, booking.package_id)
      : null

  const gymImages =
    booking?.gym?.images?.length
      ? booking.gym.images
      : (prefill?.gym as { images?: GymImage[] } | undefined)?.images

  const mainImage =
    gymImages && gymImages.length > 0
      ? [...gymImages].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))[0].url
      : null
  const guestCount = prefill?.guestCount ?? 1
  const gymCurrency = booking?.gym?.currency ?? 'USD'

  const priceInfo =
    booking?.package && displayDuration > 0
      ? calculatePackagePrice(displayDuration, booking.package.type, {
          daily: booking.variant?.price_per_day ?? booking.package.price_per_day,
          weekly: booking.variant?.price_per_week ?? booking.package.price_per_week,
          monthly: booking.variant?.price_per_month ?? booking.package.price_per_month,
        })
      : null

  // Prefer the server-confirmed total; fall back to a local recalculation from
  // prefill data so the price display is never "0" while loading.
  const serverTotal = booking?.total_price ?? 0
  const rawTotal = serverTotal > 0 ? serverTotal : (priceInfo?.price ?? 0)
  const displayTotalPrice = rawTotal > 0 ? convertPrice(rawTotal, gymCurrency) : null

  const step2Url = booking
    ? `/bookings/summary?gymId=${booking.gym_id}&packageId=${booking.package_id}${booking.package_variant_id ? `&variantId=${booking.package_variant_id}` : ''}&checkin=${booking.start_date}&checkout=${booking.end_date}&guests=${guestCount}`
    : '#'
  const gymListingHref = booking ? `/gyms/${booking.gym.slug || booking.gym.id}` : '#'

  const handleExitToGym = () => {
    if (booking?.gym_id) clearGuestCheckoutSession(booking.gym_id)
    try { sessionStorage.removeItem('review_modal_restore') } catch {}
    try { sessionStorage.removeItem('booking_prefill') } catch {}
    router.replace(gymListingHref)
  }

  // During loading or while booking is null the overlay covers the page.
  // We still render the shell so the page isn't blank underneath the blur.
  if (!booking) {
    return (
      <div className="min-h-screen bg-white flex flex-col overflow-hidden">
        <LoadingOverlay show={true} />
        <div className="hidden md:block">
          <BookingProgressBar currentStep={3} />
        </div>
        <PaymentCheckoutTopBar onBack={() => router.back()} onExit={() => router.back()} />
        <div
          className="md:hidden fixed bottom-0 left-0 right-0 border-t border-gray-100 bg-white px-4 pt-2 z-50"
          style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
        >
          <StepProgressBar step={3} />
        </div>
      </div>
    )
  }

  const reviewCount = booking.gym.reviewCount ?? 0
  const averageRating = booking.gym.averageRating ?? 0

  return (
    <div className="min-h-screen bg-white flex flex-col overflow-hidden">
      <LoadingOverlay show={loading || !clientSecret} />

      <div className="hidden md:block">
        <BookingProgressBar currentStep={3} />
      </div>

      <div className="md:hidden flex-shrink-0">
        <PaymentCheckoutTopBar
          onBack={() => router.replace(step2Url)}
          onExit={handleExitToGym}
        />
      </div>

      <div className="hidden md:flex max-w-7xl mx-auto w-full px-4 pt-3 pb-1 items-center justify-between">
        <button
          type="button"
          onClick={() => router.replace(step2Url)}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
        <Link
          href={gymListingHref}
          onClick={() => {
            if (booking.gym_id) clearGuestCheckoutSession(booking.gym_id)
            try { sessionStorage.removeItem('review_modal_restore') } catch {}
            try { sessionStorage.removeItem('booking_prefill') } catch {}
          }}
          className="rounded-full p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          aria-label="Return to gym listing"
        >
          <X className="w-5 h-5" />
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto pb-36 md:pb-0">
        {/* Mobile Layout */}
        <div className="md:hidden px-4 py-6 space-y-6">
          <h1 className="text-2xl font-bold text-gray-900">Confirm and pay</h1>

          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 pt-4 pb-3 border-b border-gray-100">
              <div className="flex gap-3 items-start">
                {mainImage ? (
                  <img src={mainImage} alt={booking.gym.name} className="w-20 h-20 rounded-xl object-cover shrink-0" />
                ) : (
                  <div className="w-20 h-20 rounded-xl bg-gray-100 shrink-0" />
                )}
                <div className="pt-0.5 min-w-0 flex-1">
                  <p className="font-bold text-base text-gray-900 leading-snug line-clamp-2">{booking.gym.name}</p>
                  <div className="flex items-center gap-4 mt-1">
                    {reviewCount > 0 && averageRating > 0 && (
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 fill-gray-900 text-gray-900" />
                        <span className="text-xs font-medium text-gray-800">{averageRating.toFixed(1)}</span>
                        <span className="text-xs text-gray-500">({reviewCount})</span>
                      </div>
                    )}
                    {booking.package && (
                      <span className="text-xs text-gray-600 font-medium">{booking.package.name}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="divide-y divide-gray-100 px-4">
              <CheckoutSummaryRow
                label="Dates"
                value={formatCheckoutDateRange(booking.start_date, booking.end_date)}
                onEdit={() => router.replace(step2Url)}
              />
              <CheckoutSummaryRow
                label="Guests"
                value={`${guestCount} ${guestCount === 1 ? 'adult' : 'adults'}`}
                onEdit={() => router.replace(step2Url)}
              />
              <CheckoutSummaryRow
                label="Total price"
                value={
                  displayTotalPrice != null ? (
                    <span className="inline-flex items-baseline gap-1">
                      <span>{formatCheckoutAmountOnly(displayTotalPrice, selectedCurrency)}</span>
                      <span className="font-semibold text-gray-900 underline">{selectedCurrency}</span>
                    </span>
                  ) : (
                    'Calculating…'
                  )
                }
                onEdit={priceInfo && rawTotal > 0 ? () => setPriceSheetOpen(true) : undefined}
                editLabel="Details"
              />
              {booking.package && booking.start_date && (
                <div className="py-3">
                  <BookingTrustLine
                    pkg={booking.package as any}
                    gym={booking.gym}
                    checkin={booking.start_date}
                    variant="featured"
                  />
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={openPaymentMethodModal}
            disabled={!clientSecret}
            className="w-full border border-gray-200 rounded-xl px-4 py-4 text-left flex items-center justify-between gap-4 disabled:opacity-60 transition-colors hover:bg-gray-50 active:bg-gray-100"
          >
            <div className="min-w-0">
              <div className="text-sm font-semibold text-gray-900 mb-2">Payment method</div>
              <div className="flex items-start gap-2.5 text-sm text-gray-600">
                <PaymentMethodMark method={selectedPaymentMethod} className="shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <div>{PAYMENT_METHOD_LABELS[selectedPaymentMethod]}</div>
                  {selectedPaymentMethod === 'card' && (
                    <CardBrandLogosRow className="mt-1.5" />
                  )}
                </div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-900 shrink-0" />
          </button>

          {clientSecret && stripePromise ? (
            <Elements stripe={stripePromise} options={options}>
              <CheckoutForm
                booking={booking}
                onLoadingChange={setPayLoading}
                onErrorChange={setPayError}
                hideMobileSubmit
                mobilePaymentModalOpen={paymentMethodOpen}
                onCloseMobilePaymentModal={closePaymentMethodModal}
                paymentFieldsMounted
                selectedPaymentMethod={selectedPaymentMethod}
                onPaymentMethodChange={setSelectedPaymentMethod}
                paymentModalStep={paymentModalStep}
                draftPaymentMethod={draftPaymentMethod}
                onDraftPaymentMethodChange={setDraftPaymentMethod}
                onPaymentModalStepChange={setPaymentModalStep}
                onCardFieldsMounted={() => setCardFieldsMounted(true)}
                cardFieldsMounted={cardFieldsMounted}
              />
            </Elements>
          ) : null}
        </div>

      {/* Desktop Layout */}
      <div className="hidden md:block max-w-7xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Sidebar - Booking Summary */}
          <div className="lg:col-span-1 space-y-4">
            {/* Gym Summary Box */}
            <Card className="overflow-hidden border border-gray-300 rounded-lg shadow-sm">
              {mainImage && (
                <div className="w-full h-48 overflow-hidden">
                  <img src={mainImage} alt={booking.gym.name} className="w-full h-full object-cover" />
                </div>
              )}
              <CardContent className="p-5">
                {/* Star Rating & Reviews */}
                {booking.gym.reviewCount && booking.gym.reviewCount > 0 && booking.gym.averageRating && booking.gym.averageRating > 0 && (
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= Math.round(booking.gym.averageRating || 0)
                              ? 'fill-[#febb02] text-[#febb02]'
                              : 'fill-gray-200 text-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-gray-600">
                      {booking.gym.averageRating.toFixed(1)} · {booking.gym.reviewCount} {booking.gym.reviewCount === 1 ? 'review' : 'reviews'}
                    </span>
                  </div>
                )}
                
                <h3 className="font-bold text-xl mb-2 text-gray-900">{booking.gym.name}</h3>
                
                {booking.gym.address && (
                  <div 
                    onClick={copyAddress}
                    className="flex items-start gap-2 text-gray-700 text-sm mb-3 cursor-pointer group hover:text-[#003580] transition-colors"
                    title="Click to copy address"
                  >
                    <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span className="flex-1 font-medium group-hover:underline">
                      {booking.gym.address}
                      {addressCopied && (
                        <span className="ml-2 text-green-600 text-xs">✓ Copied!</span>
                      )}
                    </span>
                  </div>
                )}
                {!booking.gym.address && (
                  <div className="flex items-center gap-2 text-gray-700 text-sm mb-3 font-medium">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span>{booking.gym.city}, {booking.gym.country}</span>
                  </div>
                )}

                {/* Amenities */}
                {booking.gym.amenities && (
                  <div className="flex flex-wrap gap-3 mb-3">
                    {booking.gym.amenities.wifi && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-700">
                        <Wifi className="w-4 h-4" />
                        <span>Free WiFi</span>
                      </div>
                    )}
                    {booking.gym.amenities.parking && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-700">
                        <Car className="w-4 h-4" />
                        <span>Parking</span>
                      </div>
                    )}
                    {booking.gym.amenities.meals && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-700">
                        <UtensilsCrossed className="w-4 h-4" />
                        <span>Restaurant</span>
                      </div>
                    )}
                    {booking.gym.amenities.showers && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-700">
                        <Droplets className="w-4 h-4" />
                        <span>Showers</span>
                      </div>
                    )}
                    {booking.gym.amenities.accommodation && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-700">
                        <Building2 className="w-4 h-4" />
                        <span>Accommodation</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Disciplines */}
                {booking.gym.disciplines && booking.gym.disciplines.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200">
                    {booking.gym.disciplines.slice(0, 2).map((d: string, idx: number) => (
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
                <div className="grid grid-cols-2 gap-4 pb-4 border-b border-gray-300">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Check-in</div>
                    <div className="font-semibold">{formatDate(booking.start_date)}</div>
                    <div className="text-xs text-gray-600 mt-1">14:00 – 00:00</div>
                  </div>
                  <div className="border-l border-gray-300 pl-4">
                    <div className="text-xs text-gray-500 mb-1">Check-out</div>
                    <div className="font-semibold">{formatDate(booking.end_date)}</div>
                    <div className="text-xs text-gray-600 mt-1">00:00 – 12:00</div>
                  </div>
                </div>
                
                <div>
                  <div className="text-xs text-gray-500 mb-1">Total length of stay:</div>
                  <div className="font-semibold">
                    {isTraining
                      ? `${displayDuration} ${displayDuration === 1 ? 'day' : 'days'}`
                      : `${duration} ${duration === 1 ? 'night' : 'nights'}`}
                  </div>
                </div>
                
                <div className="pt-3 border-t border-gray-300">
                  <div className="text-xs text-gray-500 mb-1">You selected</div>
                  <div className="font-semibold">
                    {booking.package && (
                      <>
                        {booking.package.type === 'training' && booking.package.name}
                        {booking.package.type === 'accommodation' && 'Training + Accommodation'}
                        {booking.package.type === 'all_inclusive' && 'All Inclusive'}
                      </>
                    )}
                    {!booking.package && 'Training Package'}
                    {booking.variant && ` • ${booking.variant.name}`}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Price Summary */}
            <Card className="border border-gray-300 rounded-lg shadow-sm">
              <CardHeader className="bg-gray-50 border-b border-gray-300 pb-3">
                <CardTitle className="text-lg font-semibold">Your price summary</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-3">
                <div className="space-y-3 text-sm">
                  {/* Training Package */}
                  {booking.package?.type === 'training' && (
                  <div className="flex justify-between">
                      <span className="text-gray-700">
                        Training package ({displayDuration} {displayDuration === 1 ? 'day' : 'days'})
                    </span>
                      <span className="font-medium text-gray-900">
                      {formatPrice(convertPrice(rawTotal, booking.gym.currency))}
                    </span>
                  </div>
                  )}
                  
                  {/* Accommodation Packages */}
                  {(booking.package?.type === 'accommodation' || booking.package?.type === 'all_inclusive') && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-700">
                          Training package ({duration + 1} {duration + 1 === 1 ? 'day' : 'days'})
                        </span>
                        <span className="font-medium text-gray-900">
                          {formatPrice(convertPrice(Math.round(rawTotal * 0.6), booking.gym.currency))}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-700">
                          Accommodation ({duration} {duration === 1 ? 'night' : 'nights'})
                        </span>
                        <span className="font-medium text-gray-900">
                          {formatPrice(convertPrice(Math.round(rawTotal * 0.4), booking.gym.currency))}
                        </span>
                      </div>
                    </>
                  )}
                  
                  {/* Meals */}
                  {(booking.package?.includes_meals || booking.package?.type === 'all_inclusive') && (
                    <div className="flex justify-between">
                      <span className="text-gray-700 flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                        Meals
                      </span>
                    </div>
                  )}
                  
                  {/* Booking Guarantee */}
                  <div className="flex justify-between">
                    <span className="text-gray-700 flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                      Booking Guarantee
                    </span>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-gray-300">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-lg text-gray-900">Total</span>
                    <span className="font-bold text-xl text-gray-900">
                      {formatPrice(convertPrice(rawTotal, booking.gym.currency))}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Includes all taxes and charges</p>
                </div>
              </CardContent>
            </Card>

            {booking.package && (
              <>
                <GoodToKnowCard
                  package_={booking.package}
                  variant={booking.variant ?? null}
                  checkin={booking.start_date}
                  checkout={booking.end_date}
                  gymPolicyTone={booking.gym.cancellation_policy_tone ?? null}
                  checkoutStep="payment"
                />
                <BookingWhatsIncluded
                  package_={booking.package}
                  duration={duration}
                  pricingDuration={displayDuration}
                  gym={booking.gym}
                  className="rounded-lg border border-gray-300 bg-white p-5 space-y-4"
                />
                <BookingSafetyPolicies
                  package_={booking.package}
                  checkin={booking.start_date}
                  gymPolicyTone={booking.gym.cancellation_policy_tone ?? null}
                  gym={booking.gym}
                  className="rounded-lg border border-gray-300 bg-white p-5 space-y-3"
                />
              </>
            )}
          </div>

          {/* Right Column - Payment Form */}
          <div className="lg:col-span-2 space-y-4">
            <div>
              <h1 className="text-2xl font-bold mb-3 text-gray-900">Pay online</h1>
              <p className="text-gray-600 mb-1">You&apos;ll pay when you complete this booking.</p>
              <PaymentHoldExplainer className="text-xs text-gray-500 mb-3" />
            </div>

            <Card className="border border-gray-300 rounded-lg shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold">How would you like to pay?</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <div className="flex items-center gap-3 p-4 border-2 border-[#003580] rounded-lg bg-blue-50/10">
                    <div className="w-10 h-10 rounded-full bg-[#003580] flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold">New card</div>
                      <div className="text-sm text-gray-600">Credit or debit card</div>
                    </div>
                    <div className="text-[#003580]">✓</div>
                  </div>
                </div>

                {clientSecret && stripePromise ? (
                  <Elements stripe={stripePromise} options={options}>
                    <CheckoutForm booking={booking} />
                  </Elements>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      </div>

      {!priceSheetOpen && !paymentMethodOpen && (
        <div
          className="md:hidden fixed bottom-0 left-0 right-0 border-t border-gray-100 bg-white px-4 pt-2 space-y-2 z-50"
          style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
        >
          <StepProgressBar step={3} />
          {payError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {payError}
            </div>
          )}
          {selectedPaymentMethod === 'card' ? (
            <Button
              type="submit"
              form={PAYMENT_FORM_ID}
              disabled={!clientSecret || payLoading || loading || !cardFieldsMounted}
              className="w-full h-11 bg-[#003580] hover:bg-[#003580]/90 text-white font-semibold text-base rounded-xl"
            >
              {payLoading ? 'Processing...' : (
                <>
                  Confirm Booking
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          ) : (
            <p className="text-center text-sm text-gray-600 pb-1">
              Use {PAYMENT_METHOD_LABELS[selectedPaymentMethod]} above to complete payment.
            </p>
          )}
          <PaymentHoldExplainer />
        </div>
      )}

      {priceSheetOpen && priceInfo && rawTotal > 0 && (
        <PriceDetailsSheet
          lines={priceInfo.lines}
          savedVsNightly={priceInfo.savedVsNightly}
          total={rawTotal}
          gymCurrency={gymCurrency}
          displayCurrency={selectedCurrency}
          convertPrice={convertPrice}
          checkin={booking.start_date}
          checkout={booking.end_date}
          pricingDuration={displayDuration}
          isTraining={!!isTraining}
          onClose={() => setPriceSheetOpen(false)}
        />
      )}
    </div>
  )
}
