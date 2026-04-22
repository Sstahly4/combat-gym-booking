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
} from '@/components/guides/guide-page-blocks'
import { getThailandGymsForGuide } from '@/lib/guides/thailand-gyms'
import { mergeGymAmenitiesFromDb } from '@/lib/constants/gym-amenities'
import { buildArticleLd, buildBreadcrumbLd, buildFaqLd } from '@/lib/seo/guide-schema'
import { ShieldCheck, Table2, Users } from 'lucide-react'

const TITLE = 'Best Muay Thai Gym for Female Solo Travelers (2026)'
const SEO_TITLE = 'Best Muay Thai Gym for Female Solo Travelers 2026 [Compare Top Camps]'
const PATH = '/blog/best-muay-thai-gym-female-solo-travelers-2026'
const DATE_PUBLISHED = '2026-04-21'
const DATE_MODIFIED = '2026-04-21'
const HERO_IMAGE = '/e079bedfbf7e870f827b4fda7ce2132f.avif'
const DESCRIPTION =
  'A trust-first guide for women training Muay Thai solo in Thailand: what to look for, red flags to avoid, and a clean comparison table of top options (2026).'

export const metadata: Metadata = {
  title: `${SEO_TITLE} | Combatbooking`,
  description: DESCRIPTION,
  alternates: { canonical: PATH },
  openGraph: { title: `${SEO_TITLE} | Combatbooking`, description: DESCRIPTION, type: 'article' },
  twitter: { card: 'summary_large_image', title: `${SEO_TITLE} | Combatbooking`, description: DESCRIPTION },
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
    q: 'Is Thailand safe for female solo travelers training Muay Thai?',
    a: 'For most travelers, yes—Thailand is one of the most common destinations for women training solo. The key is choosing a gym with professional staff, clear class structure, and a location/accommodation setup that supports recovery and comfort.',
  },
  {
    q: 'What matters most in a gym for women training solo?',
    a: 'Professional coaching culture, clear beginner-to-advanced class structure, English-speaking support, and a routine you can sustain. On-site accommodation and basic security features can reduce friction for solo travelers.',
  },
  {
    q: 'Should I pick an all-women gym?',
    a: 'You do not need to. Many top Thailand gyms have strong female training communities. What matters is how the gym runs classes, handles sparring, and whether you feel respected and safe.',
  },
  {
    q: 'How do I avoid sketchy camps?',
    a: 'Avoid gyms that push hard sparring immediately, won’t answer basic questions about schedules and inclusions, or have vague accommodation details. Favor camps with verified listings, clear photos, and consistent reviews.',
  },
  {
    q: 'Can I book a beginner-friendly camp as a woman arriving solo?',
    a: 'Yes. Many gyms welcome beginners. Start with one session/day for the first few days, communicate your experience level, and treat sparring as optional unless a coach invites you in.',
  },
]

export default async function BestMuayThaiGymFemaleSoloTravelers2026Page() {
  const gyms = await getThailandGymsForGuide({ discipline: 'Muay Thai' })
  const enriched = gyms.map((g) => ({ ...g, _amenities: mergeGymAmenitiesFromDb((g as any).amenities) }))

  // Heuristic shortlist: choose gyms that tend to reduce solo traveler friction.
  // If this is too strict (data missing), we fall back to top-rated.
  const preferred = enriched.filter((g) => {
    const a = g._amenities
    const trustSignals = (g.reviewCount || 0) >= 3 && (g.averageRating || 0) >= 4.3
    const comfort = a.english_speaking || a.beginner_friendly || a.security || a.accommodation
    return trustSignals && comfort
  })

  const shortlist = (preferred.length >= 5 ? preferred : enriched).slice(0, 5)

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
      subtitle="This is a trust and routine problem, not a hype problem. Use the table to compare quickly, then open each profile for the details that actually matter."
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
        imageAlt="Female solo travelers training Muay Thai in Thailand"
        priority
        overlayText="Professional coaching culture, clear class structure, and a routine you can sustain—those are the real safety features."
      />

      <GuideLeadRow
        tocItems={[
          { href: '#compare', label: 'Compare top 5' },
          { href: '#what-to-look-for', label: 'What to look for' },
          { href: '#red-flags', label: 'Red flags' },
          { href: '#faq', label: 'FAQ' },
        ]}
        statValue="Top 5"
        statDescription="A clean shortlist built from verified listings + review signals + low-friction amenities."
        statIcon={<Users className="h-5 w-5" />}
      />

      <section id="compare" className="mb-14 scroll-mt-24">
        <GuideAccentIntro icon={Table2} title="Frictionless comparison: top options for solo women" subtitle="Fast compare → then click through" />

        <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
              <tr>
                <th className="px-4 py-3">Gym</th>
                <th className="px-4 py-3">Rating</th>
                <th className="px-4 py-3">Reviews</th>
                <th className="px-4 py-3">From / day</th>
                <th className="px-4 py-3">Beginner-friendly</th>
                <th className="px-4 py-3">English-speaking</th>
                <th className="px-4 py-3">On-site acc.</th>
                <th className="px-4 py-3">Security</th>
                <th className="px-4 py-3">Book</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-800">
              {shortlist.map((g) => (
                <tr key={g.id} className="bg-white">
                  <td className="px-4 py-3 font-semibold">
                    <Link href={`/gyms/${g.id}`} className="text-[#003580] underline">
                      {g.name}
                    </Link>
                    <div className="mt-1 text-xs font-normal text-gray-500">
                      {g.city ? `${g.city}, ` : ''}{g.country}
                    </div>
                  </td>
                  <td className="px-4 py-3">{g.averageRating ? g.averageRating.toFixed(2) : '—'}</td>
                  <td className="px-4 py-3">{g.reviewCount || '—'}</td>
                  <td className="px-4 py-3">{money((g as any).price_per_day, (g as any).currency)}</td>
                  <td className="px-4 py-3">{yesNo(g._amenities.beginner_friendly)}</td>
                  <td className="px-4 py-3">{yesNo(g._amenities.english_speaking)}</td>
                  <td className="px-4 py-3">{yesNo(g._amenities.accommodation)}</td>
                  <td className="px-4 py-3">{yesNo(g._amenities.security)}</td>
                  <td className="px-4 py-3">
                    <Link href={`/gyms/${g.id}`} className="font-semibold text-[#003580] underline">
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-3 text-xs text-gray-500">
          Notes: amenities depend on what the gym has added to its listing. Always open the profile to confirm class structure, sparring policy, and accommodation details.
        </p>
      </section>

      <GuideSection id="what-to-look-for" variant="slate" className="mb-14">
        <GuideAccentIntro icon={ShieldCheck} title="What to look for (the trust checklist)" subtitle="Industry-standard signals" />
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              t: 'Clear class structure',
              d: 'Beginners should know where they fit. Fundamentals blocks and optional sparring are good signs.',
            },
            {
              t: 'Professional boundaries',
              d: 'Staff communication is respectful, direct, and consistent. No pressure, no weirdness, no ambiguity.',
            },
            {
              t: 'Routine-friendly logistics',
              d: 'Accommodation/commute, food options, and recovery access matter more than “most famous camp.”',
            },
          ].map((x) => (
            <div key={x.t} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-gray-900">{x.t}</p>
              <p className="mt-2 text-sm text-gray-700 leading-relaxed">{x.d}</p>
            </div>
          ))}
        </div>
        <p className="mt-6 text-sm text-gray-700">
          If you’re starting from zero, read{' '}
          <Link href="/blog/beginners-guide-muay-thai-chiang-mai" className="font-medium text-[#003580] underline">
            the beginner’s guide to Muay Thai in Chiang Mai
          </Link>{' '}
          (the principles apply nationally).
        </p>
      </GuideSection>

      <section id="red-flags" className="mb-14 scroll-mt-24">
        <h2 className="mb-4 text-2xl font-bold text-gray-900 md:text-3xl">Red flags to avoid</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {[
            {
              t: 'Hard sparring pressure on day 1',
              d: 'A reputable gym builds you up. “Prove yourself” culture is a bad sign for beginners and solo travelers.',
            },
            {
              t: 'Vague accommodation details',
              d: 'If room type, AC/fan, bathroom, and distance to gym are unclear, assume friction and stress.',
            },
            {
              t: 'Inconsistent communication',
              d: 'If a gym cannot answer basic schedule and pricing questions clearly, the camp experience is often similarly chaotic.',
            },
            {
              t: 'No review history + no transparency',
              d: 'New gyms can be great—but “no reviews” plus vague info is not a risk worth taking when you’re solo.',
            },
          ].map((x) => (
            <div key={x.t} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-gray-900">{x.t}</p>
              <p className="mt-2 text-sm text-gray-700 leading-relaxed">{x.d}</p>
            </div>
          ))}
        </div>
      </section>

      <GuideCtaStrip
        title="Browse verified Thailand Muay Thai camps"
        subtitle="Filter by city and compare listings with transparent profiles."
        href="/search?country=Thailand&discipline=Muay%20Thai"
        buttonLabel="Open Thailand search"
      />

      <GuideSection id="faq" variant="default" padding="p-6 md:p-8" className="mb-14 shadow-sm">
        <h2 className="mb-2 text-2xl font-bold text-gray-900 md:text-3xl">FAQ</h2>
        <p className="mb-8 text-gray-600">High-signal planning answers for women training solo.</p>
        <GuideFaqList items={FAQ_ITEMS} />
      </GuideSection>

      <RelatedGuides
        guides={[
          { title: '25 best Muay Thai camps in Thailand (2026)', href: '/blog/best-muay-thai-camps-thailand-2026' },
          { title: 'Packing list for a combat sports camp in Thailand', href: '/blog/packing-list-combat-sports-camp-thailand' },
          { title: 'How much does a Muay Thai camp cost in Thailand?', href: '/blog/muay-thai-camp-thailand-cost' },
          { title: 'Thailand training visa / DTV guide', href: '/blog/thailand-training-visa-dtv' },
        ]}
      />
    </ArticleShell>
  )
}

