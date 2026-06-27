'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import {
  Info,
  MapPin,
  Image,
  Dumbbell,
  Sparkles,
  Clock,
  Users,
  HelpCircle,
  Package,
  CheckCircle2,
  Circle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { manageGymEditHref } from '@/lib/navigation/manage-gym-edit-return'

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

export const GYM_EDIT_SECTIONS: SidebarItem[] = [
  {
    id: 'basic',
    label: 'Title & description',
    description: 'Name, tagline, and listing copy',
    icon: Info,
    required: true,
  },
  {
    id: 'location',
    label: 'Location',
    description: 'Address and verification links',
    icon: MapPin,
    required: true,
  },
  {
    id: 'images',
    label: 'Photos',
    description: 'Cover image and gallery',
    icon: Image,
    required: true,
  },
  {
    id: 'disciplines',
    label: 'Disciplines',
    description: 'Sports and martial arts offered',
    icon: Dumbbell,
    required: true,
  },
  {
    id: 'amenities',
    label: 'Amenities',
    description: 'Facilities, equipment, and services',
    icon: Sparkles,
  },
  {
    id: 'schedule',
    label: 'Schedule',
    description: 'Hours and class timetable',
    icon: Clock,
  },
  {
    id: 'trainers',
    label: 'Trainers',
    description: 'Coaches and staff profiles',
    icon: Users,
  },
  {
    id: 'faq',
    label: 'FAQ',
    description: 'Common guest questions',
    icon: HelpCircle,
  },
  {
    id: 'packages',
    label: 'Packages',
    description: 'Training offers and pricing',
    icon: Package,
    required: true,
  },
]

export const GYM_EDIT_SECTION_IDS = new Set(GYM_EDIT_SECTIONS.map((s) => s.id))

export const DEFAULT_GYM_EDIT_SECTION = 'basic'

export function resolveGymEditSection(section: string | null | undefined): string {
  if (section && GYM_EDIT_SECTION_IDS.has(section)) return section
  return DEFAULT_GYM_EDIT_SECTION
}

export function gymEditSectionMeta(sectionId: string): SidebarItem {
  return GYM_EDIT_SECTIONS.find((s) => s.id === sectionId) ?? GYM_EDIT_SECTIONS[0]
}

interface GymEditSidebarProps {
  gymId: string
  returnTo?: string | null
  activeSection: string
  sections: GymEditSectionsStatus
}

function sectionHref(gymId: string, sectionId: string, returnTo?: string | null) {
  return manageGymEditHref(gymId, { section: sectionId, returnTo })
}

/** Sticky left nav for the listing editor (desktop). */
export function GymEditSectionNav({ gymId, returnTo, activeSection, sections }: GymEditSidebarProps) {
  const requiredComplete = Object.values(sections).filter((s) => s.required && s.completed).length
  const requiredTotal = Object.values(sections).filter((s) => s.required).length

  return (
    <nav aria-label="Listing sections" className="sticky top-6">
      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-400">Sections</p>
      <ul className="flex flex-col gap-1">
        {GYM_EDIT_SECTIONS.map((section) => {
          const Icon = section.icon
          const sectionData = sections[section.id] || { completed: false, required: false }
          const isActive = activeSection === section.id
          const href = sectionHref(gymId, section.id, returnTo)

          return (
            <li key={section.id}>
              <Link
                href={href}
                className={cn(
                  'group flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition',
                  isActive
                    ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900',
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon
                  className={cn(
                    'mt-0.5 h-4 w-4 shrink-0',
                    isActive ? 'text-[#003580]' : 'text-gray-500 group-hover:text-gray-700',
                  )}
                  aria-hidden
                />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <span className="block text-sm font-medium leading-tight">{section.label}</span>
                    {sectionData.completed ? (
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-600" aria-hidden />
                    ) : sectionData.required ? (
                      <Circle className="h-3 w-3 shrink-0 text-gray-300" aria-hidden />
                    ) : null}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-gray-500">{section.description}</span>
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
      <p className="mt-4 border-t border-gray-100 pt-4 text-xs text-gray-500">
        Required complete:{' '}
        <span className="font-medium text-gray-700">
          {requiredComplete} / {requiredTotal}
        </span>
      </p>
    </nav>
  )
}

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

  return (
    <select
      id="gym-edit-mobile-section"
      value={activeSection}
      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      aria-label="Choose a listing section"
      onChange={(event) => {
        const next = event.target.value
        const params = new URLSearchParams(searchParams?.toString() ?? '')
        params.set('id', gymId)
        params.set('section', next)
        if (returnTo) params.set('returnTo', returnTo)
        else params.delete('returnTo')
        window.location.assign(`${pathname}?${params.toString()}`)
      }}
    >
      {GYM_EDIT_SECTIONS.map((section) => (
        <option key={section.id} value={section.id}>
          {section.label}
        </option>
      ))}
    </select>
  )
}

/** @deprecated Use GymEditSectionNav in the listing editor layout. */
export function GymEditSectionTabs({
  gymId,
  returnTo,
  activeSection,
  sections,
}: GymEditSidebarProps) {
  return (
    <GymEditSectionNav
      gymId={gymId}
      returnTo={returnTo}
      activeSection={activeSection}
      sections={sections}
    />
  )
}

/** @deprecated Legacy fixed sidebar — use GymEditSectionNav. */
export function GymEditSidebar({
  gymId,
  returnTo,
  activeSection,
  sections,
}: GymEditSidebarProps) {
  return (
    <div className="h-screen w-64 shrink-0 overflow-y-auto border-r border-gray-200 bg-white">
      <div className="p-4">
        <GymEditSectionNav
          gymId={gymId}
          returnTo={returnTo}
          activeSection={activeSection}
          sections={sections}
        />
      </div>
    </div>
  )
}
