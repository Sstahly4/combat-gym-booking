'use client'

import {
  Info,
  MapPin,
  Image,
  Dumbbell,
  Clock,
  Users,
  HelpCircle,
  Package,
  CheckCircle2,
  Circle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

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

interface GymEditSidebarProps {
  activeSection: string
  onSectionChange: (section: string) => void
  sections: GymEditSectionsStatus
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
    label: 'Disciplines & amenities',
    description: 'Sports offered and facilities',
    icon: Dumbbell,
    required: true,
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

/** Sticky left nav for the listing editor (desktop). */
export function GymEditSectionNav({ activeSection, onSectionChange, sections }: GymEditSidebarProps) {
  const requiredComplete = Object.values(sections).filter((s) => s.required && s.completed).length
  const requiredTotal = Object.values(sections).filter((s) => s.required).length

  return (
    <nav aria-label="Listing sections" className="sticky top-20">
      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-400">Sections</p>
      <ul className="flex flex-col gap-1">
        {GYM_EDIT_SECTIONS.map((section) => {
          const Icon = section.icon
          const sectionData = sections[section.id] || { completed: false, required: false }
          const isActive = activeSection === section.id

          return (
            <li key={section.id}>
              <button
                type="button"
                onClick={() => onSectionChange(section.id)}
                className={cn(
                  'group flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition',
                  isActive
                    ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900',
                )}
                aria-current={isActive ? 'true' : undefined}
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
              </button>
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

/** @deprecated Use GymEditSectionNav in the listing editor layout. */
export function GymEditSectionTabs({ activeSection, onSectionChange, sections }: GymEditSidebarProps) {
  return (
    <GymEditSectionNav
      activeSection={activeSection}
      onSectionChange={onSectionChange}
      sections={sections}
    />
  )
}

/** @deprecated Legacy fixed sidebar — use GymEditSectionNav. */
export function GymEditSidebar({ activeSection, onSectionChange, sections }: GymEditSidebarProps) {
  return (
    <div className="h-screen w-64 shrink-0 overflow-y-auto border-r border-gray-200 bg-white">
      <div className="p-4">
        <GymEditSectionNav
          activeSection={activeSection}
          onSectionChange={onSectionChange}
          sections={sections}
        />
      </div>
    </div>
  )
}
