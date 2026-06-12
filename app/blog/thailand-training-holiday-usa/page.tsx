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

const TITLE = 'Thailand Training Holiday USA: Packages & Prices [2026]'
const SEO_TITLE = TITLE
const PATH = '/blog/thailand-training-holiday-usa'
const DATE_PUBLISHED = '2026-06-11'
const DATE_MODIFIED = '2026-06-11'
const HERO_IMAGE = '/training-center-1.avif'
const DESCRIPTION =
  'Find the best Thailand training holiday packages for US travelers. Compare all-inclusive Muay Thai stays, recovery amenities, and live prices.'

export const metadata: Metadata = {
  title: `${SEO_TITLE} | CombatStay`,
  description: DESCRIPTION,
  alternates: { canonical: PATH },
  openGraph: { title: `${SEO_TITLE} | CombatStay`, description: DESCRIPTION, type: 'article' },
  twitter: { card: 'summary_large_image', title: `${SEO_TITLE} | CombatStay`, description: DESCRIPTION },
}

const FAQ_ITEMS = [
  {
    q: 'What is a Thailand training holiday for US travelers?',
    a: 'You book a camp or gym package, train most mornings or afternoons, and protect the rest of the day for recovery, beach time, or sightseeing. It fits two weeks of PTO better than a hardcore eight-week relocation.',
  },
  {
    q: 'How much does a Thailand training holiday cost from the USA in USD?',
    a: 'Expect USD 900–2,200+ return economy flights, plus USD 200–700+ for training packages and USD 350–1,000+ for accommodation depending on resort vs dorm tier. All-inclusive camps bundle room and meals in one price. Resort-style stays push daily spend up faster than gym dorms.',
  },
  {
    q: 'Do US citizens need a visa for a training holiday in Thailand?',
    a: 'Most US passport holders enter on a 60-day visa exemption for tourism under current Thai rules. A typical two-to-three-week training holiday fits inside that window. Confirm allowed stay length on the Royal Thai Embassy website before you book.',
  },
  {
    q: 'Best Thai destinations for a training holiday from the USA?',
    a: 'Phuket, Hua Hin, Koh Samui, and Krabi pair gyms with beach access. Chiang Mai trades beaches for cooler mornings and lower costs. Bangkok suits short urban holidays with stadium nights.',
  },
  {
    q: 'All-inclusive camp or gym plus separate hotel?',
    a: 'All-inclusive simplifies meals and commute if the camp has a pool and decent rooms. Separate hotel works when your partner wants a different area. Compare total price, not only the mat fee.',
  },
  {
    q: 'How many training sessions per week on a holiday trip?',
    a: 'Four to five coached sessions per week is sustainable for most holiday travelers. Take two full rest days for tours or pool time.',
  },
  {
    q: 'Can I bring a partner who will not train Muay Thai?',
    a: 'Yes. Pick a base with a pool, restaurants, and easy transport. Phuket and Hua Hin work well: they can swim or explore while you do a morning class.',
  },
  {
    q: 'Is a training holiday worth it if I am a complete beginner?',
    a: 'Yes, if you pick a beginner-friendly camp and cap volume. Read the beginner camp guide before you book.',
  },
  {
    q: 'Training holiday vs full Muay Thai trip from the USA?',
    a: 'A training holiday leaves room for rest days and time outside the gym. A full training trip chases volume with repeat sessions. Same country, different weekly rhythm.',
  },
  {
    q: 'Where can I compare all-inclusive packages with live prices?',
    a: 'Use the listing table on this page or browse CombatStay with the accommodation filter. Open each gym profile for package duration, meal count, and instant booking.',
  },
]

export default function ThailandTrainingHolidayUsaPage() {
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
    { name: 'USA', path: PATH },
    { name: TITLE, path: PATH },
  ])

  return (
    <ArticleShell
      title={TITLE}
      subtitle="US passport holders get a 60-day visa exemption for tourism. That covers most training holidays before you need a longer-stay visa. Morning pads, afternoon beach, book packages in USD on CombatStay."
      breadcrumbs={[
        { label: 'Training Guides', href: '/blog' },
        { label: 'USA → Thailand', href: PATH },
      ]}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <GuideHero
        imageSrc={HERO_IMAGE}
        imageAlt="Thailand training holiday with Muay Thai and beach recovery for US travelers"
        priority
        overlayText="Four sessions a week. Pool time the rest. You fly home tired in a good way."
      />

      <GuideLeadRow
        tocItems={[
          { href: '#holiday-vs-camp', label: 'Holiday vs camp' },
          { href: '#packages', label: 'Packages & USD' },
          { href: '#listings', label: 'Compare stays' },
          { href: '#destinations', label: 'Best bases' },
          { href: '#partner', label: 'Non-training partner' },
          { href: '#week', label: 'Sample week' },
          { href: '#faq', label: 'FAQ' },
        ]}
        statValue="4–5/wk"
        statDescription="Coached sessions per week that fit a holiday pace without burning out your PTO trip."
        statIcon={<Calendar className="h-5 w-5" />}
      />

      <section id="holiday-vs-camp" className="mb-14 scroll-mt-24">
        <GuideAccentIntro icon={Sun} title="Training holiday vs full training camp" subtitle="Same country, different rhythm" />
        <div className="prose prose-gray max-w-none space-y-4 text-base leading-relaxed text-gray-800 md:prose-lg">
          <p>
            A Thailand training holiday from the USA means you fly home with new pad skills and a tan, not shin splits
            and a resentment of stairs. You train enough to progress. You leave afternoons open for beaches and food.
          </p>
          <p>
            For flights, visas, and USD budgeting, read{' '}
            <Link href="/blog/muay-thai-trip-from-usa" className="font-medium text-[#003580] underline">
              Muay Thai trip from USA
            </Link>
            . This page is about packages, prices, and how you spend the days between landing and takeoff.
          </p>
        </div>
      </section>

      <GuideSection id="packages" variant="slate" className="mb-14">
        <GuideAccentIntro icon={Shield} title="All-inclusive packages and USD pricing" subtitle="What you are actually buying" />
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#003580]">Train, stay, and eat</p>
            <p className="mt-2 text-sm leading-relaxed text-gray-700">
              Room, one to three meals per day, and scheduled training in one invoice. Typical weekly bundles run
              USD 400–900+ depending on city and room tier (roughly 14,000–32,000 THB). Phuket resort-style camps sit
              at the top; Chiang Mai dorm packages sit lower.
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#003580]">Gym plus separate hotel</p>
            <p className="mt-2 text-sm leading-relaxed text-gray-700">
              You pick the holiday hotel; gym is a morning commute. Partner gets the room they want. Add USD 40–120+
              per night for mid-range beach hotels in Phuket peak season.
            </p>
          </div>
        </div>
        <p className="mt-6 text-sm leading-relaxed text-gray-700">
          Read{' '}
          <Link href="/blog/thailand-training-camp-with-accommodation" className="font-medium text-[#003580] underline">
            Thailand training camp with accommodation
          </Link>{' '}
          for inclusion checklists before you pay.
        </p>
      </GuideSection>

      <GuideStayTrainListingBlock
        id="listings"
        title="Compare all-inclusive stay-and-train packages"
        subtitle="Camps listing on-site accommodation and meals. Live prices on CombatStay."
        limit={10}
      />

      <GuideSection id="destinations" variant="default" className="mb-14 border border-gray-200 bg-white">
        <GuideAccentIntro icon={Palmtree} title="Best Thailand bases for a US training holiday" />
        <GuideThreeCards
          items={[
            {
              title: 'Phuket',
              body: 'Beaches, restaurants, and a deep gym scene. Chalong and Rawai cluster fight gyms. Good for couples and post-session swims.',
            },
            {
              title: 'Hua Hin',
              body: 'Calmer than Phuket, solid food scene, quieter nights. Gyms are fewer but commute stress is low.',
            },
            {
              title: 'Koh Samui',
              body: 'Island holiday feel with solid Muay Thai gyms. Flights often via Bangkok. Check rainy season timing before you book.',
            },
          ]}
        />
      </GuideSection>

      <section id="partner" className="mb-14 scroll-mt-24">
        <GuideAccentIntro icon={Users} title="When only one of you trains" />
        <div className="prose prose-gray max-w-none space-y-4 text-base leading-relaxed text-gray-800 md:prose-lg">
          <p>
            If your partner is not training, their day still decides where you can live. Camps with on-site pool and
            air-conditioned rooms work well. In Phuket and Hua Hin you can train before lunch and spend the afternoon at
            the beach.
          </p>
        </div>
        <figure className="mt-8 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="relative aspect-[4/3] w-full">
            <Image
              src="/481020258.avif"
              alt="Muay Thai session as part of a balanced Thailand holiday"
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
          <p><strong>Monday:</strong> Morning pad class. Pool and lunch.</p>
          <p><strong>Tuesday:</strong> Morning technique session. Massage.</p>
          <p><strong>Wednesday:</strong> Rest day. Island boat trip or old town food crawl.</p>
          <p><strong>Thursday:</strong> Morning pads. Sauna or ice if available.</p>
          <p><strong>Friday:</strong> Morning class. Beach with partner.</p>
          <p><strong>Saturday:</strong> Light session or open gym. Night market.</p>
          <p><strong>Sunday:</strong> Full rest.</p>
        </div>
      </GuideSection>

      <GuideCtaStrip
        title="Book a Thailand training holiday from the USA"
        subtitle="All-inclusive packages with live availability and instant checkout."
        href="/search?country=Thailand&discipline=Muay%20Thai&accommodation=true"
        buttonLabel="Find packages"
      />

      <GuideSection id="faq" variant="default" padding="p-6 md:p-8" className="mb-14 shadow-sm">
        <h2 className="mb-2 text-2xl font-bold text-gray-900 md:text-3xl">FAQ</h2>
        <p className="mb-8 text-gray-600">Thailand training holiday questions from US travelers.</p>
        <GuideFaqList items={FAQ_ITEMS} />
      </GuideSection>

      <RelatedGuides
        guides={[
          { title: 'Muay Thai trip from USA (flights & visas)', href: '/blog/muay-thai-trip-from-usa' },
          { title: 'Best Muay Thai gyms in Phuket', href: '/blog/best-muay-thai-gyms-phuket' },
          { title: 'Best Muay Thai camp for beginners', href: '/blog/best-muay-thai-camp-thailand-beginners' },
          { title: '1-week vs 1-month Muay Thai camps', href: '/blog/muay-thai-camp-1-week-vs-1-month' },
        ]}
      />
    </ArticleShell>
  )
}
