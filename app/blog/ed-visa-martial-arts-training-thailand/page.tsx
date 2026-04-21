import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { ArticleShell } from '@/components/guides/article-shell'
import { RelatedGuides } from '@/components/guides/related-guides'
import {
  GuideAccentIntro,
  GuideCtaStrip,
  GuideFaqList,
  GuideHero,
  GuideLeadRow,
  GuideSection,
  GuideThreeCards,
} from '@/components/guides/guide-page-blocks'
import { buildArticleLd, buildBreadcrumbLd, buildFaqLd } from '@/lib/seo/guide-schema'
import { FileText, GraduationCap, ShieldCheck } from 'lucide-react'

const TITLE = 'Visas for Martial Arts Training in Thailand: Ed Visa & Alternatives (2026)'
const SEO_TITLE = 'Thailand Martial Arts Ed Visa 2026 [Training Visa Guide]'
const PATH = '/blog/ed-visa-martial-arts-training-thailand'
const DATE_PUBLISHED = '2026-04-21'
const DATE_MODIFIED = '2026-04-21'
const HERO_IMAGE = '/highquality-world-map-vector-art_1112614-9909.jpg'
const DESCRIPTION =
  'How martial arts travelers use the Thailand Education (Ed) visa, DTV, and tourist options for long Muay Thai, BJJ, and MMA training trips. Not legal advice—a structured planning framework.'

export const metadata: Metadata = {
  title: `${SEO_TITLE} | Combatbooking`,
  description: DESCRIPTION,
  alternates: { canonical: PATH },
  openGraph: { title: `${SEO_TITLE} | Combatbooking`, description: DESCRIPTION, type: 'article' },
  twitter: { card: 'summary_large_image', title: `${SEO_TITLE} | Combatbooking`, description: DESCRIPTION },
}

const FAQ_ITEMS = [
  {
    q: 'Is there a specific Thailand Muay Thai visa?',
    a: 'There is no single dedicated &ldquo;Muay Thai visa&rdquo; for all nationalities. Martial arts travelers typically use one of: short-stay tourist entry, a Non-Immigrant Education (ED) visa tied to a recognized training institution, or the newer DTV (Destination Thailand Visa). Eligibility varies by passport—always verify with your embassy and Thai immigration.',
  },
  {
    q: 'What is the Ed visa and who is it for?',
    a: 'The Non-Immigrant ED visa is issued for educational purposes at schools, universities, or institutions recognized by Thai authorities. Some Muay Thai camps and martial arts schools partner with recognized educational institutions or sport organizations to sponsor training students—rules and processes differ by camp and by nationality.',
  },
  {
    q: 'How long can you stay on a Thailand Ed visa?',
    a: 'ED visas are typically issued for multi-month periods with the ability to extend. Actual duration and extension conditions depend on the sponsoring institution, your nationality, and current immigration policy. Always confirm the current rules directly with the Thai Immigration Bureau and your sponsor.',
  },
  {
    q: 'Is the DTV better than the Ed visa for martial arts training?',
    a: 'It depends on your situation. DTV may suit remote-working trainees and some long-stay travelers. ED visa suits those sponsored by a recognized training institution. Neither is strictly better—they serve different profiles.',
  },
  {
    q: 'Can I train on a tourist-style visa?',
    a: 'For shorter stays, many nationalities can train under tourist-style entry (with extensions where allowed). For multi-month structured training, a longer-term visa is usually the more sustainable route.',
  },
  {
    q: 'Can my gym sponsor my Ed visa?',
    a: 'Some larger camps or those partnered with recognized educational institutions can, but many cannot. Ask candidate gyms directly and request the exact documentation and fees in writing before booking flights.',
  },
  {
    q: 'How much does an Ed visa cost?',
    a: 'Fees vary: embassy or e-visa application fees, institution tuition/training fees, and periodic extension fees. Budget should be treated as a planning line item, not a rounding error—see the cost guide.',
  },
  {
    q: 'Do I still need visa runs on an Ed visa?',
    a: 'Some ED visa holders are required to do periodic extensions at Immigration rather than full &ldquo;visa runs.&rdquo; Exact process depends on the visa type issued and current rules. Always confirm with your institution and Immigration Bureau.',
  },
  {
    q: 'What is the single biggest mistake travelers make?',
    a: 'Booking flights before confirming the visa path in writing with both their camp and their embassy/consulate. Visa planning is slow; flights are fast&mdash;do the slow thing first.',
  },
]

export default function EdVisaGuidePage() {
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
      subtitle="A structured overview of how martial arts travelers plan long stays in Thailand using the Ed visa, DTV, and tourist options. Editorial guide, not legal advice."
      breadcrumbs={[
        { label: 'Training Guides', href: '/blog' },
        { label: 'Thailand', href: '/search?country=Thailand' },
      ]}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <GuideHero
        imageSrc={HERO_IMAGE}
        imageAlt="Thailand long-stay training visa planning"
        priority
        overlayText="There is no single &lsquo;Muay Thai visa.&rsquo; There are visa categories that fit different stay lengths—pick the one that matches your trip, not the one someone on a forum told you about."
      />

      <GuideLeadRow
        tocItems={[
          { href: '#overview', label: 'Overview' },
          { href: '#ed-visa', label: 'The Ed visa' },
          { href: '#dtv', label: 'DTV' },
          { href: '#tourist', label: 'Tourist options' },
          { href: '#pick', label: 'Which fits your trip' },
          { href: '#documents', label: 'Documents' },
          { href: '#official', label: 'Official sources' },
          { href: '#faq', label: 'FAQ' },
        ]}
        statValue="3 paths"
        statDescription="The three visa categories martial arts travelers usually compare for Thailand training trips."
        statIcon={<GraduationCap className="h-5 w-5" />}
      />

      <section id="overview" className="mb-14 scroll-mt-24">
        <GuideAccentIntro icon={ShieldCheck} title="The basics, stated plainly" subtitle="Start here before the forums" />
        <div className="prose prose-gray max-w-none space-y-4 text-base leading-relaxed text-gray-800 md:prose-lg">
          <p>
            If you are going to Thailand for a weekend-length taste of Muay Thai, BJJ, or MMA, visa planning is usually simple. If you are going for a <strong>real training block of a month, three months, or a year</strong>, visa planning is the single most important logistics decision you will make&mdash;and the most commonly botched.
          </p>
          <p>
            This page is an editorial planning framework, not legal advice. Rules depend on your nationality, the sponsoring institution, and current Thai immigration policy, which changes. Always verify with official sources before booking flights, and read this alongside the{' '}
            <Link href="/blog/thailand-training-visa-dtv" className="font-medium text-[#003580] underline">DTV &amp; training visa guide</Link> and the{' '}
            <Link href="/blog/thailand-visa-extension-overstay-guide" className="font-medium text-[#003580] underline">visa extension &amp; overstay guide</Link>.
          </p>
        </div>
      </section>

      <GuideSection id="ed-visa" variant="slate" className="mb-14">
        <div className="grid gap-8 md:grid-cols-2 md:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#003580]">Non-Immigrant ED</p>
            <h2 className="mt-2 text-2xl font-bold text-gray-900 md:text-3xl">The Ed (Education) visa</h2>
            <div className="mt-3 space-y-3 text-base leading-relaxed text-gray-700">
              <p>
                The Non-Immigrant <strong>ED visa</strong> is Thailand&rsquo;s visa category for educational purposes&mdash;language schools, universities, and, in some cases, sports or martial arts institutions recognized by Thai authorities. Some well-established Muay Thai camps partner with recognized educational or sport bodies to sponsor students on multi-month training stays.
              </p>
              <p>
                For the traveler, the ED visa typically means: a sponsoring institution, documented training commitments, initial issuance for a multi-month period, and periodic extensions handled through Thai Immigration. The exact process varies by institution and nationality.
              </p>
              <p>
                The ED visa is not a magic pass. It requires genuine enrollment, ongoing attendance, and documentation that matches your training commitments. If a &ldquo;visa agent&rdquo; offers you an ED visa without any real training enrollment, treat it as a risk signal.
              </p>
            </div>
          </div>
          <figure className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="relative aspect-[4/3] w-full">
              <Image
                src="https://upload.wikimedia.org/wikipedia/commons/8/82/Thai_Visa_on_Arrival.jpg"
                alt="Example of a Thailand visa page in a passport"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 520px"
              />
            </div>
            <figcaption className="px-4 py-3 text-xs text-gray-600">
              Example Thailand visa page (Wikimedia Commons). Always verify current rules for your nationality.
            </figcaption>
          </figure>
        </div>
      </GuideSection>

      <GuideSection id="dtv" variant="default" className="mb-14 border border-gray-200 bg-white">
        <div className="grid gap-8 md:grid-cols-2 md:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#003580]">Destination Thailand Visa</p>
            <h2 className="mt-2 text-2xl font-bold text-gray-900 md:text-3xl">DTV as an alternative for training travelers</h2>
            <div className="mt-3 space-y-3 text-base leading-relaxed text-gray-700">
              <p>
                The <strong>DTV</strong> (Destination Thailand Visa) was introduced to support longer-term visitors including remote workers, cultural participants, and certain training-related stays. For some martial arts travelers, DTV can be a cleaner fit than ED&mdash;especially if they are not enrolled in a formally sponsoring institution but are training long-term and working remotely.
              </p>
              <p>
                Eligibility, activity coverage, and documentation requirements evolve. Treat DTV as its own research project with official checklists. Start at the{' '}
                <a href="https://www.thaievisa.go.th/" target="_blank" rel="noopener noreferrer nofollow" className="font-medium text-[#003580] underline">Thailand e-Visa portal</a>{' '}
                and cross-check with your local Thai embassy or consulate.
              </p>
            </div>
          </div>
          <figure className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="relative aspect-[4/3] w-full">
              <Image
                src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Thailand_passport_stamp.jpg"
                alt="Thailand passport entry stamp"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 520px"
              />
            </div>
            <figcaption className="px-4 py-3 text-xs text-gray-600">
              Entry stamps determine your permitted stay. Image source: Wikimedia Commons.
            </figcaption>
          </figure>
        </div>
      </GuideSection>

      <GuideSection id="tourist" variant="slate" className="mb-14">
        <h2 className="mb-6 text-2xl font-bold text-gray-900 md:text-3xl">Tourist-style options for shorter stays</h2>
        <GuideThreeCards
          items={[
            {
              title: 'Visa-exempt entry',
              body: 'Many nationalities can enter Thailand without a pre-arranged visa for a shorter period. Suits 1&ndash;3 week training trips without extensions.',
            },
            {
              title: 'Tourist visa',
              body: 'Longer single- or multiple-entry tourist visas exist for some nationalities, often extendable at Immigration. Suits 1&ndash;3 month training stays.',
            },
            {
              title: 'Back-to-back entries',
              body: 'Historically some travelers relied on repeated short entries. Immigration policy on this has tightened over time&mdash;do not build a multi-year plan around it.',
            },
          ]}
        />
      </GuideSection>

      <section id="pick" className="mb-14 scroll-mt-24">
        <h2 className="mb-6 text-2xl font-bold text-gray-900 md:text-3xl">Which visa path fits which training trip?</h2>
        <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
              <tr>
                <th className="px-4 py-3">Trip profile</th>
                <th className="px-4 py-3">Typical fit</th>
                <th className="px-4 py-3">Why</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white text-gray-800">
              {[
                ['1–3 weeks, single camp', 'Visa-exempt / tourist', 'Simplest and fastest.'],
                ['1–3 months, single camp', 'Tourist visa (+ extension) or DTV', 'Enough stay length without heavy sponsorship paperwork.'],
                ['3–12 months, serious training', 'ED visa (if camp can sponsor) or DTV', 'Structured long stays; ED visa requires genuine enrollment.'],
                ['Ongoing/year+ with remote work', 'DTV (if eligible)', 'Aligns with remote-work lifestyle and long-term stays.'],
                ['Fight preparation (1–6 months)', 'Tourist + extension, ED, or DTV', 'Depends on sponsoring camp and nationality.'],
              ].map(([profile, fit, why]) => (
                <tr key={profile}>
                  <td className="px-4 py-3 font-semibold">{profile}</td>
                  <td className="px-4 py-3">{fit}</td>
                  <td className="px-4 py-3 text-gray-700">{why}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-gray-500">
          Table is directional only. Always confirm with official sources for your passport before purchasing flights.
        </p>
      </section>

      <GuideSection id="documents" variant="amber" className="mb-14">
        <div className="flex items-start gap-4">
          <FileText className="mt-1 h-8 w-8 shrink-0 text-[#003580]" aria-hidden />
          <div>
            <h2 className="text-2xl font-bold text-gray-900 md:text-3xl">Documents martial arts travelers commonly prepare</h2>
            <p className="mt-3 text-sm leading-relaxed text-gray-800">
              Your embassy may ask for different items than a friend&rsquo;s passport. Use this as a starting checklist, not a guarantee.
            </p>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {[
                'Passport with 6+ months validity',
                'Passport-style photos (digital and printed)',
                'Accommodation confirmations for your stay',
                'Training enrollment or camp booking confirmations',
                'Proof of funds (if required by visa class)',
                'Travel insurance covering contact sports training',
                'Return or onward travel plan',
                'Sponsor documents (for ED visa, from the institution)',
                'Any health or vaccination documents required for entry',
              ].map((item) => (
                <li key={item} className="rounded-lg border border-amber-200/80 bg-white/80 p-4 text-sm text-gray-800 shadow-sm">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </GuideSection>

      <GuideSection id="official" variant="brand" className="mb-14">
        <h2 className="mb-4 text-2xl font-bold text-gray-900 md:text-3xl">Official sources</h2>
        <p className="mb-6 max-w-3xl text-gray-700">
          Use Thai government and your embassy&rsquo;s pages for the actual forms, fees, and latest rules. Articles go stale.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { label: 'Thai Immigration Bureau', href: 'https://www.immigration.go.th/', desc: 'Extensions, overstays, policy notices.' },
            { label: 'Ministry of Foreign Affairs (MFA)', href: 'https://www.mfa.go.th/', desc: 'Visa categories and policy announcements.' },
            { label: 'Thailand e-Visa Portal', href: 'https://www.thaievisa.go.th/', desc: 'Online applications where supported.' },
            { label: 'Thai Embassies &amp; Consulates', href: 'https://www.mfa.go.th/en/page/thai-embassies-and-consulates', desc: 'Country-specific requirements.' },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="rounded-xl border border-[#003580]/15 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <p className="text-sm font-semibold text-gray-900" dangerouslySetInnerHTML={{ __html: item.label }} />
              <p className="mt-1 text-xs text-gray-600">{item.desc}</p>
              <p className="mt-3 text-xs font-semibold text-[#003580]">Open official site →</p>
            </a>
          ))}
        </div>
      </GuideSection>

      <GuideCtaStrip
        title="Find a camp that supports your stay length"
        subtitle="Confirm visa logistics with the camp before you book flights."
        href="/search?country=Thailand"
        buttonLabel="Browse Thailand camps"
      />

      <GuideSection id="faq" variant="default" padding="p-6 md:p-8" className="mb-14 shadow-sm">
        <h2 className="mb-2 text-2xl font-bold text-gray-900 md:text-3xl">FAQ</h2>
        <p className="mb-8 text-gray-600">Common questions about Ed visa, DTV, and martial arts training stays.</p>
        <GuideFaqList items={FAQ_ITEMS} />
      </GuideSection>

      <p className="mb-14 rounded-lg border border-gray-200 bg-gray-50 p-5 text-sm text-gray-700">
        <strong>Disclaimer:</strong> This guide is for general planning information only and does not constitute legal or
        immigration advice. Always confirm current rules with the Thai Immigration Bureau, Ministry of Foreign Affairs,
        and your local Thai embassy or consulate before making travel decisions.
      </p>

      <RelatedGuides
        guides={[
          { title: 'Thailand training visa / DTV guide', href: '/blog/thailand-training-visa-dtv' },
          { title: 'Thailand visa extension & overstay guide', href: '/blog/thailand-visa-extension-overstay-guide' },
          { title: 'How much does a Muay Thai camp in Thailand cost?', href: '/blog/muay-thai-camp-thailand-cost' },
          { title: '25 best Muay Thai camps in Thailand (2026)', href: '/blog/best-muay-thai-camps-thailand-2026' },
        ]}
      />
    </ArticleShell>
  )
}
