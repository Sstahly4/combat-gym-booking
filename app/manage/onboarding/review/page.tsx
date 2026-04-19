'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
    <div className="min-h-screen bg-[#f4f6f9] py-8 md:py-12">
      <div className="mx-auto w-full max-w-6xl xl:max-w-7xl px-3 sm:px-5 lg:px-10 pb-16">
        <Card className="overflow-hidden rounded-xl border-gray-200/90 shadow-md">
          <CardHeader className="space-y-2 border-b border-gray-100 bg-gradient-to-b from-white to-gray-50/40 px-6 py-8 md:px-10 md:py-10">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#003580]/80">
              Almost there
            </p>
            <CardTitle className="text-2xl font-bold tracking-tight text-[#003580] md:text-3xl">
              Review &amp; go live
            </CardTitle>
            <CardDescription className="text-base text-gray-600">
              {completeCount} of {OWNER_WIZARD_STEPS.length} steps complete — finish any pending items, then publish when
              you&apos;re ready.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-6 py-8 md:space-y-5 md:px-10 md:py-10">
            {OWNER_WIZARD_STEPS.map((step) => {
              const complete = completedKeys.includes(step.key)
              return (
                <div
                  key={step.key}
                  className="flex items-center justify-between gap-4 rounded-xl border border-gray-200/90 bg-white p-4 shadow-sm md:p-5"
                >
                  <div>
                    <p className="font-medium">{step.label}</p>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        complete ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {complete ? 'Complete' : 'Pending'}
                    </span>
                    <Link href={buildOnboardingWizardUrl(step.slug, gymId)}>
                      <Button variant="outline" size="sm">Open</Button>
                    </Link>
                  </div>
                </div>
              )
            })}

            {error && <p className="text-sm text-destructive">{error}</p>}
            {loading && <p className="text-sm text-muted-foreground">Refreshing progress...</p>}

            {readiness && (
              <div className="space-y-4 border-t border-gray-100 pt-8">
                <p className="text-base font-semibold text-[#003580]">Readiness checklist</p>
                {readiness.required.map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between gap-4 rounded-xl border border-gray-200/90 bg-white p-4 shadow-sm md:p-5"
                  >
                    <div>
                      <p className="font-medium">{item.label}</p>
                      {!item.passed && item.reason && (
                        <p className="text-xs text-muted-foreground">{item.reason}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded ${item.passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {item.passed ? 'Passed' : 'Required'}
                      </span>
                      <Link href={item.deepLink}>
                        <Button size="sm" variant="outline">Fix</Button>
                      </Link>
                    </div>
                  </div>
                ))}

                {readiness.optional.map((item) => (
                  <div key={item.key} className="rounded-xl border border-amber-200/80 bg-amber-50/90 p-4 md:p-5">
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-amber-800">{item.nudgeText}</p>
                  </div>
                ))}
              </div>
            )}

            {goLiveMessage && <p className="text-sm text-green-700">{goLiveMessage}</p>}

            <div className="border-t border-gray-100 pt-8">
              <Button
                size="lg"
                className="min-h-12 min-w-[10rem] bg-[#003580] px-8 hover:bg-[#002a66]"
                disabled={completeCount < OWNER_WIZARD_STEPS.length || !readiness?.canGoLive || goLiveLoading || !gymId}
                onClick={() => void handleGoLive()}
              >
                {goLiveLoading ? 'Going live...' : 'Go live'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
