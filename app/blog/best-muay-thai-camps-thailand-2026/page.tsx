import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArticleShell } from '@/components/guides/article-shell'
import { RelatedGuides } from '@/components/guides/related-guides'
import { ChunkedGymGrid } from '@/components/guides/chunked-gym-grid'
import {
  GuideAccentIntro,
  GuideCtaStrip,
  GuideFaqList,
  GuideFeatureGrid,
  GuideHero,
  GuideLeadRow,
  GuideSection,
  GuideThreeCards,
} from '@/components/guides/guide-page-blocks'
import { getThailandGymsForGuide } from '@/lib/guides/thailand-gyms'
import {
  buildArticleLd,
  buildBreadcrumbLd,
  buildFaqLd,
  buildGymItemListLd,
} from '@/lib/seo/guide-schema'
import { Check, MapPin, Shield, Sparkles } from 'lucide-react'

const PATH = '/blog/best-muay-thai-camps-thailand-2026'
const DATE_PUBLISHED = '2025-10-15'
const DATE_MODIFIED = '2026-04-21'
const HERO_IMAGE = '/Khun_3_c4e13bdce8_c0b7f8b5b5.avif'

const TITLE = '25 Best Muay Thai Camps in Thailand (2026)'
const SEO_TITLE = '25 Best Muay Thai Camps in Thailand 2026 [Prices + Reviews]'
const DESCRIPTION =
  'Ranked 2026 guide to the best Muay Thai camps in Thailand. Compare real prices, guest reviews, and training packages in Bangkok, Phuket, Chiang Mai and more—book directly on Combatbooking.'

export const metadata: Metadata = {
  title: `${SEO_TITLE} | Combatbooking`,
  description: DESCRIPTION,
  alternates: { canonical: PATH },
  openGraph: {
    title: `${SEO_TITLE} | Combatbooking`,
    description: DESCRIPTION,
    type: 'article',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SEO_TITLE} | Combatbooking`,
    description: DESCRIPTION,
  },
}

const FAQ_ITEMS = [
  {
    q: 'How did you pick the “25 best” Muay Thai camps in Thailand?',
    a: 'We start from verified and trusted Thailand listings that include Muay Thai on the gym profile, then rank primarily by review score and review volume so community feedback matters. Ties break alphabetically. Rankings refresh as new reviews and listing updates come in.',
  },
  {
    q: 'Why might a famous camp be missing from this list?',
    a: 'Only gyms that are live on CombatBooking with Muay Thai in disciplines are eligible. If a legendary camp has not published a verified listing yet, it cannot appear here until it joins the marketplace.',
  },
  {
    q: 'Are prices on this page guaranteed?',
    a: 'Cards show the prices and currency stored on each gym profile. Promotions, seasonal rates, and package inclusions can change—always confirm on the gym page before you book.',
  },
  {
    q: 'Where do class schedules come from?',
    a: 'When owners add a structured training schedule, we show a short snippet on cards. Full timetables, pad rounds, and beginner vs fighter classes are on each gym profile.',
  },
  {
    q: 'Bangkok, Phuket, or Chiang Mai for Muay Thai?',
    a: 'Bangkok offers maximum convenience and fight-scene density. Phuket blends beaches with serious camps. Chiang Mai suits a slower pace and cooler weather. There is no single “best” region—match the city to your budget, climate preference, and how much tourism you want around training.',
  },
  {
    q: 'Do I need a special visa to train Muay Thai in Thailand?',
    a: 'There is no single global “Muay Thai visa.” Most travelers use standard entry routes appropriate to their nationality and stay length. For longer trips, read our DTV / training visa overview and confirm with official immigration sources.',
  },
  {
    q: 'Can beginners use this list?',
    a: 'Yes. Rankings reflect overall listing quality and reviews—not “fighters only.” Read each gym description for beginner-friendly classes, fundamentals blocks, and whether sparring is optional.',
  },
  {
    q: 'How is this different from other “best camps” blogs?',
    a: 'Many blogs recycle seven hand-picked gyms with static text. This guide ranks up to 25 camps from a live directory, shows real pricing and schedule data when available, and links straight to booking-ready profiles.',
  },
  {
    q: 'How much does it cost to train Muay Thai in Thailand?',
    a: 'Costs vary by city, package type, and whether accommodation/meals are included. Use this guide to shortlist camps, then confirm current package pricing on each gym page—monthly bundles can be better value than paying day-to-day. For a fuller breakdown, read our Thailand Muay Thai camp cost guide.',
  },
  {
    q: 'How long should I stay to see real progress?',
    a: 'Most travelers notice meaningful progress with 2–4 weeks of consistent training and enough recovery. One week is great for experience; longer stays are where technique repetition and conditioning compound. If you are deciding between trip lengths, read our 1-week vs 1-month camp guide.',
  },
  {
    q: 'Is it safe for beginners to train twice per day?',
    a: 'It can be, but build up gradually. Start with one daily session for a few days, add mobility work, sleep more than you think, and treat sparring as optional unless your coach recommends it.',
  },
  {
    q: 'What should I pack for a Thailand training camp?',
    a: 'Bring wraps, a mouthguard, lightweight training clothes, and basic first-aid (tape/blister care). Many travelers buy gloves/shin guards locally to avoid luggage weight—confirm gear rules on each gym profile. For a full checklist, read our Thailand combat sports packing list.',
  },
]

const BETWEEN_CHUNKS: Array<{ title: string; body: ReactNode }> = [
  {
    title: 'The review leaders',
    body: (
      <>
        <p>
          The top five positions skew toward camps with strong recent reviews and enough volume that the score means
          something—not a single five-star review from a friend. These are often the first stops for travelers who want
          confidence that other guests enjoyed the experience.
        </p>
        <p>
          If you are comparing two camps in this band, look past the rank number: check morning vs evening sessions,
          whether accommodation is on-site, and how many days per week you realistically plan to train.
        </p>
      </>
    ),
  },
  {
    title: 'High-quality alternatives',
    body: (
      <>
        <p>
          Camps ranked six through ten are still drawn from the same strict filter—verified Thailand gyms with Muay Thai
          tagged—so you are not looking at random drop-ins. The difference is often review count, recency, or a few
          points on average rating.
        </p>
        <p>
          This band is where savvy bookers sometimes find better availability or a more relaxed vibe while keeping
          professional coaching. Always read the full profile for coach ratios and class structure.
        </p>
      </>
    ),
  },
  {
    title: 'Solid picks with momentum',
    body: (
      <>
        <p>
          Mid-list camps can be perfect if your dates overlap peak season elsewhere, or if you want a smaller room line
          at the front desk. Use filters on{' '}
          <Link href="/search?country=Thailand&discipline=Muay%20Thai" className="text-[#003580] font-medium underline">
            Thailand Muay Thai search
          </Link>{' '}
          to sort by price, location, and amenities after you shortlist names from this article.
        </p>
        <p>
          Remember: a camp ranked #14 for the whole country can still be the best choice for your neighborhood, budget,
          or training hours.
        </p>
      </>
    ),
  },
  {
    title: 'Worth comparing side by side',
    body: (
      <>
        <p>
          As we move deeper into the top twenty-five, you will still see legitimate camps with full pricing and photos—the
          ranking gap is usually about review history, not safety. Cross-check distance to your accommodation and commute
          time in Thai traffic if you are not staying on-site.
        </p>
      </>
    ),
  },
  {
    title: 'Completing the shortlist',
    body: (
      <>
        <p>
          The final slots round out a national shortlist so you have twenty-five names to compare without hunting through
          forums. If none of these fit your dates, browse the full directory—CombatBooking lists every qualifying Muay Thai
          camp in Thailand, not only this page.
        </p>
      </>
    ),
  },
]

export default async function BestMuayThaiCampsThailand2026Page() {
  const allMuayThai = await getThailandGymsForGuide({ discipline: 'Muay Thai' })
  const totalListed = allMuayThai.length
  const top25 = allMuayThai.slice(0, 25)

  const itemList = buildGymItemListLd({ name: TITLE, gyms: top25 })
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
    { name: 'Best Muay Thai Camps in Thailand (2026)', path: PATH },
  ])

  return (
    <ArticleShell
      title={TITLE}
      subtitle="Live rankings, real prices, and honest regional advice—built for people searching “best Muay Thai camps Thailand” who are tired of recycled top-seven lists."
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
        imageAlt="Muay Thai training in Thailand"
        priority
        overlayText="Find the right camp faster: ranked gyms, transparent pricing signals, and regional context—then book on CombatBooking."
      />

      <GuideLeadRow
        tocItems={[
          { href: '#why-thailand', label: 'Why Thailand' },
          { href: '#regions', label: 'Regions' },
          { href: '#methodology', label: 'How we rank' },
          { href: '#budget', label: 'Budget & packing' },
          { href: '#ranked-camps', label: 'Top 25 camps' },
          { href: '#faq', label: 'FAQ' },
        ]}
        statValue={totalListed}
        statDescription="Verified/trusted Muay Thai camps in Thailand on CombatBooking (this article ranks the top 25)."
        statIcon={<Sparkles className="h-5 w-5" />}
      />

      <GuideSection variant="slate" className="mb-14">
        <div className="grid gap-8 md:grid-cols-2 md:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#003580]">What to expect</p>
            <h2 className="mt-2 text-2xl font-bold text-gray-900 md:text-3xl">A quick visual: Thailand camp life</h2>
            <p className="mt-3 text-base leading-relaxed text-gray-700">
              Most travelers bounce between pad rounds, group technique, conditioning, and recovery. Use the ranked cards
              below to shortlist—then open each profile to confirm schedules, package inclusions, and coach ratios.
            </p>
          </div>
          <figure className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="relative aspect-[4/3] w-full">
              <Image
                src="/training-center-1.avif"
                alt="Training session visual from Thailand camp guide"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 520px"
              />
            </div>
            <figcaption className="px-4 py-3 text-xs text-gray-600">
              Tip: if you’re staying 2+ weeks, pick a camp you can commute to twice daily without burning hours in traffic.
            </figcaption>
          </figure>
        </div>
      </GuideSection>

      <section id="why-thailand" className="mb-14 scroll-mt-24">
        <GuideAccentIntro
          icon={MapPin}
          title="Why Thailand is still the default for Muay Thai training"
          subtitle="Updated for 2026 trip planning"
        />
        <div className="prose prose-gray max-w-none space-y-4 text-base leading-relaxed text-gray-800 md:prose-lg">
          <p>
            If you are searching for the <strong>best Muay Thai camps in Thailand</strong>, you are already choosing the
            country with the deepest coaching lineage, the widest range of camp styles, and the most fight-week ecosystem
            support anywhere in the world. That does not mean every gym is perfect—it means you have enough volume to
            match <em>your</em> goals: tourist-friendly fundamentals, fighter-focused fight camps, or something in between.
          </p>
          <p>
            Unlike generic travel blogs that cherry-pick seven famous names, this guide starts from a{' '}
            <strong>live marketplace</strong>: gyms must be verified or trusted on CombatBooking and must list Muay Thai
            as a discipline. We then rank the top twenty-five using review signals so the list stays accountable as new
            guests train and leave feedback.
          </p>
          <p>
            Use the ranked cards below as a shortcut, but treat each profile as the source of truth for{' '}
            <strong>class times</strong>, <strong>accommodation</strong>, <strong>meals</strong>, and{' '}
            <strong>what is included in each package</strong>—those details change faster than any annual blog post can
            be rewritten by hand.
          </p>
        </div>
      </section>

      <GuideSection id="regions" variant="slate" className="mb-14">
        <h2 className="mb-6 text-2xl font-bold text-gray-900 md:text-3xl">Bangkok vs Phuket vs Chiang Mai (and where this list fits)</h2>
        <GuideThreeCards
          items={[
            {
              title: 'Bangkok',
              body: 'Maximum connectivity, huge variety, and easy access to stadium culture if you want to watch fights between sessions. Traffic and heat can wear on you—pick a camp whose schedule fits your commute if you are not staying on-site.',
            },
            {
              title: 'Phuket & islands',
              body: 'Beach lifestyle plus serious training is a powerful combo. Seasonality matters for crowds and cost. Compare total trip price—not only per-day training—when you add food and transport.',
            },
            {
              title: 'Chiang Mai & north',
              body: 'Cooler mornings and a slower pace suit longer stays and digital-nomad style routines. Fight density differs from Bangkok—choose based on lifestyle fit, not hype.',
            },
          ]}
        />
        <p className="mt-8 text-center text-sm text-gray-600">
          Want city-only shortlists? See{' '}
          <Link href="/blog/best-muay-thai-gyms-phuket" className="font-medium text-[#003580] underline">
            Phuket
          </Link>
          ,{' '}
          <Link href="/blog/best-muay-thai-gyms-bangkok" className="font-medium text-[#003580] underline">
            Bangkok
          </Link>
          , and{' '}
          <Link href="/blog/best-muay-thai-gyms-chiang-mai" className="font-medium text-[#003580] underline">
            Chiang Mai
          </Link>{' '}
          guides—or stay on this page for the national top 25.
        </p>
      </GuideSection>

      <GuideSection variant="slate" className="mb-14">
        <div className="grid gap-8 md:grid-cols-2 md:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#003580]">Selection framework</p>
            <h2 className="mt-2 text-2xl font-bold text-gray-900 md:text-3xl">How to pick the best Muay Thai camp for you</h2>
            <div className="mt-3 space-y-3 text-base leading-relaxed text-gray-700">
              <p>
                The phrase <strong>best Muay Thai camp in Thailand</strong> means different things: some travelers want a
                beginner-friendly fundamentals track; others want a fighter-heavy room and stadium exposure.
              </p>
              <p>
                Use this quick framework before you obsess over rank numbers: choose your ideal <strong>weekly schedule</strong>,
                your preferred <strong>city/lifestyle</strong>, and the <strong>intensity</strong> you can sustain for 2–6 weeks.
              </p>
              <p>
                Then compare camps by what actually drives outcomes: coaching feedback frequency, class structure, recovery support,
                and whether you can realistically show up twice per day.
              </p>
            </div>
          </div>
          <figure className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="relative aspect-[4/3] w-full">
              <Image
                src="/481020258.avif"
                alt="Muay Thai training pads and gloves"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 520px"
              />
            </div>
            <figcaption className="px-4 py-3 text-xs text-gray-600">
              Consistency beats perfect planning: pick a camp you can attend (and recover from) week after week.
            </figcaption>
          </figure>
        </div>
      </GuideSection>

      <GuideSection variant="default" className="mb-14 border border-gray-200 bg-white">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#003580]">Further reading</p>
        <h2 className="mt-2 text-2xl font-bold text-gray-900 md:text-3xl">Helpful official and reference links</h2>
        <p className="mt-3 max-w-3xl text-base leading-relaxed text-gray-700">
          If you’re planning a longer trip, keep a few official pages bookmarked so you can verify updates right before you travel.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <a
            href="https://www.tmd.go.th/en/"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <p className="text-sm font-semibold text-gray-900">Thai Meteorological Department (TMD)</p>
            <p className="mt-1 text-xs text-gray-600">Weather/seasonality checks before you pick a region.</p>
            <p className="mt-3 text-xs font-semibold text-[#003580]">Open →</p>
          </a>
          <a
            href="https://www.tourismthailand.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <p className="text-sm font-semibold text-gray-900">Tourism Authority of Thailand (TAT)</p>
            <p className="mt-1 text-xs text-gray-600">Official destination information and travel updates.</p>
            <p className="mt-3 text-xs font-semibold text-[#003580]">Open →</p>
          </a>
        </div>
      </GuideSection>

      <section id="methodology" className="mb-14 scroll-mt-24">
        <h2 className="mb-4 text-2xl font-bold text-gray-900 md:text-3xl">How we rank the top 25 Muay Thai camps</h2>
        <div className="mb-6 space-y-4 text-base leading-relaxed text-gray-800">
          <p>
            Transparency matters for SEO and for travelers. Our ordering is <strong>algorithmic, not pay-to-play</strong>:
            we start from all Thailand Muay Thai gyms that meet verification rules, then sort primarily by average review
            rating and number of reviews, with alphabetical tie-breaking.
          </p>
        </div>
        <GuideFeatureGrid
          items={[
            {
              icon: <Check className="h-5 w-5 text-green-600" aria-hidden />,
              title: 'Eligible gyms',
              text: 'must be verified or trusted and list Muay Thai in disciplines.',
            },
            {
              icon: <Check className="h-5 w-5 text-green-600" aria-hidden />,
              title: 'Review signal',
              text: 'rewards camps guests actually rate—volume matters so one-off scores do not dominate.',
            },
            {
              icon: <Check className="h-5 w-5 text-green-600" aria-hidden />,
              title: 'Live data',
              text: 'on cards: pricing, photos, and schedule snippets come from each gym profile.',
            },
            {
              icon: <Shield className="h-5 w-5 text-[#003580]" aria-hidden />,
              title: 'Not legal or medical advice',
              text: 'always confirm injuries, insurance, and gym rules on site.',
            },
          ]}
        />
      </section>

      <GuideSection id="budget" variant="amber" className="mb-14">
        <h2 className="mb-4 text-2xl font-bold text-gray-900 md:text-3xl">Budget, packing, and your first week</h2>
        <div className="grid gap-8 md:grid-cols-2">
          <div className="space-y-3 text-sm leading-relaxed text-gray-800">
            <h3 className="text-lg font-semibold text-gray-900">What affects your total cost</h3>
            <p>
              Day-rate training is only one line item. Accommodation on-site, meals, laundry, scooter or Grab budget, and
              whether you join add-ons like private lessons or massage all move the needle. Use each gym profile to compare
              package types—not only the headline daily rate.
            </p>
            <p>
              If you are price sensitive, sort the{' '}
              <Link href="/search?country=Thailand&discipline=Muay%20Thai" className="font-medium text-[#003580] underline">
                full Thailand Muay Thai directory
              </Link>{' '}
              by price after you identify camps you like from this ranked list.
            </p>
            <p>
              For real 2026 numbers, use{' '}
              <Link href="/blog/muay-thai-camp-thailand-cost" className="font-medium text-[#003580] underline">
                how much a Muay Thai camp costs in Thailand
              </Link>{' '}
              (includes a summary pricing table), then compare that against the cities in this guide.
            </p>
          </div>
          <div className="space-y-3 text-sm leading-relaxed text-gray-800">
            <h3 className="text-lg font-semibold text-gray-900">Packing and etiquette basics</h3>
            <p>
              Bring quick-dry gear, sandals for wet bathrooms, and a separate bag for sweaty clothes. Respect pad holders,
              show up clean, and ask about gym culture before filming—some camps are strict about phones on the mat.
            </p>
            <p>
              Planning a longer stay? Read{' '}
              <Link href="/blog/thailand-training-visa-dtv" className="font-medium text-[#003580] underline">
                Thailand training visa &amp; DTV considerations
              </Link>{' '}
              early so your booking window matches your entry rules.
            </p>
            <p>
              If you are extending beyond a quick holiday-style trip, also read{' '}
              <Link href="/blog/ed-visa-martial-arts-training-thailand" className="font-medium text-[#003580] underline">
                visas for martial arts training in Thailand (ED visa + alternatives)
              </Link>{' '}
              and keep official sources bookmarked.
            </p>
          </div>
        </div>
        <div className="mt-8 rounded-xl border border-amber-200/70 bg-white/80 p-5 text-sm text-gray-800 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#003580]">Quick planning guides</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <Link href="/blog/packing-list-combat-sports-camp-thailand" className="font-medium text-[#003580] underline">
              Packing list for a combat sports camp in Thailand
            </Link>
            <Link href="/blog/muay-thai-camp-1-week-vs-1-month" className="font-medium text-[#003580] underline">
              1-week vs 1-month Muay Thai camps: what to expect
            </Link>
            <Link href="/blog/beginners-guide-muay-thai-chiang-mai" className="font-medium text-[#003580] underline">
              Beginner&apos;s guide to Muay Thai in Chiang Mai
            </Link>
            <Link href="/blog/koh-tao-vs-koh-phangan-muay-thai" className="font-medium text-[#003580] underline">
              Koh Tao vs Koh Phangan: where to train?
            </Link>
          </div>
        </div>
      </GuideSection>

      <GuideCtaStrip
        title={`Browse all ${totalListed} Muay Thai camps in Thailand`}
        subtitle="Filter by city, price, and more—beyond this top 25 shortlist."
        href="/search?country=Thailand&discipline=Muay%20Thai"
        buttonLabel="Open directory"
        variant="light"
      />

      <section id="ranked-camps" className="mb-16 scroll-mt-24">
        <h2 className="mb-2 text-2xl font-bold text-gray-900 md:text-3xl">The 25 best Muay Thai camps in Thailand (ranked)</h2>
        <p className="mb-8 max-w-3xl text-base text-gray-600">
          Below is the full national ranking. Structured data on this page uses the same order: position #1 is first, through
          #{top25.length}. We break the grid into five sections so you get context between batches—not an endless wall of
          cards.
        </p>

        <ChunkedGymGrid
          gyms={top25}
          chunkSize={5}
          fallbackImageSrc={HERO_IMAGE}
          editorialBetweenChunks={BETWEEN_CHUNKS}
          rankEyebrow="national"
        />
      </section>

      <section id="faq" className="mb-14 scroll-mt-24">
        <h2 className="mb-2 text-2xl font-bold text-gray-900 md:text-3xl">Frequently asked questions</h2>
        <p className="mb-8 max-w-3xl text-gray-600">
          Quick answers for the most common questions people ask when comparing Muay Thai training camps in Thailand.
        </p>
        <GuideFaqList items={FAQ_ITEMS} />
      </section>

      <GuideCtaStrip
        title="Ready to lock in your Thailand Muay Thai camp?"
        subtitle="You've seen the top 25 — compare live prices, reviews, and dates, then book in a few clicks."
        href="/search?country=Thailand&discipline=Muay%20Thai"
        buttonLabel="Browse all camps & book"
      />

      <RelatedGuides
        guides={[
          { title: 'Best Muay Thai gyms in Phuket', href: '/blog/best-muay-thai-gyms-phuket' },
          { title: 'Best Muay Thai gyms in Bangkok', href: '/blog/best-muay-thai-gyms-bangkok' },
          { title: 'Best Muay Thai gyms in Chiang Mai', href: '/blog/best-muay-thai-gyms-chiang-mai' },
          { title: 'Muay Thai camps with private AC rooms in Krabi', href: '/blog/muay-thai-krabi-private-ac-rooms' },
          { title: 'Best Muay Thai gym for female solo travelers (2026)', href: '/blog/best-muay-thai-gym-female-solo-travelers-2026' },
          { title: 'Fight prep camps with on-site physiotherapy', href: '/blog/muay-thai-fight-prep-camps-physiotherapy' },
          { title: 'Thailand training visa / DTV', href: '/blog/thailand-training-visa-dtv' },
          { title: 'Best MMA camps in Thailand', href: '/blog/best-mma-camps-thailand' },
          { title: 'Best BJJ gyms in Thailand', href: '/blog/best-bjj-gyms-thailand' },
        ]}
      />
    </ArticleShell>
  )
}
