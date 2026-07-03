'use client'

import { useEffect, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import {
  Building2,
  MapPin,
  Image,
  ListChecks,
  CalendarDays,
  Users,
  Ticket,
  BedDouble,
  Tag,
  Star,
  CheckCircle2,
  PanelLeftClose,
  PanelLeftOpen,
  Eye,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { manageGymEditHref } from '@/lib/navigation/manage-gym-edit-return'
import { withManageGymId } from '@/lib/manage/manage-partner-nav'
import { useActiveGym } from '@/components/manage/active-gym-context'

const SIDEBAR_COLLAPSED_KEY = 'cs:gym-edit-sidebar-collapsed'

/** Expanded listing sidebar width — room for longer labels like "Property details". */
export const GYM_EDIT_SIDEBAR_WIDTH_CLASS = 'w-64'
export const GYM_EDIT_SIDEBAR_COLLAPSED_WIDTH_CLASS = 'w-[3.75rem]'

const linkHighlightClass = 'bg-[#1a4d9e]/10 text-[#003580]'

export type GymEditSectionsStatus = {
  [key: string]: {
    completed: boolean
    required: boolean
  }
}

interface SidebarItem {
  id: string
  label: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  required?: boolean
}

/** Metadata for each editor section (labels, copy, completion). */
export const GYM_EDIT_SECTIONS: SidebarItem[] = [
  {
    id: 'basic',
    label: 'Property details',
    description:
      'Your gym name, tagline, training styles, listing description, and guest FAQs — what travelers see on search and your public page.',
    icon: Building2,
    required: true,
  },
  {
    id: 'location',
    label: 'Location',
    description:
      'Where your gym is — street address, city, map pin, and your Google Maps listing for guests and verification.',
    icon: MapPin,
    required: true,
  },
  {
    id: 'images',
    label: 'Photos',
    description: 'Cover image and gallery for your listing.',
    icon: Image,
    required: true,
  },
  {
    id: 'trainers',
    label: 'Trainers',
    description: 'Coach profiles shown on your listing.',
    icon: Users,
  },
  {
    id: 'schedule',
    label: 'Schedule',
    description: 'Opening hours and class timetable.',
    icon: CalendarDays,
  },
  {
    id: 'packages',
    label: 'Packages',
    description: 'Training offers, rates, and what guests can book.',
    icon: Ticket,
    required: true,
  },
  {
    id: 'amenities',
    label: 'Amenities',
    description: 'Equipment, facilities, and services guests can expect.',
    icon: ListChecks,
  },
]

/** Linked listing pages outside the section query param editor. */
export const GYM_EDIT_SIDEBAR_LINKS: {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  path: string
}[] = [
  { id: 'accommodation', label: 'Accommodation', icon: BedDouble, path: '/manage/accommodation' },
  { id: 'promotions', label: 'Promotions', icon: Tag, path: '/manage/promotions' },
  { id: 'reviews', label: 'Reviews', icon: Star, path: '/manage/reviews' },
]

type SidebarNavEntry =
  | { kind: 'section'; sectionId: string }
  | { kind: 'link'; linkId: string }
  | { kind: 'preview' }

/** Grouped sidebar order — property, offering, growth, preview. */
const SIDEBAR_NAV_GROUPS: SidebarNavEntry[][] = [
  [
    { kind: 'section', sectionId: 'basic' },
    { kind: 'section', sectionId: 'location' },
    { kind: 'section', sectionId: 'images' },
  ],
  [
    { kind: 'link', linkId: 'accommodation' },
    { kind: 'section', sectionId: 'trainers' },
    { kind: 'section', sectionId: 'schedule' },
    { kind: 'section', sectionId: 'packages' },
    { kind: 'section', sectionId: 'amenities' },
  ],
  [
    { kind: 'link', linkId: 'promotions' },
    { kind: 'link', linkId: 'reviews' },
  ],
  [{ kind: 'preview' }],
]

const GYM_EDIT_SECTION_BY_ID = new Map(GYM_EDIT_SECTIONS.map((s) => [s.id, s]))
const GYM_EDIT_LINK_BY_ID = new Map(GYM_EDIT_SIDEBAR_LINKS.map((l) => [l.id, l]))

export const GYM_EDIT_SECTION_IDS = new Set(GYM_EDIT_SECTIONS.map((s) => s.id))
export const DEFAULT_GYM_EDIT_SECTION = 'basic'

export function resolveGymEditSection(section: string | null | undefined): string {
  if (section === 'preview') return 'preview'
  if (section === 'disciplines' || section === 'faq') return 'basic'
  if (section && GYM_EDIT_SECTION_IDS.has(section)) return section
  return DEFAULT_GYM_EDIT_SECTION
}

export function gymEditSectionMeta(sectionId: string): SidebarItem {
  return GYM_EDIT_SECTION_BY_ID.get(sectionId) ?? GYM_EDIT_SECTIONS[0]
}

interface GymEditSidebarProps {
  gymId: string
  returnTo?: string | null
  activeSection: string
  sections: GymEditSectionsStatus
  collapsed: boolean
  onCollapsedChange: (collapsed: boolean) => void
}

function sectionHref(gymId: string, sectionId: string, returnTo?: string | null) {
  return manageGymEditHref(gymId, { section: sectionId, returnTo })
}

function viewListingHref(gymId: string, returnTo?: string | null) {
  return manageGymEditHref(gymId, { section: 'preview', returnTo })
}

export function useGymEditSidebarCollapsed(): [boolean, (collapsed: boolean) => void] {
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY)
      if (stored === '1') setCollapsed(true)
    } catch {
      /* ignore */
    }
  }, [])

  const setPersisted = (next: boolean) => {
    setCollapsed(next)
    try {
      window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? '1' : '0')
    } catch {
      /* ignore */
    }
  }

  return [collapsed, setPersisted]
}

function SidebarDivider({ collapsed }: { collapsed: boolean }) {
  if (collapsed) {
    return <li className="my-1.5 flex justify-center px-1" aria-hidden><span className="h-px w-6 bg-gray-200" /></li>
  }
  return (
    <li className="py-2" aria-hidden>
      <div className="mx-2 border-t border-gray-100" />
    </li>
  )
}

/** Collapsible left nav for the listing editor. */
export function GymEditSectionNav({
  gymId,
  returnTo,
  activeSection,
  sections,
  collapsed,
  onCollapsedChange,
}: GymEditSidebarProps) {
  const pathname = usePathname() ?? ''
  const { gyms } = useActiveGym()
  const gymName = gyms.find((g) => g.id === gymId)?.name?.trim() ?? null
  const onGymEditRoute = pathname === '/manage/gym/edit' || pathname.startsWith('/manage/gym/edit/')
  const externalActive = GYM_EDIT_SIDEBAR_LINKS.find(
    (link) => pathname === link.path || pathname.startsWith(`${link.path}/`),
  )
  const previewHref = viewListingHref(gymId, returnTo)
  const isPreviewActive = onGymEditRoute && !externalActive && activeSection === 'preview'

  const isSectionActive = (sectionId: string) =>
    onGymEditRoute && !externalActive && activeSection === sectionId

  const linkItemClass = (isActive: boolean) =>
    cn(
      'group flex items-center rounded-lg text-[15px] font-medium transition-colors',
      collapsed
        ? 'mx-auto h-9 w-9 justify-center'
        : 'w-full gap-3 px-3 py-2.5',
      isActive
        ? linkHighlightClass
        : 'text-gray-600 hover:bg-[#1a4d9e]/10 hover:text-[#003580]',
    )

  const linkIconClass = (isActive: boolean) =>
    cn(
      'h-[1.125rem] w-[1.125rem] shrink-0',
      isActive ? 'text-[#003580]' : 'text-gray-500 group-hover:text-[#003580]',
    )

  const renderNavEntry = (entry: SidebarNavEntry): ReactNode => {
    if (entry.kind === 'section') {
      const section = GYM_EDIT_SECTION_BY_ID.get(entry.sectionId)
      if (!section) return null
      const Icon = section.icon
      const sectionData = sections[section.id] || { completed: false, required: false }
      const isActive = isSectionActive(section.id)
      const href = sectionHref(gymId, section.id, returnTo)

      return (
        <li key={`section-${section.id}`} className={collapsed ? 'w-full' : undefined}>
          <Link
            href={href}
            title={collapsed ? section.label : undefined}
            className={linkItemClass(isActive)}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon className={linkIconClass(isActive)} aria-hidden />
            {!collapsed ? (
              <>
                <span className="min-w-0 flex-1 truncate">{section.label}</span>
                {sectionData.completed ? (
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden />
                ) : null}
              </>
            ) : null}
          </Link>
        </li>
      )
    }

    if (entry.kind === 'link') {
      const link = GYM_EDIT_LINK_BY_ID.get(entry.linkId)
      if (!link) return null
      const Icon = link.icon
      const href = withManageGymId(link.path, gymId)
      const isActive = pathname === link.path || pathname.startsWith(`${link.path}/`)

      return (
        <li key={`link-${link.id}`} className={collapsed ? 'w-full' : undefined}>
          <Link
            href={href}
            title={collapsed ? link.label : undefined}
            className={linkItemClass(isActive)}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon className={linkIconClass(isActive)} aria-hidden />
            {!collapsed ? <span className="min-w-0 flex-1 truncate">{link.label}</span> : null}
          </Link>
        </li>
      )
    }

    return (
      <li key="preview" className={collapsed ? 'w-full' : undefined}>
        <Link
          href={previewHref}
          title={collapsed ? 'Preview listing' : undefined}
          data-claim-tour="tour-view-listing"
          className={linkItemClass(isPreviewActive)}
          aria-current={isPreviewActive ? 'page' : undefined}
        >
          <Eye className={linkIconClass(isPreviewActive)} aria-hidden />
          {!collapsed ? <span className="min-w-0 flex-1 truncate">Preview listing</span> : null}
        </Link>
      </li>
    )
  }

  return (
    <nav
      aria-label="Listing sections"
      className={cn(
        'flex h-full min-h-0 flex-col border-r border-gray-200/80 bg-white transition-[width] duration-200 ease-in-out motion-reduce:transition-none',
        collapsed ? GYM_EDIT_SIDEBAR_COLLAPSED_WIDTH_CLASS : GYM_EDIT_SIDEBAR_WIDTH_CLASS,
      )}
    >
      <div
        className={cn(
          'shrink-0 border-b border-gray-100',
          collapsed ? 'flex justify-center px-2 pb-3 pt-4' : 'px-4 pb-3 pt-5',
        )}
      >
        {collapsed ? (
          <span
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1a4d9e]/10 text-sm font-semibold text-[#003580]"
            title={gymName ?? 'Listing'}
          >
            {gymName ? gymName.charAt(0).toUpperCase() : 'G'}
          </span>
        ) : (
          <p className="truncate text-sm font-semibold leading-snug text-gray-900" title={gymName ?? undefined}>
            {gymName ?? 'Your listing'}
          </p>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden py-2">
        <ul className={cn('flex flex-col gap-0.5', collapsed ? 'items-center px-1.5' : 'px-2')}>
          {SIDEBAR_NAV_GROUPS.flatMap((group, groupIndex) => [
            ...(groupIndex > 0 ? [<SidebarDivider key={`divider-${groupIndex}`} collapsed={collapsed} />] : []),
            ...group.map((entry) => renderNavEntry(entry)),
          ])}
        </ul>
      </div>

      <div className={cn('mt-auto shrink-0 border-t border-gray-100', collapsed ? 'px-1.5 py-2' : 'px-2 py-2')}>
        <button
          type="button"
          onClick={() => onCollapsedChange(!collapsed)}
          className={cn(
            'flex items-center rounded-lg text-gray-500 transition-colors hover:bg-[#1a4d9e]/10 hover:text-[#003580]',
            collapsed ? 'mx-auto h-9 w-9 justify-center' : 'w-full gap-3 px-3 py-2.5',
          )}
          aria-expanded={!collapsed}
          aria-label={collapsed ? 'Expand listing sidebar' : 'Collapse listing sidebar'}
        >
          {collapsed ? (
            <PanelLeftOpen className="h-[1.125rem] w-[1.125rem]" aria-hidden />
          ) : (
            <>
              <PanelLeftClose className="h-[1.125rem] w-[1.125rem] shrink-0" aria-hidden />
              <span className="text-[15px] font-medium">Collapse</span>
            </>
          )}
        </button>
      </div>
    </nav>
  )
}

/** Flat mobile nav order matching desktop groups. */
const MOBILE_NAV_ORDER: SidebarNavEntry[] = SIDEBAR_NAV_GROUPS.flat()

/** Mobile section picker — navigates to dedicated section URLs. */
export function GymEditSectionSelect({
  gymId,
  returnTo,
  activeSection,
}: {
  gymId: string
  returnTo?: string | null
  activeSection: string
}) {
  const pathname = usePathname() ?? '/manage/gym/edit'
  const searchParams = useSearchParams()
  const externalActive = GYM_EDIT_SIDEBAR_LINKS.find(
    (link) => pathname === link.path || pathname.startsWith(`${link.path}/`),
  )
  const selectValue = externalActive?.id ?? activeSection

  const labelForEntry = (entry: SidebarNavEntry): { value: string; label: string } | null => {
    if (entry.kind === 'section') {
      const section = GYM_EDIT_SECTION_BY_ID.get(entry.sectionId)
      return section ? { value: section.id, label: section.label } : null
    }
    if (entry.kind === 'link') {
      const link = GYM_EDIT_LINK_BY_ID.get(entry.linkId)
      return link ? { value: link.id, label: link.label } : null
    }
    return { value: 'preview', label: 'Preview listing' }
  }

  return (
    <select
      id="gym-edit-mobile-section"
      value={selectValue}
      className="flex h-10 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-[15px] text-gray-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#003580]/25"
      aria-label="Choose a listing section"
      onChange={(event) => {
        const next = event.target.value
        if (next === 'preview') {
          const params = new URLSearchParams(searchParams?.toString() ?? '')
          params.set('id', gymId)
          params.set('section', 'preview')
          if (returnTo) params.set('returnTo', returnTo)
          else params.delete('returnTo')
          window.location.assign(`${pathname}?${params.toString()}`)
          return
        }
        const external = GYM_EDIT_SIDEBAR_LINKS.find((link) => link.id === next)
        if (external) {
          window.location.assign(withManageGymId(external.path, gymId))
          return
        }
        const params = new URLSearchParams(searchParams?.toString() ?? '')
        params.set('id', gymId)
        params.set('section', next)
        if (returnTo) params.set('returnTo', returnTo)
        else params.delete('returnTo')
        window.location.assign(`${pathname}?${params.toString()}`)
      }}
    >
      {MOBILE_NAV_ORDER.map((entry) => {
        const item = labelForEntry(entry)
        if (!item) return null
        return (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        )
      })}
    </select>
  )
}
