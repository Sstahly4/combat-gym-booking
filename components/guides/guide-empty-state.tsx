import Link from 'next/link'

type GuideEmptyStateProps = {
  title: string
  description: string
  searchHref: string
  searchLabel: string
}

export function GuideEmptyState({ title, description, searchHref, searchLabel }: GuideEmptyStateProps) {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-8 text-center">
      <h2 className="text-lg font-semibold text-gray-900 mb-2">{title}</h2>
      <p className="text-sm text-gray-700 max-w-xl mx-auto leading-relaxed mb-6">{description}</p>
      <Link
        href={searchHref}
        className="inline-flex items-center justify-center bg-[#003580] text-white py-3 px-6 rounded-lg hover:bg-[#003580]/90 transition-colors font-medium"
      >
        {searchLabel}
      </Link>
    </div>
  )
}
