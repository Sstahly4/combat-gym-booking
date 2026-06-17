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

/**
 * Phase 4 prep — not in sitemap.ts, llms.txt, or /blog index until indexing runway clears.
 * Remove `robots: { index: false }` from metadata when launching.
 */
const TITLE = 'Muay Thai Trip From Europe: 2026 Planning & Camp Booking'
const SEO_TITLE = TITLE
const PATH = '/blog/muay-thai-trip-from-europe'
const DATE_PUBLISHED = '2026-06-11'
const DATE_MODIFIED = '2026-06-11'
const HERO_IMAGE = '/481020258.avif'
const DESCRIPTION =
  'Plan a Muay Thai trip from Europe to Thailand. EUR and THB budgets, EU 60-day entry rules, flights from AMS/FRA/CDG, and bookable camps.'

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
    q: 'How much does a Muay Thai trip to Thailand cost from Europe?',
    a: 'A two-week trip with economy flights, mid-range accommodation, daily training, food, and local transport often lands between roughly EUR 1,500 and EUR 3,900+ depending on city, season, and hub. Amsterdam, Frankfurt, and Paris fares drive most of the variance. Compare camp packages on CombatStay, then add your airfare quote from home.',
  },
  {
    q: 'Do EU passport holders need a visa to train Muay Thai in Thailand?',
    a: 'Most EU and EEA passport holders enter Thailand on a visa exemption for tourism stays up to 60 days under current rules, subject to Thai immigration policy. Training at a commercial camp counts as tourism for short visits. Confirm allowed stay length on your local Royal Thai Embassy website before you book. Longer stays may need a tourist visa or DTV. CombatStay does not provide legal advice.',
  },
  {
    q: 'Which European airports connect best to Bangkok or Phuket?',
    a: 'Frankfurt (FRA), Amsterdam (AMS), and Paris Charles de Gaulle (CDG) run daily one-stop or direct routes to Bangkok (BKK). Munich (MUC), Copenhagen (CPH), and Stockholm (ARN) work well for Germany and Nordic departures. Connect domestically to Phuket (HKT) or Chiang Mai (CNX) if your camp is outside Bangkok.',
  },
  {
    q: 'How long is the flight from Europe to Thailand?',
    a: 'Frankfurt or Paris to Bangkok runs about 10 to 11 hours nonstop where direct services operate, or 13 to 17 hours with one stop in the Gulf or Asia. Budget a full calendar day each way once airport time and the time-zone shift are included.',
  },
  {
    q: 'What is the DTV visa and do European fighters need it?',
    a: 'The Destination Thailand Visa (DTV) is one route for longer stays that include eligible activities. Short training trips often fit inside the 60-day exemption. Read our DTV overview and verify requirements on your Royal Thai Embassy site before you apply.',
  },
  {
    q: 'When is the best time for Europeans to train in Thailand?',
    a: 'November through February is Thai cool season and overlaps with European winter sun demand: easier morning runs, higher flight prices. April is brutally hot. May through October is wet season on the Andaman coast (Phuket, Krabi).',
  },
  {
    q: 'Does European travel insurance cover Muay Thai training?',
    a: 'Many standard policies exclude combat sports or require a sports upgrade. Read the policy wording for martial arts, pad work, and sparring. Declare training when you buy coverage. EHIC or GHIC cards do not replace travel insurance outside the EU.',
  },
  {
    q: 'Bangkok, Phuket, or Chiang Mai from Europe?',
    a: 'Chiang Mai suits beginners and long stays: lower costs, cooler mornings November to February. Phuket suits beach access and island camps. Bangkok suits fight-night access and maximum gym choice if you tolerate traffic.',
  },
  {
    q: 'Can I train on the first day after flying from Europe?',
    a: 'Land, clear immigration, reach your accommodation, eat, sleep. Start training the next afternoon if you flew overnight. Jet lag from Central Europe to Bangkok is a five- to six-hour forward shift. Your first session should be light pad work.',
  },
  {
    q: 'What should European travelers pack for a Muay Thai trip?',
    a: 'Bring hand wraps, mouthguard, light training clothes, running shoes, and a travel adapter. Type A, B, C, and F sockets appear in Thailand; a universal adapter covers most rooms. Buy gloves and shin guards locally to save luggage weight.',
  },
]

export default function MuayThaiTripFromEuropePage() {
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
      subtitle="EU and EEA passport holders typically receive a 60-day visa exemption for tourism under current Thai rules. That covers most two-to-four-week training trips before you need DTV or another long-stay category."
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
        imageAlt="Muay Thai training in Thailand for European travelers"
        priority
        overlayText="Ten hours from Frankfurt. Plan day one as recovery, not a double session."
      />

      <GuideLeadRow
        tocItems={[
          { href: '#why-europe', label: 'Why Europeans go' },
          { href: '#flights', label: 'Flights' },
          { href: '#visa', label: '60-day entry' },
          { href: '#budget', label: 'EUR budget' },
          { href: '#listings', label: 'Book camps' },
          { href: '#timing', label: 'Best time' },
          { href: '#arrival', label: 'First 48 hours' },
          { href: '#faq', label: 'FAQ' },
        ]}
        statValue="60 days"
        statDescription="Visa exemption stay for EU/EEA passport holders under current Thai tourism rules (confirm before you fly)."
        statIcon={<Shield className="h-5 w-5" />}
      />

      <section id="why-europe" className="mb-14 scroll-mt-24">
        <GuideAccentIntro
          icon={Plane}
          title="Why Thailand is the default Muay Thai trip from Europe"
          subtitle="Winter sun plus coaching depth at EUR-friendly prices"
        />
        <div className="prose prose-gray max-w-none space-y-4 text-base leading-relaxed text-gray-800 md:prose-lg">
          <p>
            Travelers from the Netherlands, Germany, and Sweden fly to Thailand for Muay Thai because winter sun pairs
            with daily access to Thai coaches at a fraction of Amsterdam or Berlin gym prices. The flight is long but
            manageable for a two-week block inside annual leave.
          </p>
          <p>
            This guide covers the Europe side: hub airports, the 60-day exemption for EU passport holders, EUR and THB
            budgeting, and DTV pointers for longer stays. For camp selection, read{' '}
            <Link href="/blog/best-muay-thai-camp-thailand-beginners" className="font-medium text-[#003580] underline">
              best Muay Thai camp for beginners
            </Link>
            . For a holiday pace, see{' '}
            <Link href="/blog/thailand-training-holiday-europe" className="font-medium text-[#003580] underline">
              Thailand training holiday for European travelers
            </Link>
            .
          </p>
        </div>
      </section>

      <GuideSection id="flights" variant="slate" className="mb-14">
        <h2 className="mb-6 text-2xl font-bold text-gray-900 md:text-3xl">Flights: European hubs to Thailand</h2>
        <GuideThreeCards
          items={[
            {
              title: 'Frankfurt (FRA) → Bangkok (BKK)',
              body: 'Lufthansa and Thai Airways run direct or one-stop services. Strong hub for Germany, Austria, and Central Europe. Connect domestically to Phuket or Chiang Mai on arrival day or the next morning.',
            },
            {
              title: 'Amsterdam (AMS) → Bangkok (BKK)',
              body: 'KLM and partners fly daily one-stop via the Gulf or direct on select dates. Primary gateway for the Netherlands and Belgium. Compare AMS vs Düsseldorf or Brussels for fare dips.',
            },
            {
              title: 'Paris (CDG) → Bangkok (BKK) or Phuket (HKT)',
              body: 'Air France and Thai serve CDG–BKK. One-stop Phuket fares often route through Bangkok or Singapore. Works for France and southern EU departures.',
            },
          ]}
        />
        <div className="mt-8 space-y-3 text-sm leading-relaxed text-gray-700">
          <p>
            Nordic travelers often connect through Copenhagen (CPH) or Stockholm (ARN) into FRA or AMS before the long
            haul. Book flights before you lock camp dates if you travel in December, January, or European school holidays.
            Mid-week departures from major hubs often beat Friday premiums.
          </p>
        </div>
      </GuideSection>

      <section id="visa" className="mb-14 scroll-mt-24">
        <GuideAccentIntro
          icon={Shield}
          title="60-day visa exemption for EU and EEA passport holders"
          subtitle="Schengen area travel does not replace Thai entry rules"
        />
        <div className="prose prose-gray max-w-none space-y-4 text-base leading-relaxed text-gray-800 md:prose-lg">
          <p>
            EU and EEA citizens typically enter Thailand under a <strong>60-day visa exemption</strong> for tourism,
            subject to current Thai immigration rules. Your passport nationality governs entry, not your Schengen
            residence permit alone. Training at a commercial camp falls under tourism for visits within that window.
          </p>
          <p>
            Stays beyond 60 days need a tourist visa, DTV, or another eligible category. European travelers planning one
            to three months often research the Destination Thailand Visa. Start with the{' '}
            <Link href="/blog/thailand-training-visa-dtv" className="font-medium text-[#003580] underline">
              Thailand training visa / DTV overview
            </Link>{' '}
            and verify on your local Royal Thai Embassy site (
            <a
              href="https://thaiembassy.org/the-hague/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-[#003580] underline"
            >
              The Hague
            </a>
            ,{' '}
            <a
              href="https://thaiembassy.org/berlin/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-[#003580] underline"
            >
              Berlin
            </a>
            , or{' '}
            <a
              href="https://thailand.se/en/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-[#003580] underline"
            >
              Stockholm
            </a>
            ).
          </p>
          <p>
            Carry proof of onward flight, accommodation booking, and travel insurance in your carry-on. Immigration
            officers may ask how long you plan to train.
          </p>
        </div>
      </section>

      <GuideSection id="budget" variant="default" className="mb-14 border border-gray-200 bg-white">
        <GuideAccentIntro icon={Wallet} title="EUR budget for a Muay Thai trip from Europe" subtitle="THB reference included" />
        <div className="grid gap-8 md:grid-cols-2">
          <div className="space-y-4 text-sm leading-relaxed text-gray-700">
            <h3 className="text-lg font-semibold text-gray-900">Two-week ballpark (per person)</h3>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong>Flights (economy return):</strong> EUR 580–1,280+ from FRA, AMS, or CDG depending on season and
                direct vs one-stop.
              </li>
              <li>
                <strong>Training:</strong> EUR 170–680+ for daily drop-ins or weekly packages (roughly 7,000–25,000 THB).
              </li>
              <li>
                <strong>Accommodation:</strong> EUR 300–850+ for two weeks outside ultra-budget hostels.
              </li>
              <li>
                <strong>Food and local transport:</strong> EUR 170–420+.
              </li>
              <li>
                <strong>Insurance (with sports cover):</strong> EUR 55–160+ for the trip length.
              </li>
            </ul>
            <p>
              Total often lands EUR 1,500–3,900+ before tours or fight tickets. Phuket and Bangkok sit at the top;
              Chiang Mai usually sits lower.
            </p>
          </div>
          <div className="space-y-4 text-sm leading-relaxed text-gray-700">
            <h3 className="text-lg font-semibold text-gray-900">Ways to save</h3>
            <ul className="list-disc space-y-2 pl-5">
              <li>Book weekly camp packages instead of daily drop-ins after day three.</li>
              <li>Compare FRA, AMS, and CDG on the same dates; one hub can save EUR 150+.</li>
              <li>Stay within walking distance of the gym to cut daily Grab costs.</li>
              <li>
                Use{' '}
                <Link href="/blog/muay-thai-camp-thailand-cost" className="font-medium text-[#003580] underline">
                  2026 Thailand camp cost ranges
                </Link>{' '}
                to compare cities before you convert to EUR.
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
        <GuideAccentIntro icon={Clock} title="Best time for Europeans to train in Thailand" subtitle="Winter sun and school holidays" />
        <div className="prose prose-gray max-w-none space-y-4 text-base leading-relaxed text-gray-800 md:prose-lg">
          <p>
            <strong>November–February:</strong> Thai cool season overlaps European winter. Peak demand means higher flights
            and fuller camps. Book early.
          </p>
          <p>
            <strong>February and October school breaks:</strong> Popular leave windows for two-week training blocks in the
            Netherlands, Germany, and Sweden.
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
              body: 'One afternoon session only. Tell coaches you just arrived from Europe. Focus on stance and pads.',
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
        title="Book your Thailand camp from Europe"
        subtitle="Verified gyms with live pricing. Filter by accommodation and instant checkout."
        href="/search?country=Thailand&discipline=Muay%20Thai&accommodation=true"
        buttonLabel="Browse stay-and-train camps"
      />

      <GuideSection id="faq" variant="default" padding="p-6 md:p-8" className="mb-14 shadow-sm">
        <h2 className="mb-2 text-2xl font-bold text-gray-900 md:text-3xl">FAQ</h2>
        <p className="mb-8 text-gray-600">Common questions from European travelers planning a Muay Thai trip to Thailand.</p>
        <GuideFaqList items={FAQ_ITEMS} />
      </GuideSection>

      <RelatedGuides
        guides={[
          { title: 'Thailand training holiday for European travelers', href: '/blog/thailand-training-holiday-europe' },
          { title: 'Thailand training camp with accommodation', href: '/blog/thailand-training-camp-with-accommodation' },
          { title: 'Thailand training visa / DTV guide', href: '/blog/thailand-training-visa-dtv' },
          { title: 'Best Muay Thai camp in Thailand for beginners', href: '/blog/best-muay-thai-camp-thailand-beginners' },
          { title: 'Combat sports travel guide to Thailand (2026)', href: '/blog/combat-sports-travel-guide-thailand-2026' },
        ]}
      />
    </ArticleShell>
  )
}
