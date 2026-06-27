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
  title,
  sections,
  saving,
  saveError,
  onSave,
  onCancel,
  hideSaveBar = false,
  contentWidth = 'default',
  children,
}: {
  gymId: string
  returnTo?: string | null
  activeSection: string
  title?: string
  sections: GymEditSectionsStatus
  saving: boolean
  saveError?: string | null
  onSave?: () => void
  onCancel?: () => void
  hideSaveBar?: boolean
  contentWidth?: 'default' | 'wide'
  children: ReactNode
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useGymEditSidebarCollapsed()
  const sectionMeta = gymEditSectionMeta(activeSection)
  const pageTitle = title ?? sectionMeta.label

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-white">
      <div className="flex min-h-0 flex-1">
        <aside className="hidden h-full shrink-0 md:block">
          <GymEditSectionNav
            gymId={gymId}
            returnTo={returnTo}
            activeSection={activeSection}
            sections={sections}
            collapsed={sidebarCollapsed}
            onCollapsedChange={setSidebarCollapsed}
          />
        </aside>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div className="shrink-0 border-b border-gray-200/80 bg-white px-4 py-3 md:hidden">
            <label htmlFor="gym-edit-mobile-section" className="sr-only">
              Section
            </label>
            <GymEditSectionSelect gymId={gymId} returnTo={returnTo} activeSection={activeSection} />
          </div>

          <main
            className={cn(
              'min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-8 sm:py-6',
              hideSaveBar ? 'pb-8' : 'pb-24',
            )}
          >
            <div
              className={cn(
                'mx-auto w-full',
                contentWidth === 'wide' ? 'max-w-5xl' : 'max-w-2xl',
              )}
            >
              <h1 className="mb-5 text-2xl font-semibold tracking-tight text-gray-900 sm:mb-6 sm:text-[1.75rem]">
                {pageTitle}
              </h1>
              {children}
            </div>
          </main>
        </div>
      </div>

      {hideSaveBar ? null : (
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white">
        <div className="flex">
          <div
            className={cn(
              'hidden shrink-0 bg-white md:block',
              sidebarCollapsed ? 'w-14' : 'w-56',
            )}
            aria-hidden
          />
          <div className="flex min-w-0 flex-1 bg-white px-4 py-3 sm:px-8">
            <div
              className={cn(
                'mx-auto flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:gap-3',
                contentWidth === 'wide' ? 'max-w-5xl' : 'max-w-2xl',
              )}
            >
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
      )}
    </div>
  )
}
