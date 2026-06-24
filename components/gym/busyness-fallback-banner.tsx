export function BusynessFallbackBanner() {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-5 text-center">
      <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-[#003580]/10 text-xl">
        🥊
      </div>
      <h3 className="text-base font-semibold text-gray-900">Drop-in friendly</h3>
      <p className="mt-2 text-sm text-gray-600">
        Peak training hours are usually{' '}
        <strong className="font-semibold text-gray-800">4:00 PM – 6:00 PM</strong> daily.
      </p>
      <p className="mt-1 text-xs text-gray-500">
        Popular times data is not yet available for this gym.
      </p>
    </div>
  )
}
