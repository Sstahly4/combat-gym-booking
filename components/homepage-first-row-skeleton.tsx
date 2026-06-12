/** Minimal placeholder while the fast mobile Popular row streams in. */
export function HomepageFirstRowSkeleton() {
  return (
    <section className="md:hidden pt-4 pb-4 bg-white" aria-hidden>
      <div className="max-w-6xl mx-auto px-4">
        <div className="h-7 w-48 bg-gray-200 rounded animate-pulse mb-2" />
        <div className="h-4 w-full max-w-md bg-gray-100 rounded animate-pulse mb-3" />
        <div className="flex gap-3 overflow-hidden pb-4">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="min-w-[calc(50%-6px)] flex-shrink-0 rounded-xl border border-gray-200 overflow-hidden animate-pulse"
            >
              <div className="aspect-[4/3] bg-gray-200" />
              <div className="p-3 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
