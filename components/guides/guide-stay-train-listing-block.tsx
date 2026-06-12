import Link from 'next/link'
import Image from 'next/image'
import { getThailandGymsForGuide } from '@/lib/guides/thailand-gyms'
import { mergeGymAmenitiesFromDb } from '@/lib/constants/gym-amenities'
import { gymCanonicalPath } from '@/lib/seo/gym-canonical-path'
import { GuideAccentIntro } from '@/components/guides/guide-page-blocks'
import { BedDouble } from 'lucide-react'

const DEFAULT_SEARCH_HREF = '/search?country=Thailand&discipline=Muay%20Thai&accommodation=true'
const FALLBACK_GYM_IMAGE = '/Khun_3_c4e13bdce8_c0b7f8b5b5.avif'
const FALLBACK_ROOM_IMAGE = '/training-center-1.avif'

function yesNo(v: boolean) {
  return v ? 'Yes' : '—'
}

function money(n: number | null | undefined, currency?: string | null) {
  if (typeof n !== 'number' || !Number.isFinite(n) || n <= 0) return '—'
  return `${currency || ''} ${Math.round(n)}`.trim()
}

function gymImages(g: { images?: Array<{ url?: string }> }) {
  const urls = (g.images || []).map((img) => img.url).filter(Boolean) as string[]
  return {
    gym: urls[0] || FALLBACK_GYM_IMAGE,
    room: urls[1] || urls[0] || FALLBACK_ROOM_IMAGE,
  }
}

function AmenityBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-800">
      {label}
    </span>
  )
}

function amenityBadges(amenities: ReturnType<typeof mergeGymAmenitiesFromDb>) {
  const out: string[] = []
  if (amenities.air_conditioning) out.push('AC')
  if (amenities.pool) out.push('Pool')
  if (amenities.meals) out.push('On-site food')
  return out
}

export type GuideStayTrainListingBlockProps = {
  id?: string
  title?: string
  subtitle?: string
  limit?: number
  city?: string
  accommodation?: boolean
  meals?: boolean
  ctaUrl?: string
  ctaLabel?: string
}

export async function GuideStayTrainListingBlock({
  id = 'listings',
  title = 'Train-and-stay camps with accommodation and meals',
  subtitle = 'Live verified listings. Filter defaults to on-site accommodation.',
  limit = 8,
  city,
  accommodation = true,
  meals = false,
  ctaUrl,
  ctaLabel = 'Browse all stay-and-train camps',
}: GuideStayTrainListingBlockProps) {
  const searchHref =
    ctaUrl ||
    (city
      ? `/search?country=Thailand&location=${encodeURIComponent(city)}&discipline=Muay%20Thai&accommodation=true`
      : DEFAULT_SEARCH_HREF)

  const gyms = await getThailandGymsForGuide({
    discipline: 'Muay Thai',
    ...(city ? { city } : {}),
  })

  const shortlist = gyms
    .map((g) => ({
      ...g,
      _amenities: mergeGymAmenitiesFromDb((g as any).amenities),
    }))
    .filter((g) => {
      const hasAcc = g._amenities.accommodation || g.offers_accommodation
      if (accommodation && !hasAcc) return false
      if (meals && !g._amenities.meals) return false
      return true
    })
    .sort((a, b) => {
      if (meals) {
        const aMeals = a._amenities.meals ? 1 : 0
        const bMeals = b._amenities.meals ? 1 : 0
        if (bMeals !== aMeals) return bMeals - aMeals
      }
      if (b.averageRating !== a.averageRating) return b.averageRating - a.averageRating
      if (b.reviewCount !== a.reviewCount) return b.reviewCount - a.reviewCount
      return (a.name || '').localeCompare(b.name || '')
    })
    .slice(0, limit)

  const emptyMessage = meals
    ? `No ${city ? `${city} ` : ''}listings currently show both accommodation and meals. Browse filtered search and confirm package inclusions on each gym profile.`
    : `No ${city ? `${city} ` : ''}listings currently show on-site accommodation. Browse filtered search and confirm room type on each gym profile.`

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
        <>
          <div className="space-y-4 md:hidden">
            {shortlist.map((g) => {
              const imgs = gymImages(g)
              const badges = amenityBadges(g._amenities)
              return (
                <div key={g.id} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                  <div className="grid grid-cols-2 gap-0.5 bg-gray-200">
                    <div className="relative aspect-[4/3] bg-gray-100">
                      <Image src={imgs.gym} alt={`${g.name} training floor`} fill className="object-cover" sizes="50vw" />
                      <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-white">
                        Gym
                      </span>
                    </div>
                    <div className="relative aspect-[4/3] bg-gray-100">
                      <Image src={imgs.room} alt={`${g.name} accommodation`} fill className="object-cover" sizes="50vw" />
                      <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-white">
                        Stay
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <Link href={gymCanonicalPath(g)} className="text-base font-semibold text-[#003580] underline">
                      {g.name}
                    </Link>
                    <p className="mt-1 text-xs text-gray-500">{g.city ? `${g.city}, Thailand` : 'Thailand'}</p>
                    {badges.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {badges.map((b) => (
                          <AmenityBadge key={b} label={b} />
                        ))}
                      </div>
                    )}
                    <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-700">
                      <div>
                        <dt className="font-medium text-gray-500">Rating</dt>
                        <dd>{g.averageRating ? g.averageRating.toFixed(2) : '—'}</dd>
                      </div>
                      <div>
                        <dt className="font-medium text-gray-500">From / day</dt>
                        <dd>{money((g as any).price_per_day, g.currency)}</dd>
                      </div>
                    </dl>
                    <Link
                      href={gymCanonicalPath(g)}
                      className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-[#003580] px-4 text-sm font-semibold text-white hover:bg-[#003580]/90"
                    >
                      View packages
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="hidden overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm md:block">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                <tr>
                  <th className="px-4 py-3">Gym</th>
                  <th className="px-4 py-3">Rating</th>
                  <th className="px-4 py-3">From / day</th>
                  <th className="px-4 py-3">Acc.</th>
                  <th className="px-4 py-3">Meals</th>
                  <th className="px-4 py-3">AC</th>
                  <th className="px-4 py-3">Pool</th>
                  <th className="px-4 py-3">Book</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-800">
                {shortlist.map((g) => (
                  <tr key={g.id} className="bg-white">
                    <td className="px-4 py-3 font-semibold">
                      <Link href={gymCanonicalPath(g)} className="text-[#003580] underline">
                        {g.name}
                      </Link>
                      <div className="mt-1 text-xs font-normal text-gray-500">{g.city || '—'}</div>
                    </td>
                    <td className="px-4 py-3">{g.averageRating ? g.averageRating.toFixed(2) : '—'}</td>
                    <td className="px-4 py-3">{money((g as any).price_per_day, g.currency)}</td>
                    <td className="px-4 py-3">{yesNo(g._amenities.accommodation || !!g.offers_accommodation)}</td>
                    <td className="px-4 py-3">{yesNo(g._amenities.meals)}</td>
                    <td className="px-4 py-3">{yesNo(g._amenities.air_conditioning)}</td>
                    <td className="px-4 py-3">{yesNo(g._amenities.pool)}</td>
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
        </>
      )}

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-gray-500">
          Package inclusions vary. Confirm meal count and room type on each gym profile before checkout.
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
