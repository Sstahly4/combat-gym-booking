'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** White card on the listing editor gray canvas. */
export const listingSectionClass =
  'rounded-2xl bg-white p-5 shadow-sm shadow-gray-900/[0.04] ring-1 ring-black/[0.04] sm:p-6'

/** Subtle brand tint for primary identity blocks. */
export const listingSectionTintedClass =
  'rounded-2xl bg-[#003580]/[0.03] p-5 shadow-sm shadow-gray-900/[0.03] ring-1 ring-[#003580]/10 sm:p-6'

/** Content area for a listing editor section — stacked cards on neutral canvas. */
export function GymEditPanel({
  children,
  className,
  contentClassName,
}: {
  children: ReactNode
  className?: string
  contentClassName?: string
}) {
  return (
    <div className={cn('flex flex-col gap-5', contentClassName, className)}>{children}</div>
  )
}

export function GymEditSection({
  id,
  title,
  description,
  icon,
  headerAction,
  tinted = false,
  children,
  className,
  contentClassName,
}: {
  id?: string
  title: string
  description?: string
  icon?: ReactNode
  headerAction?: ReactNode
  tinted?: boolean
  children: ReactNode
  className?: string
  contentClassName?: string
}) {
  return (
    <section
      id={id}
      className={cn(
        'scroll-mt-28 md:scroll-mt-24',
        tinted ? listingSectionTintedClass : listingSectionClass,
        className,
      )}
    >
      <header className="mb-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            {icon ? (
              <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#003580]/10 ring-1 ring-[#003580]/15">
                {icon}
              </span>
            ) : null}
            <div className="min-w-0">
              <h2 className="text-lg font-semibold tracking-tight text-gray-900">{title}</h2>
              {description ? (
                <p className="mt-1 text-sm leading-relaxed text-gray-500">{description}</p>
              ) : null}
            </div>
          </div>
          {headerAction ? <div className="shrink-0">{headerAction}</div> : null}
        </div>
      </header>
      <div className={cn('space-y-5', contentClassName)}>{children}</div>
    </section>
  )
}
