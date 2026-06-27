import Link from 'next/link'
import { SupportAudienceSwitcher } from '@/components/help/support-audience-switcher'
import { PartnerHelpPanel } from '@/components/help/partner-help-panel'
import { SupportHubLinks } from '@/components/help/support-hub-links'
import { PartnerHelpJsonLd } from '@/app/owners/help/partner-help-json-ld'
import {
  PARTNER_HELP_CATEGORIES,
  partnerHelpCategoryPath,
} from '@/lib/help/partner-help'

export default function OwnersHelpPage() {
  return (
    <>
      <PartnerHelpJsonLd path="/owners/help" />
      <div className="min-h-screen bg-white">
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-3 text-sm text-gray-500">
          <nav aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-1.5">
              <li>
                <Link href="/owners" className="hover:text-[#0052CC] hover:underline">
                  For gyms
                </Link>
              </li>
              <li className="text-gray-300">/</li>
              <li className="text-gray-700">Partner help</li>
            </ol>
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="mb-6">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">Partner Help &amp; FAQ</h1>
          <p className="max-w-2xl text-base text-gray-600">
            Answers for gym owners on listings, bookings, payouts, and promotions — separate from
            traveler booking help.
          </p>
          <p className="mt-3 text-sm text-gray-500">
            Already signed in?{' '}
            <Link href="/manage/help" className="font-medium text-[#0052CC] hover:underline">
              Open help inside the Partner Hub
            </Link>
            .
          </p>
        </div>

        <SupportAudienceSwitcher active="partner" />
        <SupportHubLinks currentPath="/owners/help" audience="partner" />

        <nav aria-label="Partner help topics" className="mb-8">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
            Browse by topic
          </p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {PARTNER_HELP_CATEGORIES.map((category) => (
              <li key={category.id}>
                <Link
                  href={partnerHelpCategoryPath(category.id)}
                  className="inline-block rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 transition-colors hover:border-[#0052CC]/30 hover:text-[#0052CC]"
                >
                  {category.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <PartnerHelpPanel hubMode initialCategory="listings" />
      </div>
    </div>
    </>
  )
}
