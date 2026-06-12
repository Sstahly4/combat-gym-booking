import type { Metadata } from 'next'
import { ArticleShell } from '@/components/guides/article-shell'
import { RelatedGuides } from '@/components/guides/related-guides'
import { GuideStayTrainListingBlock } from '@/components/guides/guide-stay-train-listing-block'
import { GuideCtaStrip, GuideFaqList } from '@/components/guides/guide-page-blocks'
import { buildArticleLd, buildBreadcrumbLd, buildFaqLd } from '@/lib/seo/guide-schema'

const TITLE = 'Chiang Mai Muay Thai Train and Stay: Compare 2026 Stays'
const PATH = '/blog/chiang-mai-muay-thai-train-and-stay'
const DATE_PUBLISHED = '2026-06-11'
const DATE_MODIFIED = '2026-06-11'
const DESCRIPTION =
  'Find all-inclusive Muay Thai packages in Chiang Mai. Compare top-rated training camps featuring on-site rooms, gym facilities, and instant booking.'

export const metadata: Metadata = {
  title: `${TITLE} | CombatStay`,
  description: DESCRIPTION,
  alternates: { canonical: PATH },
  openGraph: { title: `${TITLE} | CombatStay`, description: DESCRIPTION, type: 'article' },
  twitter: { card: 'summary_large_image', title: `${TITLE} | CombatStay`, description: DESCRIPTION },
}

const FAQ_ITEMS = [
  {
    q: 'Do Chiang Mai Muay Thai camps include accommodation?',
    a: 'Many do, from shared dorms to private bungalows on gym property. Northern camps often target long-stay travelers with weekly or monthly bundles.',
  },
  {
    q: 'How much does Chiang Mai train and stay cost?',
    a: 'Chiang Mai usually sits below Phuket and Bangkok for comparable room tiers. Dorm packages can run well under private AC bungalows at the same gym. Check live listing prices.',
  },
  {
    q: 'Is Chiang Mai good for a month-long train-and-stay trip?',
    a: 'Yes. Cooler mornings from November through February and lower food costs make Chiang Mai a default long-stay base. Confirm minimum stay days on each package.',
  },
  {
    q: 'Are meals included in Chiang Mai camp packages?',
    a: 'Many camps include one or two Thai meals per day. Filter for the meals amenity, then read the package meal plan field.',
  },
  {
    q: 'Fan room or AC in Chiang Mai?',
    a: 'Fan rooms work in cool season. If you train through April or want reliable sleep, pay for AC in your assigned room.',
  },
]

export default function ChiangMaiMuayThaiTrainAndStayPage() {
  const articleLd = buildArticleLd({
    title: TITLE,
    description: DESCRIPTION,
    path: PATH,
    datePublished: DATE_PUBLISHED,
    dateModified: DATE_MODIFIED,
    imagePath: '/e079bedfbf7e870f827b4fda7ce2132f.avif',
  })

  return (
    <ArticleShell
      title={TITLE}
      subtitle="Chiang Mai train-and-stay packages with on-site rooms and live booking."
      breadcrumbs={[
        { label: 'Training Guides', href: '/blog' },
        { label: 'Chiang Mai', href: '/blog/best-muay-thai-gyms-chiang-mai' },
      ]}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(buildFaqLd(FAQ_ITEMS)) }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            buildBreadcrumbLd([
              { name: 'Home', path: '/' },
              { name: 'Training Guides', path: '/blog' },
              { name: 'Chiang Mai', path: '/blog/best-muay-thai-gyms-chiang-mai' },
              { name: TITLE, path: PATH },
            ])
          ),
        }}
      />

      <div className="mb-10 max-w-3xl space-y-4 text-base leading-relaxed text-gray-800">
        <p>
          Chiang Mai camps sell train-and-stay packages to travelers who want cooler mornings and lower daily burn than
          Phuket. Bungalows and dorm beds on gym property are common; commute is rarely the problem it is in Bangkok.
        </p>
        <p>
          Most northern packages run on twice-daily group schedules with Sunday rest. Compare room tier, meal count,
          and minimum stay on each listing below before you lock a month.
        </p>
      </div>

      <GuideStayTrainListingBlock
        city="Chiang Mai"
        accommodation
        limit={12}
        title="Chiang Mai Muay Thai train-and-stay packages"
        subtitle="Verified listings with on-site accommodation in northern Thailand."
        ctaUrl="/search?country=Thailand&location=Chiang%20Mai&discipline=Muay%20Thai&accommodation=true"
        ctaLabel="Browse Chiang Mai stay-and-train"
      />

      <GuideCtaStrip
        variant="light"
        title="Full Chiang Mai gym rankings"
        subtitle="Beginner tips, where to stay, and ranked listings."
        href="/blog/best-muay-thai-gyms-chiang-mai"
        buttonLabel="Chiang Mai city guide"
      />

      <section id="faq" className="mb-14 scroll-mt-24 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
        <h2 className="mb-6 text-2xl font-bold text-gray-900">FAQ</h2>
        <GuideFaqList items={FAQ_ITEMS} />
      </section>

      <RelatedGuides
        guides={[
          { title: 'Best Muay Thai gyms in Chiang Mai', href: '/blog/best-muay-thai-gyms-chiang-mai' },
          { title: "Beginner's guide to Muay Thai in Chiang Mai", href: '/blog/beginners-guide-muay-thai-chiang-mai' },
          { title: 'Thailand training camp with accommodation', href: '/blog/thailand-training-camp-with-accommodation' },
        ]}
      />
    </ArticleShell>
  )
}
