'use client'

import type { ReactNode } from 'react'
import {
  GymEditSectionNav,
  GymEditSectionSelect,
  gymEditSectionMeta,
  useGymEditSidebarCollapsed,
  type GymEditSectionsStatus,
} from '@/components/manage/gym-edit-sidebar'
import { Button } from '@/components/ui/button'
import { CHECKOUT_PAY_BUTTON_CLASS } from '@/components/booking/checkout-ui'
import { cn } from '@/lib/utils'

export function GymEditLayout({
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
  const [sidebarCollapsed, setSidebarCollapsed] = useGymEditSidebarCollapsed()
  const sectionMeta = gymEditSectionMeta(activeSection)

  return (
    <div className="min-h-full bg-neutral-50 pb-24">
      <div className="flex min-h-[calc(100svh-8.25rem)]">
        {/* Desktop sidebar */}
        <aside className="sticky top-0 hidden h-[calc(100svh-8.25rem)] shrink-0 self-start md:block">
          <GymEditSectionNav
            gymId={gymId}
            returnTo={returnTo}
            activeSection={activeSection}
            sections={sections}
            collapsed={sidebarCollapsed}
            onCollapsedChange={setSidebarCollapsed}
          />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="border-b border-gray-200/80 bg-white px-4 py-3 md:hidden">
            <label htmlFor="gym-edit-mobile-section" className="sr-only">
              Section
            </label>
            <GymEditSectionSelect gymId={gymId} returnTo={returnTo} activeSection={activeSection} />
          </div>

          <main className="flex-1 px-4 py-6 sm:px-8 sm:py-10">
            <div className="mx-auto w-full max-w-2xl">
              <h1 className="mb-6 text-2xl font-semibold tracking-tight text-gray-900 sm:mb-8 sm:text-[1.75rem]">
                {sectionMeta.label}
              </h1>
              {children}
            </div>
          </main>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="flex">
          <div
            className={cn(
              'hidden shrink-0 md:block',
              sidebarCollapsed ? 'w-[3.25rem]' : 'w-56',
            )}
            aria-hidden
          />
          <div className="flex min-w-0 flex-1 px-4 py-3 sm:px-8">
            <div className="mx-auto flex w-full max-w-2xl flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
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
      </div>
    </div>
  )
}
