'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/use-auth'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DashboardSetupGuide } from '@/components/manage/dashboard-setup-guide'
import {
  DashboardTodaySection,
  type TodayMetricId,
  type TodayMetricsInput,
} from '@/components/manage/dashboard-today-section'
import { parseLocalDayKey, toLocalDayKey } from '@/components/manage/comparison-day-calendar-popover'
import { formatDashboardMoney } from '@/lib/currency/format-dashboard-money'
import { resolveOwnerCurrency } from '@/lib/currency/resolve-owner-currency'
import { useCurrency } from '@/lib/contexts/currency-context'
import type { OverviewCardModel } from '@/lib/manage/overview-period-metrics'
import { buildOverviewCards } from '@/lib/manage/overview-period-metrics'
import { DashboardOverviewMetricGrid } from '@/components/manage/dashboard-overview-metric-grid'
import type { Gym, GymImage } from '@/lib/types/database'
import { toCanonicalBookingStatus } from '@/lib/bookings/status-normalization'
import { buildOnboardingWizardUrl } from '@/lib/onboarding/owner-wizard'
import {
  readReadinessSessionCache,
  writeReadinessSessionCache,
} from '@/lib/onboarding/readiness-session-cache'
import { useActiveGym } from '@/components/manage/active-gym-context'

interface GymWithImage extends Gym {
  images: GymImage[]
}

interface DashboardStats {
  todayBookings: number
  weekRevenue: number
  lastWeekRevenue: number
  pendingConfirmations: number
  averageRating: number | null
  todayMetrics: TodayMetricsInput
}

interface ReadinessRequiredItem {
  key: string
  label: string
  passed: boolean
  reason: string | null
  deepLink: string
}

interface ReadinessOptionalItem {
  key: string
  label: string
  passed: boolean
  nudgeText: string
  deepLink: string
}

type DashboardBookingRow = {
  id: string
  gym_id: string
  status: string
  total_price: number | null
  start_date: string
  created_at: string
  guest_name: string | null
  discipline: string | null
}

function emptyCumulativeRevenueHours(): number[] {
  return Array.from({ length: 25 }, () => 0)
}

const TODAY_METRIC_IDS: TodayMetricId[] = [
  'gross_volume',
  'new_customers',
  'successful_payments',
  'net_volume',
]

const paidBookingStatuses = new Set(['paid', 'confirmed', 'completed'])

function buildTodayMetricSlice(
  bookings: DashboardBookingRow[],
  dayStart: Date,
  dayEndExclusive: Date,
  id: TodayMetricId
): { cumulative: number[]; total: number } {
  const hourly = new Array(24).fill(0) as number[]
  for (const b of bookings) {
    const t = new Date(b.created_at)
    if (t < dayStart || t >= dayEndExclusive) continue
    const h = t.getHours()
    switch (id) {
      case 'gross_volume':
        if (!paidBookingStatuses.has(b.status)) continue
        hourly[h] += Number(b.total_price) || 0
        break
      case 'new_customers':
        if (toCanonicalBookingStatus(b.status) === 'cancelled') continue
        hourly[h] += 1
        break
      case 'successful_payments':
        if (!paidBookingStatuses.has(b.status)) continue
        hourly[h] += 1
        break
      case 'net_volume':
        if (b.status !== 'completed') continue
        hourly[h] += Number(b.total_price) || 0
        break
    }
  }
  const cumulative = Array.from({ length: 25 }, () => 0)
  for (let k = 1; k <= 24; k++) {
    cumulative[k] = cumulative[k - 1] + hourly[k - 1]
  }
  return { total: cumulative[24]!, cumulative }
}

function composeTodayMetrics(
  bookings: DashboardBookingRow[],
  todayStart: Date,
  tomorrowStart: Date,
  comparisonDayStart: Date
): TodayMetricsInput {
  const comparisonEnd = new Date(comparisonDayStart)
  comparisonEnd.setDate(comparisonEnd.getDate() + 1)
  const out = {} as TodayMetricsInput
  for (const id of TODAY_METRIC_IDS) {
    const todayS = buildTodayMetricSlice(bookings, todayStart, tomorrowStart, id)
    const yestS = buildTodayMetricSlice(bookings, comparisonDayStart, comparisonEnd, id)
    out[id] = {
      todayTotal: todayS.total,
      yesterdayTotal: yestS.total,
      cumulativeByHour: todayS.cumulative,
      yesterdayCumulativeByHour: yestS.cumulative,
    }
  }
  return out
}

function emptyTodayMetrics(): TodayMetricsInput {
  const z = emptyCumulativeRevenueHours()
  const z2 = emptyCumulativeRevenueHours()
  return {
    gross_volume: {
      todayTotal: 0,
      yesterdayTotal: 0,
      cumulativeByHour: z,
      yesterdayCumulativeByHour: z2,
    },
    new_customers: {
      todayTotal: 0,
      yesterdayTotal: 0,
      cumulativeByHour: emptyCumulativeRevenueHours(),
      yesterdayCumulativeByHour: emptyCumulativeRevenueHours(),
    },
    successful_payments: {
      todayTotal: 0,
      yesterdayTotal: 0,
      cumulativeByHour: emptyCumulativeRevenueHours(),
      yesterdayCumulativeByHour: emptyCumulativeRevenueHours(),
    },
    net_volume: {
      todayTotal: 0,
      yesterdayTotal: 0,
      cumulativeByHour: emptyCumulativeRevenueHours(),
      yesterdayCumulativeByHour: emptyCumulativeRevenueHours(),
    },
  }
}

function defaultComparisonDayKey(): string {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - 1)
  return toLocalDayKey(d)
}

export default function ManagePage() {
  const router = useRouter()
  const { user, profile, loading: authLoading } = useAuth()
  const { selectedCurrency, convertPrice } = useCurrency()
  const { activeGymId } = useActiveGym()
  const [gyms, setGyms] = useState<GymWithImage[]>([])

  const [dashboardBookings, setDashboardBookings] = useState<DashboardBookingRow[]>([])
  const [bookingsFetchedAt, setBookingsFetchedAt] = useState<Date | null>(null)
  const [comparisonDayKey, setComparisonDayKey] = useState(defaultComparisonDayKey)

  const [stats, setStats] = useState<DashboardStats>({
    todayBookings: 0,
    weekRevenue: 0,
    lastWeekRevenue: 0,
    pendingConfirmations: 0,
    averageRating: null,
    todayMetrics: emptyTodayMetrics(),
  })
  const [requiredReadiness, setRequiredReadiness] = useState<ReadinessRequiredItem[]>([])
  const [optionalReadiness, setOptionalReadiness] = useState<ReadinessOptionalItem[]>([])
  const [readinessGymId, setReadinessGymId] = useState<string | null>(null)
  const [canGoLive, setCanGoLive] = useState(false)
  const [loading, setLoading] = useState(true)

  const gymsRef = useRef<GymWithImage[]>([])
  gymsRef.current = gyms

  const refreshBookingsAndDerivedStats = useCallback(async (ownerGymsOverride?: GymWithImage[]) => {
    const ownerGyms = ownerGymsOverride ?? gymsRef.current
    const gymIds = ownerGyms.map((gym) => gym.id)
    if (gymIds.length === 0) return

    const supabase = createClient()
    const now = new Date()
    const todayStart = new Date(now)
    todayStart.setHours(0, 0, 0, 0)
    const tomorrowStart = new Date(todayStart)
    tomorrowStart.setDate(tomorrowStart.getDate() + 1)
    const weekAhead = new Date(todayStart)
    weekAhead.setDate(weekAhead.getDate() + 7)
    const lastWeekStart = new Date(todayStart)
    lastWeekStart.setDate(lastWeekStart.getDate() - 7)

    const [bookingsResult, reviewsResult] = await Promise.all([
      supabase
        .from('bookings')
        .select('id, gym_id, status, total_price, start_date, created_at, guest_name, discipline')
        .in('gym_id', gymIds)
        .order('start_date', { ascending: true }),
      supabase
        .from('reviews')
        .select('rating, gym_id')
        .in('gym_id', gymIds),
    ])

    const bookings = (bookingsResult.data || []) as DashboardBookingRow[]
    const reviews = reviewsResult.data || []
    setDashboardBookings(bookings)
    setBookingsFetchedAt(new Date())

    const weekBookings = bookings.filter((booking) => {
      const start = new Date(booking.start_date)
      return start >= todayStart && start < weekAhead
    })

    const lastWeekBookings = bookings.filter((booking) => {
      const start = new Date(booking.start_date)
      return start >= lastWeekStart && start < todayStart
    })

    const todayBookings = bookings.filter((booking) => {
      const start = new Date(booking.start_date)
      return start >= todayStart && start < tomorrowStart
    }).length

    const paidStatuses = paidBookingStatuses

    const weekRevenue = weekBookings
      .filter((booking) => paidStatuses.has(booking.status))
      .reduce((sum, booking) => sum + (Number(booking.total_price) || 0), 0)
    const lastWeekRevenue = lastWeekBookings
      .filter((booking) => paidStatuses.has(booking.status))
      .reduce((sum, booking) => sum + (Number(booking.total_price) || 0), 0)

    const pendingConfirmations = bookings.filter((booking) =>
      toCanonicalBookingStatus(booking.status) === 'pending'
    ).length

    const averageRating =
      reviews.length > 0
        ? reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length
        : null

    setStats((prev) => ({
      ...prev,
      todayBookings,
      weekRevenue,
      lastWeekRevenue,
      pendingConfirmations,
      averageRating,
    }))
  }, [])

  useEffect(() => {
    if (authLoading) return
    
    if (!user) {
      router.replace('/auth/signin')
      return
    }

    if (!profile) {
      router.replace('/auth/role-selection')
      return
    }

    if (profile.role !== 'owner') {
      router.replace('/')
      return
    }

    const fetchGyms = async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('gyms')
        .select(`
          *,
          images:gym_images(url, variants, order)
        `)
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching gyms:', error)
      } else {
        // Sort images by order for each gym
        const processedData = (data || []).map((gym: any) => {
          if (gym.images && Array.isArray(gym.images)) {
            gym.images.sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
          }
          return gym
        })
        setGyms(processedData as any || [])

        const ownerGyms = (processedData || []) as any[]
        const gymIds = ownerGyms.map((gym) => gym.id)
        if (gymIds.length === 0) {
          setDashboardBookings([])
          setBookingsFetchedAt(null)
          setRequiredReadiness([])
          setOptionalReadiness([])
          setReadinessGymId(null)
          setCanGoLive(false)
        } else {
          await refreshBookingsAndDerivedStats(ownerGyms as GymWithImage[])
        }
      }
      setLoading(false)
    }

    fetchGyms()
  }, [user, profile, authLoading, router, refreshBookingsAndDerivedStats])

  useEffect(() => {
    if (authLoading || !user || profile?.role !== 'owner') return
    if (gyms.length === 0) return
    const target = gyms.find((g) => g.id === activeGymId) ?? gyms[0]
    if (!target?.id) return

    let cancelled = false

    const run = async () => {
      const cached = readReadinessSessionCache(target.id)
      if (cached) {
        setReadinessGymId(cached.gymId)
        setRequiredReadiness(cached.required)
        setOptionalReadiness(cached.optional)
        setCanGoLive(cached.canGoLive)
      }

      try {
        const readinessResponse = await fetch(`/api/onboarding/readiness?gym_id=${target.id}`, {
          cache: 'no-store',
        })
        if (cancelled) return
        if (readinessResponse.ok) {
          const readinessData = await readinessResponse.json()
          const required = readinessData.required || []
          const optional = readinessData.optional || []
          const live = Boolean(readinessData.canGoLive)
          setReadinessGymId(target.id)
          setRequiredReadiness(required)
          setOptionalReadiness(optional)
          setCanGoLive(live)
          if (required.length > 0) {
            writeReadinessSessionCache({
              gymId: target.id,
              required,
              optional,
              canGoLive: live,
            })
          }
        } else if (!cached) {
          setReadinessGymId(target.id)
          setRequiredReadiness([])
          setOptionalReadiness([])
          setCanGoLive(false)
        }
      } catch {
        if (!cancelled && !cached) {
          setReadinessGymId(target.id)
          setRequiredReadiness([])
          setOptionalReadiness([])
          setCanGoLive(false)
        }
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [authLoading, user, profile, gyms, activeGymId])

  useEffect(() => {
    if (!user || profile?.role !== 'owner') return

    const tick = () => {
      void refreshBookingsAndDerivedStats()
    }
    const id = setInterval(tick, 45_000)
    const onVis = () => {
      if (document.visibilityState === 'visible') tick()
    }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [user, profile?.role, refreshBookingsAndDerivedStats])

  useEffect(() => {
    if (dashboardBookings.length === 0) {
      setStats((s) => ({ ...s, todayMetrics: emptyTodayMetrics() }))
      return
    }
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
    const tomorrowStart = new Date(todayStart)
    tomorrowStart.setDate(tomorrowStart.getDate() + 1)
    const yesterdayMax = new Date(todayStart)
    yesterdayMax.setDate(yesterdayMax.getDate() - 1)
    const min = new Date(todayStart.getFullYear() - 5, 0, 1)
    let compStart = parseLocalDayKey(comparisonDayKey)
    if (compStart >= todayStart) compStart = new Date(yesterdayMax)
    if (compStart < min) compStart = min
    const validKey = toLocalDayKey(compStart)
    if (validKey !== comparisonDayKey) {
      setComparisonDayKey(validKey)
      return
    }
    setStats((s) => ({
      ...s,
      todayMetrics: composeTodayMetrics(dashboardBookings, todayStart, tomorrowStart, compStart),
    }))
  }, [dashboardBookings, comparisonDayKey])

  const maxComparisonDayKey = (() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() - 1)
    return toLocalDayKey(d)
  })()

  const dashCard =
    'rounded-xl border border-gray-200/90 bg-white shadow-sm shadow-gray-900/[0.03] transition-shadow hover:shadow-md hover:shadow-gray-900/[0.04]'

  const currencyGym = useMemo(() => {
    if (gyms.length === 0) return undefined
    return gyms.find((g) => g.id === activeGymId) ?? gyms[0]
  }, [gyms, activeGymId])

  const bookingCurrency = resolveOwnerCurrency(currencyGym, profile)

  /** Rebuild overview window labels when the local calendar day changes (not only on refetch). */
  const [overviewDateKey, setOverviewDateKey] = useState(() => toLocalDayKey(new Date()))
  useEffect(() => {
    const sync = () => {
      const next = toLocalDayKey(new Date())
      setOverviewDateKey((k) => (k === next ? k : next))
    }
    const id = setInterval(sync, 60_000)
    const onVis = () => {
      if (document.visibilityState === 'visible') sync()
    }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [])

  const overviewCards = useMemo(
    () => buildOverviewCards(dashboardBookings, new Date()),
    [dashboardBookings, overviewDateKey]
  )

  const overviewCardsDisplay = useMemo((): OverviewCardModel[] => {
    return overviewCards.map((card) => {
      if (card.valueType !== 'money') return card
      return {
        ...card,
        currentTotal: convertPrice(card.currentTotal, bookingCurrency),
        previousTotal: convertPrice(card.previousTotal, bookingCurrency),
        dailyCurrent: card.dailyCurrent.map((v) => convertPrice(v, bookingCurrency)),
        dailyPrevious: card.dailyPrevious.map((v) => convertPrice(v, bookingCurrency)),
      }
    })
  }, [overviewCards, bookingCurrency, selectedCurrency, convertPrice])

  const dashWeekRevenue = (amount: number) =>
    formatDashboardMoney(convertPrice(amount, bookingCurrency), selectedCurrency, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="mx-auto max-w-6xl space-y-8 px-4 py-3 sm:px-6 sm:py-8">
          <div className={`${dashCard} overflow-hidden`}>
            <div className="h-12 animate-pulse border-b border-gray-200/60 bg-white" />
            <div className="space-y-6 p-5 sm:p-6">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                  <div className="h-3 w-24 animate-pulse rounded bg-gray-100" />
                  <div className="h-8 w-28 animate-pulse rounded bg-gray-100" />
                  <div className="h-3 w-12 animate-pulse rounded bg-gray-100" />
                </div>
                <div className="space-y-2 sm:text-right">
                  <div className="ml-auto h-3 w-20 animate-pulse rounded bg-gray-100 sm:mr-0" />
                  <div className="ml-auto h-8 w-28 animate-pulse rounded bg-gray-100 sm:ml-auto sm:mr-0" />
                </div>
              </div>
              <div className="h-24 animate-pulse rounded-md bg-gray-100/80" />
            </div>
          </div>
          <div>
            <div className="mb-4 h-6 w-40 animate-pulse rounded bg-gray-200/80" />
            <div className={`${dashCard} h-40 animate-pulse bg-gray-50`} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
        <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6 sm:py-8">
          {gyms.length === 0 ? (
            <Card className={`${dashCard} border-0 shadow-md`}>
              <CardHeader>
                <CardTitle>No gym profiles</CardTitle>
                <CardDescription>
                  Create your first gym profile to start receiving bookings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href={buildOnboardingWizardUrl('step-1', null)}>
                  <Button className="bg-[#003580] text-white hover:bg-[#002a66]">Create gym profile</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-8 sm:space-y-16">
            <DashboardTodaySection
              metricsCurrency={bookingCurrency}
              metrics={stats.todayMetrics}
              comparisonDayKey={comparisonDayKey}
              maxComparisonDayKey={maxComparisonDayKey}
              onComparisonDayChange={setComparisonDayKey}
              secondaryStats={[
                {
                  label: "Today's bookings",
                  value: String(stats.todayBookings),
                  href: '/manage/bookings',
                  actionLabel: 'View',
                },
                {
                  label: 'This week revenue',
                  value: dashWeekRevenue(stats.weekRevenue),
                  href: '/manage/balances',
                  actionLabel: 'View',
                },
              ]}
            />

            <section aria-labelledby="dash-overview-heading" className="space-y-5">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 id="dash-overview-heading" className="text-lg font-semibold text-gray-900 sm:text-xl">
                    Your overview
                  </h2>
                  <p className="mt-1 text-xs font-normal text-gray-500">
                    Last 7 days (local time), compared to the previous 7 days · from booking activity
                  </p>
                </div>
              </div>

              <div className="rounded-md border border-gray-100 bg-gray-50 p-1 sm:p-1.5">
                <DashboardOverviewMetricGrid
                  cards={overviewCardsDisplay}
                  currency={selectedCurrency}
                  updatedAt={bookingsFetchedAt}
                />
              </div>
            </section>
            </div>
          )}
        </div>

        <div className="hidden md:block">
          <DashboardSetupGuide
            requiredReadiness={requiredReadiness}
            optionalReadiness={optionalReadiness}
            readinessGymId={readinessGymId}
            canGoLive={canGoLive}
          />
        </div>
    </div>
  )
}
