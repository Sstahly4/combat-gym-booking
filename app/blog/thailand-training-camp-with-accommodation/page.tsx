import type { Metadata } from 'next'
import Link from 'next/link'
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
import { getThailandGymsForGuide, groupGymsByCity } from '@/lib/guides/thailand-gyms'
import { mergeGymAmenitiesFromDb } from '@/lib/constants/gym-amenities'
import { gymCanonicalPath } from '@/lib/seo/gym-canonical-path'
import { buildArticleLd, buildBreadcrumbLd, buildFaqLd, buildGymItemListLd } from '@/lib/seo/guide-schema'
import { BedDouble, CheckSquare, ClipboardList, MapPin, Table2 } from 'lucide-react'

const TITLE = 'Thailand Training Camp with Accommodation (2026)'
const SEO_TITLE = 'Thailand Training Camp with Accommodation 2026 [Compare & Book]'
const PATH = '/blog/thailand-training-camp-with-accommodation'
const DATE_PUBLISHED = '2026-06-11'
const DATE_MODIFIED = '2026-06-11'
const HERO_IMAGE = '/481020258.avif'
const DESCRIPTION =
  'Compare Thailand training camps that include accommodation: what train-and-stay packages cover, city price bands, and live bookable listings with verified inclusions.'

export const metadata: Metadata = {
  title: `${SEO_TITLE} | CombatStay`,
  description: DESCRIPTION,
  alternates: { canonical: PATH },
  openGraph: { title: `${SEO_TITLE} | CombatStay`, description: DESCRIPTION, type: 'article' },
  twitter: { card: 'summary_large_image', title: `${SEO_TITLE} | CombatStay`, description: DESCRIPTION },
}

function yesNo(v: boolean) {
  return v ? 'Yes' : '—'
}

function money(n: number | null | undefined, currency?: string | null) {
  if (typeof n !== 'number' || !Number.isFinite(n) || n <= 0) return '—'
  return `${currency || ''} ${Math.round(n)}`.trim()
}

const FAQ_ITEMS = [
  {
    q: 'What is a Thailand training camp with accommodation?',
    a: 'It is a stay-and-train package where your booking includes a place to sleep plus scheduled training sessions. Some camps house you on-site in dorms or private rooms. Others bundle partner guesthouses within walking distance. Always confirm whether the room is on the gym property or a separate address before you pay.',
  },
  {
    q: 'What does all-inclusive mean at a Muay Thai camp?',
    a: 'There is no standard legal definition. On CombatStay listings it usually means training plus accommodation, and sometimes meals, airport transfer, or laundry. Read the package page line by line. A camp that calls itself all-inclusive but only includes breakfast is still common.',
  },
  {
    q: 'Is on-site accommodation worth the extra cost?',
    a: 'For two-a-day schedules, usually yes. You remove commute friction, which is the main reason travelers miss afternoon sessions by week two. If you train once per day and want a beach condo, a nearby guesthouse can cost less than an on-site bundle.',
  },
  {
    q: 'How much does a training camp with accommodation cost in Thailand?',
    a: 'Day rates vary by city and room tier. Chiang Mai and Pattaya often run lower than Phuket for comparable packages. A dorm or fan room bundle can sit well under a private AC room at the same gym. Use live package prices on each gym profile rather than blog estimates.',
  },
  {
    q: 'Which cities are best for stay-and-train packages?',
    a: 'Phuket has the largest inventory of camps with on-site housing and resort-style facilities. Chiang Mai suits long stays with cooler mornings and lower food costs. Krabi works for travelers who want limestone coast access without Phuket peak-season pricing. Bangkok fits if you want stadium culture and accept traffic between gym and room.',
  },
  {
    q: 'Are meals included in accommodation packages?',
    a: 'Sometimes. Many camps include one or two meals per day, often breakfast and dinner with Thai home-style food. Western menu options, protein shakes, and lunch are frequently add-ons. Filter gym listings for the meals amenity, then open the package to see the meal plan details field.',
  },
  {
    q: 'Do I need to book accommodation separately from training?',
    a: 'Only if you choose a training-only package or the gym has no housing. Booking training and room in one package locks your total price and keeps cancellation rules in one place. Split bookings can save money but add coordination risk if dates or gym location change.',
  },
  {
    q: 'What room type should I choose: dorm, fan private, or AC private?',
    a: 'Pick sleep quality first. Dorms cost less but share bathroom noise and schedules. Fan rooms work in Chiang Mai high season; Phuket and Bangkok afternoon heat make AC a recovery tool, not a luxury. Confirm whether AC is in your assigned room, not just the gym floor.',
  },
  {
    q: 'How do I verify what is included before I pay?',
    a: 'Check the package name, includes_accommodation and includes_meals flags, minimum stay days, and cancellation policy on the gym profile. Message the gym through CombatStay if laundry, airport pickup, or rest-day schedule is unclear. Screenshot the inclusion list at booking time.',
  },
  {
    q: 'Can I book a Thailand training camp with accommodation on CombatStay?',
    a: 'Yes. Search Thailand, filter by discipline and dates, then open gym profiles that list accommodation or all-inclusive packages. You pay through Stripe with instant confirmation. No deposit DMs or manual invoice chains.',
  },
]

const CITY_NOTES: Array<{
  city: string
  searchHref: string
  guideHref?: string
  blurb: string
}> = [
  {
    city: 'Chiang Mai',
    searchHref: '/search?country=Thailand&location=Chiang%20Mai&discipline=Muay%20Thai',
    guideHref: '/blog/best-muay-thai-gyms-chiang-mai',
    blurb:
      'Northern camps often bundle dorm or bungalow stays with twice-daily group sessions. Mornings run cooler from November through February. Long-stay travelers use the slower city pace to stack weeks without burning out on logistics.',
  },
  {
    city: 'Phuket',
    searchHref: '/search?country=Thailand&location=Phuket&discipline=Muay%20Thai',
    guideHref: '/blog/best-muay-thai-gyms-phuket',
    blurb:
      'Phuket has the deepest stay-and-train market: on-site rooms, pool villas a short ride from Chalong, and camps that sell training-only or full board. High season pushes standalone hotel rates up, so fixed package pricing can beat booking room and gym separately.',
  },
  {
    city: 'Krabi',
    searchHref: '/search?country=Thailand&location=Krabi&discipline=Muay%20Thai',
    guideHref: '/blog/best-muay-thai-gyms-krabi',
    blurb:
      'Smaller inventory than Phuket, but lower accommodation pressure and beach access from Ao Nang. Confirm AC in the room if you book outside high-season months. See our Krabi AC room comparison for a filtered shortlist.',
  },
  {
    city: 'Pattaya',
    searchHref: '/search?country=Thailand&location=Pattaya&discipline=Muay%20Thai',
    guideHref: '/blog/best-muay-thai-gyms-pattaya',
    blurb:
      'Strong value for multi-week stays: gym plus guesthouse packages at prices that undercut Phuket. Less fight-tourism hype, more routine-friendly training for travelers who want a beach city without island flight hops.',
  },
  {
    city: 'Bangkok',
    searchHref: '/search?country=Thailand&location=Bangkok&discipline=Muay%20Thai',
    guideHref: '/blog/best-muay-thai-gyms-bangkok',
    blurb:
      'Fewer true on-site camp villages than Phuket, but several gyms partner with nearby hotels or run hostel floors. Budget extra time for BTS, taxi, or motorbike commutes. Stadium nights and day trips to Rajadamnern or Lumpinee are the payoff.',
  },
]

export default async function ThailandTrainingCampWithAccommodationPage() {
  const gyms = await getThailandGymsForGuide({ discipline: 'Muay Thai' })
  const enriched = gyms.map((g) => ({
    ...g,
    _amenities: mergeGymAmenitiesFromDb((g as any).amenities),
  }))

  const withHousing = enriched
    .filter((g) => g._amenities.accommodation || g.offers_accommodation)
    .sort((a, b) => {
      if (b.averageRating !== a.averageRating) return b.averageRating - a.averageRating
      if (b.reviewCount !== a.reviewCount) return b.reviewCount - a.reviewCount
      return (a.name || '').localeCompare(b.name || '')
    })

  const compareTable = withHousing.slice(0, 12)
  const byCity = groupGymsByCity(withHousing)

  const itemList = buildGymItemListLd({ name: TITLE, gyms: compareTable })
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
      subtitle="Train-and-stay packages bundle a bed with mat time. This guide explains what that label actually covers, compares live Thailand listings, and gives you a booking checklist before you wire a deposit."
      breadcrumbs={[
        { label: 'Training Guides', href: '/blog' },
        { label: 'Thailand', href: '/search?country=Thailand' },
      ]}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      {itemList && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }} />
      )}

      <GuideHero
        imageSrc={HERO_IMAGE}
        imageAlt="Muay Thai training camp with on-site accommodation in Thailand"
        priority
        overlayText="A Thailand training camp with accommodation should shorten your commute, not just add a brochure photo of a pool."
      />

      <GuideLeadRow
        tocItems={[
          { href: '#direct-answer', label: 'What it means' },
          { href: '#package-types', label: 'Package types' },
          { href: '#compare', label: 'Compare camps' },
          { href: '#cities', label: 'By city' },
          { href: '#onsite-vs-nearby', label: 'On-site vs nearby' },
          { href: '#checklist', label: 'Booking checklist' },
          { href: '#faq', label: 'FAQ' },
        ]}
        statValue={withHousing.length}
        statDescription="Verified Thailand Muay Thai gyms listing accommodation on CombatStay right now."
        statIcon={<BedDouble className="h-5 w-5" />}
      />

      <section id="direct-answer" className="mb-14 scroll-mt-24">
        <GuideAccentIntro icon={ClipboardList} title="What a training camp with accommodation actually is" />
        <div className="prose prose-gray max-w-none space-y-4 text-base leading-relaxed text-gray-800 md:prose-lg">
          <p>
            A <strong>Thailand training camp with accommodation</strong> sells training sessions and a place to sleep in
            one booking flow. That sounds simple. The details are not. On-site dorm beds, private AC bungalows, partner
            guesthouses two streets away, and resort blocks ten minutes by scooter all get marketed under the same
            headline.
          </p>
          <p>
            Your job is to match <strong>sleep</strong>, <strong>session count</strong>, and <strong>commute</strong> to
            how you actually train. A camp that looks perfect in photos loses to a plain room five minutes from the ring
            if you skip afternoon pads because the taxi queue eats forty minutes daily.
          </p>
          <p>
            CombatStay lists verified gyms with package-level flags for accommodation and meals. Use this page to
            understand inclusion types, then open individual profiles for live prices, photos, and instant booking.
          </p>
        </div>
      </section>

      <GuideSection id="package-types" variant="slate" className="mb-14">
        <h2 className="mb-4 text-2xl font-bold text-gray-900 md:text-3xl">Three package shapes you will see</h2>
        <GuideThreeCards
          items={[
            {
              title: 'Training only',
              body: 'Mat fee covers group classes (usually one or two sessions per day). You book a hostel, condo, or hotel separately. Lowest gym sticker price, highest logistics load.',
            },
            {
              title: 'Train and stay',
              body: 'Training plus a bed: dorm, fan room, or private AC. Meals and transfers are often separate. This is the core stay-and-train product most travelers search for.',
            },
            {
              title: 'Train, stay, and eat',
              body: 'Adds one to three meals per day, sometimes airport pickup or laundry. Marketing teams call this all-inclusive. Verify the meal count and rest-day schedule on the package page.',
            },
          ]}
        />
        <p className="mt-6 text-sm text-gray-700">
          For full cost context across cities, read{' '}
          <Link href="/blog/muay-thai-camp-thailand-cost" className="font-medium text-[#003580] underline">
            how much a Muay Thai camp costs in Thailand
          </Link>
          . For recovery-heavy housing picks, see the{' '}
          <Link
            href="/blog/fighters-blueprint-recovery-housing-thailand-2026"
            className="font-medium text-[#003580] underline"
          >
            fighter recovery and on-site housing blueprint
          </Link>
          .
        </p>
      </GuideSection>

      <section id="compare" className="mb-14 scroll-mt-24">
        <GuideAccentIntro
          icon={Table2}
          title="Compare Thailand camps with accommodation"
          subtitle="Live verified listings, sorted by review signal"
        />

        {compareTable.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-8 text-sm text-gray-700 shadow-sm">
            No Thailand gyms currently list accommodation on their profiles. Browse the directory and filter amenities on
            each gym page.
            <div className="mt-4">
              <Link href="/search?country=Thailand&discipline=Muay%20Thai" className="font-semibold text-[#003580] underline">
                Browse Thailand Muay Thai listings →
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                <tr>
                  <th className="px-4 py-3">Gym</th>
                  <th className="px-4 py-3">City</th>
                  <th className="px-4 py-3">Rating</th>
                  <th className="px-4 py-3">Reviews</th>
                  <th className="px-4 py-3">From / day</th>
                  <th className="px-4 py-3">On-site acc.</th>
                  <th className="px-4 py-3">Meals</th>
                  <th className="px-4 py-3">AC</th>
                  <th className="px-4 py-3">Book</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-800">
                {compareTable.map((g) => (
                  <tr key={g.id} className="bg-white">
                    <td className="px-4 py-3 font-semibold">
                      <Link href={gymCanonicalPath(g)} className="text-[#003580] underline">
                        {g.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{g.city || '—'}</td>
                    <td className="px-4 py-3">{g.averageRating ? g.averageRating.toFixed(2) : '—'}</td>
                    <td className="px-4 py-3">{g.reviewCount || '—'}</td>
                    <td className="px-4 py-3">{money((g as { price_per_day?: number }).price_per_day, g.currency)}</td>
                    <td className="px-4 py-3">{yesNo(g._amenities.accommodation || !!g.offers_accommodation)}</td>
                    <td className="px-4 py-3">{yesNo(g._amenities.meals)}</td>
                    <td className="px-4 py-3">{yesNo(g._amenities.air_conditioning)}</td>
                    <td className="px-4 py-3">
                      <Link href={gymCanonicalPath(g)} className="font-semibold text-[#003580] underline">
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="mt-3 text-xs text-gray-500">
          Daily rates are listing summaries. Open each gym for package duration, minimum stay, and what is included in
          train-and-stay vs training-only tiers.
        </p>
      </section>

      <GuideSection id="cities" variant="default" padding="p-6 md:p-8" className="mb-14 shadow-sm">
        <GuideAccentIntro icon={MapPin} title="Stay-and-train by city" subtitle="Where inventory and price bands differ" />
        <div className="mt-6 space-y-8">
          {CITY_NOTES.map((c) => {
            const count = byCity.find((row) => row.city.toLowerCase().includes(c.city.toLowerCase()))?.gyms.length ?? 0
            return (
              <div key={c.city} className="border-b border-gray-100 pb-8 last:border-0 last:pb-0">
                <h3 className="text-xl font-bold text-gray-900">
                  {c.city}
                  {count > 0 && (
                    <span className="ml-2 text-sm font-normal text-gray-500">
                      ({count} listing{count === 1 ? '' : 's'} with accommodation)
                    </span>
                  )}
                </h3>
                <p className="mt-3 max-w-3xl text-base leading-relaxed text-gray-800">{c.blurb}</p>
                <div className="mt-4 flex flex-wrap gap-4 text-sm">
                  <Link href={c.searchHref} className="font-semibold text-[#003580] underline">
                    Search {c.city} →
                  </Link>
                  {c.guideHref && (
                    <Link href={c.guideHref} className="font-medium text-gray-700 underline">
                      {c.city} city guide
                    </Link>
                  )}
                  {c.city === 'Krabi' && (
                    <Link href="/blog/muay-thai-krabi-private-ac-rooms" className="font-medium text-gray-700 underline">
                      Krabi AC room comparison
                    </Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </GuideSection>

      <GuideSection id="onsite-vs-nearby" variant="slate" className="mb-14">
        <h2 className="mb-4 text-2xl font-bold text-gray-900 md:text-3xl">On-site housing vs nearby guesthouse</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-gray-900">When on-site wins</p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-gray-700">
              <li>You plan two sessions per day for two or more weeks.</li>
              <li>The gym runs early morning classes and you hate pre-dawn transport.</li>
              <li>You want one invoice, one cancellation policy, and one check-in desk.</li>
              <li>Recovery amenities (ice bath, massage) sit on the same property.</li>
            </ul>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-gray-900">When nearby can win</p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-gray-700">
              <li>You train once per day and want a beach condo or quieter neighborhood.</li>
              <li>On-site dorms are full and private rooms carry a large premium.</li>
              <li>Your partner does not train and needs hotel-grade comfort separate from camp noise.</li>
              <li>You already have a long-stay apartment lease in the city.</li>
            </ul>
          </div>
        </div>
        <p className="mt-6 text-sm text-gray-700">
          Partner housing listed as included still needs a distance check. Ask for walking minutes or a map pin, not
          &ldquo;nearby&rdquo; in the brochure. Our{' '}
          <Link href="/blog/dont-get-burned-thailand-training-trip" className="font-medium text-[#003580] underline">
            pre-booking checklist
          </Link>{' '}
          covers commute and schedule traps in detail.
        </p>
      </GuideSection>

      <GuideSection id="checklist" variant="default" padding="p-6 md:p-8" className="mb-14 shadow-sm">
        <GuideAccentIntro icon={CheckSquare} title="Booking checklist" subtitle="Ten items before you confirm payment" />
        <ol className="mt-6 list-decimal space-y-3 pl-5 text-base leading-relaxed text-gray-800">
          <li>
            <strong>Room type:</strong> dorm, fan private, or AC private. Shared or ensuite bathroom.
          </li>
          <li>
            <strong>Location:</strong> on gym property vs partner address. Get a map link.
          </li>
          <li>
            <strong>Sessions per day</strong> and <strong>rest day</strong> (many camps close Monday or Sunday).
          </li>
          <li>
            <strong>Meals:</strong> count per day, cuisine style, and whether lunch is included.
          </li>
          <li>
            <strong>Minimum stay</strong> in days or weeks. Weekly bundles often need seven nights.
          </li>
          <li>
            <strong>Airport transfer:</strong> included, paid add-on, or self-arranged.
          </li>
          <li>
            <strong>Laundry:</strong> on-site service, coin machines, or walk to a shop.
          </li>
          <li>
            <strong>Deposit and cancellation</strong> policy days before arrival.
          </li>
          <li>
            <strong>Visa length</strong> if you stay past thirty days. See our{' '}
            <Link href="/blog/thailand-training-visa-dtv" className="font-medium text-[#003580] underline">
              DTV training visa guide
            </Link>
            .
          </li>
          <li>
            <strong>Screenshot the package page</strong> at checkout so inclusion disputes have a timestamp.
          </li>
        </ol>
      </GuideSection>

      <GuideCtaStrip
        title="Browse all Thailand stay-and-train listings"
        subtitle="Filter by city, dates, and amenities on verified gym profiles."
        href="/search?country=Thailand&discipline=Muay%20Thai"
        buttonLabel="Open Thailand search"
      />

      <GuideSection id="faq" variant="default" padding="p-6 md:p-8" className="mb-14 shadow-sm">
        <h2 className="mb-2 text-2xl font-bold text-gray-900 md:text-3xl">FAQ</h2>
        <p className="mb-8 text-gray-600">Common questions about Thailand training camps with accommodation.</p>
        <GuideFaqList items={FAQ_ITEMS} />
      </GuideSection>

      <RelatedGuides
        guides={[
          { title: 'How much does a Muay Thai camp cost in Thailand?', href: '/blog/muay-thai-camp-thailand-cost' },
          { title: '25 best Muay Thai camps in Thailand (2026)', href: '/blog/best-muay-thai-camps-thailand-2026' },
          { title: 'Muay Thai camps with private AC rooms in Krabi', href: '/blog/muay-thai-krabi-private-ac-rooms' },
          {
            title: "The fighter's blueprint: recovery and on-site housing",
            href: '/blog/fighters-blueprint-recovery-housing-thailand-2026',
          },
        ]}
      />
    </ArticleShell>
  )
}
