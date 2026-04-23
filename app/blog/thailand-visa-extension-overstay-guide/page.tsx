import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { ArticleShell } from '@/components/guides/article-shell'
import { RelatedGuides } from '@/components/guides/related-guides'
import {
  GuideAccentIntro,
  GuideFaqList,
  GuideHero,
  GuideLeadRow,
  GuideSection,
  GuideThreeCards,
  GuideCtaStrip,
} from '@/components/guides/guide-page-blocks'
import { buildArticleLd, buildBreadcrumbLd, buildFaqLd } from '@/lib/seo/guide-schema'
import { FileWarning, ShieldCheck, Timer } from 'lucide-react'

const TITLE = 'Thailand Visa Extension & Overstay Guide (2026)'
const PATH = '/blog/thailand-visa-extension-overstay-guide'
const DATE_PUBLISHED = '2025-10-15'
const DATE_MODIFIED = '2026-04-20'
const HERO_IMAGE = 'https://upload.wikimedia.org/wikipedia/commons/8/82/Thai_Visa_on_Arrival.jpg'
const DESCRIPTION =
  'A practical 2026 guide to Thailand visa extensions and overstay risk for long-stay training travelers: mindset, checklists, official links, and common mistakes.'

export const metadata: Metadata = {
  title: `${TITLE} | CombatStay`,
  description: DESCRIPTION,
  alternates: { canonical: PATH },
  openGraph: { title: `${TITLE} | CombatStay`, description: DESCRIPTION, type: 'article' },
  twitter: { card: 'summary_large_image', title: `${TITLE} | CombatStay`, description: DESCRIPTION },
}

const FAQ_ITEMS = [
  {
    q: 'How much is a Thailand visa extension?',
    a: 'Fees vary by visa type and policy, but many common extensions are paid at immigration offices. Always confirm the current fee and requirements with official sources before you go.',
  },
  {
    q: 'What is the TM.7 form?',
    a: 'TM.7 is an application form commonly used for extensions of temporary stay. Requirements and supporting documents depend on your visa class and current policy.',
  },
  {
    q: 'What happens if I overstay in Thailand?',
    a: 'Overstay can involve fines and more serious consequences depending on duration and circumstances. Do not treat overstay as “just a fee”—use official sources and fix status before it becomes a bigger problem.',
  },
  {
    q: 'Is this legal advice?',
    a: 'No. This is an editorial planning guide for travelers. Immigration rules change; verify with Thai authorities and your embassy/consulate.',
  },
  {
    q: 'Where do I extend my stay in Thailand?',
    a: 'Extensions are typically handled at immigration offices. The exact office, documents, and steps can vary by location and visa type—use official Immigration Bureau information and confirm requirements before you go.',
  },
  {
    q: 'How early should I apply for an extension?',
    a: 'Earlier is safer. Build buffer days so you are not forced into last-minute decisions. Rules and queues vary—treat timing as a key part of your plan.',
  },
  {
    q: 'Should I book non-refundable camps before my status is clear?',
    a: 'That’s a risk decision. Many long-stay travelers prefer flexible bookings until they confirm the latest official requirements and their timeline.',
  },
]

export default function ThailandVisaExtensionOverstayGuidePage() {
  const articleLd = buildArticleLd({
    title: TITLE,
    description: DESCRIPTION,
    path: PATH,
    datePublished: DATE_PUBLISHED,
    dateModified: DATE_MODIFIED,
    imagePath: HERO_IMAGE,
  })
  const faqLd = buildFaqLd(FAQ_ITEMS)
  const breadcrumbLd = buildBreadcrumbLd([
    { name: 'Home', path: '/' },
    { name: 'Training Guides', path: '/blog' },
    { name: 'Thailand', path: '/search?country=Thailand' },
    { name: TITLE, path: PATH },
  ])

  return (
    <ArticleShell
      title={TITLE}
      subtitle="Built for long-stay fighters and travelers who need a reliable planning framework—plus official links—before they commit to a month-long camp."
      breadcrumbs={[
        { label: 'Training Guides', href: '/blog' },
        { label: 'Thailand', href: '/search?country=Thailand' },
        { label: 'Visa planning', href: '/blog/thailand-training-visa-dtv' },
      ]}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <GuideHero
        imageSrc={HERO_IMAGE}
        imageAlt="Thailand visa page visual"
        priority
        overlayText="Extensions and overstays can ruin a training trip. Use a checklist, act early, and verify everything with official sources."
      />

      <GuideLeadRow
        tocItems={[
          { href: '#mindset', label: 'Mindset' },
          { href: '#extension', label: 'Extensions' },
          { href: '#overstay', label: 'Overstay risk' },
          { href: '#official', label: 'Official links' },
          { href: '#faq', label: 'FAQ' },
        ]}
      />

      <section id="mindset" className="mb-14 scroll-mt-24">
        <GuideAccentIntro icon={Timer} title="The long-stay mindset: act early" subtitle="Most problems are timing problems" />
        <div className="prose prose-gray max-w-none space-y-4 text-base leading-relaxed text-gray-800 md:prose-lg">
          <p>
            People search <strong>Thailand visa extension</strong> when they’re already under stress. The best time to plan
            is earlier—before you book a month-long camp and before your permitted stay window gets tight.
          </p>
          <p>
            This page is intentionally practical: it gives you a framework, a checklist, and links to official sources. It
            does <em>not</em> replace professional or official guidance.
          </p>
        </div>
      </section>

      <GuideSection id="extension" variant="slate" className="mb-14">
        <h2 className="mb-6 text-2xl font-bold text-gray-900 md:text-3xl">Visa extensions: what travelers usually do</h2>
        <GuideThreeCards
          items={[
            {
              title: 'Gather documents',
              body: 'Passport copies, photos, proof of address, and whatever your current visa class requires. Requirements differ by policy and passport.',
            },
            {
              title: 'Submit early',
              body: 'Waiting until the last moment increases risk. Build buffer days before your permitted stay ends.',
            },
            {
              title: 'Keep receipts',
              body: 'For long stays, keep a folder of paperwork, confirmation pages, and official links so you can respond quickly.',
            },
          ]}
        />
        <figure className="mt-10 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="relative aspect-[21/9] w-full">
            <Image
              src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Thailand_passport_stamp.jpg"
              alt="Thailand passport stamp reference"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 1152px"
            />
          </div>
          <figcaption className="px-4 py-3 text-xs text-gray-600">
            Wikimedia Commons passport stamp photo. Visual reference only—rules depend on your passport and current policy.
          </figcaption>
        </figure>
      </GuideSection>

      <GuideSection id="overstay" variant="amber" className="mb-14">
        <h2 className="mb-4 text-2xl font-bold text-gray-900 md:text-3xl">Overstay: why “just paying the fine” is a trap</h2>
        <div className="max-w-4xl space-y-4 text-base leading-relaxed text-gray-800">
          <p>
            Overstay discussions online often focus on the fine. That’s incomplete. The real risk is what happens if you
            run into enforcement or travel disruptions. Treat overstay as a “failure mode” you want to avoid, not a planned
            strategy.
          </p>
          <p>
            For training travelers, the impact is bigger: overstays can break your itinerary, cancel bookings, and complicate
            future entries. Build buffer days and verify current rules.
          </p>
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-amber-200/80 bg-white/80 p-5 text-sm text-gray-800 shadow-sm">
            <FileWarning className="mt-0.5 h-5 w-5 shrink-0 text-[#003580]" aria-hidden />
            <p>
              If you’re close to a deadline, prioritize official guidance and in-person clarification. Internet advice can be
              outdated within weeks.
            </p>
          </div>
        </div>
      </GuideSection>

      <GuideSection id="official" variant="brand" className="mb-14">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-8">
          <ShieldCheck className="h-10 w-10 shrink-0 text-[#003580]" aria-hidden />
          <div>
            <h2 className="text-2xl font-bold text-gray-900 md:text-3xl">Official sources (bookmark these)</h2>
            <p className="mt-3 text-base leading-relaxed text-gray-700">
              Always verify the latest extension rules, forms, and fees using official sources right before you act.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <a
                href="https://www.immigration.go.th/"
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="rounded-xl border border-[#003580]/15 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <p className="text-sm font-semibold text-gray-900">Thai Immigration Bureau</p>
                <p className="mt-1 text-xs text-gray-600">Official notices, offices, and processes.</p>
                <p className="mt-3 text-xs font-semibold text-[#003580]">Open →</p>
              </a>
              <a
                href="https://www.thaievisa.go.th/"
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="rounded-xl border border-[#003580]/15 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <p className="text-sm font-semibold text-gray-900">Thailand e‑Visa</p>
                <p className="mt-1 text-xs text-gray-600">Portal for applicable visa types and checklists.</p>
                <p className="mt-3 text-xs font-semibold text-[#003580]">Open →</p>
              </a>
              <a
                href="https://www.mfa.go.th/"
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="rounded-xl border border-[#003580]/15 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <p className="text-sm font-semibold text-gray-900">Ministry of Foreign Affairs (MFA)</p>
                <p className="mt-1 text-xs text-gray-600">Official policy announcements and government info.</p>
                <p className="mt-3 text-xs font-semibold text-[#003580]">Open →</p>
              </a>
              <a
                href="https://www.mfa.go.th/en/page/thai-embassies-and-consulates"
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="rounded-xl border border-[#003580]/15 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <p className="text-sm font-semibold text-gray-900">Thai embassies & consulates</p>
                <p className="mt-1 text-xs text-gray-600">Country-specific requirements and processing rules.</p>
                <p className="mt-3 text-xs font-semibold text-[#003580]">Open →</p>
              </a>
            </div>
          </div>
        </div>
      </GuideSection>

      <GuideCtaStrip
        variant="light"
        title="Pick your camp after your stay plan is clear"
        subtitle="Browse verified Thailand gyms once you know your dates."
        href="/search?country=Thailand"
        buttonLabel="Browse Thailand gyms"
      />

      <GuideSection id="faq" variant="default" className="mb-14 border border-gray-200 bg-white p-6 md:p-10">
        <h2 className="mb-2 text-2xl font-bold text-gray-900 md:text-3xl">FAQ</h2>
        <p className="mb-8 text-gray-600">Common questions around extensions and overstays.</p>
        <GuideFaqList items={FAQ_ITEMS} />
      </GuideSection>

      <p className="mb-14 rounded-lg border border-gray-200 bg-gray-50 p-5 text-sm text-gray-700">
        <strong>Disclaimer:</strong> This guide is for general information only and does not constitute legal advice.
        Immigration policy changes; always verify with official government sources and qualified professionals.
      </p>

      <RelatedGuides
        guides={[
          { title: 'Thailand training visa / DTV guide', href: '/blog/thailand-training-visa-dtv' },
          { title: '25 best Muay Thai camps in Thailand (2026)', href: '/blog/best-muay-thai-camps-thailand-2026' },
          { title: 'Best MMA camps in Thailand', href: '/blog/best-mma-camps-thailand' },
          { title: 'Training guides hub', href: '/blog' },
        ]}
      />
    </ArticleShell>
  )
}

