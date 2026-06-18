/** Layout skeleton for gym detail — reserves vertical space while data loads. */
export function GymDetailSkeleton() {
  return (
    <div className="flex flex-1 flex-col bg-white pb-12">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white py-4 md:py-6">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-3">
              <div className="h-7 w-[85%] max-w-md animate-pulse rounded-md bg-gray-200 md:h-9" />
              <div className="h-4 w-40 animate-pulse rounded bg-gray-200" />
            </div>
            <div className="hidden shrink-0 items-center gap-2 md:flex">
              <div className="h-10 w-10 animate-pulse rounded-lg bg-gray-200" />
              <div className="h-10 w-28 animate-pulse rounded-lg bg-gray-200" />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile hero */}
      <div className="aspect-[4/3] w-full animate-pulse bg-gray-200 md:hidden" />

      {/* Mobile description block */}
      <div className="space-y-4 px-4 py-4 md:hidden">
        <div className="space-y-2">
          <div className="h-3.5 w-full animate-pulse rounded bg-gray-200" />
          <div className="h-3.5 w-[92%] animate-pulse rounded bg-gray-200" />
          <div className="h-3.5 w-[78%] animate-pulse rounded bg-gray-200" />
        </div>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-7 w-20 animate-pulse rounded-full bg-gray-200" />
          ))}
        </div>
      </div>

      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-4 md:py-8">
        <div className="grid gap-6 md:gap-10 lg:grid-cols-3">
          {/* Sidebar — first on mobile */}
          <div className="order-1 space-y-4 lg:order-2 lg:col-span-1">
            <div className="h-52 animate-pulse rounded-xl border border-gray-100 bg-gray-200" />
            <div className="hidden h-40 animate-pulse rounded-xl border border-gray-100 bg-gray-200 md:block" />
            <div className="hidden h-56 animate-pulse rounded-xl border border-gray-100 bg-gray-200 md:block" />
          </div>

          {/* Main column */}
          <div className="order-2 space-y-6 md:space-y-8 lg:order-1 lg:col-span-2">
            <div className="hidden aspect-[16/7] animate-pulse rounded-xl bg-gray-200 md:block" />

            <div className="hidden space-y-3 md:block">
              <div className="h-4 w-full animate-pulse rounded bg-gray-200" />
              <div className="h-4 w-[94%] animate-pulse rounded bg-gray-200" />
              <div className="h-4 w-[88%] animate-pulse rounded bg-gray-200" />
              <div className="h-4 w-[72%] animate-pulse rounded bg-gray-200" />
            </div>

            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-8 w-24 animate-pulse rounded-full bg-gray-200" />
              ))}
            </div>

            <div className="space-y-3 border-t border-gray-200 pt-6">
              <div className="h-5 w-44 animate-pulse rounded bg-gray-200" />
              <div className="h-36 animate-pulse rounded-xl bg-gray-200" />
              <div className="h-36 animate-pulse rounded-xl bg-gray-200" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
