import Link from 'next/link'
import { SUPPORT_HUB_PAGES, type SupportPageLink } from '@/lib/help/support-pages'
import { PARTNER_SUPPORT_HUB_PAGES } from '@/lib/help/partner-help'
import { cn } from '@/lib/utils'

export type SupportAudience = 'traveler' | 'partner'

function pagesForAudience(audience: SupportAudience): SupportPageLink[] {
  return audience === 'partner' ? PARTNER_SUPPORT_HUB_PAGES : SUPPORT_HUB_PAGES
}

export function SupportHubLinks({
  currentPath,
  variant = 'default',
  audience = 'traveler',
  className,
}: {
  currentPath?: string
  variant?: 'default' | 'compact'
  audience?: SupportAudience
  className?: string
}) {
  const pages = pagesForAudience(audience)
  const hubLabel = audience === 'partner' ? 'Partner resources' : 'Support & policies'

  if (variant === 'compact') {
    return (
      <nav
        aria-label={hubLabel}
        className={cn('rounded-lg border border-gray-200 bg-gray-50/80 px-4 py-3', className)}
      >
        <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
          Related pages
        </p>
        <ul className="mt-2 flex flex-wrap gap-x-1 gap-y-1 text-sm">
          {pages.map((page, index) => {
            const active = currentPath === page.href.split('?')[0]
            return (
              <li key={page.href} className="flex items-center gap-1">
                {index > 0 ? <span className="text-gray-300" aria-hidden>·</span> : null}
                <Link
                  href={page.href}
                  className={
                    active
                      ? 'font-semibold text-[#0052CC]'
                      : 'text-gray-700 hover:text-[#0052CC] hover:underline'
                  }
                  aria-current={active ? 'page' : undefined}
                >
                  {page.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    )
  }

  return (
    <nav aria-label={hubLabel} className={cn('mb-8', className)}>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">{hubLabel}</p>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {pages.map((page) => {
          const active = currentPath === page.href.split('?')[0]
          return (
            <li key={page.href}>
              <Link
                href={page.href}
                className={`block rounded-lg border px-4 py-3 transition-colors ${
                  active
                    ? 'border-[#0052CC]/30 bg-[#E9F2FF]'
                    : 'border-gray-200 bg-white hover:border-[#0052CC]/25 hover:bg-gray-50'
                }`}
                aria-current={active ? 'page' : undefined}
              >
                <span
                  className={`text-sm font-semibold ${
                    active ? 'text-[#0052CC]' : 'text-gray-900'
                  }`}
                >
                  {page.label}
                </span>
                <span className="mt-0.5 block text-xs leading-snug text-gray-500">
                  {page.description}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
