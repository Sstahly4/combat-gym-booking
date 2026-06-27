import type { ReactNode } from 'react'
import Link from 'next/link'
import { HelpCircle, Menu } from 'lucide-react'
import { SupportAudienceSwitcher } from '@/components/help/support-audience-switcher'
import { SupportHubLinks } from '@/components/help/support-hub-links'
import { LegalDocHelpfulFeedback } from '@/components/legal/legal-doc-helpful-feedback'
import { LegalDocSidebar } from '@/components/legal/legal-doc-sidebar'
import type { LegalDocTocItem } from '@/lib/legal/legal-pages'

type Breadcrumb = {
  label: string
  href?: string
}

type LegalDocLayoutProps = {
  currentPath: string
  articleSlug: string
  title: string
  subtitle?: string
  lastUpdated?: string
  tableOfContents: LegalDocTocItem[]
  breadcrumbs?: Breadcrumb[]
  callout?: ReactNode
  children: ReactNode
}

const DEFAULT_BREADCRUMBS: Breadcrumb[] = [
  { label: 'CombatStay Support', href: '/faq' },
  { label: 'Legal' },
]

export function LegalDocLayout({
  currentPath,
  articleSlug,
  title,
  subtitle,
  lastUpdated,
  tableOfContents,
  breadcrumbs = DEFAULT_BREADCRUMBS,
  callout,
  children,
}: LegalDocLayoutProps) {
  const trail = [...breadcrumbs, { label: title }]

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3 text-sm text-gray-500">
          <Menu className="h-4 w-4 shrink-0 text-gray-400 lg:hidden" aria-hidden />
          <nav aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-1.5">
              {trail.map((item, index) => (
                <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
                  {index > 0 ? <span className="text-gray-300">/</span> : null}
                  {item.href ? (
                    <Link href={item.href} className="hover:text-[#0052CC] hover:underline">
                      {item.label}
                    </Link>
                  ) : (
                    <span className={index === trail.length - 1 ? 'text-gray-700' : undefined}>
                      {item.label}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-10 lg:py-12">
        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_260px] lg:gap-12 xl:gap-16">
          <article className="min-w-0">
            <header className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight text-gray-900 md:text-[2rem] md:leading-tight">
                {title}
              </h1>
              {subtitle ? (
                <p className="mt-3 max-w-2xl text-base leading-relaxed text-gray-600">{subtitle}</p>
              ) : null}
            </header>

            {callout ? <div className="mb-8">{callout}</div> : null}

            <SupportAudienceSwitcher active="traveler" />
            <SupportHubLinks currentPath={currentPath} audience="traveler" variant="compact" className="mb-8" />

            {children}

            <LegalDocHelpfulFeedback articleSlug={articleSlug} />

            <div className="mt-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Still need help?</h2>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600">
                    Contact our team if you have questions about this policy or your account.
                  </p>
                  <Link
                    href="/contact"
                    className="mt-4 inline-block text-sm font-medium text-[#0052CC] hover:underline"
                  >
                    Customer service →
                  </Link>
                </div>
                <HelpCircle className="h-12 w-12 shrink-0 text-[#0052CC]/20" aria-hidden />
              </div>
            </div>

            {lastUpdated ? (
              <p className="mt-8 text-sm text-gray-500">Last updated: {lastUpdated}</p>
            ) : null}
          </article>

          <div className="mt-10 border-t border-gray-200 pt-8 lg:mt-0 lg:border-0 lg:pt-0">
            <LegalDocSidebar currentPath={currentPath} tableOfContents={tableOfContents} />
          </div>
        </div>
      </div>
    </div>
  )
}
