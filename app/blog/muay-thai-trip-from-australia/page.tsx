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
import { Clock, Plane, Shield, Wallet } from 'lucide-react'

const TITLE = 'Muay Thai Trip from Australia: Flights, Visas, Budget and Planning (2026)'
const SEO_TITLE = 'Muay Thai Trip from Australia 2026 [Flights, Visa, AUD Budget]'
const PATH = '/blog/muay-thai-trip-from-australia'
const DATE_PUBLISHED = '2026-06-08'
const DATE_MODIFIED = '2026-06-08'
const HERO_IMAGE = '/481020258.avif'
const DESCRIPTION =
  'Flying from Sydney, Melbourne, or Brisbane to train Muay Thai in Thailand? Flights, visa rules for Australians, AUD budget ranges, jet lag, and a 14-day trip template.'

export const metadata: Metadata = {
  title: `${SEO_TITLE} | CombatStay`,
  description: DESCRIPTION,
  alternates: { canonical: PATH },
  openGraph: { title: `${SEO_TITLE} | CombatStay`, description: DESCRIPTION, type: 'article' },
  twitter: { card: 'summary_large_image', title: `${SEO_TITLE} | CombatStay`, description: DESCRIPTION },
}

const FAQ_ITEMS = [
  {
    q: 'Do Australians need a visa to train Muay Thai in Thailand?',
    a: 'Most Australian passport holders enter Thailand on a visa exemption for tourism stays within the current limit set by Thai immigration. Training at a camp is still tourism for short trips. Confirm your allowed stay length on the Royal Thai Embassy (Canberra) website before you book flights. Longer stays may need a tourist visa or DTV. CombatStay does not provide legal advice.',
  },
  {
    q: 'Which Thai airport should Australians fly into for Muay Thai?',
    a: 'Bangkok (BKK) suits most first trips: direct flights from Sydney and Melbourne, easy domestic connections to Chiang Mai (CNX) or Phuket (HKT). Fly direct to Phuket if your camp is on the island and you want to skip Bangkok traffic. Fly to Chiang Mai if your camp is in the north and you found a one-stop fare that saves a day.',
  },
  {
    q: 'How long is the flight from Australia to Thailand?',
    a: 'Direct Sydney or Melbourne to Bangkok runs about nine hours. Brisbane is similar. Add two to five hours if you connect through Singapore, Kuala Lumpur, or Doha. Budget a full calendar day each way once airport time and time-zone shift are included.',
  },
  {
    q: 'How much does a Muay Thai trip from Australia cost in AUD?',
    a: 'A two-week trip with economy flights, mid-range accommodation, daily training, food, and local transport often lands between roughly AUD 2,500 and AUD 5,000+ depending on city, season, and flight sale timing. Flights dominate the variance. Compare camp packages on CombatStay, then add your airfare quote from home.',
  },
  {
    q: 'When is the best time for Australians to train in Thailand?',
    a: 'November through February aligns Thai cool season with Australian summer holidays: easier morning runs in Chiang Mai and Bangkok, peak flight prices. April is brutally hot. May through October is wet season on the Andaman coast (Phuket, Krabi); Gulf islands (Koh Samui) differ. Pick weather tolerance before you pick a camp.',
  },
  {
    q: 'Does Australian travel insurance cover Muay Thai training?',
    a: 'Many standard policies exclude combat sports or require a sports upgrade. Read the product disclosure statement for martial arts, pad work, and sparring. Declare training when you buy the policy. Do not assume your credit-card travel insurance covers gym sessions.',
  },
  {
    q: 'What should Australians pack for a Muay Thai trip?',
    a: 'Bring hand wraps, mouthguard, light training clothes, running shoes, and a power adapter (Type A/B/C plugs common; many Thai sockets accept two-pin flat plugs). Buy gloves and shin guards in Thailand to save luggage weight. See our Thailand combat sports packing list for the full breakdown.',
  },
  {
    q: 'How do Australians handle money in Thailand?',
    a: 'Cards work at camps, malls, and many restaurants. ATMs charge Thai-side fees; withdraw fewer, larger amounts. Notify your bank of travel dates. Some travelers carry a mix of card and cash for street food and small shops. CombatStay checkout runs in the gym currency with card payment.',
  },
  {
    q: 'Bangkok, Phuket, or Chiang Mai from Australia?',
    a: 'Chiang Mai suits beginners and long stays: lower costs, cooler mornings November to February. Phuket suits beach access and island camps with direct or one-stop flights in peak season. Bangkok suits fight-night access and maximum gym choice if you tolerate heat and traffic. Match city to your camp shortlist, not a gym you saw on social media.',
  },
  {
    q: 'Can I train on the first day after flying from Australia?',
    a: 'Land, clear immigration, reach your accommodation, eat, sleep. Start training the next afternoon if you slept on the plane poorly. Jet lag from Australia to Thailand is a three-hour forward shift (Bangkok). Your first session should be light pad work, not a double session to make up for travel day.',
  },
]

export default function MuayThaiTripFromAustraliaPage() {
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
    { name: 'Australia', path: PATH },
    { name: TITLE, path: PATH },
  ])

  return (
    <ArticleShell
      title={TITLE}
      subtitle="You are booking from Australia, not Europe. Flight hubs, AUD math, and immigration rules for Australian passport holders shape this trip before you pick a gym."
      breadcrumbs={[
        { label: 'Training Guides', href: '/blog' },
        { label: 'Australia → Thailand', href: PATH },
      ]}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <GuideHero
        imageSrc={HERO_IMAGE}
        imageAlt="Muay Thai training in Thailand for Australian travelers"
        priority
        overlayText="Nine hours to Bangkok. Three hours forward on the clock. Plan day one as recovery, not a double session."
      />

      <GuideLeadRow
        tocItems={[
          { href: '#why-au', label: 'Why Australians go' },
          { href: '#flights', label: 'Flights & airports' },
          { href: '#visa', label: 'Visa & entry' },
          { href: '#budget', label: 'AUD budget' },
          { href: '#timing', label: 'Best time to go' },
          { href: '#arrival', label: 'First 48 hours' },
          { href: '#itinerary', label: '14-day template' },
          { href: '#faq', label: 'FAQ' },
        ]}
        statValue="~9 hr"
        statDescription="Typical direct flight time from Sydney or Melbourne to Bangkok Suvarnabhumi (BKK)."
        statIcon={<Plane className="h-5 w-5" />}
      />

      <section id="why-au" className="mb-14 scroll-mt-24">
        <GuideAccentIntro
          icon={Plane}
          title="Why Thailand is the default Muay Thai trip from Australia"
          subtitle="Distance, price, and coaching depth"
        />
        <div className="prose prose-gray max-w-none space-y-4 text-base leading-relaxed text-gray-800 md:prose-lg">
          <p>
            Australians fly to Thailand for Muay Thai for the same reason they fly to Bali for surf: the coaching depth
            is unmatched at home, the cost per training hour is lower, and the flight is short enough for a two-week
            block inside annual leave.
          </p>
          <p>
            A quality pad session in Sydney or Melbourne can cost what a full day of training plus lunch costs in Chiang
            Mai. You also get daily access to coaches who grew up in the sport, not a single seminar weekend once a
            quarter.
          </p>
          <p>
            This guide covers the Australian side of the trip: airports, visas, AUD budgeting, and arrival logistics.
            For camp selection, read{' '}
            <Link href="/blog/best-muay-thai-camp-thailand-beginners" className="font-medium text-[#003580] underline">
              best Muay Thai camp for beginners
            </Link>{' '}
            or browse{' '}
            <Link href="/search?country=Thailand&discipline=Muay%20Thai" className="font-medium text-[#003580] underline">
              Thailand listings on CombatStay
            </Link>
            . For a holiday-style trip with rest days built in, see our{' '}
            <Link href="/blog/thailand-training-holiday-australia" className="font-medium text-[#003580] underline">
              Thailand training holiday guide for Australians
            </Link>
            .
          </p>
        </div>
      </section>

      <GuideSection id="flights" variant="slate" className="mb-14">
        <h2 className="mb-6 text-2xl font-bold text-gray-900 md:text-3xl">Flights: where Australians land</h2>
        <GuideThreeCards
          items={[
            {
              title: 'Bangkok (BKK)',
              body: 'Direct routes from Sydney and Melbourne on Thai Airways, Jetstar, and seasonal carriers. Hub for domestic flights to Chiang Mai and Phuket. Best if you want gym choice in the capital or a cheap onward ticket.',
            },
            {
              title: 'Phuket (HKT)',
              body: 'Direct or one-stop flights in peak season. Land here if your camp is in Rawai, Patong, or Chalong and you want to skip Bangkok entirely. Andaman wet season (May–Oct) affects island plans.',
            },
            {
              title: 'Chiang Mai (CNX)',
              body: 'Most Australians connect through Bangkok. Occasionally one-stop via Singapore or Kuala Lumpur. Worth it if your camp is in the north and you want to avoid an extra domestic leg on arrival day.',
            },
          ]}
        />
        <div className="mt-8 space-y-3 text-sm leading-relaxed text-gray-700">
          <p>
            Book flights before you lock camp dates if you are traveling in December or January. Australian school
            holidays overlap Thai high season and fares spike. Mid-week departures from Sydney often beat Friday
            night premiums.
          </p>
          <p>
            Check baggage allowance before you pack gloves. Many economy fares to Thailand include 23 kg checked;
            full Muay Thai kit plus clothes can push you over if you buy heavy gear at home.
          </p>
        </div>
      </GuideSection>

      <section id="visa" className="mb-14 scroll-mt-24">
        <GuideAccentIntro icon={Shield} title="Visa and entry for Australian passport holders" subtitle="Confirm before you fly" />
        <div className="prose prose-gray max-w-none space-y-4 text-base leading-relaxed text-gray-800 md:prose-lg">
          <p>
            Australian citizens typically enter Thailand under a visa exemption for tourism, subject to current Thai
            immigration rules and permitted stay length. Training at a commercial camp falls under tourism for short
            visits. Immigration officers care about your allowed days and proof of onward travel, not your gym brand.
          </p>
          <p>
            Stays beyond the exemption window need a tourist visa or another eligible category. Australians planning
            one to three months often research the Destination Thailand Visa (DTV) or education routes. Start with the{' '}
            <Link href="/blog/thailand-training-visa-dtv" className="font-medium text-[#003580] underline">
              Thailand training visa / DTV overview
            </Link>{' '}
            and verify everything on{' '}
            <a
              href="https://thaiembdc.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-[#003580] underline"
            >
              Royal Thai Embassy, Canberra
            </a>
            .
          </p>
          <p>
            Carry proof of onward flight, accommodation booking, and travel insurance details in your carry-on. Have
            your CombatStay confirmation accessible on your phone if immigration asks where you are staying.
          </p>
        </div>
      </section>

      <GuideSection id="budget" variant="default" className="mb-14 border border-gray-200 bg-white">
        <GuideAccentIntro icon={Wallet} title="AUD budget for a Muay Thai trip from Australia" subtitle="Where the money goes" />
        <div className="grid gap-8 md:grid-cols-2">
          <div className="space-y-4 text-sm leading-relaxed text-gray-700">
            <h3 className="text-lg font-semibold text-gray-900">Two-week ballpark (per person)</h3>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong>Flights (economy return):</strong> AUD 800–1,800+ depending on city, season, and sale timing.
              </li>
              <li>
                <strong>Training:</strong> AUD 300–900+ for daily drop-ins or weekly packages; all-inclusive camps run
                higher.
              </li>
              <li>
                <strong>Accommodation:</strong> AUD 400–1,200+ for two weeks outside ultra-budget hostels.
              </li>
              <li>
                <strong>Food and local transport:</strong> AUD 250–600+; street food keeps this low, tourist zones push
                it up.
              </li>
              <li>
                <strong>Insurance (with sports cover):</strong> AUD 80–200+ for the trip length.
              </li>
            </ul>
            <p>
              Total often lands AUD 2,500–5,000+ before shopping, tours, or fight tickets. Phuket and Bangkok sit at
              the top of the range; Chiang Mai usually sits lower for the same training volume.
            </p>
          </div>
          <div className="space-y-4 text-sm leading-relaxed text-gray-700">
            <h3 className="text-lg font-semibold text-gray-900">Ways Australians save</h3>
            <ul className="list-disc space-y-2 pl-5">
              <li>Book weekly or monthly camp packages instead of daily drop-ins after day three.</li>
              <li>Stay within walking distance of the gym to kill daily Grab costs.</li>
              <li>Fly mid-week and shoulder season (March, late October) when fares dip.</li>
              <li>Buy gloves and shins in Thailand instead of paying excess baggage both ways.</li>
              <li>Use{' '}
                <Link href="/blog/muay-thai-camp-thailand-cost" className="font-medium text-[#003580] underline">
                  2026 Thailand camp cost ranges
                </Link>{' '}
                to compare cities before you convert to AUD.
              </li>
            </ul>
          </div>
        </div>
      </GuideSection>

      <GuideSection id="timing" variant="slate" className="mb-14">
        <GuideAccentIntro icon={Clock} title="Best time for Australians to train in Thailand" subtitle="Seasons and leave windows" />
        <div className="prose prose-gray max-w-none space-y-4 text-base leading-relaxed text-gray-800 md:prose-lg">
          <p>
            <strong>November–February:</strong> Thai cool season. Chiang Mai mornings can feel almost crisp. Peak demand
            from Australian summer holidays means higher flights and fuller camps. Book early.
          </p>
          <p>
            <strong>March–April:</strong> Rising heat. Songkran (mid-April) disrupts schedules in some cities. Training
            is viable with lighter volume and more hydration.
          </p>
          <p>
            <strong>May–October:</strong> Wet season on the Andaman side (Phuket, Krabi). Koh Samui and Koh Phangan on
            the Gulf follow a different rain pattern. Flights can be cheaper; plan indoor-heavy afternoons if storms
            hit.
          </p>
          <p>
            Align leave with your gym booking. Most Australians use two weeks of annual leave plus a public holiday
            bridge for a 16-day trip. Four weeks unlocks real technique change if your visa and budget allow.
          </p>
        </div>
      </GuideSection>

      <section id="arrival" className="mb-14 scroll-mt-24">
        <h2 className="mb-6 text-2xl font-bold text-gray-900 md:text-3xl">First 48 hours after landing</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {[
            {
              title: 'Day 0 (arrival)',
              body: 'Clear immigration, grab a SIM or eSIM at the airport, transit to accommodation, eat a proper meal, shower, sleep. Skip the evening session if you flew overnight.',
            },
            {
              title: 'Day 1',
              body: 'One afternoon session only. Introduce yourself to coaches as a new arrival from Australia. Focus on stance and pad rhythm. Buy water and electrolytes locally.',
            },
            {
              title: 'Day 2',
              body: 'Repeat one session. Add a short walk or light stretch in the morning if you slept well. Map the route to the gym at the time you will commute.',
            },
            {
              title: 'Day 3 onward',
              body: 'Follow the camp schedule. Add a second daily session only after sleep and food keep up. Read our packing list if you forgot wraps or mouthguard.',
            },
          ].map((item) => (
            <div key={item.title} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-gray-900">{item.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-gray-700">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <GuideSection id="itinerary" variant="amber" className="mb-14">
        <h2 className="mb-4 text-2xl font-bold text-gray-900 md:text-3xl">Sample 14-day Muay Thai trip from Australia</h2>
        <p className="mb-6 max-w-3xl text-sm leading-relaxed text-gray-700">
          Assumes you fly into Bangkok, connect to Chiang Mai or Phuket, and book a beginner-friendly camp with afternoon
          classes. Adjust days if you land direct on an island.
        </p>
        <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-gray-800">
          <li>Day 0: Arrive, check in, sleep.</li>
          <li>Days 1–5: One session per day, fundamentals and pads, no sparring.</li>
          <li>Day 6: Rest or light stretch; laundry and gear shopping.</li>
          <li>Days 7–11: One or two sessions on days you recover well; optional morning run.</li>
          <li>Day 12: Light session; pack and confirm airport transfer.</li>
          <li>Day 13: Travel to BKK or direct international airport; overnight flight home optional.</li>
          <li>Day 14: Land in Australia; take two easy days before hard training at home.</li>
        </ol>
        <p className="mt-6 text-sm leading-relaxed text-gray-700">
          Want rest days and beach time in the same trip? That is a training holiday, not a pure training block. See{' '}
          <Link href="/blog/thailand-training-holiday-australia" className="font-medium text-[#003580] underline">
            Thailand training holiday for Australians
          </Link>
          .
        </p>
      </GuideSection>

      <GuideCtaStrip
        title="Book your Thailand camp from Australia"
        subtitle="Verified gyms with live pricing. Lock dates before peak-season flights jump."
        href="/search?country=Thailand&discipline=Muay%20Thai"
        buttonLabel="Browse Thailand camps"
      />

      <GuideSection id="faq" variant="default" padding="p-6 md:p-8" className="mb-14 shadow-sm">
        <h2 className="mb-2 text-2xl font-bold text-gray-900 md:text-3xl">FAQ</h2>
        <p className="mb-8 text-gray-600">Common questions from Australians planning a Muay Thai trip to Thailand.</p>
        <GuideFaqList items={FAQ_ITEMS} />
      </GuideSection>

      <GuideCtaStrip
        variant="light"
        title="Compare camps before you buy flights"
        subtitle="Shortlist on CombatStay, then match your itinerary to gym location and class times."
        href="/search?country=Thailand&discipline=Muay%20Thai"
        buttonLabel="Open Thailand search"
      />

      <RelatedGuides
        guides={[
          { title: 'Thailand training holiday for Australians', href: '/blog/thailand-training-holiday-australia' },
          { title: 'Best Muay Thai camp in Thailand for beginners', href: '/blog/best-muay-thai-camp-thailand-beginners' },
          { title: 'How much does a Muay Thai camp in Thailand cost?', href: '/blog/muay-thai-camp-thailand-cost' },
          { title: 'Packing list for a combat sports camp in Thailand', href: '/blog/packing-list-combat-sports-camp-thailand' },
          { title: 'Combat sports travel guide to Thailand (2026)', href: '/blog/combat-sports-travel-guide-thailand-2026' },
        ]}
      />
    </ArticleShell>
  )
}
