'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/use-auth'
import { ManageSidebar } from '@/components/manage/manage-sidebar'
import { ManageNoBookingsToastHost } from '@/components/manage/manage-no-bookings-toast-host'
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

function ManageLayoutSidebarShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? ''
  const router = useRouter()
  const { user, profile, loading: authLoading } = useAuth()
  const { gyms, activeGymId, setActiveGymId, loading } = useActiveGym()

  const active = gyms.find((g) => g.id === activeGymId) ?? gyms[0] ?? null

  const editGymHref = active ? `/manage/gym/edit?id=${active.id}` : '/manage/gym/edit'
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
    if (authLoading) return
    if (!user) {
      const redirect = encodeURIComponent(pathname)
      router.replace(`/auth/signin?intent=owner&redirect=${redirect}`)
    }
  }, [authLoading, user, pathname, router])

  if (authLoading) {
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
    <div className="relative flex min-h-0 flex-1 flex-col bg-white md:block md:min-h-[calc(100svh-5rem)]">
      <AccountClaimPrompts />
      <ClaimDashboardTour />
      <ManageNoBookingsToastHost />
      <ManageSidebar
        editGymHref={editGymHref}
        gymName={gymName}
        viewListingHref={viewListingHref}
        firstGymId={firstGymId}
        gyms={profile?.role === 'owner' || profile?.role === 'admin' ? gyms : []}
        activeGymId={activeGymId}
        onSelectGym={profile?.role === 'owner' ? setActiveGymId : undefined}
        gymContextLoading={profile?.role === 'owner' || profile?.role === 'admin' ? loading : false}
      />
      <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden pt-32 md:ml-56 md:pt-0 md:h-[calc(100svh-5rem)] md:max-h-[calc(100svh-5rem)] md:overflow-y-auto [&>*:first-child]:max-md:-mt-2">
        {children}
      </div>
    </div>
  )
}

export function ManageLayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? ''
  const router = useRouter()
  const { user, profile, loading: authLoading } = useAuth()

  useEffect(() => {
    if (!pathname.startsWith('/manage')) return
    if (authLoading) return
    if (!user) {
      const redirect = encodeURIComponent(pathname)
      router.replace(`/auth/signin?intent=owner&redirect=${redirect}`)
    }
  }, [authLoading, user, pathname, router])

  if (shouldHideSidebar(pathname)) {
    if (authLoading) {
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
        <ManageNoSidebarHubTitle />
        {children}
      </>
    )
  }

  return (
    <ActiveGymProvider>
      <PendingOwnerGuard />
      <ManageLayoutSidebarShell>{children}</ManageLayoutSidebarShell>
    </ActiveGymProvider>
  )
}
