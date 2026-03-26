import Link from 'next/link'

type RelatedGuide = {
  title: string
  href: string
}

export function RelatedGuides({ guides }: { guides: RelatedGuide[] }) {
  if (!guides || guides.length === 0) return null

  return (
    <section className="mt-12 border-t pt-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Related guides</h2>
      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3">
        {guides.map((g) => (
          <Link
            key={g.href}
            href={g.href}
            className="inline-flex items-center justify-between gap-3 rounded-lg border border-gray-200 px-4 py-3 text-sm text-gray-700 hover:border-[#003580] hover:text-[#003580] transition-colors"
          >
            <span className="font-medium">{g.title}</span>
            <span aria-hidden>→</span>
          </Link>
        ))}
      </div>
    </section>
  )
}

