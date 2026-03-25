'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Check, Copy, Calendar, MapPin, Dumbbell, Printer, Download, Shield, Lock, AlertCircle, DollarSign, User, Mail, Phone, CreditCard, X, Star, Wifi, Car, UtensilsCrossed, Droplets, Building2 } from 'lucide-react'
import type { Booking, Gym, Package, PackageVariant, GymImage } from '@/lib/types/database'
import { useCurrency } from '@/lib/contexts/currency-context'
import { createClient } from '@/lib/supabase/client'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export default function PaymentSuccessPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const bookingId = params.id as string
  const { convertPrice, formatPrice } = useCurrency()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [booking, setBooking] = useState<(Booking & { 
    gym: Gym & { images?: GymImage[] }, 
    package?: Package, 
    variant?: PackageVariant 
  }) | null>(null)
  const [confirmationCopied, setConfirmationCopied] = useState(false)
  const [pinCopied, setPinCopied] = useState(false)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [contactModalOpen, setContactModalOpen] = useState(false)
  const [averageRating, setAverageRating] = useState(0)
  const [reviewCount, setReviewCount] = useState(0)

  useEffect(() => {
    verifyPayment()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const verifyPayment = async () => {
    const paymentIntent = searchParams.get('payment_intent')

    if (!paymentIntent) {
      console.error('No payment_intent in URL params')
      setError('Payment confirmation failed: No payment intent found in URL')
      setLoading(false)
      return
    }

    try {
      console.log('Calling confirm-payment endpoint...')
      // Update booking status to pending_confirmation (payment authorized, waiting for gym confirmation)
      const response = await fetch(`/api/bookings/${bookingId}/confirm-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_intent: paymentIntent }),
      })

      const data = await response.json()

      if (!response.ok) {
        console.error('Error confirming payment:', data.error || 'Unknown error')
        setError(data.error || 'Failed to confirm payment. Please contact support.')
        setLoading(false)
        return
      }

      // Fetch booking details
      const bookingResponse = await fetch(`/api/bookings/${bookingId}`)
      if (bookingResponse.ok) {
        const bookingData = await bookingResponse.json()
        setBooking(bookingData)
        
        // Fetch reviews for rating if gym_id is available
        if (bookingData.gym?.id) {
          const supabase = createClient()
          const { data: bookingReviews } = await supabase
            .from('bookings')
            .select('id, reviews(rating)')
            .eq('gym_id', bookingData.gym.id)

          const { data: manualReviews } = await supabase
            .from('reviews')
            .select('rating')
            .eq('gym_id', bookingData.gym.id)
            .eq('manual_review', true)

          const allReviews = [
            ...(bookingReviews || []).flatMap((b: any) => b.reviews || []),
            ...(manualReviews || [])
          ]

          if (allReviews.length > 0) {
            const avg = allReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / allReviews.length
            setAverageRating(avg)
            setReviewCount(allReviews.length)
          }
        }
      }

      console.log('✅ Payment confirmed successfully, notifications sent')
    } catch (error: any) {
      console.error('Error in verifyPayment:', error)
      setError(error.message || 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async (text: string, type: 'confirmation' | 'pin') => {
    try {
      await navigator.clipboard.writeText(text)
      if (type === 'confirmation') {
        setConfirmationCopied(true)
        setTimeout(() => setConfirmationCopied(false), 2000)
      } else {
        setPinCopied(true)
        setTimeout(() => setPinCopied(false), 2000)
      }
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return ''
    const date = new Date(dateString + 'T00:00:00')
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="border border-gray-300 rounded-lg p-6 bg-white space-y-4">
                <div className="h-8 w-3/4 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse" />
              </div>
              <div className="border border-gray-300 rounded-lg p-5 bg-white space-y-4">
                <div className="h-6 w-40 bg-gray-200 rounded animate-pulse" />
                <div className="flex gap-4">
                  <div className="w-28 h-28 bg-gray-200 rounded animate-pulse" />
                  <div className="flex-1 space-y-3">
                    <div className="h-6 w-3/4 bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
            <div className="lg:col-span-1 space-y-4">
              <div className="border-2 border-green-400 rounded-lg p-5 bg-green-50/50 space-y-3">
                <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <Card className="max-w-2xl mx-auto border border-gray-300 rounded-lg">
            <CardHeader>
              <CardTitle>Payment Verification Error</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 font-medium mb-2">⚠️ Error</p>
                <p className="text-sm text-red-700">{error || 'Failed to load booking details'}</p>
              </div>
              <p className="text-gray-600 text-sm">
                Your payment may have been authorized, but we couldn't complete the confirmation. 
                Please check your email or contact support with your booking reference.
              </p>
              <div className="flex gap-4">
                <Button onClick={() => window.location.reload()}>Try Again</Button>
                <Link href="/search">
                  <Button variant="outline">Go to Search</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const duration = Math.floor(
    (new Date(booking.end_date).getTime() - new Date(booking.start_date).getTime()) / (1000 * 60 * 60 * 24)
  )
  const mainImage = booking.gym.images && booking.gym.images.length > 0 ? booking.gym.images[0].url : null
  const confirmationNumber = booking.booking_reference || booking.id
  const pin = booking.booking_pin || 'N/A'

  return (
    <div className="min-h-screen bg-white">
      {/* Mobile Layout */}
      <div className="md:hidden space-y-6 pb-6">
        {/* Confirmation Banner */}
        <div className="px-4 pt-4">
          <div className="flex items-center gap-2 mb-3">
            <Check className="w-5 h-5 text-green-600" />
            <span className="text-green-600 font-semibold text-sm">Confirmed</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            Your booking in {booking.gym.city || booking.gym.name} is confirmed.
          </h1>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Check className="w-4 h-4 text-green-600" />
            <span>
              Your confirmation is on its way to {booking.guest_email || 'your email'}
            </span>
          </div>
          {/* Divider below hero section */}
          <div className="pt-4 border-b border-gray-200"></div>
        </div>

        {/* Property Details - No Card Container */}
        <div className="px-4 space-y-3">
          {/* Star Rating & Reviews */}
          {reviewCount > 0 && averageRating > 0 && (
            <div className="flex items-center gap-2">
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
              <span className="text-sm text-gray-600">
                {averageRating.toFixed(1)} · {reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}
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

        {/* Confirmation Details - In Container */}
        <div className="px-4">
          <Card className="border-2 border-green-400 bg-green-50/50 rounded-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-gray-900">Confirmation details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-xs text-gray-600 mb-1.5">Confirmation number:</div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-semibold text-gray-900">
                    {confirmationNumber}
                  </span>
                  <button
                    onClick={() => copyToClipboard(confirmationNumber, 'confirmation')}
                    className="text-[#003580] hover:text-[#003580]/80 transition-colors p-1"
                    title="Copy confirmation number"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  {confirmationCopied && (
                    <span className="text-xs text-green-600 font-medium">Copied!</span>
                  )}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-600 mb-1.5">PIN:</div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-semibold text-gray-900">
                    {pin === 'N/A' ? '••••••' : pin}
                  </span>
                  {pin !== 'N/A' && (
                    <>
                      <button
                        onClick={() => copyToClipboard(pin, 'pin')}
                        className="text-[#003580] hover:text-[#003580]/80 transition-colors p-1"
                        title="Copy PIN"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      {pinCopied && (
                        <span className="text-xs text-green-600 font-medium">Copied!</span>
                      )}
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment Status - In Container */}
        <div className="px-4">
          <Card className="border border-gray-300 rounded-lg shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Payment Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-3">
                <Lock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-sm text-blue-900 mb-1">Payment Authorized</h3>
                  <p className="text-sm text-blue-800">
                    Your card has been authorized for {formatPrice(convertPrice(booking.total_price, booking.gym.currency))}. 
                    You'll only be charged once the gym confirms your booking. We'll notify you via email when your booking is confirmed.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Booking Summary - In Container */}
        <div className="px-4">
          <Card className="border border-gray-300 rounded-lg shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Your booking summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                {mainImage && (
                  <div className="w-20 h-20 flex-shrink-0 rounded overflow-hidden">
                    <img 
                      src={mainImage} 
                      alt={booking.gym.name} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-base text-gray-900 mb-2">
                    {booking.gym.name}
                  </h3>
                  <div className="space-y-1.5 text-sm text-gray-600 mb-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 flex-shrink-0" />
                      <span>
                        {formatDate(booking.start_date)} - {formatDate(booking.end_date)}, {duration} {duration === 1 ? 'night' : 'nights'}
                      </span>
                    </div>
                    {booking.variant && (
                      <div className="flex items-center gap-2">
                        <Dumbbell className="w-4 h-4 flex-shrink-0" />
                        <span>
                          {booking.package?.name || 'Training Package'}
                          {booking.variant.name && ` • ${booking.variant.name}`}
                        </span>
                      </div>
                    )}
                    {!booking.variant && booking.package && (
                      <div className="flex items-center gap-2">
                        <Dumbbell className="w-4 h-4 flex-shrink-0" />
                        <span>{booking.package.name}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 flex-shrink-0" />
                      <span className="font-semibold text-gray-900">
                        Total price: {formatPrice(convertPrice(booking.total_price, booking.gym.currency))}
                      </span>
                    </div>
                  </div>
                  <Button className="bg-[#003580] hover:bg-[#003580]/90 text-white text-sm" size="sm" onClick={() => setDetailsModalOpen(true)}>
                    View or update details
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Need Help - In Container */}
        <div className="px-4 pb-4">
          <Card className="border border-gray-300 rounded-lg shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Need help?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-600">
                If you have any questions about your booking, we're here to help.
              </p>
              <div className="flex flex-col gap-3">
                <Button className="bg-[#003580] hover:bg-[#003580]/90 text-white w-full" onClick={() => setContactModalOpen(true)}>
                  Contact Support
                </Button>
                <Button variant="outline" asChild className="w-full">
                  <Link href="/bookings">
                    Manage Bookings
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:block max-w-7xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4">
            {/* Confirmation Banner */}
            <div className="bg-white border border-gray-300 rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Check className="w-5 h-5 text-green-600" />
                    <span className="text-green-600 font-semibold text-sm">Confirmed</span>
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    Your booking in {booking.gym.city || booking.gym.name} is confirmed.
                  </h1>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Check className="w-4 h-4 text-green-600" />
                    <span>
                      Your confirmation is on its way to {booking.guest_email || 'your email'}
                    </span>
                    <Link href="#" className="text-[#003580] hover:underline">
                      Edit
                    </Link>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <Button className="bg-[#003580] hover:bg-[#003580]/90 text-white flex items-center gap-2">
                  <Printer className="w-4 h-4" />
                  Print full version
                </Button>
                <Button variant="outline" className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Save confirmation to phone
                </Button>
              </div>
            </div>

            {/* Payment Status Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Lock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-sm text-blue-900 mb-1">Payment Authorized</h3>
                  <p className="text-sm text-blue-800">
                    Your card has been authorized for {formatPrice(convertPrice(booking.total_price, booking.gym.currency))}. 
                    You'll only be charged once the gym confirms your booking. We'll notify you via email when your booking is confirmed.
              </p>
                </div>
              </div>
            </div>
            
            {/* Your Booking Summary */}
            <div className="bg-white border border-gray-300 rounded-lg p-5">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Your booking summary</h2>
            
            <div className="flex gap-4">
                {mainImage && (
                  <div className="w-28 h-28 flex-shrink-0 rounded overflow-hidden">
                    <img 
                      src={mainImage} 
                      alt={booking.gym.name} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg text-gray-900 mb-3">
                    {booking.gym.name}
                  </h3>
                  <div className="space-y-2.5 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4 flex-shrink-0" />
                      <span>
                        {formatDate(booking.start_date)} - {formatDate(booking.end_date)}, {duration} {duration === 1 ? 'night' : 'nights'}
                      </span>
                    </div>
                    {booking.variant && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Dumbbell className="w-4 h-4 flex-shrink-0" />
                        <span>
                          {booking.package?.name || 'Training Package'}
                          {booking.variant.name && ` • ${booking.variant.name}`}
                        </span>
                      </div>
                    )}
                    {!booking.variant && booking.package && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Dumbbell className="w-4 h-4 flex-shrink-0" />
                        <span>{booking.package.name}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <DollarSign className="w-4 h-4 flex-shrink-0" />
                      <span className="font-semibold text-gray-900">
                        Total price: {formatPrice(convertPrice(booking.total_price, booking.gym.currency))}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button className="bg-[#003580] hover:bg-[#003580]/90 text-white" size="sm" onClick={() => setDetailsModalOpen(true)}>
                      View or update details
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Need Help Section */}
            <div className="bg-white border border-gray-300 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Need help?</h2>
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  If you have any questions about your booking, we're here to help.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button className="bg-[#003580] hover:bg-[#003580]/90 text-white" onClick={() => setContactModalOpen(true)}>
                    Contact Support
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/bookings">
                      Manage Bookings
              </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            {/* Confirmation Details */}
            <Card className="border-2 border-green-400 bg-green-50/50 rounded-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-gray-900">Confirmation details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-xs text-gray-600 mb-1.5">Confirmation number:</div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-semibold text-gray-900">
                      {confirmationNumber}
                    </span>
                    <button
                      onClick={() => copyToClipboard(confirmationNumber, 'confirmation')}
                      className="text-[#003580] hover:text-[#003580]/80 transition-colors p-1"
                      title="Copy confirmation number"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    {confirmationCopied && (
                      <span className="text-xs text-green-600 font-medium">Copied!</span>
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-600 mb-1.5">PIN:</div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-semibold text-gray-900">
                      {pin === 'N/A' ? '••••••' : pin}
                    </span>
                    {pin !== 'N/A' && (
                      <>
                        <button
                          onClick={() => copyToClipboard(pin, 'pin')}
                          className="text-[#003580] hover:text-[#003580]/80 transition-colors p-1"
                          title="Copy PIN"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        {pinCopied && (
                          <span className="text-xs text-green-600 font-medium">Copied!</span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Gym Location */}
            <Card className="border border-gray-300 rounded-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Location</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-2 text-sm text-gray-700">
                  <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div>
                    {booking.gym.address ? (
                      <span>{booking.gym.address}</span>
                    ) : (
                      <span>{booking.gym.city}, {booking.gym.country}</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Booking Guarantee */}
            <Card className="border border-gray-300 rounded-lg bg-gradient-to-br from-blue-50 to-white">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-[#003580]" />
                  <CardTitle className="text-base font-semibold">Booking Guarantee</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-700">
                    Secure payment processing with industry-standard encryption
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-700">
                    Your booking is protected and confirmed
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-700">
                    24/7 customer support available
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Important Information */}
            <Card className="border border-gray-300 rounded-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-[#003580]" />
                  Important Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-gray-700">
                <div>
                  <p className="font-semibold mb-1">Check-in:</p>
                  <p>Please arrive at the gym on {formatDate(booking.start_date)}. Check-in times may vary - the gym will contact you with specific details.</p>
                </div>
                <div>
                  <p className="font-semibold mb-1">What to bring:</p>
                  <p>Training gear, appropriate clothing, and any personal items you may need for your stay.</p>
                </div>
                <div>
                  <p className="font-semibold mb-1">Contact the gym:</p>
                  <p>If you need to reach the gym directly, you can find their contact information in your confirmation email.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
      </div>

      {/* Booking Details Modal */}
      <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Booking Details</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 mt-4">
            {/* Booking Status */}
            <div className="border border-gray-300 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Status</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                  booking.status === 'pending_confirmation' ? 'bg-yellow-100 text-yellow-800' :
                  booking.status === 'declined' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {booking.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>
              {booking.status === 'pending_confirmation' && (
                <p className="text-sm text-gray-600 mt-2">
                  Your booking is being confirmed with the gym. You'll be notified once it's confirmed.
                </p>
              )}
            </div>

            {/* Gym Details */}
            <div className="border border-gray-300 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Gym Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <Dumbbell className="w-4 h-4 text-gray-600 flex-shrink-0 mt-0.5" />
                  <span className="font-semibold text-gray-900">{booking.gym.name}</span>
                </div>
                {booking.gym.address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-gray-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{booking.gym.address}</span>
                  </div>
                )}
                {!booking.gym.address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-gray-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{booking.gym.city}, {booking.gym.country}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Booking Dates */}
            <div className="border border-gray-300 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Booking Dates</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-600 mb-1">Check-in</div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-600" />
                    <span className="font-semibold text-gray-900">{formatDate(booking.start_date)}</span>
                  </div>
                </div>
                <div>
                  <div className="text-gray-600 mb-1">Check-out</div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-600" />
                    <span className="font-semibold text-gray-900">{formatDate(booking.end_date)}</span>
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="text-gray-600 mb-1">Duration</div>
                  <span className="text-gray-900">{duration} {duration === 1 ? 'night' : 'nights'}</span>
                </div>
              </div>
            </div>

            {/* Package Details */}
            <div className="border border-gray-300 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Package Details</h3>
              <div className="space-y-2 text-sm">
                {booking.package && (
                  <div className="flex items-center gap-2">
                    <Dumbbell className="w-4 h-4 text-gray-600" />
                    <span className="text-gray-900">{booking.package.name}</span>
                  </div>
                )}
                {booking.variant && (
                  <div className="text-gray-700 ml-6">
                    Variant: {booking.variant.name}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-gray-600" />
                  <span className="text-gray-900 font-semibold">
                    Total: {formatPrice(convertPrice(booking.total_price, booking.gym.currency))}
                  </span>
                </div>
              </div>
            </div>

            {/* Guest Information */}
            {(booking.guest_name || booking.guest_email || booking.guest_phone) && (
              <div className="border border-gray-300 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Guest Information</h3>
                <div className="space-y-2 text-sm">
                  {booking.guest_name && (
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-600" />
                      <span className="text-gray-900">{booking.guest_name}</span>
                    </div>
                  )}
                  {booking.guest_email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-600" />
                      <span className="text-gray-900">{booking.guest_email}</span>
                    </div>
                  )}
                  {booking.guest_phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-600" />
                      <span className="text-gray-900">{booking.guest_phone}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Additional Details */}
            {(booking.discipline || booking.experience_level || booking.notes) && (
              <div className="border border-gray-300 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Additional Details</h3>
                <div className="space-y-2 text-sm">
                  {booking.discipline && (
                    <div>
                      <span className="text-gray-600">Discipline: </span>
                      <span className="text-gray-900">{booking.discipline}</span>
                    </div>
                  )}
                  {booking.experience_level && (
                    <div>
                      <span className="text-gray-600">Experience Level: </span>
                      <span className="text-gray-900 capitalize">{booking.experience_level}</span>
                    </div>
                  )}
                  {booking.notes && (
                    <div>
                      <span className="text-gray-600">Notes: </span>
                      <span className="text-gray-900">{booking.notes}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Confirmation Details */}
            <div className="border border-gray-300 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Confirmation Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Confirmation Number:</span>
                  <span className="font-mono font-semibold text-gray-900">{confirmationNumber}</span>
                </div>
                {pin !== 'N/A' && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">PIN:</span>
                    <span className="font-mono font-semibold text-gray-900">{pin}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Contact Support Modal */}
      <ContactSupportModal 
        open={contactModalOpen} 
        onOpenChange={setContactModalOpen}
        bookingReference={confirmationNumber}
        userEmail={booking.guest_email || ''}
        userName={booking.guest_name || ''}
      />
    </div>
  )
}

// Contact Support Modal Component
function ContactSupportModal({ 
  open, 
  onOpenChange, 
  bookingReference,
  userEmail,
  userName
}: { 
  open: boolean
  onOpenChange: (open: boolean) => void
  bookingReference: string
  userEmail: string
  userName: string
}) {
  const [name, setName] = useState(userName)
  const [email, setEmail] = useState(userEmail)
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (open) {
      // Reset form when modal opens
      setName(userName)
      setEmail(userEmail)
      setSubject('')
      setMessage('')
      setError(null)
      setSuccess(false)
    }
  }, [open, userName, userEmail])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          subject,
          message,
          bookingReference,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message')
      }

      setSuccess(true)
      setTimeout(() => {
        onOpenChange(false)
        setSuccess(false)
      }, 2000)
    } catch (err: any) {
      setError(err.message || 'Failed to send message. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Contact Support</DialogTitle>
        </DialogHeader>

        {success ? (
          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Message Sent!</h3>
            <p className="text-sm text-gray-600">
              We'll get back to you as soon as possible.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact-name">Name *</Label>
                <Input
                  id="contact-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-email">Email *</Label>
                <Input
                  id="contact-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact-subject">Subject *</Label>
              <Input
                id="contact-subject"
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="What can we help you with?"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact-message">Message *</Label>
              <Textarea
                id="contact-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Please provide as much detail as possible..."
                rows={6}
                required
              />
            </div>

            {bookingReference && (
              <div className="text-xs text-gray-500">
                Booking Reference: {bookingReference}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                type="submit"
                className="bg-[#003580] hover:bg-[#003580]/90 text-white"
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Send Message'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
