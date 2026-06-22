'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { Package, PackageSeasonalRate, PackageVariant } from '@/lib/types/database'
import {
  buildSeasonalRateInsertRows,
  findOverlappingSeasonalRate,
  formatSeasonalDateWindow,
  formatSeasonalOverrides,
  hasAtLeastOneSeasonalTier,
  isoTodayLocal,
  type LocalSeasonalRate,
} from '@/lib/packages/seasonal-rate-validation'
import { CalendarRange, Loader2, Pencil, Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type FormState = {
  name: string
  variant_id: string
  start_date: string
  end_date: string
  price_per_day: string
  price_per_week: string
  price_per_month: string
}

const EMPTY_FORM: FormState = {
  name: '',
  variant_id: '',
  start_date: '',
  end_date: '',
  price_per_day: '',
  price_per_week: '',
  price_per_month: '',
}

export type SeasonalVariantOption = {
  id: string
  label: string
  price_per_day?: number | null
  price_per_week?: number | null
  price_per_month?: number | null
}

export type SeasonalPricingPackageRef = Pick<
  Package,
  'id' | 'offer_type' | 'price_per_day' | 'price_per_week' | 'price_per_month'
>

type SeasonalRateRow = PackageSeasonalRate | LocalSeasonalRate

function variantLabel(v: PackageVariant): string {
  return v.name?.trim() || (v.room_type ? `${v.room_type} room` : 'Variant')
}

function newLocalRateId(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `draft-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function baseTierReference(
  pkg: SeasonalPricingPackageRef,
  variant: {
    price_per_day?: number | null
    price_per_week?: number | null
    price_per_month?: number | null
  } | null,
  currency: string,
): { daily: string; weekly: string; monthly: string } {
  const daily = variant?.price_per_day ?? pkg.price_per_day
  const weekly = variant?.price_per_week ?? pkg.price_per_week
  const monthly = variant?.price_per_month ?? pkg.price_per_month
  const fmt = (n: number | null | undefined, suffix: string) =>
    n != null && Number(n) > 0 ? `${currency} ${Number(n).toLocaleString()} ${suffix}` : '—'

  return {
    daily: fmt(daily, '/ day'),
    weekly: fmt(weekly, '/ week'),
    monthly: fmt(monthly, '/ month'),
  }
}

export function PackageSeasonalPricingPanel({
  package: pkg,
  currency,
  variants = [],
  variantOptions = [],
  localRates,
  onLocalRatesChange,
}: {
  package: SeasonalPricingPackageRef
  currency: string
  variants?: PackageVariant[]
  variantOptions?: SeasonalVariantOption[]
  /** When provided, rates are held in memory until the parent saves the new package. */
  localRates?: LocalSeasonalRate[]
  onLocalRatesChange?: (rates: LocalSeasonalRate[]) => void
}) {
  const isLocalMode = onLocalRatesChange != null
  const [dbRates, setDbRates] = useState<PackageSeasonalRate[]>([])
  const [loading, setLoading] = useState(!isLocalMode)
  const [saving, setSaving] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<SeasonalRateRow | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [formError, setFormError] = useState<string | null>(null)

  const todayMin = isoTodayLocal()
  const isEvent = pkg.offer_type === 'TYPE_ONE_TIME_EVENT'
  const isDropIn = pkg.offer_type === 'TYPE_DROP_IN'

  const scopeOptions = useMemo((): SeasonalVariantOption[] => {
    if (variantOptions.length > 0) return variantOptions
    return variants.map((v) => ({
      id: v.id,
      label: variantLabel(v),
      price_per_day: v.price_per_day,
      price_per_week: v.price_per_week,
      price_per_month: v.price_per_month,
    }))
  }, [variantOptions, variants])

  const rates: SeasonalRateRow[] = isLocalMode ? (localRates ?? []) : dbRates

  const loadRates = useCallback(async () => {
    if (isLocalMode || !pkg.id) {
      setLoading(false)
      return
    }
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('package_seasonal_rates')
      .select('*')
      .eq('package_id', pkg.id)
      .order('start_date', { ascending: true })

    if (!error && data) setDbRates(data as PackageSeasonalRate[])
    setLoading(false)
  }, [isLocalMode, pkg.id])

  useEffect(() => {
    if (isEvent || isDropIn) {
      setLoading(false)
      return
    }
    if (isLocalMode) {
      setLoading(false)
      return
    }
    void loadRates()
  }, [isEvent, isDropIn, isLocalMode, loadRates])

  const selectedScope = useMemo(() => {
    if (!form.variant_id) return null
    return scopeOptions.find((o) => o.id === form.variant_id) ?? null
  }, [form.variant_id, scopeOptions])

  const baseRef = useMemo(
    () => baseTierReference(pkg, selectedScope, currency),
    [pkg, selectedScope, currency],
  )

  const appliedToLabel = (rule: SeasonalRateRow) => {
    if (!rule.variant_id) return 'All variants'
    const scoped = scopeOptions.find((o) => o.id === rule.variant_id)
    if (scoped) return scoped.label
    const v = variants.find((x) => x.id === rule.variant_id)
    return v ? variantLabel(v) : 'Variant'
  }

  const openCreate = (presetName?: string) => {
    setEditing(null)
    setForm(presetName ? { ...EMPTY_FORM, name: presetName } : EMPTY_FORM)
    setFormError(null)
    setFormOpen(true)
  }

  const openEdit = (rule: SeasonalRateRow) => {
    setEditing(rule)
    setForm({
      name: rule.name,
      variant_id: rule.variant_id ?? '',
      start_date: rule.start_date,
      end_date: rule.end_date,
      price_per_day: rule.price_per_day != null ? String(rule.price_per_day) : '',
      price_per_week: rule.price_per_week != null ? String(rule.price_per_week) : '',
      price_per_month: rule.price_per_month != null ? String(rule.price_per_month) : '',
    })
    setFormError(null)
    setFormOpen(true)
  }

  const closeForm = () => {
    setFormOpen(false)
    setEditing(null)
    setForm(EMPTY_FORM)
    setFormError(null)
  }

  const canSave =
    form.name.trim() !== '' &&
    form.start_date !== '' &&
    form.end_date !== '' &&
    form.end_date >= form.start_date &&
    (editing != null || form.start_date >= todayMin) &&
    hasAtLeastOneSeasonalTier(form)

  const handleSave = async () => {
    if (!canSave) return
    setFormError(null)

    const candidate = {
      variant_id: form.variant_id.trim() === '' ? null : form.variant_id,
      start_date: form.start_date,
      end_date: form.end_date,
    }

    const overlap = findOverlappingSeasonalRate(candidate, rates as PackageSeasonalRate[], editing?.id)
    if (overlap) {
      setFormError(
        'This date range overlaps with an existing seasonal rule for this variant. Please edit your existing rule or choose different dates.',
      )
      return
    }

    const nextRule: LocalSeasonalRate = {
      id: editing?.id ?? newLocalRateId(),
      variant_id: candidate.variant_id,
      name: form.name.trim(),
      start_date: form.start_date,
      end_date: form.end_date,
      price_per_day: form.price_per_day.trim() === '' ? null : Number(form.price_per_day),
      price_per_week: form.price_per_week.trim() === '' ? null : Number(form.price_per_week),
      price_per_month: form.price_per_month.trim() === '' ? null : Number(form.price_per_month),
    }

    if (isLocalMode) {
      if (editing) {
        onLocalRatesChange!(
          (localRates ?? []).map((r) => (r.id === editing.id ? nextRule : r)),
        )
      } else {
        onLocalRatesChange!([...(localRates ?? []), nextRule])
      }
      closeForm()
      return
    }

    const payload = {
      package_id: pkg.id,
      variant_id: candidate.variant_id,
      name: nextRule.name,
      start_date: nextRule.start_date,
      end_date: nextRule.end_date,
      price_per_day: nextRule.price_per_day,
      price_per_week: nextRule.price_per_week,
      price_per_month: nextRule.price_per_month,
    }

    setSaving(true)
    const supabase = createClient()

    if (editing) {
      const { error } = await supabase
        .from('package_seasonal_rates')
        .update(payload)
        .eq('id', editing.id)
      if (error) {
        setFormError(error.message || 'Failed to update seasonal rate')
        setSaving(false)
        return
      }
    } else {
      const { error } = await supabase.from('package_seasonal_rates').insert(payload)
      if (error) {
        setFormError(error.message || 'Failed to create seasonal rate')
        setSaving(false)
        return
      }
    }

    await loadRates()
    setSaving(false)
    closeForm()
  }

  const handleDelete = async (rule: SeasonalRateRow) => {
    if (!confirm(`Delete "${rule.name}"? This cannot be undone.`)) return

    if (isLocalMode) {
      onLocalRatesChange!((localRates ?? []).filter((r) => r.id !== rule.id))
      return
    }

    setSaving(true)
    const supabase = createClient()
    await supabase.from('package_seasonal_rates').delete().eq('id', rule.id)
    await loadRates()
    setSaving(false)
  }

  if (isEvent || isDropIn) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/80 px-6 py-10 text-center">
        <p className="text-sm text-gray-600">
          {isDropIn
            ? 'Drop-in sessions use a flat visit price. Seasonal rates apply to multi-day training and stay packages.'
            : 'Seasonal rates apply to multi-day training and stay packages. One-time event tickets use fixed tier pricing instead.'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-gray-900">High &amp; low season pricing</h3>
          <p className="mt-1 max-w-xl text-sm text-gray-500">
            Set higher rates for peak months and lower rates for off-season. These overrides apply to
            the whole package or individual room options — checkout blends them across the guest&apos;s
            stay automatically.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            className="border-gray-200 bg-white"
            onClick={() => openCreate('High season')}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            High season
          </Button>
          <Button
            type="button"
            variant="outline"
            className="border-gray-200 bg-white"
            onClick={() => openCreate('Low season')}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Low season
          </Button>
          <Button
            type="button"
            onClick={() => openCreate()}
            className="bg-[#003580] text-white hover:bg-[#002a66]"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Custom season
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : rates.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white px-6 py-12 text-center shadow-sm">
          <CalendarRange className="mx-auto mb-3 h-8 w-8 text-gray-300" strokeWidth={1.5} />
          <p className="text-sm text-gray-600">
            No seasonal rates yet. Add high season and low season windows so guests see the right
            price for their travel dates.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Button
              type="button"
              variant="outline"
              className="border-[#003580] text-[#003580] hover:bg-[#003580]/5"
              onClick={() => openCreate('High season')}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              High season
            </Button>
            <Button
              type="button"
              variant="outline"
              className="border-[#003580] text-[#003580] hover:bg-[#003580]/5"
              onClick={() => openCreate('Low season')}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Low season
            </Button>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/80 text-xs font-medium uppercase tracking-wide text-gray-500">
                  <th className="px-4 py-3">Rule name</th>
                  <th className="px-4 py-3">Date window</th>
                  <th className="px-4 py-3">Applied to</th>
                  <th className="px-4 py-3">Overrides</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rates.map((rule) => (
                  <tr key={rule.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3.5 font-medium text-gray-900">{rule.name}</td>
                    <td className="px-4 py-3.5 text-gray-600">
                      {formatSeasonalDateWindow(rule.start_date, rule.end_date)}
                    </td>
                    <td className="px-4 py-3.5 text-gray-600">{appliedToLabel(rule)}</td>
                    <td className="px-4 py-3.5 text-gray-700">
                      {formatSeasonalOverrides(rule, currency)}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 px-2.5"
                          onClick={() => openEdit(rule)}
                          disabled={saving}
                        >
                          <Pencil className="mr-1 h-3.5 w-3.5" />
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 px-2.5 text-red-600 hover:border-red-200 hover:bg-red-50"
                          onClick={() => void handleDelete(rule)}
                          disabled={saving}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="divide-y divide-gray-100 md:hidden">
            {rates.map((rule) => (
              <div key={rule.id} className="space-y-2 px-4 py-4">
                <p className="font-semibold text-gray-900">{rule.name}</p>
                <p className="text-xs text-gray-500">
                  {formatSeasonalDateWindow(rule.start_date, rule.end_date)} · {appliedToLabel(rule)}
                </p>
                <p className="text-sm text-gray-700">{formatSeasonalOverrides(rule, currency)}</p>
                <div className="flex gap-2 pt-1">
                  <Button type="button" variant="outline" size="sm" onClick={() => openEdit(rule)}>
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-red-600"
                    onClick={() => void handleDelete(rule)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={(open) => !open && closeForm()} stackClassName="z-[140]">
        <DialogContent className="flex max-h-[min(90dvh,720px)] w-[calc(100vw-1.5rem)] max-w-lg flex-col overflow-hidden rounded-xl border border-gray-200/90 p-0 shadow-md">
          <DialogHeader className="shrink-0 space-y-1.5 border-b border-gray-100 px-5 py-4 text-left md:px-6">
            <DialogTitle className="text-lg font-semibold tracking-tight text-gray-900">
              {editing ? 'Edit seasonal rate' : 'Add seasonal rate'}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Set a friendly label and the date window when these tiers apply.
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 md:px-6">
            {formError ? (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800">
                {formError}
              </div>
            ) : null}

            <div className="space-y-5">
              <div>
                <Label htmlFor="season-name">Rule label</Label>
                <Input
                  id="season-name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g., High season or Low season"
                  className="mt-1.5"
                />
              </div>

              {scopeOptions.length > 0 ? (
                <div>
                  <Label htmlFor="season-variant">Variant scope</Label>
                  <Select
                    id="season-variant"
                    value={form.variant_id}
                    onChange={(e) => setForm((f) => ({ ...f, variant_id: e.target.value }))}
                    className="mt-1.5"
                  >
                    <option value="">Apply to entire package (all variants)</option>
                    {scopeOptions.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.label}
                      </option>
                    ))}
                  </Select>
                  <p className="mt-1.5 text-xs text-gray-500">
                    Variant-specific rules take priority over package-wide rules on checkout.
                  </p>
                </div>
              ) : null}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="season-start">Start date</Label>
                  <Input
                    id="season-start"
                    type="date"
                    min={editing ? undefined : todayMin}
                    value={form.start_date}
                    onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="season-end">End date</Label>
                  <Input
                    id="season-end"
                    type="date"
                    min={form.start_date || todayMin}
                    value={form.end_date}
                    onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
                    className="mt-1.5"
                  />
                </div>
              </div>

              <div className="space-y-3 rounded-xl border border-gray-200 bg-gray-50/60 p-4">
                <p className="text-sm font-medium text-gray-900">Rate overrides</p>
                <p className="text-xs text-gray-500">
                  Fill only the tiers you want to change. Leave others blank to keep the base default for
                  that tier.
                </p>

                <div>
                  <Label htmlFor="season-daily">New daily rate</Label>
                  <p className="text-[11px] text-gray-500">Base daily default: {baseRef.daily}</p>
                  <Input
                    id="season-daily"
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.price_per_day}
                    onChange={(e) => setForm((f) => ({ ...f, price_per_day: e.target.value }))}
                    className="mt-1"
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <Label htmlFor="season-weekly">New weekly rate</Label>
                  <p className="text-[11px] text-gray-500">Base weekly default: {baseRef.weekly}</p>
                  <Input
                    id="season-weekly"
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.price_per_week}
                    onChange={(e) => setForm((f) => ({ ...f, price_per_week: e.target.value }))}
                    className="mt-1"
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <Label htmlFor="season-monthly">New monthly rate</Label>
                  <p className="text-[11px] text-gray-500">Base monthly default: {baseRef.monthly}</p>
                  <Input
                    id="season-monthly"
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.price_per_month}
                    onChange={(e) => setForm((f) => ({ ...f, price_per_month: e.target.value }))}
                    className="mt-1"
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={closeForm}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  className={cn('flex-1 bg-[#003580] text-white hover:bg-[#002a66]', !canSave && 'opacity-50')}
                  disabled={!canSave || saving}
                  onClick={() => void handleSave()}
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
