'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/use-auth'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Booking, Gym } from '@/lib/types/database'

export default function DashboardPage() {
  const router = useRouter()
  const { user, profile, loading: authLoading } = useAuth()
  const [bookings, setBookings] = useState<(Booking & { gym: Gym })[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    
    if (!user) {
      router.replace('/auth/signin')
      return
    }

    if (!profile) {
      // No profile yet, redirect to role selection
      router.replace('/auth/role-selection')
      return
    }

    if (profile.role !== 'fighter') {
      if (profile.role === 'owner') {
        router.replace('/manage')
      } else if (profile.role === 'admin') {
        router.replace('/admin')
      }
      return
    }

    fetchBookings()
  }, [user, profile, authLoading])

  const fetchBookings = async () => {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        gym:gyms(*)
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

  const canReview = (booking: Booking) => {
    return booking.status === 'completed' && new Date(booking.end_date) < new Date()
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="h-10 w-48 bg-gray-200 rounded animate-pulse mb-6" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-6">My Bookings</h1>

        {bookings.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <p className="mb-4">No bookings yet</p>
              <Link href="/search">
                <Button>Browse Gyms</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {bookings.map(booking => (
              <Card key={booking.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      {booking.gym.name} - {booking.gym.city}, {booking.gym.country}
                    </CardTitle>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                          booking.status === 'awaiting_approval' ? 'bg-yellow-100 text-yellow-800' :
                          booking.status === 'declined' ? 'bg-red-100 text-red-800' :
                          booking.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                      {booking.status.replace('_', ' ')}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-4">
                    <p><strong>Dates:</strong> {new Date(booking.start_date).toLocaleDateString()} - {new Date(booking.end_date).toLocaleDateString()}</p>
                    <p><strong>Discipline:</strong> {booking.discipline}</p>
                    <p><strong>Experience Level:</strong> {booking.experience_level}</p>
                    <p><strong>Total:</strong> {booking.total_price} {booking.gym.currency}</p>
                  </div>
                  {canReview(booking) && (
                    <Link href={`/bookings/${booking.id}/review`}>
                      <Button variant="outline">Write Review</Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
