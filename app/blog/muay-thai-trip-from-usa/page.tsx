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

const TITLE = 'Muay Thai Trip From USA: Complete 2026 Guide & Booking'
const SEO_TITLE = TITLE
const PATH = '/blog/muay-thai-trip-from-usa'
const DATE_PUBLISHED = '2026-06-11'
const DATE_MODIFIED = '2026-06-11'
const HERO_IMAGE = '/481020258.avif'
const DESCRIPTION =
  'Planning a Muay Thai trip from the USA? Compare top Thailand camps, calculate costs in USD, view visa rules, and book your stay.'

export const metadata: Metadata = {
  title: `${SEO_TITLE} | CombatStay`,
  description: DESCRIPTION,
  alternates: { canonical: PATH },
  openGraph: { title: `${SEO_TITLE} | CombatStay`, description: DESCRIPTION, type: 'article' },
  twitter: { card: 'summary_large_image', title: `${SEO_TITLE} | CombatStay`, description: DESCRIPTION },
}

const FAQ_ITEMS = [
  {
    q: 'How much does a Muay Thai trip to Thailand cost from the USA?',
    a: 'A two-week trip with economy flights, mid-range accommodation, daily training, food, and local transport often lands between roughly USD 1,800 and USD 4,500+ depending on city, season, and flight timing. West Coast nonstops to Bangkok can run higher than East Coast one-stops. Compare camp packages on CombatStay, then add your airfare quote from home.',
  },
  {
    q: 'Do US citizens need a visa to train Muay Thai in Thailand?',
    a: 'Most US passport holders enter Thailand on a visa exemption for tourism stays up to 60 days under current rules, subject to Thai immigration policy. Training at a commercial camp is tourism for short visits. Confirm allowed stay length on the Royal Thai Embassy (Washington, DC) website before you book. Longer stays may need a tourist visa or DTV. CombatStay does not provide legal advice.',
  },
  {
    q: 'Which Thai airport should Americans fly into for Muay Thai?',
    a: 'Bangkok (BKK) suits most first trips: nonstop or one-stop routes from LAX, SFO, SEA, JFK, and ORD, plus easy domestic connections to Chiang Mai (CNX) or Phuket (HKT). Fly direct to Phuket if your camp is on the island. Fly to Chiang Mai if your camp is in the north and you found a fare that skips an extra domestic leg on arrival day.',
  },
  {
    q: 'How long is the flight from the USA to Thailand?',
    a: 'Nonstop Los Angeles to Bangkok runs about 17 hours. One-stop routes from New York or Chicago often land at 20 to 24 hours total travel time. Budget a full calendar day each way once airport time and the time-zone shift are included.',
  },
  {
    q: 'When is the best time for Americans to train in Thailand?',
    a: 'November through February is Thai cool season: easier morning runs in Chiang Mai and Bangkok, peak flight prices around US winter holidays. April is brutally hot. May through October is wet season on the Andaman coast (Phuket, Krabi). Pick weather tolerance before you pick a camp.',
  },
  {
    q: 'Does US travel insurance cover Muay Thai training?',
    a: 'Many standard policies exclude combat sports or require a sports upgrade. Read the policy for martial arts, pad work, and sparring. Declare training when you buy coverage. Do not assume your credit-card travel insurance covers gym sessions.',
  },
  {
    q: 'Bangkok, Phuket, or Chiang Mai from the USA?',
    a: 'Chiang Mai suits beginners and long stays: lower costs, cooler mornings November to February. Phuket suits beach access and island camps. Bangkok suits fight-night access and maximum gym choice if you tolerate heat and traffic. Match city to your camp shortlist.',
  },
  {
    q: 'Can I train on the first day after flying from the USA?',
    a: 'Land, clear immigration, reach your accommodation, eat, sleep. Start training the next afternoon if you flew overnight. Jet lag from the US East Coast to Bangkok is an 11-hour forward shift. Your first session should be light pad work, not a double session.',
  },
  {
    q: 'What should Americans pack for a Muay Thai trip?',
    a: 'Bring hand wraps, mouthguard, light training clothes, running shoes, and a universal adapter. Buy gloves and shin guards in Thailand to save luggage weight. See our Thailand combat sports packing list for the full breakdown.',
  },
  {
    q: 'How do Americans handle money in Thailand?',
    a: 'Cards work at camps, malls, and many restaurants. ATMs charge Thai-side fees; withdraw fewer, larger amounts. Notify your bank of travel dates. CombatStay checkout runs in the gym currency with card payment.',
  },
]

export default function MuayThaiTripFromUsaPage() {
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
      subtitle="US passport holders get a 60-day visa exemption for tourism under current Thai rules. That covers most two-to-four-week training trips before you need a longer-stay visa category."
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
        imageAlt="Muay Thai training in Thailand for American travelers"
        priority
        overlayText="Plan day one as recovery after a long-haul flight. Technique starts on day two, not at baggage claim."
      />

      <GuideLeadRow
        tocItems={[
          { href: '#why-us', label: 'Why Americans go' },
          { href: '#flights', label: 'Flights' },
          { href: '#visa', label: '60-day entry' },
          { href: '#budget', label: 'USD budget' },
          { href: '#listings', label: 'Book camps' },
          { href: '#timing', label: 'Best time' },
          { href: '#arrival', label: 'First 48 hours' },
          { href: '#faq', label: 'FAQ' },
        ]}
        statValue="60 days"
        statDescription="Visa exemption stay for US passport holders under current Thai tourism rules (confirm before you fly)."
        statIcon={<Shield className="h-5 w-5" />}
      />

      <section id="why-us" className="mb-14 scroll-mt-24">
        <GuideAccentIntro
          icon={Plane}
          title="Why Thailand is the default Muay Thai trip from the USA"
          subtitle="Coaching depth and cost per hour"
        />
        <div className="prose prose-gray max-w-none space-y-4 text-base leading-relaxed text-gray-800 md:prose-lg">
          <p>
            Americans fly to Thailand for Muay Thai because daily access to Thai coaches costs less than boutique
            classes at home, and the sport is embedded in the culture rather than bolted onto a fitness studio.
          </p>
          <p>
            A quality pad session in New York or Los Angeles can cost what a full training day plus lunch costs in
            Chiang Mai. You also get coaches who grew up in the sport, not a quarterly seminar circuit.
          </p>
          <p>
            This guide covers the US side: airports, the 60-day exemption, USD budgeting, and arrival logistics. For
            camp selection, read{' '}
            <Link href="/blog/best-muay-thai-camp-thailand-beginners" className="font-medium text-[#003580] underline">
              best Muay Thai camp for beginners
            </Link>
            . For a holiday pace with rest days, see{' '}
            <Link href="/blog/thailand-training-holiday-usa" className="font-medium text-[#003580] underline">
              Thailand training holiday for US travelers
            </Link>
            .
          </p>
        </div>
      </section>

      <GuideSection id="flights" variant="slate" className="mb-14">
        <h2 className="mb-6 text-2xl font-bold text-gray-900 md:text-3xl">Flights: where Americans land</h2>
        <GuideThreeCards
          items={[
            {
              title: 'Bangkok (BKK)',
              body: 'Nonstop from LAX and one-stop from most US hubs. Best if you want gym choice in the capital or a cheap onward ticket to Chiang Mai or Phuket.',
            },
            {
              title: 'Phuket (HKT)',
              body: 'One-stop via Bangkok, Singapore, or Hong Kong. Land here if your camp is in Chalong or Rawai and you want to skip Bangkok traffic.',
            },
            {
              title: 'Chiang Mai (CNX)',
              body: 'Most Americans connect through Bangkok. Occasionally one-stop via Seoul or Tokyo. Worth it if your camp is in the north.',
            },
          ]}
        />
        <div className="mt-8 space-y-3 text-sm leading-relaxed text-gray-700">
          <p>
            Book flights before you lock camp dates if you travel in December or US spring break. Mid-week departures
            from major hubs often beat Friday premiums.
          </p>
          <p>
            Check baggage allowance before you pack gloves. Economy fares vary from 1 to 2 checked bags depending on
            carrier and fare class.
          </p>
        </div>
      </GuideSection>

      <section id="visa" className="mb-14 scroll-mt-24">
        <GuideAccentIntro icon={Shield} title="60-day visa exemption for US passport holders" subtitle="Confirm on official sources" />
        <div className="prose prose-gray max-w-none space-y-4 text-base leading-relaxed text-gray-800 md:prose-lg">
          <p>
            United States citizens typically enter Thailand under a <strong>60-day visa exemption</strong> for tourism,
            subject to current Thai immigration rules. Training at a commercial camp falls under tourism for visits within
            that window. Immigration officers care about your allowed days and proof of onward travel.
          </p>
          <p>
            Stays beyond 60 days need a tourist visa, DTV, or another eligible category. Start with the{' '}
            <Link href="/blog/thailand-training-visa-dtv" className="font-medium text-[#003580] underline">
              Thailand training visa / DTV overview
            </Link>{' '}
            and verify on the{' '}
            <a
              href="https://thaiembdc.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-[#003580] underline"
            >
              Royal Thai Embassy, Washington DC
            </a>
            .
          </p>
          <p>
            Carry proof of onward flight, accommodation booking, and travel insurance in your carry-on. Keep your
            CombatStay confirmation on your phone if immigration asks where you are staying.
          </p>
        </div>
      </section>

      <GuideSection id="budget" variant="default" className="mb-14 border border-gray-200 bg-white">
        <GuideAccentIntro icon={Wallet} title="USD budget for a Muay Thai trip from the USA" subtitle="THB reference included" />
        <div className="grid gap-8 md:grid-cols-2">
          <div className="space-y-4 text-sm leading-relaxed text-gray-700">
            <h3 className="text-lg font-semibold text-gray-900">Two-week ballpark (per person)</h3>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong>Flights (economy return):</strong> USD 900–2,200+ depending on hub, season, and nonstop vs
                one-stop.
              </li>
              <li>
                <strong>Training:</strong> USD 200–700+ for daily drop-ins or weekly packages (roughly 7,000–25,000 THB).
              </li>
              <li>
                <strong>Accommodation:</strong> USD 350–1,000+ for two weeks outside ultra-budget hostels.
              </li>
              <li>
                <strong>Food and local transport:</strong> USD 200–500+; street food keeps this low.
              </li>
              <li>
                <strong>Insurance (with sports cover):</strong> USD 60–180+ for the trip length.
              </li>
            </ul>
            <p>
              Total often lands USD 1,800–4,500+ before tours or fight tickets. Phuket and Bangkok sit at the top;
              Chiang Mai usually sits lower for the same training volume.
            </p>
          </div>
          <div className="space-y-4 text-sm leading-relaxed text-gray-700">
            <h3 className="text-lg font-semibold text-gray-900">Ways to save</h3>
            <ul className="list-disc space-y-2 pl-5">
              <li>Book weekly camp packages instead of daily drop-ins after day three.</li>
              <li>Stay within walking distance of the gym to cut daily Grab costs.</li>
              <li>Fly shoulder season (March, late October) when fares dip.</li>
              <li>Buy gloves and shins in Thailand instead of paying excess baggage both ways.</li>
              <li>Use{' '}
                <Link href="/blog/muay-thai-camp-thailand-cost" className="font-medium text-[#003580] underline">
                  2026 Thailand camp cost ranges
                </Link>{' '}
                to compare cities before you convert to USD.
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
        <GuideAccentIntro icon={Clock} title="Best time for Americans to train in Thailand" subtitle="Seasons and US holiday windows" />
        <div className="prose prose-gray max-w-none space-y-4 text-base leading-relaxed text-gray-800 md:prose-lg">
          <p>
            <strong>November–February:</strong> Thai cool season. Peak demand from US winter holidays means higher
            flights and fuller camps. Book early.
          </p>
          <p>
            <strong>March–April:</strong> Rising heat. Songkran (mid-April) disrupts schedules in some cities.
          </p>
          <p>
            <strong>May–October:</strong> Wet season on the Andaman side (Phuket, Krabi). Flights can be cheaper.
          </p>
          <p>
            Two weeks of PTO plus a weekend bridge gives most Americans a 16-day block. Four weeks unlocks real
            technique change if your visa and budget allow.
          </p>
        </div>
      </GuideSection>

      <section id="arrival" className="mb-14 scroll-mt-24">
        <h2 className="mb-6 text-2xl font-bold text-gray-900 md:text-3xl">First 48 hours after landing</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {[
            {
              title: 'Day 0 (arrival)',
              body: 'Clear immigration, grab a SIM or eSIM, transit to accommodation, eat, shower, sleep. Skip the evening session if you flew overnight.',
            },
            {
              title: 'Day 1',
              body: 'One afternoon session only. Tell coaches you just arrived from the US. Focus on stance and pad rhythm.',
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
        title="Book your Thailand camp from the USA"
        subtitle="Verified gyms with live pricing. Filter by accommodation and instant checkout."
        href="/search?country=Thailand&discipline=Muay%20Thai&accommodation=true"
        buttonLabel="Browse stay-and-train camps"
      />

      <GuideSection id="faq" variant="default" padding="p-6 md:p-8" className="mb-14 shadow-sm">
        <h2 className="mb-2 text-2xl font-bold text-gray-900 md:text-3xl">FAQ</h2>
        <p className="mb-8 text-gray-600">Common questions from Americans planning a Muay Thai trip to Thailand.</p>
        <GuideFaqList items={FAQ_ITEMS} />
      </GuideSection>

      <RelatedGuides
        guides={[
          { title: 'Thailand training holiday for US travelers', href: '/blog/thailand-training-holiday-usa' },
          { title: 'Thailand training camp with accommodation', href: '/blog/thailand-training-camp-with-accommodation' },
          { title: 'Best Muay Thai camp in Thailand for beginners', href: '/blog/best-muay-thai-camp-thailand-beginners' },
          { title: 'How much does a Muay Thai camp in Thailand cost?', href: '/blog/muay-thai-camp-thailand-cost' },
          { title: 'Combat sports travel guide to Thailand (2026)', href: '/blog/combat-sports-travel-guide-thailand-2026' },
        ]}
      />
    </ArticleShell>
  )
}
