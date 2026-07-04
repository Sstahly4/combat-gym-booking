'use client'

import { SupportHubLinks } from '@/components/help/support-hub-links'
import { FaqCategoryPanel } from '@/components/help/faq-category-panel'

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

        <FaqCategoryPanel hubMode initialCategory="payments" />

        <SupportHubLinks currentPath="/faq" audience="traveler" variant="compact" className="mt-10" />
      </div>
    </div>
  )
}
