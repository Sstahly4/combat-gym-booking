'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/hooks/use-auth'
import { useClaimRedirectHydration } from '@/lib/hooks/use-claim-redirect-hydration'
import { ManageTopNav } from '@/components/manage/manage-top-nav'
import {
  PARTNER_HUB_MAIN_HEIGHT_CLASS,
  PARTNER_HUB_MAIN_OFFSET_CLASS,
} from '@/lib/manage/manage-partner-nav'
import { ManageNoBookingsToastHost } from '@/components/manage/manage-no-bookings-toast-host'
import { GymImageUploadToastHost } from '@/components/manage/gym-image-upload-toast-host'
import { ActiveGymProvider, useActiveGym } from '@/components/manage/active-gym-context'
import { AccountClaimPrompts } from '@/components/manage/account-claim-prompts'
import { ClaimDashboardTour } from '@/components/manage/claim-dashboard-tour'
import { formatHubDocumentTitle } from '@/lib/metadata/site-hubs'
import { managePartnerSectionTitle } from '@/lib/manage/manage-partner-section-title'
import { useOwnerOnboardingStatus } from '@/lib/hooks/use-owner-onboarding-status'

const NO_SIDEBAR_PREFIXES = [
  '/manage/invite',
  '/manage/onboarding',
  '/manage/security-onboarding',
  '/manage/list-your-gym',
]

/**
 * Routes a pending owner is allowed to visit. Anything else under `/manage/*`
 * (dashboard, calendar, bookings, settings, etc.) is gated until they have a
 * listing draft — same OTA pattern Booking.com / Airbnb / Stripe Connect use.
 */
const PENDING_OWNER_ALLOWED_PREFIXES = [
  '/manage/onboarding',
  '/manage/security-onboarding',
  '/manage/list-your-gym',
  '/manage/invite',
  '/manage/help',
]

function shouldHideSidebar(pathname: string): boolean {
  return NO_SIDEBAR_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
}

function isPendingOwnerAllowed(pathname: string): boolean {
  return PENDING_OWNER_ALLOWED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
}

/** Redirect pending owners (verified email but no listing yet) to the wizard. */
function PendingOwnerGuard() {
  const router = useRouter()
  const pathname = usePathname() ?? ''
  const { stage, nextStepHref, loading } = useOwnerOnboardingStatus()

  useEffect(() => {
    if (loading) return
    if (stage !== 'pending') return
    if (!pathname.startsWith('/manage')) return
    if (isPendingOwnerAllowed(pathname)) return
    router.replace(nextStepHref)
  }, [stage, loading, pathname, nextStepHref, router])

  return null
}

function ManageNoSidebarHubTitle() {
  const pathname = usePathname() ?? ''
  useEffect(() => {
    if (!pathname.startsWith('/manage')) return
    const section = managePartnerSectionTitle(pathname)
    document.title = formatHubDocumentTitle(section, 'partner')
  }, [pathname])
  return null
}

function ManageLayoutTopNavShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? ''
  const router = useRouter()
  const { user, profile, loading: authLoading } = useAuth()
  const { blockingAuth } = useClaimRedirectHydration()
  const { gyms, activeGymId, setActiveGymId, loading } = useActiveGym()
  const isListingEditor =
    pathname.startsWith('/manage/gym/edit') || pathname.startsWith('/manage/accommodation')

  const active = gyms.find((g) => g.id === activeGymId) ?? gyms[0] ?? null

  const editGymHref = active
    ? `/manage/gym/edit?id=${active.id}&section=basic`
    : '/manage/gym/edit?section=basic'
  const viewListingHref = active ? `/manage/gym/preview?gym_id=${active.id}` : '/manage/onboarding'
  const gymName = active?.name?.trim() ? active.name.trim() : null
  const firstGymId = active?.id ?? null

  useEffect(() => {
    if (!pathname.startsWith('/manage')) return
    const isRoot = pathname === '/manage' || pathname === '/manage/'
    const section = isRoot
      ? gymName
        ? `${gymName} Dashboard`
        : 'Gym Dashboard'
      : managePartnerSectionTitle(pathname)
    document.title = formatHubDocumentTitle(section, 'partner')
  }, [gymName, pathname])

  useEffect(() => {
    if (!pathname.startsWith('/manage')) return
    if (authLoading || blockingAuth) return
    if (!user) {
      const redirect = encodeURIComponent(pathname)
      router.replace(`/auth/signin?intent=owner&redirect=${redirect}`)
    }
  }, [authLoading, blockingAuth, user, pathname, router])

  if (authLoading || blockingAuth) {
    return (
      <div className="flex min-h-[60svh] items-center justify-center text-sm text-stone-500">
        Loading…
      </div>
    )
  }

  // While the session is valid but profile is still loading/bootstrapping,
  // don't render the Partner Hub shell (prevents stale sidebar vs page mismatch).
  if (user && !profile) {
    return (
      <div className="flex min-h-[60svh] items-center justify-center text-sm text-stone-500">
        Loading…
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="relative flex min-h-[calc(100svh-5rem)] flex-1 flex-col bg-white">
      <AccountClaimPrompts />
      <ClaimDashboardTour />
      <ManageNoBookingsToastHost />
      <GymImageUploadToastHost />
      <ManageTopNav
        editGymHref={editGymHref}
        gymName={gymName}
        viewListingHref={viewListingHref}
        firstGymId={firstGymId}
        gyms={profile?.role === 'owner' || profile?.role === 'admin' ? gyms : []}
        activeGymId={activeGymId}
        onSelectGym={profile?.role === 'owner' ? setActiveGymId : undefined}
        gymContextLoading={profile?.role === 'owner' || profile?.role === 'admin' ? loading : false}
      />
      <div
        data-manage-main-scroll
        className={cn(
          'min-h-0 min-w-0 flex-1 overflow-x-hidden bg-white',
          PARTNER_HUB_MAIN_OFFSET_CLASS,
          PARTNER_HUB_MAIN_HEIGHT_CLASS,
          isListingEditor ? 'flex flex-col overflow-hidden' : 'overflow-y-auto',
        )}
      >
        {children}
      </div>
    </div>
  )
}

export function ManageLayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? ''
  const router = useRouter()
  const { user, profile, loading: authLoading } = useAuth()
  const { blockingAuth } = useClaimRedirectHydration()

  useEffect(() => {
    if (!pathname.startsWith('/manage')) return
    if (authLoading || blockingAuth) return
    if (!user) {
      const redirect = encodeURIComponent(pathname)
      router.replace(`/auth/signin?intent=owner&redirect=${redirect}`)
    }
  }, [authLoading, blockingAuth, user, pathname, router])

  if (shouldHideSidebar(pathname)) {
    if (authLoading || blockingAuth) {
      return (
        <div className="flex min-h-[60svh] items-center justify-center text-sm text-stone-500">
          Loading…
        </div>
      )
    }
    if (user && !profile) {
      return (
        <div className="flex min-h-[60svh] items-center justify-center text-sm text-stone-500">
          Loading…
        </div>
      )
    }
    if (!user) return null
    return (
      <>
        <PendingOwnerGuard />
        <AccountClaimPrompts />
        <GymImageUploadToastHost />
        <ManageNoSidebarHubTitle />
        {children}
      </>
    )
  }

  return (
    <ActiveGymProvider>
      <PendingOwnerGuard />
      <ManageLayoutTopNavShell>{children}</ManageLayoutTopNavShell>
    </ActiveGymProvider>
  )
}
