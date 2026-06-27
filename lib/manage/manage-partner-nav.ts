import type { LucideIcon } from 'lucide-react'
import {
  BadgeCheck,
  BedDouble,
  CalendarRange,
  ClipboardList,
  Eye,
  HelpCircle,
  Home,
  LayoutList,
  Settings,
  ShieldCheck,
  Star,
  Tag,
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
  const promotionsHref = withManageGymId('/manage/promotions', firstGymId)
  const reviewsHref = withManageGymId('/manage/reviews', firstGymId)
  const accommodationHref = withManageGymId('/manage/accommodation', firstGymId)
  const helpHref = withManageGymId('/manage/help', firstGymId)
  const verificationHref = withManageGymId('/manage/verification', firstGymId)
  const settingsHref = withManageGymId('/manage/settings', firstGymId)

  const listingsActive = (p: string) =>
    p.startsWith('/manage/gym/edit') || p.startsWith('/manage/gym/preview')

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
        href: promotionsHref,
        label: 'Promotions',
        icon: Tag,
        isActive: (p) => p === '/manage/promotions' || p.startsWith('/manage/promotions/'),
      },
      {
        href: reviewsHref,
        label: 'Reviews',
        icon: Star,
        isActive: (p) => p === '/manage/reviews' || p.startsWith('/manage/reviews/'),
      },
      {
        href: accommodationHref,
        label: 'Accommodation',
        icon: BedDouble,
        isActive: (p) => p === '/manage/accommodation' || p.startsWith('/manage/accommodation/'),
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
    pathname === '/manage/promotions' ||
    pathname.startsWith('/manage/promotions/') ||
    pathname === '/manage/reviews' ||
    pathname.startsWith('/manage/reviews/') ||
    pathname === '/manage/accommodation' ||
    pathname.startsWith('/manage/accommodation/') ||
    pathname === '/manage/help' ||
    pathname.startsWith('/manage/help/') ||
    pathname === '/manage/verification' ||
    pathname === '/manage/settings' ||
    pathname.startsWith('/manage/settings/')
  )
}

/** Site navbar (5rem) + partner top bar (3rem). */
export const PARTNER_HUB_TOP_OFFSET_CLASS = 'pt-32'

/** Mobile: site navbar only when partner nav is bottom-fixed. */
export const PARTNER_HUB_MOBILE_TOP_OFFSET_CLASS = 'pt-20'

/** Room for bottom tab bar + safe area on mobile. */
export const PARTNER_HUB_MOBILE_BOTTOM_OFFSET_CLASS =
  'pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))]'
