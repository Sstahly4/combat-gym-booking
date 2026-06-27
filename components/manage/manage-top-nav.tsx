'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import type { ManageGymRow } from '@/components/manage/active-gym-context'
import { CircleUser, LayoutDashboard, Luggage, Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/hooks/use-auth'
import { CurrencyModal } from '@/components/currency-modal'
import { ManageHeaderSearch } from '@/components/manage/manage-header-search'
import { NotificationBell } from '@/components/manage/notification-bell'
import { PartnerHubDropdownPortal } from '@/components/manage/partner-hub-dropdown-portal'
import {
  buildPartnerNav,
  PARTNER_HUB_HEADER_HEIGHT_CLASS,
  withManageGymId,
  type PartnerNavTab,
} from '@/lib/manage/manage-partner-nav'

function TabLabel({ label, active }: { label: string; active: boolean }) {
  return (
    <span className="flex flex-col items-center">
      <span>{label}</span>
      {active ? <span className="mt-1.5 h-0.5 w-5 rounded-full bg-gray-900" aria-hidden /> : null}
    </span>
  )
}

const tabLinkClass = (active: boolean) =>
  cn(
    'inline-flex shrink-0 items-center font-medium leading-none transition-colors',
    'px-3 py-2 text-[13px] md:px-3.5 md:py-2 md:text-[15px]',
    active ? 'text-gray-900' : 'text-gray-500 hover:text-gray-800',
  )

function TabLink({
  tab,
  pathname,
  onNavigate,
}: {
  tab: PartnerNavTab
  pathname: string
  onNavigate?: () => void
}) {
  const active = tab.isActive(pathname)
  return (
    <Link
      href={tab.href}
      data-claim-tour={tab.tourAnchor}
      onClick={onNavigate}
      className={tabLinkClass(active)}
      aria-current={active ? 'page' : undefined}
    >
      <TabLabel label={tab.label} active={active} />
    </Link>
  )
}

export function ManageTopNav({
  editGymHref,
  firstGymId,
  gyms = [],
  activeGymId = null,
  onSelectGym,
  gymContextLoading = false,
}: {
  editGymHref: string
  gymName: string | null
  firstGymId: string | null
  gyms?: ManageGymRow[]
  activeGymId?: string | null
  onSelectGym?: (id: string) => void
  gymContextLoading?: boolean
}) {
  const pathname = usePathname() ?? ''
  const router = useRouter()
  const { user, profile, signOut } = useAuth()

  const [accountOpen, setAccountOpen] = useState(false)
  const [hubMenuOpen, setHubMenuOpen] = useState(false)
  const [currencyModalOpen, setCurrencyModalOpen] = useState(false)

  const accountRef = useRef<HTMLDivElement>(null)
  const accountPanelRef = useRef<HTMLDivElement>(null)
  const hubMenuRef = useRef<HTMLDivElement>(null)
  const hubMenuPanelRef = useRef<HTMLDivElement>(null)

  const activeGym = activeGymId ? gyms.find((g) => g.id === activeGymId) : gyms[0]

  const { tabs, settings } = buildPartnerNav({
    editGymHref,
    firstGymId,
  })

  const displayName =
    profile?.full_name?.trim() ||
    profile?.legal_first_name?.trim() ||
    user?.email?.split('@')[0] ||
    'Account'

  useEffect(() => {
    setAccountOpen(false)
    setHubMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!accountOpen && !hubMenuOpen) return

    function onPointerDown(e: MouseEvent) {
      const target = e.target as Node
      const inAccount =
        accountRef.current?.contains(target) || accountPanelRef.current?.contains(target)
      const inHub =
        hubMenuRef.current?.contains(target) || hubMenuPanelRef.current?.contains(target)

      if (accountOpen && !inAccount) setAccountOpen(false)
      if (hubMenuOpen && !inHub) setHubMenuOpen(false)
    }

    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [accountOpen, hubMenuOpen])

  const closeHubMenu = () => setHubMenuOpen(false)

  const navigateFromMenu = (href: string, close: () => void) => {
    close()
    router.push(href)
  }

  const handleSignOut = async () => {
    setAccountOpen(false)
    setHubMenuOpen(false)
    await signOut()
    router.push('/')
    router.refresh()
  }

  const brandLink = (
    <Link
      href={withManageGymId('/manage', firstGymId)}
      className="min-w-0 shrink-0 rounded-sm text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#003580]/30"
    >
      <span className="block truncate text-left text-lg font-bold leading-snug tracking-tight text-[#003580] sm:text-xl md:text-2xl">
        CombatStay.com
      </span>
      <span className="mt-0.5 block translate-x-px text-left text-base font-light leading-tight tracking-tight text-[#003580] sm:text-lg md:text-xl">
        Partner Hub
      </span>
    </Link>
  )

  const isAdmin = profile?.role === 'admin'

  const bookATripRow = (
    <Link
      href="/"
      onClick={(e) => {
        e.preventDefault()
        navigateFromMenu('/', closeHubMenu)
      }}
      className="mx-2 flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-gray-50"
    >
      <div className="min-w-0">
        <div className="text-sm font-semibold text-gray-900">Book a trip</div>
        <div className="mt-0.5 text-xs leading-snug text-gray-500">
          Search gyms and book your next training trip.
        </div>
      </div>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-700">
        <Luggage className="h-5 w-5" strokeWidth={1.75} aria-hidden />
      </span>
    </Link>
  )

  const hubMenuTopRow = isAdmin ? (
    <Link
      href="/admin"
      onClick={(e) => {
        e.preventDefault()
        navigateFromMenu('/admin', closeHubMenu)
      }}
      className="mx-2 flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-gray-50"
    >
      <div className="min-w-0">
        <div className="text-sm font-semibold text-gray-900">Back to admin dashboard</div>
        <div className="mt-0.5 text-xs leading-snug text-gray-500">Return to the Admin Hub.</div>
      </div>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-700">
        <LayoutDashboard className="h-5 w-5" strokeWidth={1.75} aria-hidden />
      </span>
    </Link>
  ) : (
    bookATripRow
  )

  const accountControl = (
    <div ref={accountRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => {
          setHubMenuOpen(false)
          setAccountOpen((open) => !open)
        }}
        className={cn(
          'inline-flex h-10 w-10 items-center justify-center rounded-full border transition-colors',
          accountOpen
            ? 'border-gray-300 bg-gray-50 text-gray-900'
            : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50',
        )}
        aria-expanded={accountOpen}
        aria-haspopup="menu"
        aria-label="Account menu"
      >
        <CircleUser className="h-5 w-5" strokeWidth={1.75} aria-hidden />
      </button>

      {accountOpen ? (
        <PartnerHubDropdownPortal
          open={accountOpen}
          anchorRef={accountRef}
          panelRef={accountPanelRef}
          align="right"
          className="w-[min(100vw-2rem,16rem)] rounded-xl border border-gray-200 bg-white py-2 shadow-lg shadow-gray-900/10"
        >
          <div className="border-b border-gray-100 px-4 py-2.5">
            <p className="truncate text-sm font-semibold text-gray-900">{displayName}</p>
            {user?.email ? (
              <p className="truncate text-xs text-gray-500">{user.email}</p>
            ) : null}
          </div>
          <div className="px-2 py-1">
            <Link
              href={settings.href}
              onClick={(e) => {
                e.preventDefault()
                navigateFromMenu(settings.href, () => setAccountOpen(false))
              }}
              className="block rounded-lg px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              Settings
            </Link>
            <Link
              href="/saved"
              onClick={(e) => {
                e.preventDefault()
                navigateFromMenu('/saved', () => setAccountOpen(false))
              }}
              className="block rounded-lg px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              My favorites
            </Link>
            <button
              type="button"
              onClick={() => void handleSignOut()}
              className="block w-full rounded-lg px-3 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
            >
              Sign out
            </button>
          </div>
        </PartnerHubDropdownPortal>
      ) : null}
    </div>
  )

  const hubMenuButton = (
    <div ref={hubMenuRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => {
          setAccountOpen(false)
          setHubMenuOpen((open) => !open)
        }}
        className={cn(
          'inline-flex h-10 w-10 items-center justify-center rounded-full border transition-colors',
          hubMenuOpen
            ? 'border-gray-300 bg-gray-50 text-gray-900'
            : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50',
        )}
        aria-expanded={hubMenuOpen}
        aria-haspopup="menu"
        aria-label="Open menu"
      >
        {hubMenuOpen ? (
          <X className="h-5 w-5" aria-hidden />
        ) : (
          <Menu className="h-5 w-5" strokeWidth={1.75} aria-hidden />
        )}
      </button>

      {hubMenuOpen ? (
        <PartnerHubDropdownPortal
          open={hubMenuOpen}
          anchorRef={hubMenuRef}
          panelRef={hubMenuPanelRef}
          align="right"
          className="w-[min(100vw-2rem,22rem)] rounded-xl border border-gray-200 bg-white py-2 shadow-lg shadow-gray-900/10"
        >
          {hubMenuTopRow}

          <div className="space-y-1 border-t border-gray-100 px-3 pb-2 pt-2">
            <ManageHeaderSearch theme="light" className="w-full" />
          </div>

          {gyms.length > 1 && onSelectGym ? (
            <div className="border-t border-gray-100 px-4 py-3">
              <label htmlFor="partner-gym-switch-hub" className="mb-1 block text-xs font-medium text-gray-500">
                Active gym
              </label>
              <select
                id="partner-gym-switch-hub"
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800"
                value={activeGymId ?? ''}
                onChange={(e) => onSelectGym(e.target.value)}
                disabled={gymContextLoading}
              >
                {gyms.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
          ) : activeGym?.name ? (
            <div className="border-t border-gray-100 px-4 py-3">
              <p className="text-xs font-medium text-gray-500">Active gym</p>
              <p className="mt-0.5 truncate text-sm font-medium text-gray-900">{activeGym.name}</p>
            </div>
          ) : null}

          <div className="border-t border-gray-100 px-2 pt-1">
            <button
              type="button"
              onClick={() => {
                closeHubMenu()
                setCurrencyModalOpen(true)
              }}
              className="block w-full rounded-lg px-3 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
            >
              Language &amp; currency
            </button>
            <Link
              href="/faq"
              onClick={(e) => {
                e.preventDefault()
                navigateFromMenu('/faq', closeHubMenu)
              }}
              className="block rounded-lg px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              Help centre
            </Link>
            <Link
              href="/contact"
              onClick={(e) => {
                e.preventDefault()
                navigateFromMenu('/contact', closeHubMenu)
              }}
              className="block rounded-lg px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              Customer service
            </Link>
          </div>
        </PartnerHubDropdownPortal>
      ) : null}
    </div>
  )

  const centerNav = (
    <nav
      aria-label="Partner hub"
      className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] md:justify-center md:overflow-visible [&::-webkit-scrollbar]:hidden"
    >
      {tabs.map((tab) => (
        <TabLink key={tab.id} tab={tab} pathname={pathname} />
      ))}
    </nav>
  )

  return (
    <>
      <header
        className={cn(
          'z-[100] shrink-0 overflow-visible border-b border-gray-200 bg-white',
          PARTNER_HUB_HEADER_HEIGHT_CLASS,
        )}
      >
        <div className="mx-auto flex h-full max-w-7xl items-center gap-2 px-3 sm:gap-4 sm:px-6">
          <div className="min-w-0 max-w-[34%] shrink-0 md:max-w-none md:w-[11.5rem] lg:w-[13rem]">
            {brandLink}
          </div>
          {centerNav}
          <div className="flex shrink-0 items-center gap-1 md:w-[11.5rem] md:justify-end lg:w-[13rem]">
            <NotificationBell theme="light" />
            {accountControl}
            {hubMenuButton}
          </div>
        </div>
      </header>

      <CurrencyModal
        open={currencyModalOpen}
        onOpenChange={setCurrencyModalOpen}
        initialTab="language"
      />
    </>
  )
}
