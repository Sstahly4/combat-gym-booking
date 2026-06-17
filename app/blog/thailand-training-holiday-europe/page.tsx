import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { ArticleShell } from '@/components/guides/article-shell'
import { RelatedGuides } from '@/components/guides/related-guides'
import { GuideStayTrainListingBlock } from '@/components/guides/guide-stay-train-listing-block'
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
import { Calendar, Palmtree, Shield, Sun, Users } from 'lucide-react'

/**
 * Phase 4 prep — not in sitemap.ts, llms.txt, or /blog index until indexing runway clears.
 * Remove `robots: { index: false }` from metadata when launching.
 */
const TITLE = 'Thailand Training Holiday Europe: Compare Stays & Reviews [2026]'
const SEO_TITLE = TITLE
const PATH = '/blog/thailand-training-holiday-europe'
const DATE_PUBLISHED = '2026-06-11'
const DATE_MODIFIED = '2026-06-11'
const HERO_IMAGE = '/training-center-1.avif'
const DESCRIPTION =
  'Thailand training holidays for European travelers. EUR and THB package pricing, EU 60-day entry, live gym reviews, and instant booking on CombatStay.'

export const metadata: Metadata = {
  title: `${SEO_TITLE} | CombatStay`,
  description: DESCRIPTION,
  alternates: { canonical: PATH },
  robots: { index: false, follow: false },
  openGraph: { title: `${SEO_TITLE} | CombatStay`, description: DESCRIPTION, type: 'article' },
  twitter: { card: 'summary_large_image', title: `${SEO_TITLE} | CombatStay`, description: DESCRIPTION },
}

const FAQ_ITEMS = [
  {
    q: 'What is a Thailand training holiday for European travelers?',
    a: 'You book a camp or gym package, train most mornings or afternoons, and protect the rest of the day for recovery, beach time, or sightseeing. It fits two weeks of annual leave better than a hardcore relocation block.',
  },
  {
    q: 'How much does a Thailand training holiday cost from Europe in EUR?',
    a: 'Expect EUR 580–1,280+ return economy flights from major hubs, plus EUR 170–680+ for training packages and EUR 300–850+ for accommodation depending on resort vs dorm tier. All-inclusive camps bundle room and meals in one price (roughly 14,000–32,000 THB per week at mid-range, about EUR 380–865).',
  },
  {
    q: 'Do EU citizens need a visa for a training holiday in Thailand?',
    a: 'Most EU and EEA passport holders enter on a 60-day visa exemption for tourism under current Thai rules. A typical two-to-three-week training holiday fits inside that window. Confirm on your local Royal Thai Embassy website before you book.',
  },
  {
    q: 'Best Thai destinations for a training holiday from Europe?',
    a: 'Phuket, Hua Hin, Koh Samui, and Krabi pair gyms with beach access. Chiang Mai trades beaches for cooler mornings and lower costs. Bangkok suits short urban holidays with stadium nights.',
  },
  {
    q: 'Fight camp Thailand vs training holiday: what is the difference?',
    a: 'A fight camp chases volume with twice-daily sessions and strict rest rules. A training holiday runs four to five sessions per week and leaves room for beaches, food, and partner time. Same country, different weekly rhythm.',
  },
  {
    q: 'How many training sessions per week on a holiday trip?',
    a: 'Four to five coached sessions per week is sustainable for most holiday travelers. Take two full rest days for tours or pool time.',
  },
  {
    q: 'Can I bring a partner who will not train Muay Thai?',
    a: 'Yes. Pick a base with a pool, restaurants, and easy transport. Phuket and Hua Hin work well.',
  },
  {
    q: 'All-inclusive camp or gym plus separate hotel?',
    a: 'All-inclusive simplifies meals and commute if the camp has a pool and decent rooms. Separate hotel works when your partner wants a different area. Compare total price in EUR, not only the mat fee.',
  },
  {
    q: 'Where can I compare packages with live reviews?',
    a: 'Use the listing table on this page. Each gym profile shows guest reviews, package prices, and instant booking on CombatStay.',
  },
  {
    q: 'Training holiday vs full Muay Thai trip from Europe?',
    a: 'A training holiday leaves room for rest days. A full training trip chases volume. For flights, visas, and EUR budgeting, read our Europe trip planning guide.',
  },
]

export default function ThailandTrainingHolidayEuropePage() {
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
    { name: 'Europe', path: PATH },
    { name: TITLE, path: PATH },
  ])

  return (
    <ArticleShell
      title={TITLE}
      subtitle="EU and EEA passport holders typically receive a 60-day visa exemption for tourism. Compare stay-and-train packages with live reviews, EUR-friendly budgeting, and instant booking on CombatStay."
      breadcrumbs={[
        { label: 'Training Guides', href: '/blog' },
        { label: 'Europe → Thailand', href: PATH },
      ]}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <GuideHero
        imageSrc={HERO_IMAGE}
        imageAlt="Thailand training holiday with Muay Thai for European travelers"
        priority
        overlayText="Morning pads. Afternoon swim. Winter sun without burning out your leave."
      />

      <GuideLeadRow
        tocItems={[
          { href: '#holiday-vs-camp', label: 'Holiday vs fight camp' },
          { href: '#packages', label: 'Packages & EUR' },
          { href: '#listings', label: 'Compare stays' },
          { href: '#destinations', label: 'Best bases' },
          { href: '#partner', label: 'Non-training partner' },
          { href: '#week', label: 'Sample week' },
          { href: '#faq', label: 'FAQ' },
        ]}
        statValue="4–5/wk"
        statDescription="Coached sessions per week that fit a holiday pace on a two-week European leave block."
        statIcon={<Calendar className="h-5 w-5" />}
      />

      <section id="holiday-vs-camp" className="mb-14 scroll-mt-24">
        <GuideAccentIntro icon={Sun} title="Training holiday vs fight camp Thailand" subtitle="Pick the weekly rhythm first" />
        <div className="prose prose-gray max-w-none space-y-4 text-base leading-relaxed text-gray-800 md:prose-lg">
          <p>
            A Thailand training holiday from Europe means you fly home with new pad skills and winter sun, not a limp
            and a grudge against stairs. You train enough to progress. You leave afternoons open for beaches and food.
          </p>
          <p>
            Package prices on this page use EUR and THB bands, with EU entry rules spelled out, so you can compare camps
            without converting from USD estimates.
          </p>
          <p>
            For flights, visas, and EUR budgeting, read{' '}
            <Link href="/blog/muay-thai-trip-from-europe" className="font-medium text-[#003580] underline">
              Muay Thai trip from Europe
            </Link>
            . This page compares stays, reviews, and package prices you can book today.
          </p>
        </div>
      </section>

      <GuideSection id="packages" variant="slate" className="mb-14">
        <GuideAccentIntro icon={Shield} title="Packages and EUR pricing" subtitle="All-inclusive vs split booking" />
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#003580]">Train, stay, and eat</p>
            <p className="mt-2 text-sm leading-relaxed text-gray-700">
              Room, meals, and scheduled training in one invoice. Typical weekly bundles run EUR 380–865+ depending on
              city and room tier (roughly 14,000–32,000 THB). Phuket resort-style camps sit at the top.
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#003580]">Gym plus separate hotel</p>
            <p className="mt-2 text-sm leading-relaxed text-gray-700">
              You pick the holiday hotel; gym is a morning commute. Add EUR 40–110+ per night for mid-range beach hotels
              in Phuket peak season.
            </p>
          </div>
        </div>
      </GuideSection>

      <GuideStayTrainListingBlock
        id="listings"
        title="Compare stays with live reviews"
        subtitle="Camps listing on-site accommodation and meals. Sorted by review signal."
        limit={10}
      />

      <GuideSection id="destinations" variant="default" className="mb-14 border border-gray-200 bg-white">
        <GuideAccentIntro icon={Palmtree} title="Best Thailand bases for a European training holiday" />
        <GuideThreeCards
          items={[
            {
              title: 'Phuket',
              body: 'Beaches, restaurants, and a deep gym scene. Good for couples and post-session swims. Direct or one-stop flights from AMS and FRA in peak season.',
            },
            {
              title: 'Hua Hin',
              body: 'Calmer than Phuket, solid food scene, quieter nights. Lower commute stress.',
            },
            {
              title: 'Chiang Mai',
              body: 'Cooler mornings November to February. Night markets instead of beaches. Strong value for long leave blocks from Germany and the Nordics.',
            },
          ]}
        />
        <p className="mt-6 text-sm leading-relaxed text-gray-700">
          City guides:{' '}
          <Link href="/blog/best-muay-thai-gyms-phuket" className="font-medium text-[#003580] underline">
            Phuket
          </Link>
          ,{' '}
          <Link href="/blog/best-muay-thai-gyms-hua-hin" className="font-medium text-[#003580] underline">
            Hua Hin
          </Link>
          ,{' '}
          <Link href="/blog/best-muay-thai-gyms-chiang-mai" className="font-medium text-[#003580] underline">
            Chiang Mai
          </Link>
          .
        </p>
      </GuideSection>

      <section id="partner" className="mb-14 scroll-mt-24">
        <GuideAccentIntro icon={Users} title="When only one of you trains" />
        <div className="prose prose-gray max-w-none space-y-4 text-base leading-relaxed text-gray-800 md:prose-lg">
          <p>
            If your partner is not training, book where both of you want to spend the day. Camps with on-site pool and
            air-conditioned rooms work well for split schedules.
          </p>
        </div>
        <figure className="mt-8 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="relative aspect-[4/3] w-full">
            <Image
              src="/481020258.avif"
              alt="Muay Thai as part of a Thailand training holiday"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 720px"
            />
          </div>
        </figure>
      </section>

      <GuideSection id="week" variant="slate" className="mb-14">
        <h2 className="mb-6 text-2xl font-bold text-gray-900 md:text-3xl">Sample training holiday week (Phuket base)</h2>
        <div className="space-y-3 text-sm leading-relaxed text-gray-800">
          <p>
            <strong>Monday:</strong> Morning pad class. Pool and lunch.
          </p>
          <p>
            <strong>Tuesday:</strong> Morning technique session. Massage.
          </p>
          <p>
            <strong>Wednesday:</strong> Rest day. Boat trip or old town food crawl.
          </p>
          <p>
            <strong>Thursday:</strong> Morning pads. Recovery amenities if available.
          </p>
          <p>
            <strong>Friday:</strong> Morning class. Beach with partner.
          </p>
          <p>
            <strong>Saturday:</strong> Light session. Night market.
          </p>
          <p>
            <strong>Sunday:</strong> Full rest.
          </p>
        </div>
      </GuideSection>

      <GuideCtaStrip
        title="Book a Thailand training holiday from Europe"
        subtitle="Real-time availability, guest reviews, and instant checkout."
        href="/search?country=Thailand&discipline=Muay%20Thai&accommodation=true"
        buttonLabel="Compare packages"
      />

      <GuideSection id="faq" variant="default" padding="p-6 md:p-8" className="mb-14 shadow-sm">
        <h2 className="mb-2 text-2xl font-bold text-gray-900 md:text-3xl">FAQ</h2>
        <p className="mb-8 text-gray-600">Thailand training holiday questions from European travelers.</p>
        <GuideFaqList items={FAQ_ITEMS} />
      </GuideSection>

      <RelatedGuides
        guides={[
          { title: 'Muay Thai trip from Europe (flights & visas)', href: '/blog/muay-thai-trip-from-europe' },
          { title: 'Best Muay Thai gyms in Phuket', href: '/blog/best-muay-thai-gyms-phuket' },
          { title: 'Thailand training camp with accommodation', href: '/blog/thailand-training-camp-with-accommodation' },
          { title: '1-week vs 1-month Muay Thai camps', href: '/blog/muay-thai-camp-1-week-vs-1-month' },
        ]}
      />
    </ArticleShell>
  )
}
