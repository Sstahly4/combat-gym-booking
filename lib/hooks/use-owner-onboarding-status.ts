'use client'

/**
 * Owner onboarding status — derives whether a partner account is `pending`
 * (email verified but no published listing yet) or `active` (has at least one
 * gym row, i.e. they've completed at least the basics step of the wizard).
 *
 * Mirrors the OTA pattern used by Booking.com / Airbnb / Stripe Connect:
 *   - Identity persists once the email is confirmed (user stays signed in).
 *   - Capabilities (Dashboard, Inquiries, Calendar, Earnings) only unlock
 *     after the listing is set up.
 *
 * The "active" signal we use is the existence of a gyms row owned by the user.
 * That row gets created during the basics step of the wizard, so by the time
 * any partner has a listing draft they get the full Partner Hub UI.
 */

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/use-auth'
import { ownerHasListingDraft } from '@/lib/manage/resolve-owner-hub-url'

export type OwnerOnboardingStage = 'guest' | 'pending' | 'active'

export interface OwnerOnboardingStatus {
  stage: OwnerOnboardingStage
  /** Where to send a pending owner to continue setup. */
  nextStepHref: string
  /** Short, human-friendly label for nav CTAs. */
  nextStepLabel: string
  loading: boolean
}

const PENDING_DEFAULT_HREF = '/manage/security-onboarding'

export function useOwnerOnboardingStatus(): OwnerOnboardingStatus {
  const { user, profile, loading: authLoading } = useAuth()
  const [hasGym, setHasGym] = useState<boolean | null>(null)
  const [checking, setChecking] = useState(false)

  const isOwner = Boolean(user && profile?.role === 'owner')

  useEffect(() => {
    if (!isOwner || !user?.id) {
      setHasGym(null)
      return
    }
    let cancelled = false
    setChecking(true)
    ;(async () => {
      try {
        const supabase = createClient()
        const has = await ownerHasListingDraft(supabase, user.id)
        if (cancelled) return
        setHasGym(has)
      } finally {
        if (!cancelled) setChecking(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [isOwner, user?.id])

  if (authLoading) {
    return {
      stage: 'guest',
      nextStepHref: PENDING_DEFAULT_HREF,
      nextStepLabel: 'Finish your listing',
      loading: true,
    }
  }

  if (!isOwner) {
    return {
      stage: 'guest',
      nextStepHref: PENDING_DEFAULT_HREF,
      nextStepLabel: 'Finish your listing',
      loading: false,
    }
  }

  // Treat the pre-fetch window as "pending" so we never flash the Dashboard
  // link to a partner who actually has no listing yet.
  if (hasGym === null || checking) {
    return {
      stage: 'pending',
      nextStepHref: PENDING_DEFAULT_HREF,
      nextStepLabel: 'Finish your listing',
      loading: true,
    }
  }

  if (!hasGym) {
    return {
      stage: 'pending',
      nextStepHref: PENDING_DEFAULT_HREF,
      nextStepLabel: 'Finish your listing',
      loading: false,
    }
  }

  return {
    stage: 'active',
    nextStepHref: '/manage',
    nextStepLabel: 'Dashboard',
    loading: false,
  }
}
