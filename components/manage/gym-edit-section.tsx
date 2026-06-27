'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function GymEditSection({
  id,
  title,
  description,
  children,
  className,
  contentClassName,
}: {
  id?: string
  title: string
  description?: string
  children: ReactNode
  className?: string
  contentClassName?: string
}) {
  return (
    <section
      id={id}
      className={cn(
        'scroll-mt-28 rounded-xl border border-gray-200/90 bg-white p-5 shadow-sm shadow-gray-900/[0.03] sm:p-6 md:scroll-mt-24',
        className,
      )}
    >
      <header className="mb-5 border-b border-gray-100 pb-4">
        <h2 className="text-lg font-semibold tracking-tight text-gray-900">{title}</h2>
        {description ? <p className="mt-1 text-sm text-gray-500">{description}</p> : null}
      </header>
      <div className={cn('space-y-5', contentClassName)}>{children}</div>
    </section>
  )
}
