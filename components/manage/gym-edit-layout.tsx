'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { Eye } from 'lucide-react'
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
  subtitle,
  headerActions,
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
  subtitle?: string
  headerActions?: ReactNode
  sections: GymEditSectionsStatus
  saving: boolean
  saveError?: string | null
  onSave?: () => void
  onCancel?: () => void
  hideSaveBar?: boolean
  contentWidth?: 'default' | 'wide' | 'full'
  children: ReactNode
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useGymEditSidebarCollapsed()
  const sectionMeta = gymEditSectionMeta(activeSection)
  const pageTitle = title ?? sectionMeta.label

  const contentMaxWidthClass =
    contentWidth === 'full'
      ? 'max-w-7xl'
      : contentWidth === 'wide'
        ? 'max-w-5xl'
        : 'max-w-2xl'

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-white">
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <aside className="hidden h-full min-h-0 shrink-0 self-stretch md:block">
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
            <div className="flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <label htmlFor="gym-edit-mobile-section" className="sr-only">
                  Section
                </label>
                <GymEditSectionSelect gymId={gymId} returnTo={returnTo} activeSection={activeSection} />
              </div>
              <Link
                href={`/manage/gym/preview?gym_id=${gymId}`}
                className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg border border-[#003580]/15 bg-[#003580]/5 px-3 text-sm font-medium text-[#003580] hover:bg-[#003580]/10"
              >
                <Eye className="h-4 w-4" aria-hidden />
                <span className="sr-only sm:not-sr-only">View</span>
              </Link>
            </div>
          </div>

          <main
            className={cn(
              'min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-8 sm:py-6',
              hideSaveBar ? 'pb-8' : 'pb-4',
            )}
          >
            <div className={cn('mx-auto w-full', contentMaxWidthClass)}>
              <header className="mb-5 sm:mb-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h1 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-[1.75rem]">
                      {pageTitle}
                    </h1>
                    {subtitle ? (
                      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-600 sm:text-[15px]">
                        {subtitle}
                      </p>
                    ) : null}
                  </div>
                  {headerActions ? <div className="shrink-0">{headerActions}</div> : null}
                </div>
              </header>
              {children}
            </div>
          </main>

          {hideSaveBar ? null : (
            <div className="shrink-0 border-t border-gray-200 bg-white px-4 py-3 sm:px-8">
              <div
                className={cn(
                  'mx-auto flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:gap-3',
                  contentMaxWidthClass,
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
          )}
        </div>
      </div>
    </div>
  )
}
