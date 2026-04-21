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
import { Calculator, Receipt, Wallet } from 'lucide-react'

const TITLE = 'How Much Does a Muay Thai Camp in Thailand Actually Cost in 2026?'
const SEO_TITLE = 'Muay Thai Camp Thailand Cost 2026 [Real Prices + Breakdown]'
const PATH = '/blog/muay-thai-camp-thailand-cost'
const DATE_PUBLISHED = '2026-04-21'
const DATE_MODIFIED = '2026-04-21'
const HERO_IMAGE = '/N-8427.jpeg.avif'
const DESCRIPTION =
  'Real 2026 pricing for Muay Thai camps in Thailand: training fees, accommodation, food, gear, and hidden costs. Includes a summary price table and city-by-city comparison.'

export const metadata: Metadata = {
  title: `${SEO_TITLE} | Combatbooking`,
  description: DESCRIPTION,
  alternates: { canonical: PATH },
  openGraph: { title: `${SEO_TITLE} | Combatbooking`, description: DESCRIPTION, type: 'article' },
  twitter: { card: 'summary_large_image', title: `${SEO_TITLE} | Combatbooking`, description: DESCRIPTION },
}

const FAQ_ITEMS = [
  {
    q: 'How much does a 1-month Muay Thai camp in Thailand cost in 2026?',
    a: 'Total budget including training, basic accommodation, food, and gear typically ranges from roughly $1,200 to $3,000+ USD for a full month, depending on city and package tier. Phuket and Bangkok run higher; Chiang Mai and the islands sit in the middle; Pattaya and smaller towns can be cheaper.',
  },
  {
    q: 'Why is Phuket more expensive than Chiang Mai for Muay Thai?',
    a: 'Phuket&rsquo;s gym market is internationalized, its accommodation costs are resort-grade, and many camps bundle Western meals and modern facilities. Chiang Mai has lower rent, cheaper food, and a less tourist-premium pricing structure.',
  },
  {
    q: 'What is usually included in a Muay Thai camp package?',
    a: 'Most packages include 2 training sessions per day, 5&ndash;6 days per week. Inclusive packages may add accommodation, some meals, airport transfer, and basic gear. Many gyms sell training separately from accommodation.',
  },
  {
    q: 'What costs do travelers miss in their budget?',
    a: 'Visa fees, travel insurance for contact sports, gear upgrades, private sessions, massage/physio, transport between camps, and the Sunday food bill when you discover mango sticky rice.',
  },
  {
    q: 'Can I train Muay Thai in Thailand on a $1,000 budget?',
    a: 'For 1&ndash;2 weeks, yes, if you are careful with accommodation and food. For a full month, it is very tight and usually means a cheaper city, a modest room, and cooking some meals yourself.',
  },
  {
    q: 'Are prepaid monthly packages cheaper than paying daily?',
    a: 'Almost always yes. Weekly rates can be 20&ndash;30% cheaper than daily drop-ins, and monthly rates typically add further discount. Lock in once you have tested a gym for 2&ndash;3 days.',
  },
  {
    q: 'Do I tip coaches and pad-holders at Thai Muay Thai camps?',
    a: 'Tipping culture varies by camp. Many long-stay trainees tip their padman a modest amount at the end of a block or after fights. Ask the camp manager what is customary—do not guess.',
  },
  {
    q: 'Is travel insurance worth it for a Muay Thai trip?',
    a: 'Yes&mdash;and check that the policy explicitly covers amateur combat sports training, not just recreational activity. Standard travel insurance often excludes injuries from contact training.',
  },
]

type PriceRow = {
  category: string
  budget: string
  mid: string
  premium: string
  notes?: string
}

const SUMMARY_ROWS: PriceRow[] = [
  { category: 'Training (1 month, 2x/day)', budget: '$300–$450', mid: '$450–$700', premium: '$700–$1,200+', notes: 'Higher in Phuket/Bangkok.' },
  { category: 'Accommodation (1 month)', budget: '$250–$450', mid: '$500–$900', premium: '$1,000–$2,500+', notes: 'Basic fan room → gym bungalow → resort-style.' },
  { category: 'Food (1 month)', budget: '$250–$400', mid: '$400–$650', premium: '$700–$1,200', notes: 'Thai food cheap; Western food premium.' },
  { category: 'Local transport (1 month)', budget: '$30–$80', mid: '$100–$200', premium: '$200–$400', notes: 'Motorbike rental, taxis.' },
  { category: 'Gear (full setup)', budget: '$80–$150', mid: '$150–$300', premium: '$300–$600', notes: 'Gloves, shins, wraps, shorts.' },
  { category: 'Insurance (1 month)', budget: '$40–$80', mid: '$80–$150', premium: '$150–$300', notes: 'Contact-sport coverage.' },
  { category: 'Visa/admin', budget: '$0–$50', mid: '$50–$150', premium: '$200+', notes: 'DTV/education visas run higher.' },
]

const SUMMARY_TOTALS = {
  budget: '$950 – $1,660',
  mid: '$1,730 – $3,050',
  premium: '$3,250 – $6,200+',
}

export default function MuayThaiCampCostPage() {
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
      subtitle="Honest 2026 numbers for a Muay Thai trip to Thailand—training, accommodation, food, gear, and the costs nobody puts in the brochure."
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
        imageAlt="Muay Thai camp in Thailand with training equipment"
        priority
        overlayText="A one-month Muay Thai camp in Thailand can cost anywhere from ~$1,000 to $6,000+. The gap is not about gym quality—it is about your choices."
      />

      <GuideLeadRow
        tocItems={[
          { href: '#summary-table', label: 'Summary price table' },
          { href: '#monthly-average', label: '1-month average cost' },
          { href: '#whats-included', label: 'What&rsquo;s included' },
          { href: '#city-pricing', label: 'Phuket vs Chiang Mai vs Koh Tao' },
          { href: '#hidden-costs', label: 'Hidden costs' },
          { href: '#save-money', label: 'How to save money' },
          { href: '#faq', label: 'FAQ' },
        ]}
        statValue="$1.2k–$3k"
        statDescription="Typical realistic range for a full month of Muay Thai training in Thailand, all-in, at mid-tier level."
        statIcon={<Wallet className="h-5 w-5" />}
      />

      <section id="summary-table" className="mb-14 scroll-mt-24">
        <GuideAccentIntro
          icon={Calculator}
          title="2026 Thailand Muay Thai camp: summary price table"
          subtitle="A 1-month budget, all-in, in USD"
        />
        <p className="mb-4 max-w-3xl text-sm text-gray-600">
          Approximate ranges for a 1-month stay based on real 2026 pricing across popular Thai training cities. Always
          confirm current rates on individual gym profiles.
        </p>
        <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
              <tr>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Budget</th>
                <th className="px-4 py-3">Mid-tier</th>
                <th className="px-4 py-3">Premium</th>
                <th className="px-4 py-3 hidden md:table-cell">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white text-gray-800">
              {SUMMARY_ROWS.map((row) => (
                <tr key={row.category}>
                  <td className="px-4 py-3 font-semibold">{row.category}</td>
                  <td className="px-4 py-3">{row.budget}</td>
                  <td className="px-4 py-3">{row.mid}</td>
                  <td className="px-4 py-3">{row.premium}</td>
                  <td className="px-4 py-3 hidden md:table-cell text-xs text-gray-600">{row.notes}</td>
                </tr>
              ))}
              <tr className="bg-[#003580]/5 font-semibold text-gray-900">
                <td className="px-4 py-3">Estimated total (1 month)</td>
                <td className="px-4 py-3">{SUMMARY_TOTALS.budget}</td>
                <td className="px-4 py-3">{SUMMARY_TOTALS.mid}</td>
                <td className="px-4 py-3">{SUMMARY_TOTALS.premium}</td>
                <td className="px-4 py-3 hidden md:table-cell text-xs text-gray-600">Excludes flights.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-gray-500">
          Disclaimer: ranges are editorial estimates based on live listings and traveler reports as of 2026. Actual
          pricing varies by season, gym, and exchange rate. Always verify on individual{' '}
          <Link href="/search?country=Thailand&discipline=Muay%20Thai" className="font-medium text-[#003580] underline">
            Thailand Muay Thai listings
          </Link>.
        </p>
      </section>

      <section id="monthly-average" className="mb-14 scroll-mt-24">
        <h2 className="mb-4 text-2xl font-bold text-gray-900 md:text-3xl">The real average cost of a 1-month Muay Thai camp</h2>
        <div className="prose prose-gray max-w-none space-y-4 text-base leading-relaxed text-gray-800 md:prose-lg">
          <p>
            If you asked ten experienced Muay Thai travelers what a month in Thailand costs in 2026, you would get ten different numbers&mdash;and all of them would be right. The difference comes down to <strong>which city</strong>, <strong>which accommodation tier</strong>, and <strong>how much Western food you buy</strong>.
          </p>
          <p>
            A realistic <strong>mid-tier</strong> month&mdash;training twice a day, six days a week, in a fan or basic-AC room near the gym, eating Thai street food and local restaurants, with a rented scooter&mdash;lands around <strong>$1,700&ndash;$2,500 USD all-in</strong>, excluding flights. That is the number most long-stay trainees report.
          </p>
          <p>
            A <strong>budget</strong> month in a cheaper city (Chiang Mai, Pattaya, smaller mainland towns), sharing accommodation or using a gym bungalow, and cooking some meals, can genuinely come in near <strong>$1,000&ndash;$1,400 USD</strong>. A <strong>premium</strong> month in a Phuket resort-style camp with private coaching, nutrition, and condos near the beach can stretch to <strong>$4,000&ndash;$6,000+ USD</strong>.
          </p>
        </div>
      </section>

      <GuideSection id="whats-included" variant="slate" className="mb-14">
        <h2 className="mb-6 text-2xl font-bold text-gray-900 md:text-3xl">What is actually included in a camp package?</h2>
        <GuideThreeCards
          items={[
            {
              title: 'Training fees',
              body: 'Almost always included. Usually 2 sessions per day, 5&ndash;6 days per week. Weekly and monthly rates are cheaper than daily drop-in.',
            },
            {
              title: 'Accommodation',
              body: 'Sometimes bundled (gym-owned bungalows or partner guesthouses), sometimes separate. Bundled packages trade flexibility for convenience.',
            },
            {
              title: 'Meals',
              body: 'Premium camps often include 2&ndash;3 meals daily. Mid-tier gyms rarely do. You will usually eat out&mdash;which is cheap in Thailand.',
            },
          ]}
        />
        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-5 text-sm leading-relaxed text-gray-700 shadow-sm">
          <p className="font-semibold text-gray-900">Standard inclusions to verify before you pay</p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            <li>Training sessions per day and per week</li>
            <li>Sparring and clinch day availability</li>
            <li>Private session pricing (if you want any)</li>
            <li>Accommodation type (fan vs AC, private vs shared)</li>
            <li>Meals included (how many, what style)</li>
            <li>Airport or pier transfer</li>
            <li>Gear available to borrow vs buy</li>
            <li>Laundry, massage, or pool access</li>
          </ul>
        </div>
      </GuideSection>

      <GuideSection id="city-pricing" variant="default" className="mb-14 border border-gray-200 bg-white">
        <div className="grid gap-8 md:grid-cols-2 md:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#003580]">City comparison</p>
            <h2 className="mt-2 text-2xl font-bold text-gray-900 md:text-3xl">Phuket vs Chiang Mai vs Koh Tao: pricing differences</h2>
            <div className="mt-3 space-y-3 text-base leading-relaxed text-gray-700">
              <p>
                <strong>Phuket</strong> is usually the most expensive training destination in Thailand. Monthly training at well-known camps can run $500&ndash;$1,200 alone, and resort-style accommodation plus Western-heavy food adds up quickly. You pay for infrastructure and international-grade coaching depth.
              </p>
              <p>
                <strong>Chiang Mai</strong> runs cheaper across every category: training, rent, and food. A comparable monthly training package can come in 20&ndash;40% under Phuket pricing, and apartments in the Old City or Nimman are realistic for $300&ndash;$600/month.
              </p>
              <p>
                <strong>Koh Tao</strong> is a special case&mdash;training itself is moderate, but island food and accommodation logistics push the total higher than Chiang Mai. You are paying for island supply chains, not gym prestige.
              </p>
              <p>
                Compare ranked options: <Link href="/blog/best-muay-thai-gyms-phuket" className="font-medium text-[#003580] underline">Phuket</Link>,{' '}
                <Link href="/blog/best-muay-thai-gyms-chiang-mai" className="font-medium text-[#003580] underline">Chiang Mai</Link>,{' '}
                <Link href="/blog/best-muay-thai-gyms-koh-tao" className="font-medium text-[#003580] underline">Koh Tao</Link>.
              </p>
            </div>
          </div>
          <figure className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="relative aspect-[4/3] w-full">
              <Image
                src="/Khun_3_c4e13bdce8_c0b7f8b5b5.avif"
                alt="Muay Thai pad work at a Thailand training camp"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 520px"
              />
            </div>
            <figcaption className="px-4 py-3 text-xs text-gray-600">
              Same sport, three very different price tiers&mdash;pick the city that matches your budget first.
            </figcaption>
          </figure>
        </div>
      </GuideSection>

      <GuideSection id="hidden-costs" variant="amber" className="mb-14">
        <div className="flex items-start gap-4">
          <Receipt className="mt-1 h-8 w-8 shrink-0 text-[#003580]" aria-hidden />
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 md:text-3xl">Hidden costs to look out for</h2>
            <p className="mt-3 text-sm leading-relaxed text-gray-800">
              These are the line items nobody tells you about in the Instagram reel. Budget for them or they will eat your trip.
            </p>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {[
                { t: 'Visa and extension fees', d: 'Tourist extensions, DTV fees, or visa run trips for longer stays.' },
                { t: 'Travel &amp; injury insurance', d: 'Standard policies often exclude contact-sport injuries. Get the right coverage.' },
                { t: 'Private sessions', d: 'Tempting after week 2 when you want personal attention. Budget for 2&ndash;4 if you plan to use them.' },
                { t: 'Gear replacement', d: 'Wraps fray, shorts tear, gloves break down. Set aside ~$50&ndash;$100 for mid-trip replacements.' },
                { t: 'Massage &amp; physio', d: '$10&ndash;$15/hour for Thai massage is the best recovery tool you are not using.' },
                { t: 'Scooter accidents', d: 'Even minor skins cost real money and training days. Consider taxis or a helmet you actually trust.' },
                { t: 'Fight night expenses', d: 'Entry fees, taxis, food out. Fun nights are rarely cheap nights.' },
                { t: 'Laundry', d: 'You will do laundry constantly. Budget $20&ndash;$40/month if you outsource it.' },
              ].map((item) => (
                <li key={item.t} className="rounded-lg border border-amber-200/80 bg-white/80 p-4 text-sm text-gray-800 shadow-sm">
                  <p className="font-semibold text-gray-900" dangerouslySetInnerHTML={{ __html: item.t }} />
                  <p className="mt-1 text-gray-700" dangerouslySetInnerHTML={{ __html: item.d }} />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </GuideSection>

      <section id="save-money" className="mb-14 scroll-mt-24">
        <h2 className="mb-4 text-2xl font-bold text-gray-900 md:text-3xl">How to lower your total cost without ruining the trip</h2>
        <div className="max-w-4xl space-y-4 text-base leading-relaxed text-gray-800">
          <p>
            Do not cut training sessions to save money&mdash;that is the one thing you came for. Cut the things that do not add to your camp experience. The biggest levers are <strong>city choice</strong>, <strong>accommodation tier</strong>, and <strong>how much Western food you eat</strong>.
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Pick Chiang Mai or a smaller mainland city over Phuket for identical training quality at 30&ndash;40% lower total spend.</li>
            <li>Book a fan or basic-AC room near the gym instead of a beachfront condo&mdash;you will be at the gym, not the balcony.</li>
            <li>Eat Thai food. A $2&ndash;$3 rice-and-protein plate is objectively better fuel than a $14 Western breakfast.</li>
            <li>Buy gear locally. You will pay 30&ndash;60% less and get a proper fit.</li>
            <li>Lock in a weekly or monthly training package after a 2&ndash;3 day trial. Daily rates are a tax on indecision.</li>
            <li>Don&rsquo;t fly between cities mid-trip unless there is a specific reason. Each internal flight is a training day and $100+ gone.</li>
          </ul>
        </div>
      </section>

      <GuideCtaStrip
        title="See real 2026 prices on verified Thailand camps"
        subtitle="Filter by city, budget, and discipline&mdash;book directly."
        href="/search?country=Thailand&discipline=Muay%20Thai"
        buttonLabel="Browse Thailand camps"
      />

      <GuideSection id="faq" variant="default" padding="p-6 md:p-8" className="mb-14 shadow-sm">
        <h2 className="mb-2 text-2xl font-bold text-gray-900 md:text-3xl">FAQ</h2>
        <p className="mb-8 text-gray-600">The pricing questions travelers actually ask.</p>
        <GuideFaqList items={FAQ_ITEMS} />
      </GuideSection>

      <RelatedGuides
        guides={[
          { title: '25 best Muay Thai camps in Thailand (2026)', href: '/blog/best-muay-thai-camps-thailand-2026' },
          { title: '1-week vs 1-month Muay Thai camp packages', href: '/blog/muay-thai-camp-1-week-vs-1-month' },
          { title: 'Best Muay Thai gyms in Phuket', href: '/blog/best-muay-thai-gyms-phuket' },
          { title: 'Best Muay Thai gyms in Chiang Mai', href: '/blog/best-muay-thai-gyms-chiang-mai' },
        ]}
      />
    </ArticleShell>
  )
}
