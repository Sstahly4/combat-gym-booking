import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { SupportAudienceSwitcher } from '@/components/help/support-audience-switcher'
import { PartnerHelpPanel } from '@/components/help/partner-help-panel'
import { SupportHubLinks } from '@/components/help/support-hub-links'
import { buildFaqLd } from '@/lib/seo/guide-schema'
import {
  PARTNER_HELP_CATEGORIES,
  PARTNER_HELP_FAQS,
  partnerHelpCategoryPath,
  type PartnerHelpCategoryId,
} from '@/lib/help/partner-help'

type PageProps = {
  params: Promise<{ category: string }>
}

const CATEGORY_META: Record<
  PartnerHelpCategoryId,
  { title: string; description: string }
> = {
  listings: {
    title: 'Listings & verification FAQ',
    description: 'How to publish, verify, and edit your gym listing on CombatStay.',
  },
  bookings: {
    title: 'Partner bookings FAQ',
    description: 'Accepting requests, guest stays, and damage reports for gym partners.',
  },
  payouts: {
    title: 'Partner payouts FAQ',
    description: 'How CombatStay pays gyms, payout methods, and verification.',
  },
  promotions: {
    title: 'Promotions FAQ',
    description: 'Create and manage discounts for your gym on CombatStay.',
  },
  account: {
    title: 'Partner account FAQ',
    description: 'Secure your Partner Hub account and owner login.',
  },
  support: {
    title: 'Partner support FAQ',
    description: 'How to reach CombatStay for gym owner help.',
  },
}

function isPartnerCategory(value: string): value is PartnerHelpCategoryId {
  return PARTNER_HELP_CATEGORIES.some((c) => c.id === value)
}

export function generateStaticParams() {
  return PARTNER_HELP_CATEGORIES.map((category) => ({ category: category.id }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category } = await params
  if (!isPartnerCategory(category)) return {}

  const meta = CATEGORY_META[category]
  const title = `${meta.title} | CombatStay`

  return {
    title,
    description: meta.description,
    alternates: {
      canonical: partnerHelpCategoryPath(category),
    },
    openGraph: {
      title,
      description: meta.description,
      type: 'website',
      url: partnerHelpCategoryPath(category),
    },
  }
}

export default async function OwnersHelpCategoryPage({ params }: PageProps) {
  const { category } = await params
  if (!isPartnerCategory(category)) {
    notFound()
  }

  const label = PARTNER_HELP_CATEGORIES.find((c) => c.id === category)?.label ?? category
  const meta = CATEGORY_META[category]
  const path = partnerHelpCategoryPath(category)
  const schemaItems = PARTNER_HELP_FAQS.filter((faq) => faq.category === category).map((faq) => ({
    q: faq.question,
    a: faq.answer,
  }))
  const faqLd = buildFaqLd(schemaItems)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({ ...faqLd, mainEntityOfPage: path }),
        }}
      />
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
                <li>
                  <Link href="/owners/help" className="hover:text-[#0052CC] hover:underline">
                    Partner help
                  </Link>
                </li>
                <li className="text-gray-300">/</li>
                <li className="text-gray-700">{label}</li>
              </ol>
            </nav>
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-4 py-12">
          <div className="mb-6">
            <h1 className="mb-2 text-3xl font-bold text-gray-900">{meta.title}</h1>
            <p className="max-w-2xl text-base text-gray-600">{meta.description}</p>
            <p className="mt-3 text-sm text-gray-500">
              <Link href="/owners/help" className="font-medium text-[#0052CC] hover:underline">
                View all partner topics
              </Link>
            </p>
          </div>

          <SupportAudienceSwitcher active="partner" />
          <SupportHubLinks currentPath={path} audience="partner" variant="compact" className="mb-8" />

          <PartnerHelpPanel initialCategory={category} />
        </div>
      </div>
    </>
  )
}
