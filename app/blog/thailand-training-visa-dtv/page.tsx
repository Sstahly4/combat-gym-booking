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
import { FileWarning, Plane, ScrollText } from 'lucide-react'

const TITLE = 'Thailand Training Visa / DTV Guide for Fighters (2026)'
const PATH = '/blog/thailand-training-visa-dtv'
const DATE_PUBLISHED = '2025-10-15'
const DATE_MODIFIED = '2026-04-20'
const HERO_IMAGE = '/highquality-world-map-vector-art_1112614-9909.jpg'
const DESCRIPTION =
  'Plan longer combat sports training in Thailand: visa routes, DTV basics, documents, insurance, and official sources—editorial guide, not legal advice.'

export const metadata: Metadata = {
  title: `${TITLE} | Combatbooking`,
  description: DESCRIPTION,
  alternates: { canonical: PATH },
  openGraph: {
    title: `${TITLE} | Combatbooking`,
    description: DESCRIPTION,
    type: 'article',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${TITLE} | Combatbooking`,
    description: DESCRIPTION,
  },
}

const FAQ_ITEMS = [
  {
    q: 'Is there a special “Muay Thai visa”?',
    a: 'There is no single worldwide label that works for every passport. Travelers usually choose a visa category that matches stay length, purpose, and documentation. Always verify with your embassy and Thai immigration.',
  },
  {
    q: 'What is the DTV (Destination Thailand Visa)?',
    a: 'DTV can suit certain longer stays and remote-work lifestyles, depending on eligibility and current policy. Requirements evolve—use official sources for forms, fees, and permitted activities.',
  },
  {
    q: 'What documents help for combat sports travelers?',
    a: 'Common examples include accommodation proof, return or onward travel, training-related bookings or correspondence, and insurance appropriate for contact training. Exact needs vary by visa type.',
  },
  {
    q: 'Can CombatBooking sponsor my visa?',
    a: 'No. We are a camp marketplace. Immigration decisions are between you, your embassy/consulate, and Thai authorities.',
  },
  {
    q: 'Should I book flights before my visa is approved?',
    a: 'That is a personal risk decision. Many travelers prefer flexible tickets or refundable options until requirements are clear.',
  },
  {
    q: 'Does training count as “work”?',
    a: 'Visa categories define permitted activities differently. Do not assume training, coaching, or online work are interchangeable—confirm with official guidance for your specific visa.',
  },
  {
    q: 'Where can I find official DTV/visa requirements?',
    a: 'Start with Thai government sources (Immigration Bureau, Ministry of Foreign Affairs, and Thailand e-Visa) and your local Thai embassy/consulate. Requirements can differ by nationality and can change.',
  },
  {
    q: 'What if I need to extend my stay after I arrive?',
    a: 'Plan for that possibility early. Read our Thailand visa extension and overstay planning guide, then verify the current process with official sources for your visa type and location.',
  },
  {
    q: 'What is the biggest mistake long-stay fighters make with visas?',
    a: 'Leaving it too late. Visa and airline checks are timing-sensitive—build buffer days, keep digital copies of documents, and confirm the latest checklist right before you fly.',
  },
]

export default function ThailandTrainingVisaDtvPage() {
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
      subtitle="Longer stays need a plan: documents, insurance, realistic training load, and official rules—not forum rumors."
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
        imageAlt="Training in Thailand"
        priority
        overlayText="Visa rules change—use this guide to structure your research, then confirm every detail with official immigration sources."
      />

      <GuideLeadRow
        tocItems={[
          { href: '#overview', label: 'Overview' },
          { href: '#routes', label: 'Common routes' },
          { href: '#documents', label: 'Documents' },
          { href: '#training-load', label: 'Training load' },
          { href: '#checklist', label: 'Checklist' },
          { href: '#official', label: 'Official sources' },
          { href: '#faq', label: 'FAQ' },
        ]}
      />

      <section id="overview" className="mb-14 scroll-mt-24">
        <GuideAccentIntro icon={Plane} title="Why visa planning matters for fight camps" subtitle="Flights are the easy part" />
        <div className="prose prose-gray max-w-none space-y-4 text-base leading-relaxed text-gray-800 md:prose-lg">
          <p>
            If you are training Muay Thai, MMA, BJJ, or boxing in Thailand for more than a quick holiday, your visa
            strategy is as important as your camp choice. The wrong assumption—treating a long stay like a short
            tourist trip—can create stress, denied boarding, or last-minute booking losses.
          </p>
          <p>
            This page is a <strong>structured editorial overview</strong> of how travelers commonly think about Thailand
            stays, including references to DTV where relevant. It is <strong>not legal advice</strong>. Rules depend on
            nationality, embassy, and policy updates.
          </p>
        </div>
      </section>

      <GuideSection variant="slate" className="mb-14">
        <div className="grid gap-8 md:grid-cols-2 md:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#003580]">Visual grounding</p>
            <h2 className="mt-2 text-2xl font-bold text-gray-900 md:text-3xl">Think in stamps, dates, and permitted stay</h2>
            <div className="mt-3 space-y-3 text-base leading-relaxed text-gray-700">
              <p>
                Visa talk is abstract until you see the pattern: entries, extensions, and dates that control how long you
                can stay. The “right” option depends on your passport, your stay length, and what documents you can provide.
              </p>
              <p>
                The goal of this guide is to help you build a repeatable process: start from official sources, make a
                checklist, and avoid last-minute surprises that can ruin a month-long camp plan.
              </p>
            </div>
          </div>
          <figure className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="relative aspect-[4/3] w-full">
              <Image
                src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Thailand_passport_stamp.jpg"
                alt="Thailand passport entry stamp example"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 520px"
              />
            </div>
            <figcaption className="px-4 py-3 text-xs text-gray-600">
              Example of a Thailand passport stamp image from Wikimedia Commons. Always confirm your permitted stay and any
              extension rules from official sources for your passport.
            </figcaption>
          </figure>
        </div>
      </GuideSection>

      <GuideSection id="routes" variant="slate" className="mb-14">
        <h2 className="mb-6 text-2xl font-bold text-gray-900 md:text-3xl">Common visa routes (high level)</h2>
        <GuideThreeCards
          items={[
            {
              title: 'Shorter tourist-style visits',
              body: 'Often used for shorter camps when permitted for your nationality. Confirm permitted stay length and extensions with official guidance—not blogs.',
            },
            {
              title: 'Longer-stay categories',
              body: 'Some travelers qualify for longer options depending on purpose, documentation, and eligibility. Requirements vary widely by passport.',
            },
            {
              title: 'DTV (Destination Thailand Visa)',
              body: 'May fit certain remote workers and longer visitors depending on current eligibility. Treat DTV as its own research project with official checklists.',
            },
          ]}
        />
      </GuideSection>

      <GuideSection id="checklist" variant="default" className="mb-14 border border-gray-200 bg-white">
        <div className="grid gap-8 md:grid-cols-2 md:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#003580]">High ROI planning</p>
            <h2 className="mt-2 text-2xl font-bold text-gray-900 md:text-3xl">A pre-flight checklist for long-stay training trips</h2>
            <p className="mt-3 text-base leading-relaxed text-gray-700">
              If you want the trip to last longer than a week, treat visas like training: a system beats motivation. This checklist is
              designed to prevent last-minute stress and expensive re-booking.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-gray-700">
              <li>
                <strong>Dates:</strong> what is your intended stay length (days/weeks), and what’s your buffer?
              </li>
              <li>
                <strong>Route:</strong> which visa/entry route matches your passport and timeline right now?
              </li>
              <li>
                <strong>Documents:</strong> do you have digital + printed copies (passport bio page, photos, bookings)?
              </li>
              <li>
                <strong>Proof:</strong> can you show accommodation and onward/return travel if requested?
              </li>
              <li>
                <strong>Insurance:</strong> is it appropriate for contact sports training and injuries?
              </li>
              <li>
                <strong>Training plan:</strong> are you ramping volume realistically for week 1?
              </li>
              <li>
                <strong>Extension plan:</strong> do you know what you’ll do if you need more time?
              </li>
            </ul>
            <p className="mt-5 text-sm text-gray-600">
              If extensions are part of your plan, also read{' '}
              <Link href="/blog/thailand-visa-extension-overstay-guide" className="font-medium text-[#003580] underline">
                Thailand visa extension & overstay guide
              </Link>{' '}
              and verify the latest official process.
            </p>
          </div>
          <figure className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="relative aspect-[4/3] w-full">
              <Image
                src="https://upload.wikimedia.org/wikipedia/commons/8/82/Thai_Visa_on_Arrival.jpg"
                alt="Thailand visa page in a passport for visual reference"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 520px"
              />
            </div>
            <figcaption className="px-4 py-3 text-xs text-gray-600">
              Use visa images as visual reference only—always confirm rules with official sources for your passport.
            </figcaption>
          </figure>
        </div>
      </GuideSection>

      <GuideSection variant="default" className="mb-14 border border-gray-200 bg-white">
        <div className="grid gap-8 md:grid-cols-2 md:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#003580]">A practical mindset</p>
            <h2 className="mt-2 text-2xl font-bold text-gray-900 md:text-3xl">What changes most often (and how to react)</h2>
            <div className="mt-3 space-y-3 text-base leading-relaxed text-gray-700">
              <p>
                The trap is memorizing a blog’s “visa rules” once and assuming it will be true next month. What changes is
                often the <strong>implementation</strong>: required documents, appointment flow, fees, or what an airline
                wants before boarding.
              </p>
              <p>
                Treat anything you read—including this page—as a framework. Then validate the current checklist from the
                Immigration Bureau, MFA, and your embassy/consulate links below.
              </p>
            </div>
          </div>
          <figure className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="relative aspect-[4/3] w-full">
              <Image
                src="https://upload.wikimedia.org/wikipedia/commons/8/82/Thai_Visa_on_Arrival.jpg"
                alt="Example of a Thailand visa on arrival in a passport"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 520px"
              />
            </div>
            <figcaption className="px-4 py-3 text-xs text-gray-600">
              Visa-on-arrival image from Wikimedia Commons. Use it as a visual reference only—eligibility and rules vary by
              passport and policy.
            </figcaption>
          </figure>
        </div>
      </GuideSection>

      <GuideSection id="documents" variant="amber" className="mb-14">
        <h2 className="mb-4 text-2xl font-bold text-gray-900 md:text-3xl">Documents travelers often prepare</h2>
        <p className="mb-6 max-w-3xl text-gray-700">
          Your embassy may ask for different items than a friend’s passport. Use this as a packing list for your research
          folder—not a guarantee.
        </p>
        <ul className="grid gap-4 sm:grid-cols-2">
          {[
            'Accommodation confirmations and realistic itinerary notes',
            'Training-related bookings, invoices, or camp correspondence',
            'Proof of funds if required for your visa class',
            'Travel insurance that covers training and accidental injury',
            'Passport validity beyond your planned stay window',
            'Return or onward travel plans if requested',
          ].map((item) => (
            <li
              key={item}
              className="flex gap-3 rounded-lg border border-amber-200/80 bg-white/80 p-4 text-sm text-gray-800 shadow-sm"
            >
              <ScrollText className="mt-0.5 h-5 w-5 shrink-0 text-[#003580]" aria-hidden />
              {item}
            </li>
          ))}
        </ul>
      </GuideSection>

      <section id="training-load" className="mb-14 scroll-mt-24">
        <h2 className="mb-4 text-2xl font-bold text-gray-900 md:text-3xl">Training load vs immigration stress</h2>
        <div className="max-w-4xl space-y-4 text-base leading-relaxed text-gray-800">
          <p>
            Long-stay athletes sometimes underestimate recovery. If you are navigating visa appointments, housing setup,
            and jet lag while jumping into twice-daily training, injury risk rises. Build buffer days and sleep—your camp
            will still be there after you are rested.
          </p>
          <p>
            If you plan to compete, add medical and coaching conversations early. Insurance that excludes contact sports
            can leave you exposed—read policy details carefully.
          </p>
        </div>
      </section>

      <GuideSection variant="slate" className="mb-14">
        <h2 className="mb-4 text-2xl font-bold text-gray-900 md:text-3xl">A simple “ask your camp” checklist (before you book)</h2>
        <p className="mb-6 max-w-3xl text-gray-700">
          Camps cannot give legal advice, but they can confirm logistics that affect your planning—especially for longer stays.
        </p>
        <ul className="grid gap-4 sm:grid-cols-2">
          {[
            'What is the typical minimum stay for accommodation packages (if offered)?',
            'Do you provide invoices/receipts that reflect training dates and payments?',
            'Are there rest days or beginner-only schedules you recommend for week one?',
            'Do you have a preferred nearby area for long-stay students to rent apartments?',
            'Can you confirm the gym address and a map link for planning commutes?',
            'If I arrive late, can I start training the next day (schedule constraints)?',
          ].map((item) => (
            <li key={item} className="rounded-xl border border-gray-200 bg-white p-5 text-sm text-gray-800 shadow-sm">
              {item}
            </li>
          ))}
        </ul>
      </GuideSection>

      <GuideSection id="official" variant="brand" className="mb-14">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-8">
          <FileWarning className="h-10 w-10 shrink-0 text-[#003580]" aria-hidden />
          <div>
            <h2 className="text-2xl font-bold text-gray-900 md:text-3xl">Official sources beat blogs</h2>
            <p className="mt-3 text-base leading-relaxed text-gray-700">
              Use the Royal Thai Immigration Bureau, Ministry of Foreign Affairs, and your embassy for forms, fees, and
              processing times. Third-party articles—including ours—go stale when rules change.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {[
                {
                  label: 'Thai Immigration Bureau',
                  href: 'https://www.immigration.go.th/',
                  desc: 'Overstays, extensions, updates, and official notices.',
                },
                {
                  label: 'Ministry of Foreign Affairs (MFA)',
                  href: 'https://www.mfa.go.th/',
                  desc: 'Policy announcements and official Thailand government info.',
                },
                {
                  label: 'Thailand e-Visa',
                  href: 'https://www.thaievisa.go.th/',
                  desc: 'If your visa type uses the online portal, start here.',
                },
                {
                  label: 'Your local Thai Embassy/Consulate',
                  href: 'https://www.mfa.go.th/en/page/thai-embassies-and-consulates',
                  desc: 'Country-specific requirements and processing rules.',
                },
              ].map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="rounded-xl border border-[#003580]/15 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
                >
                  <p className="text-sm font-semibold text-gray-900">{item.label}</p>
                  <p className="mt-1 text-xs text-gray-600">{item.desc}</p>
                  <p className="mt-3 text-xs font-semibold text-[#003580]">Open official site →</p>
                </a>
              ))}
            </div>
          </div>
        </div>
      </GuideSection>

      <GuideSection variant="slate" className="mb-14">
        <div className="grid gap-8 md:grid-cols-2 md:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#003580]">Dwell-time friendly checklist</p>
            <h2 className="mt-2 text-2xl font-bold text-gray-900 md:text-3xl">Build a “visa folder” before you fly</h2>
            <p className="mt-3 text-base leading-relaxed text-gray-700">
              Screenshots and scattered PDFs cause mistakes. Keep one folder with the exact links above, your documents,
              and a simple one-page itinerary so you can answer questions quickly.
            </p>
          </div>
          <figure className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="relative aspect-[4/3] w-full">
              <Image
                src="/highquality-world-map-vector-art_1112614-9909.jpg"
                alt="Thailand travel planning visual for visa guide"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 520px"
              />
            </div>
            <figcaption className="px-4 py-3 text-xs text-gray-600">
              Always verify the latest visa rules from official sources right before purchase/booking.
            </figcaption>
          </figure>
        </div>
      </GuideSection>

      <GuideCtaStrip
        variant="light"
        title="Pick your camp after you understand stay length"
        subtitle="Browse verified Thailand gyms with transparent listings."
        href="/search?country=Thailand"
        buttonLabel="Browse Thailand camps"
      />

      <div className="mb-10 flex flex-wrap justify-center gap-4">
        <Link
          href="/blog/best-muay-thai-camps-thailand-2026"
          className="text-sm font-semibold text-[#003580] underline hover:no-underline"
        >
          25 best Muay Thai camps (2026)
        </Link>
        <span className="text-gray-300">|</span>
        <Link href="/blog/best-mma-camps-thailand" className="text-sm font-semibold text-[#003580] underline hover:no-underline">
          MMA camps
        </Link>
        <span className="text-gray-300">|</span>
        <Link href="/blog/best-bjj-gyms-thailand" className="text-sm font-semibold text-[#003580] underline hover:no-underline">
          BJJ gyms
        </Link>
      </div>

      <GuideSection id="faq" variant="default" className="mb-14 border border-gray-200 bg-white p-6 md:p-10">
        <h2 className="mb-2 text-2xl font-bold text-gray-900 md:text-3xl">Frequently asked questions</h2>
        <p className="mb-8 text-gray-600">High-signal answers for combat sports travelers—confirm details with officials.</p>
        <GuideFaqList items={FAQ_ITEMS} />
      </GuideSection>

      <p className="mb-14 rounded-lg border border-gray-200 bg-gray-50 p-5 text-sm text-gray-700">
        <strong>Disclaimer:</strong> This guide is for general information only and does not constitute legal advice.
        Immigration law changes; always verify with qualified professionals and official government sources before making
        decisions.
      </p>

      <RelatedGuides
        guides={[
          { title: '25 best Muay Thai camps in Thailand (2026)', href: '/blog/best-muay-thai-camps-thailand-2026' },
          { title: 'Best Muay Thai gyms in Phuket', href: '/blog/best-muay-thai-gyms-phuket' },
          { title: 'Best MMA camps in Thailand', href: '/blog/best-mma-camps-thailand' },
          { title: 'Best BJJ gyms in Thailand', href: '/blog/best-bjj-gyms-thailand' },
        ]}
      />
    </ArticleShell>
  )
}
