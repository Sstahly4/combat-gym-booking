'use client'

/**
 * First-run dashboard tour for owners who complete the gym **claim-link** flow
 * (admin pre-list handoff). Shown only while `profiles.claim_dashboard_tour_pending`
 * is true, and only after the blocking claim password modal is gone — so it
 * runs in sequence after account claim, not for self-serve signups.
 */
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/hooks/use-auth'
import { useActiveGym } from '@/components/manage/active-gym-context'
import { useIsNarrowForManageSidebar } from '@/lib/hooks/use-is-narrow-sidebar'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { withManageGymId } from '@/lib/manage/manage-partner-nav'
import { manageGymEditHref } from '@/lib/navigation/manage-gym-edit-return'

const TOUR_ENTER_DELAY_MS = 580
const ROUTE_SETTLE_MS = 200
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

type TourContext = { gymId: string | null }

type TourStepDef = {
  id: string
  /** `data-claim-tour` value on desktop; null = centered card */
  anchor: string | null
  title: string
  paragraphs: string[]
  paragraphsMobile?: string[]
  path?: (ctx: TourContext) => string
  pathMatch?: (pathname: string, search: URLSearchParams, ctx: TourContext) => boolean
  /** Side effect once the step’s route has settled */
  onRouteReady?: 'expand-setup-guide'
}

function isManageHome(pathname: string): boolean {
  return pathname === '/manage' || pathname === '/manage/'
}

function editPath(gymId: string | null, section: string): string {
  if (gymId) return manageGymEditHref(gymId, { section })
  const q = new URLSearchParams({ section })
  return `/manage/gym/edit?${q.toString()}`
}

const STEP_DEFS: TourStepDef[] = [
  {
    id: 'welcome',
    anchor: null,
    title: 'Welcome to Partner Hub',
    paragraphs: [
      'Your gym was pre-listed so you are not starting from zero. Home, bookings, calendar, listings, and balances are in the blue bar at the top.',
      'This short tour walks you through the essentials. Skip anytime — your listing stays in draft until you finish the setup guide and go live.',
    ],
    paragraphsMobile: [
      'Your gym was pre-listed so you are not starting from zero. Swipe the blue bar at the top for Home, Bookings, Calendar, Listings, and Balances.',
      'This short tour covers the essentials. Skip anytime.',
    ],
    path: (ctx) => withManageGymId('/manage', ctx.gymId),
    pathMatch: (pathname) => isManageHome(pathname),
  },
  {
    id: 'setup-guide',
    anchor: 'tour-setup-guide',
    title: 'Setup guide',
    paragraphs: [
      'This checklist walks you through listing details, rates, photos, and payouts. Tap any row to jump straight there.',
      'When every required item is done, use Review to run the final check and make your listing visible to guests.',
    ],
    paragraphsMobile: [
      'On your phone the full checklist is easiest on a larger screen. Use Listings in the top bar (or the setup rows on Home) to finish listing, rates, photos, and payments.',
      'When every required step is done, run the final review so guests can find you.',
    ],
    path: (ctx) => withManageGymId('/manage', ctx.gymId),
    pathMatch: (pathname) => isManageHome(pathname),
    onRouteReady: 'expand-setup-guide',
  },
  {
    id: 'listings',
    anchor: 'tour-edit-gym',
    title: 'Listings',
    paragraphs: [
      'Open Listings in the top bar to edit property details, photos, schedule, and policies. The sidebar groups everything guests see on your public page.',
      'Rates and packages live under Packages in that sidebar — confirm them before you take bookings.',
    ],
    paragraphsMobile: [
      'Tap Listings in the top bar to edit property details, photos, schedule, and packages.',
      'Guests expect what they see on CombatStay to match what you offer — review packages and pricing before you take bookings.',
    ],
    path: (ctx) => editPath(ctx.gymId, 'basic'),
    pathMatch: (pathname) => pathname.startsWith('/manage/gym/edit'),
  },
  {
    id: 'packages',
    anchor: 'tour-packages',
    title: 'Packages and pricing',
    paragraphs: [
      'Packages are what guests book — training offers, nightly rates, and what is included. Keep them aligned with what you run at the gym.',
      'The setup guide links here if anything still needs attention.',
    ],
    path: (ctx) => editPath(ctx.gymId, 'packages'),
    pathMatch: (pathname, search) =>
      pathname.startsWith('/manage/gym/edit') && search.get('section') === 'packages',
  },
  {
    id: 'balances',
    anchor: 'tour-balances',
    title: 'Balances',
    paragraphs: [
      'Balances in the top bar shows live totals and payout activity when you use Stripe Connect.',
      'You can polish your listing first; finish payment setup before you accept paid bookings.',
    ],
    paragraphsMobile: [
      'Tap Balances in the top bar for live totals and payout activity when you use Stripe Connect.',
      'Finish payment setup before you accept paid bookings.',
    ],
    path: (ctx) => withManageGymId('/manage/balances', ctx.gymId),
    pathMatch: (pathname) => pathname === '/manage/balances' || pathname.startsWith('/manage/balances/'),
  },
  {
    id: 'payouts',
    anchor: 'tour-settings-payouts',
    title: 'Payout setup',
    paragraphs: [
      'Connect Stripe under Settings → Payouts. Open the account icon (top right), choose Settings, then Payouts.',
      'You only need this before accepting paid bookings — the setup guide tracks it for you.',
    ],
    paragraphsMobile: [
      'Tap the account icon (top right), open Settings, then Payouts to connect Stripe.',
      'You only need this before accepting paid bookings.',
    ],
    path: (ctx) => withManageGymId('/manage/settings?tab=payouts', ctx.gymId),
    pathMatch: (pathname, search) =>
      pathname.startsWith('/manage/settings') && search.get('tab') === 'payouts',
  },
  {
    id: 'preview',
    anchor: 'tour-view-listing',
    title: 'Preview as a guest',
    paragraphs: [
      'Use Preview listing in the listing sidebar to see your page exactly as guests will.',
      'Verification steps appear on Home when you are ready. Help is in the menu (☰) at the top right.',
    ],
    paragraphsMobile: [
      'From Listings, open Preview listing to see your page as guests will.',
      'Verification steps appear on Home when you are ready. Help is in the menu (☰) at the top right.',
    ],
    path: (ctx) => editPath(ctx.gymId, 'basic'),
    pathMatch: (pathname) => pathname.startsWith('/manage/gym/edit'),
  },
]

type TourStep = {
  id: string
  anchor: string | null
  title: string
  paragraphs: string[]
  path?: (ctx: TourContext) => string
  pathMatch?: (pathname: string, search: URLSearchParams, ctx: TourContext) => boolean
  onRouteReady?: 'expand-setup-guide'
}

function buildSteps(narrow: boolean): TourStep[] {
  return STEP_DEFS.map((def) => ({
    id: def.id,
    anchor: narrow ? null : def.anchor,
    title: def.title,
    paragraphs: narrow && def.paragraphsMobile ? def.paragraphsMobile : def.paragraphs,
    path: def.path,
    pathMatch: def.pathMatch,
    onRouteReady: def.onRouteReady,
  }))
}

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
  const { activeGymId } = useActiveGym()
  const router = useRouter()
  const pathname = usePathname() ?? ''
  const searchParams = useSearchParams()
  const narrow = useIsNarrowForManageSidebar()
  const steps = useMemo(() => buildSteps(narrow), [narrow])
  const tourCtx = useMemo<TourContext>(() => ({ gymId: activeGymId }), [activeGymId])

  const [enterAllowed, setEnterAllowed] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)
  const [routeReady, setRouteReady] = useState(false)
  const [cardBox, setCardBox] = useState<{ top: number; left: number; maxWidth: number } | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [dismissError, setDismissError] = useState<string | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const navigatingRef = useRef(false)
  const step = steps[stepIndex]
  const lastStep = stepIndex === steps.length - 1
  const dismissingRef = useRef(false)

  const needsPassword = useMemo(() => profileNeedsClaimPassword(profile), [profile])

  const tourPending = Boolean(profile?.claim_dashboard_tour_pending)
  const isOwner = profile?.role === 'owner'

  const search = useMemo(
    () => new URLSearchParams(searchParams?.toString() ?? ''),
    [searchParams]
  )

  useEffect(() => {
    if (loading || !tourPending || !isOwner || needsPassword) {
      setEnterAllowed(false)
      return
    }
    const t = window.setTimeout(() => setEnterAllowed(true), TOUR_ENTER_DELAY_MS)
    return () => window.clearTimeout(t)
  }, [loading, tourPending, isOwner, needsPassword])

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

  /** Navigate to the page for the current step, then mark route ready after layout settles. */
  useEffect(() => {
    if (!showTour) {
      setRouteReady(false)
      return
    }

    let cancelled = false
    setRouteReady(false)

    const targetPath = step.path?.(tourCtx)
    const matches = step.pathMatch
      ? step.pathMatch(pathname, search, tourCtx)
      : !targetPath || pathname === targetPath.split('?')[0]

    if (targetPath && !matches) {
      if (!navigatingRef.current) {
        navigatingRef.current = true
        router.push(targetPath)
      }
      return () => {
        cancelled = true
      }
    }

    navigatingRef.current = false

    const timer = window.setTimeout(() => {
      if (cancelled) return
      setRouteReady(true)
      if (step.onRouteReady === 'expand-setup-guide') {
        window.dispatchEvent(new CustomEvent(SETUP_GUIDE_EXPAND_EVENT))
      }
    }, ROUTE_SETTLE_MS)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [showTour, step, stepIndex, pathname, search, tourCtx, router])

  const recomputeCardPosition = useCallback(() => {
    if (narrow || !routeReady) {
      setCardBox(null)
      return
    }
    const anchorId = step.anchor
    if (step.id === 'setup-guide' || !anchorId) {
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
  }, [narrow, routeReady, step.anchor, step.id])

  useLayoutEffect(() => {
    if (!showTour || !routeReady) return
    recomputeCardPosition()
  }, [showTour, routeReady, stepIndex, recomputeCardPosition])

  useEffect(() => {
    if (!showTour || !routeReady) return
    const onResize = () => recomputeCardPosition()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [showTour, routeReady, recomputeCardPosition])

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
    if (!showTour || !routeReady) return
    if (narrow) return
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
  }, [showTour, routeReady, narrow, step.anchor, stepIndex])

  useEffect(() => {
    setDismissError(null)
  }, [stepIndex])

  useEffect(() => {
    if (!showTour) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        void dismissTour('skipped')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showTour, dismissTour])

  const focusPrimary = useCallback(() => {
    const root = cardRef.current
    if (!root) return
    const btn = root.querySelector<HTMLButtonElement>('button[data-tour-primary="1"]')
    btn?.focus()
  }, [stepIndex])

  useEffect(() => {
    if (!showTour || !routeReady) return
    const id = window.requestAnimationFrame(() => focusPrimary())
    return () => window.cancelAnimationFrame(id)
  }, [showTour, routeReady, stepIndex, focusPrimary])

  useBodyScrollLock(showTour)

  if (!showTour) {
    return null
  }

  const needsRoute = Boolean(step.path)
  const stepReady = !needsRoute || routeReady
  const centered = narrow || !step.anchor || !cardBox || step.id === 'setup-guide' || !stepReady

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
            ? 'left-1/2 w-[min(100vw-1.5rem,26rem)] -translate-x-1/2 p-6 sm:p-7 max-md:bottom-[max(1rem,env(safe-area-inset-bottom))] max-md:top-auto max-md:max-h-[min(85vh,34rem)] max-md:-translate-y-0 md:top-1/2 md:-translate-y-1/2'
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

        {!stepReady ? (
          <p className="mt-4 flex items-center gap-2 text-sm text-stone-500">
            <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-stone-300 border-t-[#003580]" />
            Opening this section…
          </p>
        ) : null}

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
              Step {stepIndex + 1} of {steps.length}
            </span>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            {!lastStep ? (
              <Button
                type="button"
                data-tour-primary="1"
                className="bg-[#003580] text-white hover:bg-[#002a5c]"
                disabled={submitting || !stepReady}
                onClick={() => setStepIndex((i) => Math.min(steps.length - 1, i + 1))}
              >
                Next
              </Button>
            ) : (
              <Button
                type="button"
                data-tour-primary="1"
                className="bg-[#003580] text-white hover:bg-[#002a5c]"
                disabled={submitting || !stepReady}
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
