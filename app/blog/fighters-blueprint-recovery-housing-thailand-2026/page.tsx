import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { ArticleShell } from '@/components/guides/article-shell'
import { RelatedGuides } from '@/components/guides/related-guides'
import { getThailandGymsForGuide } from '@/lib/guides/thailand-gyms'
import { mergeGymAmenitiesFromDb } from '@/lib/constants/gym-amenities'
import { GuideLogisticsBlocks } from '@/components/guides/guide-logistics-blocks'
import { gymCanonicalPath } from '@/lib/seo/gym-canonical-path'
import { buildArticleLd, buildBreadcrumbLd, buildFaqLd, buildGymItemListLd } from '@/lib/seo/guide-schema'
import {
  GuideAccentIntro,
  GuideCtaStrip,
  GuideFaqList,
  GuideHero,
  GuideLeadRow,
  GuideSection,
} from '@/components/guides/guide-page-blocks'
import { BedDouble, Snowflake, Stethoscope, Table2 } from 'lucide-react'

const TITLE = "The 2026 Fighter’s Blueprint: 7 Camps with High-Spec Recovery & On‑Site Housing"
const SEO_TITLE = 'Thailand Fight Camp Recovery + Housing 2026 [7 High-Spec Picks]'
const PATH = '/blog/fighters-blueprint-recovery-housing-thailand-2026'
const DATE_PUBLISHED = '2026-05-08'
const DATE_MODIFIED = '2026-05-08'
const HERO_IMAGE =
  'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&w=1400&q=80'
const DESCRIPTION =
  'A recovery-first shortlist of Thailand Muay Thai camps that list on-site accommodation plus strong recovery signals (ice bath/sauna/physio/massage). Built from verified listings.'

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
    q: 'Why prioritize on-site housing?',
    a: 'It removes the biggest trip killer: commute friction. For two-a-days, the “best” gym is the one you can attend consistently for weeks.',
  },
  {
    q: 'Are ice baths and saunas necessary?',
    a: 'They’re tools, not foundations. Sleep, food, hydration, and sane weekly load come first. But recovery facilities can make high volume sustainable.',
  },
  {
    q: 'What counts as “high-spec recovery” on CombatStay?',
    a: 'We treat recovery as structured listing entities: ice bath/cold plunge, sauna, physiotherapy/sports therapy, massage, and mobility space. If it’s not listed as an amenity, assume it isn’t reliably available.',
  },
  {
    q: 'Is this list complete?',
    a: 'No. This is a curated shortlist built from live verified/trusted CombatStay listings that show both accommodation and recovery signals. Use Thailand search to widen.',
  },
  {
    q: 'Do I need a special visa for longer stays?',
    a: 'Visa needs depend on nationality and stay length. Start with official sources and use our training visa/ED visa guides for planning context.',
  },
]

export default async function FightersBlueprintRecoveryHousingThailand2026Page() {
  const gyms = await getThailandGymsForGuide({ discipline: 'Muay Thai' })
  const enriched = gyms.map((g) => ({ ...g, _amenities: mergeGymAmenitiesFromDb((g as any).amenities) }))

  const recoveryHousing = enriched
    .filter((g) => g._amenities.accommodation)
    .map((g) => {
      const recoveryScore =
        (g._amenities.ice_bath ? 1 : 0) +
        (g._amenities.sauna ? 1 : 0) +
        (g._amenities.physiotherapy ? 1 : 0) +
        (g._amenities.massage ? 1 : 0)
      return { ...g, _recoveryScore: recoveryScore }
    })
    .filter((g) => g._recoveryScore >= 1)
    .sort((a, b) => {
      if ((b as any)._recoveryScore !== (a as any)._recoveryScore) return (b as any)._recoveryScore - (a as any)._recoveryScore
      if (b.averageRating !== a.averageRating) return b.averageRating - a.averageRating
      if (b.reviewCount !== a.reviewCount) return b.reviewCount - a.reviewCount
      return (a.name || '').localeCompare(b.name || '')
    })
    .slice(0, 7)

  const itemList = buildGymItemListLd({ name: TITLE, gyms: recoveryHousing })
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
      subtitle="Outcome-driven shortlist: camps that reduce commute friction and support recovery. Built from live CombatStay amenities, not vague marketing copy."
      breadcrumbs={[
        { label: 'Training Guides', href: '/blog' },
        { label: 'Thailand', href: '/search?country=Thailand' },
      ]}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <GuideHero
        imageSrc={HERO_IMAGE}
        imageAlt="Recovery-focused training camp"
        priority
        overlayText="The shortcut to progress is attendance. On-site housing + recovery facilities make two-a-days sustainable."
      />

      <GuideLeadRow
        tocItems={[
          { href: '#compare', label: 'Compare the 7 picks' },
          { href: '#why-this-works', label: 'Why this works' },
          { href: '#how-to-use', label: 'How to pick' },
          { href: '#logistics', label: 'Recovery & legality' },
          { href: '#faq', label: 'FAQ' },
        ]}
        statValue={recoveryHousing.length}
        statDescription="Shortlist built from live verified listings (accommodation + recovery signals)."
        statIcon={<BedDouble className="h-5 w-5" />}
      />

      <section id="compare" className="mb-14 scroll-mt-24">
        <GuideAccentIntro
          icon={Table2}
          title="The shortlist (recovery + housing)"
          subtitle="Fast comparison table, then click through to book-ready profiles"
        />

        {recoveryHousing.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-8 text-sm text-gray-700 shadow-sm">
            No Muay Thai listings currently match both on-site accommodation and recovery amenities.
            <div className="mt-4">
              <Link href="/search?country=Thailand&discipline=Muay%20Thai" className="font-semibold text-[#003580] underline">
                Browse all Thailand Muay Thai listings →
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                <tr>
                  <th className="px-4 py-3">Gym</th>
                  <th className="px-4 py-3">Rating</th>
                  <th className="px-4 py-3">Reviews</th>
                  <th className="px-4 py-3">From / day</th>
                  <th className="px-4 py-3">On-site housing</th>
                  <th className="px-4 py-3">Ice bath</th>
                  <th className="px-4 py-3">Sauna</th>
                  <th className="px-4 py-3">Physio</th>
                  <th className="px-4 py-3">Massage</th>
                  <th className="px-4 py-3">Book</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-800">
                {recoveryHousing.map((g) => (
                  <tr key={g.id} className="bg-white">
                    <td className="px-4 py-3 font-semibold">
                      <Link href={gymCanonicalPath(g)} className="text-[#003580] underline">
                        {g.name}
                      </Link>
                      <div className="mt-1 text-xs font-normal text-gray-500">
                        {g.city ? `${g.city}, ` : ''}{g.country}
                      </div>
                    </td>
                    <td className="px-4 py-3">{g.averageRating ? g.averageRating.toFixed(2) : '—'}</td>
                    <td className="px-4 py-3">{g.reviewCount || '—'}</td>
                    <td className="px-4 py-3">{money((g as any).price_per_day, (g as any).currency)}</td>
                    <td className="px-4 py-3">{yesNo((g as any)._amenities.accommodation)}</td>
                    <td className="px-4 py-3">{yesNo((g as any)._amenities.ice_bath)}</td>
                    <td className="px-4 py-3">{yesNo((g as any)._amenities.sauna)}</td>
                    <td className="px-4 py-3">{yesNo((g as any)._amenities.physiotherapy)}</td>
                    <td className="px-4 py-3">{yesNo((g as any)._amenities.massage)}</td>
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
      </section>

      <GuideSection id="why-this-works" variant="default" className="mb-14 border border-gray-200 bg-white">
        <GuideAccentIntro icon={Stethoscope} title="Why this shortlist works (outcomes, not opinions)" subtitle="Attendance + recovery > hype" />
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">On-site housing is a performance tool</h3>
            <p className="mt-2 text-sm leading-relaxed text-gray-700">
              When you remove commute friction, you get the two things most travelers lose first: <strong>sleep</strong> and
              <strong> consistency</strong>. That is why on-site housing tops a “better” gym you rarely attend.
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">Recovery entities predict sustainability</h3>
            <p className="mt-2 text-sm leading-relaxed text-gray-700">
              Ice bath/sauna/physio/massage aren’t “nice to haves” when you’re training twice a day in heat. They’re signals
              a camp has thought about longevity.
            </p>
          </div>
        </div>
        <p className="mt-6 text-sm text-gray-700">
          Want an even stricter filter? See{' '}
          <Link href="/blog/muay-thai-fight-prep-camps-physiotherapy" className="font-semibold text-[#003580] underline">
            fight prep camps with on-site physiotherapy
          </Link>
          .
        </p>
      </GuideSection>

      <GuideSection id="how-to-use" variant="slate" className="mb-14">
        <GuideAccentIntro icon={Snowflake} title="How to choose (don’t overpay for marketing)" subtitle="Outcome-driven filters" />
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { t: 'Confirm the housing is real', d: '“Accommodation” can mean on-site rooms or nearby partners. Verify walking distance and inclusions.' },
            { t: 'Check recovery entities', d: 'Ice bath/sauna/physio/massage are structured amenities. If it’s not listed, assume it’s not available.' },
            { t: 'Protect sleep', d: 'A recovery-heavy camp still fails if nightlife/noise kills sleep. Plan your room and routine like training.' },
          ].map((x) => (
            <div key={x.t} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-gray-900">{x.t}</p>
              <p className="mt-2 text-sm text-gray-700 leading-relaxed">{x.d}</p>
            </div>
          ))}
        </div>
        <p className="mt-6 text-sm text-gray-700">
          Want the full national ranking first? Start with{' '}
          <Link href="/blog/best-muay-thai-camps-thailand-2026" className="font-medium text-[#003580] underline">
            25 best Muay Thai camps in Thailand (2026)
          </Link>
          .
        </p>
      </GuideSection>

      <GuideSection id="logistics" variant="default" className="mb-14 border border-gray-200 bg-white">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#003580]">Semantic gap coverage</p>
        <h2 className="mt-2 text-2xl font-bold text-gray-900 md:text-3xl">Recovery &amp; legality blocks</h2>
        <p className="mt-3 max-w-3xl text-base leading-relaxed text-gray-700">
          If you’re planning a longer stay, visa and recovery logistics are not optional. Use these blocks before you book.
        </p>
        <GuideLogisticsBlocks cityLabel="Thailand" />
      </GuideSection>

      <GuideCtaStrip
        title="Browse all Thailand Muay Thai camps"
        subtitle="Filter by city, amenities, and price after you shortlist."
        href="/search?country=Thailand&discipline=Muay%20Thai"
        buttonLabel="Open Thailand search"
      />

      <GuideSection id="faq" variant="default" padding="p-6 md:p-8" className="mb-14 shadow-sm">
        <h2 className="mb-2 text-2xl font-bold text-gray-900 md:text-3xl">FAQ</h2>
        <p className="mb-8 text-gray-600">Recovery-first camp questions.</p>
        <GuideFaqList items={FAQ_ITEMS} />
      </GuideSection>

      <RelatedGuides
        guides={[
          { title: '25 best Muay Thai camps in Thailand (2026)', href: '/blog/best-muay-thai-camps-thailand-2026' },
          { title: 'Fight prep camps with on-site physiotherapy', href: '/blog/muay-thai-fight-prep-camps-physiotherapy' },
          { title: 'Thailand training visa / DTV guide', href: '/blog/thailand-training-visa-dtv' },
          { title: 'Packing list for a combat sports camp in Thailand', href: '/blog/packing-list-combat-sports-camp-thailand' },
        ]}
      />
    </ArticleShell>
  )
}

