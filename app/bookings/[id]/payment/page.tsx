'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useCurrency } from '@/lib/contexts/currency-context'
import type { Booking, Gym, Package, PackageVariant, GymImage } from '@/lib/types/database'
import { MapPin, Dumbbell, ArrowRight, CreditCard, Check, Star, Wifi, Car, UtensilsCrossed, Droplets, Building2 } from 'lucide-react'
import { calculatePackagePrice } from '@/lib/utils'

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null

function CheckoutForm({ booking }: { booking: Booking & { gym: Gym } }) {
  const router = useRouter()
  const params = useParams()
  const bookingId = params.id as string
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!stripe || !elements) return

    setLoading(true)
    setError(null)

    const { error: submitError } = await elements.submit()
    if (submitError) {
      setError(submitError.message || 'Payment form error')
      setLoading(false)
      return
    }

    // Confirm payment
    const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/bookings/${bookingId}/success`,
      },
      // For card payments, avoid the redirect and handle success here.
      // For redirect-based methods, Stripe will still redirect to return_url.
      redirect: 'if_required',
    })

    if (confirmError) {
      setError(confirmError.message || 'Payment failed')
      setLoading(false)
      return
    }

    // If we have a PaymentIntent result, confirm the booking server-side and then navigate.
    // For manual capture, status is typically `requires_capture` after a successful authorization.
    if (paymentIntent && (paymentIntent.status === 'requires_capture' || paymentIntent.status === 'succeeded')) {
      try {
        const confirmRes = await fetch(`/api/bookings/${bookingId}/confirm-payment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ payment_intent: paymentIntent.id }),
        })
        const confirmData = await confirmRes.json()
        if (!confirmRes.ok) {
          setError(confirmData?.error || 'Failed to finalize booking. Please contact support.')
          setLoading(false)
          return
        }

        // Show the success page (with payment_intent in the URL for transparency)
        router.replace(`/bookings/${bookingId}/success?payment_intent=${encodeURIComponent(paymentIntent.id)}&redirect_status=${encodeURIComponent(paymentIntent.status)}`)
        return
      } catch (err: any) {
        setError(err?.message || 'Failed to finalize booking. Please contact support.')
        setLoading(false)
        return
      }
    }

    // If Stripe performed a redirect, we won't reach here.
    // If we did reach here without a PI, stop loading.
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
      <div className="space-y-3 md:space-y-4">
        <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600">
          <CreditCard className="w-4 h-4" />
          <span>We accept all major credit cards</span>
        </div>
        <PaymentElement />
      </div>
      
      {error && (
        <div className="p-3 bg-red-50 text-red-800 rounded-md text-sm">
          {error}
        </div>
      )}
      
      {/* Mobile: Fixed button at bottom */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-50">
        <Button 
          type="submit" 
          className="w-full h-12 text-base font-semibold bg-[#003580] hover:bg-[#003580]/90" 
          disabled={!stripe || loading}
        >
          {loading ? 'Processing...' : (
            <>
              Confirm Booking
              <ArrowRight className="w-5 h-5 ml-2" />
            </>
          )}
        </Button>
        <p className="text-xs text-center text-gray-500 mt-2">
          Your card will be authorised now and charged once the gym confirms availability.
        </p>
      </div>

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
        <p className="text-xs text-center text-gray-500 mt-2">
          Your card will be authorised now and charged once the gym confirms availability.
        </p>
      </div>
    </form>
  )
}

export default function PaymentPage() {
  const params = useParams()
  const router = useRouter()
  const { convertPrice, formatPrice } = useCurrency()
  const bookingId = params.id as string
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [booking, setBooking] = useState<(Booking & { gym: Gym & { images?: GymImage[], averageRating?: number, reviewCount?: number }, package?: Package, variant?: PackageVariant }) | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [addressCopied, setAddressCopied] = useState(false)

  useEffect(() => {
    fetchBookingAndPaymentIntent()
  }, [bookingId])

  const fetchBookingAndPaymentIntent = async () => {
    try {
      // Get payment intent first (this will fetch booking server-side and handle RLS)
      const response = await fetch(`/api/bookings/${bookingId}/payment-intent`, {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        console.error('Error creating payment intent:', data.error, data.details)
        // Show user-friendly error message
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

      setClientSecret(data.client_secret)

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
        
        setBooking(bookingApiData as any)
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-gray-100 border-b">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-center gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-gray-200 rounded-full animate-pulse" />
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-4">
              <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
                <div className="aspect-video bg-gray-200 animate-pulse" />
                <div className="p-5 space-y-3">
                  <div className="h-6 w-3/4 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
              <div className="border border-gray-300 rounded-lg p-5 bg-white space-y-3">
                <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
            <div className="lg:col-span-2 space-y-4">
              <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
              <div className="border border-gray-300 rounded-lg p-6 bg-white space-y-4">
                <div className="h-6 w-40 bg-gray-200 rounded animate-pulse" />
                <div className="h-32 w-full bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !clientSecret || !stripePromise) {
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
                <p className="text-gray-600 mb-2">{error || 'Failed to load payment page'}</p>
                {error?.includes('not configured') && (
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

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-gray-100 border-b">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-center gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-gray-200 rounded-full animate-pulse" />
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-4">
              <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
                <div className="aspect-video bg-gray-200 animate-pulse" />
                <div className="p-5 space-y-3">
                  <div className="h-6 w-3/4 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            </div>
            <div className="lg:col-span-2 space-y-4">
              <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe' as const,
    },
  }

  const mainImage = booking.gym.images && booking.gym.images.length > 0 ? booking.gym.images[0].url : null
  const totalPrice = booking.total_price
  const finalTotal = totalPrice

  return (
    <div className="min-h-screen bg-white">
      {/* Progress Bar */}
      <div className="bg-gray-100 border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[#003580] text-white flex items-center justify-center text-xs font-bold">✓</div>
              <span className="text-sm font-medium text-gray-700">1 Your selection</span>
            </div>
            <div className="w-12 h-0.5 bg-[#003580]"></div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[#003580] text-white flex items-center justify-center text-xs font-bold">✓</div>
              <span className="text-sm font-medium text-gray-700">2 Your details</span>
            </div>
            <div className="w-12 h-0.5 bg-[#003580]"></div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[#003580] text-white flex items-center justify-center text-xs font-bold">3</div>
              <span className="text-sm font-medium text-[#003580]">3 Finish booking</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden space-y-6 pb-24">
        {/* Property Details - No Card Container */}
        <div className="px-4 pt-4 space-y-3">
          {/* Star Rating & Reviews */}
          {booking.gym.reviewCount && booking.gym.reviewCount > 0 && booking.gym.averageRating && booking.gym.averageRating > 0 && (
            <div className="flex items-center gap-2">
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
              <span className="text-sm text-gray-600">
                {booking.gym.averageRating.toFixed(1)} · {booking.gym.reviewCount} {booking.gym.reviewCount === 1 ? 'review' : 'reviews'}
              </span>
            </div>
          )}
          
          <h2 className="font-bold text-xl text-gray-900">{booking.gym.name}</h2>
          
          {booking.gym.address && (
            <div className="text-sm text-gray-700">
              {booking.gym.address}
            </div>
          )}
          {!booking.gym.address && (
            <div className="text-sm text-gray-700">
              {booking.gym.city}, {booking.gym.country}
            </div>
          )}
          
          {/* Amenities */}
          {booking.gym.amenities && (
            <div className="flex flex-wrap gap-3 pt-1">
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
          {/* Divider below hero section */}
          <div className="pt-4 border-b border-gray-200"></div>
        </div>

        {/* Booking Dates */}
        <div className="px-4 space-y-2 pb-4 border-b border-gray-200">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-gray-500 mb-0.5">Check-in</div>
              <div className="font-semibold text-sm">{formatDate(booking.start_date)}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-0.5">Check-out</div>
              <div className="font-semibold text-sm">{formatDate(booking.end_date)}</div>
            </div>
          </div>
        </div>

        {/* You Selected */}
        <div className="px-4 pb-4 border-b border-gray-200">
          <div className="text-xs text-gray-500 mb-1">You selected</div>
          <div className="font-semibold text-sm">
            {duration} {duration === 1 ? 'night' : 'nights'}
          </div>
          {booking.package && (
            <div className="font-semibold text-sm mt-1">
              {booking.package.type === 'training' && `1 x ${booking.package.name}`}
              {booking.package.type === 'accommodation' && booking.variant && `1 x ${booking.variant.name}`}
              {booking.package.type === 'accommodation' && !booking.variant && '1 x Training + Accommodation'}
              {booking.package.type === 'all_inclusive' && booking.variant && `1 x ${booking.variant.name}`}
              {booking.package.type === 'all_inclusive' && !booking.variant && '1 x All Inclusive'}
            </div>
          )}
        </div>

        {/* Price Summary - In Container */}
        <div className="px-4">
          <Card className="border border-gray-300 rounded-lg shadow-sm">
            <CardHeader className="bg-gray-50 border-b border-gray-300 pb-3">
              <CardTitle className="text-lg font-semibold">Your price summary</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-3">
              <div className="space-y-3 text-sm">
                {booking.package?.type === 'training' && (
                  <div className="flex justify-between">
                    <span className="text-gray-700">
                      Training package ({duration} {duration === 1 ? 'day' : 'days'})
                    </span>
                    <span className="font-medium text-gray-900">
                      {formatPrice(convertPrice(totalPrice, booking.gym.currency))}
                    </span>
                  </div>
                )}
                {(booking.package?.type === 'accommodation' || booking.package?.type === 'all_inclusive') && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-700">
                        Training package ({duration} {duration === 1 ? 'day' : 'days'})
                      </span>
                      <span className="font-medium text-gray-900">
                        {formatPrice(convertPrice(Math.round(totalPrice * 0.6), booking.gym.currency))}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">
                        Accommodation ({duration} {duration === 1 ? 'night' : 'nights'})
                      </span>
                      <span className="font-medium text-gray-900">
                        {formatPrice(convertPrice(Math.round(totalPrice * 0.4), booking.gym.currency))}
                      </span>
                    </div>
                  </>
                )}
                {(booking.package?.includes_meals || booking.package?.type === 'all_inclusive') && (
                  <div className="flex justify-between">
                    <span className="text-gray-700 flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                      Meals
                    </span>
                  </div>
                )}
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
                    {formatPrice(convertPrice(finalTotal, booking.gym.currency))}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Includes all taxes and charges</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment Section - In Container */}
        <div className="px-4 pb-4">
          <Card className="border border-gray-300 rounded-lg shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold">Pay online</CardTitle>
              <CardDescription className="text-sm text-gray-600 mt-1">
                You'll pay when you complete this booking.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-300 rounded-md">
                <p className="text-sm text-blue-900">
                  <strong>Important:</strong> Your card will be authorised now and charged once the gym confirms availability.
                </p>
              </div>

              <div className="space-y-4">
                <div className="text-base font-semibold text-gray-900">How would you like to pay?</div>
                <div className="flex items-center gap-3 p-4 border-2 border-[#003580] rounded-lg bg-blue-50/10">
                  <div className="w-10 h-10 rounded-full bg-[#003580] flex items-center justify-center flex-shrink-0">
                    <CreditCard className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-sm">New card</div>
                    <div className="text-xs text-gray-600">Credit or debit card</div>
                  </div>
                  <div className="text-[#003580] text-lg">✓</div>
                </div>

                <Elements stripe={stripePromise} options={options}>
                  <CheckoutForm booking={booking} />
                </Elements>
              </div>
            </CardContent>
          </Card>
        </div>
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
                    {duration} {duration === 1 ? 'night' : 'nights'}
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
                        Training package ({duration} {duration === 1 ? 'day' : 'days'})
                    </span>
                      <span className="font-medium text-gray-900">
                      {formatPrice(convertPrice(totalPrice, booking.gym.currency))}
                    </span>
                  </div>
                  )}
                  
                  {/* Accommodation Packages */}
                  {(booking.package?.type === 'accommodation' || booking.package?.type === 'all_inclusive') && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-700">
                          Training package ({duration} {duration === 1 ? 'day' : 'days'})
                        </span>
                        <span className="font-medium text-gray-900">
                          {formatPrice(convertPrice(Math.round(totalPrice * 0.6), booking.gym.currency))}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-700">
                          Accommodation ({duration} {duration === 1 ? 'night' : 'nights'})
                        </span>
                        <span className="font-medium text-gray-900">
                          {formatPrice(convertPrice(Math.round(totalPrice * 0.4), booking.gym.currency))}
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
                      {formatPrice(convertPrice(finalTotal, booking.gym.currency))}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Includes all taxes and charges</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Payment Form */}
          <div className="lg:col-span-2 space-y-4">
            <div>
              <h1 className="text-2xl font-bold mb-3 text-gray-900">Pay online</h1>
              <p className="text-gray-600 mb-3">You'll pay when you complete this booking.</p>
              <div className="p-3 bg-blue-50 border border-blue-300 rounded-md">
                <p className="text-sm text-blue-900">
                  <strong>Important:</strong> Your card will be authorised now and charged once the gym confirms availability.
                </p>
              </div>
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

                <Elements stripe={stripePromise} options={options}>
                  <CheckoutForm booking={booking} />
                </Elements>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
