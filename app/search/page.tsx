import type { Metadata } from 'next'
import SearchClient from './search-client'
import { buildSearchBrowseTitleFromSearchParams } from '@/lib/search/search-browse-title'

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}): Promise<Metadata> {
  return {
    title: buildSearchBrowseTitleFromSearchParams(searchParams),
    alternates: {
      canonical: '/search',
    },
  }
}

export default function SearchPage() {
  return <SearchClient />
}
