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
import { Stethoscope, Table2, Trophy } from 'lucide-react'

const TITLE = 'Muay Thai Fight Prep Camps with On-Site Physiotherapy (2026)'
const SEO_TITLE = 'Muay Thai Fight Prep Camps with Physiotherapy 2026 [Compare Top Camps]'
const PATH = '/blog/muay-thai-fight-prep-camps-physiotherapy'
const DATE_PUBLISHED = '2026-04-21'
const DATE_MODIFIED = '2026-04-21'
const HERO_IMAGE = '/Khun_3_c4e13bdce8_c0b7f8b5b5.avif'
const DESCRIPTION =
  'Compare Thailand Muay Thai fight-prep camps that list physio/sports therapy. A clean top-5 comparison table plus how to structure fight camp recovery in 2026.'

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
    q: 'What does “fight prep camp” mean in Thailand?',
    a: 'A fight-prep camp typically means higher intensity, more sparring/clinch volume, stronger conditioning blocks, and a schedule oriented around competition. The exact definition varies by gym—confirm sparring days and coaching focus on each profile.',
  },
  {
    q: 'Is on-site physiotherapy worth paying extra for?',
    a: 'Often yes—especially for long stays or when you arrive with existing injuries. But sleep, nutrition, and sane weekly load are still the biggest drivers of injury risk and performance.',
  },
  {
    q: 'How many days per week do most fight camps train?',
    a: 'Many run 6 days/week, often 2 sessions/day, with one rest day. Some athletes add extra clinch/strength sessions—do not copy that volume unless you have the recovery base for it.',
  },
  {
    q: 'What injuries are most common in Thai fight camps?',
    a: 'Shin and foot bruising, hip flexor tightness, neck strain from clinch, and shoulder/elbow overuse. Physio helps, but load management prevents the biggest setbacks.',
  },
  {
    q: 'Can beginners train at fight-prep camps?',
    a: 'Sometimes, but the environment may be too intense. Beginners usually progress faster at a structured fundamentals-focused camp with optional sparring.',
  },
]

export default async function MuayThaiFightPrepCampsPhysioPage() {
  const gyms = await getThailandGymsForGuide({ discipline: 'Muay Thai' })
  const enriched = gyms.map((g) => ({ ...g, _amenities: mergeGymAmenitiesFromDb((g as any).amenities) }))

  const physioFightPrep = enriched
    .filter((g) => g._amenities.physiotherapy && g._amenities.competition_prep)
    .slice(0, 5)

  const physioOnlyFallback = enriched.filter((g) => g._amenities.physiotherapy).slice(0, 5)
  const shortlist = physioFightPrep.length > 0 ? physioFightPrep : physioOnlyFallback

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
      subtitle="If your camp includes heavy sparring and clinch, you need recovery infrastructure. This page prioritizes camps that list physio/sports therapy and competition prep signals."
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
        imageAlt="Fight camp preparation and recovery in Thailand"
        priority
        overlayText="Fight camp is not only training volume. It is training volume plus recovery quality. On-site physio is one of the cleanest signals that a gym understands longevity."
      />

      <GuideLeadRow
        tocItems={[
          { href: '#compare', label: 'Compare top 5' },
          { href: '#how-to-use', label: 'How to use this table' },
          { href: '#recovery-stack', label: 'Fight camp recovery stack' },
          { href: '#faq', label: 'FAQ' },
        ]}
        statValue={shortlist.length}
        statDescription="Shortlist built from live verified listings (physio prioritized)."
        statIcon={<Stethoscope className="h-5 w-5" />}
      />

      <section id="compare" className="mb-14 scroll-mt-24">
        <GuideAccentIntro icon={Table2} title="Frictionless comparison: fight prep + physio" subtitle="Side-by-side, then click through" />

        {shortlist.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-8 text-sm text-gray-700 shadow-sm">
            No Thailand Muay Thai gyms currently list physiotherapy on their profiles.
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
                  <th className="px-4 py-3">Rating</th>
                  <th className="px-4 py-3">Reviews</th>
                  <th className="px-4 py-3">From / day</th>
                  <th className="px-4 py-3">Competition prep</th>
                  <th className="px-4 py-3">Physio</th>
                  <th className="px-4 py-3">Massage</th>
                  <th className="px-4 py-3">Ice bath</th>
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
                    <td className="px-4 py-3">{yesNo(g._amenities.competition_prep)}</td>
                    <td className="px-4 py-3">{yesNo(g._amenities.physiotherapy)}</td>
                    <td className="px-4 py-3">{yesNo(g._amenities.massage)}</td>
                    <td className="px-4 py-3">{yesNo(g._amenities.ice_bath)}</td>
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
        )}

        {physioFightPrep.length === 0 && shortlist.length > 0 && (
          <p className="mt-3 text-xs text-gray-500">
            Note: no camps currently list <strong>both</strong> competition prep and physiotherapy; the table falls back to physio-forward camps.
          </p>
        )}
      </section>

      <GuideSection id="how-to-use" variant="slate" className="mb-14">
        <GuideAccentIntro icon={Trophy} title="How to use this page (like a pro)" subtitle="Avoid the common camp mistakes" />
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              t: 'Confirm sparring + clinch days',
              d: '“Fight prep” means different things. Look for schedule detail on the listing and ask for the weekly structure before paying.',
            },
            {
              t: 'Protect your hard days',
              d: 'Do not stack heavy lifting with hard sparring. Build a week that can last for 3–6 weeks, not just 3 days.',
            },
            {
              t: 'Treat physio as a system',
              d: 'If physio is available, use it proactively (mobility, prehab), not only after you’re injured.',
            },
          ].map((x) => (
            <div key={x.t} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-gray-900">{x.t}</p>
              <p className="mt-2 text-sm text-gray-700 leading-relaxed">{x.d}</p>
            </div>
          ))}
        </div>
      </GuideSection>

      <GuideSection id="recovery-stack" variant="default" className="mb-14 border border-gray-200 bg-white">
        <div className="grid gap-8 md:grid-cols-2 md:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#003580]">Recovery stack</p>
            <h2 className="mt-2 text-2xl font-bold text-gray-900 md:text-3xl">Fight camp recovery stack (in order)</h2>
            <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-gray-700">
              <li><strong>Sleep</strong> (8+ hours, consistent schedule).</li>
              <li><strong>Fuel</strong> (carbs + protein, enough total calories).</li>
              <li><strong>Hydration</strong> (electrolytes, not just water).</li>
              <li><strong>Load management</strong> (a weekly plan you can repeat).</li>
              <li><strong>Soft tissue</strong> (massage, mobility, stretching).</li>
              <li><strong>Physio</strong> (assessment + targeted rehab/prehab).</li>
              <li>Optional: ice/sauna as tools, not foundations.</li>
            </ol>
            <p className="mt-4 text-sm text-gray-700">
              Budgeting a longer stay? Use{' '}
              <Link href="/blog/muay-thai-camp-thailand-cost" className="font-medium text-[#003580] underline">
                the 2026 Thailand camp cost guide
              </Link>{' '}
              so recovery doesn’t become a surprise expense.
            </p>
          </div>
          <figure className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="relative aspect-[4/3] w-full">
              <Image
                src="/training-center-1.avif"
                alt="Muay Thai fight camp routine and recovery"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 520px"
              />
            </div>
            <figcaption className="px-4 py-3 text-xs text-gray-600">
              The camps that win long term are the camps that keep athletes training consistently.
            </figcaption>
          </figure>
        </div>
      </GuideSection>

      <GuideCtaStrip
        title="Browse all Thailand Muay Thai camps"
        subtitle="Use verified listings and compare by city, price, and amenities."
        href="/search?country=Thailand&discipline=Muay%20Thai"
        buttonLabel="Open Thailand search"
      />

      <GuideSection id="faq" variant="default" padding="p-6 md:p-8" className="mb-14 shadow-sm">
        <h2 className="mb-2 text-2xl font-bold text-gray-900 md:text-3xl">FAQ</h2>
        <p className="mb-8 text-gray-600">Common fight-camp questions (with recovery realism).</p>
        <GuideFaqList items={FAQ_ITEMS} />
      </GuideSection>

      <RelatedGuides
        guides={[
          { title: '25 best Muay Thai camps in Thailand (2026)', href: '/blog/best-muay-thai-camps-thailand-2026' },
          { title: 'Top 5 conditioning gyms for fighters in Phuket', href: '/blog/phuket-fighter-conditioning-gyms' },
          { title: 'Packing list for a combat sports camp in Thailand', href: '/blog/packing-list-combat-sports-camp-thailand' },
          { title: 'Thailand training visa / DTV guide', href: '/blog/thailand-training-visa-dtv' },
        ]}
      />
    </ArticleShell>
  )
}

