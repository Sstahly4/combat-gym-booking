'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Booking, Gym } from '@/lib/types/database'

export default function BookingsPage() {
  const router = useRouter()
  const { user, profile } = useAuth()
  const [bookings, setBookings] = useState<(Booking & { gym: Gym })[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || profile?.role !== 'owner') {
      router.push('/')
      return
    }
    fetchBookings()
  }, [user, profile])

  const fetchBookings = async () => {
    const supabase = createClient()
    
    // Get owner's gym
    const { data: gym } = await supabase
      .from('gyms')
      .select('id')
      .eq('owner_id', user?.id)
      .single()

    if (!gym) {
      setLoading(false)
      return
    }

    // Get bookings for this gym
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        gym:gyms(*)
      `)
      .eq('gym_id', gym.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching bookings:', error)
    } else {
      setBookings(data as any)
    }
    setLoading(false)
  }

  const handleBookingAction = async (bookingId: string, action: 'accept' | 'decline') => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}/${action === 'accept' ? 'capture' : 'decline'}`, {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        console.error('Error updating booking:', data.error)
        return
      }

      fetchBookings()
    } catch (error) {
      console.error('Error updating booking:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="h-10 w-48 bg-gray-200 rounded animate-pulse mb-6" />
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="border border-gray-300 rounded-lg p-6 bg-white">
                <div className="h-6 w-3/4 bg-gray-200 rounded animate-pulse mb-4" />
                <div className="space-y-2">
                  <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const pendingBookings = bookings.filter(b => b.status === 'awaiting_approval')
  const confirmedBookings = bookings.filter(b => b.status === 'confirmed')
  const otherBookings = bookings.filter(b => !['awaiting_approval', 'confirmed'].includes(b.status))

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-6">Manage Bookings</h1>

        {pendingBookings.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Pending Approval</h2>
            <div className="space-y-4">
              {pendingBookings.map(booking => (
                <Card key={booking.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Booking #{booking.id.slice(0, 8)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 mb-4">
                      <p><strong>Dates:</strong> {new Date(booking.start_date).toLocaleDateString()} - {new Date(booking.end_date).toLocaleDateString()}</p>
                      <p><strong>Discipline:</strong> {booking.discipline}</p>
                      <p><strong>Experience:</strong> {booking.experience_level}</p>
                      <p><strong>Total:</strong> {booking.total_price} {booking.gym.currency}</p>
                      {booking.notes && <p><strong>Notes:</strong> {booking.notes}</p>}
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => handleBookingAction(booking.id, 'accept')}>
                        Accept
                      </Button>
                      <Button variant="destructive" onClick={() => handleBookingAction(booking.id, 'decline')}>
                        Decline
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {confirmedBookings.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Confirmed</h2>
            <div className="space-y-4">
              {confirmedBookings.map(booking => (
                <Card key={booking.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Booking #{booking.id.slice(0, 8)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p><strong>Dates:</strong> {new Date(booking.start_date).toLocaleDateString()} - {new Date(booking.end_date).toLocaleDateString()}</p>
                      <p><strong>Discipline:</strong> {booking.discipline}</p>
                      <p><strong>Total:</strong> {booking.total_price} {booking.gym.currency}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {otherBookings.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Other</h2>
            <div className="space-y-4">
              {otherBookings.map(booking => (
                <Card key={booking.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Booking #{booking.id.slice(0, 8)} - {booking.status}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p><strong>Dates:</strong> {new Date(booking.start_date).toLocaleDateString()} - {new Date(booking.end_date).toLocaleDateString()}</p>
                      <p><strong>Status:</strong> {booking.status}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {bookings.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No bookings yet
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
