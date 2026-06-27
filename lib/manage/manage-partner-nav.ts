import type { LucideIcon } from 'lucide-react'
import {
  BadgeCheck,
  CalendarRange,
  ClipboardList,
  Eye,
  HelpCircle,
  Home,
  LayoutList,
  Settings,
  ShieldCheck,
  Wallet,
} from 'lucide-react'

export type PartnerNavTab = {
  id: string
  href: string
  label: string
  icon: LucideIcon
  isActive: (pathname: string) => boolean
  tourAnchor?: string
}

export type PartnerMenuItem = {
  href: string
  label: string
  icon: LucideIcon
  isActive: (pathname: string) => boolean
  tourAnchor?: string
  description?: string
}

export function withManageGymId(href: string, gymId: string | null): string {
  if (!gymId) return href
  if (!href.startsWith('/manage')) return href
  const [path, query] = href.split('?')
  const q = new URLSearchParams(query || '')
  if (!q.has('gym_id')) q.set('gym_id', gymId)
  const qs = q.toString()
  return qs ? `${path}?${qs}` : path
}

export function buildPartnerNav({
  editGymHref,
  viewListingHref,
  firstGymId,
  verificationDone,
}: {
  editGymHref: string
  viewListingHref: string
  firstGymId: string | null
  verificationDone: boolean
}): { tabs: PartnerNavTab[]; menu: PartnerMenuItem[]; settings: PartnerMenuItem } {
  const homeHref = withManageGymId('/manage', firstGymId)
  const calendarHref = withManageGymId('/manage/calendar', firstGymId)
  const bookingsHref = withManageGymId('/manage/bookings', firstGymId)
  const balancesHref = withManageGymId('/manage/balances', firstGymId)
  const helpHref = withManageGymId('/manage/help', firstGymId)
  const verificationHref = withManageGymId('/manage/verification', firstGymId)
  const settingsHref = withManageGymId('/manage/settings', firstGymId)

  const listingsActive = isPartnerListingWorkspaceRoute

  return {
    tabs: [
      {
        id: 'home',
        href: homeHref,
        label: 'Home',
        icon: Home,
        isActive: (p) => p === '/manage',
      },
      {
        id: 'bookings',
        href: bookingsHref,
        label: 'Bookings',
        icon: ClipboardList,
        isActive: (p) => p === '/manage/bookings' || p.startsWith('/manage/bookings/'),
      },
      {
        id: 'calendar',
        href: calendarHref,
        label: 'Calendar',
        icon: CalendarRange,
        isActive: (p) => p === '/manage/calendar' || p.startsWith('/manage/calendar/'),
      },
      {
        id: 'listings',
        href: editGymHref,
        label: 'Listings',
        icon: LayoutList,
        isActive: listingsActive,
        tourAnchor: 'tour-edit-gym',
      },
      {
        id: 'balances',
        href: balancesHref,
        label: 'Balances',
        icon: Wallet,
        isActive: (p) => p === '/manage/balances' || p.startsWith('/manage/balances/'),
        tourAnchor: 'tour-balances',
      },
    ],
    menu: [
      {
        href: viewListingHref,
        label: 'View listing',
        icon: Eye,
        isActive: (p) => p === '/manage/gym/preview' || p.startsWith('/manage/gym/preview'),
        tourAnchor: 'tour-view-listing',
      },
      {
        href: verificationHref,
        label: verificationDone ? 'Verified' : 'Verification',
        icon: verificationDone ? BadgeCheck : ShieldCheck,
        isActive: (p) => p === '/manage/verification',
      },
      {
        href: helpHref,
        label: 'Help center',
        icon: HelpCircle,
        isActive: (p) => p === '/manage/help' || p.startsWith('/manage/help/'),
      },
    ],
    settings: {
      href: settingsHref,
      label: 'Settings',
      icon: Settings,
      isActive: (p) => p === '/manage/settings' || p.startsWith('/manage/settings/'),
    },
  }
}

export function isPartnerMenuRouteActive(pathname: string): boolean {
  return (
    pathname === '/manage/gym/preview' ||
    pathname.startsWith('/manage/gym/preview') ||
    pathname === '/manage/help' ||
    pathname.startsWith('/manage/help/') ||
    pathname === '/manage/verification' ||
    pathname === '/manage/settings' ||
    pathname.startsWith('/manage/settings/')
  )
}

/** Gym-scoped listing workspace (editor sections + linked listing pages). */
export function isPartnerListingWorkspaceRoute(pathname: string): boolean {
  return (
    pathname.startsWith('/manage/gym/edit') ||
    pathname.startsWith('/manage/gym/preview') ||
    pathname.startsWith('/manage/accommodation') ||
    pathname.startsWith('/manage/promotions') ||
    pathname.startsWith('/manage/reviews')
  )
}

/** Routes that use onboarding / wizard chrome without the unified partner header. */
export const PARTNER_ONBOARDING_ROUTE_PREFIXES = [
  '/manage/invite',
  '/manage/onboarding',
  '/manage/security-onboarding',
  '/manage/list-your-gym',
] as const

export function partnerHubUsesUnifiedHeader(pathname: string): boolean {
  if (!pathname.startsWith('/manage')) return false
  return !PARTNER_ONBOARDING_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )
}

/** Unified partner header (sticky app chrome). */
export const PARTNER_HUB_HEADER_HEIGHT_CLASS = 'h-20 shrink-0'
export const PARTNER_HUB_SHELL_CLASS = 'flex h-svh flex-col overflow-hidden bg-white'
export const PARTNER_HUB_MAIN_CLASS = 'min-h-0 min-w-0 flex-1 overflow-x-hidden bg-white'
