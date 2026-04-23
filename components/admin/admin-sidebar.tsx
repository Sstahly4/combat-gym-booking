'use client'

/**
 * Admin sidebar — mirrors the visual contract of `components/manage/manage-sidebar.tsx`
 * (compact, 224px fixed sidebar on md+, brand-active text colour, section labels)
 * but with admin-specific nav: verification queue, orphan-gym claim links,
 * gyms / offers / reviews / bookings.
 *
 * Rendered by `app/admin/layout.tsx`, which also enforces admin-only access so
 * each child page no longer needs to duplicate that guard.
 */
import type { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import type { LucideIcon } from 'lucide-react'
import {
  Building2,
  Home,
  KeyRound,
  PlusCircle,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  Upload,
} from 'lucide-react'
import { ADMIN_CREATE_GYM_ONBOARDING_HREF, buildFreshAdminCreateGymHref } from '@/lib/admin/admin-routes'
import { cn } from '@/lib/utils'

type NavItem = {
  href: string
  label: string
  icon: LucideIcon
  isActive: (pathname: string) => boolean
  badge?: number | null
  /** Orange only for urgent / action-needed counts (verification queue). */
  badgeUrgent?: boolean
  /**
   * When true, every click pushes the link with a fresh `t=<timestamp>` query
   * so the destination component re-runs its loader (e.g. start a brand new
   * "Create gym" draft instead of resuming the previous one).
   */
  freshNavigate?: boolean
}

interface AdminSidebarProps {
  /** Optional pending counts to surface as small numeric badges. */
  counts?: {
    verification?: number
    orphan?: number
    offers?: number
  }
}

function buildNav(counts: AdminSidebarProps['counts']): {
  primary: NavItem[]
  ops: NavItem[]
  settings: NavItem
} {
  return {
    primary: [
      {
        href: '/admin',
        label: 'Overview',
        icon: Home,
        isActive: (p) => p === '/admin',
      },
      {
        href: ADMIN_CREATE_GYM_ONBOARDING_HREF,
        label: 'Create gym',
        icon: PlusCircle,
        isActive: (p) => p === '/admin/create-gym' || p.startsWith('/admin/create-gym/'),
        freshNavigate: true,
      },
      {
        href: '/admin/verification',
        label: 'Verification',
        icon: ShieldCheck,
        isActive: (p) => p === '/admin/verification' || p.startsWith('/admin/verification/'),
        badge: counts?.verification ?? null,
        badgeUrgent: true,
      },
      {
        href: '/admin/gyms',
        label: 'Gyms',
        icon: Building2,
        isActive: (p) =>
          p === '/admin/gyms' ||
          (p.startsWith('/admin/gyms/') && !p.startsWith('/admin/gyms/bulk-import')),
      },
      {
        href: '/admin/gyms/bulk-import',
        label: 'Bulk import',
        icon: Upload,
        isActive: (p) => p.startsWith('/admin/gyms/bulk-import'),
      },
      {
        href: '/admin/reviews',
        label: 'Reviews',
        icon: Star,
        isActive: (p) => p === '/admin/reviews' || p.startsWith('/admin/reviews/'),
      },
      {
        href: '/admin/offers',
        label: 'Offers',
        icon: Sparkles,
        isActive: (p) => p === '/admin/offers' || p.startsWith('/admin/offers/'),
        badge: counts?.offers ?? null,
      },
    ],
    ops: [
      {
        href: '/admin/orphan-gyms',
        label: 'Claim links',
        icon: KeyRound,
        isActive: (p) => p === '/admin/orphan-gyms' || p.startsWith('/admin/orphan-gyms/'),
        badge: counts?.orphan ?? null,
      },
    ],
    settings: {
      href: '/manage',
      label: 'Back to platform',
      icon: Settings,
      isActive: () => false,
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

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const router = useRouter()
  const { href, label, icon: Icon, isActive, badge, badgeUrgent, freshNavigate } = item
  const active = isActive(pathname)
  const handleClick = freshNavigate
    ? (event: React.MouseEvent<HTMLAnchorElement>) => {
        event.preventDefault()
        const target =
          href === ADMIN_CREATE_GYM_ONBOARDING_HREF
            ? buildFreshAdminCreateGymHref()
            : `${href}${href.includes('?') ? '&' : '?'}t=${Date.now()}`
        router.push(target)
      }
    : undefined
  return (
    <Link
      href={href}
      onClick={handleClick}
      className={cn(
        'flex items-center gap-2.5 rounded-md px-2 py-2 text-[13px] leading-snug transition-colors',
        active ? 'font-medium text-[#003580]' : 'font-normal text-gray-500 hover:text-gray-800',
      )}
      aria-current={active ? 'page' : undefined}
    >
      <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden />
      <span className="flex-1 truncate">{label}</span>
      {typeof badge === 'number' && badge > 0 && (
        <span
          className={cn(
            'inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1.5 text-[10px] font-semibold',
            active
              ? 'bg-[#003580] text-white'
              : badgeUrgent
                ? 'bg-orange-100 text-orange-800'
                : 'bg-slate-100 text-slate-600',
          )}
        >
          {badge}
        </span>
      )}
    </Link>
  )
}

export function AdminSidebar({ counts }: AdminSidebarProps) {
  const pathname = usePathname() ?? ''
  const { primary, ops, settings } = buildNav(counts)

  return (
    <aside
      className={cn(
        'flex w-full shrink-0 flex-col border-b border-gray-200 bg-white',
        'md:fixed md:bottom-0 md:left-0 md:top-[5rem] md:z-30 md:w-56 md:border-b-0 md:border-r md:border-gray-200',
        'md:min-h-0 md:overflow-hidden',
      )}
    >
      <div className="shrink-0 px-3 pb-4 pt-4">
        <Link
          href="/admin"
          className="flex min-w-0 items-center gap-2 text-[14px] font-semibold tracking-tight text-gray-900"
          title="Admin dashboard"
        >
          <span
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-[#003580] text-[10px] font-bold text-white"
            aria-hidden
          >
            A
          </span>
          <span className="truncate">Admin</span>
        </Link>
        <p className="mt-1 text-[11px] text-gray-400">Platform operations</p>
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

            <SectionLabel>Owner handoff</SectionLabel>
            <div className="flex flex-col gap-0.5">
              {ops.map((item) => (
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
