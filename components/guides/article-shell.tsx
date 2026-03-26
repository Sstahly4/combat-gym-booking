import type { ReactNode } from 'react'
import Link from 'next/link'

type ArticleShellProps = {
  title: string
  subtitle?: string
  breadcrumbs?: Array<{ label: string; href: string }>
  children: ReactNode
}

export function ArticleShell({ title, subtitle, breadcrumbs, children }: ArticleShellProps) {
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
        </header>

        {children}
      </div>
    </div>
  )
}

