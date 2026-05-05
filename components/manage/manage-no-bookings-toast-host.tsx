'use client'

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/hooks/use-auth'
import { useActiveGym } from '@/components/manage/active-gym-context'
import { createClient } from '@/lib/supabase/client'
import {
  NoBookingsToastCard,
  VerificationMilestoneToastCard,
  NO_BOOKINGS_DISMISS_STORAGE_KEY,
} from '@/components/manage/dashboard-no-bookings-toast'
import { SESSION_DEFER_NO_BOOKINGS_KEY } from '@/components/manage/claim-dashboard-tour'
import {
  VERIFICATION_MILESTONE_EVENT,
  milestoneToastCopy,
  type VerificationMilestoneDetail,
} from '@/lib/manage/verification-milestone-toast'
import { useIsNarrowForManageSidebar } from '@/lib/hooks/use-is-narrow-sidebar'
import { cn } from '@/lib/utils'

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

const NO_BOOKINGS_SCHEDULE_EVENT = 'cs:no-bookings-toast-schedule'

const SLIDE_MS = 300
const HOLD_MS = 5000
const RAF_STAGGER_MS = 16

type NbStage = 'normal' | 'off-right' | 'return-prep' | 'return-in'
type SuccessStage = 'hidden' | 'off' | 'on' | 'exit'

function useNoBookingsToastDefer() {
  const deferTimerRef = useRef<number | null>(null)
  /** Same default on server + client to avoid hydration mismatch; sessionStorage read in effect. */
  const [pastDefer, setPastDefer] = useState(true)

  const applyDeferFromStorage = useCallback(() => {
    if (deferTimerRef.current != null) {
      window.clearTimeout(deferTimerRef.current)
      deferTimerRef.current = null
    }
    try {
      const raw = sessionStorage.getItem(SESSION_DEFER_NO_BOOKINGS_KEY)
      if (!raw) {
        setPastDefer(true)
        return
      }
      const until = parseInt(raw, 10)
      if (Number.isNaN(until) || Date.now() >= until) {
        sessionStorage.removeItem(SESSION_DEFER_NO_BOOKINGS_KEY)
        setPastDefer(true)
        return
      }
      setPastDefer(false)
      const ms = Math.max(0, until - Date.now())
      deferTimerRef.current = window.setTimeout(() => {
        deferTimerRef.current = null
        try {
          sessionStorage.removeItem(SESSION_DEFER_NO_BOOKINGS_KEY)
        } catch {
          /* ignore */
        }
        setPastDefer(true)
      }, ms)
    } catch {
      setPastDefer(true)
    }
  }, [])

  useLayoutEffect(() => {
    applyDeferFromStorage()
    const onSchedule = () => applyDeferFromStorage()
    window.addEventListener(NO_BOOKINGS_SCHEDULE_EVENT, onSchedule)
    return () => window.removeEventListener(NO_BOOKINGS_SCHEDULE_EVENT, onSchedule)
  }, [applyDeferFromStorage])

  return pastDefer
}

export function ManageNoBookingsToastHost() {
  const pathname = usePathname() ?? ''
  const narrowPartnerHub = useIsNarrowForManageSidebar()
  const { profile } = useAuth()
  const { gyms, activeGymId, loading: gymsLoading } = useActiveGym()
  const [bookingCount, setBookingCount] = useState<number | null>(null)
  const pastClaimTourDefer = useNoBookingsToastDefer()

  const [dismissedNb, setDismissedNb] = useState(false)
  useLayoutEffect(() => {
    try {
      if (sessionStorage.getItem(NO_BOOKINGS_DISMISS_STORAGE_KEY) === '1') {
        setDismissedNb(true)
      }
    } catch {
      /* ignore */
    }
  }, [])

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

  const showNbBase =
    pastClaimTourDefer &&
    !gymsLoading &&
    bookingCount !== null &&
    gymIds.length > 0 &&
    bookingCount === 0 &&
    !shouldHideNoBookingsToast(pathname)

  const showNbCard = showNbBase && !dismissedNb
  /** Partner hub mobile: hide top-right chip (cramped vs header + hub bar); milestones use bottom tray */
  const showNbCardEffective = showNbCard && !narrowPartnerHub

  const showNbRef = useRef(showNbCardEffective)
  showNbRef.current = showNbCardEffective

  const [celebration, setCelebration] = useState<VerificationMilestoneDetail | null>(null)
  const [nbStage, setNbStage] = useState<NbStage>('normal')
  const [successStage, setSuccessStage] = useState<SuccessStage>('hidden')
  const [seqIncludesNb, setSeqIncludesNb] = useState(false)

  const idleNormal = celebration === null && nbStage === 'normal'

  const [cardPeek, setCardPeek] = useState({ visible: false, entered: false })

  useEffect(() => {
    if (!showNbCardEffective || !idleNormal) {
      setCardPeek({ visible: false, entered: false })
      return
    }
    const t = window.setTimeout(() => setCardPeek((p) => ({ ...p, visible: true })), 320)
    return () => window.clearTimeout(t)
  }, [showNbCardEffective, idleNormal, pathname])

  useEffect(() => {
    if (!cardPeek.visible || !idleNormal) {
      setCardPeek((p) => ({ ...p, entered: false }))
      return
    }
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setCardPeek((p) => ({ ...p, entered: true }))
      })
    })
    return () => cancelAnimationFrame(id)
  }, [cardPeek.visible, idleNormal])

  const runningRef = useRef(false)
  const sequenceIdRef = useRef(0)
  const pendingTimeoutsRef = useRef<number[]>([])

  const clearPendingTimeouts = useCallback(() => {
    pendingTimeoutsRef.current.forEach((id) => window.clearTimeout(id))
    pendingTimeoutsRef.current = []
  }, [])

  const runSequence = useCallback((detail: VerificationMilestoneDetail) => {
    if (runningRef.current) return
    runningRef.current = true
    const myId = ++sequenceIdRef.current
    clearPendingTimeouts()

    const schedule = (fn: () => void, ms: number) => {
      const id = window.setTimeout(() => {
        if (sequenceIdRef.current !== myId) return
        fn()
      }, ms)
      pendingTimeoutsRef.current.push(id)
    }

    const hasNb = showNbRef.current
    setSeqIncludesNb(hasNb)
    setCelebration(detail)
    setSuccessStage('hidden')
    setNbStage('normal')

    const D = SLIDE_MS
    const HOLD = HOLD_MS

    if (hasNb) {
      schedule(() => setNbStage('off-right'), 0)
      schedule(() => setSuccessStage('off'), D)
      schedule(() => {
        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(() => {
            if (sequenceIdRef.current !== myId) return
            setSuccessStage('on')
          })
        })
      }, D + RAF_STAGGER_MS)
      schedule(() => setSuccessStage('exit'), D + RAF_STAGGER_MS + D + HOLD)
      schedule(() => {
        setSuccessStage('hidden')
        setCelebration(null)
        setNbStage('return-prep')
      }, D + RAF_STAGGER_MS + D + HOLD + D)
      schedule(() => {
        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(() => {
            if (sequenceIdRef.current !== myId) return
            setNbStage('return-in')
          })
        })
      }, D + RAF_STAGGER_MS + D + HOLD + D + RAF_STAGGER_MS)
      schedule(() => {
        if (sequenceIdRef.current !== myId) return
        setNbStage('normal')
        setCardPeek({ visible: true, entered: true })
        setSeqIncludesNb(false)
        runningRef.current = false
        clearPendingTimeouts()
      }, D + RAF_STAGGER_MS + D + HOLD + D + RAF_STAGGER_MS + D)
    } else {
      schedule(() => setSuccessStage('off'), 0)
      schedule(() => {
        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(() => {
            if (sequenceIdRef.current !== myId) return
            setSuccessStage('on')
          })
        })
      }, RAF_STAGGER_MS)
      schedule(() => setSuccessStage('exit'), RAF_STAGGER_MS + D + HOLD)
      schedule(() => {
        if (sequenceIdRef.current !== myId) return
        setSuccessStage('hidden')
        setCelebration(null)
        setNbStage('normal')
        setSeqIncludesNb(false)
        runningRef.current = false
        clearPendingTimeouts()
      }, RAF_STAGGER_MS + D + HOLD + D)
    }
  }, [clearPendingTimeouts])

  useEffect(() => {
    const onMilestone = (ev: Event) => {
      const e = ev as CustomEvent<VerificationMilestoneDetail>
      if (!e.detail?.kind) return
      runSequence(e.detail)
    }
    window.addEventListener(VERIFICATION_MILESTONE_EVENT, onMilestone)
    return () => window.removeEventListener(VERIFICATION_MILESTONE_EVENT, onMilestone)
  }, [runSequence])

  useEffect(() => {
    return () => {
      sequenceIdRef.current += 1
      clearPendingTimeouts()
    }
  }, [clearPendingTimeouts])

  const dismissNb = () => {
    if (!idleNormal) return
    setDismissedNb(true)
    try {
      sessionStorage.setItem(NO_BOOKINGS_DISMISS_STORAGE_KEY, '1')
    } catch {
      /* ignore */
    }
  }

  if (profile?.role !== 'owner') return null

  const previewHref =
    activeGymId && activeGymId.length > 0
      ? `/manage/gym/preview?gym_id=${activeGymId}`
      : '/manage/gym/preview'

  const renderNbLayer =
    showNbCardEffective ||
    (!narrowPartnerHub && seqIncludesNb) ||
    (!narrowPartnerHub && (nbStage === 'off-right' || nbStage === 'return-prep' || nbStage === 'return-in'))

  const nbMotion = (() => {
    /** Mobile: NB layer unused */
    if (narrowPartnerHub) return 'pointer-events-none opacity-0'
    if (!idleNormal) {
      if (nbStage === 'off-right') {
        return 'translate-x-[calc(100%+28px)] opacity-0 transition-[transform,opacity] duration-300 ease-in-out'
      }
      if (nbStage === 'return-prep') {
        return 'translate-x-[calc(100%+28px)] opacity-100 transition-none'
      }
      if (nbStage === 'return-in') {
        return 'translate-x-0 opacity-100 transition-[transform,opacity] duration-300 ease-in-out'
      }
      if (showNbCard) {
        return 'translate-x-0 opacity-100 transition-[transform,opacity] duration-300 ease-in-out'
      }
      return 'pointer-events-none opacity-0'
    }
    if (!showNbCardEffective) return 'pointer-events-none opacity-0'
    if (!cardPeek.visible) {
      return 'translate-x-2 -translate-y-2 opacity-0 transition-none'
    }
    if (!cardPeek.entered) {
      return 'translate-x-2 -translate-y-2 opacity-0 transition-all duration-300 ease-out'
    }
    return 'translate-x-0 translate-y-0 opacity-100 transition-all duration-300 ease-out'
  })()

  const successMotion = (() => {
    if (narrowPartnerHub) {
      if (successStage === 'off') return 'translate-y-2 opacity-0 transition-none'
      if (successStage === 'on')
        return 'translate-y-0 opacity-100 transition-[transform,opacity] duration-300 ease-out'
      if (successStage === 'exit')
        return 'translate-y-3 opacity-0 transition-[transform,opacity] duration-300 ease-in-out'
      return 'opacity-0'
    }
    if (successStage === 'off') {
      return 'translate-x-[calc(100%+28px)] opacity-100 transition-none'
    }
    if (successStage === 'on') {
      return 'translate-x-0 opacity-100 transition-[transform,opacity] duration-300 ease-out'
    }
    if (successStage === 'exit') {
      return 'translate-x-[calc(100%+28px)] opacity-0 transition-[transform,opacity] duration-300 ease-in-out'
    }
    return 'opacity-0'
  })()

  const successCopy =
    celebration && successStage !== 'hidden'
      ? milestoneToastCopy(celebration.kind, celebration.inboxEmail)
      : null

  const showSuccessLayer = Boolean(celebration && successStage !== 'hidden' && successCopy)

  const anyLayer = renderNbLayer || showSuccessLayer
  if (!anyLayer) return null

  return (
    <div
      className={cn(
        'fixed z-[70]',
        /** Desktop / tablet partner hub */
        !narrowPartnerHub &&
          'right-4 top-32 w-[min(100vw-2rem,24rem)] max-w-sm md:right-8 md:top-20',
        /** Narrow partner hub — bottom snack tray (milestones); no bookings chip */
        narrowPartnerHub &&
          'inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom,0px))] top-auto flex w-auto max-w-none justify-center px-0',
        idleNormal ? 'pointer-events-auto' : 'pointer-events-none',
      )}
      aria-live="polite"
    >
      <div className="relative w-full max-w-lg min-h-0 md:min-h-[4.5rem]">
        {renderNbLayer ? (
          <div className={cn('w-full', nbMotion)}>
            <NoBookingsToastCard
              previewHref={previewHref}
              onDismiss={dismissNb}
              className={!idleNormal ? 'pointer-events-none' : undefined}
            />
          </div>
        ) : null}
        {showSuccessLayer && successCopy ? (
          <div
            className={cn(
              'w-full pointer-events-auto',
              renderNbLayer ? 'absolute left-0 top-0 z-10' : 'relative',
              successMotion,
            )}
          >
            <VerificationMilestoneToastCard title={successCopy.title} body={successCopy.body} />
          </div>
        ) : null}
      </div>
    </div>
  )
}
