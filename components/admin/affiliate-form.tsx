'use client'

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { CopyReferralLink } from '@/components/admin/copy-referral-link'
import { AffiliateIntakeLinkButton } from '@/components/admin/affiliate-intake-link-button'
import {
  affiliateCodeValidationError,
  normalizeAffiliateCode,
} from '@/lib/affiliates/code'
import type { AffiliateStatus, AffiliateTier } from '@/lib/types/database'

export type AffiliateFormValues = {
  name: string
  email: string
  code: string
  tier: AffiliateTier
  payout_method: 'bank' | 'paypal'
  payout_details: string
  notes: string
  status: AffiliateStatus
}

const emptyForm: AffiliateFormValues = {
  name: '',
  email: '',
  code: '',
  tier: 'founding',
  payout_method: 'bank',
  payout_details: '',
  notes: '',
  status: 'active',
}

function appOrigin(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  return 'https://www.combatstay.com'
}

type Props = {
  mode: 'create' | 'edit'
  initial?: Partial<AffiliateFormValues>
  affiliateId?: string
  savedReferralUrl?: string | null
  savedIntakeUrl?: string | null
  onSaved?: (payload: { referral_url: string; intake_url?: string | null }) => void
}

export function AffiliateForm({
  mode,
  initial,
  affiliateId,
  savedReferralUrl,
  savedIntakeUrl,
  onSaved,
}: Props) {
  const [form, setForm] = useState<AffiliateFormValues>({ ...emptyForm, ...initial })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [codeAvailable, setCodeAvailable] = useState<boolean | null>(null)
  const [checkingCode, setCheckingCode] = useState(false)
  const [referralUrl, setReferralUrl] = useState<string | null>(savedReferralUrl || null)
  const [intakeUrl, setIntakeUrl] = useState<string | null>(savedIntakeUrl || null)

  useEffect(() => {
    if (initial) setForm((f) => ({ ...f, ...initial }))
  }, [initial])

  const codePreview = useMemo(() => {
    const code = normalizeAffiliateCode(form.code)
    if (!code) return null
    return `${appOrigin()}/ref/${code}`
  }, [form.code])

  const checkCode = useCallback(async () => {
    const code = normalizeAffiliateCode(form.code)
    const validationError = affiliateCodeValidationError(code)
    if (validationError) {
      setCodeAvailable(false)
      return
    }
    setCheckingCode(true)
    try {
      const params = new URLSearchParams({ code })
      if (affiliateId) params.set('exclude_id', affiliateId)
      const res = await fetch(`/api/admin/affiliates/check-code?${params}`)
      const data = await res.json()
      setCodeAvailable(Boolean(data.available))
    } catch {
      setCodeAvailable(null)
    } finally {
      setCheckingCode(false)
    }
  }, [form.code, affiliateId])

  useEffect(() => {
    if (mode === 'edit') return
    const t = setTimeout(checkCode, 400)
    return () => clearTimeout(t)
  }, [checkCode, mode])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const url =
        mode === 'create'
          ? '/api/admin/affiliates'
          : `/api/admin/affiliates/${affiliateId}`
      const res = await fetch(url, {
        method: mode === 'create' ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Save failed')

      const link = data.affiliate?.referral_url as string
      const intake = (data.intake_link?.url as string) || null
      setReferralUrl(link)
      setIntakeUrl(intake)
      onSaved?.({ referral_url: link, intake_url: intake })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      )}

      {intakeUrl && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm font-medium text-blue-900">Payout setup link</p>
          <p className="mt-1 text-xs text-blue-800">
            Send this private link so the affiliate can enter their own BSB/account or PayPal email.
            It expires in 14 days and works once.
          </p>
          <div className="mt-3">
            <CopyReferralLink url={intakeUrl} label="Copy setup link" />
          </div>
        </div>
      )}

      {referralUrl && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm font-medium text-emerald-900">Referral link ready</p>
          <p className="mt-1 text-xs text-emerald-800">
            Copy this and send it to the affiliate. The code is permanent once shared publicly.
          </p>
          <div className="mt-3">
            <CopyReferralLink url={referralUrl} />
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Full name</Label>
          <Input
            id="name"
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />
        </div>
      </div>

      {mode === 'create' ? (
        <div className="space-y-2">
          <Label htmlFor="code">Referral code</Label>
          <Input
            id="code"
            placeholder="e.g. marklee, fightclub, elitefc"
            value={form.code}
            onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toLowerCase() }))}
          />
          <p className="text-xs text-stone-500">
            Lowercase letters and numbers only, max 20 characters. Cannot be changed after creation.
          </p>
          {form.code && (
            <div className="text-xs text-stone-600">
              {affiliateCodeValidationError(form.code) ? (
                <span className="text-red-600">{affiliateCodeValidationError(form.code)}</span>
              ) : checkingCode ? (
                <span>Checking availability…</span>
              ) : codeAvailable === true ? (
                <span className="text-emerald-700">Available — preview: {codePreview}</span>
              ) : codeAvailable === false ? (
                <span className="text-red-600">This code is already taken</span>
              ) : null}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-1">
          <Label>Referral code</Label>
          <p className="font-mono text-sm text-stone-800">{form.code}</p>
          <p className="text-xs text-stone-500">Permanent — cannot be changed once shared.</p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Commission tier</Label>
          <Select
            value={form.tier}
            onChange={(e) => setForm((f) => ({ ...f, tier: e.target.value as AffiliateTier }))}
          >
            <option value="founding">Founding partner — 40% of CombatStay commission</option>
            <option value="standard">Standard — 30% of CombatStay commission</option>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as AffiliateStatus }))}
          >
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="inactive">Inactive</option>
          </Select>
        </div>
      </div>

      {mode === 'edit' ? (
        <div className="rounded-lg border border-stone-200 bg-stone-50 p-4 space-y-4">
          <p className="text-sm text-stone-700">
            Payout details are collected via a secure one-time link — avoid taking BSB or PayPal
            details over WhatsApp or email. Generate a new link if the affiliate needs to update
            their details.
          </p>
          {affiliateId && (
            <AffiliateIntakeLinkButton
              affiliateId={affiliateId}
              affiliateName={form.name || 'Affiliate'}
            />
          )}
          <details className="text-sm">
            <summary className="cursor-pointer text-stone-600">Admin override (manual entry)</summary>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Payout method</Label>
                <Select
                  value={form.payout_method}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, payout_method: e.target.value as 'bank' | 'paypal' }))
                  }
                >
                  <option value="bank">Bank transfer</option>
                  <option value="paypal">PayPal</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="payout_details">
                  {form.payout_method === 'paypal' ? 'PayPal email' : 'BSB / account details'}
                </Label>
                <Input
                  id="payout_details"
                  value={form.payout_details}
                  onChange={(e) => setForm((f) => ({ ...f, payout_details: e.target.value }))}
                />
              </div>
            </div>
          </details>
        </div>
      ) : (
        <div className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-600">
          After you create this affiliate, a secure payout setup link is generated automatically.
          Send it privately so they can enter their own bank or PayPal details — no need to collect
          that over WhatsApp.
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="notes">Internal notes</Label>
        <Textarea
          id="notes"
          rows={3}
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          placeholder="Optional admin-only notes"
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={saving || (mode === 'create' && codeAvailable === false)}>
          {saving ? 'Saving…' : mode === 'create' ? 'Create affiliate' : 'Save changes'}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href={affiliateId ? `/admin/affiliates/${affiliateId}` : '/admin/affiliates'}>
            Cancel
          </Link>
        </Button>
      </div>
    </form>
  )
}

export { emptyForm as emptyAffiliateForm }
