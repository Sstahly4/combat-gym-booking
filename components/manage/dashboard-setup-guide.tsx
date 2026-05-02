'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Check, ChevronDown, Maximize2, Minimize2, Target, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type ReadinessRequiredItem = {
  key: string
  label: string
  passed: boolean
  reason: string | null
  deepLink: string
}

type ReadinessOptionalItem = {
  key: string
  label: string
  passed: boolean
  nudgeText: string
  deepLink: string
}

const GROUPS: { id: string; title: string; keys: string[] }[] = [
  { id: 'listing', title: 'Listing & account', keys: ['security', 'gym_basics', 'disciplines'] },
  { id: 'packages', title: 'Packages & pricing', keys: ['packages_pricing'] },
  { id: 'photos', title: 'Photos', keys: ['photos'] },
  { id: 'payouts', title: 'Payouts', keys: ['stripe'] },
]

function itemByKey(required: ReadinessRequiredItem[], key: string) {
  return required.find((r) => r.key === key)
}

function SectionDoneMark({ done }: { done: boolean }) {
  if (!done) {
    return <span className="inline-block h-4 w-4 shrink-0" aria-hidden />
  }
  return (
    <span
      className="box-border flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#003580] text-white"
      aria-hidden
    >
      <Check className="h-2.5 w-2.5 stroke-[3]" strokeLinecap="round" strokeLinejoin="round" />
    </span>
  )
}

function StepRowTick({ passed }: { passed: boolean }) {
  return (
    <span
      className={cn(
        'box-border mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border',
        passed
          ? 'border-[#003580] bg-[#003580] text-white'
          : 'border-[#003580]/20 bg-white'
      )}
      aria-hidden
    >
      {passed ? <Check className="h-2.5 w-2.5 stroke-[2.75]" strokeLinecap="round" strokeLinejoin="round" /> : null}
    </span>
  )
}

/** Fixed column so section headers line up with sub-task circles. */
const iconColClass = 'flex w-4 shrink-0 justify-start'

export function DashboardSetupGuide({
  requiredReadiness,
  optionalReadiness,
  readinessGymId,
  canGoLive,
}: {
  requiredReadiness: ReadinessRequiredItem[]
  optionalReadiness: ReadinessOptionalItem[]
  readinessGymId: string | null
  canGoLive: boolean
}) {
  const [openGroupId, setOpenGroupId] = useState<string | null>(null)
  // Start minimized: owners already get a top-right "No bookings yet" toast on an empty dashboard.
  const [minimized, setMinimized] = useState(true)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const onExpand = () => setMinimized(false)
    window.addEventListener('dashboard-setup-guide:claim-tour-expand', onExpand)
    return () => window.removeEventListener('dashboard-setup-guide:claim-tour-expand', onExpand)
  }, [])

  const toggleGroup = useCallback((id: string) => {
    setOpenGroupId((prev) => (prev === id ? null : id))
  }, [])

  const grouped = useMemo(() => {
    return GROUPS.map((g) => {
      const items = g.keys
        .map((k) => itemByKey(requiredReadiness, k))
        .filter((x): x is ReadinessRequiredItem => Boolean(x))
      const allPassed = items.length > 0 && items.every((i) => i.passed)
      return { ...g, items, allPassed }
    })
  }, [requiredReadiness])

  const optionalOpen = openGroupId === '__optional__'
  const optionalAllDone =
    optionalReadiness.length > 0 && optionalReadiness.every((o) => o.passed)

  const passedCount = requiredReadiness.filter((r) => r.passed).length
  const totalRequired = requiredReadiness.length
  const rawPct = totalRequired > 0 ? (passedCount / totalRequired) * 100 : 0
  /** Sliver of fill at 0 complete so the bar still reads as “in progress”. */
  const progressBarWidthPct =
    totalRequired === 0 ? 0 : passedCount === 0 ? 5 : rawPct

  if (dismissed) {
    return (
      <div
        className="fixed bottom-4 right-4 z-50 sm:bottom-6 sm:right-6"
        data-claim-tour="tour-setup-guide"
      >
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="border-gray-200 bg-white text-[13px] font-medium text-gray-800 shadow-lg shadow-gray-900/10"
          onClick={() => setDismissed(false)}
        >
          Setup guide
        </Button>
      </div>
    )
  }

  if (!readinessGymId || requiredReadiness.length === 0) {
    return null
  }

  return (
    <div
      className="fixed bottom-4 right-4 z-50 w-[min(calc(100vw-1.25rem),19.5rem)] sm:bottom-6 sm:right-6 sm:w-[19.5rem]"
      data-claim-tour="tour-setup-guide"
    >
      <div className="overflow-hidden rounded-lg border border-gray-200/90 bg-white shadow-xl shadow-gray-900/12 ring-1 ring-black/[0.03]">
        <div
          className={cn(
            'bg-white px-2.5 sm:px-3',
            minimized ? 'py-2.5 sm:py-3' : 'pt-3 sm:pt-3.5'
          )}
        >
          <div className="flex items-center justify-between gap-2">
            <p className="min-w-0 flex-1 text-left text-[15px] font-semibold leading-tight text-gray-900">
              Setup guide
            </p>
            <div className="flex shrink-0 items-center gap-0.5">
              <button
                type="button"
                className="rounded-md p-1.5 text-gray-500 transition-colors hover:bg-[#003580]/10 hover:text-gray-800"
                aria-label={minimized ? 'Expand setup guide' : 'Minimize setup guide'}
                onClick={() => setMinimized((m) => !m)}
              >
                {minimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              </button>
              <button
                type="button"
                className="rounded-md p-1.5 text-gray-500 transition-colors hover:bg-[#003580]/10 hover:text-gray-800"
                aria-label="Close setup guide"
                onClick={() => setDismissed(true)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          {!minimized && (
            <div
              className="pb-1.5 pt-2.5"
              role="progressbar"
              aria-valuenow={Math.round(rawPct)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Setup progress"
            >
              <div className="h-[5px] w-full overflow-hidden rounded-[3px] bg-[#003580]/12">
                <div
                  className="h-full rounded-[2px] bg-[#003580] transition-[width] duration-300 ease-out"
                  style={{ width: `${progressBarWidthPct}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {!minimized && (
          <>
            <div className="max-h-[min(82vh,600px)] min-h-[13.5rem] overflow-y-auto overscroll-contain px-2.5 pb-2 pt-3.5 sm:px-3">
              <ul className="m-0 list-none space-y-0.5 p-0">
                  {grouped.map((group) => {
                    const isOpen = openGroupId === group.id
                    return (
                      <li key={group.id} className="m-0 p-0">
                        <button
                          type="button"
                          onClick={() => toggleGroup(group.id)}
                          aria-expanded={isOpen}
                          className={cn(
                            'grid w-full grid-cols-[1rem_minmax(0,1fr)_auto] items-center gap-x-1.5 rounded-md py-2 pl-0 pr-0 text-start text-[14px] font-medium leading-snug text-gray-900 transition-colors',
                            isOpen && 'bg-[#003580]/[0.06] ring-1 ring-[#003580]/20'
                          )}
                        >
                          <span className={iconColClass}>
                            <SectionDoneMark done={group.allPassed} />
                          </span>
                          <span
                            className={cn(
                              'min-w-0 w-full text-start',
                              group.allPassed && 'text-gray-400 line-through decoration-gray-300'
                            )}
                          >
                            {group.title}
                          </span>
                          <ChevronDown
                            className={cn(
                              'h-4 w-4 shrink-0 justify-self-end text-gray-400 transition-transform',
                              isOpen && 'rotate-180'
                            )}
                            aria-hidden
                          />
                        </button>
                        {isOpen && (
                          <ul className="m-0 list-none space-y-0.5 p-0 pb-2 pt-1 pl-0">
                            {group.items.map((item) => (
                              <li key={item.key} className="m-0 p-0">
                                <Link
                                  href={item.deepLink}
                                  className={cn(
                                    'grid w-full grid-cols-[1rem_minmax(0,1fr)] items-start gap-x-1.5 rounded-md py-1.5 pl-0 pr-0 text-start text-[13px] font-medium leading-snug text-gray-800 transition-colors',
                                    'hover:bg-[#003580]/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#003580]/25',
                                    item.passed && 'text-gray-400 line-through decoration-gray-300'
                                  )}
                                >
                                  <span className={iconColClass}>
                                    <StepRowTick passed={item.passed} />
                                  </span>
                                  <span className="min-w-0 w-full text-start">{item.label}</span>
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    )
                  })}

                  {optionalReadiness.length > 0 ? (
                    <li className="m-0 p-0 pt-1">
                      <button
                        type="button"
                        onClick={() => setOpenGroupId((p) => (p === '__optional__' ? null : '__optional__'))}
                        aria-expanded={optionalOpen}
                        className={cn(
                          'grid w-full grid-cols-[1rem_minmax(0,1fr)_auto] items-center gap-x-1.5 rounded-md py-2 pl-0 pr-0 text-start text-[14px] font-medium leading-snug text-gray-900 transition-colors',
                          optionalOpen && 'bg-[#003580]/[0.06] ring-1 ring-[#003580]/20'
                        )}
                      >
                        <span className={iconColClass}>
                          <SectionDoneMark done={optionalAllDone} />
                        </span>
                        <span
                          className={cn(
                            'min-w-0 w-full text-start',
                            optionalAllDone && 'text-gray-400 line-through decoration-gray-300'
                          )}
                        >
                          Improve your visibility
                        </span>
                        <ChevronDown
                          className={cn(
                            'h-4 w-4 shrink-0 justify-self-end text-gray-400 transition-transform',
                            optionalOpen && 'rotate-180'
                          )}
                          aria-hidden
                        />
                      </button>
                      {optionalOpen && (
                        <ul className="m-0 list-none space-y-0.5 p-0 pb-2 pt-1 pl-0">
                          {optionalReadiness.map((item) => (
                            <li key={item.key} className="m-0 p-0">
                              <Link
                                href={item.deepLink}
                                className={cn(
                                  'grid w-full grid-cols-[1rem_minmax(0,1fr)] items-start gap-x-1.5 rounded-md py-1.5 pl-0 pr-0 text-start text-[13px] font-medium leading-snug text-gray-800 transition-colors',
                                  'hover:bg-[#003580]/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#003580]/25',
                                  item.passed && 'text-gray-400 line-through decoration-gray-300'
                                )}
                              >
                                <span className={iconColClass}>
                                  <StepRowTick passed={item.passed} />
                                </span>
                                <span className="min-w-0 w-full text-start">{item.label}</span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ) : null}
              </ul>
            </div>

            <div className="border-t border-gray-200/50 px-2.5 py-2.5 sm:px-3">
              {canGoLive ? (
                <div className="flex items-start gap-2">
                  <Target className="mt-0.5 h-4 w-4 shrink-0 text-[#003580]" aria-hidden />
                  <div className="min-w-0 leading-snug">
                    <p className="text-[13px] font-semibold text-[#003580]">Ready to publish</p>
                    <p className="mt-0.5 text-[12px] text-gray-600">
                      Final step: confirm on the review page and tap Go live.
                    </p>
                    <Link
                      href={`/manage/onboarding/review?gym_id=${encodeURIComponent(readinessGymId)}`}
                      className="mt-1.5 inline-block text-[13px] font-semibold text-[#003580] underline-offset-2 hover:underline"
                    >
                      Review &amp; go live
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2">
                  <Target className="mt-0.5 h-4 w-4 shrink-0 text-[#003580]" aria-hidden />
                  <div className="min-w-0 leading-snug">
                    <p className="text-[13px] font-semibold text-[#003580]">
                      {passedCount}/{totalRequired} required complete
                    </p>
                    <p className="mt-1 text-[12px] text-gray-600">
                      Finish the checklist above, then{' '}
                      <Link
                        href={`/manage/onboarding/review?gym_id=${encodeURIComponent(readinessGymId)}`}
                        className="font-semibold text-[#003580] underline-offset-2 hover:underline"
                      >
                        open review &amp; go live
                      </Link>
                      .
                    </p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
