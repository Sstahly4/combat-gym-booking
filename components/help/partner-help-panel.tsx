'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BadgeCheck,
  CalendarRange,
  ChevronDown,
  HelpCircle,
  ShieldCheck,
  Tag,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import {
  PARTNER_HELP_CATEGORIES,
  PARTNER_HELP_FAQS,
  partnerHelpCategoryPath,
  type PartnerHelpCategoryId,
} from '@/lib/help/partner-help'

const CATEGORY_ICONS: Record<PartnerHelpCategoryId, LucideIcon> = {
  listings: BadgeCheck,
  bookings: CalendarRange,
  payouts: Wallet,
  promotions: Tag,
  account: ShieldCheck,
  support: HelpCircle,
}

type PartnerHelpPanelProps = {
  initialCategory?: PartnerHelpCategoryId
  /** Category sidebar uses in-page buttons (dashboard / main hub). */
  hubMode?: boolean
  /** Show cross-link to the other audience help center. */
  showTravelerLink?: boolean
}

export function PartnerHelpPanel({
  initialCategory = 'listings',
  hubMode = false,
  showTravelerLink = true,
}: PartnerHelpPanelProps) {
  const pathname = usePathname()
  const [selectedCategory, setSelectedCategory] = useState<PartnerHelpCategoryId>(initialCategory)
  const [openId, setOpenId] = useState<string | null>(PARTNER_HELP_FAQS[0]?.id ?? null)

  useEffect(() => {
    setSelectedCategory(initialCategory)
  }, [initialCategory])

  useEffect(() => {
    const applyHash = () => {
      if (typeof window === 'undefined') return
      const raw = window.location.hash.replace(/^#/, '')
      if (!raw.startsWith('partner-')) return
      const faqId = raw.slice('partner-'.length)
      const entry = PARTNER_HELP_FAQS.find((f) => f.id === faqId)
      if (entry) {
        setSelectedCategory(entry.category)
        setOpenId(faqId)
      }
      window.requestAnimationFrame(() => {
        document.getElementById(raw)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      })
    }
    applyHash()
    window.addEventListener('hashchange', applyHash)
    return () => window.removeEventListener('hashchange', applyHash)
  }, [])

  const filtered = PARTNER_HELP_FAQS.filter((faq) => faq.category === selectedCategory)

  return (
    <div className="grid gap-6 md:grid-cols-4">
      <div className="md:col-span-1">
        <Card className="sticky top-6 rounded-lg border border-gray-200 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-gray-900">Topics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {PARTNER_HELP_CATEGORIES.map((category) => {
              const Icon = CATEGORY_ICONS[category.id]
              const count = PARTNER_HELP_FAQS.filter((f) => f.category === category.id).length
              const href = partnerHelpCategoryPath(category.id)
              const isActive = hubMode
                ? selectedCategory === category.id
                : pathname === href

              const className = cn(
                'flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors',
                isActive ? 'bg-[#003580] text-white' : 'text-gray-700 hover:bg-gray-50',
              )

              const inner = (
                <>
                  <Icon className="h-5 w-5 shrink-0" />
                  <div className="flex-1">
                    <div className="text-sm font-medium">{category.label}</div>
                    <div className={cn('text-xs', isActive ? 'text-blue-100' : 'text-gray-500')}>
                      {count} {count === 1 ? 'answer' : 'answers'}
                    </div>
                  </div>
                </>
              )

              if (hubMode) {
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setSelectedCategory(category.id)}
                    className={className}
                  >
                    {inner}
                  </button>
                )
              }

              return (
                <Link key={category.id} href={href} className={className}>
                  {inner}
                </Link>
              )
            })}
          </CardContent>
        </Card>
      </div>

      <div className="md:col-span-3">
        <div className="space-y-2 rounded-lg border border-gray-200 bg-white shadow-sm">
          {filtered.map((item) => {
            const open = openId === item.id
            return (
              <div
                key={item.id}
                id={`partner-${item.id}`}
                className="scroll-mt-24 border-b border-gray-100 last:border-0"
              >
                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : item.id)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left text-sm font-medium text-gray-900 transition hover:bg-slate-50/80"
                  aria-expanded={open}
                >
                  {item.question}
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 shrink-0 text-gray-400 transition-transform',
                      open && 'rotate-180',
                    )}
                    aria-hidden
                  />
                </button>
                {open ? (
                  <div className="border-t border-gray-100 bg-slate-50/40 px-4 pb-4">
                    <p className="pt-3 text-sm leading-relaxed text-gray-600">{item.answer}</p>
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>

        {showTravelerLink ? (
          <p className="mt-6 text-sm text-gray-500">
            Looking for traveler policies, guest cancellations, and booking terms?{' '}
            <Link href="/faq" className="font-medium text-[#0052CC] hover:underline">
              Open traveler FAQ &amp; Help Center
            </Link>
            .
          </p>
        ) : null}

        <div className="mt-4 rounded-lg border border-gray-200 bg-slate-50/60 p-4 text-sm text-gray-600">
          <p className="font-medium text-gray-900">Need partner support?</p>
          <p className="mt-1">
            <Link href="/contact?intent=partner" className="font-medium text-[#0052CC] hover:underline">
              Contact partner support
            </Link>{' '}
            with your gym name and the email on your Partner Hub account.
          </p>
        </div>
      </div>
    </div>
  )
}
