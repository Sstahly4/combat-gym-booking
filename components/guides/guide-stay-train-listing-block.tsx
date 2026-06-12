import Link from 'next/link'
import { getStayTrainShortlist, type StayTrainGym } from '@/lib/guides/stay-train-shortlist'
import { GuideAccentIntro } from '@/components/guides/guide-page-blocks'
import { GuideStayTrainGymCard } from '@/components/guides/guide-stay-train-gym-card'
import { BedDouble } from 'lucide-react'

const DEFAULT_SEARCH_HREF = '/search?country=Thailand&discipline=Muay%20Thai&accommodation=true'

export type GuideStayTrainListingBlockProps = {
  id?: string
  title?: string
  subtitle?: string
  limit?: number
  city?: string
  /** Alias for `city` (e.g. suburb "Chalong"). */
  location?: string
  accommodation?: boolean
  meals?: boolean
  ctaUrl?: string
  ctaLabel?: string
  /** Pass pre-fetched listings to avoid a duplicate query (e.g. from hub page hero). */
  gyms?: StayTrainGym[]
  /** When set, gym card clicks are tracked as brand-page alternative selections. */
  sourceBrandSlug?: string
}

export async function GuideStayTrainListingBlock({
  id = 'listings',
  title = 'Train-and-stay camps with accommodation and meals',
  subtitle = 'Live verified listings. Filter defaults to on-site accommodation.',
  limit = 8,
  city,
  location,
  accommodation = true,
  meals = false,
  ctaUrl,
  ctaLabel = 'Browse all stay-and-train camps',
  gyms: gymsProp,
  sourceBrandSlug,
}: GuideStayTrainListingBlockProps) {
  const area = location || city
  const searchHref =
    ctaUrl ||
    (area
      ? `/search?country=Thailand&location=${encodeURIComponent(area)}&discipline=Muay%20Thai&accommodation=true`
      : DEFAULT_SEARCH_HREF)

  const shortlist =
    gymsProp ??
    (await getStayTrainShortlist({
      city,
      location,
      accommodation,
      meals,
      limit,
    }))

  const emptyMessage = meals
    ? `No ${area ? `${area} ` : ''}listings currently show both accommodation and meals. Browse filtered search and confirm package inclusions on each gym profile.`
    : `No ${area ? `${area} ` : ''}listings currently show on-site accommodation. Browse filtered search and confirm room type on each gym profile.`

  return (
    <section id={id} className="mb-14 scroll-mt-24">
      <GuideAccentIntro icon={BedDouble} title={title} subtitle={subtitle} />

      {shortlist.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-700 shadow-sm md:p-8">
          {emptyMessage}
          <div className="mt-4">
            <Link href={searchHref} className="inline-flex min-h-11 items-center font-semibold text-[#003580] underline">
              Open filtered search →
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shortlist.map((g, i) => (
            <GuideStayTrainGymCard
              key={g.id}
              gym={g}
              priorityImage={i < 3}
              trackingLocation={sourceBrandSlug ? undefined : area}
              cardIndex={i}
              sourceBrandSlug={sourceBrandSlug}
            />
          ))}
        </div>
      )}

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-gray-500">
          Photos from live gym listings. Package inclusions vary; confirm room type and meals on each profile.
        </p>
        <Link
          href={searchHref}
          className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg bg-[#003580] px-5 text-sm font-semibold text-white hover:bg-[#003580]/90"
        >
          {ctaLabel}
        </Link>
      </div>
    </section>
  )
}
