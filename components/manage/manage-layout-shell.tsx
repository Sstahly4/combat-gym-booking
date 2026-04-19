'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/hooks/use-auth'
import { ManageSidebar } from '@/components/manage/manage-sidebar'
import { ManageNoBookingsToastHost } from '@/components/manage/manage-no-bookings-toast-host'
import { ActiveGymProvider, useActiveGym } from '@/components/manage/active-gym-context'
import { AccountClaimPrompts } from '@/components/manage/account-claim-prompts'

const NO_SIDEBAR_PREFIXES = [
  '/manage/invite',
  '/manage/onboarding',
  '/manage/security-onboarding',
  '/manage/list-your-gym',
]

function shouldHideSidebar(pathname: string): boolean {
  return NO_SIDEBAR_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
}

function ManageLayoutSidebarShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? ''
  const { profile } = useAuth()
  const { gyms, activeGymId, setActiveGymId, loading } = useActiveGym()

  const active = gyms.find((g) => g.id === activeGymId) ?? gyms[0] ?? null

  const editGymHref = active ? `/manage/gym/edit?id=${active.id}` : '/manage/gym/edit'
  const viewListingHref = active ? `/manage/gym/preview?gym_id=${active.id}` : '/manage/onboarding'
  const gymName = active?.name?.trim() ? active.name.trim() : null
  const firstGymId = active?.id ?? null

  useEffect(() => {
    const base = gymName ? `${gymName} Dashboard` : 'Gym Dashboard'
    document.title = `${base} | Combatbooking`
  }, [gymName])

  return (
    <div className="relative flex min-h-0 flex-1 flex-col bg-white md:block md:min-h-[calc(100svh-5rem)]">
      <AccountClaimPrompts />
      <ManageNoBookingsToastHost />
      <ManageSidebar
        editGymHref={editGymHref}
        gymName={gymName}
        viewListingHref={viewListingHref}
        firstGymId={firstGymId}
        gyms={profile?.role === 'owner' ? gyms : []}
        activeGymId={activeGymId}
        onSelectGym={profile?.role === 'owner' ? setActiveGymId : undefined}
        gymContextLoading={profile?.role === 'owner' ? loading : false}
      />
      <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden md:ml-56 md:h-[calc(100svh-5rem)] md:max-h-[calc(100svh-5rem)] md:overflow-y-auto">
        {children}
      </div>
    </div>
  )
}

export function ManageLayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? ''

  if (shouldHideSidebar(pathname)) {
    return (
      <>
        <AccountClaimPrompts />
        {children}
      </>
    )
  }

  return (
    <ActiveGymProvider>
      <ManageLayoutSidebarShell>{children}</ManageLayoutSidebarShell>
    </ActiveGymProvider>
  )
}
