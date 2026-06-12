import Link from 'next/link'
import { getThailandGymsForGuide } from '@/lib/guides/thailand-gyms'
import { mergeGymAmenitiesFromDb } from '@/lib/constants/gym-amenities'
import { gymCanonicalPath } from '@/lib/seo/gym-canonical-path'
import { GuideAccentIntro } from '@/components/guides/guide-page-blocks'
import { BedDouble } from 'lucide-react'

const SEARCH_HREF = '/search?country=Thailand&discipline=Muay%20Thai&accommodation=true'

function yesNo(v: boolean) {
  return v ? 'Yes' : '—'
}

function money(n: number | null | undefined, currency?: string | null) {
  if (typeof n !== 'number' || !Number.isFinite(n) || n <= 0) return '—'
  return `${currency || ''} ${Math.round(n)}`.trim()
}

export async function GuideStayTrainListingBlock({
  id = 'listings',
  title = 'Train-and-stay camps with accommodation and meals',
  subtitle = 'Live verified listings. Filter defaults to on-site accommodation.',
  limit = 8,
}: {
  id?: string
  title?: string
  subtitle?: string
  limit?: number
}) {
  const gyms = await getThailandGymsForGuide({ discipline: 'Muay Thai' })
  const shortlist = gyms
    .map((g) => ({
      ...g,
      _amenities: mergeGymAmenitiesFromDb((g as any).amenities),
    }))
    .filter(
      (g) =>
        (g._amenities.accommodation || g.offers_accommodation) &&
        g._amenities.meals
    )
    .sort((a, b) => {
      if (b.averageRating !== a.averageRating) return b.averageRating - a.averageRating
      if (b.reviewCount !== a.reviewCount) return b.reviewCount - a.reviewCount
      return (a.name || '').localeCompare(b.name || '')
    })
    .slice(0, limit)

  return (
    <section id={id} className="mb-14 scroll-mt-24">
      <GuideAccentIntro icon={BedDouble} title={title} subtitle={subtitle} />

      {shortlist.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-700 shadow-sm md:p-8">
          No listings currently show both accommodation and meals. Browse Thailand camps and confirm package
          inclusions on each gym profile.
          <div className="mt-4">
            <Link href={SEARCH_HREF} className="inline-flex min-h-11 items-center font-semibold text-[#003580] underline">
              Open filtered search →
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Mobile: card stack */}
          <div className="space-y-3 md:hidden">
            {shortlist.map((g) => (
              <div key={g.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <Link href={gymCanonicalPath(g)} className="text-base font-semibold text-[#003580] underline">
                  {g.name}
                </Link>
                <p className="mt-1 text-xs text-gray-500">
                  {g.city ? `${g.city}, ` : ''}Thailand
                </p>
                <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-700">
                  <div>
                    <dt className="font-medium text-gray-500">Rating</dt>
                    <dd>{g.averageRating ? g.averageRating.toFixed(2) : '—'}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-500">From / day</dt>
                    <dd>{money((g as any).price_per_day, g.currency)}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-500">On-site acc.</dt>
                    <dd>{yesNo(g._amenities.accommodation || !!g.offers_accommodation)}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-500">Meals</dt>
                    <dd>{yesNo(g._amenities.meals)}</dd>
                  </div>
                </dl>
                <Link
                  href={gymCanonicalPath(g)}
                  className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-[#003580] px-4 text-sm font-semibold text-white hover:bg-[#003580]/90"
                >
                  View packages
                </Link>
              </div>
            ))}
          </div>

          {/* Desktop: table */}
          <div className="hidden overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm md:block">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                <tr>
                  <th className="px-4 py-3">Gym</th>
                  <th className="px-4 py-3">City</th>
                  <th className="px-4 py-3">Rating</th>
                  <th className="px-4 py-3">From / day</th>
                  <th className="px-4 py-3">Acc.</th>
                  <th className="px-4 py-3">Meals</th>
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
                    </td>
                    <td className="px-4 py-3">{g.city || '—'}</td>
                    <td className="px-4 py-3">{g.averageRating ? g.averageRating.toFixed(2) : '—'}</td>
                    <td className="px-4 py-3">{money((g as any).price_per_day, g.currency)}</td>
                    <td className="px-4 py-3">{yesNo(g._amenities.accommodation || !!g.offers_accommodation)}</td>
                    <td className="px-4 py-3">{yesNo(g._amenities.meals)}</td>
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
          href={SEARCH_HREF}
          className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg bg-[#003580] px-5 text-sm font-semibold text-white hover:bg-[#003580]/90"
        >
          Browse all stay-and-train camps
        </Link>
      </div>
    </section>
  )
}
