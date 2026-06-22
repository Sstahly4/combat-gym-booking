import Link from 'next/link'
import { gymListsDiscipline } from '@/lib/guides/discipline-match'
import { getTier4AmenityLinksForCity } from '@/lib/guides/tier4-amenity-guides'
import { locationToSlug } from '@/lib/seo/location-slug'

type GymForContextNav = {
  city?: string | null
  country?: string | null
  disciplines?: string[] | null
}

/** Crawlable internal links to city / amenity guides — minimal footer, only when relevant. */
export async function GymContextNav({ gym }: { gym: GymForContextNav }) {
  const city = gym.city?.trim()
  const country = gym.country?.trim() || ''
  if (!city) return null

  const links: Array<{ href: string; label: string }> = []

  const isThailand = country.toLowerCase().includes('thailand')
  const listsMuayThai = gymListsDiscipline(gym.disciplines, 'Muay Thai')

  if (isThailand && listsMuayThai) {
    links.push({
      href: `/blog/best-muay-thai-gyms/${locationToSlug(city)}`,
      label: `Best Muay Thai gyms in ${city}`,
    })
    const amenityLinks = await getTier4AmenityLinksForCity(city, 'Muay Thai', 4)
    for (const item of amenityLinks) {
      links.push({ href: item.href, label: `${city} gyms with ${item.label.toLowerCase()}` })
    }
  }

  if (country) {
    links.push({
      href: `/search?country=${encodeURIComponent(country)}&location=${encodeURIComponent(city)}`,
      label: `Search camps in ${city}`,
    })
  }

  if (links.length === 0) return null

  return (
    <nav
      aria-label="Related training guides"
      className="mt-10 border-t border-gray-200 pt-6"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Related guides</p>
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="text-[#003580] hover:underline">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
