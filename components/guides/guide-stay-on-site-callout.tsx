'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { MouseEvent, ReactNode } from 'react'
import { trackInlineCalloutClick } from '@/lib/telemetry/guide-click-tracking'

export function GuideStayOnSiteCallout({
  city,
  href,
  children,
}: {
  city: string
  href: string
  children?: ReactNode
}) {
  const pathname = usePathname()

  function handleClick(event: MouseEvent<HTMLDivElement>) {
    const anchor = (event.target as HTMLElement).closest('a')
    if (!anchor) return
    trackInlineCalloutClick({ originPage: pathname })
  }

  return (
    <div
      className="mb-8 rounded-xl border border-[#003580]/20 bg-[#003580]/5 p-5 md:p-6"
      onClick={handleClick}
    >
      <p className="text-sm leading-relaxed text-gray-800">
        {children ?? (
          <>
            Looking to stay on-site? See our{' '}
            <Link href={href} className="font-semibold text-[#003580] underline">
              {city} Muay Thai train-and-stay guide
            </Link>{' '}
            for camps with accommodation and live package prices.
          </>
        )}
      </p>
    </div>
  )
}
