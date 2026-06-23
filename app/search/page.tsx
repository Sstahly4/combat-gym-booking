import type { Metadata } from 'next'
import SearchClient from './search-client'
import { buildSearchBrowseDescriptionFromSearchParams } from '@/lib/search/search-seo'
import { buildSearchBrowseTitleFromSearchParams } from '@/lib/search/search-browse-title'
import { searchSeoHeadingFromSearchParams } from '@/lib/search/search-seo'
import { fetchSearchServerPayload } from '@/lib/search/search-server-listings'
import { buildSearchItemListLd } from '@/lib/seo/search-schema'

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}): Promise<Metadata> {
  const title = buildSearchBrowseTitleFromSearchParams(searchParams)
  const description = buildSearchBrowseDescriptionFromSearchParams(searchParams)

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: '/search',
      type: 'website',
    },
    alternates: {
      canonical: '/search',
    },
  }
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  const initialPayload = await fetchSearchServerPayload(searchParams)
  const heading = searchSeoHeadingFromSearchParams(searchParams)
  const itemListLd = buildSearchItemListLd(heading, initialPayload.gyms)

  return (
    <>
      {itemListLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }}
        />
      ) : null}
      <SearchClient initialPayload={initialPayload} />
    </>
  )
}
