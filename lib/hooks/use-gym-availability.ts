'use client'

import { useEffect, useMemo, useState } from 'react'
import type { GuestDayAvailability } from '@/lib/booking/gym-availability'
import {
  isGuestCheckinBlocked,
  isGuestCheckoutBlocked,
  type GymAvailabilityGymMeta,
} from '@/lib/booking/gym-availability'

export function useGymAvailability(gymId: string | null | undefined, enabled = true) {
  const [daysByDate, setDaysByDate] = useState<Map<string, GuestDayAvailability>>(new Map())
  const [gymMeta, setGymMeta] = useState<
    Pick<GymAvailabilityGymMeta, 'booking_advance_min_days' | 'booking_advance_max_days'>
  >({
    booking_advance_min_days: null,
    booking_advance_max_days: null,
  })
  const [loading, setLoading] = useState(false)

  const range = useMemo(() => {
    const from = new Date()
    from.setHours(0, 0, 0, 0)
    const to = new Date(from)
    to.setMonth(to.getMonth() + 14)
    const fmt = (d: Date) => {
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${y}-${m}-${day}`
    }
    return { from: fmt(from), to: fmt(to) }
  }, [])

  useEffect(() => {
    if (!enabled || !gymId) return
    let cancelled = false
    setLoading(true)
    ;(async () => {
      try {
        const qs = new URLSearchParams({ from: range.from, to: range.to })
        const res = await fetch(`/api/gyms/${gymId}/availability?${qs}`, {
          cache: 'no-store',
        })
        const json = await res.json()
        if (cancelled || !res.ok) return
        const map = new Map<string, GuestDayAvailability>()
        for (const day of (json.days ?? []) as GuestDayAvailability[]) {
          map.set(day.date, day)
        }
        setDaysByDate(map)
        setGymMeta({
          booking_advance_min_days: json.booking_advance_min_days ?? null,
          booking_advance_max_days: json.booking_advance_max_days ?? null,
        })
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [enabled, gymId, range.from, range.to])

  const isDateBlocked = useMemo(() => {
    return (date: Date, phase: 'checkin' | 'checkout' = 'checkin') => {
      const y = date.getFullYear()
      const m = String(date.getMonth() + 1).padStart(2, '0')
      const d = String(date.getDate()).padStart(2, '0')
      const key = `${y}-${m}-${d}`
      const day = daysByDate.get(key)
      if (phase === 'checkout') {
        return isGuestCheckoutBlocked(day)
      }
      return isGuestCheckinBlocked(day, gymMeta)
    }
  }, [daysByDate, gymMeta])

  return { daysByDate, gymMeta, isDateBlocked, loading }
}
