'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/hooks/use-auth'

const POLL_MS = 400
const MAX_POLLS = 10

/**
 * After `/claim/<token>` redirects to `/manage?claimed=1`, give the browser client
 * a few chances to read the fresh Supabase cookies before treating the owner as
 * signed out and sending them to `/auth/signin`.
 */
export function useClaimRedirectHydration() {
  const searchParams = useSearchParams()
  const justClaimed = searchParams?.get('claimed') === '1'
  const { user, loading: authLoading, revalidateSession } = useAuth()
  const [awaitingClaimSession, setAwaitingClaimSession] = useState(
    () => justClaimed,
  )

  useEffect(() => {
    if (!justClaimed || user) {
      setAwaitingClaimSession(false)
      return
    }
    if (authLoading) return

    let cancelled = false
    let polls = 0

    const run = async () => {
      polls += 1
      await revalidateSession()
      if (cancelled) return
      if (polls >= MAX_POLLS) {
        setAwaitingClaimSession(false)
        return
      }
      window.setTimeout(run, POLL_MS)
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [justClaimed, user, authLoading, revalidateSession])

  const blockingAuth =
    justClaimed && awaitingClaimSession && !user && !authLoading

  return { justClaimed, blockingAuth }
}
