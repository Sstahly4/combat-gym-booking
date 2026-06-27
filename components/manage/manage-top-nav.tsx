'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import type { ManageGymRow } from '@/components/manage/active-gym-context'
import { ChevronDown, CircleUser, Luggage, Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/hooks/use-auth'
import { CurrencyModal } from '@/components/currency-modal'
import { ManageHeaderSearch } from '@/components/manage/manage-header-search'
import { NotificationBell } from '@/components/manage/notification-bell'
import {
  buildPartnerNav,
  isPartnerMenuRouteActive,
  PARTNER_HUB_HEADER_HEIGHT_CLASS,
  withManageGymId,
  type PartnerMenuItem,
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

const tabLinkClass = (active: boolean, size: 'desktop' | 'mobile') =>
  cn(
    'inline-flex shrink-0 items-center font-medium leading-none transition-colors',
    size === 'mobile' ? 'px-3 py-2 text-[13px]' : 'px-3.5 py-2 text-[15px]',
    active ? 'text-gray-900' : 'text-gray-500 hover:text-gray-800',
  )

function TabLink({
  tab,
  pathname,
  size,
  onNavigate,
}: {
  tab: PartnerNavTab
  pathname: string
  size: 'desktop' | 'mobile'
  onNavigate?: () => void
}) {
  const active = tab.isActive(pathname)
  return (
    <Link
      href={tab.href}
      data-claim-tour={tab.tourAnchor}
      onClick={onNavigate}
      className={tabLinkClass(active, size)}
      aria-current={active ? 'page' : undefined}
    >
      <TabLabel label={tab.label} active={active} />
    </Link>
  )
}

function MenuLink({
  item,
  pathname,
  onNavigate,
}: {
  item: PartnerMenuItem
  pathname: string
  onNavigate?: () => void
}) {
  const Icon = item.icon
  const active = item.isActive(pathname)
  return (
    <Link
      href={item.href}
      data-claim-tour={item.tourAnchor}
      onClick={onNavigate}
      className={cn(
        'flex items-start gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-gray-50',
        active ? 'bg-gray-50 font-medium text-gray-900' : 'text-gray-700',
      )}
      aria-current={active ? 'page' : undefined}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" strokeWidth={1.75} aria-hidden />
      <span className="min-w-0">
        <span className="block">{item.label}</span>
        {item.description ? (
          <span className="mt-0.5 block text-xs font-normal text-gray-500">{item.description}</span>
        ) : null}
      </span>
    </Link>
  )
}

function CenterMenuDropdown({
  menu,
  settings,
  pathname,
  size,
  menuOpen,
  onToggle,
  onClose,
  menuRef,
}: {
  menu: PartnerMenuItem[]
  settings: PartnerMenuItem
  pathname: string
  size: 'desktop' | 'mobile'
  menuOpen: boolean
  onToggle: () => void
  onClose: () => void
  menuRef: React.RefObject<HTMLDivElement>
}) {
  const menuActive = isPartnerMenuRouteActive(pathname)

  return (
    <div ref={menuRef} className="relative shrink-0">
      <button
        type="button"
        onClick={onToggle}
        className={cn(tabLinkClass(menuOpen || menuActive, size))}
        aria-expanded={menuOpen}
        aria-haspopup="menu"
      >
        <span className="flex flex-col items-center">
          <span className="inline-flex items-center gap-0.5">
            <span>Menu</span>
            <ChevronDown
              className={cn(
                'shrink-0 transition-transform',
                size === 'desktop' ? 'h-4 w-4' : 'h-3.5 w-3.5',
                menuOpen && 'rotate-180',
              )}
              aria-hidden
            />
          </span>
          {menuOpen || menuActive ? (
            <span className="mt-1.5 h-0.5 w-5 rounded-full bg-gray-900" aria-hidden />
          ) : null}
        </span>
      </button>

      {menuOpen ? (
        <div
          role="menu"
          className={cn(
            'absolute z-50 w-[min(100vw-2rem,20rem)] rounded-xl border border-gray-200 bg-white py-2 shadow-lg shadow-gray-900/10',
            size === 'desktop'
              ? 'left-1/2 top-[calc(100%+0.35rem)] -translate-x-1/2'
              : 'right-0 top-[calc(100%+0.35rem)]',
          )}
        >
          <div className="max-h-[min(70vh,24rem)] overflow-y-auto px-1">
            {menu.map((item) => (
              <MenuLink key={item.href} item={item} pathname={pathname} onNavigate={onClose} />
            ))}
          </div>
          <div className="mt-1 border-t border-gray-100 px-1 pt-1">
            <MenuLink item={settings} pathname={pathname} onNavigate={onClose} />
          </div>
        </div>
      ) : null}
    </div>
  )
}

export function ManageTopNav({
  editGymHref,
  viewListingHref,
  firstGymId,
  gyms = [],
  activeGymId = null,
  onSelectGym,
  gymContextLoading = false,
}: {
  editGymHref: string
  gymName: string | null
  viewListingHref: string
  firstGymId: string | null
  gyms?: ManageGymRow[]
  activeGymId?: string | null
  onSelectGym?: (id: string) => void
  gymContextLoading?: boolean
}) {
  const pathname = usePathname() ?? ''
  const router = useRouter()
  const { user, profile, signOut } = useAuth()

  const [menuOpen, setMenuOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [hubMenuOpen, setHubMenuOpen] = useState(false)
  const [currencyModalOpen, setCurrencyModalOpen] = useState(false)

  const menuRef = useRef<HTMLDivElement>(null)
  const accountRef = useRef<HTMLDivElement>(null)
  const hubMenuRef = useRef<HTMLDivElement>(null)

  const activeGym = activeGymId ? gyms.find((g) => g.id === activeGymId) : gyms[0]
  const verificationDone =
    activeGym?.verification_status === 'verified' || activeGym?.verification_status === 'trusted'

  const { tabs, menu, settings } = buildPartnerNav({
    editGymHref,
    viewListingHref,
    firstGymId,
    verificationDone: Boolean(verificationDone),
  })

  const displayName =
    profile?.full_name?.trim() ||
    profile?.legal_first_name?.trim() ||
    user?.email?.split('@')[0] ||
    'Account'

  useEffect(() => {
    setMenuOpen(false)
    setAccountOpen(false)
    setHubMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!menuOpen) return
    function onPointerDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [menuOpen])

  useEffect(() => {
    if (!accountOpen) return
    function onPointerDown(e: MouseEvent) {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setAccountOpen(false)
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [accountOpen])

  useEffect(() => {
    if (!hubMenuOpen) return
    function onPointerDown(e: MouseEvent) {
      if (hubMenuRef.current && !hubMenuRef.current.contains(e.target as Node)) {
        setHubMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [hubMenuOpen])

  useEffect(() => {
    if (!hubMenuOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [hubMenuOpen])

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

  const bookATripRow = (
    <Link
      href="/"
      onClick={() => setHubMenuOpen(false)}
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
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+0.35rem)] z-50 w-[min(100vw-2rem,16rem)] rounded-xl border border-gray-200 bg-white py-2 shadow-lg shadow-gray-900/10"
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
              onClick={() => setAccountOpen(false)}
              className="block rounded-lg px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              Settings
            </Link>
            <Link
              href="/saved"
              onClick={() => setAccountOpen(false)}
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
        </div>
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
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+0.35rem)] z-50 w-[min(100vw-2rem,22rem)] rounded-xl border border-gray-200 bg-white py-2 shadow-lg shadow-gray-900/10"
        >
          {bookATripRow}
          <div className="mx-4 my-2 h-px bg-gray-100" aria-hidden />

          <div className="space-y-1 px-3 pb-2">
            <ManageHeaderSearch />
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
                setHubMenuOpen(false)
                setCurrencyModalOpen(true)
              }}
              className="block w-full rounded-lg px-3 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
            >
              Language &amp; currency
            </button>
            <Link
              href="/faq"
              onClick={() => setHubMenuOpen(false)}
              className="block rounded-lg px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              Help centre
            </Link>
            <Link
              href="/contact"
              onClick={() => setHubMenuOpen(false)}
              className="block rounded-lg px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              Customer service
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  )

  const centerNav = (size: 'desktop' | 'mobile') => (
    <nav
      aria-label="Partner hub"
      className={cn(
        'flex min-w-0 items-center gap-0.5',
        size === 'mobile' &&
          'flex-1 overflow-x-auto overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        size === 'desktop' && 'justify-center',
      )}
    >
      {tabs.map((tab) => (
        <TabLink key={tab.id} tab={tab} pathname={pathname} size={size} />
      ))}
      <CenterMenuDropdown
        menu={menu}
        settings={settings}
        pathname={pathname}
        size={size}
        menuOpen={menuOpen}
        onToggle={() => {
          setHubMenuOpen(false)
          setAccountOpen(false)
          setMenuOpen((open) => !open)
        }}
        onClose={() => setMenuOpen(false)}
        menuRef={menuRef}
      />
    </nav>
  )

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-50 border-b border-gray-200 bg-white',
          PARTNER_HUB_HEADER_HEIGHT_CLASS,
        )}
      >
        {/* Desktop */}
        <div className="mx-auto hidden h-full max-w-7xl items-center gap-4 px-4 sm:px-6 md:flex">
          <div className="w-[11.5rem] shrink-0 lg:w-[13rem]">{brandLink}</div>
          <div className="flex min-w-0 flex-1 justify-center">{centerNav('desktop')}</div>
          <div className="flex w-[11.5rem] shrink-0 items-center justify-end gap-1 lg:w-[13rem]">
            <NotificationBell theme="light" />
            {accountControl}
            {hubMenuButton}
          </div>
        </div>

        {/* Mobile — single row, scrollable center tabs */}
        <div className="flex h-full items-center gap-2 px-3 md:hidden">
          <div className="min-w-0 max-w-[34%] shrink-0">{brandLink}</div>
          <div className="min-w-0 flex-1">{centerNav('mobile')}</div>
          <div className="flex shrink-0 items-center gap-1">
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
