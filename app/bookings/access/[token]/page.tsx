'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MapPin, Dumbbell, Calendar, CreditCard, User, Mail, Phone } from 'lucide-react'
import type { Booking, Gym, Package, PackageVariant } from '@/lib/types/database'

export default function BookingAccessPage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [booking, setBooking] = useState<(Booking & { 
    gym: Gym, 
    package?: Package, 
    variant?: PackageVariant 
  }) | null>(null)

  useEffect(() => {
    if (token) {
      fetchBookingAccess()
    }
  }, [token])

  const fetchBookingAccess = async () => {
    try {
      // Validate token and get booking access
      const response = await fetch(`/api/bookings/access/${token}`)
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Invalid or expired access link')
        setLoading(false)
        return
      }

      // Fetch full booking details
      const bookingResponse = await fetch(`/api/bookings/${data.booking_id}`)
      if (bookingResponse.ok) {
        const bookingData = await bookingResponse.json()
        setBooking(bookingData)
      } else {
        setError('Failed to load booking details')
      }
    } catch (err: any) {
      console.error('Error fetching booking access:', err)
      setError(err.message || 'Failed to access booking')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return ''
    const date = new Date(dateString + 'T00:00:00')
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800'
      case 'pending_confirmation':
        return 'bg-yellow-100 text-yellow-800'
      case 'declined':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="h-10 w-48 bg-gray-200 rounded animate-pulse mb-6" />
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="border border-gray-300 rounded-lg p-6 bg-white">
                  <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-4" />
                  <div className="space-y-2">
                    <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-6">
              {[1, 2].map((i) => (
                <div key={i} className="border border-gray-300 rounded-lg p-6 bg-white">
                  <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-4" />
                  <div className="space-y-2">
                    <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-xl font-bold mb-2">Access Denied</h2>
              <p className="text-gray-600 mb-4">{error || 'Booking not found'}</p>
              <div className="space-y-2">
                <Button onClick={() => router.push('/bookings/request-access')}>
                  Request Access via Email
                </Button>
                <Button variant="outline" onClick={() => router.push('/')}>
                  Go Home
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const duration = Math.floor(
    (new Date(booking.end_date).getTime() - new Date(booking.start_date).getTime()) / (1000 * 60 * 60 * 24)
  )

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Your Booking</h1>
          <p className="text-gray-600">
            Booking Reference: <strong>{booking.booking_reference || booking.id}</strong>
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Left Column: Booking Details */}
          <div className="space-y-6">
            {/* Status Card */}
            <Card>
              <CardHeader>
                <CardTitle>Booking Status</CardTitle>
              </CardHeader>
              <CardContent>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
                  {booking.status.replace('_', ' ').toUpperCase()}
                </span>
                {booking.status === 'pending_confirmation' && (
                  <p className="text-sm text-gray-600 mt-2">
                    Your booking is being confirmed with the gym. You'll be notified once it's confirmed.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Gym Details */}
            <Card>
              <CardHeader>
                <CardTitle>{booking.gym.name}</CardTitle>
                <CardDescription>
                  <div className="flex items-center gap-2 mt-2">
                    <MapPin className="w-4 h-4" />
                    <span>{booking.gym.city}, {booking.gym.country}</span>
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent>
                {booking.gym.disciplines && booking.gym.disciplines.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {booking.gym.disciplines.map((d: string, idx: number) => (
                      <span key={idx} className="inline-flex items-center gap-1 text-xs bg-gray-100 px-2 py-1 rounded">
                        <Dumbbell className="w-3 h-3 text-[#003580]" />
                        {d}
                      </span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Dates */}
            <Card>
              <CardHeader>
                <CardTitle>Dates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                    <Calendar className="w-4 h-4" />
                    Check-in
                  </div>
                  <div className="font-semibold">{formatDate(booking.start_date)}</div>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                    <Calendar className="w-4 h-4" />
                    Check-out
                  </div>
                  <div className="font-semibold">{formatDate(booking.end_date)}</div>
                </div>
                <div className="pt-2 border-t">
                  <div className="text-sm text-gray-500">Duration</div>
                  <div className="font-semibold">{duration} {duration === 1 ? 'day' : 'days'}</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Guest & Payment Info */}
          <div className="space-y-6">
            {/* Package Details */}
            {booking.package && (
              <Card>
                <CardHeader>
                  <CardTitle>Package</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="font-semibold">{booking.package.name}</div>
                  {booking.variant && (
                    <div className="text-sm text-gray-600 mt-1">
                      Accommodation: {booking.variant.name}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Guest Information */}
            <Card>
              <CardHeader>
                <CardTitle>Guest Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {booking.guest_name && (
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <span>{booking.guest_name}</span>
                  </div>
                )}
                {booking.guest_email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <span>{booking.guest_email}</span>
                  </div>
                )}
                {booking.guest_phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <span>{booking.guest_phone}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Training Details */}
            <Card>
              <CardHeader>
                <CardTitle>Training Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <span className="text-sm text-gray-500">Discipline:</span>
                  <div className="font-semibold">{booking.discipline}</div>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Experience Level:</span>
                  <div className="font-semibold capitalize">{booking.experience_level}</div>
                </div>
                {booking.notes && (
                  <div className="pt-2 border-t">
                    <span className="text-sm text-gray-500">Notes:</span>
                    <div className="text-sm mt-1">{booking.notes}</div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span>Total Amount</span>
                  <span className="font-semibold">
                    {booking.gym.currency || 'USD'} {booking.total_price.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Platform Fee (15%)</span>
                  <span>{booking.gym.currency || 'USD'} {booking.platform_fee.toFixed(2)}</span>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex justify-between">
                    <span className="font-semibold">Status</span>
                    <span className="text-sm">
                      {booking.stripe_payment_intent_id ? 'Authorized' : 'Pending'}
                    </span>
                  </div>
                  {booking.status === 'pending_confirmation' && (
                    <p className="text-xs text-gray-500 mt-2">
                      Your card has been authorized. Payment will be captured once the gym confirms availability.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mt-6 flex gap-4">
          <Button onClick={() => router.push('/search')}>Browse More Gyms</Button>
          <Button variant="outline" onClick={() => router.push('/')}>Go Home</Button>
        </div>
      </div>
    </div>
  )
}
