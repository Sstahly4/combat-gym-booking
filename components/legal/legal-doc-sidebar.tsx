'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'
import {
  LEGAL_DOC_NAV,
  LEGAL_HELP_LINKS,
  type LegalDocTocItem,
} from '@/lib/legal/legal-pages'

const INITIAL_VISIBLE = 4

function SidebarSectionHeading({ children }: { children: string }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
      {children}
    </p>
  )
}

function SidebarNavLink({
  href,
  label,
  active,
}: {
  href: string
  label: string
  active: boolean
}) {
  return (
    <li>
      <Link
        href={href}
        className={`flex items-start gap-2 py-1.5 text-sm leading-snug transition-colors ${
          active
            ? 'font-semibold text-[#0052CC]'
            : 'text-gray-700 hover:text-[#0052CC]'
        }`}
        aria-current={active ? 'page' : undefined}
      >
        {active ? (
          <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#0052CC]" aria-hidden />
        ) : (
          <span className="mt-[7px] h-1.5 w-1.5 shrink-0" aria-hidden />
        )}
        {label}
      </Link>
    </li>
  )
}

export function LegalDocSidebar({
  currentPath,
  tableOfContents,
}: {
  currentPath: string
  tableOfContents: LegalDocTocItem[]
}) {
  const [showAllLegal, setShowAllLegal] = useState(false)
  const hasOverflow = LEGAL_DOC_NAV.length > INITIAL_VISIBLE
  const visibleLegal = showAllLegal
    ? LEGAL_DOC_NAV
    : LEGAL_DOC_NAV.slice(0, INITIAL_VISIBLE)

  return (
    <aside className="space-y-8 lg:sticky lg:top-24 lg:self-start">
      <nav aria-label="Legal and policies">
        <SidebarSectionHeading>Legal &amp; policies</SidebarSectionHeading>
        <ul className="mt-3 space-y-0.5">
          {visibleLegal.map((item) => (
            <SidebarNavLink
              key={item.href}
              href={item.href}
              label={item.label}
              active={currentPath === item.href}
            />
          ))}
        </ul>
        {hasOverflow ? (
          <button
            type="button"
            onClick={() => setShowAllLegal((open) => !open)}
            className="mt-2 flex items-center gap-1 text-sm font-medium text-[#0052CC] hover:underline"
          >
            {showAllLegal ? 'Show less' : 'Show more'}
            <ChevronDown
              className={`h-4 w-4 transition-transform ${showAllLegal ? 'rotate-180' : ''}`}
              aria-hidden
            />
          </button>
        ) : null}
      </nav>

      {tableOfContents.length > 0 ? (
        <nav aria-label="On this page">
          <SidebarSectionHeading>On this page</SidebarSectionHeading>
          <ul className="mt-3 space-y-2 border-l border-gray-200 pl-3">
            {tableOfContents.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  className="block text-sm text-gray-600 transition-colors hover:text-[#0052CC]"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}

      <nav aria-label="More help">
        <SidebarSectionHeading>More help</SidebarSectionHeading>
        <ul className="mt-3 space-y-2">
          {LEGAL_HELP_LINKS.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="text-sm text-gray-700 transition-colors hover:text-[#0052CC] hover:underline"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}
