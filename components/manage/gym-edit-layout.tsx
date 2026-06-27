'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import { ManageBreadcrumbs } from '@/components/manage/manage-breadcrumbs'
import {
  GymEditSectionNav,
  GymEditSectionSelect,
  gymEditSectionMeta,
  type GymEditSectionsStatus,
} from '@/components/manage/gym-edit-sidebar'
import { Button } from '@/components/ui/button'
import { CHECKOUT_PAY_BUTTON_CLASS } from '@/components/booking/checkout-ui'
import { cn } from '@/lib/utils'

export function GymEditLayout({
  hubCrumb,
  gymName,
  gymId,
  returnTo,
  activeSection,
  sections,
  saving,
  saveError,
  onSave,
  onCancel,
  children,
}: {
  hubCrumb: { label: string; href: string }
  gymName: string
  gymId: string
  returnTo?: string | null
  activeSection: string
  sections: GymEditSectionsStatus
  saving: boolean
  saveError?: string | null
  onSave: () => void
  onCancel: () => void
  children: ReactNode
}) {
  const requiredComplete = Object.values(sections).filter((s) => s.required && s.completed).length
  const requiredTotal = Object.values(sections).filter((s) => s.required).length
  const previewHref = `/manage/gym/preview?gym_id=${encodeURIComponent(gymId)}`
  const sectionMeta = gymEditSectionMeta(activeSection)

  return (
    <div className="min-h-full bg-white pb-28 md:pb-28">
      <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6 sm:py-6">
        <ManageBreadcrumbs items={[hubCrumb, { label: 'Edit listing' }]} />

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
              {sectionMeta.label}
            </h1>
            <p className="mt-1 truncate text-sm font-medium text-gray-700">{gymName}</p>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">{sectionMeta.description}</p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700"
              aria-live="polite"
            >
              {requiredComplete} of {requiredTotal} required complete
            </span>
            <Link
              href={previewHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-900 shadow-sm transition-colors hover:bg-gray-50"
            >
              Preview listing
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </div>
        </div>

        <div className="mt-5 md:hidden">
          <label htmlFor="gym-edit-mobile-section" className="mb-1.5 block text-xs font-medium text-gray-500">
            Section
          </label>
          <GymEditSectionSelect gymId={gymId} returnTo={returnTo} activeSection={activeSection} />
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-[220px,1fr] md:gap-8 lg:grid-cols-[240px,1fr]">
          <aside className="hidden md:block">
            <GymEditSectionNav
              gymId={gymId}
              returnTo={returnTo}
              activeSection={activeSection}
              sections={sections}
            />
          </aside>

          <div className="min-w-0">{children}</div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:gap-3 sm:px-6">
          {saveError ? (
            <p className="text-sm text-[#c13515] sm:min-w-0 sm:flex-1" role="alert">
              {saveError}
            </p>
          ) : null}
          <div className="flex w-full items-center gap-3 sm:ml-auto sm:w-auto">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="hidden shrink-0 sm:inline-flex"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={onSave}
              disabled={saving}
              className={cn(
                CHECKOUT_PAY_BUTTON_CLASS,
                'flex-1 sm:min-w-[10.5rem] sm:flex-initial',
              )}
            >
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
