'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ManageBreadcrumbs } from '@/components/manage/manage-breadcrumbs'
import { useActiveGym } from '@/components/manage/active-gym-context'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import type { GymPromotion, GymPromotionKind } from '@/lib/types/database'
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Sparkles,
  Megaphone,
  Info,
  X,
  CalendarRange,
  TrendingUp,
  Lightbulb,
} from 'lucide-react'

const BRAND = '#003580'

type PromotionsResponse = {
  gym: { id: string; currency: string }
  promotions: GymPromotion[]
}

type StatusKey = 'active' | 'scheduled' | 'paused' | 'ended'

function kindLabel(kind: GymPromotionKind): string {
  if (kind === 'early_bird') return 'Early bird'
  if (kind === 'last_minute') return 'Last-minute'
  if (kind === 'long_stay') return 'Long stay'
  return 'Custom'
}

function isoToday(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function statusFor(p: GymPromotion, todayIso: string): { key: StatusKey; tone: 'green' | 'gray' | 'amber'; label: string } {
  if (!p.is_active) return { key: 'paused', tone: 'gray', label: 'Paused' }
  if (p.ends_at && p.ends_at < todayIso) return { key: 'ended', tone: 'gray', label: 'Ended' }
  if (p.starts_at && p.starts_at > todayIso) return { key: 'scheduled', tone: 'amber', label: 'Scheduled' }
  return { key: 'active', tone: 'green', label: 'Active' }
}

const badgeTone: Record<string, string> = {
  green: 'bg-emerald-50 text-emerald-800 ring-emerald-200/70',
  amber: 'bg-amber-50 text-amber-800 ring-amber-200/70',
  gray: 'bg-gray-100 text-gray-700 ring-gray-200/70',
}

const TEMPLATE_PRESETS: Array<{
  kind: GymPromotionKind
  title: string
  description: string
  discount_percent: number
  min_nights: number | null
}> = [
  {
    kind: 'early_bird',
    title: 'Early bird deal',
    description: 'Reward guests who book ahead. Great for filling future weeks.',
    discount_percent: 10,
    min_nights: 7,
  },
  {
    kind: 'last_minute',
    title: 'Last-minute deal',
    description: 'Boost bookings for near-term dates. Perfect for quiet weeks.',
    discount_percent: 12,
    min_nights: 1,
  },
  {
    kind: 'long_stay',
    title: 'Long stay deal',
    description: 'Encourage longer camps with a stronger discount.',
    discount_percent: 15,
    min_nights: 14,
  },
]

function formatDateLabel(iso: string | null): string {
  if (!iso) return 'Any'
  try {
    return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
  } catch {
    return iso
  }
}

export default function ManagePromotionsPage() {
  const { activeGymId, gyms, loading: gymLoading } = useActiveGym()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<PromotionsResponse | null>(null)
  const [showHint, setShowHint] = useState(true)
  const [activeTab, setActiveTab] = useState<'all' | StatusKey>('all')

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<GymPromotion | null>(null)
  const [draft, setDraft] = useState<{
    kind: GymPromotionKind
    title: string
    description: string
    discount_percent: string
    starts_at: string
    ends_at: string
    min_nights: string
    is_active: boolean
  } | null>(null)

  const today = useMemo(() => isoToday(), [])

  async function load() {
    if (!activeGymId) return
    setLoading(true)
    setError(null)
    try {
      const qs = new URLSearchParams({ gym_id: activeGymId })
      const res = await fetch(`/api/manage/promotions?${qs.toString()}`, { cache: 'no-store' })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Failed to load promotions')
      setData(json as PromotionsResponse)
    } catch (e: any) {
      setError(e?.message || 'Failed to load promotions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!activeGymId) return
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeGymId])

  const gymName = useMemo(() => {
    if (!activeGymId) return null
    return gyms.find((g) => g.id === activeGymId)?.name ?? null
  }, [activeGymId, gyms])

  const promos = data?.promotions ?? []

  const counts = useMemo(() => {
    const c = { all: promos.length, active: 0, scheduled: 0, paused: 0, ended: 0 }
    for (const p of promos) {
      const s = statusFor(p, today)
      c[s.key] += 1
    }
    return c
  }, [promos, today])

  const visiblePromos = useMemo(() => {
    if (activeTab === 'all') return promos
    return promos.filter((p) => statusFor(p, today).key === activeTab)
  }, [promos, activeTab, today])

  const liveDiscountAvg = useMemo(() => {
    const live = promos.filter((p) => statusFor(p, today).key === 'active')
    if (live.length === 0) return 0
    return Math.round(live.reduce((s, p) => s + (Number(p.discount_percent) || 0), 0) / live.length)
  }, [promos, today])

  function openNewFromTemplate(t?: (typeof TEMPLATE_PRESETS)[number]) {
    setEditing(null)
    setDraft({
      kind: t?.kind ?? 'custom',
      title: t?.title ?? '',
      description: t?.description ?? '',
      discount_percent: String(t?.discount_percent ?? 10),
      starts_at: today,
      ends_at: '',
      min_nights: t?.min_nights == null ? '' : String(t.min_nights),
      is_active: true,
    })
    setOpen(true)
  }

  function openEdit(p: GymPromotion) {
    setEditing(p)
    setDraft({
      kind: p.kind,
      title: p.title,
      description: p.description ?? '',
      discount_percent: String(p.discount_percent),
      starts_at: p.starts_at ?? '',
      ends_at: p.ends_at ?? '',
      min_nights: p.min_nights == null ? '' : String(p.min_nights),
      is_active: p.is_active,
    })
    setOpen(true)
  }

  async function save() {
    if (!activeGymId || !draft) return
    setSaving(true)
    setError(null)
    try {
      const discount = Number(draft.discount_percent)
      const minN = draft.min_nights.trim() === '' ? null : Number(draft.min_nights)
      const body = {
        id: editing?.id,
        gym_id: activeGymId,
        kind: draft.kind,
        title: draft.title.trim(),
        description: draft.description.trim() === '' ? null : draft.description.trim(),
        discount_percent: discount,
        starts_at: draft.starts_at.trim() === '' ? null : draft.starts_at.trim(),
        ends_at: draft.ends_at.trim() === '' ? null : draft.ends_at.trim(),
        min_nights: minN,
        is_active: draft.is_active,
      }
      const method = editing ? 'PUT' : 'POST'
      const res = await fetch('/api/manage/promotions', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Failed to save promotion')
      setOpen(false)
      setEditing(null)
      setDraft(null)
      await load()
    } catch (e: any) {
      setError(e?.message || 'Failed to save promotion')
    } finally {
      setSaving(false)
    }
  }

  async function remove(p: GymPromotion) {
    if (!activeGymId) return
    if (!confirm('Delete this promotion?')) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/manage/promotions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: p.id, gym_id: activeGymId }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Failed to delete')
      await load()
    } catch (e: any) {
      setError(e?.message || 'Failed to delete promotion')
    } finally {
      setSaving(false)
    }
  }

  const tabs: Array<{ id: 'all' | StatusKey; label: string; count: number }> = [
    { id: 'all', label: 'All', count: counts.all },
    { id: 'active', label: 'Active', count: counts.active },
    { id: 'scheduled', label: 'Scheduled', count: counts.scheduled },
    { id: 'paused', label: 'Paused', count: counts.paused },
    { id: 'ended', label: 'Ended', count: counts.ended },
  ]

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-3 sm:px-6 sm:py-8">
        <ManageBreadcrumbs items={[{ label: 'Dashboard', href: '/manage' }, { label: 'Promotions' }]} />

        <header className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight text-gray-900 sm:text-2xl">
                Promotions{' '}
                <span className="font-light tabular-nums text-gray-900">{counts.all}</span>
              </h1>
              {counts.active > 0 ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#003580]/10 px-2 py-0.5 text-[11px] font-medium text-[#003580] ring-1 ring-inset ring-[#003580]/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#003580]" aria-hidden />
                  {counts.active} live
                </span>
              ) : null}
              <span
                className="group relative inline-flex"
                tabIndex={0}
                role="button"
                aria-label="About promotions"
              >
                <Info className="h-3.5 w-3.5 text-gray-400" strokeWidth={1.75} aria-hidden />
                <span
                  role="tooltip"
                  className="pointer-events-none invisible absolute left-1/2 top-[calc(100%+8px)] z-30 w-[min(20rem,calc(100vw-2.5rem))] -translate-x-1/2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-left text-[11px] font-normal leading-snug text-gray-700 shadow-md opacity-0 transition-opacity duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100"
                >
                  Promotions show as discount badges on your public listing and apply automatically at checkout
                  when a guest meets the criteria.
                </span>
              </span>
            </div>
            <p className="max-w-2xl text-sm font-normal text-gray-500">
              Create deals that fill quiet weeks, reward early bookers, or boost long stays.
              {gymName ? <span className="text-gray-400"> · {gymName}</span> : null}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              onClick={() => openNewFromTemplate()}
              className="h-8 bg-[#003580] px-3 text-xs font-medium text-white hover:bg-[#002a66]"
            >
              <Plus className="mr-1 h-3.5 w-3.5" aria-hidden />
              New promotion
            </Button>
            <Link
              href="/manage/gym/edit"
              className="inline-flex h-8 items-center justify-center rounded-md border border-gray-200 bg-white px-3 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              Edit packages &amp; pricing
            </Link>
          </div>
        </header>

        {showHint ? (
          <div className="flex items-start justify-between gap-3 rounded-md border border-gray-200/80 bg-gray-50 px-4 py-3">
            <div className="flex items-start gap-2 text-xs text-gray-700">
              <Sparkles className="h-4 w-4 shrink-0 text-gray-500" strokeWidth={1.75} aria-hidden />
              <p>
                Start from a proven template below, or build your own. Active promotions apply to matching
                bookings automatically — no codes required.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/help/promotions"
                className="text-xs font-medium hover:underline underline-offset-2"
                style={{ color: BRAND }}
              >
                Learn more
              </Link>
              <button
                type="button"
                aria-label="Dismiss"
                className="rounded p-0.5 text-gray-400 hover:text-gray-600"
                onClick={() => setShowHint(false)}
              >
                <X className="h-3.5 w-3.5" aria-hidden />
              </button>
            </div>
          </div>
        ) : null}

        {error ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        ) : null}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_280px]">
          <div className="space-y-8">
            <section>
              <h2 className="text-sm font-semibold text-gray-900">Templates</h2>
              <p className="mt-1 text-xs text-gray-500">Pre-filled deals you can edit and publish in seconds.</p>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                {TEMPLATE_PRESETS.map((t) => (
                  <button
                    key={t.kind}
                    type="button"
                    onClick={() => openNewFromTemplate(t)}
                    className="group rounded-lg border border-gray-200 bg-white p-4 text-left transition hover:border-[#003580]/40 hover:bg-[#003580]/[0.02]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
                          {kindLabel(t.kind)}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-gray-900">{t.title}</p>
                        <p className="mt-1 text-xs text-gray-500">{t.description}</p>
                      </div>
                      <span
                        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#003580]/10 text-[#003580] transition group-hover:bg-[#003580]/15"
                        aria-hidden
                      >
                        <Sparkles className="h-4 w-4" />
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-emerald-800 ring-1 ring-inset ring-emerald-200/70">
                        {t.discount_percent}% off
                      </span>
                      {t.min_nights ? (
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 font-medium text-gray-700 ring-1 ring-inset ring-gray-200/70">
                          Min {t.min_nights} nights
                        </span>
                      ) : null}
                    </div>
                  </button>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-sm font-semibold text-gray-900">Your promotions</h2>
              <p className="mt-1 text-xs text-gray-500">
                Discounts can be scheduled, paused, and reused for seasonal campaigns.
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-1 border-b border-gray-200">
                {tabs.map((tab) => {
                  const active = activeTab === tab.id
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        '-mb-px inline-flex items-center gap-1.5 border-b-2 pb-2 text-sm transition-colors',
                        active
                          ? 'border-[#003580] font-medium text-[#003580]'
                          : 'border-transparent text-gray-500 hover:text-gray-800'
                      )}
                    >
                      <span>{tab.label}</span>
                      <span
                        className={cn(
                          'rounded-full px-1.5 py-0.5 text-[10px] font-medium tabular-nums ring-1 ring-inset',
                          active
                            ? 'bg-[#003580]/10 text-[#003580] ring-[#003580]/20'
                            : 'bg-gray-100 text-gray-600 ring-gray-200/80'
                        )}
                      >
                        {tab.count}
                      </span>
                    </button>
                  )
                })}
              </div>

              {gymLoading || loading ? (
                <div className="flex items-center justify-center gap-2 py-12 text-sm text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Loading promotions…
                </div>
              ) : !activeGymId ? (
                <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50/40 px-6 py-12 text-center text-sm text-gray-600">
                  Select a gym to manage promotions.
                </div>
              ) : promos.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50/40 px-6 py-14 text-center">
                  <p className="text-sm font-medium text-gray-900">No promotions yet</p>
                  <p className="mt-1 text-xs font-normal text-gray-500">
                    Start with an Early bird deal to fill future weeks.
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => openNewFromTemplate(TEMPLATE_PRESETS[0])}
                    className="mt-4 h-8 bg-[#003580] px-3 text-xs font-medium text-white hover:bg-[#002a66]"
                  >
                    <Plus className="mr-1 h-3.5 w-3.5" aria-hidden />
                    Create your first promotion
                  </Button>
                </div>
              ) : visiblePromos.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50/40 px-6 py-12 text-center text-sm text-gray-600">
                  No promotions in this group.
                </div>
              ) : (
                <div className="mt-2">
                  <div className="grid grid-cols-[1fr_120px_180px_120px] gap-4 border-b border-gray-100 py-3 text-[11px] font-medium uppercase tracking-wide text-gray-400">
                    <span>Promotion</span>
                    <span>Discount</span>
                    <span>Window</span>
                    <span className="text-right">Actions</span>
                  </div>

                  <div className="divide-y divide-gray-100">
                    {visiblePromos.map((p) => {
                      const s = statusFor(p, today)
                      return (
                        <div
                          key={p.id}
                          className="grid grid-cols-[1fr_120px_180px_120px] items-start gap-4 py-4 text-sm"
                        >
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={cn(
                                  'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset',
                                  badgeTone[s.tone]
                                )}
                              >
                                {s.label}
                              </span>
                              <span className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
                                {kindLabel(p.kind)}
                              </span>
                              <span className="font-medium text-gray-900">{p.title}</span>
                            </div>
                            {p.description ? (
                              <p className="mt-1 line-clamp-2 text-xs text-gray-500">{p.description}</p>
                            ) : null}
                            {p.min_nights ? (
                              <p className="mt-1 text-[11px] text-gray-500">Min {p.min_nights} nights</p>
                            ) : null}
                          </div>
                          <div className="font-light tabular-nums text-gray-900">
                            {p.discount_percent}% off
                          </div>
                          <div className="text-xs text-gray-700">
                            <span className="tabular-nums">{formatDateLabel(p.starts_at)}</span>
                            <span className="mx-1 text-gray-400">→</span>
                            <span className="tabular-nums">{formatDateLabel(p.ends_at)}</span>
                          </div>
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => openEdit(p)}
                              disabled={saving}
                              className="inline-flex h-7 items-center gap-1 rounded-md border border-gray-200 bg-white px-2 text-[11px] font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                            >
                              <Pencil className="h-3 w-3" aria-hidden />
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => remove(p)}
                              disabled={saving}
                              className="inline-flex h-7 items-center gap-1 rounded-md border border-gray-200 bg-white px-2 text-[11px] font-medium text-red-600 hover:bg-red-50 hover:border-red-200 disabled:opacity-50"
                            >
                              <Trash2 className="h-3 w-3" aria-hidden />
                              Delete
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </section>
          </div>

          <aside className="space-y-6">
            <section>
              <h2 className="text-sm font-semibold text-gray-900">At a glance</h2>
              <ul className="mt-3 space-y-3">
                <li className="flex items-start gap-3">
                  <span
                    className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#003580]/10 ring-1 ring-[#003580]/15"
                    aria-hidden
                  >
                    <TrendingUp className="h-4 w-4 text-[#003580]" strokeWidth={1.75} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm text-gray-900">
                      {liveDiscountAvg > 0 ? `${liveDiscountAvg}% avg` : '—'}
                    </p>
                    <p className="text-xs text-gray-500">Live discount average</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span
                    className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-gray-50 ring-1 ring-gray-200/80"
                    aria-hidden
                  >
                    <CalendarRange className="h-4 w-4 text-gray-500" strokeWidth={1.75} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm text-gray-900">{counts.scheduled}</p>
                    <p className="text-xs text-gray-500">Scheduled to start</p>
                  </div>
                </li>
              </ul>

              <div className="mt-6 border-t border-gray-100 pt-4">
                <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">Status</p>
                <ul className="mt-2 space-y-1 text-xs text-gray-600">
                  <li>Active: {counts.active}</li>
                  <li>Paused: {counts.paused}</li>
                  <li>Ended: {counts.ended}</li>
                </ul>
              </div>
            </section>

            <section>
              <div className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-[#003580]" strokeWidth={1.75} aria-hidden />
                <h2 className="text-sm font-semibold text-gray-900">Playbook</h2>
              </div>
              <ul className="mt-3 space-y-2 text-xs text-gray-600">
                <li>
                  <span className="font-medium text-gray-900">Fill the future:</span> schedule an Early bird 30–90 days
                  out.
                </li>
                <li>
                  <span className="font-medium text-gray-900">Fix quiet weeks:</span> run a Last-minute deal for the
                  next 14 days.
                </li>
                <li>
                  <span className="font-medium text-gray-900">Increase length of stay:</span> add a Long stay deal with
                  a stronger discount.
                </li>
              </ul>
              <div className="mt-4">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-1.5 text-xs font-medium hover:underline underline-offset-2"
                  style={{ color: BRAND }}
                >
                  <Megaphone className="h-3.5 w-3.5" aria-hidden />
                  Request a featured campaign
                </Link>
              </div>
            </section>
          </aside>
        </div>
      </div>

      <Dialog open={open} onOpenChange={(o) => !saving && setOpen(o)}>
        <DialogContent className="w-[min(560px,calc(100vw-2rem))] p-0">
          <DialogHeader className="border-b border-gray-100 p-5">
            <DialogTitle className="text-base font-semibold text-gray-900">
              {editing ? 'Edit promotion' : 'New promotion'}
            </DialogTitle>
            <p className="mt-1 text-xs text-gray-500">
              Create a deal guests can understand instantly. Keep titles short and specific.
            </p>
          </DialogHeader>

          <div className="space-y-4 p-5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label className="text-xs font-medium text-gray-600">Type</Label>
                <select
                  className="mt-1 h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-900 shadow-sm"
                  value={draft?.kind ?? 'custom'}
                  onChange={(e) =>
                    setDraft((d) => (d ? { ...d, kind: e.target.value as GymPromotionKind } : d))
                  }
                >
                  <option value="early_bird">Early bird</option>
                  <option value="last_minute">Last-minute</option>
                  <option value="long_stay">Long stay</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              <div>
                <Label className="text-xs font-medium text-gray-600">Discount (%)</Label>
                <Input
                  type="number"
                  min={0}
                  max={90}
                  inputMode="numeric"
                  value={draft?.discount_percent ?? ''}
                  onChange={(e) => setDraft((d) => (d ? { ...d, discount_percent: e.target.value } : d))}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-medium text-gray-600">Title</Label>
              <Input
                value={draft?.title ?? ''}
                onChange={(e) => setDraft((d) => (d ? { ...d, title: e.target.value } : d))}
                placeholder="e.g. Early bird: 10% off 7+ nights"
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-xs font-medium text-gray-600">Description (optional)</Label>
              <Textarea
                value={draft?.description ?? ''}
                onChange={(e) => setDraft((d) => (d ? { ...d, description: e.target.value } : d))}
                placeholder="Explain who it’s for and what’s included."
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <Label className="text-xs font-medium text-gray-600">Start date</Label>
                <Input
                  type="date"
                  value={draft?.starts_at ?? ''}
                  onChange={(e) => setDraft((d) => (d ? { ...d, starts_at: e.target.value } : d))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs font-medium text-gray-600">End date</Label>
                <Input
                  type="date"
                  value={draft?.ends_at ?? ''}
                  onChange={(e) => setDraft((d) => (d ? { ...d, ends_at: e.target.value } : d))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs font-medium text-gray-600">Min nights</Label>
                <Input
                  type="number"
                  min={1}
                  max={365}
                  inputMode="numeric"
                  value={draft?.min_nights ?? ''}
                  onChange={(e) => setDraft((d) => (d ? { ...d, min_nights: e.target.value } : d))}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50/60 px-3 py-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white text-gray-700 ring-1 ring-gray-200">
                  <Sparkles className="h-4 w-4" aria-hidden />
                </span>
                <div>
                  <p className="text-sm font-medium text-gray-900">Promotion is active</p>
                  <p className="text-xs text-gray-500">Pause without deleting to reuse later.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDraft((d) => (d ? { ...d, is_active: !d.is_active } : d))}
                className={cn(
                  'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors',
                  draft?.is_active ? 'bg-[#003580]' : 'bg-gray-300'
                )}
                aria-pressed={draft?.is_active ?? true}
                aria-label="Toggle promotion active"
              >
                <span
                  className={cn(
                    'inline-block h-5 w-5 transform rounded-full bg-white shadow transition',
                    draft?.is_active ? 'translate-x-5' : 'translate-x-0.5'
                  )}
                />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-gray-100 p-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={save}
              disabled={saving || !draft || draft.title.trim().length < 2}
              className="bg-[#003580] text-white hover:bg-[#002a66]"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" aria-hidden />
                  Saving
                </>
              ) : (
                'Save promotion'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
