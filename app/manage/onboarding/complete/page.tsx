'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowRight, ArrowUpRight, Check } from 'lucide-react'

type ReadinessResponse = {
  required: Array<{ key: string; label: string; passed: boolean; reason: string | null; deepLink: string }>
  optional: Array<{ key: string; label: string; passed: boolean; nudgeText: string; deepLink: string }>
  canGoLive: boolean
}

export default function OnboardingCompletePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const gymId = searchParams.get('gym_id')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [readiness, setReadiness] = useState<ReadinessResponse | null>(null)

  useEffect(() => {
    if (!gymId) {
      setLoading(false)
      setError('Missing gym. Return to the wizard to finish setup.')
      return
    }
    let cancelled = false
    const run = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/onboarding/readiness?gym_id=${encodeURIComponent(gymId)}`, {
          cache: 'no-store',
        })
        const data = (await res.json()) as ReadinessResponse & { error?: string }
        if (!res.ok) {
          if (!cancelled) setError(data.error || 'Could not load listing score')
          return
        }
        if (!cancelled) setReadiness(data)
      } catch {
        if (!cancelled) setError('Could not load listing score')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [gymId])

  const { score, passedRequired, totalRequired, topGaps } = useMemo(() => {
    const required = readiness?.required ?? []
    const total = required.length
    const passed = required.filter((r) => r.passed).length
    const scorePct = total > 0 ? Math.round((passed / total) * 100) : 0
    const gaps = required.filter((r) => !r.passed).slice(0, 3)
    return {
      score: scorePct,
      passedRequired: passed,
      totalRequired: total,
      topGaps: gaps,
    }
  }, [readiness])

  /** All required readiness checks passed (same bar as publish / “can go live”). */
  const isLiveReady = Boolean(readiness?.canGoLive)

  const heroTitle = useMemo(() => {
    if (!gymId || error) return "You're almost live on CombatBooking"
    if (loading || !readiness) return "You're almost live on CombatBooking"
    return isLiveReady ? "You're live on CombatBooking" : "You're almost live on CombatBooking"
  }, [gymId, error, loading, readiness, isLiveReady])

  const heroSubtitle = useMemo(() => {
    if (error && gymId) {
      return "We couldn't load your listing score. Try refreshing the page, or use Back to wizard below."
    }
    if (error && !gymId) {
      return 'Finish setup from the wizard, then you can pick up where you left off here.'
    }
    if (loading || !readiness) {
      return 'Checking your listing readiness…'
    }
    if (isLiveReady) {
      return "You're live on CombatBooking."
    }
    return "You're almost live — travellers can almost see your gym. Complete the checklist below, then open review when you're ready to publish and take bookings."
  }, [gymId, error, loading, readiness, isLiveReady])

  const btnOutline =
    'min-h-9 gap-2 border-gray-200 bg-white px-4 text-sm text-gray-900 shadow-sm hover:bg-gray-50 hover:text-gray-900 sm:min-h-10 sm:px-5'

  return (
    <div className="flex min-h-[100dvh] flex-col overflow-x-hidden bg-gradient-to-b from-[#e8eef6] via-[#f4f6f9] to-[#f4f6f9]">
      <main
        className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-4 py-4 text-center sm:py-6 min-h-0 overflow-y-auto overscroll-y-contain"
        aria-label="Onboarding complete"
      >
        <div className="mb-3 flex shrink-0 justify-center sm:mb-4">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md shadow-emerald-500/25 ring-4 ring-emerald-100 sm:h-14 sm:w-14 sm:ring-[5px]"
            aria-hidden
          >
            <Check className="h-7 w-7 stroke-[2.75] sm:h-8 sm:w-8" strokeLinecap="round" strokeLinejoin="round" />
          </div>
        </div>

        <h1 className="shrink-0 text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">{heroTitle}</h1>
        <p className="mx-auto mt-2 max-w-md shrink-0 text-sm leading-snug text-gray-600 sm:text-[15px] sm:leading-relaxed">
          {heroSubtitle}
        </p>

        {loading && gymId && (
          <div className="mx-auto mt-4 w-full max-w-lg shrink-0 text-left sm:mt-5">
            <div className="space-y-3 rounded-xl border border-gray-200/90 bg-white p-4 shadow-sm sm:p-5">
              <div className="h-2.5 w-24 animate-pulse rounded bg-gray-200" />
              <div className="flex items-end gap-2">
                <div className="h-9 w-14 animate-pulse rounded-lg bg-gray-200" />
                <div className="mb-0.5 h-3 w-32 animate-pulse rounded bg-gray-100" />
              </div>
              <div className="h-3 max-w-full animate-pulse rounded bg-gray-100" />
              <div className="border-t border-gray-100 pt-3">
                <div className="h-2.5 w-36 animate-pulse rounded bg-gray-100" />
                <div className="mt-2 space-y-1.5">
                  <div className="h-2.5 max-w-xs animate-pulse rounded bg-gray-100" />
                  <div className="h-2.5 max-w-[260px] animate-pulse rounded bg-gray-100" />
                </div>
              </div>
            </div>
          </div>
        )}

        {!loading && error && (
          <div
            role="alert"
            className="mx-auto mt-4 w-full max-w-lg shrink-0 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-left text-sm leading-relaxed text-amber-950"
          >
            {error}
            <div className="mt-3">
              <Button asChild variant="outline" size="sm" className="border-gray-300 bg-white">
                <Link href="/manage/onboarding?step=step-1">Back to wizard</Link>
              </Button>
            </div>
          </div>
        )}

        {!loading && !error && readiness && gymId && (
          <div className="mx-auto mt-4 w-full max-w-lg shrink-0 text-left sm:mt-5">
            <div className="rounded-xl border border-gray-200/90 bg-white px-4 py-4 shadow-md sm:rounded-2xl sm:px-5 sm:py-5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#003580]/85 sm:text-xs">
                Listing readiness
              </p>
              <div className="mt-2 flex flex-wrap items-end gap-2 sm:mt-3">
                <p className="text-3xl font-bold tabular-nums tracking-tight text-[#003580] sm:text-4xl">{score}%</p>
                <p className="pb-0.5 text-xs text-gray-500 sm:text-sm">
                  {passedRequired}/{totalRequired} required checks passed
                </p>
              </div>
              <p className="mt-2 text-xs leading-snug text-gray-600 sm:text-sm sm:leading-relaxed">
                Improve visibility by completing the quick wins below — you&apos;ll see this score on your dashboard too.
              </p>

              {topGaps.length > 0 ? (
                <div className="mt-4 border-t border-gray-100 pt-4 sm:mt-5 sm:pt-5">
                  <p className="text-xs font-semibold text-gray-900 sm:text-sm">Quick wins</p>
                  <ul className="mt-2 space-y-1.5 text-left text-xs leading-snug text-gray-600 sm:mt-3 sm:space-y-2 sm:text-sm sm:leading-relaxed">
                    {topGaps.map((item) => (
                      <li
                        key={item.key}
                        className="flex gap-2 rounded-md py-0.5 transition-colors hover:bg-gray-50/90"
                      >
                        <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-[#003580]/45 sm:mt-1.5" aria-hidden />
                        <span className="min-w-0">
                          <Link
                            href={item.deepLink}
                            className="font-medium text-[#003580] underline-offset-2 hover:underline"
                          >
                            {item.label}
                          </Link>
                          {item.reason ? (
                            <span className="text-gray-500"> — {item.reason}</span>
                          ) : null}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {readiness.canGoLive ? (
                <p className="mt-4 rounded-lg border border-green-200/80 bg-green-50/90 px-3 py-2 text-xs leading-snug text-green-900 sm:text-sm">
                  Ready to publish —{' '}
                  <Link
                    href={`/manage/onboarding/review?gym_id=${encodeURIComponent(gymId)}`}
                    className="font-semibold text-green-950 underline-offset-2 hover:underline"
                  >
                    open review
                  </Link>
                  .
                </p>
              ) : null}
            </div>
          </div>
        )}

        {!error && gymId ? (
          <>
            <div className="mt-4 flex shrink-0 flex-col items-stretch gap-2 sm:mt-5 sm:flex-row sm:justify-center sm:gap-3">
              <Button variant="outline" className={btnOutline} asChild>
                <Link
                  href={`/gyms/${gymId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  View my listing
                  <ArrowUpRight className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                </Link>
              </Button>
              <Button variant="outline" className={btnOutline} onClick={() => router.push('/manage')}>
                Go to dashboard
                <ArrowRight className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
              </Button>
            </div>
          </>
        ) : null}

        {!gymId && !error ? (
          <div className="mt-6 shrink-0">
            <Button variant="outline" className={btnOutline} onClick={() => router.push('/manage')}>
              Go to dashboard
              <ArrowRight className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
            </Button>
          </div>
        ) : null}
      </main>
    </div>
  )
}
