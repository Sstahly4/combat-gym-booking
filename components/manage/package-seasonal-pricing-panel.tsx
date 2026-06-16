'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { SlideOver } from '@/components/ui/slide-over'
import type { Package, PackageSeasonalRate, PackageVariant } from '@/lib/types/database'
import {
  findOverlappingSeasonalRate,
  formatSeasonalDateWindow,
  formatSeasonalOverrides,
  hasAtLeastOneSeasonalTier,
  isoTodayLocal,
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

function variantLabel(v: PackageVariant): string {
  return v.name?.trim() || (v.room_type ? `${v.room_type} room` : 'Variant')
}

function baseTierReference(
  pkg: Package,
  variant: PackageVariant | null,
  currency: string
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
}: {
  package: Package
  currency: string
  variants?: PackageVariant[]
}) {
  const [rates, setRates] = useState<PackageSeasonalRate[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<PackageSeasonalRate | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [formError, setFormError] = useState<string | null>(null)

  const todayMin = isoTodayLocal()
  const isEvent = pkg.offer_type === 'TYPE_ONE_TIME_EVENT'

  const loadRates = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('package_seasonal_rates')
      .select('*')
      .eq('package_id', pkg.id)
      .order('start_date', { ascending: true })

    if (!error && data) setRates(data as PackageSeasonalRate[])
    setLoading(false)
  }, [pkg.id])

  useEffect(() => {
    if (!isEvent) void loadRates()
    else setLoading(false)
  }, [isEvent, loadRates])

  const selectedVariant = useMemo(() => {
    if (!form.variant_id) return null
    return variants.find((v) => v.id === form.variant_id) ?? null
  }, [form.variant_id, variants])

  const baseRef = useMemo(
    () => baseTierReference(pkg, selectedVariant, currency),
    [pkg, selectedVariant, currency]
  )

  const appliedToLabel = (rule: PackageSeasonalRate) => {
    if (!rule.variant_id) return 'All variants'
    const v = variants.find((x) => x.id === rule.variant_id)
    return v ? variantLabel(v) : 'Variant'
  }

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setFormError(null)
    setSheetOpen(true)
  }

  const openEdit = (rule: PackageSeasonalRate) => {
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
    setSheetOpen(true)
  }

  const closeSheet = () => {
    setSheetOpen(false)
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

    const overlap = findOverlappingSeasonalRate(candidate, rates, editing?.id)
    if (overlap) {
      setFormError(
        'This date range overlaps with an existing seasonal rule for this variant. Please edit your existing rule or choose different dates.'
      )
      return
    }

    const payload = {
      package_id: pkg.id,
      variant_id: candidate.variant_id,
      name: form.name.trim(),
      start_date: form.start_date,
      end_date: form.end_date,
      price_per_day: form.price_per_day.trim() === '' ? null : Number(form.price_per_day),
      price_per_week: form.price_per_week.trim() === '' ? null : Number(form.price_per_week),
      price_per_month: form.price_per_month.trim() === '' ? null : Number(form.price_per_month),
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
    closeSheet()
  }

  const handleDelete = async (rule: PackageSeasonalRate) => {
    if (!confirm(`Delete "${rule.name}"? This cannot be undone.`)) return
    setSaving(true)
    const supabase = createClient()
    await supabase.from('package_seasonal_rates').delete().eq('id', rule.id)
    await loadRates()
    setSaving(false)
  }

  if (isEvent) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/80 px-6 py-10 text-center">
        <p className="text-sm text-gray-600">
          Seasonal rates apply to multi-day training and stay packages. One-time event tickets use
          fixed tier pricing instead.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-gray-900">Seasonal pricing</h3>
          <p className="mt-1 max-w-xl text-sm text-gray-500">
            Override daily, weekly, or monthly tiers for specific date windows. Checkout blends these
            rates across the guest&apos;s stay automatically.
          </p>
        </div>
        <Button
          type="button"
          onClick={openCreate}
          className="bg-[#003580] text-white hover:bg-[#002a66]"
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Add custom seasonal rate
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : rates.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white px-6 py-12 text-center shadow-sm">
          <CalendarRange className="mx-auto mb-3 h-8 w-8 text-gray-300" strokeWidth={1.5} />
          <p className="text-sm text-gray-600">
            No seasonal rates active. Your package will always charge its default base rate unless you
            add a custom date rule.
          </p>
          <Button
            type="button"
            variant="outline"
            className="mt-5 border-[#003580] text-[#003580] hover:bg-[#003580]/5"
            onClick={openCreate}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Add custom seasonal rate
          </Button>
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

          {/* Mobile cards */}
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

      <SlideOver
        open={sheetOpen}
        onClose={closeSheet}
        title={editing ? 'Edit seasonal rate' : 'Add seasonal rate'}
        description="Set a friendly label and the date window when these tiers apply."
      >
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
              placeholder="e.g., High Season Peak"
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="season-variant">Variant scope</Label>
            <Select
              id="season-variant"
              value={form.variant_id}
              onChange={(e) => setForm((f) => ({ ...f, variant_id: e.target.value }))}
              className="mt-1.5"
            >
              <option value="">Apply to entire package (all variants)</option>
              {variants.map((v) => (
                <option key={v.id} value={v.id}>
                  {variantLabel(v)}
                </option>
              ))}
            </Select>
            <p className="mt-1.5 text-xs text-gray-500">
              Variant-specific rules take priority over package-wide rules on checkout.
            </p>
          </div>

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
            <Button type="button" variant="outline" className="flex-1" onClick={closeSheet}>
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
      </SlideOver>
    </div>
  )
}
