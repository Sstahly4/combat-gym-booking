'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/use-auth'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Calendar, MapPin, Dumbbell, CreditCard, AlertCircle, Check } from 'lucide-react'
import type { Booking, Gym, Package, PackageVariant } from '@/lib/types/database'
import { useCurrency } from '@/lib/contexts/currency-context'

export default function MyBookingsPage() {
  const router = useRouter()
  const { user, profile, loading: authLoading } = useAuth()
  const { convertPrice, formatPrice } = useCurrency()
  const [bookings, setBookings] = useState<(Booking & { gym: Gym, package?: Package, variant?: PackageVariant })[]>([])
  const [loading, setLoading] = useState(true)
  const [showGuestAccess, setShowGuestAccess] = useState(false)
  const [guestReference, setGuestReference] = useState('')
  const [guestPin, setGuestPin] = useState('')
  const [guestLoading, setGuestLoading] = useState(false)
  const [guestError, setGuestError] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading) return
    
    // If logged in (any role), fetch their bookings
    if (user && profile) {
      fetchUserBookings()
      return
    }

    // Guest user - check localStorage for recent bookings
    loadGuestBookings()
    setLoading(false)
  }, [user, profile, authLoading])

  const fetchUserBookings = async () => {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        gym:gyms(*),
        package:packages(*),
        variant:package_variants(*)
      `)
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching bookings:', error)
    } else {
      setBookings(data as any)
    }
    setLoading(false)
  }

  const loadGuestBookings = () => {
    // Try to load from localStorage
    const stored = localStorage.getItem('guest_bookings')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setBookings(parsed)
      } catch (e) {
        console.error('Error parsing stored bookings:', e)
      }
    }
  }

  const handleGuestAccess = async (e: React.FormEvent) => {
    e.preventDefault()
    setGuestError(null)
    setGuestLoading(true)

    try {
      // Use API endpoint to verify PIN and get booking
      const response = await fetch('/api/bookings/guest-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_reference: guestReference.toUpperCase(),
          booking_pin: guestPin,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setGuestError(data.error || 'Failed to access booking')
        setGuestLoading(false)
        return
      }

      // Success - add to bookings and store in localStorage
      const bookingData = data.booking
      const updatedBookings = [bookingData, ...bookings.filter(b => b.id !== bookingData.id)]
      setBookings(updatedBookings)
      
      // Store in localStorage (limit to last 5 bookings)
      const toStore = updatedBookings.slice(0, 5)
      localStorage.setItem('guest_bookings', JSON.stringify(toStore))
      
      setGuestReference('')
      setGuestPin('')
      setShowGuestAccess(false)
    } catch (err: any) {
      setGuestError(err.message || 'Failed to access booking')
    } finally {
      setGuestLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return ''
    const date = new Date(dateString + 'T00:00:00')
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800'
      case 'pending_confirmation':
        return 'bg-yellow-100 text-yellow-800'
      case 'declined':
        return 'bg-red-100 text-red-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="h-10 w-48 bg-gray-200 rounded animate-pulse mb-6" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border border-gray-300 rounded-lg p-6 bg-white">
                <div className="flex gap-4">
                  <div className="w-24 h-24 bg-gray-200 rounded animate-pulse" />
                  <div className="flex-1 space-y-3">
                    <div className="h-6 w-3/4 bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
          {!user && (
            <Button 
              variant="outline" 
              onClick={() => setShowGuestAccess(!showGuestAccess)}
            >
              {showGuestAccess ? 'Cancel' : 'Access Booking'}
            </Button>
          )}
        </div>

        {/* Guest Access Form */}
        {!user && showGuestAccess && (
          <Card className="mb-6 border border-gray-300">
            <CardHeader>
              <CardTitle>Access Your Booking</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleGuestAccess} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="guest-reference">Booking Reference *</Label>
                  <Input
                    id="guest-reference"
                    type="text"
                    value={guestReference}
                    onChange={(e) => setGuestReference(e.target.value.toUpperCase())}
                    placeholder="BK-XXXX"
                    required
                  />
                  <p className="text-xs text-gray-500">
                    Found in your booking confirmation email
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="guest-pin">PIN *</Label>
                  <Input
                    id="guest-pin"
                    type="text"
                    value={guestPin}
                    onChange={(e) => setGuestPin(e.target.value)}
                    placeholder="Enter your booking PIN"
                    required
                  />
                  <p className="text-xs text-gray-500">
                    Found in your booking confirmation email
                  </p>
                </div>

                {guestError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                    {guestError}
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full bg-[#003580] hover:bg-[#003580]/90 text-white"
                  disabled={guestLoading}
                >
                  {guestLoading ? 'Accessing...' : 'Access Booking'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Bookings List */}
        {bookings.length === 0 ? (
          <Card className="border border-gray-300">
            <CardContent className="py-12 text-center">
              <p className="text-gray-600 mb-4">
                {user ? 'No bookings yet' : 'No bookings found. Access a booking using your reference and PIN above.'}
              </p>
              <Link href="/search">
                <Button className="bg-[#003580] hover:bg-[#003580]/90 text-white">
                  Browse Gyms
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {bookings.map(booking => {
              const duration = Math.floor(
                (new Date(booking.end_date).getTime() - new Date(booking.start_date).getTime()) / (1000 * 60 * 60 * 24)
              )
              
              return (
                <Card key={booking.id} className="border border-gray-300">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg text-gray-900">
                        {booking.gym.name}
                      </CardTitle>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(booking.status)}`}>
                        {booking.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                      <MapPin className="w-4 h-4" />
                      <span>{booking.gym.city}, {booking.gym.country}</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-gray-600" />
                        <span className="text-gray-700">
                          {formatDate(booking.start_date)} - {formatDate(booking.end_date)}
                        </span>
                        <span className="text-gray-500">({duration} {duration === 1 ? 'night' : 'nights'})</span>
                      </div>

                      {booking.package && (
                        <div className="flex items-center gap-2 text-sm">
                          <Dumbbell className="w-4 h-4 text-gray-600" />
                          <span className="text-gray-700">
                            {booking.package.name}
                            {booking.variant && ` • ${booking.variant.name}`}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-sm">
                        <CreditCard className="w-4 h-4 text-gray-600" />
                        <span className="text-gray-700 font-semibold">
                          Total: {formatPrice(convertPrice(booking.total_price, booking.gym.currency))}
                        </span>
                      </div>

                      {booking.booking_reference && (
                        <div className="text-xs text-gray-500 pt-2 border-t border-gray-200">
                          Reference: <span className="font-mono">{booking.booking_reference}</span>
                        </div>
                      )}

                      <div className="flex gap-3 pt-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => router.push(`/bookings/${booking.id}/success`)}
                        >
                          View Details
                        </Button>
                        {booking.status === 'pending_confirmation' && (
                          <div className="flex items-center gap-2 text-xs text-yellow-700">
                            <AlertCircle className="w-4 h-4" />
                            <span>Awaiting gym confirmation</span>
                          </div>
                        )}
                        {booking.status === 'confirmed' && (
                          <div className="flex items-center gap-2 text-xs text-green-700">
                            <Check className="w-4 h-4" />
                            <span>Confirmed</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
