'use client'

import { useEffect, useMemo, useState } from 'react'

type DropInAvailabilityResponse = {
  sold_out_dates: string[]
  daily_capacity: number | null
}

function addDaysISO(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  dt.setUTCDate(dt.getUTCDate() + days)
  return dt.toISOString().slice(0, 10)
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

/** Loads sold-out visit dates for a drop-in package (next 12 months). */
export function useDropInAvailability(packageId: string | null | undefined) {
  const [soldOutDates, setSoldOutDates] = useState<ReadonlySet<string>>(new Set())
  const [dailyCapacity, setDailyCapacity] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!packageId) {
      setSoldOutDates(new Set())
      setDailyCapacity(null)
      return
    }

    let cancelled = false
    const from = todayISO()
    const to = addDaysISO(from, 365)

    setLoading(true)
    void fetch(`/api/packages/${packageId}/drop-in-availability?from=${from}&to=${to}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json: DropInAvailabilityResponse | null) => {
        if (cancelled || !json) return
        setSoldOutDates(new Set(json.sold_out_dates ?? []))
        setDailyCapacity(json.daily_capacity ?? null)
      })
      .catch(() => {
        if (!cancelled) {
          setSoldOutDates(new Set())
          setDailyCapacity(null)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [packageId])

  const isSoldOut = useMemo(
    () => (date: string) => soldOutDates.has(date),
    [soldOutDates]
  )

  return { soldOutDates, dailyCapacity, loading, isSoldOut }
}
