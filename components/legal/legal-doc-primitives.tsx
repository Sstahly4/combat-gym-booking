import type { ReactNode } from 'react'
import Link from 'next/link'
import { Info } from 'lucide-react'

export const legalDocLinkClass =
  'font-medium text-[#0052CC] underline-offset-2 hover:underline'

export function LegalDocLink({
  href,
  children,
  external,
}: {
  href: string
  children: ReactNode
  external?: boolean
}) {
  if (external || href.startsWith('http') || href.startsWith('mailto:')) {
    return (
      <a
        href={href}
        className={legalDocLinkClass}
        target={href.startsWith('mailto:') ? undefined : '_blank'}
        rel={href.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
      >
        {children}
      </a>
    )
  }

  return (
    <Link href={href} className={legalDocLinkClass}>
      {children}
    </Link>
  )
}

export function LegalDocSection({
  id,
  title,
  children,
  className,
}: {
  id: string
  title: string
  children: ReactNode
  className?: string
}) {
  return (
    <section id={id} className={`scroll-mt-28 ${className ?? ''}`}>
      <h2 className="text-lg font-semibold text-gray-900 mb-3">{title}</h2>
      <div className="space-y-3 text-[15px] leading-relaxed text-gray-700">{children}</div>
    </section>
  )
}

export function LegalDocSubheading({ children }: { children: ReactNode }) {
  return <h3 className="text-base font-medium text-gray-900 mt-4 mb-2">{children}</h3>
}

export function LegalDocList({
  ordered,
  children,
}: {
  ordered?: boolean
  children: ReactNode
}) {
  const Tag = ordered ? 'ol' : 'ul'
  const listClass = ordered
    ? 'list-decimal pl-5 space-y-2'
    : 'list-disc pl-5 space-y-2'

  return <Tag className={listClass}>{children}</Tag>
}

export function LegalDocCallout({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <div className="flex gap-3 rounded-lg border border-[#0052CC]/15 bg-[#E9F2FF] px-4 py-4 text-[15px] leading-relaxed text-gray-800">
      <Info className="mt-0.5 h-5 w-5 shrink-0 text-[#0052CC]" aria-hidden />
      <div>
        <p className="font-semibold text-gray-900">{title}</p>
        <div className="mt-1 text-gray-700">{children}</div>
      </div>
    </div>
  )
}

export function LegalDocBody({ children }: { children: ReactNode }) {
  return <div className="space-y-8">{children}</div>
}
