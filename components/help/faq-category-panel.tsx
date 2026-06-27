'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChevronDown, HelpCircle, Shield, Dumbbell, FileText, Banknote } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  FAQ_CATEGORIES,
  helpCategoryPath,
  type FaqCategorySlug,
} from '@/lib/help/faq-categories'
import { FAQ_INLINE_LINK, HELP_CENTER_FAQS } from '@/lib/help/help-center-faqs'

const CATEGORY_ICONS: Record<FaqCategorySlug, LucideIcon> = {
  safety: Shield,
  bookings: FileText,
  payments: Banknote,
  gyms: Dumbbell,
  general: HelpCircle,
}

type FaqCategoryPanelProps = {
  initialCategory?: FaqCategorySlug
  /** When set, category nav uses buttons instead of links (main /faq hub). */
  hubMode?: boolean
}

export function FaqCategoryPanel({
  initialCategory = 'payments',
  hubMode = false,
}: FaqCategoryPanelProps) {
  const pathname = usePathname()
  const [selectedCategory, setSelectedCategory] = useState<FaqCategorySlug>(initialCategory)
  const [openItems, setOpenItems] = useState<Set<string>>(new Set())

  useEffect(() => {
    setSelectedCategory(initialCategory)
  }, [initialCategory])

  const toggleItem = (id: string) => {
    setOpenItems((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  useEffect(() => {
    const applyHash = () => {
      if (typeof window === 'undefined') return
      const raw = window.location.hash.replace(/^#/, '')
      if (!raw.startsWith('faq-')) return
      const faqId = raw.slice(4)
      const entry = HELP_CENTER_FAQS.find((f) => f.id === faqId)
      if (entry) setSelectedCategory(entry.category)
      setOpenItems((prev) => {
        const next = new Set(prev)
        next.add(faqId)
        return next
      })
      window.requestAnimationFrame(() => {
        document.getElementById(raw)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      })
    }
    applyHash()
    window.addEventListener('hashchange', applyHash)
    return () => window.removeEventListener('hashchange', applyHash)
  }, [])

  const filteredFAQs = HELP_CENTER_FAQS.filter((faq) => faq.category === selectedCategory)

  return (
    <div className="grid gap-6 md:grid-cols-4">
      <div className="md:col-span-1">
        <Card className="sticky top-6 rounded-lg border border-gray-200 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-gray-900">Categories</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {FAQ_CATEGORIES.map((category) => {
              const Icon = CATEGORY_ICONS[category.id]
              const count = HELP_CENTER_FAQS.filter((f) => f.category === category.id).length
              const href = helpCategoryPath(category.slug)
              const isActive = hubMode
                ? selectedCategory === category.id
                : pathname === href

              const className = `flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors ${
                isActive ? 'bg-[#003580] text-white' : 'text-gray-700 hover:bg-gray-50'
              }`

              const inner = (
                <>
                  <Icon className="h-5 w-5 shrink-0" />
                  <div className="flex-1">
                    <div className="text-sm font-medium">{category.label}</div>
                    <div
                      className={`text-xs ${isActive ? 'text-blue-100' : 'text-gray-500'}`}
                    >
                      {count} questions
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
        <div className="space-y-4">
          {filteredFAQs.map((faq) => (
            <Card
              key={faq.id}
              id={`faq-${faq.id}`}
              className="scroll-mt-24 rounded-lg border border-gray-200 shadow-sm"
            >
              <CardHeader
                className="cursor-pointer pb-4 transition-colors hover:bg-gray-50"
                onClick={() => toggleItem(faq.id)}
              >
                <div className="flex items-start justify-between gap-4">
                  <CardTitle className="pr-8 text-base font-semibold text-gray-900">
                    {faq.question}
                  </CardTitle>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 text-gray-400 transition-transform ${
                      openItems.has(faq.id) ? 'rotate-180' : ''
                    }`}
                  />
                </div>
              </CardHeader>
              {openItems.has(faq.id) ? (
                <CardContent className="pt-0 pb-6">
                  {typeof faq.answer === 'string' ? (
                    <p className="text-sm leading-relaxed whitespace-pre-line text-gray-600">
                      {faq.answer}
                    </p>
                  ) : (
                    <div className="text-sm leading-relaxed text-gray-600">{faq.answer}</div>
                  )}
                </CardContent>
              ) : null}
            </Card>
          ))}
        </div>

        <div className="mt-8 border-t border-gray-200 pt-6">
          <p className="text-xs leading-relaxed text-gray-500">
            <strong className="text-gray-600">Disclaimer:</strong> CombatStay.com is a booking
            platform that facilitates connections between users and training facilities. We do not
            operate, control, or manage any gym facilities. Participation in combat sports training
            involves inherent risks. You participate at your own risk. Please review our{' '}
            <Link href="/terms" className="text-[#003580] hover:underline">
              Terms &amp; Conditions
            </Link>{' '}
            for complete details.
          </p>
        </div>

        <Card className="mt-6 rounded-lg border border-[#003580] bg-white shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-6">
              <div>
                <h3 className="mb-2 text-lg font-semibold text-gray-900">Still need help?</h3>
                <p className="mb-4 text-sm text-gray-600">
                  Tell us what you need — we reply faster when you add your booking reference.
                </p>
                <Link href="/contact" className={`text-sm ${FAQ_INLINE_LINK}`}>
                  Customer service →
                </Link>
              </div>
              <HelpCircle className="h-12 w-12 shrink-0 text-[#003580] opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
