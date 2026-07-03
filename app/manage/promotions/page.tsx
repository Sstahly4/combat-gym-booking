'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useActiveGym } from '@/components/manage/active-gym-context'
import { GymEditLayout } from '@/components/manage/gym-edit-layout'
import { GymEditPanel, GymEditSection, listingSectionClass } from '@/components/manage/gym-edit-section'
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
  X,
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
  const { activeGymId, loading: gymLoading } = useActiveGym()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<PromotionsResponse | null>(null)
  const [showHint, setShowHint] = useState(true)
  const [activeTab, setActiveTab] = useState<'all' | StatusKey>('all')
  const [addSignal, setAddSignal] = useState(0)

  useEffect(() => {
    if (addSignal > 0) openNewFromTemplate()
  }, [addSignal])

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
    <GymEditLayout
      gymId={activeGymId ?? ''}
      activeSection="promotions"
      title="Promotions"
      subtitle="Deals that show on your listing and apply automatically at checkout — no codes required."
      sections={{}}
      saving={false}
      hideSaveBar
      contentWidth="full"
      headerActions={
        <button
          type="button"
          onClick={() => setAddSignal((n) => n + 1)}
          className={cn(
            'inline-flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-900 shadow-sm transition-colors hover:bg-gray-50',
          )}
          aria-label="New promotion"
        >
          <Plus className="h-5 w-5" aria-hidden />
        </button>
      }
    >
      <div className="space-y-6">

        {showHint ? (
          <div className="flex items-start justify-between gap-3 rounded-2xl border border-gray-200/80 bg-white px-4 py-3 shadow-sm shadow-gray-900/[0.03] ring-1 ring-black/[0.04]">
            <div className="flex items-start gap-2 text-xs text-gray-700">
              <Sparkles className="h-4 w-4 shrink-0 text-gray-500" strokeWidth={1.75} aria-hidden />
              <p>
                Start from a proven template below, or build your own. Active promotions apply to matching
                bookings automatically — no codes required.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/owners/help/promotions"
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

        <GymEditPanel>
          <GymEditSection title="Quick-start templates" description="Pre-filled deals you can edit and publish in seconds.">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {TEMPLATE_PRESETS.map((t) => (
                <button
                  key={t.kind}
                  type="button"
                  onClick={() => openNewFromTemplate(t)}
                  className={cn(listingSectionClass, 'group text-left transition-shadow hover:shadow-md')}
                >
                  <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">{kindLabel(t.kind)}</p>
                  <p className="mt-1 text-base font-semibold text-gray-900">{t.title}</p>
                  <p className="mt-1 text-sm text-gray-500">{t.description}</p>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 font-medium text-emerald-800">
                      {t.discount_percent}% off
                    </span>
                    {t.min_nights ? (
                      <span className="rounded-full bg-gray-100 px-2.5 py-0.5 font-medium text-gray-700">
                        Min {t.min_nights} nights
                      </span>
                    ) : null}
                  </div>
                </button>
              ))}
            </div>
          </GymEditSection>

          <GymEditSection
            title="Your promotions"
            description={`${counts.all} total${counts.active > 0 ? ` · ${counts.active} live` : ''}`}
            headerAction={
              <Link
                href={
                  activeGymId
                    ? `/manage/gym/edit?id=${encodeURIComponent(activeGymId)}&section=packages`
                    : '/manage/gym/edit?section=packages'
                }
                className="text-sm font-medium text-[#003580] hover:underline"
              >
                Edit packages
              </Link>
            }
          >
            <div className="flex flex-wrap gap-2 border-b border-gray-100 pb-4">
              {tabs.map((tab) => {
                const active = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors',
                      active ? 'bg-[#003580]/10 font-medium text-[#003580]' : 'text-gray-600 hover:bg-gray-100',
                    )}
                  >
                    {tab.label}
                    <span className="text-xs tabular-nums opacity-70">{tab.count}</span>
                  </button>
                )
              })}
            </div>

            {gymLoading || loading ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-40 animate-pulse rounded-2xl bg-gray-100" />
                ))}
              </div>
            ) : !activeGymId ? (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 px-6 py-12 text-center text-sm text-gray-600">
                Select a gym to manage promotions.
              </div>
            ) : promos.length === 0 ? (
              <button
                type="button"
                onClick={() => openNewFromTemplate(TEMPLATE_PRESETS[0])}
                className="flex min-h-[14rem] w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50 px-6 text-center hover:border-gray-300 hover:bg-gray-50"
              >
                <Sparkles className="h-8 w-8 text-gray-300" aria-hidden />
                <div>
                  <p className="text-base font-semibold text-gray-900">Create your first promotion</p>
                  <p className="mt-1 text-sm text-gray-500">Start with an Early bird deal to fill future weeks.</p>
                </div>
              </button>
            ) : visiblePromos.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 px-6 py-12 text-center text-sm text-gray-600">
                No promotions in this group.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {visiblePromos.map((p) => {
                  const s = statusFor(p, today)
                  return (
                    <article key={p.id} className={cn(listingSectionClass, 'flex flex-col')}>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset', badgeTone[s.tone])}>
                          {s.label}
                        </span>
                        <span className="text-xs font-medium uppercase tracking-wide text-gray-400">{kindLabel(p.kind)}</span>
                      </div>
                      <h3 className="mt-3 text-base font-semibold text-gray-900">{p.title}</h3>
                      {p.description ? <p className="mt-1 line-clamp-2 text-sm text-gray-500">{p.description}</p> : null}
                      <p className="mt-3 text-sm font-medium text-[#003580]">{p.discount_percent}% off</p>
                      <p className="mt-1 text-xs text-gray-500">
                        {formatDateLabel(p.starts_at)} → {formatDateLabel(p.ends_at)}
                        {p.min_nights ? ` · Min ${p.min_nights} nights` : ''}
                      </p>
                      <div className="mt-4 flex gap-2 border-t border-gray-100 pt-4">
                        <button
                          type="button"
                          onClick={() => openEdit(p)}
                          disabled={saving}
                          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
                        >
                          <Pencil className="h-3.5 w-3.5" aria-hidden />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => void remove(p)}
                          disabled={saving}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-red-600 hover:border-red-200 hover:bg-red-50 disabled:opacity-50"
                          aria-label={`Delete ${p.title}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden />
                        </button>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </GymEditSection>
        </GymEditPanel>
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
    </GymEditLayout>
  )
}
