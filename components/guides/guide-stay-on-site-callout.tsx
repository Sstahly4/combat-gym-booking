import Link from 'next/link'
import type { ReactNode } from 'react'

export function GuideStayOnSiteCallout({
  city,
  href,
  children,
}: {
  city: string
  href: string
  children?: ReactNode
}) {
  return (
    <div className="mb-8 rounded-xl border border-[#003580]/20 bg-[#003580]/5 p-5 md:p-6">
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
