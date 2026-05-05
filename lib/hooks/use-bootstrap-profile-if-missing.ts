'use client'

import { useEffect, useRef, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/lib/types/database'
import {
  inferProfileRoleFromUser,
  upsertMinimalProfileForUser,
} from '@/lib/auth/recover-missing-profile'

const MAX_BOOTSTRAP_ATTEMPTS = 3

/**
 * If the session exists but `profiles` is missing, upsert a minimal row and refreshProfile.
 * Replaces the old `/auth/role-selection` hand-off.
 *
 * @returns `true` when we should send the user to sign-in (RLS / repeated upsert failure).
 */
export function useBootstrapProfileIfMissing({
  authLoading,
  user,
  profile,
  refreshProfile,
}: {
  authLoading: boolean
  user: User | null
  profile: Profile | null
  refreshProfile: () => Promise<void>
}): boolean {
  const attemptsRef = useRef(0)
  const inFlightRef = useRef(false)
  const [giveUp, setGiveUp] = useState(false)

  useEffect(() => {
    if (!user?.id) {
      attemptsRef.current = 0
      setGiveUp(false)
    }
  }, [user?.id])

  useEffect(() => {
    if (profile) {
      attemptsRef.current = 0
      setGiveUp(false)
    }
  }, [profile?.id])

  useEffect(() => {
    if (authLoading || !user?.id || profile || inFlightRef.current) return
    if (attemptsRef.current >= MAX_BOOTSTRAP_ATTEMPTS) {
      setGiveUp(true)
      return
    }

    const uid = user.id
    attemptsRef.current += 1
    inFlightRef.current = true

    void (async () => {
      try {
        const role = inferProfileRoleFromUser(user)
        const ok = await upsertMinimalProfileForUser(uid, role)
        if (ok) {
          await refreshProfile()
        } else if (attemptsRef.current >= MAX_BOOTSTRAP_ATTEMPTS) {
          setGiveUp(true)
        }
      } finally {
        inFlightRef.current = false
      }
    })()
  }, [authLoading, user, profile, refreshProfile])

  return giveUp
}
