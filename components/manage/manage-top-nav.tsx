'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ManageGymRow } from '@/components/manage/active-gym-context'
import { ChevronDown, Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  buildPartnerNav,
  isPartnerMenuRouteActive,
  withManageGymId,
  type PartnerMenuItem,
  type PartnerNavTab,
} from '@/lib/manage/manage-partner-nav'

function TabLink({
  tab,
  pathname,
  variant,
  onNavigate,
}: {
  tab: PartnerNavTab
  pathname: string
  variant: 'desktop' | 'mobile'
  onNavigate?: () => void
}) {
  const active = tab.isActive(pathname)
  const Icon = tab.icon

  if (variant === 'mobile') {
    return (
      <Link
        href={tab.href}
        data-claim-tour={tab.tourAnchor}
        onClick={onNavigate}
        className={cn(
          'flex min-h-[3.25rem] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 text-[10px] font-medium leading-tight transition-colors',
          active ? 'text-gray-900' : 'text-gray-500',
        )}
        aria-current={active ? 'page' : undefined}
      >
        <Icon className="h-5 w-5 shrink-0" strokeWidth={active ? 2 : 1.75} aria-hidden />
        <span className="truncate">{tab.label}</span>
      </Link>
    )
  }

  return (
    <Link
      href={tab.href}
      data-claim-tour={tab.tourAnchor}
      onClick={onNavigate}
      className={cn(
        'relative inline-flex h-12 items-center px-4 text-sm font-medium transition-colors',
        active ? 'text-gray-900' : 'text-gray-500 hover:text-gray-800',
      )}
      aria-current={active ? 'page' : undefined}
    >
      {tab.label}
      {active ? (
        <span
          className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-gray-900"
          aria-hidden
        />
      ) : null}
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

export function ManageTopNav({
  editGymHref,
  gymName,
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
  const [menuOpen, setMenuOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const activeGym = activeGymId ? gyms.find((g) => g.id === activeGymId) : gyms[0]
  const verificationDone =
    activeGym?.verification_status === 'verified' || activeGym?.verification_status === 'trusted'

  const { tabs, menu, settings } = buildPartnerNav({
    editGymHref,
    viewListingHref,
    firstGymId,
    verificationDone: Boolean(verificationDone),
  })

  const headerTitle = gymName && gymName.length > 0 ? gymName : 'Partner Hub'
  const menuActive = isPartnerMenuRouteActive(pathname)

  useEffect(() => {
    setMenuOpen(false)
    setMobileMenuOpen(false)
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
    if (!mobileMenuOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [mobileMenuOpen])

  const gymSwitcher =
    gyms.length > 1 && onSelectGym ? (
      <div className="min-w-0 max-w-[11rem] sm:max-w-xs">
        <label htmlFor="partner-gym-switch" className="sr-only">
          Active gym
        </label>
        <select
          id="partner-gym-switch"
          className="w-full truncate rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs font-medium text-gray-800 shadow-sm sm:text-sm"
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
    ) : (
      <Link
        href={withManageGymId('/manage', firstGymId)}
        className="min-w-0 max-w-[10rem] truncate text-sm font-semibold text-gray-900 sm:max-w-xs"
        title={headerTitle}
      >
        {headerTitle}
      </Link>
    )

  return (
    <>
      {/* Desktop top bar — below site navbar */}
      <header className="fixed left-0 right-0 top-20 z-40 hidden border-b border-gray-200 bg-white md:block">
        <div className="mx-auto flex h-12 max-w-7xl items-center gap-4 px-4 sm:px-6">
          <div className="min-w-0 shrink-0">{gymSwitcher}</div>

          <nav
            aria-label="Partner hub"
            className="flex min-w-0 flex-1 items-center justify-center gap-1"
          >
            {tabs.map((tab) => (
              <TabLink key={tab.id} tab={tab} pathname={pathname} variant="desktop" />
            ))}
          </nav>

          <div ref={menuRef} className="relative shrink-0">
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className={cn(
                'inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium transition-colors',
                menuOpen || menuActive
                  ? 'border-gray-300 bg-gray-50 text-gray-900'
                  : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50',
              )}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
            >
              Menu
              <ChevronDown
                className={cn('h-4 w-4 transition-transform', menuOpen && 'rotate-180')}
                aria-hidden
              />
            </button>

            {menuOpen ? (
              <div
                role="menu"
                className="absolute right-0 top-[calc(100%+0.35rem)] z-50 w-[min(100vw-2rem,20rem)] rounded-xl border border-gray-200 bg-white py-2 shadow-lg shadow-gray-900/10"
              >
                <div className="max-h-[min(70vh,24rem)] overflow-y-auto px-1">
                  {menu.map((item) => (
                    <MenuLink
                      key={item.href}
                      item={item}
                      pathname={pathname}
                      onNavigate={() => setMenuOpen(false)}
                    />
                  ))}
                </div>
                <div className="mt-1 border-t border-gray-100 px-1 pt-1">
                  <MenuLink
                    item={settings}
                    pathname={pathname}
                    onNavigate={() => setMenuOpen(false)}
                  />
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      {/* Mobile bottom tab bar */}
      <nav
        aria-label="Partner hub"
        className="fixed inset-x-0 bottom-0 z-40 flex border-t border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/90 md:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {tabs.map((tab) => (
          <TabLink key={tab.id} tab={tab} pathname={pathname} variant="mobile" />
        ))}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          className={cn(
            'flex min-h-[3.25rem] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 text-[10px] font-medium leading-tight transition-colors',
            mobileMenuOpen || menuActive ? 'text-gray-900' : 'text-gray-500',
          )}
          aria-expanded={mobileMenuOpen}
          aria-controls="partner-hub-mobile-menu"
        >
          <Menu className="h-5 w-5 shrink-0" strokeWidth={1.75} aria-hidden />
          <span>Menu</span>
        </button>
      </nav>

      {mobileMenuOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[55] bg-stone-900/45 md:hidden"
            aria-hidden
            onClick={() => setMobileMenuOpen(false)}
          />
          <div
            id="partner-hub-mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Partner hub menu"
            className="fixed inset-x-0 bottom-0 z-[56] max-h-[min(85vh,32rem)] overflow-hidden rounded-t-2xl border border-gray-200 bg-white shadow-2xl md:hidden"
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900">Menu</p>
                <p className="truncate text-xs text-gray-500">{headerTitle}</p>
              </div>
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-md text-gray-600 hover:bg-gray-100"
                onClick={() => setMobileMenuOpen(false)}
              >
                <X className="h-5 w-5" aria-hidden />
                <span className="sr-only">Close menu</span>
              </button>
            </div>

            {gyms.length > 1 && onSelectGym ? (
              <div className="border-b border-gray-100 px-4 py-3">
                <label htmlFor="partner-gym-switch-mobile" className="mb-1 block text-xs font-medium text-gray-500">
                  Active gym
                </label>
                <select
                  id="partner-gym-switch-mobile"
                  className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800"
                  value={activeGymId ?? ''}
                  onChange={(e) => onSelectGym(e.target.value)}
                >
                  {gyms.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            <div className="max-h-[min(60vh,24rem)] overflow-y-auto px-2 py-2">
              {menu.map((item) => (
                <MenuLink
                  key={item.href}
                  item={item}
                  pathname={pathname}
                  onNavigate={() => setMobileMenuOpen(false)}
                />
              ))}
              <div className="mt-1 border-t border-gray-100 pt-1">
                <MenuLink
                  item={settings}
                  pathname={pathname}
                  onNavigate={() => setMobileMenuOpen(false)}
                />
              </div>
            </div>
          </div>
        </>
      ) : null}
    </>
  )
}
