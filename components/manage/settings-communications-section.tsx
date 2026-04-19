'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useSettingsToast } from '@/components/manage/settings-toast'
import { settingsCardClass } from '@/components/manage/settings-shared'
import {
  DEFAULT_OWNER_NOTIFICATION_PREFS,
  type OwnerNotificationPrefs,
} from '@/lib/manage/owner-notification-prefs'
import { BadgeInfo } from 'lucide-react'

type EmailPrefKey = keyof OwnerNotificationPrefs

const EMAIL_TOGGLES: {
  key: EmailPrefKey
  title: string
  description: string
  group: 'ops' | 'marketing'
}[] = [
  {
    key: 'email_bookings',
    title: 'New booking alerts',
    description: 'Email me when a fighter books a training camp or requests to book.',
    group: 'ops',
  },
  {
    key: 'email_cancellations',
    title: 'Cancellations & modifications',
    description: 'Instant alerts when an itinerary changes or a booking is cancelled.',
    group: 'ops',
  },
  {
    key: 'email_payouts',
    title: 'Payout & Stripe status',
    description: 'Transfers, paused payouts, KYC requirements.',
    group: 'ops',
  },
  {
    key: 'email_security',
    title: 'Security alerts',
    description: 'Password changes, new sign-ins, account recovery activity.',
    group: 'ops',
  },
  {
    key: 'email_marketing',
    title: 'Platform updates & tips',
    description: 'CombatBooking product releases, best-practice guides, promotional emails.',
    group: 'marketing',
  },
]

function prefsEqual(a: OwnerNotificationPrefs, b: OwnerNotificationPrefs) {
  return (
    a.email_bookings === b.email_bookings &&
    a.email_cancellations === b.email_cancellations &&
    a.email_payouts === b.email_payouts &&
    a.email_security === b.email_security &&
    a.email_marketing === b.email_marketing
  )
}

function ToggleRow({
  title,
  description,
  checked,
  onChange,
  disabled,
  id,
}: {
  title: string
  description: string
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
  id: string
}) {
  return (
    <label
      htmlFor={id}
      className={`flex items-start justify-between gap-4 rounded-lg border border-gray-200 bg-white p-4 transition ${
        disabled ? 'opacity-60' : 'cursor-pointer hover:border-gray-300 hover:bg-slate-50/60'
      }`}
    >
      <div className="min-w-0">
        <div className="text-sm font-medium text-gray-900">{title}</div>
        <p className="mt-1 text-xs text-gray-500">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        id={id}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition ${
          checked ? 'bg-[#003580]' : 'bg-gray-300'
        } ${disabled ? 'cursor-not-allowed' : ''}`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${
            checked ? 'translate-x-4' : 'translate-x-0.5'
          }`}
        />
      </button>
    </label>
  )
}

export function SettingsCommunicationsSection() {
  const { showToast, setDirty } = useSettingsToast()
  const [prefs, setPrefs] = useState<OwnerNotificationPrefs>(DEFAULT_OWNER_NOTIFICATION_PREFS)
  const [initial, setInitial] = useState<OwnerNotificationPrefs>(DEFAULT_OWNER_NOTIFICATION_PREFS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/manage/settings/notifications', { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Could not load preferences')
        return
      }
      if (data.prefs) {
        setPrefs(data.prefs as OwnerNotificationPrefs)
        setInitial(data.prefs as OwnerNotificationPrefs)
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not load preferences')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const dirty = useMemo(() => !prefsEqual(prefs, initial), [prefs, initial])

  useEffect(() => {
    setDirty('communications', dirty)
    return () => setDirty('communications', false)
  }, [dirty, setDirty])

  const toggle = (key: EmailPrefKey, value: boolean) => {
    setPrefs((prev) => ({ ...prev, [key]: value }))
  }

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/manage/settings/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prefs),
      })
      const data = await res.json()
      if (!res.ok) {
        showToast(data.error || 'Could not save preferences', 'error')
        return
      }
      if (data.prefs) {
        setPrefs(data.prefs)
        setInitial(data.prefs)
      } else {
        setInitial({ ...prefs })
      }
      showToast('Communication preferences saved.')
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Could not save preferences', 'error')
    } finally {
      setSaving(false)
    }
  }

  const opsToggles = EMAIL_TOGGLES.filter((t) => t.group === 'ops')
  const marketingToggles = EMAIL_TOGGLES.filter((t) => t.group === 'marketing')

  return (
    <div className="space-y-6">
      <Card className={settingsCardClass}>
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold text-gray-900">Booking &amp; payout emails</CardTitle>
          <CardDescription className="text-sm text-gray-500">
            Operational emails that keep your camps running. We strongly recommend keeping these on.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {loading ? (
            <p className="text-sm text-gray-500">Loading…</p>
          ) : (
            opsToggles.map((item) => (
              <ToggleRow
                key={item.key}
                id={`pref-${item.key}`}
                title={item.title}
                description={item.description}
                checked={prefs[item.key]}
                onChange={(value) => toggle(item.key, value)}
              />
            ))
          )}
        </CardContent>
      </Card>

      <Card className={settingsCardClass}>
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold text-gray-900">Platform updates &amp; marketing</CardTitle>
          <CardDescription className="text-sm text-gray-500">
            Feature launches, educational content, and offers from CombatBooking. You can opt out at any time.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? null : (
            marketingToggles.map((item) => (
              <ToggleRow
                key={item.key}
                id={`pref-${item.key}`}
                title={item.title}
                description={item.description}
                checked={prefs[item.key]}
                onChange={(value) => toggle(item.key, value)}
              />
            ))
          )}
        </CardContent>
      </Card>

      <Card className={settingsCardClass}>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-gray-900">
            SMS alerts
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-slate-600">
              Coming soon
            </span>
          </CardTitle>
          <CardDescription className="text-sm text-gray-500">
            We&apos;re rolling out SMS alerts for new bookings and itinerary changes. Add a verified mobile under{' '}
            <Label className="inline">Personal details</Label> to be first in line.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-3 rounded-lg border border-dashed border-gray-200 bg-slate-50/70 p-4 text-xs text-gray-600">
            <BadgeInfo className="mt-0.5 h-4 w-4 text-slate-500" strokeWidth={1.75} aria-hidden />
            <p>
              SMS will reuse your account holder phone number and respect your ops-email preferences. We&apos;ll notify
              you here once it&apos;s available in your region.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
        {dirty ? (
          <span className="text-xs text-amber-700">You have unsaved changes.</span>
        ) : null}
        <Button
          variant="outline"
          onClick={() => setPrefs(initial)}
          disabled={!dirty || saving}
          className="border-gray-300"
        >
          Discard
        </Button>
        <Button onClick={() => void save()} disabled={!dirty || saving}>
          {saving ? 'Saving…' : 'Save preferences'}
        </Button>
      </div>
    </div>
  )
}
