'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { buildOnboardingWizardUrl, OWNER_WIZARD_STEPS } from '@/lib/onboarding/owner-wizard'

type WizardStateResponse = {
  session: { id: string }
  steps: Array<{ step_key: string; completed_at: string | null }>
}

type ReadinessResponse = {
  required: Array<{ key: string; label: string; passed: boolean; reason: string | null; deepLink: string }>
  optional: Array<{ key: string; label: string; passed: boolean; nudgeText: string; deepLink: string }>
  canGoLive: boolean
}

export default function OwnerWizardReviewPage() {
  const searchParams = useSearchParams()
  const gymId = searchParams.get('gym_id')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [completedKeys, setCompletedKeys] = useState<string[]>([])
  const [readiness, setReadiness] = useState<ReadinessResponse | null>(null)
  const [goLiveLoading, setGoLiveLoading] = useState(false)
  const [goLiveMessage, setGoLiveMessage] = useState<string | null>(null)

  useEffect(() => {
    const loadState = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch(
          gymId
            ? `/api/onboarding/wizard/state?gym_id=${encodeURIComponent(gymId)}`
            : '/api/onboarding/wizard/state',
          { cache: 'no-store' }
        )
        const data = (await response.json()) as WizardStateResponse & { error?: string }
        if (!response.ok) {
          setError(data.error || 'Failed to load wizard state')
          setLoading(false)
          return
        }

        const completed = (data.steps || [])
          .filter((item) => item.completed_at)
          .map((item) => item.step_key)
        setCompletedKeys(completed)

        const activeGymId = gymId || null
        if (activeGymId) {
          const readinessResponse = await fetch(
            `/api/onboarding/readiness?gym_id=${encodeURIComponent(activeGymId)}`,
            { cache: 'no-store' }
          )
          if (readinessResponse.ok) {
            setReadiness((await readinessResponse.json()) as ReadinessResponse)
          }
        }
      } catch (loadError: any) {
        setError(loadError?.message || 'Failed to load wizard state')
      } finally {
        setLoading(false)
      }
    }
    void loadState()
  }, [gymId])

  const completeCount = useMemo(
    () => OWNER_WIZARD_STEPS.filter((step) => completedKeys.includes(step.key)).length,
    [completedKeys]
  )
  const progressPct = Math.round((completeCount / OWNER_WIZARD_STEPS.length) * 100)
  const requiredReadyCount = readiness?.required.filter((item) => item.passed).length ?? 0

  const handleGoLive = async () => {
    if (!gymId) return
    setGoLiveLoading(true)
    setGoLiveMessage(null)
    setError(null)
    try {
      const response = await fetch('/api/onboarding/go-live', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gym_id: gymId }),
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data.error || 'Go-live failed')
        if (data.readiness) setReadiness(data.readiness as ReadinessResponse)
        setGoLiveLoading(false)
        return
      }
      setGoLiveMessage(data.already_live ? 'Gym is already live.' : 'Gym is now live.')
    } catch (goLiveError: any) {
      setError(goLiveError?.message || 'Go-live failed')
    } finally {
      setGoLiveLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white pb-16">
      <main className="mx-auto w-full max-w-6xl px-4 pt-8 sm:px-6 sm:pt-12" aria-label="Onboarding review">
        <header className="mb-10 max-w-3xl">
          <p className="text-[11.5px] font-semibold uppercase tracking-[0.16em] text-[#003580]">
            Partner Hub · Go-live review
          </p>
          <h1 className="mt-3 text-[28px] font-semibold leading-[1.15] tracking-tight text-gray-900 sm:text-[34px]">
            Review &amp; go live
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-gray-600">
            Final checkpoint for your listing. Finish any required items, then publish when the profile, checkout, and
            owner account are ready.
          </p>

          <div className="mt-7 flex items-center gap-4">
            <div
              className="h-1 flex-1 overflow-hidden rounded-full bg-gray-100"
              role="progressbar"
              aria-valuenow={progressPct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Onboarding progress"
            >
              <div
                className="h-full rounded-full bg-[#003580] transition-[width] duration-500 ease-out"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <p className="shrink-0 text-[12.5px] font-medium tabular-nums text-gray-600">
              {completeCount} of {OWNER_WIZARD_STEPS.length} steps · {progressPct}%
            </p>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
          <section className="space-y-5 rounded-2xl border border-gray-200/80 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)] md:p-8">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-500">
                Required readiness
              </p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight text-gray-900">Ready to publish?</h2>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                This is the single source of truth for go-live. Items marked required must pass before the listing can
                accept bookings.
              </p>
            </div>

            {error && (
              <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                {error}
              </p>
            )}
            {loading && <p className="text-sm text-muted-foreground">Refreshing progress...</p>}

            {readiness ? (
              <div className="divide-y divide-gray-100 rounded-xl border border-gray-200/80 bg-white">
                {readiness.required.map((item) => (
                  <div key={item.key} className="flex items-start justify-between gap-4 px-4 py-4">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900">{item.label}</p>
                      <p className="mt-0.5 text-xs leading-relaxed text-gray-500">
                        {item.passed ? 'Complete and ready for go-live.' : item.reason || 'Required before publishing.'}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span
                        className={
                          item.passed
                            ? 'rounded-full bg-emerald-50 px-2 py-0.5 text-[11.5px] font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200'
                            : 'rounded-full bg-amber-50 px-2 py-0.5 text-[11.5px] font-medium text-amber-700 ring-1 ring-inset ring-amber-200'
                        }
                      >
                        {item.passed ? 'Ready' : 'Required'}
                      </span>
                      {!item.passed ? (
                        <Link href={item.deepLink}>
                          <Button size="sm" variant="outline" className="h-8 rounded-full border-gray-200 bg-white">
                            Fix
                          </Button>
                        </Link>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-gray-200/80 bg-gray-50 px-4 py-5 text-sm text-gray-600">
                Save the first step to create a draft listing, then readiness checks will appear here.
              </div>
            )}

            {readiness && readiness.optional.length > 0 ? (
              <div className="space-y-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-500">
                  Recommended polish
                </p>
                {readiness.optional.map((item) => (
                  <div key={item.key} className="rounded-xl border border-amber-200/80 bg-amber-50/80 p-4">
                    <p className="text-sm font-medium text-amber-950">{item.label}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-amber-800">{item.nudgeText}</p>
                  </div>
                ))}
              </div>
            ) : null}

            {goLiveMessage && (
              <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                {goLiveMessage}
              </p>
            )}

            <div className="flex flex-col gap-3 border-t border-gray-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <Link href={buildOnboardingWizardUrl('step-7', gymId)}>
                <Button variant="outline" className="h-10 rounded-full border-gray-200 bg-white text-gray-700 hover:bg-gray-50">
                  Back to wizard
                </Button>
              </Link>
              <Button
                size="lg"
                className="h-11 rounded-full bg-[#003580] px-7 text-white hover:bg-[#002a66]"
                disabled={completeCount < OWNER_WIZARD_STEPS.length || !readiness?.canGoLive || goLiveLoading || !gymId}
                onClick={() => void handleGoLive()}
              >
                {goLiveLoading ? 'Going live...' : 'Go live'}
              </Button>
            </div>
          </section>

          <aside className="space-y-4 rounded-2xl border border-gray-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] lg:sticky lg:top-8">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-500">
                Wizard steps
              </p>
              <p className="mt-1 text-sm text-gray-600">
                {completeCount} complete · {OWNER_WIZARD_STEPS.length - completeCount} remaining
              </p>
            </div>
            <div className="divide-y divide-gray-100 rounded-xl border border-gray-200/80">
              {OWNER_WIZARD_STEPS.map((step) => {
                const complete = completedKeys.includes(step.key)
                return (
                  <div key={step.key} className="flex items-center justify-between gap-3 px-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium text-gray-900">{step.label}</p>
                      <p className="text-[11.5px] text-gray-500">{complete ? 'Complete' : 'Pending'}</p>
                    </div>
                    <Link href={buildOnboardingWizardUrl(step.slug, gymId)}>
                      <Button variant="ghost" size="sm" className="h-8 rounded-full text-[#003580] hover:bg-[#003580]/5">
                        Open
                      </Button>
                    </Link>
                  </div>
                )
              })}
            </div>
            {readiness ? (
              <div className="rounded-xl bg-[#003580]/[0.03] p-4">
                <p className="text-sm font-semibold text-gray-900">
                  {requiredReadyCount}/{readiness.required.length} required checks ready
                </p>
                <p className="mt-1 text-xs leading-relaxed text-gray-600">
                  {readiness.canGoLive
                    ? 'Everything required is ready. You can publish now.'
                    : 'Fix the required checks on the left before publishing.'}
                </p>
              </div>
            ) : null}
          </aside>
        </div>
      </main>
    </div>
  )
}
