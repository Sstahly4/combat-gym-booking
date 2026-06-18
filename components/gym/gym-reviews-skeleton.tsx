export function GymReviewsCarouselSkeleton() {
  return (
    <div className="flex gap-4 overflow-hidden">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="min-w-[280px] md:min-w-[320px] rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-3 animate-pulse"
        >
          <div className="flex gap-2">
            <div className="h-4 w-20 rounded bg-gray-200" />
            <div className="h-4 w-16 rounded bg-gray-200" />
          </div>
          <div className="h-3 w-full rounded bg-gray-200" />
          <div className="h-3 w-5/6 rounded bg-gray-200" />
          <div className="h-3 w-2/3 rounded bg-gray-200" />
        </div>
      ))}
    </div>
  )
}
