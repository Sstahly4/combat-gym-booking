function CarouselRowSkeleton({ cardCount = 2 }: { cardCount?: number }) {
  return (
    <div className="flex gap-3 overflow-hidden pb-4">
      {Array.from({ length: cardCount }).map((_, i) => (
        <div
          key={i}
          className="min-w-[calc(50%-6px)] md:min-w-[calc(25%-12px)] flex-shrink-0 rounded-xl border border-gray-200 overflow-hidden animate-pulse"
        >
          <div className="aspect-[4/3] bg-gray-200" />
          <div className="p-3 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-3 bg-gray-100 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}

function SectionSkeleton({ titleWidth = 'w-48' }: { titleWidth?: string }) {
  return (
    <section className="pt-4 pb-4 md:pt-6 md:pb-6 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className={`h-7 ${titleWidth} bg-gray-200 rounded animate-pulse mb-2`} />
        <div className="h-4 w-full max-w-md bg-gray-100 rounded animate-pulse mb-3 md:mb-4" />
        <CarouselRowSkeleton />
      </div>
    </section>
  )
}

/** Placeholder while homepage catalog data streams in after the hero + fast row paint. */
export function HomepageCarouselSkeleton() {
  return (
    <>
      <SectionSkeleton titleWidth="w-40" />
      <SectionSkeleton titleWidth="w-36" />
      <section className="pt-4 pb-8 md:pt-6 md:pb-12 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="border border-gray-200 rounded-lg p-4 md:p-8 animate-pulse">
            <div className="h-6 w-40 bg-gray-200 rounded mb-3" />
            <div className="h-4 w-full max-w-2xl bg-gray-100 rounded" />
          </div>
        </div>
      </section>
    </>
  )
}
