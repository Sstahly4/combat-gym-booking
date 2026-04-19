'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/use-auth'
import type { VerificationStatus } from '@/lib/types/database'

export type ManageGymRow = { id: string; name: string; verification_status?: VerificationStatus }

type ActiveGymContextValue = {
  gyms: ManageGymRow[]
  activeGymId: string | null
  setActiveGymId: (id: string) => void
  loading: boolean
  /** Re-fetch gym id/name rows (e.g. after facility rename in settings). */
  refreshGyms: () => Promise<void>
}

const ActiveGymContext = createContext<ActiveGymContextValue | null>(null)

const STORAGE_KEY = 'manage_active_gym_id'

export function ActiveGymProvider({ children }: { children: ReactNode }) {
  const { user, profile, loading: authLoading } = useAuth()
  const [gyms, setGyms] = useState<ManageGymRow[]>([])
  const [activeGymId, setActiveState] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname() ?? '/manage'
  const [gymIdParam, setGymIdParam] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    setGymIdParam(params.get('gym_id'))
  }, [pathname])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const onPop = () => {
      const params = new URLSearchParams(window.location.search)
      setGymIdParam(params.get('gym_id'))
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  useEffect(() => {
    if (authLoading || !user || profile?.role !== 'owner') {
      setGyms([])
      setActiveState(null)
      setLoading(false)
      return
    }
    let cancelled = false
    ;(async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('gyms')
        .select('id, name, verification_status')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })
      if (cancelled) return
      const rows = (data || []) as ManageGymRow[]
      setGyms(rows)

      let next: string | null = null
      if (gymIdParam && rows.some((g) => g.id === gymIdParam)) {
        next = gymIdParam
      } else if (typeof window !== 'undefined') {
        const stored = sessionStorage.getItem(STORAGE_KEY)
        if (stored && rows.some((g) => g.id === stored)) next = stored
      }
      if (!next && rows[0]) next = rows[0].id
      setActiveState(next)
      if (next && typeof window !== 'undefined') sessionStorage.setItem(STORAGE_KEY, next)
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [authLoading, user, profile?.role, gymIdParam])

  const setActiveGymId = useCallback(
    (id: string) => {
      if (!gyms.some((g) => g.id === id)) return
      setActiveState(id)
      setGymIdParam(id)
      if (typeof window !== 'undefined') sessionStorage.setItem(STORAGE_KEY, id)
      const q =
        typeof window !== 'undefined'
          ? new URLSearchParams(window.location.search)
          : new URLSearchParams()
      q.set('gym_id', id)
      const qs = q.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname)
    },
    [gyms, pathname, router]
  )

  const refreshGyms = useCallback(async () => {
    if (!user?.id || profile?.role !== 'owner') return
    const supabase = createClient()
    const { data, error } = await supabase
      .from('gyms')
      .select('id, name, verification_status')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false })
    if (error) return
    const rows = (data || []) as ManageGymRow[]
    setGyms(rows)
    setActiveState((prev) => {
      if (prev && rows.some((g) => g.id === prev)) return prev
      const next = rows[0]?.id ?? null
      if (next && typeof window !== 'undefined') sessionStorage.setItem(STORAGE_KEY, next)
      return next
    })
  }, [user?.id, profile?.role])

  const value = useMemo(
    () => ({ gyms, activeGymId, setActiveGymId, loading, refreshGyms }),
    [gyms, activeGymId, setActiveGymId, loading, refreshGyms]
  )

  return <ActiveGymContext.Provider value={value}>{children}</ActiveGymContext.Provider>
}

export function useActiveGym(): ActiveGymContextValue {
  const ctx = useContext(ActiveGymContext)
  if (!ctx) {
    throw new Error('useActiveGym must be used within ActiveGymProvider')
  }
  return ctx
}
