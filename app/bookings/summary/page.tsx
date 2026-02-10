'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { calculatePackagePrice } from '@/lib/utils'
import { useCurrency } from '@/lib/contexts/currency-context'
import type { Gym, Package, PackageVariant } from '@/lib/types/database'
import { ArrowLeft, MapPin, Calendar, Users, AlertCircle, Dumbbell, Check, Star, Wifi, Car, UtensilsCrossed, Droplets, Building2, X } from 'lucide-react'
import Link from 'next/link'
import { GoodToKnowCard } from '@/components/good-to-know-card'
import { DateRangePicker } from '@/components/date-range-picker'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

const DISCIPLINES = ['Muay Thai', 'MMA', 'BJJ', 'Boxing', 'Wrestling', 'Kickboxing']
const EXPERIENCE_LEVELS = ['beginner', 'intermediate', 'advanced'] as const

export default function BookingSummaryPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { convertPrice, formatPrice } = useCurrency()
  
  const [gym, setGym] = useState<Gym & { images?: { url: string }[] } | null>(null)
  const [package_, setPackage_] = useState<Package | null>(null)
  const [variant, setVariant] = useState<PackageVariant | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [averageRating, setAverageRating] = useState(0)
  const [reviewCount, setReviewCount] = useState(0)
  
  const [checkin, setCheckin] = useState(searchParams.get('checkin') || '')
  const [checkout, setCheckout] = useState(searchParams.get('checkout') || '')
  const [guestCount, setGuestCount] = useState(1)
  const [discipline, setDiscipline] = useState('')
  const [experienceLevel, setExperienceLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner')
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

  useEffect(() => {
    fetchBookingData()
  }, [])

  const fetchBookingData = async () => {
    const gymId = searchParams.get('gymId')
    const packageId = searchParams.get('packageId')
    const variantId = searchParams.get('variantId')

    if (!gymId || !packageId) {
      setError('Missing booking information')
      setLoading(false)
      return
    }

    const supabase = createClient()

    // Fetch gym with images
    const { data: gymData, error: gymError } = await supabase
      .from('gyms')
      .select(`
        *,
        images:gym_images(*)
      `)
      .eq('id', gymId)
      .single()

    if (gymError || !gymData) {
      setError('Gym not found')
      setLoading(false)
      return
    }

    // Fetch reviews for rating calculation
    const { data: bookingReviews } = await supabase
      .from('bookings')
      .select('id, reviews(rating)')
      .eq('gym_id', gymId)

    const { data: manualReviews } = await supabase
      .from('reviews')
      .select('rating')
      .eq('gym_id', gymId)
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

    // Fetch package with variants
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

    setGym(gymData as Gym)
    setPackage_(packageData as Package)

    // If variant ID provided, find the variant
    if (variantId && packageData.variants) {
      const selectedVariant = packageData.variants.find((v: PackageVariant) => v.id === variantId)
      if (selectedVariant) {
        setVariant(selectedVariant)
      }
    }

    setLoading(false)
  }

  const duration = (checkin && checkout)
    ? Math.floor((new Date(checkout).getTime() - new Date(checkin).getTime()) / (1000 * 60 * 60 * 24))
    : 0

  const isValidDuration = duration > 0
  const meetsMinimumStay = !package_ || package_.type === 'training' || duration >= 7

  // Calculate price
  const priceInfo = (package_ && isValidDuration)
    ? calculatePackagePrice(duration, package_.type, {
        daily: variant ? variant.price_per_day : package_.price_per_day,
        weekly: variant ? variant.price_per_week : package_.price_per_week,
        monthly: variant ? variant.price_per_month : package_.price_per_month
      })
    : null

  const totalPrice = priceInfo?.price || 0
  const finalTotal = totalPrice

  const formatDate = (dateString: string) => {
    if (!dateString) return ''
    const date = new Date(dateString + 'T00:00:00') // Add time to avoid timezone issues
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`
  }

  const handleSubmit = async () => {
    if (!gym || !package_) return
    if (!isValidDuration) {
      setError('Please select valid dates')
      return
    }
    if (!meetsMinimumStay) {
      setError('Accommodation packages require a minimum stay of 1 week')
      return
    }
    if (!discipline) {
      setError('Please select a discipline')
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
          discipline,
          experience_level: experienceLevel,
          notes: notes || null,
          total_price: totalPrice,
          platform_fee: 0,
          // Guest booking details
          guest_email: email,
          guest_phone: phone,
          guest_name: `${firstName} ${lastName}`,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create booking')
      }

      // Redirect to payment
      router.push(`/bookings/${data.booking_id}/payment`)
    } catch (err: any) {
      setError(err.message)
      setSubmitting(false)
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
                </div>
              </div>
            </div>
            <div className="lg:col-span-2 space-y-4">
              <div className="border border-gray-300 rounded-lg p-6 bg-white space-y-4">
                <div className="h-6 w-40 bg-gray-200 rounded animate-pulse" />
                <div className="space-y-3">
                  <div className="h-11 w-full bg-gray-200 rounded animate-pulse" />
                  <div className="h-11 w-full bg-gray-200 rounded animate-pulse" />
                  <div className="h-11 w-full bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
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

  if (!gym || !package_) return null

  const mainImage = gym.images && gym.images.length > 0 ? gym.images[0].url : null

  return (
    <div className="min-h-screen bg-gray-50">
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
              <div className="w-6 h-6 rounded-full bg-[#003580] text-white flex items-center justify-center text-xs font-bold">2</div>
              <span className="text-sm font-medium text-[#003580]">2 Your details</span>
            </div>
            <div className="w-12 h-0.5 bg-gray-300"></div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gray-300 text-gray-500 flex items-center justify-center text-xs font-bold">3</div>
              <span className="text-sm font-medium text-gray-500">3 Finish booking</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Mobile Layout - Single Page, Information Dense */}
        <div className="md:hidden space-y-6 pb-20">
          {/* Property Details - No Card Container */}
          <div className="space-y-3">
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
            
            <h2 className="font-bold text-xl text-gray-900">{gym.name}</h2>
            
            {gym.address && (
              <div className="text-sm text-gray-700">
                {gym.address}
              </div>
            )}
            {!gym.address && (
              <div className="text-sm text-gray-700">
                {gym.city}, {gym.country}
              </div>
            )}
            
            {/* Amenities */}
            {gym.amenities && (
              <div className="flex flex-wrap gap-3 pt-1">
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
            {/* Divider below hero section */}
            <div className="pt-4 border-b border-gray-200"></div>
          </div>

          {/* Booking Dates - Match reference image */}
          <div className="space-y-2 pb-4 border-b border-gray-200">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-gray-500 mb-0.5">Check-in</div>
                <div className="font-semibold text-sm">{formatDate(checkin)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-0.5">Check-out</div>
                <div className="font-semibold text-sm">{formatDate(checkout)}</div>
              </div>
            </div>
            <button
              onClick={() => setDatePickerOpen(true)}
              className="text-sm text-[#003580] hover:underline font-medium pt-1"
            >
              Change dates
            </button>
          </div>

          {/* You Selected - Match reference image format */}
          <div className="pb-4 border-b border-gray-200">
            <div className="text-xs text-gray-500 mb-1">You selected</div>
            <div className="font-semibold text-sm">
              {duration} {duration === 1 ? 'night' : 'nights'}, {guestCount} {guestCount === 1 ? 'guest' : 'guests'}
            </div>
            {package_ && (
              <div className="font-semibold text-sm mt-1">
                {package_.type === 'training' && `1 x ${package_.name}`}
                {package_.type === 'accommodation' && variant && `1 x ${variant.name}`}
                {package_.type === 'accommodation' && !variant && '1 x Training + Accommodation'}
                {package_.type === 'all_inclusive' && variant && `1 x ${variant.name}`}
                {package_.type === 'all_inclusive' && !variant && '1 x All Inclusive'}
              </div>
            )}
          </div>

          {/* Price Summary - In Container */}
          {priceInfo && (
            <div className="px-4">
              <Card className="border border-gray-300 rounded-lg shadow-sm">
                <CardHeader className="bg-gray-50 border-b border-gray-300 pb-3">
                  <CardTitle className="text-lg font-semibold">Your price summary</CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-3">
                  <div className="space-y-3 text-sm">
                    {package_.type === 'training' && (
                      <div className="flex justify-between">
                        <span className="text-gray-700">
                          Training package ({duration} {duration === 1 ? 'day' : 'days'})
                        </span>
                        <span className="font-medium text-gray-900">
                          {formatPrice(convertPrice(totalPrice, gym.currency))}
                        </span>
                      </div>
                    )}
                    {(package_.type === 'accommodation' || package_.type === 'all_inclusive') && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-700">
                            Training package ({duration} {duration === 1 ? 'day' : 'days'})
                          </span>
                          <span className="font-medium text-gray-900">
                            {formatPrice(convertPrice(Math.round(totalPrice * 0.6), gym.currency))}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-700">
                            Accommodation ({duration} {duration === 1 ? 'night' : 'nights'})
                          </span>
                          <span className="font-medium text-gray-900">
                            {formatPrice(convertPrice(Math.round(totalPrice * 0.4), gym.currency))}
                          </span>
                        </div>
                      </>
                    )}
                    {(package_.includes_meals || package_.type === 'all_inclusive') && (
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
                        {formatPrice(convertPrice(finalTotal, gym.currency))}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Includes all taxes and charges</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Good to Know Section - Mobile version without card wrapper */}
          {package_ && (() => {
            const points: string[] = []
            
            // Always add payment info as first point
            points.push("No payment needed now. You'll pay when the gym confirms your booking.")
            
            // Cancellation policy
            if (package_.cancellation_policy_days && checkin) {
              const checkinDate = new Date(checkin + 'T00:00:00')
              const cancellationDate = new Date(checkinDate)
              cancellationDate.setDate(cancellationDate.getDate() - package_.cancellation_policy_days)
              const today = new Date()
              const canCancel = cancellationDate > today
              
              if (canCancel) {
                const formattedDate = cancellationDate.toLocaleDateString('en-GB', { 
                  day: 'numeric', 
                  month: 'long', 
                  year: 'numeric' 
                })
                points.push(`Stay flexible: You can cancel for free before ${formattedDate}, so lock in this great price today.`)
              } else {
                points.push(`Stay flexible: Free cancellation available up to ${package_.cancellation_policy_days} days before check-in.`)
              }
            }
            
            // Third point - Accommodation or meal info
            if (package_.type === 'accommodation' || package_.type === 'all_inclusive') {
              if (variant?.room_type === 'private') {
                points.push("You'll get the entire room to yourself!")
              } else if (variant?.room_type === 'shared') {
                points.push("You'll be sharing the room with other guests.")
              } else if (package_.includes_accommodation) {
                points.push("Accommodation is included in your booking.")
              }
            } else if (package_.includes_meals || package_.type === 'all_inclusive') {
              if (package_.meal_plan_details?.description) {
                points.push(package_.meal_plan_details.description)
              } else if (package_.meal_plan_details?.meals_per_day) {
                points.push(`${package_.meal_plan_details.meals_per_day} meal${package_.meal_plan_details.meals_per_day > 1 ? 's' : ''} per day included.`)
              } else {
                points.push("Meals are included in your package.")
              }
            } else {
              points.push("Your booking details will be confirmed by the gym shortly.")
            }
            
            // Ensure we have exactly 3 points
            const displayPoints = points.slice(0, 3)
            
            return (
              <div className="pb-6 border-b border-gray-200">
                <h3 className="font-bold text-base mb-4 text-gray-900">Good to know:</h3>
                <div className="space-y-3">
                  {displayPoints.map((point, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-600 flex items-center justify-center mt-0.5">
                        <Check className="w-3.5 h-3.5 text-white" />
                      </div>
                      <p className="text-sm text-gray-900 leading-relaxed flex-1">{point}</p>
                    </div>
                  ))}
                </div>
              </div>
            )
          })()}

          {/* Additional Peace of Mind Information */}
          <div className="space-y-4 pb-6 border-b border-gray-200">
            <h3 className="text-base font-bold text-gray-900">What's included</h3>
            <div className="space-y-2 text-sm">
              {package_.type === 'training' && (
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Training sessions for {duration} {duration === 1 ? 'day' : 'days'}</span>
                </div>
              )}
              {(package_.type === 'accommodation' || package_.type === 'all_inclusive') && (
                <>
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Training sessions included</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Accommodation for {duration} {duration === 1 ? 'night' : 'nights'}</span>
                  </div>
                </>
              )}
              {package_.includes_meals && (
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">
                    {package_.meal_plan_details?.meals_per_day 
                      ? `${package_.meal_plan_details.meals_per_day} meal${package_.meal_plan_details.meals_per_day > 1 ? 's' : ''} per day`
                      : 'Meals included'}
                  </span>
                </div>
              )}
              {gym.amenities?.wifi && (
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Free WiFi</span>
                </div>
              )}
              {gym.amenities?.parking && (
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Parking available</span>
                </div>
              )}
              {gym.amenities?.security && (
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">24/7 Security</span>
                </div>
              )}
            </div>
          </div>

          {/* Safety & Policies */}
          <div className="space-y-3 pb-6 border-b border-gray-200">
            <h3 className="text-base font-bold text-gray-900">Safety & policies</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Booking Guarantee</span>
              </div>
              {package_.cancellation_policy_days && (
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Free cancellation up to {package_.cancellation_policy_days} days before check-in</span>
                </div>
              )}
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Secure payment processing</span>
              </div>
              {gym.amenities?.fire_safety && (
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Fire safety compliant</span>
                </div>
              )}
              {gym.amenities?.first_aid && (
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>First aid facilities available</span>
                </div>
              )}
            </div>
          </div>

          {/* Guest Details Form - In Container */}
          <div className="px-4 pb-0">
            <Card className="border border-gray-300 rounded-lg shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold">Enter your details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Blue Info Box */}
                <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-300 rounded-md">
                  <AlertCircle className="w-4 h-4 text-blue-700 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-blue-900">Almost done! Just fill in the <span className="text-red-600">*</span> required info</span>
                </div>

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

            {/* Discipline */}
            <div className="space-y-2">
              <Label htmlFor="discipline-mobile" className="text-sm font-medium">
                Discipline <span className="text-red-600">*</span>
              </Label>
              <Select
                id="discipline-mobile"
                value={discipline}
                onChange={(e) => setDiscipline(e.target.value)}
                className="h-11"
                required
              >
                <option value="">Select a discipline</option>
                {DISCIPLINES.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </Select>
            </div>

            {/* Experience Level */}
            <div className="space-y-2">
              <Label htmlFor="experience-mobile" className="text-sm font-medium">
                Experience Level <span className="text-red-600">*</span>
              </Label>
              <Select
                id="experience-mobile"
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value as any)}
                className="h-11"
                required
              >
                {EXPERIENCE_LEVELS.map(level => (
                  <option key={level} value={level}>
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </option>
                ))}
              </Select>
            </div>

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

            {/* Paperless confirmation checkbox */}
            <div className="space-y-3 pt-2">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-1 w-4 h-4 text-[#003580] border-gray-300 rounded focus:ring-[#003580]"
                  defaultChecked
                />
                <div>
                  <span className="text-sm text-gray-700">Yes, I'd like free paperless confirmation (recommended)</span>
                  <p className="text-xs text-gray-500 mt-1">We'll text you a link to download our app</p>
                </div>
              </label>
            </div>

            {/* Update account checkbox - Moved to bottom */}
            <div className="space-y-3 pt-2 pb-2">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-1 w-4 h-4 text-[#003580] border-gray-300 rounded focus:ring-[#003580]"
                />
                <div>
                  <span className="text-sm text-gray-700">Update my account to include these new details</span>
                </div>
              </label>
            </div>
              </CardContent>
            </Card>
          </div>

            {/* Mobile Submit Button - Fixed at bottom */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-50 md:hidden">
              <Button
                onClick={handleSubmit}
                disabled={submitting || !firstName || !lastName || !email || !phone}
                className="w-full h-12 bg-[#003580] hover:bg-[#003580]/90 text-white font-semibold text-base"
              >
                {submitting ? 'Submitting...' : (
                  <>
                    Final Steps
                    <ArrowLeft className="w-5 h-5 ml-2 rotate-180" />
                  </>
                )}
              </Button>
              <p className="text-xs text-center text-gray-500 mt-2">
                You won't be charged yet. Availability confirmed by gym.
              </p>
            </div>
          </div>

        {/* Desktop Layout - Keep existing */}
        <div className="hidden md:grid lg:grid-cols-3 gap-6">
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
                    {duration} {duration === 1 ? 'night' : 'nights'}
                    {priceInfo && ` (${priceInfo.durationLabel})`}
                  </div>
                </div>
                <div className="pt-3 border-t border-gray-300">
                  <div className="text-xs text-gray-500 mb-1">You selected</div>
                  <div className="font-semibold">
                    {guestCount} {guestCount === 1 ? 'guest' : 'guests'}
                    {package_ && (
                      <>
                        {package_.type === 'training' && ` • ${package_.name}`}
                        {package_.type === 'accommodation' && ` • Training + Accommodation`}
                        {package_.type === 'all_inclusive' && ` • All Inclusive`}
                      </>
                    )}
                    {variant && ` • ${variant.name}`}
                  </div>
                </div>
                <Link 
                  href={`/gyms/${gym.id}?checkin=${checkin}&checkout=${checkout}`}
                  className="block text-sm text-[#003580] hover:underline mt-3"
                >
                  Change your selection
                </Link>
              </CardContent>
            </Card>

            {/* Price Summary */}
            <Card className="border border-gray-300 rounded-lg shadow-sm">
              <CardHeader className="bg-gray-50 border-b border-gray-300 pb-3">
                <CardTitle className="text-lg font-semibold">Your price summary</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-3">
                {priceInfo ? (
                  <>
                    <div className="space-y-3 text-sm">
                      {/* Training Package */}
                      {package_.type === 'training' && (
                      <div className="flex justify-between">
                          <span className="text-gray-700">
                            Training package ({duration} {duration === 1 ? 'day' : 'days'})
                        </span>
                          <span className="font-medium text-gray-900">
                          {formatPrice(convertPrice(totalPrice, gym.currency))}
                        </span>
                      </div>
                      )}
                      
                      {/* Accommodation Packages */}
                      {(package_.type === 'accommodation' || package_.type === 'all_inclusive') && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-gray-700">
                              Training package ({duration} {duration === 1 ? 'day' : 'days'})
                            </span>
                            <span className="font-medium text-gray-900">
                              {formatPrice(convertPrice(Math.round(totalPrice * 0.6), gym.currency))}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-700">
                              Accommodation ({duration} {duration === 1 ? 'night' : 'nights'})
                            </span>
                            <span className="font-medium text-gray-900">
                              {formatPrice(convertPrice(Math.round(totalPrice * 0.4), gym.currency))}
                            </span>
                          </div>
                        </>
                      )}
                      
                      {/* Meals */}
                      {(package_.includes_meals || package_.type === 'all_inclusive') && (
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
                          {formatPrice(convertPrice(finalTotal, gym.currency))}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Includes all taxes and charges</p>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    Please select dates to see pricing
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Center Column - User Details Form */}
          <div className="lg:col-span-2 space-y-4">
            <div>
              <h1 className="text-2xl font-bold mb-3 text-gray-900">Enter your details</h1>
              
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
                {/* Blue Info Box - Separate floating box */}
                <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-300 rounded-md">
                  <AlertCircle className="w-4 h-4 text-blue-700 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-blue-900">Almost done! Just fill in the * required info</span>
                </div>
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

                <div className="space-y-3 pt-2">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      className="mt-1 w-4 h-4 text-[#003580] border-gray-300 rounded focus:ring-[#003580]"
                      defaultChecked
                    />
                    <div>
                      <span className="text-sm text-gray-700">Yes, I'd like free paperless confirmation (recommended)</span>
                      <p className="text-xs text-gray-500 mt-1">We'll text you a link to download our app</p>
                    </div>
                  </label>
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

            {/* Good to Know */}
            {package_ && (
              <GoodToKnowCard 
                package_={package_} 
                variant={variant}
                checkin={checkin}
                checkout={checkout}
              />
            )}

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

                  <div className="space-y-2">
                  <Label htmlFor="discipline" className="text-sm font-medium">Discipline *</Label>
                    <Select
                      id="discipline"
                      value={discipline}
                      onChange={(e) => setDiscipline(e.target.value)}
                    className="h-11"
                      required
                    >
                      <option value="">Select a discipline</option>
                      {DISCIPLINES.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="experience" className="text-sm font-medium">Experience Level *</Label>
                  <Select
                    id="experience"
                    value={experienceLevel}
                    onChange={(e) => setExperienceLevel(e.target.value as any)}
                    className="h-11"
                    required
                  >
                    {EXPERIENCE_LEVELS.map(level => (
                      <option key={level} value={level}>
                        {level.charAt(0).toUpperCase() + level.slice(1)}
                      </option>
                    ))}
                  </Select>
                </div>

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


            {/* Submit Button */}
            <div className="pt-2">
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-800 rounded-md text-sm">
                  {error}
                </div>
              )}
              <Button
                className="w-full h-14 text-lg font-bold bg-[#003580] hover:bg-[#003580]/90 text-white"
                onClick={handleSubmit}
                disabled={!isValidDuration || !meetsMinimumStay || !discipline || !firstName || !lastName || !email || !phone || submitting}
              >
                {submitting ? 'Submitting...' : (
                  <>
                    Final Steps
                    <ArrowLeft className="w-5 h-5 ml-2 rotate-180" />
                  </>
                )}
              </Button>
              <p className="text-xs text-center text-gray-500 mt-3">
                You won't be charged yet. Availability confirmed by gym.
              </p>
            </div>
          </div>
        </div>

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
    </div>
  )
}
