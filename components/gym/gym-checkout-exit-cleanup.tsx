'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { gymSlugOrIdFromPathname } from '@/lib/utils/gym-route'
import {
  clearCheckoutExitToGym,
  purgeStaleCheckoutSessionForGym,
  readCheckoutExitTarget,
} from '@/lib/utils/review-checkout-chrome'

interface GymCheckoutExitCleanupProps {
  gymId: string
}

/** Clears checkout-exit state once the matching gym listing has mounted. */
export function GymCheckoutExitCleanup({ gymId }: GymCheckoutExitCleanupProps) {
  const pathname = usePathname()

  useEffect(() => {
    const slugOrId = gymSlugOrIdFromPathname(pathname ?? '')
    purgeStaleCheckoutSessionForGym(gymId, slugOrId ?? undefined)

    const exit = readCheckoutExitTarget()
    if (!exit) return
    const matches =
      exit.gymId === gymId ||
      (slugOrId != null && exit.slugOrId === slugOrId)
    if (matches) clearCheckoutExitToGym()
  }, [pathname, gymId])

  return null
}

