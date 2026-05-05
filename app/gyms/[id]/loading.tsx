export default function Loading() {
  return (
    <div className="min-h-[100dvh] bg-white">
      {/* Mobile-first: keep the viewport "tall" so the browser doesn't clamp scrollY
          to the bottom while the real page streams in (common iOS Safari behavior). */}
      <div className="mx-auto max-w-6xl px-4 py-4 md:py-8">
        <div className="space-y-4 md:hidden">
          <div className="h-[300px] w-full rounded-xl bg-gray-200 animate-pulse" />
          <div className="space-y-2">
            <div className="h-7 w-3/4 rounded bg-gray-200 animate-pulse" />
            <div className="h-4 w-1/2 rounded bg-gray-200 animate-pulse" />
          </div>
          <div className="space-y-2 pt-2">
            <div className="h-4 w-full rounded bg-gray-200 animate-pulse" />
            <div className="h-4 w-full rounded bg-gray-200 animate-pulse" />
            <div className="h-4 w-5/6 rounded bg-gray-200 animate-pulse" />
          </div>
          <div className="h-44 w-full rounded-xl bg-gray-200 animate-pulse" />
          <div className="h-56 w-full rounded-xl bg-gray-200 animate-pulse" />
        </div>

        <div className="hidden md:grid lg:grid-cols-3 lg:gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="aspect-video rounded-lg bg-gray-200 animate-pulse" />
            <div className="space-y-2">
              <div className="h-8 w-2/3 rounded bg-gray-200 animate-pulse" />
              <div className="h-4 w-1/3 rounded bg-gray-200 animate-pulse" />
            </div>
            <div className="space-y-2 pt-4">
              <div className="h-4 w-full rounded bg-gray-200 animate-pulse" />
              <div className="h-4 w-full rounded bg-gray-200 animate-pulse" />
              <div className="h-4 w-2/3 rounded bg-gray-200 animate-pulse" />
            </div>
          </div>
          <div className="lg:col-span-1">
            <div className="h-64 rounded-lg bg-gray-200 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  )
}
