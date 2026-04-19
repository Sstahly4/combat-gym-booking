'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/use-auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { canonicalBookingStatusLabel, toCanonicalBookingStatus } from '@/lib/bookings/status-normalization'

type BookingRow = {
  id: string
  gym_id: string
  status: string
  start_date: string
  discipline: string | null
  gymName: string
}

export default function UpcomingBookingsPage() {
  const router = useRouter()
  const { user, profile, loading: authLoading } = useAuth()
  const [rows, setRows] = useState<BookingRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.replace('/auth/signin')
      return
    }
    if (!profile) {
      router.replace('/auth/role-selection')
      return
    }
    if (profile.role !== 'owner') {
      router.replace('/')
      return
    }

    const load = async () => {
      const supabase = createClient()
      const { data: gyms } = await supabase
        .from('gyms')
        .select('id, name')
        .eq('owner_id', user.id)

      if (!gyms?.length) {
        setRows([])
        setLoading(false)
        return
      }

      const gymIds = gyms.map((g) => g.id)
      const nameById = Object.fromEntries(gyms.map((g) => [g.id, g.name]))

      const { data: bookings, error } = await supabase
        .from('bookings')
        .select('id, gym_id, status, start_date, discipline')
        .in('gym_id', gymIds)
        .order('start_date', { ascending: true })

      if (error) {
        console.error(error)
        setRows([])
        setLoading(false)
        return
      }

      const now = new Date()
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
      const weekAhead = new Date(todayStart)
      weekAhead.setDate(weekAhead.getDate() + 7)

      const list = (bookings || []).filter((b) => {
        const start = new Date(b.start_date)
        return start >= todayStart && start < weekAhead
      })

      setRows(
        list.map((b) => ({
          id: b.id,
          gym_id: b.gym_id,
          status: b.status,
          start_date: b.start_date,
          discipline: b.discipline,
          gymName: nameById[b.gym_id] || 'Gym',
        }))
      )
      setLoading(false)
    }
    void load()
  }, [user, profile, authLoading, router])

  if (authLoading || loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="h-8 w-56 animate-pulse rounded bg-gray-100" />
        <div className="mt-6 h-40 animate-pulse rounded-xl bg-gray-100" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Upcoming bookings</h1>
      <p className="mt-1 text-sm text-gray-500">Next 7 days from today (local time), read-only.</p>

      <Card className="mt-8 border border-gray-200/90 bg-white shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-gray-900">Schedule snapshot</CardTitle>
          <CardDescription className="text-gray-500">
            Same view as on your dashboard—bookings with start dates in the next 7 days.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="text-sm text-gray-500">No upcoming bookings in the next 7 days.</p>
          ) : (
            <div className="divide-y divide-gray-100 rounded-lg border border-gray-100 bg-gray-50/40">
              {rows.map((booking) => (
                <div
                  key={booking.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-3 py-3 text-sm sm:px-4"
                >
                  <div>
                    <p className="font-medium text-gray-900">{booking.gymName}</p>
                    <p className="text-gray-500">
                      {new Date(booking.start_date).toLocaleDateString()} •{' '}
                      {booking.discipline || 'Training'}
                    </p>
                  </div>
                  <span className="rounded-md bg-white px-2 py-1 text-xs font-medium text-gray-700 ring-1 ring-gray-200/80">
                    {canonicalBookingStatusLabel(toCanonicalBookingStatus(booking.status))}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
