'use client'

import Link from 'next/link'
import { SupportAudienceSwitcher } from '@/components/help/support-audience-switcher'
import { SupportHubLinks } from '@/components/help/support-hub-links'
import { FaqCategoryPanel } from '@/components/help/faq-category-panel'
import { FAQ_CATEGORIES, helpCategoryPath } from '@/lib/help/faq-categories'

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="mb-6">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">FAQ &amp; Help Center</h1>
          <p className="text-base text-gray-600">
            Frequently asked questions on bookings, payments, gyms, and safety — plus links to our
            policies and customer service.
          </p>
        </div>

        <SupportAudienceSwitcher active="traveler" />
        <SupportHubLinks currentPath="/faq" audience="traveler" />

        <nav aria-label="FAQ topics" className="mb-8">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
            Browse by topic
          </p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {FAQ_CATEGORIES.map((category) => (
              <li key={category.slug}>
                <Link
                  href={helpCategoryPath(category.slug)}
                  className="inline-block rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 transition-colors hover:border-[#0052CC]/30 hover:text-[#0052CC]"
                >
                  {category.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <FaqCategoryPanel hubMode initialCategory="payments" />
      </div>
    </div>
  )
}
