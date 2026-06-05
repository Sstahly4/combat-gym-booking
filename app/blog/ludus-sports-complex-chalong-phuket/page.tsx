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
import { getThailandGymsForGuide, type GuideGym } from '@/lib/guides/thailand-gyms'
import { gymImageSrc } from '@/lib/images/gym-image-variants'
import { gymCanonicalPath } from '@/lib/seo/gym-canonical-path'
import { buildArticleLd, buildBreadcrumbLd, buildFaqLd } from '@/lib/seo/guide-schema'
import { absoluteUrl } from '@/lib/seo/site-url'
import { Building2, MapPin, Waves } from 'lucide-react'

const GOOGLE_MAPS_URL = 'https://maps.app.goo.gl/MiNR1d9mrAe7DSAU7'

/** Production listing — used as fallback if name/city filters miss the gym. */
const LUDUS_GYM_ID = 'ce09dd1f-6fa8-4801-b7eb-a6534d2bb1b3'

const TITLE = 'LUDUS Sports Complex Chalong: Complete Training & Stay Guide (2026)'
const SEO_TITLE = 'LUDUS Sports Complex Chalong Phuket 2026 [Prices, Classes & Stay]'
const PATH = '/blog/ludus-sports-complex-chalong-phuket'
const DATE_PUBLISHED = '2026-06-05'
const DATE_MODIFIED = '2026-06-05'

const STAND_IN_IMAGES = {
  hero: '/phuket.jpg',
  muayThai: '/training-center-1.avif',
  spaPool: '/481020258.avif',
  gymFloor: '/blog14_p13_9f088f99a5.webp',
  hotelRoom: '/phuket.jpg',
  foodHall: '/training-center-1.avif',
} as const

/** Prefer CombatStay gym_images (same photos as the live listing); fall back to generic stock. */
function pickGymImage(gym: GuideGym | null, index: number, fallback: string) {
  const row = gym?.images?.[index]
  return row ? gymImageSrc(row) : fallback
}

const DESCRIPTION =
  'LUDUS Sports Complex Chalong on Soi Ta Iad: 5,000 m² gym, Muay Thai & MMA classes, on-site hotel, spa, and 2026 prices—plus how it compares to Tiger and Unit 27 on Fitness Street.'

const ADDRESS = '10/130 Moo 5, Chalong, Mueang Phuket, Phuket 83130, Thailand'
const LUDUS_WEBSITE = 'https://ludusphuket.com/'

export async function generateMetadata(): Promise<Metadata> {
  const ludusGym = await resolveLudusGym()
  const heroImage = pickGymImage(ludusGym, 0, STAND_IN_IMAGES.hero)
  const ogImage =
    heroImage.startsWith('http://') || heroImage.startsWith('https://') ? heroImage : absoluteUrl(heroImage)

  return {
    title: `${SEO_TITLE} | CombatStay`,
    description: DESCRIPTION,
    alternates: { canonical: PATH },
    openGraph: {
      title: `${SEO_TITLE} | CombatStay`,
      description: DESCRIPTION,
      type: 'article',
      url: PATH,
      images: [{ url: ogImage, alt: 'LUDUS Sports Complex Chalong, Phuket' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${SEO_TITLE} | CombatStay`,
      description: DESCRIPTION,
      images: [ogImage],
    },
  }
}

function buildFaqItems(gymHref: string) {
  return [
  {
    q: 'Where is LUDUS Sports Complex located in Phuket?',
    a: 'LUDUS sits at 10/130 Moo 5 in Chalong on Soi Ta Iad (Fitness Street). You are roughly 15–20 minutes from Rawai, Nai Harn, and Kata beaches, and 40–50 minutes from Phuket International Airport depending on traffic.',
  },
  {
    q: 'What martial arts does LUDUS offer?',
    a: 'Group Muay Thai and MMA workouts (from 550 THB per class as listed on ludusphuket.com), plus boxing-oriented training zones. The complex also runs general fitness: CrossFit-style zones, TRX, cycling, yoga, Pilates, and hybrid strength classes.',
  },
  {
    q: 'Can you stay on-site at LUDUS?',
    a: 'Yes. LUDUS integrates 55 hotel rooms (including six junior suites) inside the sports complex—unusual on Fitness Street, where most camps use partner guesthouses. That matters if you want gym-to-room in under two minutes after a hard morning session.',
  },
  {
    q: 'How much does gym access cost at LUDUS in 2026?',
    a: 'As of June 2026, ludusphuket.com lists promotional gym & functional-zone passes at 1,000 THB/week (down from 1,350), 2,000 THB/month (down from 2,700), and 5,800 THB/three months (down from 7,780). A one-day pass covering gym, functional zone, and scheduled group Muay Thai is 1,000 THB. Confirm current rates before you fly.',
  },
  {
    q: 'Is LUDUS better than Tiger Muay Thai on the same street?',
    a: 'Different fit. Tiger is the famous full-time camp with massive class volume and decades of fight-camp reputation. LUDUS is a newer integrated resort model—gym, spa, pool, hotel, food hall—better if you want resort amenities and flexible class drops rather than a traditional “live at camp” rhythm. Many serious fighters still pick Tiger or Unit 27 for camp culture; LUDUS wins on all-in-one convenience.',
  },
  {
    q: 'Does LUDUS have recovery facilities?',
    a: 'Yes—this is a major differentiator. The spa includes 13 massage rooms, Finnish and herbal saunas, steam rooms, hammam, rain room, and Harnn cosmetics. There is also a 25-metre swimming pool. For a two-to-four-week Fitness Street block, that on-site recovery stack can replace separate massage bookings.',
  },
  {
    q: 'Who should train at LUDUS?',
    a: 'Travelers who want Muay Thai or MMA classes without committing to a single camp schedule; remote workers layering gym + yoga + spa; couples where one person trains and the other wants hotel-grade comfort; and beginners who prefer air-conditioned, high-spec facilities over the open-air camp style typical on Fitness Street.',
  },
  {
    q: 'Can I book LUDUS through CombatStay?',
    a: `Yes—LUDUS is live on CombatStay with packages, photos, and opening hours. Book at ${absoluteUrl(gymHref)} or compare nearby Chalong gyms if you want a wider shortlist.`,
  },
  ]
}

function buildLudusLocalBusinessLd(gymHref: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SportsActivityLocation',
    name: 'LUDUS Sports Complex & Training Camp Chalong',
    description: DESCRIPTION,
    url: absoluteUrl(gymHref),
    sameAs: [LUDUS_WEBSITE, GOOGLE_MAPS_URL],
    address: {
      '@type': 'PostalAddress',
      streetAddress: '10/130 Moo 5, Soi Ta Iad',
      addressLocality: 'Chalong',
      addressRegion: 'Phuket',
      postalCode: '83130',
      addressCountry: 'TH',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 7.846,
      longitude: 98.338,
    },
    amenityFeature: [
      { '@type': 'LocationFeatureSpecification', name: 'Muay Thai', value: true },
      { '@type': 'LocationFeatureSpecification', name: 'MMA', value: true },
      { '@type': 'LocationFeatureSpecification', name: 'Hotel accommodation', value: true },
      { '@type': 'LocationFeatureSpecification', name: 'Spa', value: true },
      { '@type': 'LocationFeatureSpecification', name: 'Swimming pool', value: true },
    ],
  }
}

async function resolveLudusGym(): Promise<GuideGym | null> {
  // City is "Phuket" on the listing (Chalong is in the address), not "Chalong".
  const phuketGyms = await getThailandGymsForGuide({ city: 'Phuket' })
  const byName = phuketGyms.find((g) => g.name.toLowerCase().includes('ludus'))
  if (byName) return byName

  const allGyms = await getThailandGymsForGuide({})
  return allGyms.find((g) => g.id === LUDUS_GYM_ID || g.name.toLowerCase().includes('ludus')) ?? null
}

export default async function LudusSportsComplexChalongPage() {
  const ludusGym = await resolveLudusGym()
  const gymHref = ludusGym ? gymCanonicalPath(ludusGym) : `/gyms/${LUDUS_GYM_ID}`
  const gymOnCombatStay = !!ludusGym

  const heroImage = pickGymImage(ludusGym, 0, STAND_IN_IMAGES.hero)
  const muayThaiImage = pickGymImage(ludusGym, 1, STAND_IN_IMAGES.muayThai)
  const gymFloorImage = pickGymImage(ludusGym, 2, STAND_IN_IMAGES.gymFloor)
  const hotelRoomImage = pickGymImage(ludusGym, 3, STAND_IN_IMAGES.hotelRoom)
  const spaPoolImage = pickGymImage(ludusGym, 4, STAND_IN_IMAGES.spaPool)
  const foodHallImage = pickGymImage(ludusGym, 5, STAND_IN_IMAGES.foodHall)

  const articleLd = buildArticleLd({
    title: TITLE,
    description: DESCRIPTION,
    path: PATH,
    datePublished: DATE_PUBLISHED,
    dateModified: DATE_MODIFIED,
    imagePath: heroImage,
  })
  const faqItems = buildFaqItems(gymHref)
  const faqLd = buildFaqLd(faqItems)
  const breadcrumbLd = buildBreadcrumbLd([
    { name: 'Home', path: '/' },
    { name: 'Training Guides', path: '/blog' },
    { name: 'Thailand', path: '/search?country=Thailand' },
    { name: 'LUDUS Sports Complex Chalong', path: PATH },
  ])
  const localBusinessLd = buildLudusLocalBusinessLd(gymHref)

  const combatStayDayPrice =
    ludusGym && ludusGym.price_per_day > 0
      ? `${ludusGym.currency || 'USD'} ${ludusGym.price_per_day.toFixed(2)}`
      : null

  return (
    <ArticleShell
      title={TITLE}
      subtitle="LUDUS is not another open-air camp on Fitness Street (Soi Ta Iad)—it is a 5,000 m² sports resort with hotel, spa, and pool. Here is who it fits, what it costs, and how it compares to Tiger and Unit 27."
      breadcrumbs={[
        { label: 'Training Guides', href: '/blog' },
        { label: 'Thailand', href: '/search?country=Thailand' },
        { label: 'Phuket', href: '/search?country=Thailand&location=Phuket' },
        { label: 'LUDUS Chalong', href: PATH },
      ]}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessLd) }} />

      <GuideHero
        imageSrc={heroImage}
        imageAlt="LUDUS Sports Complex Chalong on Soi Ta Iad, Phuket"
        priority
        overlayText="Phuket’s Fitness Street finally has a full sports resort—not just another camp. LUDUS packs Muay Thai, MMA, hotel rooms, spa, and a 25 m pool into one Chalong complex."
      />

      <GuideLeadRow
        tocItems={[
          { href: '#quick-facts', label: 'Quick facts' },
          { href: '#why-ludus', label: 'Why LUDUS exists' },
          { href: '#training', label: 'Training & coaches' },
          { href: '#pricing', label: '2026 prices' },
          { href: '#compare', label: 'vs Fitness Street' },
          { href: '#stay', label: 'Where to stay' },
          { href: '#logistics', label: 'Getting there' },
          { href: '#who', label: 'Who it fits' },
          { href: '#faq', label: 'FAQ' },
        ]}
        statValue="5,000 m²"
        statDescription="Training floor across eight zones—one of the largest purpose-built complexes on Soi Ta Iad, with 55 on-site hotel rooms."
        statIcon={<Building2 className="h-5 w-5" />}
      />

      <section id="quick-facts" className="mb-14 scroll-mt-24">
        <GuideAccentIntro icon={MapPin} title="Quick facts" subtitle="LUDUS Sports Complex Chalong at a glance" />
        <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <tbody className="divide-y divide-gray-100 text-gray-800">
              {[
                ['Address', ADDRESS],
                ['Street', 'Soi Ta Iad — also called Fitness Street or Soi Ta-Iad (Chalong)'],
                ['Operator', 'Vedasiam'],
                ['Floor space', '5,000 m² across 8 training zones'],
                ['Weekly classes', '50+ (Muay Thai, MMA, boxing, CrossFit, yoga, Pilates, HIIT, cycling)'],
                ['On-site hotel', '55 rooms (6 junior suites)'],
                ['Recovery', '25 m pool · 13 spa rooms · saunas · hammam · steam rooms'],
                ['Cardio kit', '22 modern cardio machines'],
                ['Google Maps', GOOGLE_MAPS_URL],
                ['Book on CombatStay', gymHref],
                ['Website', LUDUS_WEBSITE],
              ].map(([label, value]) => (
                <tr key={label}>
                  <td className="whitespace-nowrap px-4 py-3 font-semibold text-gray-900">{label}</td>
                  <td className="px-4 py-3 text-gray-700">
                    {label === 'Website' ? (
                      <a href={value} className="font-medium text-[#003580] underline" rel="noopener noreferrer">
                        ludusphuket.com
                      </a>
                    ) : label === 'Google Maps' ? (
                      <a href={value} className="font-medium text-[#003580] underline" rel="noopener noreferrer">
                        Open in Google Maps
                      </a>
                    ) : label === 'Book on CombatStay' ? (
                      <Link href={value} className="font-medium text-[#003580] underline">
                        LUDUS on CombatStay
                      </Link>
                    ) : (
                      value
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-sm text-gray-600">
          Planning a broader Phuket trip? Start with our{' '}
          <Link href="/blog/best-muay-thai-gyms-phuket" className="font-medium text-[#003580] underline">
            best Muay Thai gyms in Phuket
          </Link>{' '}
          guide, then narrow to{' '}
          <Link href="/blog/best-muay-thai-gyms/chalong" className="font-medium text-[#003580] underline">
            Chalong-specific listings
          </Link>{' '}
          on CombatStay.
        </p>
      </section>

      <section id="why-ludus" className="mb-14 scroll-mt-24">
        <div className="grid gap-8 md:grid-cols-2 md:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#003580]">Fitness Street context</p>
            <h2 className="mt-2 text-2xl font-bold text-gray-900 md:text-3xl">
              Why LUDUS is different from other gyms on Fitness Street
            </h2>
            <div className="mt-3 space-y-3 text-base leading-relaxed text-gray-700">
              <p>
                <strong>Soi Ta Iad</strong> (ซอยตาเอียด)—known to fighters as <strong>Fitness Street</strong>—is a short
                road in Chalong lined with Muay Thai camps, MMA rooms, and CrossFit boxes (Tiger, Sinbi, Unit 27, and
                others). The classic setup: train hard, walk to a protein café, sleep in a fan-cooled room, repeat.
                That model works. It also burns people out by week three when sleep and recovery lag behind volume.
              </p>
              <p>
                LUDUS flips the script: <strong>gym + hotel + spa + food hall + pool in one gated complex</strong>.
                The Latin <em>ludus</em> (“training school”) branding is deliberate—this is closer to a European sports
                resort dropped onto Phuket than a traditional Thai camp. That is exactly why travelers who found Tiger
                “too intense” or Unit 27 “too CrossFit-centric” are showing up here.
              </p>
              <p>
                If you searched for LUDUS on TripAdvisor or Google Maps, you mostly get an address, a few photos, and
                sparse reviews—not pricing, coach backgrounds, or how LUDUS compares to neighbors on the same street.
                This guide fills that gap so you can plan a real training stay, not just tick off an attraction listing.
              </p>
            </div>
          </div>
          <figure className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="relative aspect-[4/3] w-full">
              <Image
                src={gymFloorImage}
                alt="LUDUS Sports Complex gym and functional training floor"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 520px"
              />
            </div>
            <figcaption className="px-4 py-3 text-xs text-gray-600">
              Eight zones span cardio, strength, functional, stretching, boxing, CrossFit, TRX, and cycling—photo from the{' '}
              <Link href={gymHref} className="font-medium text-[#003580] underline">
                LUDUS CombatStay listing
              </Link>
              .
            </figcaption>
          </figure>
        </div>
      </section>

      <section id="training" className="mb-14 scroll-mt-24">
        <GuideAccentIntro icon={Waves} title="Training & coaches" subtitle="Combat sports with real fight records" />
        <div className="prose prose-gray max-w-none space-y-4 text-base leading-relaxed text-gray-800 md:prose-lg">
          <p>
            LUDUS is not pad-work for tourists only. The Muay Thai roster includes stadium-experienced coaches—worth
            verifying on arrival, but the public coach list is stronger than most resort-style gyms:
          </p>
        </div>
        <ul className="mt-4 space-y-3 text-sm leading-relaxed text-gray-700">
          <li>
            <strong>Taweekit Sit-O</strong> — 350+ fights; Rajadamnern Super Featherweight champion; Fighter of the Year
            2016.
          </li>
          <li>
            <strong>Mr. Sanan Nuankaew</strong> — 300 career fights; Lumpinee experience; True4U champion at 122 lbs.
          </li>
          <li>
            <strong>Chonlathan Nuankaew</strong> — 120 fights; True4U champion.
          </li>
          <li>
            <strong>Rittichai Puangphothong</strong> — 88 professional bouts; Rajadamnern and Rangsit experience.
          </li>
          <li>
            <strong>Noelle Grandjean</strong> — international Judo/MMA coach; 2nd dan Judo; professional experience in
            ONE Championship.
          </li>
        </ul>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <figure className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="relative aspect-[4/3] w-full">
              <Image
                src={muayThaiImage}
                alt="Muay Thai training at LUDUS Sports Complex Chalong"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 480px"
              />
            </div>
            <figcaption className="px-4 py-3 text-xs text-gray-600">
              Group Muay Thai from 550 THB/class. Beginners get fundamentals; advanced athletes can add private sessions
              from 800 THB.
            </figcaption>
          </figure>
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-gray-900">Class mix beyond striking</p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-gray-700">
              <li>MMA group workouts (rolling out from May 2026 per ludusphuket.com)</li>
              <li>Hybrid Power Build, Spin Power Blast, Zumba, Flex &amp; Release</li>
              <li>Pilates Reformer (800 THB/class)</li>
              <li>Yoga and stretching blocks for fight-week mobility</li>
              <li>Rooftop training space for events and community sessions</li>
            </ul>
            <p className="mt-4 text-sm text-gray-600">
              Layering S&amp;C? Read our{' '}
              <Link href="/blog/phuket-fighter-conditioning-gyms" className="font-medium text-[#003580] underline">
                Phuket fighter conditioning guide
              </Link>{' '}
              to avoid doubling hard sessions on sparring days.
            </p>
          </div>
        </div>
      </section>

      <GuideSection id="pricing" variant="slate" className="mb-14">
        <h2 className="mb-4 text-2xl font-bold text-gray-900 md:text-3xl">LUDUS prices in 2026 (from ludusphuket.com)</h2>
        <p className="mb-6 max-w-3xl text-gray-700">
          Promotional rates below were live in June 2026. LUDUS runs switch-over promos for travelers transferring from
          other gyms—show your old pass expiry at reception to port remaining days. Always confirm on-site before
          budgeting a full camp.
        </p>
        <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Price (THB)</th>
                <th className="px-4 py-3">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white text-gray-800">
              {[
                ['Muay Thai group class', 'from 550', 'Per session'],
                ['MMA group class', 'from 550', 'Check schedule on app'],
                ['General group classes', 'from 400', 'Hybrid, spin, zumba, stretch, yoga'],
                ['Pilates Reformer', '800', 'Per class'],
                ['Gym + functional zone (1 week)', '1,000', 'Promo; was 1,350'],
                ['Gym + functional zone (1 month)', '2,000', 'Promo; was 2,700'],
                ['Gym + functional zone (3 months)', '5,800', 'Promo; was 7,780'],
                ['Day pass', '1,000', 'Gym, functional zone + scheduled group Muay Thai'],
                ['Private coaching', 'from 800', 'One-on-one'],
                ...(combatStayDayPrice
                  ? [
                      [
                        'CombatStay training package (from)',
                        combatStayDayPrice,
                        'Live bookable rate on CombatStay—incl. taxes per listing',
                      ] as const,
                    ]
                  : []),
              ].map(([product, price, notes]) => (
                <tr key={product}>
                  <td className="px-4 py-3 font-medium">{product}</td>
                  <td className="px-4 py-3 font-semibold text-[#003580]">{price}</td>
                  <td className="px-4 py-3 text-gray-600">{notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-sm text-gray-600">
          Context: a typical Phuket fight-camp week can run 8,000–15,000 THB all-in with accommodation. LUDUS’s monthly
          gym pass at 2,000 THB is cheap for the facility spec—but hotel, food, and classes stack quickly. Use our{' '}
          <Link href="/blog/muay-thai-camp-thailand-cost" className="font-medium text-[#003580] underline">
            Thailand training cost guide
          </Link>{' '}
          to build a full trip budget.
        </p>
      </GuideSection>

      <section id="compare" className="mb-14 scroll-mt-24">
        <h2 className="mb-2 text-2xl font-bold text-gray-900 md:text-3xl">LUDUS vs Tiger Muay Thai vs Unit 27</h2>
        <p className="mb-8 max-w-3xl text-gray-600">
          All three are on the same 1.5 km street. Your choice depends on whether you want camp culture, CrossFit
          performance training, or resort-style amenities—not which logo looks best on Instagram.
        </p>
        <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
              <tr>
                <th className="px-4 py-3">Factor</th>
                <th className="px-4 py-3">LUDUS</th>
                <th className="px-4 py-3">Tiger Muay Thai</th>
                <th className="px-4 py-3">Unit 27</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white text-gray-800">
              {[
                ['Primary vibe', 'Sports resort · spa · hotel', 'World-famous Muay Thai / MMA camp', 'Elite CrossFit · HYROX'],
                ['Best for', 'Flexible classes + recovery + couples', 'Full-time fight camp immersion', 'S&C & conditioning PRs'],
                ['On-site stay', '55 hotel rooms in complex', 'Camp accommodation options', 'No hotel—nearby rentals'],
                ['Pool / spa', '25 m pool + full spa', 'Pool at camp', 'Recovery area · no full spa'],
                ['Muay Thai depth', 'Strong coaches · class-based', 'Deep camp lineage · highest volume', 'Striking classes · not MT-focused'],
                ['Typical stay', '1–4 weeks mixed training', '2–8 weeks camp', '2–6 weeks performance block'],
                ['Walk to protein cafés', 'Yes—same street', 'Yes', 'Yes'],
              ].map(([factor, ludus, tiger, unit]) => (
                <tr key={factor}>
                  <td className="px-4 py-3 font-semibold">{factor}</td>
                  <td className="px-4 py-3">{ludus}</td>
                  <td className="px-4 py-3">{tiger}</td>
                  <td className="px-4 py-3">{unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-sm font-medium text-gray-800">
          Our take: pick LUDUS if you will actually use the spa and pool; pick Tiger if you want camp accountability; pick
          Unit 27 if your bottleneck is engine and strength, not pad work.
        </p>
      </section>

      <GuideSection id="stay" variant="default" className="mb-14 border border-gray-200 bg-white">
        <h2 className="mb-4 text-2xl font-bold text-gray-900 md:text-3xl">Where to stay for LUDUS training</h2>
        <div className="grid gap-8 md:grid-cols-2 md:items-start">
          <div className="space-y-4 text-base leading-relaxed text-gray-700">
            <p>
              <strong>On-site (simplest):</strong> 55 hotel rooms inside the complex. Walking from bed to gym in two
              minutes beats most guesthouses on Fitness Street when you are training twice daily in 33°C heat.
            </p>
            <p>
              <strong>Walking distance on Soi Ta Iad:</strong> Budget bungalows, gym-focused hotels (The Blue Mavi,
              Cocoville, Signature), and monthly apartments. Rule of thumb: if it is more than a 12-minute walk, you
              will skip afternoon sessions by week two.
            </p>
            <p>
              <strong>Beach areas (Rawai / Nai Harn / Kata):</strong> Fine if you have a scooter and accept traffic
              risk. Many fighters prefer living on the soi and visiting beaches on rest days—not commuting before
              morning pads.
            </p>
            <p>
              Browse live options on{' '}
              <Link href={gymHref} className="font-medium text-[#003580] underline">
                {gymOnCombatStay ? 'the LUDUS CombatStay profile' : 'CombatStay Chalong search'}
              </Link>{' '}
              or filter{' '}
              <Link
                href="/search?country=Thailand&location=Phuket"
                className="font-medium text-[#003580] underline"
              >
                Phuket gyms with accommodation
              </Link>
              .
            </p>
          </div>
          <figure className="overflow-hidden rounded-2xl border border-gray-200 shadow-sm">
            <div className="relative aspect-[4/3] w-full">
              <Image
                src={hotelRoomImage}
                alt="LUDUS on-site hotel rooms at Sports Complex Chalong"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 480px"
              />
            </div>
            <figcaption className="px-4 py-3 text-xs text-gray-600">
              On-site hotel + spa + food hall = fewer Grab rides and more recovery time.
            </figcaption>
          </figure>
        </div>
      </GuideSection>

      <section id="logistics" className="mb-14 scroll-mt-24">
        <GuideThreeCards
          items={[
            {
              title: 'Airport → Chalong',
              body: '40–50 minutes to Phuket International (HKT) off-peak; add 20+ minutes in high season. Pre-book a taxi or use Grab; scooter rental is common but risky if you are not experienced—crashes end camps.',
            },
            {
              title: 'Daily life on Fitness Street',
              body: 'Protein bowls, meal-prep cafés, supplement shops, and laundry within walking distance. Budget roughly 400–800 THB/day for food if you eat locally; more if you optimize every macro.',
            },
            {
              title: 'Best time to book',
              body: 'High season (Nov–Feb) fills Fitness Street fast. Book accommodation 4–6 weeks ahead for a month stay. Rainy season is cheaper but humidity hits recovery—pack extra electrolytes.',
            },
          ]}
        />
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <figure className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="relative aspect-[4/3] w-full">
              <Image
                src={spaPoolImage}
                alt="LUDUS spa and 25-metre swimming pool"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 480px"
              />
            </div>
            <figcaption className="px-4 py-3 text-xs text-gray-600">
              Spa opening promos: 10–20% off massage for members. Pool + sauna stack is the main reason fighters choose
              LUDUS over a bare-bones camp.
            </figcaption>
          </figure>
          <figure className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="relative aspect-[4/3] w-full">
              <Image
                src={foodHallImage}
                alt="LUDUS food hall and dining at Sports Complex"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 480px"
              />
            </div>
            <figcaption className="px-4 py-3 text-xs text-gray-600">
              Food hall on-site—less time hunting meals between sessions.
            </figcaption>
          </figure>
        </div>
      </section>

      <GuideSection id="who" variant="slate" className="mb-14">
        <h2 className="mb-6 text-2xl font-bold text-gray-900 md:text-3xl">Who should book LUDUS—and who should skip it</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-green-200 bg-green-50/50 p-6">
            <p className="text-sm font-semibold text-green-900">Book LUDUS if you…</p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-green-900/90">
              <li>Want Muay Thai or MMA without a rigid camp schedule</li>
              <li>Care about air-con gym floors, spa, and pool after hard sessions</li>
              <li>Travel as a couple or remote worker who needs hotel-grade sleep</li>
              <li>Are a beginner intimidated by open-air traditional camps</li>
              <li>Plan 2–4 weeks mixing striking, yoga, and general fitness</li>
            </ul>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-6">
            <p className="text-sm font-semibold text-amber-900">Skip LUDUS if you…</p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-amber-900/90">
              <li>Need daily sparring culture and fight-team accountability</li>
              <li>Are preparing for a specific bout in 6–8 weeks (consider a fight-prep camp)</li>
              <li>Want the cheapest possible month—traditional camps still win on pure value</li>
              <li>Dislike resort-style pricing for food and spa add-ons</li>
              <li>Only want elite CrossFit / HYROX (Unit 27 or Kong S&amp;C fit better)</li>
            </ul>
          </div>
        </div>
        <p className="mt-6 text-sm text-gray-700">
          MMA-focused travelers should also scan our{' '}
          <Link href="/blog/best-mma-camps-thailand" className="font-medium text-[#003580] underline">
            best MMA camps in Thailand
          </Link>{' '}
          list—LUDUS is strong on amenities, but dedicated MMA gyms may offer more cage time per week.
        </p>
      </GuideSection>

      <GuideCtaStrip
        title={gymOnCombatStay ? 'Book LUDUS on CombatStay' : 'Find LUDUS and Chalong gyms on CombatStay'}
        subtitle="Live photos, reviews, and booking-ready listings—filter by discipline, amenities, and stay length."
        href={gymHref}
        buttonLabel={gymOnCombatStay ? 'View LUDUS profile' : 'Search Chalong gyms'}
      />

      <GuideSection id="faq" variant="default" padding="p-6 md:p-8" className="mb-14 shadow-sm">
        <h2 className="mb-2 text-2xl font-bold text-gray-900 md:text-3xl">FAQ</h2>
        <p className="mb-8 text-gray-600">
          Common questions about training and staying at LUDUS Sports Complex Chalong—answered with specifics, not fluff.
        </p>
        <GuideFaqList items={faqItems} />
      </GuideSection>

      <RelatedGuides
        guides={[
          { title: 'Best Muay Thai gyms in Phuket', href: '/blog/best-muay-thai-gyms-phuket' },
          { title: 'Best Muay Thai gyms in Chalong', href: '/blog/best-muay-thai-gyms/chalong' },
          { title: 'Phuket fighter conditioning gyms', href: '/blog/phuket-fighter-conditioning-gyms' },
          { title: 'Best MMA camps in Thailand', href: '/blog/best-mma-camps-thailand' },
          { title: 'Muay Thai camp Thailand cost (2026)', href: '/blog/muay-thai-camp-thailand-cost' },
        ]}
      />
    </ArticleShell>
  )
}
