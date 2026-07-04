import type { ReactNode } from 'react'
import Link from 'next/link'

type ArticleShellProps = {
  title: string
  subtitle?: string
  lastUpdated?: string
  breadcrumbs?: Array<{ label: string; href: string }>
  children: ReactNode
}

function formatGuideLastUpdated(isoDate: string): string {
  const parsed = new Date(`${isoDate}T12:00:00`)
  if (Number.isNaN(parsed.getTime())) return isoDate
  return parsed.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

export function ArticleShell({ title, subtitle, lastUpdated, breadcrumbs, children }: ArticleShellProps) {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="text-sm text-gray-500 mb-4">
            <ol className="flex flex-wrap gap-2">
              {breadcrumbs.map((b, idx) => (
                <li key={b.href} className="flex items-center gap-2">
                  <Link href={b.href} className="hover:text-[#003580] hover:underline">
                    {b.label}
                  </Link>
                  {idx < breadcrumbs.length - 1 && <span>/</span>}
                </li>
              ))}
            </ol>
          </nav>
        )}

        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">{title}</h1>
          {subtitle && <p className="text-base md:text-lg text-gray-600">{subtitle}</p>}
          {lastUpdated && (
            <p className="mt-3 text-sm text-gray-500">
              Last updated {formatGuideLastUpdated(lastUpdated)}
            </p>
          )}
        </header>

        {children}
      </div>
    </div>
  )
}

