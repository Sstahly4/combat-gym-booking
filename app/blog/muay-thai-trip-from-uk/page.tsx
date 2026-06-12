import type { Metadata } from 'next'
import Link from 'next/link'
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
import { Clock, Plane, Shield, Wallet } from 'lucide-react'

const TITLE = 'Muay Thai Trip From UK: 2026 Planning & Camp Booking'
const SEO_TITLE = TITLE
const PATH = '/blog/muay-thai-trip-from-uk'
const DATE_PUBLISHED = '2026-06-11'
const DATE_MODIFIED = '2026-06-11'
const HERO_IMAGE = '/481020258.avif'
const DESCRIPTION =
  'The ultimate guide to planning a Muay Thai trip from the UK. Explore top-rated Thailand camps, flight tips, DTV visa rules, and live rates.'

export const metadata: Metadata = {
  title: `${SEO_TITLE} | CombatStay`,
  description: DESCRIPTION,
  alternates: { canonical: PATH },
  openGraph: { title: `${SEO_TITLE} | CombatStay`, description: DESCRIPTION, type: 'article' },
  twitter: { card: 'summary_large_image', title: `${SEO_TITLE} | CombatStay`, description: DESCRIPTION },
}

const FAQ_ITEMS = [
  {
    q: 'How much does a Muay Thai trip to Thailand cost from the UK?',
    a: 'A two-week trip with economy flights, mid-range accommodation, daily training, food, and local transport often lands between roughly GBP 1,400 and GBP 3,500+ depending on city, season, and flight timing. London hub fares dominate the variance. Compare camp packages on CombatStay, then add your airfare quote from home.',
  },
  {
    q: 'Do UK citizens need a visa to train Muay Thai in Thailand?',
    a: 'Most British passport holders enter Thailand on a visa exemption for tourism stays up to 60 days under current rules, subject to Thai immigration policy. Training at a commercial camp is tourism for short visits. Confirm allowed stay length on the Royal Thai Embassy (London) website before you book. Longer stays may need a tourist visa or DTV. CombatStay does not provide legal advice.',
  },
  {
    q: 'Which Thai airport should Brits fly into for Muay Thai?',
    a: 'Bangkok (BKK) suits most first trips: one-stop or direct routes from London, Manchester, and Edinburgh, plus easy domestic connections to Chiang Mai (CNX) or Phuket (HKT). Fly direct to Phuket if your camp is on the island. Fly to Chiang Mai if your camp is in the north.',
  },
  {
    q: 'How long is the flight from the UK to Thailand?',
    a: 'London to Bangkok runs about 11 to 12 hours nonstop on direct services, or 14 to 18 hours with one stop in the Gulf or Asia. Budget a full calendar day each way once airport time and the time-zone shift are included.',
  },
  {
    q: 'What is the DTV visa and do UK fighters need it?',
    a: 'The Destination Thailand Visa (DTV) is one route for longer stays that include eligible activities. Short training holidays often fit inside the 60-day exemption. Read our DTV overview and verify requirements on the Royal Thai Embassy London site before you apply.',
  },
  {
    q: 'When is the best time for Brits to train in Thailand?',
    a: 'November through February is Thai cool season and overlaps with UK winter sun demand: easier morning runs, higher flight prices. April is brutally hot. May through October is wet season on the Andaman coast (Phuket, Krabi).',
  },
  {
    q: 'Does UK travel insurance cover Muay Thai training?',
    a: 'Many standard policies exclude combat sports or require a sports upgrade. Read the policy wording for martial arts, pad work, and sparring. Declare training when you buy coverage.',
  },
  {
    q: 'Bangkok, Phuket, or Chiang Mai from the UK?',
    a: 'Chiang Mai suits beginners and long stays: lower costs, cooler mornings November to February. Phuket suits beach access and island camps. Bangkok suits fight-night access and maximum gym choice if you tolerate traffic.',
  },
  {
    q: 'Can I train on the first day after flying from the UK?',
    a: 'Land, clear immigration, reach your accommodation, eat, sleep. Start training the next afternoon if you flew overnight. Jet lag from the UK to Bangkok is a six-hour forward shift. Your first session should be light pad work.',
  },
  {
    q: 'What should UK travelers pack for a Muay Thai trip?',
    a: 'Bring hand wraps, mouthguard, light training clothes, running shoes, and a travel adapter. Type A, B, C, and F sockets appear in Thailand; a universal adapter covers most rooms. Buy gloves and shin guards locally to save luggage weight.',
  },
]

export default function MuayThaiTripFromUkPage() {
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
    { name: 'UK', path: PATH },
    { name: TITLE, path: PATH },
  ])

  return (
    <ArticleShell
      title={TITLE}
      subtitle="UK passport holders get a 60-day visa exemption for tourism under current Thai rules. That covers most two-to-four-week training trips before you need DTV or another long-stay category."
      breadcrumbs={[
        { label: 'Training Guides', href: '/blog' },
        { label: 'UK → Thailand', href: PATH },
      ]}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <GuideHero
        imageSrc={HERO_IMAGE}
        imageAlt="Muay Thai training in Thailand for UK travelers"
        priority
        overlayText="Eleven hours to Bangkok. Plan day one as recovery, not a double session."
      />

      <GuideLeadRow
        tocItems={[
          { href: '#why-uk', label: 'Why Brits go' },
          { href: '#flights', label: 'Flights' },
          { href: '#visa', label: '60-day entry' },
          { href: '#budget', label: 'GBP budget' },
          { href: '#listings', label: 'Book camps' },
          { href: '#timing', label: 'Best time' },
          { href: '#arrival', label: 'First 48 hours' },
          { href: '#faq', label: 'FAQ' },
        ]}
        statValue="60 days"
        statDescription="Visa exemption stay for UK passport holders under current Thai tourism rules (confirm before you fly)."
        statIcon={<Shield className="h-5 w-5" />}
      />

      <section id="why-uk" className="mb-14 scroll-mt-24">
        <GuideAccentIntro
          icon={Plane}
          title="Why Thailand is the default Muay Thai trip from the UK"
          subtitle="Winter sun plus coaching depth"
        />
        <div className="prose prose-gray max-w-none space-y-4 text-base leading-relaxed text-gray-800 md:prose-lg">
          <p>
            Brits fly to Thailand for Muay Thai because winter sun pairs with daily access to Thai coaches at a fraction
            of London gym prices. The flight is long but manageable for a two-week block inside annual leave.
          </p>
          <p>
            This guide covers the UK side: airports, the 60-day exemption, GBP budgeting, and DTV pointers for longer
            stays. For camp selection, read{' '}
            <Link href="/blog/best-muay-thai-camp-thailand-beginners" className="font-medium text-[#003580] underline">
              best Muay Thai camp for beginners
            </Link>
            . For a holiday pace, see{' '}
            <Link href="/blog/thailand-training-holiday-uk" className="font-medium text-[#003580] underline">
              Thailand training holiday for UK travelers
            </Link>
            .
          </p>
        </div>
      </section>

      <GuideSection id="flights" variant="slate" className="mb-14">
        <h2 className="mb-6 text-2xl font-bold text-gray-900 md:text-3xl">Flights: where Brits land</h2>
        <GuideThreeCards
          items={[
            {
              title: 'Bangkok (BKK)',
              body: 'Direct from London Heathrow on Thai Airways and BA seasonal services. One-stop via Doha, Dubai, or Singapore from regional UK airports. Hub for domestic flights to Chiang Mai and Phuket.',
            },
            {
              title: 'Phuket (HKT)',
              body: 'Seasonal direct from London or one-stop via Bangkok or the Gulf. Land here if your camp is in Chalong or Rawai.',
            },
            {
              title: 'Chiang Mai (CNX)',
              body: 'Most Brits connect through Bangkok. Occasionally one-stop via Singapore. Worth it if your camp is in the north.',
            },
          ]}
        />
        <div className="mt-8 space-y-3 text-sm leading-relaxed text-gray-700">
          <p>
            Book flights before you lock camp dates if you travel in December, January, or UK half-term. Mid-week
            departures from London often beat Friday premiums.
          </p>
        </div>
      </GuideSection>

      <section id="visa" className="mb-14 scroll-mt-24">
        <GuideAccentIntro icon={Shield} title="60-day visa exemption and DTV for UK passport holders" subtitle="Confirm before you fly" />
        <div className="prose prose-gray max-w-none space-y-4 text-base leading-relaxed text-gray-800 md:prose-lg">
          <p>
            British citizens typically enter Thailand under a <strong>60-day visa exemption</strong> for tourism,
            subject to current Thai immigration rules. Training at a commercial camp falls under tourism for visits
            within that window.
          </p>
          <p>
            Stays beyond 60 days need a tourist visa, DTV, or another eligible category. UK travelers planning one to
            three months often research the Destination Thailand Visa. Start with the{' '}
            <Link href="/blog/thailand-training-visa-dtv" className="font-medium text-[#003580] underline">
              Thailand training visa / DTV overview
            </Link>{' '}
            and verify on the{' '}
            <a
              href="https://thaiembassy.org/london/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-[#003580] underline"
            >
              Royal Thai Embassy, London
            </a>
            .
          </p>
          <p>
            Carry proof of onward flight, accommodation booking, and travel insurance in your carry-on.
          </p>
        </div>
      </section>

      <GuideSection id="budget" variant="default" className="mb-14 border border-gray-200 bg-white">
        <GuideAccentIntro icon={Wallet} title="GBP budget for a Muay Thai trip from the UK" subtitle="THB reference included" />
        <div className="grid gap-8 md:grid-cols-2">
          <div className="space-y-4 text-sm leading-relaxed text-gray-700">
            <h3 className="text-lg font-semibold text-gray-900">Two-week ballpark (per person)</h3>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong>Flights (economy return):</strong> GBP 550–1,200+ depending on airport, season, and direct vs
                one-stop.
              </li>
              <li>
                <strong>Training:</strong> GBP 160–550+ for daily drop-ins or weekly packages (roughly 7,000–25,000 THB).
              </li>
              <li>
                <strong>Accommodation:</strong> GBP 280–800+ for two weeks outside ultra-budget hostels.
              </li>
              <li>
                <strong>Food and local transport:</strong> GBP 160–400+.
              </li>
              <li>
                <strong>Insurance (with sports cover):</strong> GBP 50–150+ for the trip length.
              </li>
            </ul>
            <p>
              Total often lands GBP 1,400–3,500+ before tours or fight tickets. Phuket and Bangkok sit at the top;
              Chiang Mai usually sits lower.
            </p>
          </div>
          <div className="space-y-4 text-sm leading-relaxed text-gray-700">
            <h3 className="text-lg font-semibold text-gray-900">Ways to save</h3>
            <ul className="list-disc space-y-2 pl-5">
              <li>Book weekly camp packages instead of daily drop-ins after day three.</li>
              <li>Fly from Manchester or Edinburgh when London peak fares spike.</li>
              <li>Stay within walking distance of the gym to cut daily Grab costs.</li>
              <li>Use{' '}
                <Link href="/blog/muay-thai-camp-thailand-cost" className="font-medium text-[#003580] underline">
                  2026 Thailand camp cost ranges
                </Link>{' '}
                to compare cities before you convert to GBP.
              </li>
            </ul>
          </div>
        </div>
      </GuideSection>

      <GuideStayTrainListingBlock
        id="listings"
        title="Compare Thailand camps with accommodation and meals"
        subtitle="Pre-filtered for stay-and-train packages. Book instantly on CombatStay."
      />

      <GuideSection id="timing" variant="slate" className="mb-14">
        <GuideAccentIntro icon={Clock} title="Best time for Brits to train in Thailand" subtitle="Winter sun and school holidays" />
        <div className="prose prose-gray max-w-none space-y-4 text-base leading-relaxed text-gray-800 md:prose-lg">
          <p>
            <strong>November–February:</strong> Thai cool season overlaps UK winter. Peak demand means higher flights
            and fuller camps. Book early.
          </p>
          <p>
            <strong>October half-term and Easter:</strong> Popular leave windows for two-week training blocks.
          </p>
          <p>
            <strong>May–October:</strong> Wet season on the Andaman coast. Flights can be cheaper; plan indoor-heavy
            afternoons if storms hit.
          </p>
        </div>
      </GuideSection>

      <section id="arrival" className="mb-14 scroll-mt-24">
        <h2 className="mb-6 text-2xl font-bold text-gray-900 md:text-3xl">First 48 hours after landing</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {[
            {
              title: 'Day 0 (arrival)',
              body: 'Clear immigration, grab a SIM or eSIM, transit to accommodation, eat, shower, sleep.',
            },
            {
              title: 'Day 1',
              body: 'One afternoon session only. Tell coaches you just arrived from the UK. Focus on stance and pads.',
            },
            {
              title: 'Day 2',
              body: 'Repeat one session. Map the commute at the time you will travel daily.',
            },
            {
              title: 'Day 3 onward',
              body: 'Follow the camp schedule. Add a second daily session only after sleep and food keep up.',
            },
          ].map((item) => (
            <div key={item.title} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-gray-900">{item.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-gray-700">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <GuideCtaStrip
        title="Book your Thailand camp from the UK"
        subtitle="Verified gyms with live pricing. Filter by accommodation and instant checkout."
        href="/search?country=Thailand&discipline=Muay%20Thai&accommodation=true"
        buttonLabel="Browse stay-and-train camps"
      />

      <GuideSection id="faq" variant="default" padding="p-6 md:p-8" className="mb-14 shadow-sm">
        <h2 className="mb-2 text-2xl font-bold text-gray-900 md:text-3xl">FAQ</h2>
        <p className="mb-8 text-gray-600">Common questions from UK travelers planning a Muay Thai trip to Thailand.</p>
        <GuideFaqList items={FAQ_ITEMS} />
      </GuideSection>

      <RelatedGuides
        guides={[
          { title: 'Thailand training holiday for UK travelers', href: '/blog/thailand-training-holiday-uk' },
          { title: 'Thailand training camp with accommodation', href: '/blog/thailand-training-camp-with-accommodation' },
          { title: 'Thailand training visa / DTV guide', href: '/blog/thailand-training-visa-dtv' },
          { title: 'Best Muay Thai camp in Thailand for beginners', href: '/blog/best-muay-thai-camp-thailand-beginners' },
          { title: 'Combat sports travel guide to Thailand (2026)', href: '/blog/combat-sports-travel-guide-thailand-2026' },
        ]}
      />
    </ArticleShell>
  )
}
