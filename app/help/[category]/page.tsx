import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { SupportAudienceSwitcher } from '@/components/help/support-audience-switcher'
import { SupportHubLinks } from '@/components/help/support-hub-links'
import { FaqCategoryPanel } from '@/components/help/faq-category-panel'
import { FaqCategoryJsonLd } from '@/app/help/[category]/faq-category-json-ld'
import {
  FAQ_CATEGORY_BY_SLUG,
  FAQ_CATEGORY_SLUGS,
  helpCategoryPath,
  isFaqCategorySlug,
  type FaqCategorySlug,
} from '@/lib/help/faq-categories'
import { HELP_CENTER_FAQS } from '@/lib/help/help-center-faqs'

type PageProps = {
  params: Promise<{ category: string }>
}

export function generateStaticParams() {
  return FAQ_CATEGORY_SLUGS.map((category) => ({ category }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category } = await params
  if (!isFaqCategorySlug(category)) {
    return {}
  }

  const meta = FAQ_CATEGORY_BY_SLUG[category]
  return {
    title: meta.pageTitle,
    description: meta.description,
    alternates: {
      canonical: helpCategoryPath(category),
    },
    openGraph: {
      title: meta.pageTitle,
      description: meta.description,
      type: 'website',
      url: helpCategoryPath(category),
    },
    twitter: {
      card: 'summary',
      title: meta.pageTitle,
      description: meta.description,
    },
  }
}

function plainAnswerText(answer: string | unknown): string {
  return typeof answer === 'string' ? answer : ''
}

export default async function HelpCategoryPage({ params }: PageProps) {
  const { category } = await params
  if (!isFaqCategorySlug(category)) {
    notFound()
  }

  const meta = FAQ_CATEGORY_BY_SLUG[category]
  const categoryFaqs = HELP_CENTER_FAQS.filter((faq) => faq.category === category)
  const schemaItems = categoryFaqs
    .map((faq) => ({ q: faq.question, a: plainAnswerText(faq.answer) }))
    .filter((item) => item.a.length > 0)

  return (
    <>
      <FaqCategoryJsonLd items={schemaItems} path={helpCategoryPath(category)} />
      <div className="min-h-screen bg-white">
        <div className="border-b border-gray-200 bg-white">
          <div className="mx-auto max-w-6xl px-4 py-3 text-sm text-gray-500">
            <nav aria-label="Breadcrumb">
              <ol className="flex flex-wrap items-center gap-1.5">
                <li>
                  <Link href="/faq" className="hover:text-[#0052CC] hover:underline">
                    CombatStay Support
                  </Link>
                </li>
                <li className="text-gray-300">/</li>
                <li>
                  <Link href="/faq" className="hover:text-[#0052CC] hover:underline">
                    FAQ &amp; Help Center
                  </Link>
                </li>
                <li className="text-gray-300">/</li>
                <li className="text-gray-700">{meta.label}</li>
              </ol>
            </nav>
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-4 py-12">
          <div className="mb-6">
            <h1 className="mb-2 text-3xl font-bold text-gray-900">{meta.label} FAQ</h1>
            <p className="max-w-2xl text-base text-gray-600">{meta.description}</p>
            <p className="mt-3 text-sm text-gray-500">
              <Link href="/faq" className="font-medium text-[#0052CC] hover:underline">
                View all FAQ categories
              </Link>
            </p>
          </div>

          <SupportAudienceSwitcher active="traveler" />
          <SupportHubLinks
            currentPath={helpCategoryPath(category)}
            audience="traveler"
            variant="compact"
            className="mb-8"
          />

          <FaqCategoryPanel initialCategory={category as FaqCategorySlug} />
        </div>
      </div>
    </>
  )
}
