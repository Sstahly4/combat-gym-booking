import type { ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'

export type GuideTocItem = { href: string; label: string }

/** Full-width hero image with gradient overlay and optional bottom text */
export function GuideHero({
  imageSrc,
  imageAlt,
  overlayText,
  priority = false,
  aspectClass = 'aspect-[21/9] min-h-[180px] md:aspect-[3/1]',
}: {
  imageSrc: string
  imageAlt: string
  overlayText?: string
  priority?: boolean
  aspectClass?: string
}) {
  return (
    <div className="relative mb-10 overflow-hidden rounded-2xl border border-gray-200 shadow-sm">
      <div className={`relative w-full bg-gray-900 ${aspectClass}`}>
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          priority={priority}
          className="object-cover opacity-90"
          sizes="(max-width: 768px) 100vw, 1152px"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent" />
        {overlayText && (
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
            <p className="max-w-3xl text-lg font-medium text-white md:text-xl leading-snug">{overlayText}</p>
          </div>
        )}
      </div>
    </div>
  )
}

/** Jump links + optional stat card */
export function GuideLeadRow({
  tocItems,
  statValue,
  statDescription,
  statIcon,
}: {
  tocItems: GuideTocItem[]
  statValue?: string | number
  statDescription?: string
  statIcon?: ReactNode
}) {
  return (
    <div className="mb-12 grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#003580]">On this page</h2>
        <nav className="flex flex-col gap-2 text-sm text-gray-700 sm:flex-row sm:flex-wrap sm:gap-x-6 sm:gap-y-2">
          {tocItems.map((item) => (
            <a key={item.href} href={item.href} className="hover:text-[#003580] hover:underline transition-colors">
              {item.label}
            </a>
          ))}
        </nav>
      </div>
      {statValue != null && statDescription && (
        <div className="rounded-xl border border-[#003580]/20 bg-gradient-to-br from-[#003580]/5 to-[#006ce4]/10 p-6">
          {statIcon && <div className="mb-2 text-[#003580]">{statIcon}</div>}
          <p className="text-3xl font-bold text-gray-900">{statValue}</p>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">{statDescription}</p>
        </div>
      )}
    </div>
  )
}

/** H2 with optional eyebrow and anchor id */
export function GuideH2({
  id,
  eyebrow,
  children,
  className = '',
}: {
  id?: string
  eyebrow?: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`scroll-mt-24 ${className}`}>
      {id && <span id={id} className="sr-only" />}
      {eyebrow && <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#003580]">{eyebrow}</p>}
      <h2 className="text-2xl font-bold text-gray-900 md:text-3xl">{children}</h2>
    </div>
  )
}

const sectionVariants = {
  default: 'border-gray-200 bg-white',
  slate: 'border-transparent bg-slate-50',
  amber: 'border-amber-100 bg-amber-50/80',
  brand: 'border-[#003580]/15 bg-gradient-to-br from-[#003580]/5 to-transparent',
} as const

export function GuideSection({
  id,
  variant = 'default',
  padding = 'p-6 md:p-10',
  rounded = 'rounded-2xl',
  border = true,
  className = '',
  children,
}: {
  id?: string
  variant?: keyof typeof sectionVariants
  padding?: string
  rounded?: string
  border?: boolean
  className?: string
  children: ReactNode
}) {
  return (
    <section
      id={id}
      className={`scroll-mt-24 ${rounded} ${padding} ${border ? 'border' : ''} ${sectionVariants[variant]} ${className}`}
    >
      {children}
    </section>
  )
}

/** Left accent border + optional icon */
export function GuideAccentIntro({
  icon: Icon,
  title,
  subtitle,
}: {
  icon?: LucideIcon
  title: string
  subtitle?: string
}) {
  return (
    <div className="mb-6 flex items-start gap-4 border-l-4 border-[#003580] pl-5">
      {Icon && <Icon className="mt-1 h-6 w-6 shrink-0 text-[#003580]" aria-hidden />}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 md:text-3xl">{title}</h2>
        {subtitle && <p className="mt-2 text-sm font-medium text-gray-500">{subtitle}</p>}
      </div>
    </div>
  )
}

/** Three equal cards (regions, pillars, etc.) */
export function GuideThreeCards({
  items,
}: {
  items: Array<{ title: string; body: ReactNode }>
}) {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {items.map((item) => (
        <div key={item.title} className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
          <h3 className="mb-2 text-lg font-semibold text-gray-900">{item.title}</h3>
          <div className="text-sm leading-relaxed text-gray-700">{item.body}</div>
        </div>
      ))}
    </div>
  )
}

/** Full-width CTA */
export function GuideCtaStrip({
  title,
  subtitle,
  href,
  buttonLabel,
  variant = 'dark',
}: {
  title: string
  subtitle?: string
  href: string
  buttonLabel: string
  variant?: 'dark' | 'light'
}) {
  const isDark = variant === 'dark'
  return (
    <div
      className={`mb-12 flex flex-col items-center justify-between gap-4 rounded-xl px-6 py-8 text-center md:flex-row md:text-left ${
        isDark ? 'bg-[#003580] text-white' : 'border border-gray-200 bg-gray-50 text-gray-900'
      }`}
    >
      <div>
        <p className={`text-lg font-semibold ${isDark ? '' : 'text-gray-900'}`}>{title}</p>
        {subtitle && <p className={`mt-1 text-sm ${isDark ? 'text-white/90' : 'text-gray-600'}`}>{subtitle}</p>}
      </div>
      <Link
        href={href}
        className={`inline-flex shrink-0 items-center justify-center rounded-lg px-6 py-3 text-sm font-semibold transition-colors ${
          isDark
            ? 'bg-white text-[#003580] hover:bg-gray-100'
            : 'bg-[#003580] text-white hover:bg-[#003580]/90'
        }`}
      >
        {buttonLabel}
      </Link>
    </div>
  )
}

/** Check / feature grid */
export function GuideFeatureGrid({
  items,
}: {
  items: Array<{ icon?: ReactNode; title: string; text: string }>
}) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <li key={item.title} className="flex gap-3 rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
          {item.icon && <span className="mt-0.5 shrink-0">{item.icon}</span>}
          <span className="text-sm text-gray-700">
            <strong className="text-gray-900">{item.title}</strong> — {item.text}
          </span>
        </li>
      ))}
    </ul>
  )
}

/** FAQ list with card styling */
export function GuideFaqList({ items }: { items: Array<{ q: string; a: string }> }) {
  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div
          key={item.q}
          className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
        >
          <h3 className="text-lg font-semibold text-gray-900">{item.q}</h3>
          <p className="mt-3 text-sm leading-relaxed text-gray-700">{item.a}</p>
        </div>
      ))}
    </div>
  )
}
