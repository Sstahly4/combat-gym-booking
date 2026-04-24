'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ManageGymRow } from '@/components/manage/active-gym-context'
import type { LucideIcon } from 'lucide-react'
import {
  CalendarRange,
  BadgeCheck,
  BedDouble,
  ClipboardList,
  Eye,
  HelpCircle,
  Home,
  Pencil,
  Settings,
  ShieldCheck,
  Star,
  Tag,
  Wallet,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type NavItem = {
  href: string
  label: string
  icon: LucideIcon
  isActive: (pathname: string) => boolean
  /**
   * Optional sub-items rendered as an indented list directly under this item.
   * Sub-items expand only when the parent or one of the children is active,
   * matching the "Booking.com Extranet" style nested nav.
   */
  children?: Array<{
    href: string
    label: string
    isActive: (pathname: string) => boolean
  }>
}

function getNavGroups(
  editGymHref: string,
  viewListingHref: string,
  firstGymId: string | null,
  verificationDone: boolean
): { primary: NavItem[]; secondary: NavItem[]; settings: NavItem } {
  return {
    primary: [
      {
        href: '/manage',
        label: 'Home',
        icon: Home,
        isActive: (p) => p === '/manage',
      },
      {
        href: '/manage/bookings',
        label: 'Bookings',
        icon: ClipboardList,
        isActive: (p) => p === '/manage/bookings' || p.startsWith('/manage/bookings/'),
      },
      {
        href: '/manage/calendar',
        label: 'Calendar',
        icon: CalendarRange,
        isActive: (p) => p === '/manage/calendar' || p.startsWith('/manage/calendar/'),
      },
      {
        href: '/manage/balances',
        label: 'Balances',
        icon: Wallet,
        isActive: (p) => p === '/manage/balances' || p.startsWith('/manage/balances/'),
        children: [
          {
            href: '/manage/balances/payouts',
            label: 'Payouts',
            isActive: (p) => p === '/manage/balances/payouts' || p.startsWith('/manage/balances/payouts/'),
          },
        ],
      },
      {
        href: '/manage/promotions',
        label: 'Promotions',
        icon: Tag,
        isActive: (p) => p === '/manage/promotions' || p.startsWith('/manage/promotions/'),
      },
      {
        href: '/manage/reviews',
        label: 'Reviews',
        icon: Star,
        isActive: (p) => p === '/manage/reviews' || p.startsWith('/manage/reviews/'),
      },
    ],
    secondary: [
      {
        href: viewListingHref,
        label: 'View listing',
        icon: Eye,
        isActive: (p) =>
          p === '/manage/gym/preview' || p.startsWith('/manage/gym/preview'),
      },
      {
        href: editGymHref,
        label: 'Edit gym',
        icon: Pencil,
        isActive: (p) => p.startsWith('/manage/gym/edit'),
      },
      {
        href: '/manage/accommodation',
        label: 'Accommodation',
        icon: BedDouble,
        isActive: (p) => p === '/manage/accommodation' || p.startsWith('/manage/accommodation/'),
      },
      {
        href: '/manage/help',
        label: 'Help center',
        icon: HelpCircle,
        isActive: (p) => p === '/manage/help' || p.startsWith('/manage/help/'),
      },
      {
        href: '/manage/verification',
        label: verificationDone ? 'Verified' : 'Verification',
        icon: verificationDone ? BadgeCheck : ShieldCheck,
        isActive: (p) => p === '/manage/verification',
      },
    ],
    settings: {
      href: '/manage/settings',
      label: 'Settings',
      icon: Settings,
      isActive: (p) => p === '/manage/settings' || p.startsWith('/manage/settings/'),
    },
  }
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="mb-2.5 mt-6 first:mt-0 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
      {children}
    </p>
  )
}

function NavLink({
  item,
  pathname,
}: {
  item: NavItem
  pathname: string
}) {
  const { href, label, icon: Icon, isActive, children } = item
  const active = isActive(pathname)
  const childActive = (children ?? []).some((c) => c.isActive(pathname))
  const showChildren = Boolean(children?.length) && (active || childActive)
  return (
    <div>
      <Link
        href={href}
        className={cn(
          'flex items-center gap-2.5 rounded-md px-2 py-2 text-[13px] leading-snug transition-colors',
          active && !childActive
            ? 'font-medium text-[#003580]'
            : active || childActive
            ? 'font-medium text-[#003580]'
            : 'font-normal text-gray-500 hover:text-gray-800'
        )}
        aria-current={active ? 'page' : undefined}
      >
        <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden />
        {label}
      </Link>
      {showChildren ? (
        <div className="ml-7 mt-0.5 flex flex-col gap-0.5 border-l border-gray-100 pl-3">
          {children!.map((c) => {
            const cActive = c.isActive(pathname)
            return (
              <Link
                key={c.href}
                href={c.href}
                className={cn(
                  'rounded-md px-2 py-1.5 text-[12.5px] leading-snug transition-colors',
                  cActive
                    ? 'font-medium text-[#003580]'
                    : 'font-normal text-gray-500 hover:text-gray-800'
                )}
                aria-current={cActive ? 'page' : undefined}
              >
                {c.label}
              </Link>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}

export function ManageSidebar({
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
  const activeGym = activeGymId ? gyms.find((g) => g.id === activeGymId) : gyms[0]
  const verificationDone =
    activeGym?.verification_status === 'verified' || activeGym?.verification_status === 'trusted'
  const { primary, secondary, settings } = getNavGroups(
    editGymHref,
    viewListingHref,
    firstGymId,
    Boolean(verificationDone)
  )

  const headerTitle = gymName && gymName.length > 0 ? gymName : 'Dashboard'
  const headerInitial =
    gymName && gymName.length > 0 ? gymName.trim().charAt(0).toUpperCase() : 'D'

  return (
    <aside
      className={cn(
        'flex w-full shrink-0 flex-col border-b border-gray-200 bg-white',
        'md:fixed md:bottom-0 md:left-0 md:top-[5rem] md:z-30 md:w-56 md:border-b-0 md:border-r md:border-gray-200',
        'md:min-h-0 md:overflow-hidden'
      )}
    >
      <div className="shrink-0 px-3 pb-4 pt-4">
        <Link
          href="/manage"
          className="flex min-w-0 items-center gap-2 text-[14px] font-semibold tracking-tight text-gray-900"
          title={headerTitle}
        >
          <span
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-gray-100 text-[10px] font-bold text-gray-800"
            aria-hidden
          >
            {headerInitial}
          </span>
          <span className="truncate">{headerTitle}</span>
        </Link>
        {gymContextLoading ? (
          <p className="mt-2 text-[11px] text-gray-400">Loading gyms…</p>
        ) : gyms.length > 1 && onSelectGym ? (
          <div className="mt-3">
            <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-gray-400">
              Active gym
            </label>
            <select
              id="manage-gym-switch"
              className="w-full rounded-md border border-gray-200 bg-white px-2 py-1.5 text-[13px] text-gray-800 shadow-sm"
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
      </div>

      <div className="flex min-h-0 flex-1 flex-col px-3 pb-4 md:min-h-0">
        <div className="flex min-h-0 flex-1 flex-col justify-between gap-4">
          <div className="min-h-0 flex-1 overflow-hidden pt-5">
            <SectionLabel>Overview</SectionLabel>
            <div className="flex flex-col gap-0.5">
              {primary.map((item) => (
                <NavLink key={item.href} item={item} pathname={pathname} />
              ))}
            </div>

            <SectionLabel>Your gym</SectionLabel>
            <div className="flex flex-col gap-0.5">
              {secondary.map((item) => (
                <NavLink key={item.href} item={item} pathname={pathname} />
              ))}
            </div>
          </div>

          <div className="shrink-0 pt-2">
            <NavLink item={settings} pathname={pathname} />
          </div>
        </div>
      </div>
    </aside>
  )
}
