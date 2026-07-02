'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** White card on the listing editor gray canvas. */
export const listingSectionClass =
  'rounded-2xl bg-white p-5 shadow-sm shadow-gray-900/[0.04] ring-1 ring-black/[0.04] sm:p-6'

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
  headerAction,
  children,
  className,
  contentClassName,
}: {
  id?: string
  title: string
  description?: string
  headerAction?: ReactNode
  children: ReactNode
  className?: string
  contentClassName?: string
}) {
  return (
    <section id={id} className={cn('scroll-mt-28 md:scroll-mt-24', listingSectionClass, className)}>
      <header className="mb-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold tracking-tight text-gray-900">{title}</h2>
            {description ? (
              <p className="mt-1 text-sm leading-relaxed text-gray-500">{description}</p>
            ) : null}
          </div>
          {headerAction ? <div className="shrink-0">{headerAction}</div> : null}
        </div>
      </header>
      <div className={cn('space-y-5', contentClassName)}>{children}</div>
    </section>
  )
}
