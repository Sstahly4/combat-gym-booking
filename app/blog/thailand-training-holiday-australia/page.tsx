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
import { Calendar, Palmtree, Sun, Users } from 'lucide-react'

const TITLE = 'Thailand Training Holiday from Australia: Balance Training and Rest (2026)'
const SEO_TITLE = 'Thailand Training Holiday Australia 2026 [Beach, Leave and Camp Plans]'
const PATH = '/blog/thailand-training-holiday-australia'
const DATE_PUBLISHED = '2026-06-08'
const DATE_MODIFIED = '2026-06-08'
const HERO_IMAGE = '/training-center-1.avif'
const DESCRIPTION =
  'Turn annual leave into a Thailand training holiday: morning pads, afternoon beach, partner-friendly bases, and 10-day plans for Australians who want progress without burning out.'

export const metadata: Metadata = {
  title: `${SEO_TITLE} | CombatStay`,
  description: DESCRIPTION,
  alternates: { canonical: PATH },
  openGraph: { title: `${SEO_TITLE} | CombatStay`, description: DESCRIPTION, type: 'article' },
  twitter: { card: 'summary_large_image', title: `${SEO_TITLE} | CombatStay`, description: DESCRIPTION },
}

const FAQ_ITEMS = [
  {
    q: 'What is a Thailand training holiday for Australians?',
    a: 'You book a camp or gym package, train most mornings or afternoons, and protect the rest of the day for recovery, food, beach time, or sightseeing. It is not a fighter camp block with twice-daily sessions and no rest. It fits two weeks of annual leave better than a hardcore eight-week relocation.',
  },
  {
    q: 'How many leave days do Australians need for a training holiday?',
    a: 'Ten working days of annual leave plus a weekend gives you 16 calendar days. Add a public holiday on either end and you can stretch to 18–19 days without burning extra leave. Book the camp for the middle block and keep travel days light.',
  },
  {
    q: 'Best Thai destinations for a training holiday from Australia?',
    a: 'Phuket, Hua Hin, Koh Samui, and Krabi pair gyms with beach access and restaurant density. Chiang Mai trades beaches for cooler mornings and lower costs. Bangkok suits short urban holidays with stadium nights if your partner wants city culture while you train.',
  },
  {
    q: 'Can my partner join if they do not train Muay Thai?',
    a: 'Yes. Pick a base with pool, spa, and walkable cafes. Phuket and Hua Hin work well: they get beach days while you do a 90-minute session. Book accommodation with good Wi-Fi if they remote-work part of the trip.',
  },
  {
    q: 'How many training sessions per week on a holiday trip?',
    a: 'Four to five coached sessions per week is sustainable for most holiday travelers. Take two full rest days for tours, massage, or pool time. One session per day beats two-a-days when you also want dinners out and day trips.',
  },
  {
    q: 'All-inclusive camp or gym plus separate hotel?',
    a: 'All-inclusive simplifies meals and commute if the camp has a pool and decent rooms. Separate hotel works when your partner wants a different area (beach vs gym street) or you found a sale on a resort. Compare total price, not only the mat fee.',
  },
  {
    q: 'Is a training holiday worth it if I am a complete beginner?',
    a: 'Yes, if you pick a beginner-friendly camp and cap volume. You will not fight at Rajadamnern after ten days, but you can learn stance, pad flow, and basic conditioning while still enjoying Thailand. Read the beginner camp guide before you book.',
  },
  {
    q: 'How much does a Thailand training holiday cost from Australia in AUD?',
    a: 'Expect similar flight costs to any Thailand trip (often AUD 800–1,800+ return economy), plus slightly higher daily spend if you eat at tourist restaurants and book tours. Training packages run AUD 300–900+ depending on inclusions. Resort-style stays push accommodation up faster than gym dorms.',
  },
  {
    q: 'Can I work remotely during a training holiday?',
    a: 'Many Australians remote-work from Chiang Mai or Phuket between sessions. Book accommodation with reliable Wi-Fi and desk space. Train early, work mid-day, explore late afternoon. Do not schedule client calls during pad rounds.',
  },
  {
    q: 'Training holiday vs full Muay Thai trip from Australia?',
    a: 'A training holiday prioritizes rest days, partner comfort, and location vibe. A full training trip prioritizes volume, repeat sessions, and camp immersion. Same country, different weekly rhythm. Logistics for flights and visas are covered in our Australia-to-Thailand trip guide.',
  },
]

export default function ThailandTrainingHolidayAustraliaPage() {
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
      subtitle="Annual leave is finite. A training holiday uses four or five sessions a week and keeps the rest of the trip for beaches, food, and sleep."
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
        imageAlt="Thailand training holiday with Muay Thai and beach recovery"
        priority
        overlayText="Morning pads. Afternoon swim. You fly home tired in a good way, not broken."
      />

      <GuideLeadRow
        tocItems={[
          { href: '#holiday-vs-camp', label: 'Holiday vs hardcore camp' },
          { href: '#leave', label: 'Annual leave math' },
          { href: '#destinations', label: 'Best bases' },
          { href: '#partner', label: 'Non-training partners' },
          { href: '#week', label: 'Sample week' },
          { href: '#packages', label: 'Booking style' },
          { href: '#mistakes', label: 'Mistakes' },
          { href: '#faq', label: 'FAQ' },
        ]}
        statValue="4–5/wk"
        statDescription="Coached sessions per week that fit a holiday pace without wrecking the rest of your trip."
        statIcon={<Calendar className="h-5 w-5" />}
      />

      <section id="holiday-vs-camp" className="mb-14 scroll-mt-24">
        <GuideAccentIntro
          icon={Sun}
          title="Training holiday vs full training camp"
          subtitle="Same country, different weekly rhythm"
        />
        <div className="prose prose-gray max-w-none space-y-4 text-base leading-relaxed text-gray-800 md:prose-lg">
          <p>
            A Thailand training holiday from Australia means you fly home with new pad skills and a tan, not with shin
            splits and a resentment of stairs. You train enough to progress. You leave afternoons open for the reason
            you picked an island or a beach town in the first place.
          </p>
          <p>
            A full training camp block chases volume: twice-daily sessions, minimal tourism, early bedtimes. Fighters and
            serious hobbyists need that. Most Australians on two weeks of leave do not.
          </p>
          <p>
            For flights, visas, and AUD budgeting, read{' '}
            <Link href="/blog/muay-thai-trip-from-australia" className="font-medium text-[#003580] underline">
              Muay Thai trip from Australia
            </Link>
            . This page is about how you spend the days between landing and takeoff.
          </p>
        </div>
      </section>

      <GuideSection id="leave" variant="slate" className="mb-14">
        <h2 className="mb-6 text-2xl font-bold text-gray-900 md:text-3xl">Annual leave math for Australians</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#003580]">10 days leave</p>
            <p className="mt-2 text-sm leading-relaxed text-gray-700">
              Fly out Friday night, land Saturday, train from Monday. You get two weekends plus ten weekdays: roughly
              sixteen calendar days. Use travel days as rest, not double sessions.
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#003580]">15 days leave</p>
            <p className="mt-2 text-sm leading-relaxed text-gray-700">
              Three-week calendar block. Enough for five training days per week, two full rest days, and a day trip or
              fight night in Bangkok or Phuket without skipping sleep.
            </p>
          </div>
        </div>
        <p className="mt-6 text-sm leading-relaxed text-gray-700">
          Public holidays (Australia Day bridge, Easter, Queen&apos;s Birthday depending on state) stretch leave without
          extra days off work. Book camps early for December and January; Australian summer overlaps Thai peak season.
        </p>
      </GuideSection>

      <GuideSection id="destinations" variant="default" className="mb-14 border border-gray-200 bg-white">
        <GuideAccentIntro icon={Palmtree} title="Best Thailand bases for a training holiday" subtitle="Train hard, recover somewhere nice" />
        <GuideThreeCards
          items={[
            {
              title: 'Phuket',
              body: 'Beaches, restaurants, and a deep gym scene from tourist fundamentals to serious pads. Rawai and Chalong cluster fight gyms; west coast beaches sit twenty to forty minutes away. Good for couples and post-session swims.',
            },
            {
              title: 'Hua Hin',
              body: 'Calmer than Phuket, easier driving, royal-city food scene. Fewer backpacker parties, more long-stay retirees and golf tourists. Gyms are smaller in number but commute stress is low.',
            },
            {
              title: 'Koh Samui',
              body: 'Island holiday feel with a handful of solid Muay Thai gyms. Flights are often via Bangkok or Surat Thani. Rainy season timing differs from Phuket; check month-by-month before you book.',
            },
          ]}
        />
        <div className="mt-8 space-y-3 text-sm leading-relaxed text-gray-700">
          <p>
            <strong>Chiang Mai</strong> works if you prefer mountains and night markets over salt water. Mornings are
            cooler November to February. Partner can do cooking classes and temple walks while you train.
          </p>
          <p>
            City shortlists:{' '}
            <Link href="/blog/best-muay-thai-gyms-phuket" className="font-medium text-[#003580] underline">
              Phuket
            </Link>
            ,{' '}
            <Link href="/blog/best-muay-thai-gyms-hua-hin" className="font-medium text-[#003580] underline">
              Hua Hin
            </Link>
            ,{' '}
            <Link href="/blog/best-muay-thai-gyms-koh-samui" className="font-medium text-[#003580] underline">
              Koh Samui
            </Link>
            ,{' '}
            <Link href="/blog/best-muay-thai-gyms-chiang-mai" className="font-medium text-[#003580] underline">
              Chiang Mai
            </Link>
            .
          </p>
        </div>
      </GuideSection>

      <section id="partner" className="mb-14 scroll-mt-24">
        <GuideAccentIntro icon={Users} title="When your partner does not train" subtitle="Pick the base, not only the gym" />
        <div className="prose prose-gray max-w-none space-y-4 text-base leading-relaxed text-gray-800 md:prose-lg">
          <p>
            Your partner&apos;s day shapes where you stay. If they hate scooters and remote roads, do not book a gym down
            a dark soi forty minutes from the beach hotel they picked from photos.
          </p>
          <p>
            Look for camps with on-site pool and air-conditioned rooms, or stay at a beach hotel and commute to morning
            class. Phuket and Hua Hin split well: training hub in the morning, beach chair in the afternoon.
          </p>
          <p>
            Remote workers need desk space and backup internet. Ask the hotel about Wi-Fi stability before you assume
            cafe culture will carry work calls.
          </p>
        </div>
        <figure className="mt-8 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="relative aspect-[4/3] w-full">
            <Image
              src="/481020258.avif"
              alt="Muay Thai session as part of a balanced Thailand holiday"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 720px"
            />
          </div>
          <figcaption className="px-4 py-3 text-xs text-gray-600">
            One coached session plus recovery beats two sessions plus resentment when you only have two weeks off work.
          </figcaption>
        </figure>
      </section>

      <GuideSection id="week" variant="slate" className="mb-14">
        <h2 className="mb-6 text-2xl font-bold text-gray-900 md:text-3xl">Sample training holiday week (Phuket base)</h2>
        <div className="space-y-3 text-sm leading-relaxed text-gray-800">
          <p><strong>Monday:</strong> Morning pad class. Pool and lunch. Sunset walk.</p>
          <p><strong>Tuesday:</strong> Morning technique session. Afternoon massage. Early dinner.</p>
          <p><strong>Wednesday:</strong> Rest day. Island boat trip or old town food crawl.</p>
          <p><strong>Thursday:</strong> Morning pads. Gym sauna or ice if available. Quiet evening.</p>
          <p><strong>Friday:</strong> Morning class. Partner beach time. Optional stadium visit if both curious.</p>
          <p><strong>Saturday:</strong> Light session or open gym. Night market.</p>
          <p><strong>Sunday:</strong> Full rest. Sleep in. Plan next week&apos;s sessions around soreness.</p>
        </div>
        <p className="mt-6 text-sm leading-relaxed text-gray-700">
          Swap Phuket for Hua Hin or Samui and keep the same rhythm. Extend to ten days by repeating the pattern with one
          extra rest day mid-trip.
        </p>
      </GuideSection>

      <section id="packages" className="mb-14 scroll-mt-24">
        <h2 className="mb-6 text-2xl font-bold text-gray-900 md:text-3xl">How to book a training holiday</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {[
            {
              title: 'All-inclusive camp package',
              body: 'Room, meals, and training in one invoice. Less decision fatigue. Works when the camp has a pool, decent beds, and walkable food if meals are basic.',
            },
            {
              title: 'Gym plus separate resort',
              body: 'You pick the holiday hotel; gym is a morning commute. Partner gets the room they want. Compare Grab costs and morning traffic before you commit.',
            },
            {
              title: 'Hybrid week',
              body: 'First half at a training-focused camp, second half at a beach resort with drop-in classes. More admin, more variety. Good for fourteen-plus-day trips.',
            },
            {
              title: 'Book on CombatStay',
              body: 'Filter Thailand Muay Thai listings by city, read reviews for beginner-friendly signals, confirm class times, then book packages with clear cancellation terms.',
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
        title="Find a camp that fits a training holiday pace"
        subtitle="Verified listings with packages, reviews, and schedules."
        href="/search?country=Thailand&discipline=Muay%20Thai"
        buttonLabel="Browse Thailand camps"
      />

      <section id="mistakes" className="mb-14 scroll-mt-24">
        <h2 className="mb-6 text-2xl font-bold text-gray-900 md:text-3xl">Mistakes Australians make on training holidays</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {[
            {
              title: 'Booking a fighter camp for a holiday',
              body: 'Twice-daily mandatory sparring leaves no room for the beach. Read listing descriptions for tourist and fundamentals classes.',
            },
            {
              title: 'Stacking tours on rest days',
              body: 'Phi Phi speedboat plus full moon party plus pads the next morning equals illness. Protect at least one slow day per week.',
            },
            {
              title: 'Ignoring partner logistics',
              body: 'If they are stuck at a remote villa with no footpaths, you will skip sessions to fix morale. Book for both travelers.',
            },
            {
              title: 'Treating alcohol like recovery',
              body: 'Chang beer after pads feels like a reward. Your sleep and shins disagree. Pick two nights out, not seven.',
            },
            {
              title: 'Zero rest days because leave feels short',
              body: 'Four sessions in six days beats six sessions in six days for holiday travelers. Progress needs sleep.',
            },
            {
              title: 'Skipping travel insurance sports cover',
              body: 'Holiday vibe does not mean low injury risk. Pad work still breaks toes. Upgrade insurance before you fly.',
            },
          ].map((item) => (
            <div key={item.title} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-gray-900">{item.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-gray-700">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <GuideSection variant="amber" className="mb-14">
        <h2 className="text-2xl font-bold text-gray-900 md:text-3xl">Holiday pace, real progress</h2>
        <p className="mt-3 text-sm leading-relaxed text-gray-800">
          Four coached sessions per week for two weeks gives you roughly eight to ten quality pad classes. That is enough
          to fix your stance, learn a basic combination chain, and feel the sport in your body. You will not leave a
          stadium-ready fighter. You will leave with a skill you can train at home and a trip your partner wants to
          repeat.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-gray-800">
          New to Muay Thai? Pair this guide with{' '}
          <Link href="/blog/best-muay-thai-camp-thailand-beginners" className="font-medium text-[#003580] underline">
            how to pick a beginner camp
          </Link>{' '}
          and{' '}
          <Link href="/blog/muay-thai-camp-1-week-vs-1-month" className="font-medium text-[#003580] underline">
            one week vs one month
          </Link>{' '}
          to set expectations.
        </p>
      </GuideSection>

      <GuideSection id="faq" variant="default" padding="p-6 md:p-8" className="mb-14 shadow-sm">
        <h2 className="mb-2 text-2xl font-bold text-gray-900 md:text-3xl">FAQ</h2>
        <p className="mb-8 text-gray-600">Thailand training holiday questions from Australian travelers.</p>
        <GuideFaqList items={FAQ_ITEMS} />
      </GuideSection>

      <GuideCtaStrip
        variant="light"
        title="Book a Thailand training holiday"
        subtitle="Compare camps by city, package type, and guest reviews."
        href="/search?country=Thailand&discipline=Muay%20Thai"
        buttonLabel="Find your camp"
      />

      <RelatedGuides
        guides={[
          { title: 'Muay Thai trip from Australia (flights & visas)', href: '/blog/muay-thai-trip-from-australia' },
          { title: 'Best Muay Thai camp for beginners in Thailand', href: '/blog/best-muay-thai-camp-thailand-beginners' },
          { title: 'Best Muay Thai gyms in Phuket', href: '/blog/best-muay-thai-gyms-phuket' },
          { title: 'Best Muay Thai gyms in Hua Hin', href: '/blog/best-muay-thai-gyms-hua-hin' },
          { title: '1-week vs 1-month Muay Thai camps', href: '/blog/muay-thai-camp-1-week-vs-1-month' },
        ]}
      />
    </ArticleShell>
  )
}
