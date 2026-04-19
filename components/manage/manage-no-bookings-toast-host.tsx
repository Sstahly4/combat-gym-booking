'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/hooks/use-auth'
import { useActiveGym } from '@/components/manage/active-gym-context'
import { createClient } from '@/lib/supabase/client'
import { DashboardNoBookingsToast } from '@/components/manage/dashboard-no-bookings-toast'

/**
 * Routes under "Your gym" in the manage sidebar — no top-right toast here.
 * Promotions page is excluded separately (dense UI / campaigns).
 */
export function shouldHideNoBookingsToast(pathname: string): boolean {
  const p = pathname || ''
  if (p === '/manage/promotions' || p.startsWith('/manage/promotions/')) return true
  if (p.startsWith('/manage/gym')) return true
  if (p === '/manage/help' || p.startsWith('/manage/help/')) return true
  if (p === '/manage/verification' || p.startsWith('/manage/verification/')) return true
  return false
}

export function ManageNoBookingsToastHost() {
  const pathname = usePathname() ?? ''
  const { profile } = useAuth()
  const { gyms, activeGymId, loading: gymsLoading } = useActiveGym()
  const [bookingCount, setBookingCount] = useState<number | null>(null)

  const gymIds = useMemo(() => gyms.map((g) => g.id), [gyms])

  const fetchCount = useCallback(async () => {
    if (gymIds.length === 0) {
      setBookingCount(0)
      return
    }
    const supabase = createClient()
    const { count, error } = await supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .in('gym_id', gymIds)
    if (error) {
      console.error('[ManageNoBookingsToastHost]', error)
      setBookingCount(null)
      return
    }
    setBookingCount(count ?? 0)
  }, [gymIds])

  useEffect(() => {
    if (profile?.role !== 'owner') {
      setBookingCount(null)
      return
    }
    if (gymsLoading) return
    void fetchCount()
  }, [profile?.role, gymsLoading, fetchCount])

  useEffect(() => {
    if (profile?.role !== 'owner' || gymIds.length === 0) return
    const id = setInterval(() => void fetchCount(), 45_000)
    const onVis = () => {
      if (document.visibilityState === 'visible') void fetchCount()
    }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [profile?.role, gymIds.length, fetchCount])

  if (profile?.role !== 'owner') return null

  const previewHref =
    activeGymId && activeGymId.length > 0
      ? `/manage/gym/preview?gym_id=${activeGymId}`
      : '/manage/gym/preview'

  const show =
    !gymsLoading &&
    bookingCount !== null &&
    gymIds.length > 0 &&
    bookingCount === 0 &&
    !shouldHideNoBookingsToast(pathname)

  // New key on each route replays entrance animation whenever the toast should be visible.
  return (
    <DashboardNoBookingsToast key={pathname} show={show} previewHref={previewHref} />
  )
}
