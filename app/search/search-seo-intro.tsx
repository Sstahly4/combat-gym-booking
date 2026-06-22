import Link from 'next/link'
import {
  buildSearchBrowseDescriptionFromSearchParams,
  searchSeoHeadingFromSearchParams,
} from '@/lib/search/search-seo'

export async function SearchSeoIntro({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  const heading = searchSeoHeadingFromSearchParams(searchParams)
  const description = buildSearchBrowseDescriptionFromSearchParams(searchParams)

  return (
    <section className="border-b border-gray-100 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">{heading}</h1>
        <p className="mt-2 max-w-3xl text-sm text-gray-600 md:text-base">{description}</p>
      </div>
    </section>
  )
}
