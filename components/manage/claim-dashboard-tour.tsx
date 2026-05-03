'use client'

/**
 * First-run dashboard tour for owners who complete the gym **claim-link** flow
 * (admin pre-list handoff). Shown only while `profiles.claim_dashboard_tour_pending`
 * is true, and only after the blocking claim password modal is gone — so it
 * runs in sequence after account claim, not for self-serve signups.
 */
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const TOUR_ENTER_DELAY_MS = 580
/** After claim tour ends, delay the “No bookings yet” toast so it doesn’t stack on the tour. */
export const DEFER_NO_BOOKINGS_TOAST_MS = 5000
export const SESSION_DEFER_NO_BOOKINGS_KEY = 'cs:defer_no_bookings_toast_until'
const SETUP_GUIDE_EXPAND_EVENT = 'dashboard-setup-guide:claim-tour-expand'

const CLAIM_TOUR_HIGHLIGHT: string[] = [
  'relative',
  'z-[88]',
  'rounded-md',
  'ring-2',
  'ring-[#003580]',
  'ring-offset-2',
  'ring-offset-white',
  'shadow-sm',
  'motion-safe:transition-shadow',
  'motion-reduce:transition-none',
]

type TourStep = {
  id: string
  /** `data-claim-tour` value; null = centered card */
  anchor: string | null
  title: string
  paragraphs: string[]
}

const STEPS: TourStep[] = [
  {
    id: 'welcome',
    anchor: null,
    title: 'Welcome to your partner dashboard',
    paragraphs: [
      'Your gym was pre-listed so you are not starting from zero. From here you manage your listing, bookings, and payouts when you are ready.',
      'This short tour points to the essentials. Skip anytime — your listing stays in draft until you complete the setup guide and go live.',
    ],
  },
  {
    id: 'pricing',
    anchor: null,
    title: 'Rates and packages',
    paragraphs: [
      'Guests expect what they see on CombatStay to match what you offer. Review packages and pricing before you take bookings.',
      'The setup guide links into the right wizard steps so you can confirm everything in one pass.',
    ],
  },
  {
    id: 'edit-gym',
    anchor: 'tour-edit-gym',
    title: 'Edit gym',
    paragraphs: [
      'Listing details, photos, schedule, and policies are edited here (or via the guided steps in your setup checklist).',
    ],
  },
  {
    id: 'payouts',
    anchor: 'tour-payouts',
    title: 'Payout setup',
    paragraphs: [
      'Under Balances, use Payout setup (or Payouts for Stripe activity) to choose Wise or Stripe Connect and finish payout details before you accept paid stays.',
      'You can polish your listing first; complete payouts before switching the gym live if you plan to charge guests.',
    ],
  },
  {
    id: 'setup-guide',
    anchor: 'tour-setup-guide',
    title: 'Setup guide',
    paragraphs: [
      'The floating checklist tracks required items: listing and account, packages and pricing, photos, and payouts. Tap a row to jump straight there.',
      'When every required row is complete, use Open review at the bottom to run the final check and publish.',
    ],
  },
  {
    id: 'wrap-up',
    anchor: 'tour-view-listing',
    title: 'Preview as a guest',
    paragraphs: [
      'Use View listing to see the public page. Verification builds trust. Help center is in the sidebar if you need it.',
    ],
  },
]

function profileNeedsClaimPassword(profile: unknown): boolean {
  const p = profile as { placeholder_account?: boolean | null; claim_password_set?: boolean | null } | null
  if (!p) return true
  return Boolean(p.placeholder_account) || p.claim_password_set === false
}

function useBodyScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [locked])
}

export function ClaimDashboardTour() {
  const { profile, loading, refreshProfile } = useAuth()
  const router = useRouter()
  const pathname = usePathname() ?? ''
  const [enterAllowed, setEnterAllowed] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)
  const [cardBox, setCardBox] = useState<{ top: number; left: number; maxWidth: number } | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [dismissError, setDismissError] = useState<string | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const step = STEPS[stepIndex]
  const lastStep = stepIndex === STEPS.length - 1
  const dismissingRef = useRef(false)

  const needsPassword = useMemo(() => profileNeedsClaimPassword(profile), [profile])

  const tourPending = Boolean(profile?.claim_dashboard_tour_pending)
  const isOwner = profile?.role === 'owner'

  useEffect(() => {
    if (loading || !tourPending || !isOwner || needsPassword) {
      setEnterAllowed(false)
      return
    }
    const t = window.setTimeout(() => setEnterAllowed(true), TOUR_ENTER_DELAY_MS)
    return () => window.clearTimeout(t)
  }, [loading, tourPending, isOwner, needsPassword])

  const recomputeCardPosition = useCallback(() => {
    const anchorId = step.anchor
    if (!anchorId) {
      setCardBox(null)
      return
    }
    const anchorEl = document.querySelector(`[data-claim-tour="${anchorId}"]`) as HTMLElement | null
    if (!anchorEl) {
      setCardBox(null)
      return
    }

    const ar = anchorEl.getBoundingClientRect()
    const margin = 12
    const maxW = Math.min(420, window.innerWidth - margin * 2)
    const estCardH = 320
    let top = ar.bottom + margin
    if (top + estCardH > window.innerHeight - margin) {
      top = Math.max(margin, ar.top - estCardH - margin)
    }
    const left = Math.min(Math.max(margin, ar.left), window.innerWidth - maxW - margin)

    setCardBox({ top, left, maxWidth: maxW })
  }, [step.anchor])

  useLayoutEffect(() => {
    if (!enterAllowed || !tourPending) return
    recomputeCardPosition()
  }, [enterAllowed, tourPending, stepIndex, recomputeCardPosition])

  useEffect(() => {
    if (!enterAllowed || !tourPending) return
    const onResize = () => recomputeCardPosition()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [enterAllowed, tourPending, recomputeCardPosition])

  const dismissTour = useCallback(
    async (outcome: 'finished' | 'skipped') => {
      if (dismissingRef.current) return
      dismissingRef.current = true
      setSubmitting(true)
      setDismissError(null)
      try {
        const res = await fetch('/api/manage/account/claim-dashboard-tour', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ outcome: outcome === 'skipped' ? 'skipped' : 'finished' }),
        })
        if (!res.ok) {
          let msg = 'Could not save tour progress. Try again in a moment.'
          try {
            const raw = await res.text()
            const parsed = JSON.parse(raw) as { error?: string }
            if (typeof parsed?.error === 'string' && parsed.error.trim()) msg = parsed.error.trim()
          } catch {
            /* use default */
          }
          console.warn('[claim-dashboard-tour] dismiss failed', res.status)
          setDismissError(msg)
          return
        }
        try {
          if (typeof window !== 'undefined') {
            window.sessionStorage.setItem(
              SESSION_DEFER_NO_BOOKINGS_KEY,
              String(Date.now() + DEFER_NO_BOOKINGS_TOAST_MS)
            )
            window.dispatchEvent(new Event('cs:no-bookings-toast-schedule'))
          }
        } catch {
          /* ignore */
        }
        await refreshProfile()
      } finally {
        dismissingRef.current = false
        setSubmitting(false)
      }
    },
    [refreshProfile]
  )

  useEffect(() => {
    if (!enterAllowed || !tourPending) return
    let anchorEl: HTMLElement | null = null
    const anchorId = step.anchor
    if (anchorId) {
      anchorEl = document.querySelector(`[data-claim-tour="${anchorId}"]`) as HTMLElement | null
      anchorEl?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      anchorEl?.classList.add(...CLAIM_TOUR_HIGHLIGHT)
    }
    return () => {
      anchorEl?.classList.remove(...CLAIM_TOUR_HIGHLIGHT)
    }
  }, [enterAllowed, tourPending, step.anchor, stepIndex])

  useEffect(() => {
    setDismissError(null)
  }, [stepIndex])

  useEffect(() => {
    if (!enterAllowed || !tourPending) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        void dismissTour('skipped')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [enterAllowed, tourPending, dismissTour])

  const focusPrimary = useCallback(() => {
    const root = cardRef.current
    if (!root) return
    const btn = root.querySelector<HTMLButtonElement>('button[data-tour-primary="1"]')
    btn?.focus()
  }, [stepIndex])

  useEffect(() => {
    if (!enterAllowed || !tourPending) return
    const id = window.requestAnimationFrame(() => focusPrimary())
    return () => window.cancelAnimationFrame(id)
  }, [enterAllowed, tourPending, stepIndex, focusPrimary])

  const fullScreenManageRoute =
    pathname.startsWith('/manage/onboarding') ||
    pathname.startsWith('/manage/security-onboarding') ||
    pathname.startsWith('/manage/invite') ||
    pathname.startsWith('/manage/list-your-gym')

  const showTour =
    !loading &&
    Boolean(profile) &&
    tourPending &&
    isOwner &&
    !needsPassword &&
    enterAllowed &&
    !fullScreenManageRoute

  /** Setup guide: checklist only on dashboard home — navigate there, expand panel, reposition after layout. */
  useEffect(() => {
    if (!showTour || step.id !== 'setup-guide') return
    const home = pathname === '/manage' || pathname === '/manage/'
    if (!home) {
      router.replace('/manage')
      return
    }
    window.dispatchEvent(new CustomEvent(SETUP_GUIDE_EXPAND_EVENT))
    const id1 = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => recomputeCardPosition())
    })
    const timer = window.setTimeout(() => recomputeCardPosition(), 160)
    return () => {
      window.cancelAnimationFrame(id1)
      window.clearTimeout(timer)
    }
  }, [showTour, step.id, pathname, router, recomputeCardPosition])

  useBodyScrollLock(showTour)

  if (!showTour) {
    return null
  }

  const centered = !step.anchor || !cardBox

  return (
    <div className="pointer-events-none fixed inset-0 z-[85] motion-safe:transition-opacity motion-reduce:transition-none">
      <div
        className="pointer-events-auto absolute inset-0 bg-stone-900/45 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-200 motion-reduce:animate-none"
        aria-hidden
      />
      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="claim-tour-title"
        className={cn(
          'pointer-events-auto fixed max-h-[min(78vh,32rem)] overflow-y-auto rounded-2xl border border-stone-200/90 bg-white shadow-[0_25px_50px_-12px_rgba(15,23,42,0.25)] motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95 motion-safe:duration-200 motion-reduce:animate-none',
          centered
            ? 'left-1/2 top-1/2 w-[min(100vw-1.5rem,26rem)] -translate-x-1/2 -translate-y-1/2 p-6 sm:p-7'
            : 'p-6 sm:p-7'
        )}
        style={
          !centered && cardBox
            ? {
                top: cardBox.top,
                left: cardBox.left,
                width: cardBox.maxWidth,
              }
            : undefined
        }
      >
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#003580]">Quick tour</p>
        <h2 id="claim-tour-title" className="mt-1.5 text-xl font-semibold tracking-tight text-stone-900 sm:text-[1.35rem]">
          {step.title}
        </h2>
        <div className="mt-4 space-y-3 text-[15px] leading-relaxed text-stone-600">
          {step.paragraphs.map((p, i) => (
            <p key={`${step.id}-${i}`}>{p}</p>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-stone-100 pt-5">
          <div className="flex flex-1 flex-wrap items-center gap-2">
            {stepIndex > 0 ? (
              <Button
                type="button"
                variant="outline"
                className="border-stone-200 text-stone-800"
                disabled={submitting}
                onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
              >
                Back
              </Button>
            ) : null}
            <span className="text-xs text-stone-400">
              Step {stepIndex + 1} of {STEPS.length}
            </span>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            {!lastStep ? (
              <Button
                type="button"
                data-tour-primary="1"
                className="bg-[#003580] text-white hover:bg-[#002a5c]"
                disabled={submitting}
                onClick={() => setStepIndex((i) => Math.min(STEPS.length - 1, i + 1))}
              >
                Next
              </Button>
            ) : (
              <Button
                type="button"
                data-tour-primary="1"
                className="bg-[#003580] text-white hover:bg-[#002a5c]"
                disabled={submitting}
                onClick={() => void dismissTour('finished')}
              >
                {submitting ? 'Saving…' : 'Done'}
              </Button>
            )}
          </div>
        </div>

        {dismissError ? (
          <p role="alert" className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
            {dismissError}
          </p>
        ) : null}

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            className="text-left text-sm font-medium text-stone-500 underline-offset-4 hover:text-stone-800 hover:underline"
            disabled={submitting}
            onClick={() => void dismissTour('skipped')}
          >
            Skip this introduction
          </button>
          <p className="text-[11px] text-stone-400">Press Esc to skip</p>
        </div>
      </div>
    </div>
  )
}
