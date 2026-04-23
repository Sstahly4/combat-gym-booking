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
import { buildArticleLd, buildBreadcrumbLd, buildFaqLd } from '@/lib/seo/guide-schema'
import { Luggage, PackageCheck, ShoppingBag } from 'lucide-react'

const TITLE = 'Packing List for a Combat Sports Camp in Thailand (2026)'
const SEO_TITLE = 'Combat Sports Packing List Thailand 2026 [Muay Thai, BJJ, MMA]'
const PATH = '/blog/packing-list-combat-sports-camp-thailand'
const DATE_PUBLISHED = '2026-04-21'
const DATE_MODIFIED = '2026-04-21'
const HERO_IMAGE = '/training-center-1.avif'
const DESCRIPTION =
  'Exactly what to pack for a Muay Thai, BJJ, or MMA training trip to Thailand in 2026—what to bring, what to buy locally, and what to leave at home.'

export const metadata: Metadata = {
  title: `${SEO_TITLE} | CombatStay`,
  description: DESCRIPTION,
  alternates: { canonical: PATH },
  openGraph: { title: `${SEO_TITLE} | CombatStay`, description: DESCRIPTION, type: 'article' },
  twitter: { card: 'summary_large_image', title: `${SEO_TITLE} | CombatStay`, description: DESCRIPTION },
}

const FAQ_ITEMS = [
  {
    q: 'Should I bring gloves from home?',
    a: 'Most travelers buy gloves in Thailand. Prices are lower, quality is strong, and coaches can help you fit properly. If you already own gloves that fit perfectly, bring them&mdash;but do not buy new ones at home just for the trip.',
  },
  {
    q: 'How many training outfits should I pack?',
    a: '3&ndash;4 sets is usually enough. You will sweat through everything, but laundry is cheap and frequent. Quick-dry fabrics beat cotton in Thai heat and humidity.',
  },
  {
    q: 'Do I need a gi for BJJ in Thailand?',
    a: 'Yes, if you train gi. Pack one light gi (cheap to fly with) and buy a second locally if you need more. No-gi gear is easy to source in Thailand.',
  },
  {
    q: 'What medical supplies should I bring?',
    a: 'A basic first aid kit: blister tape, kinesio tape, electrolytes, anti-chafe balm, and any personal medication with a copy of the prescription. Over-the-counter supplies are widely available but specific brands may not be.',
  },
  {
    q: 'Is my travel insurance enough?',
    a: 'Check the policy wording. Many standard travel policies exclude contact sports. You want a plan that explicitly covers amateur combat sports training and accidental injury.',
  },
  {
    q: 'What about money and cards?',
    a: 'Bring two cards from different banks, some USD cash for emergencies, and enable your home bank for Thailand before you fly. ATMs work well but charge fees.',
  },
  {
    q: 'Should I bring protein powder or supplements?',
    a: 'Usually not worth the luggage. Thai food is high-quality fuel and supplements are available locally. Electrolytes are the one exception&mdash;pack a stash.',
  },
  {
    q: 'What is the single most forgotten item?',
    a: 'A reusable water bottle that actually seals. Second place: a second pair of hand wraps, because one pair will be wet.',
  },
]

export default function PackingListPage() {
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
      subtitle="A packing list built by travelers who have been to Thailand six times, not written by someone who Googled &lsquo;Muay Thai trip essentials.&rsquo;"
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
        imageAlt="Combat sports training gear laid out for a Thailand trip"
        priority
        overlayText="The gear rule for Thailand: bring what you already trust, buy what is cheaper locally, and leave at home anything you are packing &lsquo;just in case.&rsquo;"
      />

      <GuideLeadRow
        tocItems={[
          { href: '#philosophy', label: 'Packing philosophy' },
          { href: '#bring', label: 'Bring from home' },
          { href: '#buy-local', label: 'Buy in Thailand' },
          { href: '#by-discipline', label: 'By discipline' },
          { href: '#medical', label: 'Medical &amp; recovery' },
          { href: '#documents', label: 'Documents &amp; money' },
          { href: '#do-not-bring', label: 'Do not bring' },
          { href: '#faq', label: 'FAQ' },
        ]}
        statValue="Carry-on+1"
        statDescription="The ideal Thailand training setup: a good carry-on plus one checked bag with room for gear you buy locally."
        statIcon={<Luggage className="h-5 w-5" />}
      />

      <section id="philosophy" className="mb-14 scroll-mt-24">
        <GuideAccentIntro icon={PackageCheck} title="The packing philosophy" subtitle="Less than you think" />
        <div className="prose prose-gray max-w-none space-y-4 text-base leading-relaxed text-gray-800 md:prose-lg">
          <p>
            Thailand is not a remote outpost. Bangkok, Phuket, and Chiang Mai have every piece of training gear you could want at a lower price than your home gym pro shop, often with better local-brand options than imported equivalents. Packing for a Thailand combat sports trip should follow a simple rule: <strong>bring what fits you perfectly</strong>, <strong>buy what is cheaper locally</strong>, and <strong>leave at home anything you added &ldquo;just in case.&rdquo;</strong>
          </p>
          <p>
            If you are staying a month or longer, pack for the first 3&ndash;4 days of training and the first night of sleep. Everything else you can sort in-country by day two.
          </p>
        </div>
      </section>

      <GuideSection id="bring" variant="slate" className="mb-14">
        <div className="flex items-start gap-4">
          <Luggage className="mt-1 h-8 w-8 shrink-0 text-[#003580]" aria-hidden />
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 md:text-3xl">Bring from home</h2>
            <p className="mt-3 text-sm leading-relaxed text-gray-700">
              The short list. These items matter for fit, hygiene, or because Thai shops may not stock your exact spec.
            </p>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {[
                { t: 'Hand wraps (2–3 pairs)', d: 'Light, cheap, and you always need a dry pair ready.' },
                { t: 'Mouthguard', d: 'Boil-and-bite or custom. Bring a spare if you already own one.' },
                { t: 'Running shoes', d: 'Bring a well-fitting pair and expect to buy a second beater pair locally.' },
                { t: '3–4 quick-dry training shirts', d: 'Cotton soaks and never dries. Technical fabric wins.' },
                { t: 'Compression shorts', d: 'Prevent chafing during long sessions, especially for BJJ.' },
                { t: 'Sandals (flip-flops)', d: 'Gym floors, beach days, every walk outside the ring.' },
                { t: 'Sunscreen (face + body)', d: 'Thai sunscreen options differ from Western brands. Bring what your skin likes.' },
                { t: 'Personal meds + prescription copies', d: 'Labeled, in original packaging, with a doctor&rsquo;s note if needed.' },
                { t: 'Blister tape / athletic tape', d: 'Your feet will need it. Your skin will thank you.' },
                { t: 'Travel adapter (Type A/B/C)', d: 'Thailand outlets accept common plug types; a universal adapter is easiest.' },
              ].map((item) => (
                <li key={item.t} className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-800 shadow-sm">
                  <p className="font-semibold text-gray-900">{item.t}</p>
                  <p className="mt-1 text-gray-700">{item.d}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </GuideSection>

      <GuideSection id="buy-local" variant="default" className="mb-14 border border-gray-200 bg-white">
        <div className="flex items-start gap-4">
          <ShoppingBag className="mt-1 h-8 w-8 shrink-0 text-[#003580]" aria-hidden />
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 md:text-3xl">Buy in Thailand</h2>
            <p className="mt-3 text-sm leading-relaxed text-gray-700">
              These items are cheaper, better fitted, or easier to source locally&mdash;and leave room in your suitcase for the ride home.
            </p>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {[
                { t: 'Training gloves (10oz–14oz)', d: 'Fatip, Top King, Fairtex, Yokkao&mdash;all available in most training cities.' },
                { t: 'Shin guards', d: 'Essential for Muay Thai. Try them on before buying.' },
                { t: 'Muay Thai shorts', d: 'Traditional cut is cut for kicks. Buy 2&ndash;3; they are cheap and fun souvenirs.' },
                { t: 'Rash guards (for BJJ/MMA)', d: 'Heat-friendly material, available locally in all major training cities.' },
                { t: 'Ankle supports (Muay Thai)', d: 'Optional; cheap to try on if you are curious.' },
                { t: 'Water bottle with insulation', d: '7-Eleven and department stores sell good options for a few dollars.' },
                { t: 'Toiletries and sunscreen (top-ups)', d: 'Widely available. Some Western brands, many local alternatives.' },
                { t: 'Second running shoes / gym shoes', d: 'Cheap and often better suited to Thai heat.' },
                { t: 'Thai SIM card', d: 'AIS or True at the airport; unlimited data plans are cheap and fast.' },
                { t: 'Backpack / daypack', d: 'If you forgot one, every mall has them.' },
              ].map((item) => (
                <li key={item.t} className="rounded-lg border border-gray-200 bg-slate-50 p-4 text-sm text-gray-800 shadow-sm">
                  <p className="font-semibold text-gray-900">{item.t}</p>
                  <p className="mt-1 text-gray-700">{item.d}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </GuideSection>

      <section id="by-discipline" className="mb-14 scroll-mt-24">
        <h2 className="mb-4 text-2xl font-bold text-gray-900 md:text-3xl">Discipline-specific additions</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#003580]">Muay Thai</p>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              <li>Extra pair of wraps (you will want dry ones)</li>
              <li>Shin guards (buy in Thailand)</li>
              <li>Muay Thai shorts (buy in Thailand)</li>
              <li>Ankle supports (optional)</li>
            </ul>
            <p className="mt-3 text-xs text-gray-600">
              See the <Link href="/blog/beginners-guide-muay-thai-chiang-mai" className="font-medium text-[#003580] underline">beginner&rsquo;s guide</Link> for session-level tips.
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#003580]">BJJ</p>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              <li>One lightweight gi + belt</li>
              <li>2&ndash;3 rash guards + spats/shorts</li>
              <li>Ear guards if you use them</li>
              <li>Gi bag with ventilation</li>
            </ul>
            <p className="mt-3 text-xs text-gray-600">
              Read the <Link href="/blog/bjj-in-thailand-rise-top-camps" className="font-medium text-[#003580] underline">Thailand BJJ guide</Link> for academy options.
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#003580]">MMA / Boxing</p>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              <li>MMA gloves (4oz) if you already own</li>
              <li>Groin guard</li>
              <li>Heavy bag gloves or separate sparring gloves</li>
              <li>Fight shorts (buy locally is fine)</li>
            </ul>
            <p className="mt-3 text-xs text-gray-600">
              See <Link href="/blog/best-mma-camps-thailand" className="font-medium text-[#003580] underline">best MMA camps in Thailand</Link>.
            </p>
          </div>
        </div>
      </section>

      <GuideSection id="medical" variant="amber" className="mb-14">
        <h2 className="mb-4 text-2xl font-bold text-gray-900 md:text-3xl">Medical &amp; recovery kit</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { t: 'Electrolyte tablets or packets', d: 'You will sweat more than you plan for. Replace salts.' },
            { t: 'Blister tape, kinesio tape', d: 'Feet and shins thank you.' },
            { t: 'Anti-chafe balm', d: 'Humidity + friction = skin problems by day 4.' },
            { t: 'Ibuprofen / paracetamol', d: 'Available locally too, but bring a small supply.' },
            { t: 'Antiseptic cream', d: 'Small cuts are inevitable; mat staph risk is real for BJJ.' },
            { t: 'Mosquito repellent', d: 'Especially for island stays and evening runs.' },
            { t: 'Probiotics / stomach support', d: 'New diet + training = occasional stomach adjustment.' },
            { t: 'Insurance card / policy details', d: 'Printed and digital. Verify contact-sport coverage before you fly.' },
          ].map((item) => (
            <div key={item.t} className="rounded-lg border border-amber-200/80 bg-white/80 p-4 text-sm text-gray-800 shadow-sm">
              <p className="font-semibold text-gray-900">{item.t}</p>
              <p className="mt-1 text-gray-700">{item.d}</p>
            </div>
          ))}
        </div>
      </GuideSection>

      <GuideSection id="documents" variant="slate" className="mb-14">
        <div className="grid gap-8 md:grid-cols-2 md:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#003580]">Paperwork</p>
            <h2 className="mt-2 text-2xl font-bold text-gray-900 md:text-3xl">Documents &amp; money</h2>
            <ul className="mt-5 space-y-2 text-sm text-gray-700">
              <li>Passport with at least 6 months validity beyond your stay</li>
              <li>Printed accommodation confirmation for first night</li>
              <li>Return or onward ticket (airlines sometimes check)</li>
              <li>Digital + paper copies of visa, insurance, and prescriptions</li>
              <li>Two bank cards from different banks + some USD cash</li>
              <li>Emergency contact list (on paper, not just on phone)</li>
            </ul>
            <p className="mt-4 text-sm text-gray-700">
              For long stays, read the <Link href="/blog/thailand-training-visa-dtv" className="font-medium text-[#003580] underline">Thailand training visa / DTV guide</Link> and the{' '}
              <Link href="/blog/thailand-visa-extension-overstay-guide" className="font-medium text-[#003580] underline">visa extension guide</Link> before you fly.
            </p>
          </div>
          <figure className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="relative aspect-[4/3] w-full">
              <Image
                src="/highquality-world-map-vector-art_1112614-9909.jpg"
                alt="Travel planning for a Thailand training trip"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 520px"
              />
            </div>
            <figcaption className="px-4 py-3 text-xs text-gray-600">
              Have your paperwork organized before you fly&mdash;it reduces day-one friction.
            </figcaption>
          </figure>
        </div>
      </GuideSection>

      <section id="do-not-bring" className="mb-14 scroll-mt-24">
        <h2 className="mb-4 text-2xl font-bold text-gray-900 md:text-3xl">Do not bring</h2>
        <div className="max-w-3xl space-y-3 text-base leading-relaxed text-gray-800">
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>New gloves or shin guards</strong>&mdash;buy in Thailand for better price and fit.</li>
            <li><strong>A month of protein powder</strong>&mdash;heavy, expensive to fly, available locally.</li>
            <li><strong>Six pairs of jeans</strong>&mdash;you will wear shorts 95% of the trip.</li>
            <li><strong>&ldquo;Just in case&rdquo; gear</strong>&mdash;if you are not sure you will use it, you will not use it.</li>
            <li><strong>Expensive jewelry or watches</strong>&mdash;leave them at home; you are here to train, not flex.</li>
            <li><strong>A full first aid kit</strong>&mdash;bring the essentials, buy the rest at Boots or a pharmacy.</li>
          </ul>
        </div>
      </section>

      <GuideCtaStrip
        title="Book your Thailand camp and pack smart"
        subtitle="Browse verified listings by city and discipline to plan the trip properly."
        href="/search?country=Thailand"
        buttonLabel="Browse Thailand camps"
      />

      <GuideSection id="faq" variant="default" padding="p-6 md:p-8" className="mb-14 shadow-sm">
        <h2 className="mb-2 text-2xl font-bold text-gray-900 md:text-3xl">FAQ</h2>
        <p className="mb-8 text-gray-600">Practical packing questions from real training travelers.</p>
        <GuideFaqList items={FAQ_ITEMS} />
      </GuideSection>

      <RelatedGuides
        guides={[
          { title: "Beginner's guide to Muay Thai in Chiang Mai", href: '/blog/beginners-guide-muay-thai-chiang-mai' },
          { title: 'How much does a Muay Thai camp in Thailand cost?', href: '/blog/muay-thai-camp-thailand-cost' },
          { title: 'Thailand training visa / DTV guide', href: '/blog/thailand-training-visa-dtv' },
          { title: '25 best Muay Thai camps in Thailand (2026)', href: '/blog/best-muay-thai-camps-thailand-2026' },
        ]}
      />
    </ArticleShell>
  )
}
