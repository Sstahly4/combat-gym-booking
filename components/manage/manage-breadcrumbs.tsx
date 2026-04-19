'use client'

import Link from 'next/link'

export function ManageBreadcrumbs({
  items,
}: {
  items: { label: string; href?: string }[]
}) {
  return (
    <nav className="text-xs sm:text-sm text-gray-500 mb-4" aria-label="Breadcrumb">
      {items.map((item, i) => (
        <span key={`${item.label}-${i}`}>
          {i > 0 ? <span className="mx-1.5 text-gray-300">/</span> : null}
          {item.href ? (
            <Link href={item.href} className="hover:text-[#003580]">
              {item.label}
            </Link>
          ) : (
            <span className="text-gray-900 font-medium">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}
