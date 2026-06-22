import Link from 'next/link'
import { getTier4AmenityLinksForCity } from '@/lib/guides/tier4-amenity-guides'

export async function GuideAmenityMatrixLinks({
  city,
  discipline = 'Muay Thai',
}: {
  city: string
  discipline?: string
}) {
  const links = await getTier4AmenityLinksForCity(city, discipline)
  if (links.length === 0) return null

  return (
    <section className="mb-14 rounded-xl border border-gray-200 bg-white p-6 md:p-8">
      <h2 className="text-2xl font-bold text-gray-900 md:text-3xl">
        Muay Thai gyms in {city} by amenity
      </h2>
      <p className="mt-2 max-w-3xl text-sm text-gray-600 md:text-base">
        Long-tail guides for travelers who already know what they need — accommodation, AC,
        recovery, and more.
      </p>
      <ul className="mt-6 flex flex-wrap gap-2">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm font-medium text-[#003580] hover:border-[#003580]/30 hover:bg-white"
            >
              {link.label}
              <span className="ml-1.5 text-xs font-normal text-gray-500">({link.gymCount})</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
