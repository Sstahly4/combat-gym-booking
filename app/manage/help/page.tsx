'use client'

import Link from 'next/link'
import { PartnerHelpPanel } from '@/components/help/partner-help-panel'
import { SupportHubLinks } from '@/components/help/support-hub-links'

export default function ManageHelpPage() {
  return (
    <div className="min-h-0 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6 sm:py-8">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
          Partner Help Center
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Quick answers for gym owners — listings, bookings, payouts, and promotions.
        </p>
        <p className="mt-2 text-sm text-gray-500">
          Shareable public version:{' '}
          <Link
            href="/owners/help"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-[#003580] underline underline-offset-2 hover:text-[#002a66]"
          >
            Partner FAQ on combatstay.com
          </Link>
          .
        </p>

        <SupportHubLinks
          currentPath="/manage/help"
          audience="partner"
          variant="compact"
          className="mt-6"
        />

        <div className="mt-6">
          <PartnerHelpPanel hubMode initialCategory="listings" showTravelerLink />
        </div>
      </div>
    </div>
  )
}
